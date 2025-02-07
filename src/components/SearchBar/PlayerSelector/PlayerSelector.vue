<script setup lang="ts">
import Popover from 'primevue/popover';
import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';
import { useSearchStore } from '@stores/search.store';
import { ref } from 'vue';

const searchStore = useSearchStore();

const playersRef = ref<any>();
const togglePlayers = (event: Event) => {
    playersRef.value.toggle(event);
};
</script>

<template>
    <div
        :class="['field-wrapper', playersRef?.visible ? 'active' : '']"
        style="width: 170px"
        @click="togglePlayers"
    >
        <i class="pi pi-users" />
        <div>
            <div class="header">Players</div>
            <div v-if="!searchStore.players">Who is playing</div>
            <div v-else>{{ searchStore.players }} players</div>
        </div>
        <Button
            v-if="searchStore.players"
            icon="pi pi-times"
            rounded
            text
            class="clear"
            @click="
                (e: Event) => {
                    e.stopPropagation();
                    searchStore.clearField('players');
                }
            "
        />
    </div>
    <Popover
        ref="playersRef"
        :pt="{
            root: { style: { overflow: 'auto', marginTop: '20px' } },
        }"
    >
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
        />
    </Popover>
</template>

<style scoped lang="scss">
@import '../SearchBar.scss';
@import './PlayerSelector.scss';
</style>
