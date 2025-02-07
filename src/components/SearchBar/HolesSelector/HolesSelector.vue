<script setup lang="ts">
import Popover from 'primevue/popover';
import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';
import { ref } from 'vue';
import { useSearchStore } from '@stores/search.store';

const searchStore = useSearchStore();

const holesRef = ref<any>();
const toggleHoles = (event: Event) => {
    holesRef.value.toggle(event);
};
</script>

<template>
    <div
        :class="['field-wrapper', holesRef?.visible ? 'active' : '']"
        style="width: 160px"
        @click="toggleHoles"
    >
        <i class="pi pi-flag" />
        <div>
            <div class="header">Holes</div>
            <div v-if="!searchStore.holes">9 or 18</div>
            <div v-else>{{ searchStore.holes }} holes</div>
        </div>
        <Button
            v-if="searchStore.holes"
            icon="pi pi-times"
            rounded
            text
            class="clear"
            @click="
                (e: Event) => {
                    e.stopPropagation();
                    searchStore.clearField('holes');
                }
            "
        />
    </div>
    <Popover
        ref="holesRef"
        :pt="{
            root: { style: { overflow: 'auto', marginTop: '20px' } },
        }"
    >
        <SelectButton
            v-model="searchStore.holes"
            :options="[
                { label: '9 Holes', value: 9 },
                { label: '18 Holes', value: 18 },
            ]"
            option-label="label"
            option-value="value"
        />
    </Popover>
</template>

<style scoped lang="scss">
@import '../SearchBar.scss';
@import './HolesSelector.scss';
</style>
