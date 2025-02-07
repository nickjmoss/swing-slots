import { defineStore } from 'pinia';

export const useAppStore = defineStore('AppStore', {
    state: () => ({
        isMobile: false,
    }),
    getters: {},
    actions: {
        setIsMobile(isMobile: boolean) {
            this.isMobile = isMobile;
        },
        init() {
            if (window.innerWidth < 480) {
                this.setIsMobile(true);
            } else {
                this.setIsMobile(false);
            }
        },
    },
});
