import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    global: 'window', // very required for pyscript
  },
  build: {
    rollupOptions: {
      output: {
        name: 'app',
      },
    },
  },
});