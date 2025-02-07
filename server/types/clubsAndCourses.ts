interface DraftLocationData {
    latitude: number;
    longitude: number;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    county: string;
}

export interface DraftCourse {
    courseId: string;
    clubId: string;
    name: string;
    bookingUrl: string;
    bookingClassIds?: string[];
}

export interface DraftClub {
    clubId: string;
    name: string;
    slug: string;
    software?: string;
    website?: string;
    locationData: DraftLocationData;
    bookingWindow: number;
    bookingUrl?: string;
    courses: DraftCourse[];
    websiteBroken?: boolean;
    index?: number;
}
