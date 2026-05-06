import { test, expect } from '@playwright/test';

test('long-running spec is interrupted by timeout and worker recovers', async ({ page, baseURL }) => {
  // This test verifies the automatic timeout (10s) + recovery.
  // The spec runs an infinite loop. After ~11s (10s timeout + 1s grace),
  // the worker should be hard-restarted. The UI should recover to a usable state.
  test.setTimeout(90_000); // generous timeout for Pyodide load + execution + recovery

  await page.goto(baseURL ?? '#');

  // Wait for worker to be ready
  await expect(page.locator('#run-button')).toBeEnabled({ timeout: 60000 });

  // Execute a spec that loops forever (will trigger automatic timeout)
  // Use URL navigation to set spec and target
  const infiniteSpec = encodeURIComponent("exec('while True: pass')");
  const target = encodeURIComponent('{}');
  await page.goto(`${baseURL}#spec=${infiniteSpec}&target=${target}&v=1`);

  // Should see the cancel button appear (worker is running)
  await expect(page.locator('#run-button.cancel')).toBeVisible({ timeout: 10000 });

  // Wait for the timeout to fire and worker to recover
  // 10s timeout + 1s grace + restart time ≈ 15s max
  await expect(page.locator('#run-button:not(.cancel)')).toBeVisible({ timeout: 20000 });

  // Verify recovery: execute a simple spec that should succeed
  const simpleSpec = encodeURIComponent("'hello'");
  const simpleTarget = encodeURIComponent('{}');
  await page.goto(`${baseURL}#spec=${simpleSpec}&target=${simpleTarget}&v=1`);

  // Wait for successful result
  await expect(page.locator('.cm-result-wrap .cm-content')).toContainText('hello', { timeout: 60000 });
});
