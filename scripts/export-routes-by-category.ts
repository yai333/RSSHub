/**
 * Export RSS routes to separate JSON files by category
 *
 * Usage: npx tsx scripts/export-routes-by-category.ts
 *
 * Output: exports/{category}.json for each category
 */

import fs from 'node:fs';
import path from 'node:path';

import { namespaces } from '../lib/registry';
import type { Category, Route } from '../lib/types';
import logger from '../lib/utils/logger';
import { categories as categoryMeta } from './workflow/data';

const __dirname = import.meta.dirname;
const outputDir = path.join(__dirname, '../exports');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// All available categories from types.ts
const allCategories: Category[] = [
    'popular',
    'social-media',
    'new-media',
    'traditional-media',
    'bbs',
    'blog',
    'programming',
    'design',
    'live',
    'multimedia',
    'picture',
    'anime',
    'program-update',
    'university',
    'forecast',
    'travel',
    'shopping',
    'game',
    'reading',
    'government',
    'study',
    'journal',
    'finance',
    'other',
];

interface ExportedRoute {
    namespace: string;
    namespaceName: string;
    namespaceUrl?: string;
    path: string;
    fullPath: string;
    name: string;
    example: string;
    description?: string;
    parameters?: Route['parameters'];
    maintainers: string[];
    categories: Category[];
    features?: Route['features'];
    radar?: Route['radar'];
    lang?: string;
}

// Initialize category buckets
const routesByCategory: Record<Category, ExportedRoute[]> = {} as Record<Category, ExportedRoute[]>;
for (const category of allCategories) {
    routesByCategory[category] = [];
}

// Process all namespaces and routes
for (const namespaceKey in namespaces) {
    const namespace = namespaces[namespaceKey];

    // Determine default category for this namespace
    let defaultCategory: Category = 'other';
    if (namespace.categories?.[0]) {
        defaultCategory = namespace.categories[0];
    } else {
        // Try to find a category from any route in this namespace
        for (const routePath in namespace.routes) {
            const route = namespace.routes[routePath];
            if (route.categories?.[0]) {
                defaultCategory = route.categories[0];
                break;
            }
        }
    }

    // Process each route in the namespace
    for (const routePath in namespace.routes) {
        const route = namespace.routes[routePath];
        const fullPath = `/${namespaceKey}${routePath}`;

        // Determine categories for this route
        const routeCategories = route.categories || namespace.categories || [defaultCategory];

        const exportedRoute: ExportedRoute = {
            namespace: namespaceKey,
            namespaceName: namespace.name,
            namespaceUrl: namespace.url,
            path: routePath,
            fullPath,
            name: route.name,
            example: route.example,
            description: route.description || namespace.description,
            parameters: route.parameters,
            maintainers: route.maintainers,
            categories: routeCategories,
            features: route.features,
            radar: route.radar,
            lang: namespace.lang,
        };

        // Add route to each of its categories
        for (const category of routeCategories) {
            if (routesByCategory[category]) {
                routesByCategory[category].push(exportedRoute);
            }
        }
    }
}

// Write each category to a separate JSON file
let totalRoutes = 0;
const summary: { category: string; count: number; file: string }[] = [];

for (const category of allCategories) {
    const routes = routesByCategory[category];
    const meta = categoryMeta.find((c) => c.link === `/routes/${category}`);

    const output = {
        category,
        displayName: meta?.en || category,
        displayNameZh: meta?.zh || category,
        icon: meta?.icon || '',
        count: routes.length,
        routes: routes.toSorted((a, b) => a.fullPath.localeCompare(b.fullPath)),
    };

    const fileName = `${category}.json`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

    totalRoutes += routes.length;
    summary.push({
        category: meta?.en || category,
        count: routes.length,
        file: fileName,
    });

    logger.info(`✅ ${fileName}: ${routes.length} routes`);
}

// Write summary/index file
const indexOutput = {
    totalCategories: allCategories.length,
    totalRoutes,
    generatedAt: new Date().toISOString(),
    categories: summary.toSorted((a, b) => b.count - a.count),
};

fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(indexOutput, null, 2));

logger.info(`📊 Summary: ${allCategories.length} categories, ${totalRoutes} routes`);
logger.info(`📁 Output: ${outputDir}`);
