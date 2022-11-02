import './app.css'; 
import App from './App.svelte';
import { writable } from 'svelte/store';

const app = new App({
  target: document.getElementById('app'),
});

console.log('bbbbbbb');

window.SvelteApp = app;

console.log(window.SvelteApp)

export default app;
