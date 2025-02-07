import { createApp, markRaw } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primevue/themes';
import Lara from '@primevue/themes/lara';
import App from './App.vue';
import router from './index.routes.ts';

import './styles/index.css';
import './styles/reset.css';
import 'primeicons/primeicons.css';

const MyPreset = definePreset(Lara, {
    semantic: {
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#082f49',
        },
    },
});

const pinia = createPinia();
pinia.use(({ store }) => {
    store.$router = markRaw(router);
});

// Create App
const app = createApp(App)
    .use(router)
    .use(pinia)
    .use(PrimeVue, {
        theme: {
            preset: MyPreset,
            options: {
                darkModeSelector: 'none',
            },
        },
    });

app.config.globalProperties.window = window;
app.config.globalProperties.document = document;
app.config.globalProperties.navigator = navigator;
app.mount('#app');
