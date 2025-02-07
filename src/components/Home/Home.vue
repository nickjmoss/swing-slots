<script setup lang="ts">
import { onMounted } from 'vue';
import SearchBar from '../SearchBar/SearchBar.vue';
import Button from 'primevue/button';
import { useClubsStore } from '@stores/clubs.store';
import { useAppStore } from '@stores/app.store';
import { useSearchStore } from '@stores/search.store';
import MobileSearch from '../MobileSearch/MobileSearch.vue';

const clubStore = useClubsStore();
const appStore = useAppStore();
const searchStore = useSearchStore();

onMounted(async () => {
    await clubStore.getClubs();
});
</script>

<template>
    <div class="home">
        <div class="image-background">
            <div class="search-wrapper">
                <div class="intro">Find the tee time that is right for you</div>
                <SearchBar v-if="!appStore.isMobile" is-home-page />
                <Button
                    v-else
                    label="Search for Tee Times"
                    rounded
                    raised
                    size="large"
                    icon="pi pi-search"
                    class="mobile-search-button"
                    @click="() => searchStore.setShowMobile(true)"
                />
                <MobileSearch />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import './Home.scss';
</style>
