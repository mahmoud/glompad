import { test, expect } from '@playwright/test';

test('service worker registers after page load', async ({ page, baseURL }) => {
  test.slow();
  await page.goto(baseURL ?? '#');

  // Wait for SW registration (the PWA plugin auto-registers)
  const hasServiceWorker = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    // Wait up to 10s for a registration to appear
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  });

  expect(hasServiceWorker).toBe(true);
});

test('manifest.json is accessible', async ({ page, baseURL }) => {
  const manifestUrl = new URL('/manifest.json', baseURL ?? 'http://localhost:5775');
  const response = await page.request.get(manifestUrl.toString());

  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.name).toContain('Glompad');
  expect(body.icons).toBeDefined();
  expect(body.icons.length).toBeGreaterThan(0);
});
