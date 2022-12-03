<script lang="ts">
    import { onMount } from 'svelte';
    import {darkModeStore} from './stores';
  
    const STORAGE_KEY = 'theme';
    const DARK_PREFERENCE = '(prefers-color-scheme: dark)';
  
    const THEMES = {
      DARK: 'dark',
      LIGHT: 'light',
    };
    let currentTheme: string;
  
    const prefersDarkThemes = () => window.matchMedia(DARK_PREFERENCE).matches;
  
    const applyTheme = () => {
      const preferredTheme = prefersDarkThemes() ? THEMES.DARK : THEMES.LIGHT;
  
      currentTheme = localStorage.getItem(STORAGE_KEY) ?? preferredTheme;
  
      if (currentTheme === THEMES.DARK) {
        document.body.classList.remove(THEMES.LIGHT);
        document.body.classList.add(THEMES.DARK);
        darkModeStore.set(true);
      } else {
        document.body.classList.remove(THEMES.DARK);
        document.body.classList.add(THEMES.LIGHT);
        darkModeStore.set(false);
      }
    };
  
    const toggleTheme = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
  
      if (stored) {
        // clear storage
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // store opposite of preference
        localStorage.setItem(STORAGE_KEY, prefersDarkThemes() ? THEMES.LIGHT : THEMES.DARK);
      }
  
      applyTheme();
    };
  
    onMount(() => {
      applyTheme();
      window.matchMedia(DARK_PREFERENCE).addEventListener('change', applyTheme);
    });
  </script>
  
  <label>
    <input type="checkbox" checked={currentTheme === THEMES.DARK} on:click={toggleTheme} />
    Dark mode
  </label>
  
  <style>

  </style>
  