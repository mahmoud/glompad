import { test, expect } from '@playwright/test';

test('has title', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? '#');

  await expect(page).toHaveTitle(/glompad/);
});

test('about link', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? '#');

  await expect(page.locator('.modal')).toHaveCount(0);
  await page.getByRole('link', { name: 'About' }).click();

  await expect(page.locator('.modal')).toHaveText(/Pyodide/);
});

test('basic deep get link', async ({ page, baseURL }) => {
  test.slow();
  await page.goto(baseURL ?? '#');
  await expect(page.locator('#python-ready')).not.toBeEmpty({timeout: 60000});

  await page.getByRole('link', { name: 'Basic Deep Get' }).click();

  await expect(page.locator('.cm-result-wrap .cm-content')).toHaveText('"d"');
});
