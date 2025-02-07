<script setup lang="ts">
import Listbox from 'primevue/listbox';
import { useClubsStore } from '@stores/clubs.store';
import { useSearchStore } from '@stores/search.store';
import Panel from 'primevue/panel';
import Button from 'primevue/button';

const clubStore = useClubsStore();
const searchStore = useSearchStore();
</script>

<template>
    <Panel
        :collapsed="!(searchStore.mobileActiveTab === 'where')"
        :pt="{
            header: {
                style: { backgroundColor: 'var(--p-surface-0)' },
                onclick: () => searchStore.setMobileActiveTab('where'),
            },
            content: {
                style: {
                    padding: '0',
                    backgroundColor: 'var(--p-surface-0)',
                },
            },
        }"
        class="panel"
    >
        <template #header>
            <div class="header">
                <div>Where</div>
                <div
                    v-if="searchStore.mobileActiveTab !== 'where'"
                    class="info"
                >
                    <span v-if="searchStore.clubs.length">
                        {{
                            searchStore.clubs.length === 1
                                ? '1 course selected'
                                : `${searchStore.clubs.length} courses selected`
                        }}
                    </span>
                    <span v-else>Add Courses</span>
                </div>
                <div v-else>
                    <Button
                        label="Next"
                        @click="
                            (e: Event) => {
                                e.stopPropagation();
                                searchStore.setMobileActiveTab('players');
                            }
                        "
                        :disabled="!searchStore.clubs.length"
                        size="small"
                    />
                </div>
            </div>
        </template>
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
            scrollHeight="20rem"
            filter
            checkmark
            filterPlaceholder="Search by course, city, or county"
            :filterFields="['name', 'locationData.county', 'locationData.city']"
            :pt="{
                root: {
                    style: {
                        border: 'none',
                        padding: '0',
                        overflow: 'visible',
                        fontSize: '1rem',
                    },
                },
                header: {
                    style: {
                        backgroundColor: 'var(--p-surface-0)',
                        padding: '0.5rem',
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
    </Panel>
</template>

<style scoped lang="scss">
@import './CourseSelector.scss';
</style>
