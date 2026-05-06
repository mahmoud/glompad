import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite plugin that adds Cross-Origin Isolation headers to the dev server.
 * Required for SharedArrayBuffer (used by Pyodide interrupt).
 *
 * In production, these headers should be set by the web server (nginx).
 */
function crossOriginIsolation(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    crossOriginIsolation(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('pyodide'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-runtime',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: false, // Use static manifest.json in public/
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        name: "app",
      },
    },
  },
  optimizeDeps: {
    exclude: [
      "codemirror",
      "@codemirror/language-python",
      "@codemirror/commands",
      "@codemirror/lint",
      "@codemirror/state",
    ],
  },
  worker: {
    format: 'es',
  },
});
