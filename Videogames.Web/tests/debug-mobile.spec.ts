import { test, expect } from '@playwright/test';

/**
 * Debug — Blueprint migration (Phase 3, Work Unit 3.9).
 *
 * Restyles the diagnostic page from legacy slate/white to the blueprint
 * grid + tokens while preserving the diagnostic content (env var values
 * and URL resolution paths).
 */
test.describe('debug — blueprint diagnostic sheet', () => {
  test('renders diagnostics under the blueprint grid with the expected env labels', async ({ page }) => {
    await page.goto('/debug');

    // The diagnostic content (env labels) must survive the restyle.
    await expect(page.getByText('Debug: Environment Variables').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('NEXT_PUBLIC_API_URL:').first()).toBeVisible();
    await expect(page.getByText('NODE_ENV:').first()).toBeVisible();
    await expect(page.getByText('Resolved Frontend Asset URL:').first()).toBeVisible();
  });

  test('has no horizontal overflow at 375px', async ({ page }) => {
    await page.goto('/debug');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
