import "./app.css";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.svelte";
import * as Sentry from "@sentry/svelte";

import { padStore } from "./lib/stores";

Sentry.init({
  "dsn": "https://de2babcc4dfe448fa40a614571b35859@o359689.ingest.sentry.io/4504433634508800",
  "tunnel": import.meta.env.PROD ? '/error-report' : 'https://yak.party/error-report',
  "environment": import.meta.env.PROD ? 'production' : 'dev',
});

const app = new App({
  target: document.getElementById("app")!,
});

// Start loading Pyodide in the background immediately
padStore.warmup();

// Register service worker with retry on transient failure
let swRetried = false;
function initServiceWorker() {
  registerSW({
    immediate: true,
    onRegisterError(err: unknown) {
      if (!swRetried) {
        swRetried = true;
        setTimeout(initServiceWorker, 3_000);
      } else {
        console.warn('Service worker registration failed:', err);
      }
    },
  });
}
initServiceWorker();

export default app;
