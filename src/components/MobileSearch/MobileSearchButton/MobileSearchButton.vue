<script setup lang="ts">
import Divider from 'primevue/divider';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();
</script>

<template>
    <div class="mobile-search-button-wrapper">
        <div
            class="mobile-search-button"
            @click="() => searchStore.setShowMobile(true)"
        >
            <div class="input">
                <div class="title">When</div>
                <div class="value">
                    {{ searchStore.date?.toDateString() }}
                </div>
            </div>
            <Divider class="divider" layout="vertical" />
            <div class="input">
                <div class="title">Where</div>
                <div class="value">
                    {{
                        searchStore.clubs.length === 1
                            ? '1 course'
                            : `${searchStore.clubs.length} courses`
                    }}
                </div>
            </div>
            <Divider class="divider" layout="vertical" />
            <div class="input">
                <div class="title">Players</div>
                <div class="value">
                    {{
                        searchStore.players === 1
                            ? '1 player'
                            : `${searchStore.players} players`
                    }}
                </div>
            </div>
            <Divider class="divider" layout="vertical" />
            <div class="input">
                <div class="title">Holes</div>
                <div class="value">{{ searchStore.holes }} holes</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import './MobileSearchButton.scss';
</style>
