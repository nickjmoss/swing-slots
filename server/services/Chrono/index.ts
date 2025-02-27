import { CourseWithClubDetails, TeeTime, TeeTimeParams } from '../../types';
import axios, { AxiosInstance } from 'axios';
import dayjs from '../../utils/dayjs';

const client = axios.create({
    withCredentials: true,
});

class Chrono {
    apiClient: AxiosInstance;

    constructor() {
        this.apiClient = client;
    }

    async getTeeTimes({ courses, startDate, holes, players }: TeeTimeParams) {
        const date = dayjs(startDate || new Date());

        const queryStringParams = new URLSearchParams({
            course_ids: courses.map((course) => course.courseId).join(','),
            start_date: date.format('YYYY-MM-DD'),
            holes: holes ? String(holes) : '9,18',
            start_time: date.isToday() ? dayjs().format('HH:mm') : '00:00',
            free_slots: String(players),
        });

        let { data } = await this.apiClient.get(
            `https://www.chronogolf.com/marketplace/v2/teetimes?${queryStringParams}`,
        );

        if (data?.teetimes) {
            data = data.teetimes;
        }

        const courseMap = courses.reduce(
            (acc, course) => {
                acc[course.courseId] = course;
                return acc;
            },
            {} as Record<string, CourseWithClubDetails>,
        );

        const teeTimes: TeeTime[] = data.map((teeTime: any) => {
            const courseId = teeTime.course.uuid;
            const course = courseMap[courseId];

            const actualTeeTime: TeeTime = {
                bookingUrl: course.bookingUrl,
                cartFee: teeTime.default_price.half_cart,
                courseName: teeTime.course.name,
                facilityName: course.club.name,
                holes: teeTime.course.bookable_holes,
                teeTime: dayjs
                    .utc(teeTime.starts_at)
                    .tz('America/Denver')
                    .format(),
                greenFee: teeTime.default_price.green_fee,
                players: teeTime.max_player_size,
            };

            return actualTeeTime;
        });

        return teeTimes;
    }
}

export const chrono = new Chrono();
