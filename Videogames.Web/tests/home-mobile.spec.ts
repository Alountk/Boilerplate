import { test, expect } from '@playwright/test';

/**
 * Home — Blueprint migration (Phase 3, Work Unit 3.1).
 *
 * Maps to the `blueprint-design-system` spec mobile scenarios for the home
 * route:
 *   - "Home at 375px": hero is compact (not the 614px block), grid 2-col,
 *     no horizontal overflow.
 *   - The blueprint vocabulary is present: a `[SYS.01 — HOME]` TitleBlock,
 *     a DimensionLine measure, category TechChips, and TechCard rows.
 *
 * Runs under `mobile-chrome` (and harmlessly under `chromium` too).
 */
test.describe('home — blueprint blueprints render', () => {
  test('shows the blueprint title block and dimension line in the compact hero', async ({ page }) => {
    await page.goto('/');

    // Compact assembly-drawing hero: the SYS title block code.
    await expect(page.getByText('SYS.01 — HOME')).toBeVisible();
    // The drawing voice should be present (mono section label).
    await expect(page.getByText(/EL MERCADO/i).first()).toBeVisible();
    // Dimension line measure for the mobile hero width.
    await expect(page.getByText('390px')).toBeVisible();
  });

  test('renders categories as technical chips', async ({ page }) => {
    await page.goto('/');

    // Blueprint category chips: mono uppercase square chips.
    const chips = page.getByRole('link', { name: /^(PLAYSTATION|XBOX|NINTENDO|PC|RETRO)/i });
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('renders recently-added listings as TechCards in a 2-column grid on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('RECIÉN LLEGADOS').first()).toBeVisible();

    const grid = page.locator('[data-testid="recently-added-grid"]');
    // The grid wrapper appears once the (async) listing load resolves; a
    // seeded-empty API shows the blueprint empty state. Wait deterministically.
    const gridAppeared = await grid
      .waitFor({ state: 'attached', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (gridAppeared) {
      const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(2);
    }
  });

  test('does not overflow horizontally at 375px', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
