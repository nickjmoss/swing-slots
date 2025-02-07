import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from './components/Home/Home.vue';
import TeeTimes from './components/Home/TeeTimes/TeeTimes.vue';
import { useSearchStore } from '@stores/search.store';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: Home,
    },
    {
        path: '/tee-times',
        name: 'tee-times',
        component: TeeTimes,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    if (to.name === 'home' && from.name === 'tee-times') {
        const searchStore = useSearchStore();
        searchStore.clearAllFields();

        searchStore.setMobileActiveTab('when');
    }

    next();
});

export default router;
