import { load } from 'cheerio';

import type { Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import puppeteer from '@/utils/puppeteer';

const baseIndexUrl = 'https://www.auto.uestc.edu.cn/xwgg/tzgs.htm';

export const route: Route = {
    path: '/auto',
    categories: ['university'],
    example: '/uestc/auto',
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['auto.uestc.edu.cn/'],
        },
    ],
    name: '自动化工程学院',
    maintainers: ['talengu', 'mobyw'],
    handler,
    url: 'auto.uestc.edu.cn/',
};

async function handler() {
    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
    });
    await page.goto(baseIndexUrl, {
        waitUntil: 'networkidle2',
    });
    const content = await page.content();
    await browser.close();

    const $ = load(content);

    const items = $('a.flex.wl');

    const out = $(items)
        .toArray()
        .map((item) => {
            const $item = $(item);
            const newsTitle = $item.attr('title') ?? $item.find('h3').text().trim();
            const newsLink = new URL($item.attr('href') ?? '', baseIndexUrl).href;
            const newsPubDate = $item.find('.date').text().trim();

            return {
                title: newsTitle,
                description: $item.find('.p1').text().trim(),
                link: newsLink,
                pubDate: parseDate(`${newsPubDate.slice(0, 4)}-${newsPubDate.slice(4)}`),
            };
        });

    return {
        title: '电子科技大学自动化学院通知',
        link: baseIndexUrl,
        description: '电子科技大学自动化工程学院通知',
        item: out,
    };
}
