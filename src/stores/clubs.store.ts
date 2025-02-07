import axios from 'axios';
import { defineStore } from 'pinia';

export const useClubsStore = defineStore('ClubsStore', {
    state: () => ({
        clubs: [] as any[],
    }),
    getters: {
        getClubsByCounty(state) {
            // return array of objects with name as county and clubs as array of clubs
            const clubsByCounty = state.clubs.reduce((acc, club) => {
                const county = club.locationData.county;
                if (!acc[county]) {
                    acc[county] = [];
                }
                acc[county].push(club);
                return acc;
            }, {});

            return Object.entries(clubsByCounty).map(([county, clubs]) => ({
                county,
                clubs: clubs as any[],
            }));
        },
    },
    actions: {
        async getClubs() {
            const { data } = await axios.get('/api/clubs');
            this.clubs = data;
        },
        async initialize() {
            if (this.clubs.length === 0) {
                await this.getClubs();
            }
        },
    },
});
