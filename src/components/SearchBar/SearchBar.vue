<script setup lang="ts">
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import CourseSelector from './CourseSelector/CourseSelector.vue';
import DateSelector from './DateSelector/DateSelector.vue';
import PlayerSelector from './PlayerSelector/PlayerSelector.vue';
import HolesSelector from './HolesSelector/HolesSelector.vue';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();

defineProps({
    isHomePage: Boolean,
});
</script>

<template>
    <div :class="['search-bar', !isHomePage ? 'outline' : '']">
        <div class="inputs">
            <DateSelector />
            <Divider layout="vertical" />
            <CourseSelector />
            <Divider layout="vertical" />
            <PlayerSelector />
            <Divider layout="vertical" />
            <HolesSelector />
        </div>
        <div class="search-button">
            <Button
                label="Search"
                icon="pi pi-search"
                class="button"
                size="large"
                :disabled="
                    !searchStore.searchEnabled ||
                    searchStore.stateIsSameAsUrlParams
                "
                @click="
                    async () => {
                        if ($route.name === 'tee-times') {
                            await searchStore.getTeeTimes();
                        } else {
                            $router.push({
                                name: 'tee-times',
                                query: {
                                    date: searchStore.getFormattedDate,
                                    clubs: searchStore.clubs.join(','),
                                    players: searchStore.players,
                                    holes: searchStore.holes,
                                },
                            });
                        }
                    }
                "
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import './SearchBar.scss';
</style>
