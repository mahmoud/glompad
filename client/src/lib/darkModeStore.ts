import { get, writable, type Writable } from 'svelte/store';

const STORAGE_KEY = 'darkModeEnabled';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';
const prefersDarkMode = () => window.matchMedia(MEDIA_QUERY).matches;

const initialDarkMode = !!localStorage.getItem(STORAGE_KEY) || prefersDarkMode();

export const darkModeStore: Writable<boolean> = writable(initialDarkMode);

window.matchMedia(MEDIA_QUERY).addEventListener('change', (val) => darkModeStore.set(val.matches));

darkModeStore.subscribe((val) => {
    if (val) {
        localStorage.setItem(STORAGE_KEY, 'true');
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
});

const applyDarkMode = (enabled: boolean) => {
    window.console.log(enabled)
    if (enabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
}

applyDarkMode(initialDarkMode);
darkModeStore.subscribe(applyDarkMode);
