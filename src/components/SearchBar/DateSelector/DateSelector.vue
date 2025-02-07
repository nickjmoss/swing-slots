<script setup lang="ts">
import Popover from 'primevue/popover';
import DatePicker from 'primevue/datepicker';
import { useSearchStore } from '@stores/search.store';
import { ref } from 'vue';

const searchStore = useSearchStore();

const whenRef = ref<any>();
const toggleWhen = (event: Event) => {
    whenRef.value.toggle(event);
};
</script>

<template>
    <div
        :class="['field-wrapper', whenRef?.visible ? 'active' : '']"
        style="width: 220px"
        @click="toggleWhen"
    >
        <i class="pi pi-calendar" />
        <div>
            <div class="header">When</div>
            <div v-if="!searchStore.date">Choose a date</div>
            <div v-else>{{ new Date(searchStore.date).toDateString() }}</div>
        </div>
        <Button
            v-if="searchStore.date"
            icon="pi pi-times"
            rounded
            text
            class="clear"
            @click="
                (e: Event) => {
                    e.stopPropagation();
                    searchStore.clearField('date');
                }
            "
        />
    </div>
    <Popover
        ref="whenRef"
        :pt="{
            root: { style: { overflow: 'auto', marginTop: '20px' } },
        }"
    >
        <DatePicker
            v-model="searchStore.date"
            inline
            :min-date="new Date()"
            :pt="{
                panel: {
                    style: {
                        border: 'none',
                        padding: '0',
                    },
                },
            }"
        />
    </Popover>
</template>

<style scoped lang="scss">
@import '../SearchBar.scss';
</style>
