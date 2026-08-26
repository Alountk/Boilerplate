import { test, expect } from '@playwright/test';

/**
 * Blueprint BottomNav — slice 2 (design system components + nav mount).
 *
 * Maps to the `blueprint-design-system` spec scenario:
 *   - "BottomNav replaces Navbar": HOME/SEARCH/＋/CHAT/ME fixed at bottom,
 *     legacy two-row Navbar removed.
 *
 * Also encodes the functionality-preservation contract for replacing Navbar:
 *   - Sell Now (create) link stays reachable
 *   - Messages (CHAT) reachable
 *   - Auth entry (ME → /login when unauthenticated, /profile when signed in)
 *
 * The nav is the global shell (mobile-first, present at every viewport size),
 * so this spec runs under both the desktop and mobile-chrome projects.
 */
test.describe('Blueprint bottom navigation', () => {
  test('renders fixed bottom nav with all five canonical items on /', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Blueprint bottom navigation' });
    await expect(nav).toBeVisible();

    await expect(nav.getByRole('link', { name: 'HOME' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'SEARCH' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Sell Now' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'CHAT' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'ME' })).toBeVisible();
  });

  test('exposes the correct routing targets', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Blueprint bottom navigation' });
    await expect(nav.getByRole('link', { name: 'HOME' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Sell Now' })).toHaveAttribute('href', '/create');
    await expect(nav.getByRole('link', { name: 'CHAT' })).toHaveAttribute('href', '/messages');
  });

  test('SEARCH is inert (restyled only — no search triggered)', async ({ page }) => {
    await page.goto('/');

    const search = page.getByRole('navigation', { name: 'Blueprint bottom navigation' }).getByRole('button', { name: 'SEARCH' });
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('aria-disabled', 'true');
  });

  test('ME links to /login when unauthenticated', async ({ page }) => {
    await page.goto('/');

    const me = page.getByRole('navigation', { name: 'Blueprint bottom navigation' }).getByRole('link', { name: 'ME' });
    await expect(me).toHaveAttribute('href', '/login');
  });

  test('HOME carries active state when on the home route', async ({ page }) => {
    await page.goto('/');

    const home = page.getByRole('navigation', { name: 'Blueprint bottom navigation' }).getByRole('link', { name: 'HOME' });
    await expect(home).toHaveAttribute('aria-current', 'page');
  });

  test('sits fixed at the bottom of the viewport', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Blueprint bottom navigation' });
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(box!.y + box!.height).toBeCloseTo(viewport!.height, 0);
  });

  test('legacy two-row Navbar is removed from the layout', async ({ page }) => {
    await page.goto('/');

    // Navbar exposed the app-name heading "vMarket" as a top bar; BottomNav does
    // not render a vMarket title.
    await expect(page.getByRole('heading', { name: 'vMarket' })).toHaveCount(0);
  });
});
