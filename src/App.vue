<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
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

const showDialog = ref(false);

const qaList = [
    {
        q: 'What courses are available?',
        a: 'Only courses within Utah are available at this time. If we get enough requests, we may consider adding courses from other states.',
    },
    {
        q: "I don't see a course that I know is in Utah. What should I do?",
        a: 'Please contact us at swing.slots.help@gmail.com and we will do our best to add the course to our records.',
    },
    {
        q: 'The tee times for a certain course are not accurate or are not showing up. What should I do?',
        a: 'Please contact us at swing.slots.help@gmail.com and we will do our best to resolve the issue.',
    },
    {
        q: 'Can I book a tee time through this website?',
        a: 'No, we do not offer booking services. We provide a platform for you to search for available tee times at various courses. But if we get enough requests, we may consider adding this feature in the future.',
    },
];
</script>

<template>
    <Dialog
        :visible="showDialog"
        modal
        header="FAQ"
        dismissable-mask
        @update:visible="(val) => (showDialog = val)"
    >
        <div v-for="qa in qaList" class="qa">
            <h3>{{ qa.q }}</h3>
            <p>{{ qa.a }}</p>
        </div>
    </Dialog>
    <div class="background">
        <div class="menu">
            <RouterLink :to="{ name: 'home' }">
                <div class="logo-wrapper">
                    <Image src="/assets/golf-field.png" alt="logo" width="30" />
                    <div class="name">Swing Slots</div>
                </div>
            </RouterLink>
            <Button
                icon="pi pi-question-circle"
                :label="appStore.isMobile ? '' : 'Help'"
                icon-pos="right"
                outlined
                @click="() => (showDialog = true)"
            />
        </div>
        <RouterView />
    </div>
</template>

<style scoped lang="scss">
@import './App.scss';
</style>
