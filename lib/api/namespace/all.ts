import type { RouteHandler } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';

import { ensureAllLoaded, namespaces } from '@/registry';

const route = createRoute({
    method: 'get',
    path: '/namespace',
    tags: ['Namespace'],
    responses: {
        200: {
            description: 'Information about all namespaces',
        },
    },
});

const handler: RouteHandler<typeof route> = async (ctx) => {
    await ensureAllLoaded();
    return ctx.json(namespaces);
};

export { handler, route };
