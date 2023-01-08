import "./app.css";
import App from "./App.svelte";
import * as Sentry from "@sentry/svelte";

import { padStore } from "./lib/stores";

Sentry.init({
  "dsn": "https://de2babcc4dfe448fa40a614571b35859@o359689.ingest.sentry.io/4504433634508800",
  "tunnel": import.meta.env.PROD ? '/error-report' : 'https://yak.party/error-report'
});

const app = new App({
  target: document.getElementById("app"),
});

app.padStore = padStore;

window.SvelteApp = app;

export default app;
