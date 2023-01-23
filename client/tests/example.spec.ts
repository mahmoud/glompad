import { test, expect } from '@playwright/test';

test('has title', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? '#');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/glompad/);
});

test('about link', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? '#');

  await expect(page.locator('.modal')).toHaveCount(0);
  await page.getByRole('link', { name: 'About' }).click();

  // Expects the URL to contain intro.
  await expect(page.locator('.modal')).toHaveText(/Pyodide/);
});
