import { foreUp } from '../services/ForeUp';
import { memberSports } from '../services/MemberSports';
import {
    getUtahClubsWithChrono,
    utahZipsAndCounties,
} from '../services/UtahClubs';
import { FastifyReply, FastifyRequest } from 'fastify';
import prisma from '../prisma';
import fs from 'fs';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as readline from 'readline';

export const refreshClubData = async (
    req: FastifyRequest,
    res: FastifyReply,
) => {
    const masterList = await getUtahClubsWithChrono();
    // 1. API direct access
    // MemberSports
    console.log('Getting MemberSports clubs');
    await memberSports.getClubsAndCourses(masterList);

    // Chrono: Don't need to do Chrono since the master list is from Chrono

    // 2. API indirect access
    // ForeUp
    console.log('Getting ForeUp clubs');
    await foreUp.getClubsAndCourses(masterList);

    // 3. Manual Clubs
    const manualClubs = masterList.filter(
        (club) => !club.software || !club.website,
    );
    const websiteNotWorking = masterList.filter((club) => club.websiteBroken);

    // 4. Set Counties
    masterList.forEach((club) => {
        if (club.websiteBroken) {
            delete club.websiteBroken;
        }

        if (club.locationData) {
            club.locationData.county =
                utahZipsAndCounties[club.locationData.postalCode];
        }
    });

    // 5. Save to DB
    for (const club of masterList) {
        await prisma.club.upsert({
            where: { slug: club.slug, clubId: club.clubId },
            update: {
                name: club.name,
                software: club.software,
                website: club.website,
                clubId: club.clubId,
                slug: club.slug,
                bookingWindow: club?.bookingWindow,
                locationData: {
                    upsert: {
                        where: { clubId: club.clubId },
                        update: club.locationData,
                        create: club.locationData,
                    },
                },
                courses: {
                    upsert: club.courses.map((course) => ({
                        where: { courseId: course.courseId },
                        update: course,
                        create: course,
                    })),
                },
            },
            create: {
                name: club.name,
                software: club.software as string,
                website: club.website as string,
                clubId: club.clubId,
                slug: club.slug,
                bookingWindow: club?.bookingWindow,
                locationData: {
                    create: club.locationData,
                },
                courses: {
                    create: club.courses,
                },
            },
        });
    }

    fs.writeFileSync(
        'masterList.json',
        JSON.stringify(masterList, null, 4),
        'utf8',
    );

    res.status(200).send({
        manualClubs,
        websiteNotWorking,
        masterList,
        message:
            'Please run the fixForeUpBookingClasses route to add booking classes and windows to ForeUp clubs',
    });
};

export const fixForeUpBookingClasses = async (
    req: FastifyRequest,
    res: FastifyReply,
) => {
    const foreUpCourses = await prisma.course.findMany({
        where: {
            club: {
                software: 'foreUp',
            },
        },
    });

    const options: {
        id: string;
        name: string;
        clubId: string;
        options: { id: string; name: string; bookingWindow: number }[];
    }[] = [];

    for (const course of foreUpCourses) {
        const { data: bookingPage } = await axios.get(course.bookingUrl, {
            responseType: 'text',
        });

        const $ = cheerio.load(bookingPage);

        let scriptContent: string = '';

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
                `Could not find script content on ForeUp for ${course.name}`,
            );
        }

        const extractedText =
            scriptContent.match(/SCHEDULES\s*=\s*(\[\{.*?\}\]);/s)?.[1] || null;

        if (!extractedText) {
            throw new Error(`Could not find extracted text for ${course.name}`);
        }

        const schedules = JSON.parse(extractedText);

        const schedule = schedules.find(
            (schedule: any) => schedule.teesheet_id === String(course.courseId),
        );

        options.push({
            id: course.id,
            clubId: course.clubId,
            name: course.name,
            options: schedule.booking_classes.map((option: any) => ({
                id: option.booking_class_id,
                name: option.name,
                bookingWindow: Number(option.days_in_booking_window),
            })),
        });
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    };

    const promptUser = async () => {
        console.log(
            'For each course, enter a comma-separated list for each booking class you want to use then press enter.',
        );
        for (const option of options) {
            console.log(`\n${option.name}`);

            option.options.forEach((option, index) => {
                console.log(
                    `${index + 1}. ${option.name} (${option.bookingWindow} days)`,
                );
            });

            const indexes = await askQuestion(
                'Enter the numbers for the booking classes you want to use: ',
            );
            const bookingClassIds = indexes
                .split(',')
                .map((index) => option.options[parseInt(index) - 1].id);

            await prisma.course.update({
                where: { id: option.id },
                data: {
                    bookingClassIds,
                },
            });

            const filteredBookingClasses = option.options.filter((option) =>
                bookingClassIds.includes(option.id),
            );

            const largestBookingWindow = Math.max(
                ...filteredBookingClasses.map((option) => option.bookingWindow),
            );

            await prisma.club.update({
                where: { clubId: option.clubId },
                data: {
                    bookingWindow: largestBookingWindow,
                },
            });
        }
    };

    await promptUser();

    res.status(200).send(options);
};

export const getClubs = async (req: FastifyRequest, res: FastifyReply) => {
    const VALID_SOFTWARE = ['foreUp', 'memberSports', 'chrono'];

    const clubs = await prisma.club.findMany({
        select: {
            clubId: true,
            name: true,
            website: true,
            slug: true,
            bookingWindow: true,
            locationData: {
                select: {
                    city: true,
                    state: true,
                    postalCode: true,
                    county: true,
                },
            },
        },
        where: {
            software: {
                in: VALID_SOFTWARE,
            },
        },
    });

    res.status(200).send(clubs);
};
