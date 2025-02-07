<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAppStore } from '@stores/app.store';

const appStore = useAppStore();

const setMobile = () => {
    if (window.innerWidth < 480) {
        appStore.setIsMobile(true);
    } else {
        appStore.setIsMobile(false);
    }
};

onMounted(() => {
    appStore.init();
    window.addEventListener('resize', setMobile);
    if (navigator.userAgent.indexOf('iPhone') > -1) {
        document
            .querySelector('[name="viewport"]')
            ?.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0',
            );
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', setMobile);
});
</script>

<template>
    <div class="background">
        <div class="menu">
            <RouterLink :to="{ name: 'home' }">
                <div class="logo-wrapper">
                    <Image src="/assets/golf-field.png" alt="logo" width="30" />
                    <div class="name">Swing Slots</div>
                </div>
            </RouterLink>
        </div>
        <RouterView />
    </div>
</template>

<style scoped lang="scss">
@import './App.scss';
</style>
