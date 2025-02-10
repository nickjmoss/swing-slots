<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchStore } from '@stores/search.store';
import { useClubsStore } from '@stores/clubs.store';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import SearchBar from '../../SearchBar/SearchBar.vue';
import { useAppStore } from '@stores/app.store';
import MobileSearchButton from '../../MobileSearch/MobileSearchButton/MobileSearchButton.vue';
import MobileSearch from '../../MobileSearch/MobileSearch.vue';

const showModal = ref(false);
const courseLink = ref('');

const searchStore = useSearchStore();
const clubStore = useClubsStore();
const appStore = useAppStore();
const router = useRouter();

onMounted(async () => {
    searchStore.setIsSearching(true);
    await clubStore.initialize();
    searchStore.setFromUrlParams();
    if (!searchStore.searchEnabled) {
        searchStore.clearAllFields();
        router.push('/');
        return;
    }
    await searchStore.getTeeTimes();
});

const getTime = (teeTime: string) => {
    const date = new Date(teeTime);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const twelveHour = hours % 12 || 12;
    const paddedHour = twelveHour.toString().padStart(2, '0');

    return `${paddedHour}:${minutes}${ampm}`;
};

const getPrice = (cartFee: number, greenFee: number) => {
    // round to nearest cent
    return (cartFee + greenFee).toFixed(2);
};
</script>

<template>
    <div class="search-filter">
        <Dialog
            modal
            @update:visible="(val) => (showModal = val)"
            dismissable-mask
            :visible="showModal"
            header="Book Tee Time"
            :style="{ width: '30rem' }"
        >
            <div>
                You will be redirected to the course's website where you can
                book this tee time. Do you want to continue?
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    severity="secondary"
                    @click="
                        () => {
                            showModal = false;
                            courseLink = '';
                        }
                    "
                />
                <Button
                    as="a"
                    :href="courseLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    label="Yes, let's book it!"
                    @click="
                        () => {
                            showModal = false;
                            courseLink = '';
                        }
                    "
                />
            </template>
        </Dialog>
        <SearchBar v-if="!appStore.isMobile" :is-home-page="false" />
        <MobileSearchButton v-else />
        <MobileSearch />
        <div class="filters">
            <FloatLabel>
                <Select
                    v-model="searchStore.filters.club"
                    input-id="course-input"
                    :options="searchStore.getClubNamesFromTeeTimes"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Course"
                    :pt:label:class="{ mobile: appStore.isMobile }"
                />
                <label for="course-input">Course</label>
            </FloatLabel>
            <FloatLabel>
                <Select
                    v-model="searchStore.filters.timeOfDay"
                    input-id="time-input"
                    :options="searchStore.getTimeOfDayOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Time of Day"
                    :pt:label:class="{ mobile: appStore.isMobile }"
                />
                <label for="time-input">Time of Day</label>
            </FloatLabel>
        </div>
    </div>
    <div v-if="searchStore.isSearching" class="loader">
        <ProgressSpinner stroke-width="3" />
    </div>
    <div
        v-else-if="
            !searchStore.isSearching && !searchStore.getFilteredTeeTimes.length
        "
        class="no-tee-times"
    >
        <div>No tee times found, try adjusting your search criteria.</div>
    </div>
    <div v-else class="tee-time-background">
        <div class="tee-time-wrapper">
            <div v-for="teeTime in searchStore.getFilteredTeeTimes">
                <div class="tee-time-card">
                    <Tag
                        :value="getTime(teeTime.teeTime)"
                        :pt="{
                            root: {
                                style: {
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.4rem 0.8rem',
                                    border: '1px solid var(--p-surface-300)',
                                },
                            },
                        }"
                        severity="secondary"
                        v-if="!appStore.isMobile"
                    />
                    <div class="names">
                        <div v-if="appStore.isMobile" class="mobile-time">
                            <Tag
                                :value="getTime(teeTime.teeTime)"
                                :pt="{
                                    root: {
                                        style: {
                                            fontSize: '1.1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--p-surface-300)',
                                        },
                                    },
                                }"
                                severity="secondary"
                            />
                            <div class="mobile-info">
                                <Tag
                                    icon="pi pi-flag"
                                    :value="
                                        teeTime.holes.length > 1
                                            ? `${teeTime.holes.join(' or ')} Holes`
                                            : `${teeTime.holes.join(', ')} Holes`
                                    "
                                    severity="secondary"
                                />
                                <Tag
                                    icon="pi pi-user"
                                    :value="
                                        teeTime.players === 1
                                            ? `${teeTime.players} Player`
                                            : `${teeTime.players} Players`
                                    "
                                    severity="secondary"
                                />
                            </div>
                        </div>
                        <div class="course-name">
                            {{ teeTime.courseName }}
                        </div>
                        <div class="facility-name">
                            {{ teeTime.facilityName }}
                        </div>
                        <div class="footer">
                            <Button
                                class="book-button"
                                :label="`Book Now for $${getPrice(
                                    teeTime.cartFee,
                                    teeTime.greenFee,
                                )}`"
                                icon-pos="right"
                                icon="pi pi-arrow-right"
                                size="small"
                                @click="
                                    () => {
                                        courseLink = teeTime.bookingUrl;
                                        showModal = true;
                                    }
                                "
                            />
                        </div>
                    </div>
                    <div class="info" v-if="!appStore.isMobile">
                        <Tag
                            icon="pi pi-flag"
                            :value="
                                teeTime.holes.length > 1
                                    ? `${teeTime.holes.join(' or ')} Holes`
                                    : `${teeTime.holes.join(', ')} Holes`
                            "
                            severity="secondary"
                        />
                        <Tag
                            icon="pi pi-user"
                            :value="
                                teeTime.players === 1
                                    ? `${teeTime.players} Player`
                                    : `${teeTime.players} Players`
                            "
                            severity="secondary"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import './TeeTimes.scss';
</style>
