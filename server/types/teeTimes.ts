import { Course } from '@prisma/client';

export type CourseWithClubDetails = Course & {
    club: {
        slug: string;
        software: string;
        name: string;
    };
};

export interface TeeTimeParams {
    courses: CourseWithClubDetails[];
    startDate: string;
    holes: number;
    players: number;
}

export interface TeeTime {
    bookingUrl: string;
    cartFee: number;
    courseName: string;
    facilityName: string;
    teeTime: string;
    greenFee: number;
    holes: number[];
    players: number;
}
