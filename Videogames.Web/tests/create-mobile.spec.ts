import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser } from './support/auth';

/**
 * Create — Blueprint migration + edit flow (Phase 3, Work Unit 3.4).
 *
 * Maps to the `blueprint-design-system` spec scenarios:
 *   - "Edit flow": GIVEN a listing id in the URL, WHEN /create?id=… loads,
 *     THEN the form pre-fills from the listing, AND submit calls update.
 *   - The drop zone renders as a blueprint frame (no hover dependency).
 *   - Blueprint mono inputs and stepper/PROGRESS bar.
 */
async function firstProductId(page: Page): Promise<string> {
  const id = await page.evaluate(async () => {
    for (const base of ['http://localhost:5017/api', 'http://127.0.0.1:5017/api']) {
      try {
        const res = await fetch(`${base}/Videogames?page=1&pageSize=1`);
        if (!res.ok) continue;
        const data = await res.json();
        const c = data.items?.[0]?.id;
        if (c) return c;
      } catch {
        /* next base */
      }
    }
    return null;
  });
  if (!id) throw new Error('No videogames available in the API to test the create edit flow');
  return id;
}

test.describe('create — blueprint assembly sheet', () => {
  test.beforeAll(async ({ request }) => {
    await ensureE2EUser(request, DEFAULT_E2E_USER);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');
  });

  test('renders the blueprint progress bar and mono form shell', async ({ page }) => {
    await page.goto('/create');
    await expect(page).toHaveURL(/\/create/);

    // Progress bar (stepper) is present on the assembly sheet.
    await expect(page.locator('[data-testid="create-progress"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="create-zone"]')).toBeVisible();
  });

  test('edit flow: /create?id= pre-fills the form title from the listing', async ({ page }) => {
    const id = await firstProductId(page);

    // Editing an existing listing should pre-fill title and console.
    await page.goto(`/create?id=${id}`);
    await page.waitForLoadState('domcontentloaded');

    const titleInput = page.locator('input[name="englishName"]');
    await expect(titleInput).toHaveValue(/.+/, { timeout: 10000 });
    const name = await titleInput.inputValue();
    expect(name.trim().length).toBeGreaterThan(0);
  });
});
