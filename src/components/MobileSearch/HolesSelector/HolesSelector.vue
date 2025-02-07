<script setup lang="ts">
import SelectButton from 'primevue/selectbutton';
import Panel from 'primevue/panel';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();
</script>

<template>
    <Panel
        :collapsed="!(searchStore.mobileActiveTab === 'holes')"
        :pt="{
            header: {
                style: { backgroundColor: 'var(--p-surface-0)' },
                onclick: () => searchStore.setMobileActiveTab('holes'),
            },
        }"
        class="panel"
    >
        <template #header>
            <div class="header">
                <div>Holes</div>
                <div
                    v-if="searchStore.mobileActiveTab !== 'holes'"
                    class="info"
                >
                    <span v-if="searchStore.holes"
                        >{{ searchStore.holes }} holes</span
                    >
                    <span v-else>Choose Holes</span>
                </div>
            </div>
        </template>
        <SelectButton
            v-model="searchStore.holes"
            :options="[
                { label: '9 Holes', value: 9 },
                { label: '18 Holes', value: 18 },
            ]"
            option-label="label"
            option-value="value"
            @update:model-value="() => searchStore.setMobileActiveTab('')"
        />
    </Panel>
</template>

<style scoped lang="scss">
@import './HolesSelector.scss';
</style>
