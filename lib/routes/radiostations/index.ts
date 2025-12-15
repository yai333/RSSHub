import { config } from '@/config';
import type { DataItem, Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';

// Station type from the JSON data
interface Station {
    id: string;
    name: string;
    streamURL: string;
    country: string;
    genre: string;
    logoName: string;
    bitrateKbps: number;
    isFeatured: boolean;
    order: number;
    description: string | null;
    websiteURL: string | null;
}

interface StationsResponse {
    stations: Station[];
    version: string;
    lastUpdated: string;
}

// Map countries to regions
const countryToRegion: Record<string, string> = {
    'Hong Kong': 'hk',
    Taiwan: 'tw',
    China: 'cn',
    Australia: 'aus',
    'New Zealand': 'aus',
    USA: 'us',
    Canada: 'us',
    Singapore: 'other',
    Malaysia: 'other',
    Japan: 'other',
    Korea: 'other',
};

const regionNames: Record<string, string> = {
    all: 'All Regions',
    hk: 'Hong Kong & Macau',
    tw: 'Taiwan',
    cn: 'Mainland China',
    aus: 'Australia & New Zealand',
    us: 'North America',
    other: 'Other Regions',
};

export const route: Route = {
    path: '/stations/:region?',
    categories: ['multimedia'],
    example: '/radiostations/stations/hk',
    parameters: {
        region: {
            description: 'Region filter',
            default: 'all',
            options: [
                { value: 'all', label: 'All Regions' },
                { value: 'hk', label: 'Hong Kong & Macau' },
                { value: 'tw', label: 'Taiwan' },
                { value: 'cn', label: 'Mainland China' },
                { value: 'aus', label: 'Australia & New Zealand' },
                { value: 'us', label: 'North America' },
                { value: 'other', label: 'Other Regions' },
            ],
        },
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: true,
        supportScihub: false,
    },
    name: 'Community Radio Stations',
    maintainers: ['yai333'],
    description: `Subscribe to community-curated radio stations by region. Each station includes a link to the original broadcaster's website.

This is a community-maintained directory. We do not host or control any audio streams.`,
    handler,
    zh: {
        name: '社區電台目錄',
        description: '按地區訂閱社區策劃的電台。每個電台都包含原始廣播公司網站的鏈接。',
    },
};

async function handler(ctx) {
    const region = ctx.req.param('region') || 'all';

    // Fetch stations with caching
    const stationsData = await cache.tryGet(
        'radiostations:data',
        async () => {
            const response = await got('https://yai333.github.io/RSSHub/exports/stations_v1.json');
            return response.data as StationsResponse;
        },
        config.cache.routeExpire,
        false
    );

    let stations = (stationsData as StationsResponse).stations;

    // Filter by region if specified
    if (region !== 'all') {
        stations = stations.filter((station) => {
            const stationRegion = countryToRegion[station.country] || 'other';
            return stationRegion === region;
        });
    }

    // Sort by order
    stations = stations.toSorted((a, b) => a.order - b.order);

    // Convert stations to RSS items
    const items: DataItem[] = stations.map((station) => {
        // Determine audio type from stream URL
        let audioType = 'audio/mpeg';
        if (station.streamURL.includes('.m3u8')) {
            audioType = 'application/x-mpegURL';
        } else if (station.streamURL.includes('.aac')) {
            audioType = 'audio/aac';
        } else if (station.streamURL.includes('.ogg')) {
            audioType = 'audio/ogg';
        }

        // Construct logo URL
        const logoUrl = station.logoName ? `https://yai333.github.io/RSSHub/exports/logos/${station.logoName}.jpg` : undefined;

        // Build description HTML
        const descriptionParts = [station.description || station.name, '', `Country: ${station.country}`, `Genre: ${station.genre}`, `Bitrate: ${station.bitrateKbps} kbps`];

        if (station.websiteURL) {
            descriptionParts.push('', `<a href="${station.websiteURL}">Visit Station Website</a>`);
        }

        return {
            title: station.name,
            description: descriptionParts.join('<br/>'),
            link: station.websiteURL || `https://yai333.github.io/RSSHub/exports/stations_v1.json#${station.id}`,
            guid: `radiostations:${station.id}`,
            category: [station.genre, station.country],
            author: station.country,
            enclosure_url: station.streamURL,
            enclosure_type: audioType,
            itunes_item_image: logoUrl,
        };
    });

    const regionName = regionNames[region] || 'All Regions';

    return {
        title: `Community Radio Stations - ${regionName}`,
        link: 'https://yai333.github.io/RSSHub/exports/stations_v1.json',
        description: `Community-curated radio stations from ${regionName}. Subscribe to discover and listen to radio streams. This is a community-maintained directory.`,
        language: 'zh-CN',
        item: items,
        itunes_author: 'Community',
        itunes_category: 'Music',
    };
}
