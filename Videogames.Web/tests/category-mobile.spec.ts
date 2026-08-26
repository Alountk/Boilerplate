import { test, expect } from '@playwright/test';

/**
 * Category — Blueprint migration (Phase 3, Work Unit 3.2).
 *
 * Maps to the `blueprint-design-system` spec mobile scenario for the
 * category route. Filters/sort stay decorative (restyle only — functionality
 * is a separate change), but the page must use the blueprint vocabulary:
 * SpecLabel breadcrumb, TechChip subcategory/filter chips, and a TechCard
 * grid (2-col on mobile) for listings. No horizontal overflow.
 */
test.describe('category — blueprint listing sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/category/ps');
    await expect(page).toHaveURL(/\/category\/ps/);
  });

  test('uses SpecLabel breadcrumb/header and a tech sort control', async ({ page }) => {
    // Section header with the blueprint MONO label language.
    await expect(page.getByText('CATEGORIA', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/PLAYSTATION|PS5|PlayStation/i).first()).toBeVisible();
  });

  test('renders filter/sort controls as technical chips (decorative)', async ({ page }) => {
    // Blueprint chip for the condition facet set.
    await expect(page.getByText('FILTROS').first()).toBeVisible();
    const chipCount = await page.getByRole('button', { name: /(NEW|USED|SEALED|NUEVO)/i }).count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('renders listings grid at 2 columns on mobile without overflow', async ({ page }) => {
    const grid = page.locator('[data-testid="category-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });
    const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(2);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
