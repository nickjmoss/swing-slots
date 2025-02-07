import { DraftClub, DraftCourse, TeeTime, TeeTimeParams } from '../../types';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import dayjs from '../../utils/dayjs';

declare module 'axios' {
    interface AxiosRequestConfig {
        jar?: CookieJar;
    }
}

const jar = new CookieJar();

const client = wrapper(
    axios.create({
        withCredentials: true,
        jar,
    }),
);

class ForeUp {
    apiClient: AxiosInstance;

    constructor() {
        this.apiClient = client;
    }

    async getTeeTimes({
        courses,
        startDate,
        holes,
        players = 0,
    }: TeeTimeParams) {
        const date = dayjs(startDate || new Date());

        const teeTimePromises = courses.map(async (course) => {
            const queryStringParams = new URLSearchParams({
                time: 'all',
                date: date.format('MM-DD-YYYY'),
                holes: holes ? String(holes) : 'all',
                players: players ? String(players) : '0',
                specials_only: '0',
                api_key: 'no_limits',
                schedule_id: course.courseId,
                booking_class: course.bookingClassIds.join(','),
            });

            const jar = new CookieJar();

            const client = wrapper(
                axios.create({
                    withCredentials: true,
                    jar,
                }),
            );

            await client.get(course.bookingUrl);

            return client
                .get(
                    `https://foreupsoftware.com/index.php/api/booking/times?${queryStringParams}`,
                )
                .then((response) => {
                    return {
                        data: response.data,
                        course,
                    };
                });
        });

        const nestedTeeTimes = await Promise.all(teeTimePromises);

        const teeTimes: TeeTime[] = nestedTeeTimes.reduce(
            (acc, { data, course }) => {
                if (!data || !data.length) {
                    return acc;
                }

                data.forEach((teeTime: any) => {
                    const actualTeeTime = {
                        bookingUrl: course.bookingUrl,
                        cartFee: teeTime.cart_fee,
                        courseName: teeTime.course_name,
                        facilityName: course.club.name,
                        teeTime: dayjs
                            .tz(teeTime.time, 'America/Denver')
                            .format(),
                        greenFee: teeTime.green_fee,
                        holes: String(teeTime.holes).split('/').map(Number),
                        players: teeTime.available_spots,
                    };

                    acc.push(actualTeeTime);
                });

                return acc;
            },
            [] as any[],
        );

        return teeTimes;
    }

    updateMasterList(masterList: DraftClub[], club: DraftClub) {
        const index = club.index;
        delete club.index;
        if (index) {
            masterList[index] = club;
        }
    }

    async getClubsAndCourses(masterList: DraftClub[]) {
        const foreupClubs: any[] = [];

        for (let i = 0; i < masterList.length; i++) {
            console.log(
                `Checking ${i + 1} of ${
                    masterList.length
                } clubs to see if they use ForeUp`,
            );
            const facility = masterList[i];
            if (facility.software) {
                continue;
            }

            if (facility.website) {
                if (!facility.website.includes('http')) {
                    facility.website = `http://${facility.website}`;
                }
                try {
                    const { data: page } = await client.get(facility.website, {
                        responseType: 'text',
                    });

                    const $ = cheerio.load(page);
                    const foreupRegex = new RegExp(
                        'https?://[^/]*foreupsoftware[^"\'s]+',
                        'g',
                    );

                    $('a').each((j, elem) => {
                        const href = $(elem).attr('href');
                        if (href && foreupRegex.test(href)) {
                            foreupClubs.push({
                                name: facility.name,
                                slug: facility.slug,
                                software: 'foreUp',
                                bookingUrl: href.split('#')[0],
                                website: facility.website,
                                locationData: facility.locationData,
                                index: i,
                            });

                            return false;
                        }
                    });
                } catch (e) {
                    console.log(`${facility.name}'s website does not work`);
                    facility.websiteBroken = true;
                }
            }
        }

        console.log(`${foreupClubs.length} clubs use ForeUp`);

        for (let i = 0; i < foreupClubs.length; i++) {
            const club: DraftClub = foreupClubs[i];
            console.log(
                `Getting courses for ${club.name} (${i + 1}/${
                    foreupClubs.length
                }) via ForeUp`,
            );

            let scriptContent: string = '';
            try {
                if (!club.bookingUrl) {
                    throw new Error(
                        `Could not find booking URL for ${club.name}`,
                    );
                }

                const { data: bookingPage } = await client.get(
                    club.bookingUrl,
                    { responseType: 'text' },
                );
                const $ = cheerio.load(bookingPage);

                // Get first script within head tag
                $('head script:not([src])').each((i, elem) => {
                    const scriptText = $(elem).html();
                    if (scriptText && scriptText.includes('SCHEDULES')) {
                        scriptContent = scriptText;
                        return false;
                    }
                });

                if (!scriptContent) {
                    throw new Error(
                        `Could not find script content on ForeUp for ${club.name}`,
                    );
                }

                const extractedText =
                    scriptContent.match(
                        /SCHEDULES\s*=\s*(\[\{.*?\}\]);/s,
                    )?.[1] || null;

                const clubId =
                    scriptContent.match(/COURSE_ID\s*=\s*(\d+);/)?.[1] || null;

                const defaults =
                    scriptContent.match(
                        /DEFAULT_FILTER\s*=\s*(\{.*?\});/,
                    )?.[1] || null;

                if (!extractedText || !clubId || !defaults) {
                    throw new Error(
                        `Could not find courses on ForeUp for ${club.name}. They may not be using ForeUp anymore.`,
                    );
                }

                const defaultsObj = JSON.parse(defaults);
                const { schedule_id } = defaultsObj;

                const schedules = JSON.parse(extractedText);

                const schedule = schedules.find(
                    (schedule: any) =>
                        schedule.teesheet_id === String(schedule_id),
                );

                const courses: DraftCourse[] = [
                    {
                        name: schedule.course_name,
                        bookingUrl: club.bookingUrl,
                        courseId: String(schedule.teesheet_id),
                        clubId,
                    },
                ];

                delete club.bookingUrl;

                club.courses = courses;
                club.clubId = clubId;

                this.updateMasterList(masterList, club);
            } catch (e: any) {
                console.log(e.message);
            }
        }
    }
}

export const foreUp = new ForeUp();
