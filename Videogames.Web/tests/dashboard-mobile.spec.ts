import { test, expect } from '@playwright/test';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser } from './support/auth';

/**
 * Dashboard — Blueprint migration (Phase 3, Work Unit 3.8).
 *
 * Maps to the `blueprint-design-system` spec mobile scenario for the
 * dashboard ("Panel de control"): stat blocks use mono TechCard styling and
 * listings render as 2-column TechCards (not the legacy overflow-prone
 * table) with ACTIVO status badges.
 *
 * NOTE: the seeded E2E user has an E2E token with `email_verified:false`,
 * and the API's `RequireEmailVerified` gate rejects POST /Videogames with
 * 403, so we cannot create a seller-owned item to assert the ACTIVO badge
 * here. The badge derivation is already covered by `getItemStatus` (exported
 * pure function in MyItemsGrid, slice 2). This spec validates the panel
 * shell, the 2-col card grid, and the blueprint empty state — observable for
 * a user with no verified listings.
 */
test.describe('dashboard — blueprint panel', () => {
  test.beforeAll(async ({ request }) => {
    await ensureE2EUser(request, DEFAULT_E2E_USER);
  });

  test('renders stat cards and tech-card listing grid at 2 columns on mobile', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard');

    // Header + stat cards.
    await expect(page.getByRole('heading', { name: /MI DASHBOARD/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total de Items').first()).toBeVisible();

    // TechCard grid container. The grid renders once the (async) items load
    // resolves; a user with no owned listings (the seeded E2E user cannot
    // create items because the API REQUIRES a verified email — see note) shows
    // the blueprint empty state instead, which is the valid target.
    const grid = page.locator('[data-testid="my-items-grid"]');
    const hasGrid = await grid.count();
    if (hasGrid) {
      await expect(grid).toBeVisible();
      const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(2);
    } else {
      await expect(page.getByText('No tienes items creados').first()).toBeVisible();
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test('renders the blueprint empty state when the seller has no listings', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /MI DASHBOARD/i })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('No tienes items creados').first()).toBeVisible();
  });
});
