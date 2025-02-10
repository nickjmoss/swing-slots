<script setup lang="ts">
import DatePicker from 'primevue/datepicker';
import Panel from 'primevue/panel';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();
</script>

<template>
    <Panel
        :collapsed="!(searchStore.mobileActiveTab === 'when')"
        :pt="{
            header: {
                style: {
                    backgroundColor: 'var(--p-surface-0)',
                },
                onclick: () => searchStore.setMobileActiveTab('when'),
            },
        }"
        class="panel"
    >
        <template #header>
            <div class="header">
                <div>When</div>
                <div v-if="searchStore.mobileActiveTab !== 'when'" class="info">
                    <span v-if="searchStore.date">
                        {{ searchStore.date?.toDateString() }}
                    </span>
                    <span v-else>Choose Date</span>
                </div>
            </div>
        </template>
        <DatePicker
            v-model="searchStore.date"
            inline
            fluid
            :min-date="new Date()"
            @date-select="searchStore.setMobileActiveTab('where')"
            :pt="{
                panel: {
                    style: {
                        border: 'none',
                        padding: '0',
                        backgroundColor: 'var(--p-surface-0)',
                    },
                },
                root: {
                    style: {
                        border: 'none',
                        padding: '0',
                        backgroundColor: 'var(--p-surface-0)',
                        fontSize: '1rem',
                    },
                },
            }"
        />
    </Panel>
</template>

<style lang="scss">
.p-panel-content-container {
    background-color: white;
}

.panel {
    box-shadow: var(--smallest-box-shadow);
}
</style>
