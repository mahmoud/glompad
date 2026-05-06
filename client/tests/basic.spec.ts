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
  await expect(page.locator('#run-button')).toBeEnabled({ timeout: 60000 });

  await page.getByRole('link', { name: 'Basic Deep Get' }).click();

  await expect(page.locator('.cm-result-wrap .cm-content')).toHaveText('"d"');
});


test('worker loads and run button becomes active', async ({ page, baseURL }) => {
  test.slow();
  await page.goto(baseURL ?? '#');

  // Run button exists but may be disabled while loading
  const runButton = page.locator('#run-button');
  await expect(runButton).toBeVisible();

  // Wait for worker to be ready (button becomes enabled)
  await expect(runButton).toBeEnabled({ timeout: 60000 });
});

test('custom spec execution produces result', async ({ page, baseURL }) => {
  test.slow();
  await page.goto(baseURL ?? '#');

  // Wait for worker ready
  await expect(page.locator('#run-button')).toBeEnabled({ timeout: 60000 });

  // Navigate to a hash with custom spec and target
  await page.goto(`${baseURL}#spec=%27a.b%27&target=%7B%22a%22%3A+%7B%22b%22%3A+42%7D%7D&v=1`);

  // Wait for result to appear
  await expect(page.locator('.cm-result-wrap .cm-content')).toHaveText('42', { timeout: 15000 });
});

test('URL hash state populates inputs', async ({ page, baseURL }) => {
  test.slow();
  const spec = 'T';
  const target = '{"x": 1}';
  const hash = `#spec=${encodeURIComponent(spec)}&target=${encodeURIComponent(target)}&v=1`;

  await page.goto(`${baseURL}${hash}`);

  // Wait for worker ready
  await expect(page.locator('#run-button')).toBeEnabled({ timeout: 60000 });

  // Verify the spec editor contains the spec value
  // CodeMirror renders content as .cm-content with .cm-line children
  const specContent = page.locator('.cm-spec-wrap .cm-content');
  await expect(specContent).toContainText(spec, { timeout: 5000 });
});

test('interrupt button appears during execution', async ({ page, baseURL }) => {
  test.slow();
  await page.goto(baseURL ?? '#');

  // Wait for worker ready
  await expect(page.locator('#run-button')).toBeEnabled({ timeout: 60000 });

  // Set a long-running spec via URL hash (import time and sleep)
  await page.goto(`${baseURL}#spec=__import__('time').sleep(5)+or+'done'&target=%7B%7D&v=1`);

  // The run button should switch to cancel mode while running
  const cancelButton = page.locator('#run-button.cancel');
  await expect(cancelButton).toBeVisible({ timeout: 5000 });
});