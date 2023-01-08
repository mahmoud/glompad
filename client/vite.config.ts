import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sentryVitePlugin from "@sentry/vite-plugin";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      org: "hatnote",
      project: "glompad",

      // Specify the directory containing build artifacts
      include: "./dist",

      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Optionally uncomment the line below to override automatic release name detection
      // release: process.env.RELEASE,
    }),
  ],
  define: {
    global: "window", // very required for pyscript
  },
  build: {
    sourcemap: true, // Source map generation must be turned on for sentry
    rollupOptions: {
      output: {
        name: "app",
      },
    },
  },
  assetsInclude: ["./src/py/**"],
  optimizeDeps: {
    exclude: [
      "codemirror",
      "@codemirror/language-python",
      "@codemirror/commands",
      "@codemirror/lint",
      "@codemirror/state",
    ],
  },
});
