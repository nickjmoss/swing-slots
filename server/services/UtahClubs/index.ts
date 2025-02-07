import { DraftClub } from '../../types';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const getUtahClubs = async () => {
    try {
        const data = await fetch(
            'https://www.uga.org/gn-api/facility-api/Facilities?associationId=11',
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: 'Basic YW5vbnltb3VzfjExOmFub255bW91cw==',
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    pragma: 'no-cache',
                    priority: 'u=1, i',
                    'sec-ch-ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    cookie: 'cf_clearance=qSJxCEaozMrU3J1stC9OErFDaAfKs8ZGG.eQaY2Sv80-1726181880-1.2.1.1-9wgAcoPuS23_S2wjDtR.UBvS.f1NDwrjL8hl5PhyUku9sYC.73pM6JZnFiFcLSo_xFDT6xfVNQd_hhE2Tqg2D2KDYWheYq0D_5mdIpKEN0u4FI9xzkCU2uYORi4GqV3nP4ajyCvJixbFjNn9IgdlOpm2b62b4IhX81AxmzuJqGLEFzSBeTzcfVZ05EypGlXy41wsGoN7TujS_Zs.HNRME70yqU7OZcAGYgjYblM871e_s.AmCz_y11qw5mLhZcOGj4QTzvF8C9ANi7HLZN4zPBbvFHMh2byfJIAzB4PLziKeozFijYl5Zn3LK92cVZcc4vUGQ8wIuh_cFNz.v4zjtHkyJWF7J8NZUuydA0CZL4pUnWt_qEN09_qEQT4lXwJk9ibYPdYKMXRPq_n9qIgrTQ; PHPSESSID=otv5ea9j2u5ki5d4ihhl38svt5',
                    Referer:
                        'https://www.uga.org/gn-web-app/facilities?userName=anonymous~11&authToken=anonymous&authLevel=unauthorized&apiURL=https:%2F%2Fwww.uga.org%2Fgn-api&contextLevel=associationContext&contextId=11&userId=0&embed=true&nocache=1',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                },
                body: null,
                method: 'GET',
            },
        );

        const parsed = await data.json();

        const { Facilities } = parsed;

        const utahClubs = Facilities.filter(
            (facility: any) => facility.State === 'UT',
        );

        const realData = utahClubs.map((facility: any) => ({
            name: facility.FacilityName,
            slug: facility.FacilityName.replace('Golf Club', 'GC')
                .replace('Golf Course', 'GC')
                .replace('Country Club', 'CC')
                .toLowerCase()
                .replace(/\s/g, '-'),
            website: facility?.Organization?.Website,
            locationData: {
                address: facility.Address1,
                address2: facility.Address2,
                city: facility.City,
                state: facility.State,
                zip: facility.ZipCode,
                latitude: facility.Latitude,
                longitude: facility.Longitude,
            },
        }));

        return realData;
    } catch (error) {
        console.error('Failed to get Utah clubs');
        throw error;
    }
};

export const getUtahClubsWithChrono = async () => {
    let { data, headers } = await axios.get(
        'https://www.chronogolf.com/marketplace/v2/search?location%5Blat%5D=39.55508430713312&location%5Blon%5D=-111.5472285&location%5Bdistance%5D=353.1808913099147&published=true&page=1',
    );

    if (Number(headers?.total) > Number(headers?.['per-page'])) {
        const pageCount = Math.ceil(headers.total / headers['per-page']);
        const promises = [];
        for (let i = 2; i <= pageCount; i++) {
            promises.push(
                axios.get(
                    `https://www.chronogolf.com/marketplace/v2/search?location%5Blat%5D=39.55508430713312&location%5Blon%5D=-111.5472285&location%5Bdistance%5D=353.1808913099147&published=true&page=${i}`,
                ),
            );
        }

        const responses = await Promise.all(promises);
        for (const response of responses) {
            data = data.concat(response.data);
        }
    }

    const slugs = data
        .filter((club: any) => club.province === 'Utah')
        .map((club: any) => club.slug);

    const utahClubs: DraftClub[] = [];

    let i = 1;
    for (const slug of slugs) {
        const bookingUrl = `https://www.chronogolf.com/club/${slug}`;
        try {
            console.log(`Getting club ${i} of ${slugs.length}`, bookingUrl);
            const { data: page } = await axios.get(bookingUrl);

            const $ = cheerio.load(page);
            const scriptContent = $('#__NEXT_DATA__').html();
            if (!scriptContent) {
                console.error(`Failed to get club ${slug} at ${bookingUrl}`);
                continue;
            }
            const json = JSON.parse(scriptContent);

            const {
                props: {
                    pageProps: { club },
                },
            } = json;

            utahClubs.push({
                clubId: club.uuid,
                name: club.name,
                slug: club.slug,
                software: club.active && club.courses.length ? 'chrono' : '',
                bookingWindow: Number(club.features.defaultPublicBookingRange),
                locationData: {
                    latitude: Number(club.location.lat),
                    longitude: Number(club.location.lon),
                    address: club.address,
                    address2: '',
                    city: club.city,
                    state: club.province,
                    postalCode: String(club.postcode),
                    county: '',
                },
                website: club.website,
                courses: club.courses.map((course: any) => ({
                    clubId: String(club.uuid),
                    courseId: String(course.uuid),
                    name: course.name,
                    bookingUrl,
                })),
            });
        } catch (e) {
            console.error(`Failed to get club ${slug} at ${bookingUrl}`);
            throw e;
        } finally {
            i++;
        }
    }

    fixBadWebsites(utahClubs);

    return utahClubs;
};

interface UtahZipsAndCounties {
    [key: string]: string;
}

export const utahZipsAndCounties: UtahZipsAndCounties = {
    84001: 'Duchesne County',
    84002: 'Duchesne County',
    84003: 'Utah County',
    84004: 'Utah County',
    84005: 'Utah County',
    84006: 'Salt Lake County',
    84007: 'Duchesne County',
    84008: 'Uintah County',
    84009: 'Salt Lake County',
    84010: 'Davis County',
    84011: 'Davis County',
    84013: 'Utah County',
    84014: 'Davis County',
    84015: 'Davis County',
    84016: 'Davis County',
    84017: 'Summit County',
    84018: 'Morgan County',
    84020: 'Salt Lake County',
    84021: 'Duchesne County',
    84022: 'Tooele County',
    84023: 'Daggett County',
    84024: 'Summit County',
    84025: 'Davis County',
    84026: 'Uintah County',
    84027: 'Duchesne County',
    84028: 'Rich County',
    84029: 'Tooele County',
    84031: 'Duchesne County',
    84032: 'Wasatch County',
    84033: 'Summit County',
    84034: 'Tooele County',
    84035: 'Uintah County',
    84036: 'Summit County',
    84037: 'Davis County',
    84038: 'Rich County',
    84039: 'Uintah County',
    84040: 'Davis County',
    84041: 'Davis County',
    84042: 'Utah County',
    84043: 'Utah County',
    84044: 'Salt Lake County',
    84045: 'Utah County',
    84046: 'Daggett County',
    84047: 'Salt Lake County',
    84049: 'Wasatch County',
    84050: 'Morgan County',
    84051: 'Duchesne County',
    84052: 'Duchesne County',
    84053: 'Duchesne County',
    84054: 'Davis County',
    84055: 'Summit County',
    84056: 'Davis County',
    84057: 'Utah County',
    84058: 'Utah County',
    84059: 'Utah County',
    84060: 'Summit County',
    84061: 'Summit County',
    84062: 'Utah County',
    84063: 'Uintah County',
    84064: 'Rich County',
    84065: 'Salt Lake County',
    84066: 'Duchesne County',
    84067: 'Weber County',
    84068: 'Summit County',
    84069: 'Tooele County',
    84070: 'Salt Lake County',
    84071: 'Tooele County',
    84072: 'Duchesne County',
    84073: 'Duchesne County',
    84074: 'Tooele County',
    84075: 'Davis County',
    84076: 'Uintah County',
    84078: 'Uintah County',
    84079: 'Uintah County',
    84080: 'Tooele County',
    84081: 'Salt Lake County',
    84082: 'Wasatch County',
    84083: 'Tooele County',
    84084: 'Salt Lake County',
    84085: 'Uintah County',
    84086: 'Rich County',
    84087: 'Davis County',
    84088: 'Salt Lake County',
    84089: 'Davis County',
    84090: 'Salt Lake County',
    84091: 'Salt Lake County',
    84092: 'Salt Lake County',
    84093: 'Salt Lake County',
    84094: 'Salt Lake County',
    84095: 'Salt Lake County',
    84096: 'Salt Lake County',
    84097: 'Utah County',
    84098: 'Summit County',
    84101: 'Salt Lake County',
    84102: 'Salt Lake County',
    84103: 'Salt Lake County',
    84104: 'Salt Lake County',
    84105: 'Salt Lake County',
    84106: 'Salt Lake County',
    84107: 'Salt Lake County',
    84108: 'Salt Lake County',
    84109: 'Salt Lake County',
    84110: 'Salt Lake County',
    84111: 'Salt Lake County',
    84112: 'Salt Lake County',
    84113: 'Salt Lake County',
    84114: 'Salt Lake County',
    84115: 'Salt Lake County',
    84116: 'Salt Lake County',
    84117: 'Salt Lake County',
    84118: 'Salt Lake County',
    84119: 'Salt Lake County',
    84120: 'Salt Lake County',
    84121: 'Salt Lake County',
    84122: 'Salt Lake County',
    84123: 'Salt Lake County',
    84124: 'Salt Lake County',
    84125: 'Salt Lake County',
    84126: 'Salt Lake County',
    84127: 'Salt Lake County',
    84128: 'Salt Lake County',
    84129: 'Salt Lake County',
    84130: 'Salt Lake County',
    84131: 'Salt Lake County',
    84132: 'Salt Lake County',
    84133: 'Salt Lake County',
    84134: 'Salt Lake County',
    84136: 'Salt Lake County',
    84138: 'Salt Lake County',
    84139: 'Salt Lake County',
    84141: 'Salt Lake County',
    84143: 'Salt Lake County',
    84144: 'Salt Lake County',
    84145: 'Salt Lake County',
    84147: 'Salt Lake County',
    84148: 'Salt Lake County',
    84150: 'Salt Lake County',
    84151: 'Salt Lake County',
    84152: 'Salt Lake County',
    84157: 'Salt Lake County',
    84158: 'Salt Lake County',
    84165: 'Salt Lake County',
    84170: 'Salt Lake County',
    84171: 'Salt Lake County',
    84180: 'Salt Lake County',
    84184: 'Salt Lake County',
    84189: 'Salt Lake County',
    84190: 'Salt Lake County',
    84199: 'Salt Lake County',
    84201: 'Weber County',
    84244: 'Weber County',
    84301: 'Box Elder County',
    84302: 'Box Elder County',
    84304: 'Cache County',
    84305: 'Cache County',
    84306: 'Box Elder County',
    84307: 'Box Elder County',
    84308: 'Cache County',
    84309: 'Box Elder County',
    84310: 'Weber County',
    84311: 'Box Elder County',
    84312: 'Box Elder County',
    84313: 'Box Elder County',
    84314: 'Box Elder County',
    84315: 'Weber County',
    84316: 'Box Elder County',
    84317: 'Weber County',
    84318: 'Cache County',
    84319: 'Cache County',
    84320: 'Cache County',
    84321: 'Cache County',
    84322: 'Cache County',
    84323: 'Cache County',
    84324: 'Box Elder County',
    84325: 'Cache County',
    84326: 'Cache County',
    84327: 'Cache County',
    84328: 'Cache County',
    84329: 'Box Elder County',
    84330: 'Box Elder County',
    84331: 'Box Elder County',
    84332: 'Cache County',
    84333: 'Cache County',
    84334: 'Box Elder County',
    84335: 'Cache County',
    84336: 'Box Elder County',
    84337: 'Box Elder County',
    84338: 'Cache County',
    84339: 'Cache County',
    84340: 'Box Elder County',
    84341: 'Cache County',
    84401: 'Weber County',
    84402: 'Weber County',
    84403: 'Weber County',
    84404: 'Weber County',
    84405: 'Weber County',
    84407: 'Weber County',
    84408: 'Weber County',
    84409: 'Weber County',
    84412: 'Weber County',
    84414: 'Weber County',
    84415: 'Weber County',
    84501: 'Carbon County',
    84510: 'San Juan County',
    84511: 'San Juan County',
    84512: 'San Juan County',
    84513: 'Emery County',
    84515: 'Grand County',
    84516: 'Emery County',
    84518: 'Emery County',
    84520: 'Carbon County',
    84521: 'Emery County',
    84522: 'Emery County',
    84523: 'Emery County',
    84525: 'Emery County',
    84526: 'Carbon County',
    84528: 'Emery County',
    84529: 'Carbon County',
    84530: 'San Juan County',
    84531: 'San Juan County',
    84532: 'Grand County',
    84533: 'Kane County',
    84534: 'San Juan County',
    84535: 'San Juan County',
    84536: 'San Juan County',
    84537: 'Emery County',
    84539: 'Carbon County',
    84540: 'Grand County',
    84542: 'Carbon County',
    84601: 'Utah County',
    84602: 'Utah County',
    84603: 'Utah County',
    84604: 'Utah County',
    84605: 'Utah County',
    84606: 'Utah County',
    84620: 'Sevier County',
    84621: 'Sanpete County',
    84622: 'Sanpete County',
    84623: 'Sanpete County',
    84624: 'Millard County',
    84626: 'Utah County',
    84627: 'Sanpete County',
    84628: 'Juab County',
    84629: 'Sanpete County',
    84630: 'Sanpete County',
    84631: 'Millard County',
    84632: 'Sanpete County',
    84633: 'Utah County',
    84634: 'Sanpete County',
    84635: 'Millard County',
    84636: 'Millard County',
    84637: 'Millard County',
    84638: 'Millard County',
    84639: 'Juab County',
    84640: 'Millard County',
    84642: 'Sanpete County',
    84643: 'Sanpete County',
    84644: 'Millard County',
    84645: 'Juab County',
    84646: 'Sanpete County',
    84647: 'Sanpete County',
    84648: 'Juab County',
    84649: 'Millard County',
    84651: 'Utah County',
    84652: 'Sevier County',
    84653: 'Utah County',
    84654: 'Sevier County',
    84655: 'Utah County',
    84656: 'Millard County',
    84657: 'Sevier County',
    84660: 'Utah County',
    84662: 'Sanpete County',
    84663: 'Utah County',
    84664: 'Utah County',
    84665: 'Sanpete County',
    84667: 'Sanpete County',
    84701: 'Sevier County',
    84710: 'Kane County',
    84711: 'Sevier County',
    84712: 'Garfield County',
    84713: 'Beaver County',
    84714: 'Iron County',
    84715: 'Wayne County',
    84716: 'Garfield County',
    84717: 'Garfield County',
    84718: 'Garfield County',
    84719: 'Iron County',
    84720: 'Iron County',
    84721: 'Iron County',
    84722: 'Washington County',
    84723: 'Piute County',
    84724: 'Sevier County',
    84725: 'Washington County',
    84726: 'Garfield County',
    84728: 'Millard County',
    84729: 'Kane County',
    84730: 'Sevier County',
    84731: 'Beaver County',
    84732: 'Piute County',
    84733: 'Washington County',
    84734: 'Wayne County',
    84735: 'Garfield County',
    84736: 'Garfield County',
    84737: 'Washington County',
    84738: 'Washington County',
    84739: 'Sevier County',
    84740: 'Piute County',
    84741: 'Kane County',
    84742: 'Iron County',
    84743: 'Piute County',
    84744: 'Sevier County',
    84745: 'Washington County',
    84746: 'Washington County',
    84747: 'Wayne County',
    84749: 'Wayne County',
    84750: 'Piute County',
    84751: 'Beaver County',
    84752: 'Beaver County',
    84753: 'Iron County',
    84754: 'Sevier County',
    84755: 'Kane County',
    84756: 'Iron County',
    84757: 'Washington County',
    84758: 'Kane County',
    84759: 'Garfield County',
    84760: 'Iron County',
    84761: 'Iron County',
    84762: 'Kane County',
    84763: 'Washington County',
    84764: 'Garfield County',
    84765: 'Washington County',
    84766: 'Sevier County',
    84767: 'Washington County',
    84770: 'Washington County',
    84771: 'Washington County',
    84772: 'Iron County',
    84773: 'Wayne County',
    84774: 'Washington County',
    84775: 'Wayne County',
    84776: 'Garfield County',
    84779: 'Washington County',
    84780: 'Washington County',
    84781: 'Washington County',
    84782: 'Washington County',
    84783: 'Washington County',
    84784: 'Washington County',
    84790: 'Washington County',
    84791: 'Washington County',
};

interface SlugsToFix {
    [key: string]: {
        slug: string;
        website: string;
        name: string;
        software?: string;
        courses?: {
            courseId: string;
            name: string;
            bookingUrl: string;
            clubId: string;
        }[];
        clubId?: string;
        bookingWindow?: number;
    };
}

const fixBadWebsites = (masterList: DraftClub[]) => {
    const slugsToFix: SlugsToFix = {
        'the-reserves-at-east-bay': {
            slug: 'timpanogos-golf-club',
            website: 'https://www.timpanogosgolf.com/book-a-tee-time/',
            name: 'Timpanogos Golf Club',
        },
        'the-golf-course-at-thanksgiving-point': {
            slug: 'thanksgiving-point-golf-club',
            website: 'https://www.thanksgivingpointgolfclub.com/',
            name: 'Thanksgiving Point Golf Club',
        },
        'soldier-hollow-golf-club': {
            slug: 'soldier-hollow-golf-course',
            website: 'https://www.soldierhollowgolf.com/',
            name: 'Soldier Hollow Golf Course',
            software: 'teeItUp',
        },
        'bountiful-ridge-golf-course': {
            slug: 'bountiful-ridge-golf-club',
            website: 'https://bountifulridgegolf.com/',
            name: 'Bountiful Ridge Golf Club',
        },
        'lakeside-golf-course-utah': {
            slug: 'lakeside-golf-course-utah',
            website: 'https://lakesidegolfcourse.com/',
            name: 'Lakeside Golf Course',
        },
        'royal-greens-golf-course': {
            clubId: '1078',
            slug: 'eagle-lake-golf-course',
            website: 'https://eaglelake-golf.com/',
            name: 'Eagle Lake Golf Course',
            software: 'teeSnap',
            bookingWindow: 14,
            courses: [
                {
                    courseId: '1078',
                    name: 'Eagle Lake Golf Course',
                    bookingUrl: 'https://eaglelakegolf.teesnap.net/',
                    clubId: '1078',
                },
            ],
        },
        'bear-lake-golf-course': {
            slug: 'bear-lake-golf-course',
            website: 'https://bearlakegolfcourse.com/',
            name: 'Bear Lake Golf Course',
        },
        'palisade-state-park-golf-course': {
            slug: 'palisade-state-park-golf-course',
            website:
                'https://aspira-management-company.book-v2.teeitup.golf/?course=6847&',
            name: 'Palisade State Park Golf Course',
            software: 'teeItUp',
        },
        'spanish-oaks-golf-course': {
            slug: 'spanish-oaks-golf-course',
            website: 'https://www.theoaksatsf.com/book_tee_time/index.php',
            name: 'Spanish Oaks Golf Course',
        },
        'canyon-hills-park-golf-course': {
            slug: 'canyon-hills-golf-course',
            website: 'https://canyonhillsgolf.com/',
            name: 'Canyon Hills Golf Course',
        },
        'hobble-creek-golf-course': {
            slug: 'hobble-creek-golf-course',
            website: 'https://www.springville.org/golf/book-tee-time/',
            name: 'Hobble Creek Golf Course',
        },
        'glenmoor-golf-course': {
            slug: 'glenmoor-golf-course',
            website: 'https://golfglenmoor.com/',
            name: 'Glenmoor Golf Course',
            software: 'courseProvided',
        },
        'murray-parkway-golf-course': {
            slug: 'murray-parkway-golf-course',
            website: 'https://parkwaygolf.org/',
            name: 'Murray Parkway Golf Course',
        },
        'green-river-golf-course': {
            slug: 'green-river-golf-course',
            website: 'https://stateparks.utah.gov/golf/green-river/reserve/',
            name: 'Green River Golf Course',
            software: 'teeItUp',
        },
        'stansbury-park-golf-course': {
            slug: 'stansbury-park-golf-course',
            website: 'https://stansburypark.org/golfcourse/',
            name: 'Stansbury Park Golf Course',
        },
        'roosevelt-golf-course-utah': {
            slug: 'roosevelt-golf-course-utah',
            website: 'https://golfrooseveltcity.com/',
            name: 'Roosevelt Golf Course',
        },
        'valley-view-golf-course-utah': {
            slug: 'valley-view-golf-course-utah',
            website: 'https://www.valleyviewutah.com/',
            name: 'Valley View Golf Course',
        },
        'sun-hills-golf-course': {
            slug: 'sun-hills-golf-course',
            website: 'https://www.sunhillsgolf.com/new_account/',
            name: 'Sun Hills Golf Course',
        },
        'mount-ogden-golf-course': {
            slug: 'mount-ogden-golf-course',
            website:
                'https://www.ogdencity.com/facilities/facility/details/Mount-Ogden-Golf-Course-4',
            name: 'Mount Ogden Golf Course',
        },
        'el-monte-golf-course': {
            slug: 'el-monte-golf-course',
            website: 'https://www.ogdencity.com/1690/El-Monte',
            name: 'El Monte Golf Course',
        },
        'wolf-creek-golf-resort-utah': {
            slug: 'wolf-creek-golf-resort-utah',
            website: 'https://wolfcreekresort.com/golf-rates/',
            name: 'Wolf Creek Golf Resort',
        },
        'the-barn-golf-club': {
            slug: 'the-barn-golf-club',
            website:
                'https://golfpay.co/course/the-barn-golf-club-ogden-ut-84414',
            name: 'The Barn Golf Club',
            software: 'golfPay',
        },
        'dinaland-golf-course': {
            slug: 'dinaland-golf-course',
            website: 'https://www.dinalandgolf.com/',
            name: 'Dinaland Golf Course',
        },
        'the-hideout-utah': {
            slug: 'the-hideout-utah',
            website: 'https://hideout-golf-club.book.teeitup.com',
            name: 'The Hideout',
            software: 'teeItUp',
        },
        'gladstan-golf-course': {
            slug: 'gladstan-golf-course',
            website: 'https://gladstan.com/',
            name: 'Gladstan Golf Course',
        },
        'homestead-golf-club-utah': {
            slug: 'homestead-golf-club-utah',
            website: 'https://playhomesteadgc.com/',
            name: 'Homestead Golf Club',
        },
        'wasatch-mountain-state-park': {
            slug: 'wasatch-mountain-golf-course',
            website: 'https://stateparks.utah.gov/golf/wasatch/teetime/',
            name: 'Wasatch Mountain Golf Course',
            software: 'teeItUp',
        },
        'west-ridge-golf-course': {
            slug: 'the-ridge-golf-course',
            website: 'https://www.golftheridgegc.com/golf/tee-times',
            name: 'The Ridge Golf Course',
        },
        'stonebridge-golf-club-at-lake-park': {
            slug: 'stonebridge-golf-club',
            website: 'https://www.golfstonebridgeutah.com/golf/tee-times',
            name: 'Stonebridge Golf Club',
        },
        'davis-park-golf-course': {
            slug: 'davis-park-golf-course',
            website: 'https://www.davisparkutah.com/',
            name: 'Davis Park Golf Course',
        },
        'canyon-breeze-golf-course': {
            slug: 'canyon-breeze-golf-course',
            website: 'https://canyonbreezegolfcourse.com/',
            name: 'Canyon Breeze Golf Course',
        },
        'birch-creek-golf-club-utah': {
            slug: 'birch-creek-golf-course',
            website:
                'https://www.golfrev.com/go/tee_times/?htc=370&courseid=3719&r=1',
            name: 'Birch Creek Golf Course',
            software: 'courseProvided',
        },
    };

    const slugsToRemove = [
        'river-oaks-golf-club-utah',
        'park-meadows-golf-club',
        'fore-lakes-golf-club-utah',
        'thunderbird-golf-club-resort',
        'coral-cliffs-golf-course',
        'sky-mountain-golf-course',
        'paradise-golf-resort',
        'schneiters-pebblebrook-links',
        'willow-creek-country-club-utah',
        'frank-skul-memorial-golf-club',
        'university-of-utah-golf-club',
        'copper-golf-club',
        'round-valley-golf-course',
        'swan-lakes-golf-course',
        'hubbard-golf-course',
        'golf-city-utah',
        'sherwood-hills-golf-course',
        'belmont-springs-park',
        'bloomington-country-club-utah',
        'hidden-valley-country-club-utah',
        'riverside-country-club-utah',
        'alpine-country-club-utah',
        'cottonwood-country-club-utah',
        'salt-lake-country-club',
        'oakridge-country-club-utah',
        'ogden-golf-country-club',
        'logan-golf-country-club',
        'seven-peaks-resort-golf-club',
        'the-links-at-overlake',
        'cascade-fairways-public-golf-club',
        'cove-view-golf-course',
        'red-ledges',
        'promontory-club',
        'the-course-at-glenwild',
        'wing-pointe-golf-course',
        'jordon-river-par-3-golf-club',
        'tuhaye-golf-club',
        'schneiter-s-bluff-golf-course',
        'schneiter-s-riverside-golf-course',
        'ben-lomond-golf-course',
        'moab-golf-club',
        'cherokee-springs-rv-golf-resort',
        'cedar-ridge-golf-course-utah',
        'entrada-at-snow-canyon',
    ];

    for (let i = 0; i < masterList.length; i++) {
        const facility = masterList[i];

        if (facility.website) {
            // replace spaces
            masterList[i].website = facility.website.trim().replace(/\s/g, '');
        }

        if (slugsToRemove.includes(facility.slug)) {
            masterList.splice(i, 1);
            i--;
            continue;
        }

        if (slugsToFix[facility.slug]) {
            masterList[i] = {
                ...facility,
                ...slugsToFix[facility.slug],
            };
        }
    }
};
