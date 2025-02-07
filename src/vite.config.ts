import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), Components({ resolvers: [PrimeVueResolver()] })],
    build: {
        outDir: '../dist/frontend-build',
    },
    publicDir: './public',
    appType: 'spa',
    root: '.',
    server: {
        port: 6060,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:4000/',
                secure: false,
                changeOrigin: true,
            },
        },
    },
    resolve: {
        extensions: ['.js', '.vue', '.ts'],
        alias: {
            '@stores': resolve(__dirname, './stores'),
            '@components': resolve(__dirname, './components'),
        },
    },
});
