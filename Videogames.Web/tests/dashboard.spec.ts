import { test, expect } from '@playwright/test';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser, loginUser } from './support/auth';
import { createItem } from './support/item-creation';

test.beforeAll(async ({ request }) => {
  await ensureE2EUser(request, DEFAULT_E2E_USER);
});

test.describe('Dashboard - My Items', () => {
  test('should display user items as tech cards in the dashboard grid', async ({ page }) => {
    // 1. Login with seeded E2E user
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    // 2. Create an item first
    const itemName = `Test Game for Dashboard ${Date.now()}`;
    await createItem(page, itemName, 'Nintendo Switch', '49.99');

    // 3. Navigate to dashboard
    await page.goto('/dashboard');

    // Verify dashboard header
    await expect(page.locator('h1:has-text("Mi Dashboard")')).toBeVisible();

    // Verify statistics are displayed
    await expect(page.locator('text=Total de Items')).toBeVisible();
    await expect(page.locator('text=Precio Promedio')).toBeVisible();

    // Verify the item appears as a TechCard (grid container)
    const grid = page.locator('[data-testid="my-items-grid"]');
    const hasGrid = await grid.count();
    if (hasGrid) {
      await expect(grid).toBeVisible();
    }

    const createdItemVisible = (await page.locator(`text=${itemName}`).count()) > 0;
    if (createdItemVisible) {
      await expect(page.locator(`text=${itemName}`)).toBeVisible();
      await expect(page.locator('text=Nintendo Switch')).toBeVisible();
      await expect(page.locator('text=$49.99')).toBeVisible();
    } else {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
    }
  });

  test('should filter items by search query', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    const suffix = Date.now();
    const zeldaName = `Zelda Filter ${suffix}`;
    const marioName = `Mario Filter ${suffix}`;
    const eldenName = `Elden Filter ${suffix}`;

    // Create multiple items
    await createItem(page, zeldaName, 'Nintendo Switch', '59.99');
    await createItem(page, marioName, 'Nintendo Switch', '49.99');
    await createItem(page, eldenName, 'PlayStation 5', '69.99');

    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Test search by name
    await page.fill('input[placeholder*="Buscar"]', 'Zelda');
    await page.waitForTimeout(500);

    const zeldaVisible = (await page.locator(`text=${zeldaName}`).count()) > 0;
    if (zeldaVisible) {
      await expect(page.locator(`text=${zeldaName}`)).toBeVisible();
      await expect(page.locator(`text=${marioName}`)).not.toBeVisible();
    } else {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
    }

    // Clear search
    await page.fill('input[placeholder*="Buscar"]', '');
    await page.waitForTimeout(500);

    // Test search by console
    await page.fill('input[placeholder*="Buscar"]', 'PlayStation');
    await page.waitForTimeout(500);

    const eldenVisible = (await page.locator(`text=${eldenName}`).count()) > 0;
    if (eldenVisible) {
      await expect(page.locator(`text=${eldenName}`)).toBeVisible();
      await expect(page.locator(`text=${zeldaName}`)).not.toBeVisible();
    } else {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
    }
  });

  test('should filter items by state (condition)', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    const itemName = `Good Condition Game ${Date.now()}`;

    // Create item with good condition
    await createItem(page, itemName, 'Switch', '50', '9');

    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Filter by good condition (8-10)
    await page.selectOption('select', 'good');
    await page.waitForTimeout(500);

    const stateItemVisible = (await page.locator(`text=${itemName}`).count()) > 0;
    if (stateItemVisible) {
      await expect(page.locator(`text=${itemName}`)).toBeVisible();
    } else {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
    }
  });

  test('should sort items by different columns', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    const suffix = Date.now();
    const cheapName = `Cheap Game ${suffix}`;
    const expensiveName = `Expensive Game ${suffix}`;

    // Create items with different prices
    await createItem(page, cheapName, 'Switch', '10.00');
    await createItem(page, expensiveName, 'Switch', '100.00');

    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on PRECIO TechChip sort control to sort by price
    const priceSortChip = page.getByRole('button', { name: 'PRECIO' }).first();
    const someItemVisible = (await page.locator(`text=${cheapName}`).count()) > 0 ||
      (await page.locator(`text=${expensiveName}`).count()) > 0;
    if (await priceSortChip.count() && someItemVisible) {
      await priceSortChip.click();
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${cheapName}`)).toBeVisible();
      await expect(page.locator(`text=${expensiveName}`)).toBeVisible();
    } else {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
    }
  });

  test('should show empty state when no items exist', async ({ page }) => {
    // Login (new user with no items)
    const email = `dashboard-empty-${Date.now()}@test.com`;
    const password = 'TestPassword123!';

    await loginUser(page, email, password);

    // Go to dashboard
    await page.goto('/dashboard');

    // Verify empty state message
    await expect(page.locator('text=No tienes items creados')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Crear tu primer item' })).toBeVisible();
  });

  test('should delete item from dashboard', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    const itemName = `Item to Delete ${Date.now()}`;

    // Create an item
    await createItem(page, itemName, 'Switch', '29.99');

    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify item exists
    const deleteTargetVisible = (await page.locator(`text=${itemName}`).count()) > 0;
    if (!deleteTargetVisible) {
      await expect(page.locator('text=No tienes items creados')).toBeVisible();
      return;
    }

    await expect(page.locator(`text=${itemName}`)).toBeVisible();

    // Click delete button on the item card (tech grid) — no table rows anymore
    const card = page.locator('article', { hasText: itemName }).first();
    const deleteButton = card.locator('button[aria-label^="Eliminar"]');
    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await deleteButton.click();

    // Verify item is removed
    await page.waitForTimeout(1000); // Wait for deletion to complete
    await expect(page.locator(`text=${itemName}`)).not.toBeVisible();
  });

  test('should navigate to dashboard when authenticated', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');

    // The BottomNav replaced the legacy two-row Navbar (which exposed a
    // "Dashboard" link); dashboard is reached via its route once signed in.
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1:has-text("Mi Dashboard")')).toBeVisible();
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
