import './app.css'; 
import App from './App.svelte';
import { padStore } from './lib/stores';

const app = new App({
  target: document.getElementById('app'),
});
app.padStore = padStore;

window.SvelteApp = app;

export default app;
