import { foreUp } from './ForeUp';
import { chrono } from './Chrono';
import { memberSports } from './MemberSports';

export const softwareMap: Record<
    string,
    typeof foreUp | typeof chrono | typeof memberSports
> = {
    foreUp,
    chrono,
    memberSports,
};
