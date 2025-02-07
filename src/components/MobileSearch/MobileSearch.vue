<script setup lang="ts">
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useSearchStore } from '@stores/search.store';
import DateSelector from './DateSelector/DateSelector.vue';
import CourseSelector from './CourseSelector/CourseSelector.vue';
import HolesSelector from './HolesSelector/HolesSelector.vue';
import PlayerSelector from './PlayerSelector/PlayerSelector.vue';

const searchStore = useSearchStore();
</script>

<template>
    <Drawer
        v-model:visible="searchStore.showMobile"
        position="full"
        header="Search for Tee Times"
        class="drawer"
    >
        <div class="input-wrapper">
            <DateSelector />
            <CourseSelector />
            <PlayerSelector />
            <HolesSelector />
        </div>
        <div class="footer">
            <Button
                label="Clear Filters"
                class="footer-button"
                size="large"
                text
                severity="secondary"
                @click="searchStore.clearAllFields"
            />
            <Button
                label="Search"
                icon="pi pi-search"
                class="footer-button"
                icon-pos="left"
                size="large"
                :disabled="
                    !searchStore.searchEnabled ||
                    searchStore.stateIsSameAsUrlParams
                "
                @click="
                    async () => {
                        searchStore.setShowMobile(false);
                        $router.push({
                            name: 'tee-times',
                            query: {
                                date: searchStore.getFormattedDate,
                                clubs: searchStore.clubs.join(','),
                                players: searchStore.players,
                                holes: searchStore.holes,
                            },
                        });
                        if ($route.name === 'tee-times') {
                            await searchStore.getTeeTimes();
                        }
                    }
                "
            />
        </div>
    </Drawer>
</template>

<style lang="scss">
@import './MobileSearch.scss';
</style>
