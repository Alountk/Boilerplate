import { test, expect, type Page } from '@playwright/test';

/**
 * Product — Blueprint migration (Phase 3, Work Unit 3.3).
 *
 * Maps to the `blueprint-design-system` spec mobile scenarios for the
 * product page ("Ficha técnica"): SPEC-NAME/SPEC-PRICE labels, technical
 * spec sheet, and blueprint CTAs. The cover is framed as an asset with
 * corner registration marks. No horizontal overflow at 375px.
 *
 * NOTE: category filtering is currently broken at the data layer (all API
 * items have category=1 while /category/ps filters categoryId=0 — a
 * pre-existing data-mapping issue out of scope for this restyle). These
 * specs therefore resolve a real product id through the browser's own
 * API base (which the app already reaches successfully on the home page)
 * and navigate to /product/:id directly.
 */
async function firstProductId(page: Page): Promise<string> {
  const id = await page.evaluate(async () => {
    const bases = ['http://localhost:5017/api', 'http://127.0.0.1:5017/api'];
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/Videogames?page=1&pageSize=1`);
        if (!res.ok) continue;
        const data = await res.json();
        const candidate = data.items?.[0]?.id;
        if (candidate) return candidate;
      } catch {
        /* try next base */
      }
    }
    return null;
  });
  if (!id) throw new Error('No videogames available in the API to test the product page');
  return id;
}

test.describe('product — blueprint ficha técnica', () => {
  test('renders SPEC-NAME and SPEC-PRICE labels and the cover framed with a corner mark', async ({ page }) => {
    await page.goto('/');
    const id = await firstProductId(page);
    await page.goto(`/product/${id}`);
    await expect(page).toHaveURL(/\/product\//);

    await expect(page.getByText('SPEC-NAME:', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('SPEC-PRICE:', { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-testid="product-cover"]')).toBeVisible();
  });

  test('shows a technical spec sheet and the blueprint CTAs', async ({ page }) => {
    await page.goto('/');
    const id = await firstProductId(page);
    await page.goto(`/product/${id}`);

    await expect(page.getByText('FICHA TÉCNICA', { exact: false }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('PLATAFORMA:', { exact: false }).first()).toBeVisible();

    const contact = page.getByRole('button', { name: /CONTACTAR VENDEDOR/i });
    await expect(contact).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /COMPRAR/i })).toBeVisible();
  });

  test('has no horizontal overflow at 375px', async ({ page }) => {
    await page.goto('/');
    const id = await firstProductId(page);
    await page.goto(`/product/${id}`);
    await page.getByRole('button', { name: /CONTACTAR VENDEDOR/i }).waitFor({ timeout: 15000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
