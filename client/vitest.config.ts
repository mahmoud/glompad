import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['svelte', 'browser', 'import'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
