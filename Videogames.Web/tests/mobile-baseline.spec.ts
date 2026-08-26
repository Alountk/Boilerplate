import { test, expect } from '@playwright/test';

/**
 * Mobile baseline — slice 2.
 *
 * Proves the `mobile-chrome` Playwright project exists and runs at a
 * mobile-first viewport (375×812, Mobile Chrome). Per-page mobile specs land
 * in later slices alongside their page migrations.
 */
test.describe('mobile-chrome baseline', () => {
  test('runs under the mobile viewport with the blueprint data-theme applied', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');

    // 375×812 contract
    const viewport = page.viewportSize();
    expect(viewport).toEqual({ width: 375, height: 812 });
  });
});
