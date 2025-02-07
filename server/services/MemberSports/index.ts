// @ts-ignore - no types for axios-cookiejar-support
import { wrapper } from 'axios-cookiejar-support';
import axios, { AxiosInstance } from 'axios';
import { CookieJar } from 'tough-cookie';
import { DraftClub, DraftCourse, TeeTime, TeeTimeParams } from '../../types';
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
        headers: {
            accept: 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'content-type': 'application/json; charset=utf-8',
            pragma: 'no-cache',
            priority: 'u=1, i',
            'sec-ch-ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'x-api-key': 'A9814038-9E19-4683-B171-5A06B39147FC',
            Referer: 'https://app.membersports.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
    }),
);

class MemberSports {
    apiClient: AxiosInstance;
    token: string | null;

    constructor() {
        this.apiClient = client;
        this.token = null;
    }

    async login() {
        try {
            console.log(
                'Logging into MemberSports',
                process.env.MEMBER_SPORTS_EMAIL,
                process.env.MEMBER_SPORTS_PASSWORD,
            );
            const loginBody = {
                userName: process.env.MEMBER_SPORTS_EMAIL,
                email: process.env.MEMBER_SPORTS_EMAIL,
                password: process.env.MEMBER_SPORTS_PASSWORD,
                rememberMe: false,
                golfClubId: 0,
            };

            const { data } = await this.apiClient.post(
                'https://api.membersports.com/api/v1/ApplicationUser/login',
                loginBody,
            );

            const { token } = data;

            this.token = token;
        } catch (error) {
            console.error('Failed to login to MemberSports');
            throw error;
        }
    }

    timeFromMinutes(minutes: number) {
        const hours24 = Math.floor(minutes / 60);
        const minutesRemaining = minutes % 60;

        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12; // Convert to 12-hour format

        const formattedHours = hours12.toString().padStart(2, '0');
        const formattedMinutes = minutesRemaining.toString().padStart(2, '0');

        return `${formattedHours}:${formattedMinutes} ${period}`;
    }

    async getTeeTimes({ courses, startDate, holes, players }: TeeTimeParams) {
        const date = dayjs(startDate || new Date());

        const teeTimePromises = courses.map((course) => {
            const body = {
                date: date.format('YYYY-MM-DD'),
                golfClubId: course.clubId,
                golfCourseId: course.courseId,
            };

            return this.apiClient
                .post(
                    `https://api.membersports.com/api/v1/golfclubs/onlineBookingTeeTimes`,
                    body,
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
                if (data.length) {
                    const teeTimes = data.filter(
                        (time: any) => time.items.length > 0,
                    );
                    teeTimes.forEach((time: any) => {
                        time.items.forEach((item: any) => {
                            if (item.bookingNotAllowed) {
                                return;
                            }

                            acc.push({
                                courseName: item.name,
                                greenFee: item.price,
                                teeTime: dayjs
                                    .tz(
                                        `${date.format('YYYY-MM-DD')} ${this.timeFromMinutes(item.teeTime)}`,
                                        'America/Denver',
                                    )
                                    .format(),
                                players: 4 - Number(item.playerCount),
                                holes:
                                    item.holesRequirementTypeId === '1'
                                        ? [9]
                                        : [9, 18],
                                bookingUrl: course.bookingUrl,
                                cartFee: 0,
                                facilityName: course.club.name,
                            });
                        });
                    });
                }
                return acc;
            },
            [] as any[],
        );

        const filter: {
            players?: number;
            holes?: number;
        } = {};

        if (players) {
            filter.players = players;
        }

        if (holes) {
            filter.holes = holes;
        }

        // Filter out tee times that don't match the whole filter
        const filteredTeeTimes = teeTimes.filter((time) => {
            if (filter.players && time.players !== filter.players) {
                return false;
            }

            if (filter.holes && !time.holes.includes(filter.holes)) {
                return false;
            }

            return true;
        });

        return filteredTeeTimes;
    }

    updateMasterList(masterList: DraftClub[], club: DraftClub) {
        let masterClub = null;
        masterClub = masterList.find((utahClub) => {
            if (utahClub.slug === club.slug) {
                return true;
            } else if (utahClub.name === club.name) {
                return true;
            }
        });

        if (!masterClub) {
            masterClub = masterList.find((utahClub) => {
                if (
                    utahClub.website &&
                    club.website &&
                    utahClub.website.includes(club.website)
                ) {
                    return true;
                } else if (
                    utahClub.locationData.address === club.locationData.address
                ) {
                    return true;
                } else if (
                    Math.ceil(utahClub.locationData.latitude * 100) / 100 ===
                        Math.ceil(club.locationData.latitude * 100) / 100 &&
                    Math.ceil(utahClub.locationData.longitude * 100) / 100 ===
                        Math.ceil(club.locationData.longitude * 100) / 100 &&
                    utahClub.locationData.postalCode ===
                        club.locationData.postalCode
                ) {
                    return true;
                } else if (
                    Math.ceil(utahClub.locationData.latitude * 10) / 10 ===
                        Math.ceil(club.locationData.latitude * 10) / 10 &&
                    Math.ceil(utahClub.locationData.longitude * 10) / 10 ===
                        Math.ceil(club.locationData.longitude * 10) / 10 &&
                    utahClub.locationData.postalCode ===
                        club.locationData.postalCode
                ) {
                    return true;
                }
            });
        }

        if (masterClub) {
            // update master list with new club data
            masterClub.software = club.software;
            masterClub.courses = club.courses;
            masterClub.locationData = club.locationData;
            masterClub.website = club.website;
            masterClub.clubId = club.clubId;
        } else if (!masterClub && club) {
            // add new club to master list
            masterList.push(club);
        }
    }

    async getClubsAndCourses(masterList: DraftClub[]) {
        await this.login();

        const { data } = await this.apiClient.get(
            'https://api.membersports.com/api/v1/golfClubs',
            {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            },
        );

        const utahClubs = data.filter(
            (club: any) => club.state === 'UT' && club.city !== 'Hometown',
        );

        const formattedClubs: DraftClub[] = [];

        let i = 1;
        for (const club of utahClubs) {
            console.log(`Getting club ${i} of ${utahClubs.length}`);
            const { data: clubData } = await this.apiClient.get(
                `https://api.membersports.com/api/v1/golfClubs/${club.golfClubId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                },
            );

            const { data: clubCourses } = await this.apiClient.get(
                `https://api.membersports.com/api/v1/golfclubs/${club.golfClubId}/coursesslim`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                },
            );

            const courses: DraftCourse[] = [];
            let largestBookingWindow = 0;

            for (const course of clubCourses) {
                const { data: courseDataArray } = await this.apiClient.get(
                    `https://api.membersports.com/api/v1/golfclubs/${club.golfClubId}/golfCourses/${course.golfCourseId}/types/0/teesheetparameters`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`,
                        },
                    },
                );

                const [courseData] = courseDataArray;

                if (
                    Number(courseData.nonClubMemberReserveTimeDays) >
                    largestBookingWindow
                ) {
                    largestBookingWindow = Number(
                        courseData.nonClubMemberReserveTimeDays,
                    );
                }

                courses.push({
                    clubId: String(clubData.golfClubId),
                    courseId: String(course.golfCourseId),
                    name: course.name,
                    bookingUrl: `https://app.membersports.com/tee-times/${clubData.golfClubId}/${course.golfCourseId}/0`,
                });
            }

            if (clubData.hasTeeSheets) {
                formattedClubs.push({
                    name: clubData.name,
                    slug: clubData.name.toLowerCase().replace(/ /g, '-'),
                    locationData: {
                        latitude: Number(clubData.latitude),
                        longitude: Number(clubData.longitude),
                        address: clubData.address1,
                        address2: clubData.address2,
                        city: clubData.city,
                        state: clubData.state,
                        postalCode: String(clubData.postalCode.split('-')[0]),
                        county: '',
                    },
                    clubId: String(clubData.golfClubId),
                    website: clubData.website,
                    software: 'memberSports',
                    bookingWindow: largestBookingWindow,
                    courses,
                });
            }

            i++;
        }

        formattedClubs.forEach((club) => {
            this.updateMasterList(masterList, club);
        });
    }
}

export const memberSports = new MemberSports();
