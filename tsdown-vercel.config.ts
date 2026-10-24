import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['./lib/server.ts'],
    // Wait for https://github.com/vercel/vercel/pull/14429
    // Then we can set outDir to outputDirectory in vercel.json
    outDir: 'src',
    minify: true,
    shims: true,
    clean: true,
    // copy: [{ from: 'lib/assets', to: 'dist' }],
    deps: {
        onlyBundle: false,
        // Vercel's loader cannot require ESM dependencies from CommonJS packages.
        alwaysBundle: ['sanitize-html', 'htmlparser2'],
    },
});
