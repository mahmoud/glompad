import './app.css'; 
import App from './App.svelte';
import { specStore } from './lib/stores';
import { writable } from 'svelte/store';

const app = new App({
  target: document.getElementById('app'),
});
app.specStore = specStore;

window.SvelteApp = app;

export default app;
