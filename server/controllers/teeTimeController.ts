import prisma from '../prisma';
import { Course } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { softwareMap } from '../services/index';
import { CourseWithClubDetails } from '../types';
import dayjs from '../utils/dayjs';
interface TeeTimeQuery {
    clubs: string;
    date: string;
    players: string;
    holes: string;
}

export const getTeeTimes = async (
    req: FastifyRequest<{ Querystring: TeeTimeQuery }>,
    res: FastifyReply,
) => {
    const { clubs, date, players, holes } = req.query;

    const courses = await prisma.course.findMany({
        where: {
            club: {
                slug: {
                    in: clubs.split(','),
                },
            },
        },
        include: {
            club: {
                select: {
                    slug: true,
                    software: true,
                    name: true,
                },
            },
        },
    });

    const coursesBySoftware = courses.reduce(
        (acc, course) => {
            if (!course.club.software) {
                return acc;
            }

            const key = course.club.software;
            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(course);
            return acc;
        },
        {} as Record<string, Course[]>,
    );

    const softwareKeys = Object.keys(coursesBySoftware);
    const softwarePromises = softwareKeys.map((key) => {
        const software = softwareMap[key];
        return software.getTeeTimes({
            courses: coursesBySoftware[key] as CourseWithClubDetails[],
            startDate: date,
            holes: parseInt(holes),
            players: parseInt(players),
        });
    });
    const nestedTeeTimes = await Promise.all(softwarePromises);
    const teeTimes = nestedTeeTimes.flat();

    teeTimes.sort((a, b) => {
        return dayjs(a.teeTime).diff(dayjs(b.teeTime)) > 0 ? 1 : -1;
    });

    res.send(teeTimes);
};
