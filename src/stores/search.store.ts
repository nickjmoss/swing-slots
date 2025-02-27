import axios from 'axios';
import { defineStore } from 'pinia';
import { useClubsStore } from './clubs.store';
import dayjs from '../utils/dayjs';

interface TeeTime {
    bookingUrl: string;
    cartFee: number;
    courseName: string;
    facilityName: string;
    teeTime: string;
    greenFee: number;
    holes: number[];
    players: number;
}

export const useSearchStore = defineStore('SearchStore', {
    state: () => ({
        date: null as Date | null,
        clubs: [] as string[],
        holes: 0 as number,
        players: 0 as number,
        isSearching: false,
        teeTimes: [] as TeeTime[],
        filters: {
            club: 'all' as string,
            timeOfDay: 'any' as 'morning' | 'afternoon' | 'evening' | 'any',
        },
        showMobile: false,
        mobileActiveTab: 'when' as 'when' | 'where' | 'players' | 'holes' | '',
    }),
    getters: {
        getFormattedDate(state) {
            if (!state.date) {
                return null;
            }

            return state.date.toISOString().split('T')[0];
        },
        searchEnabled(state) {
            return (
                state.date !== null &&
                state.clubs.length > 0 &&
                state.holes > 0 &&
                state.players > 0
            );
        },
        stateIsSameAsUrlParams(state) {
            const urlParams = new URLSearchParams(window.location.search);
            const date = urlParams.get('date');
            const clubs = urlParams.get('clubs');
            const holes = urlParams.get('holes');
            const players = urlParams.get('players');

            if (!date || !clubs || !holes || !players) {
                return false;
            }

            if (date && date !== this.getFormattedDate) {
                return false;
            }

            if (clubs && clubs !== state.clubs.join(',')) {
                return false;
            }

            if (holes && parseInt(holes, 10) !== state.holes) {
                return false;
            }

            if (players && parseInt(players, 10) !== state.players) {
                return false;
            }

            return true;
        },
        getClubNamesFromTeeTimes(state) {
            const names = state.teeTimes.reduce((acc, teeTime) => {
                if (!acc.includes(teeTime.facilityName)) {
                    acc.push(teeTime.facilityName);
                }

                return acc;
            }, [] as string[]);

            const options = [{ label: 'All courses', value: 'all' }];

            names.forEach((name) => {
                options.push({
                    label: name,
                    value: name,
                });
            });

            return options;
        },
        getTimeOfDayOptions() {
            return [
                { label: 'Any time of day', value: 'any' },
                { label: 'Morning (6am - 12pm)', value: 'morning' },
                { label: 'Afternoon (12pm - 4pm)', value: 'afternoon' },
                { label: 'Evening (4pm - 8pm)', value: 'evening' },
            ];
        },
        getFilteredTeeTimes(state) {
            return state.teeTimes.filter((teeTime) => {
                if (state.filters.club !== 'all') {
                    if (teeTime.facilityName !== state.filters.club) {
                        return false;
                    }
                }

                if (state.filters.timeOfDay !== 'any') {
                    const time = new Date(teeTime.teeTime).getHours();

                    if (state.filters.timeOfDay === 'morning' && time >= 12) {
                        return false;
                    }

                    if (
                        state.filters.timeOfDay === 'afternoon' &&
                        (time < 12 || time >= 16)
                    ) {
                        return false;
                    }

                    if (state.filters.timeOfDay === 'evening' && time < 16) {
                        return false;
                    }
                }

                return true;
            });
        },
    },
    actions: {
        setDate(date: Date) {
            this.date = date;
        },
        setShowMobile(showMobile: boolean) {
            this.showMobile = showMobile;
        },
        setMobileActiveTab(tab: 'when' | 'where' | 'players' | 'holes' | '') {
            this.mobileActiveTab = tab;
        },
        setClubFilter(club: string) {
            this.filters.club = club;
        },
        setTimeOfDayFilter(timeOfDay: 'morning' | 'afternoon' | 'evening') {
            this.filters.timeOfDay = timeOfDay;
        },
        outsideBookingWindow(window: number) {
            if (!this.date) {
                return false;
            }

            const date = new Date();
            const diff = Math.abs(this.date.getTime() - date.getTime());
            const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

            return diffDays >= window;
        },
        clearAllFields() {
            this.date = null;
            this.clubs = [];
            this.holes = 0;
            this.players = 0;
        },
        clearField(field: 'date' | 'clubs' | 'holes' | 'players') {
            if (field === 'date') {
                this.date = null;
                return;
            }

            if (field === 'clubs') {
                this.clubs = [];
                return;
            }

            if (field === 'holes') {
                this.holes = 0;
                return;
            }

            if (field === 'players') {
                this.players = 0;
                return;
            }
        },
        selectAllClubsInGroup(group: string) {
            const clubsStore = useClubsStore();
            const clubs = clubsStore.getClubsByCounty;
            const selectedClubs = clubs.find(
                (club) => club.county === group,
            )?.clubs;

            const setFromState = new Set(this.clubs);

            if (selectedClubs) {
                const filteredClubs = selectedClubs.filter(
                    (club) => !this.outsideBookingWindow(club.bookingWindow),
                );

                filteredClubs.forEach((club) => setFromState.add(club.slug));
            }

            this.clubs = Array.from(setFromState);
        },
        unselectAllClubsInGroup(group: string) {
            const clubsStore = useClubsStore();
            const clubs = clubsStore.getClubsByCounty;
            const selectedClubs = clubs.find(
                (club) => club.county === group,
            )?.clubs;

            const setFromState = new Set(this.clubs);

            if (selectedClubs) {
                selectedClubs.forEach((club) => setFromState.delete(club.slug));
            }

            this.clubs = Array.from(setFromState);
        },
        getAllClubsSelectedForGroup(group: string) {
            const clubsStore = useClubsStore();
            const clubs = clubsStore.getClubsByCounty;
            const selectedClubs = clubs.find(
                (club) => club.county === group,
            )?.clubs;

            if (!selectedClubs) {
                return false;
            }

            const filteredClubs = selectedClubs.filter(
                (club) => !this.outsideBookingWindow(club.bookingWindow),
            );

            if (filteredClubs.length === 0) {
                return false;
            }

            const setFromState = new Set(this.clubs);

            return filteredClubs.every((club) => setFromState.has(club.slug));
        },
        getUrlParams() {
            const urlParams = new URLSearchParams();

            if (this.date) {
                const formattedDate = this.date.toISOString().split('T')[0];
                urlParams.set('date', formattedDate);
            }

            if (this.clubs.length > 0) {
                urlParams.set('clubs', this.clubs.join(','));
            }

            if (this.holes > 0) {
                urlParams.set('holes', this.holes.toString());
            }

            if (this.players > 0) {
                urlParams.set('players', this.players.toString());
            }

            return urlParams;
        },
        setFromUrlParams() {
            if (this.searchEnabled) {
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const date = urlParams.get('date');
            const clubs = urlParams.get('clubs');
            const holes = urlParams.get('holes');
            const players = urlParams.get('players');

            if (date) {
                this.date = dayjs(date).toDate();
            }

            if (clubs) {
                this.clubs = clubs.split(',');
            }

            if (holes) {
                this.holes = parseInt(holes, 10);
            }

            if (players) {
                this.players = parseInt(players, 10);
            }
        },
        setIsSearching(isSearching: boolean) {
            this.isSearching = isSearching;
        },
        setUrlParams() {
            const urlParams = this.getUrlParams();

            window.history.pushState(
                {},
                '',
                `${window.location.pathname}?${urlParams}`,
            );
        },
        async getTeeTimes() {
            this.setIsSearching(true);
            this.setUrlParams();
            const { data } = await axios.get(
                `/api/teeTimes?${this.getUrlParams()}`,
            );

            this.teeTimes = data;
            this.setIsSearching(false);
        },
    },
});
