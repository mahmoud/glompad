import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

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
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    crossOriginIsolation(),
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
