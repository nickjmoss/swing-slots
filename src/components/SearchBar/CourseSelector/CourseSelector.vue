<script setup lang="ts">
import Listbox from 'primevue/listbox';
import { useClubsStore } from '@stores/clubs.store';
import { useSearchStore } from '@stores/search.store';
import Popover from 'primevue/popover';
import Button from 'primevue/button';
import { ref } from 'vue';

const clubStore = useClubsStore();
const searchStore = useSearchStore();

const whereRef = ref<any>();
const toggleWhere = (event: Event) => {
    whereRef.value.toggle(event);
};
</script>

<template>
    <div
        :class="['field-wrapper', whereRef?.visible ? 'active' : '']"
        style="width: 230px"
        @click="toggleWhere"
    >
        <i class="pi pi-map-marker" />
        <div>
            <div class="header">Where</div>
            <div v-if="!searchStore.clubs.length">Select courses</div>
            <div v-else-if="searchStore.clubs.length === 1">
                {{ searchStore.clubs.length }} course selected
            </div>
            <div v-else>{{ searchStore.clubs.length }} courses selected</div>
        </div>
        <Button
            v-if="searchStore.clubs.length"
            icon="pi pi-times"
            rounded
            text
            class="clear"
            @click="
                (e: Event) => {
                    e.stopPropagation();
                    searchStore.clearField('clubs');
                }
            "
        />
    </div>
    <Popover
        ref="whereRef"
        :pt="{
            content: { style: { padding: '0' } },
            root: { style: { overflow: 'auto', marginTop: '20px' } },
        }"
    >
        <div class="course-selector">
            <Listbox
                v-model="searchStore.clubs"
                :options="clubStore.getClubsByCounty"
                optionLabel="name"
                optionValue="slug"
                optionGroupChildren="clubs"
                optionGroupLabel="county"
                :optionDisabled="
                    (option: any) =>
                        searchStore.outsideBookingWindow(option.bookingWindow)
                "
                multiple
                scrollHeight="25rem"
                filter
                checkmark
                filterPlaceholder="Search by course, city, or county"
                :filterFields="[
                    'name',
                    'locationData.county',
                    'locationData.city',
                ]"
                :pt="{
                    root: {
                        style: {
                            border: 'none',
                            padding: '0',
                            overflow: 'visible',
                            minWidth: '350px',
                        },
                    },
                }"
            >
                <template #optiongroup="slotProps">
                    <div class="group-wrapper">
                        <div>{{ slotProps.option.county }}</div>
                        <Button
                            :label="
                                searchStore.getAllClubsSelectedForGroup(
                                    slotProps.option.county,
                                )
                                    ? 'Unselect All'
                                    : 'Select All'
                            "
                            @click="
                                searchStore.getAllClubsSelectedForGroup(
                                    slotProps.option.county,
                                )
                                    ? searchStore.unselectAllClubsInGroup(
                                          slotProps.option.county,
                                      )
                                    : searchStore.selectAllClubsInGroup(
                                          slotProps.option.county,
                                      )
                            "
                            text
                            size="small"
                        />
                    </div>
                </template>
                <template #option="slotProps">
                    <div
                        v-if="
                            searchStore.outsideBookingWindow(
                                slotProps.option.bookingWindow,
                            )
                        "
                    >
                        <div>{{ slotProps.option.name }}</div>
                        <div class="disabled">
                            Outside of booking window ({{
                                slotProps.option.bookingWindow
                            }}
                            days)
                        </div>
                    </div>
                    <div v-else>{{ slotProps.option.name }}</div>
                </template>
            </Listbox>
        </div>
    </Popover>
</template>

<style scoped lang="scss">
@import './CourseSelector.scss';
@import '../SearchBar.scss';
</style>
