<script setup lang="ts">
import SelectButton from 'primevue/selectbutton';
import Panel from 'primevue/panel';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();
</script>

<template>
    <Panel
        :collapsed="!(searchStore.mobileActiveTab === 'players')"
        :pt="{
            header: {
                style: { backgroundColor: 'var(--p-surface-0)' },
                onclick: () => searchStore.setMobileActiveTab('players'),
            },
        }"
        class="panel"
    >
        <template #header>
            <div class="header">
                <div>Players</div>
                <div
                    v-if="searchStore.mobileActiveTab !== 'players'"
                    class="info"
                >
                    <span v-if="searchStore.players">
                        {{
                            searchStore.players === 1
                                ? '1 player'
                                : `${searchStore.players} players`
                        }}
                    </span>
                    <span v-else>Add Players</span>
                </div>
            </div>
        </template>
        <SelectButton
            v-model="searchStore.players"
            :options="[
                { label: 'One', value: 1 },
                { label: 'Two', value: 2 },
                { label: 'Three', value: 3 },
                { label: 'Four', value: 4 },
            ]"
            option-label="label"
            option-value="value"
            @change="() => searchStore.setMobileActiveTab('holes')"
        />
    </Panel>
</template>

<style scoped lang="scss">
@import './PlayerSelector.scss';
</style>
