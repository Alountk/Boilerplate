import { test, expect } from '@playwright/test';
import path from 'path';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser } from './support/auth';
import { fillRequiredItemFields, mockImageUpload, uploadCoverImage } from './support/item-creation';

const TEST_IMAGE_PATH = path.resolve(__dirname, 'assets/test-image.png');

test.beforeAll(async ({ request }) => {
  await ensureE2EUser(request, DEFAULT_E2E_USER);
});

test.describe('Marketplace Flow', () => {
  test('should display hero section and categories on home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify hero text
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify some categories
    await expect(page.getByRole('heading', { level: 3, name: 'PlayStation' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Nintendo' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Xbox' })).toBeVisible();
  });

  test('should navigate to category and show subcategories', async ({ page }) => {
    await page.goto('/');
    
    // Click PlayStation category link directly
    await page.click('a[href="/category/ps"]');
    
    // Verify redirection to category page
    await expect(page).toHaveURL(/\/category\/ps/);
    
    // Check if the main heading is PlayStation
    await expect(page.getByRole('heading', { level: 1, name: 'PlayStation' })).toBeVisible();
    
    // Verify subcategories are visible in the sidebar
    await expect(page.locator('aside')).toContainText('Videogames');
  });

  test('should require login to access Sell page', async ({ page }) => {
    await page.goto('/create');

    // The app currently shows the login view even if URL transition is not immediate
    await expect(page.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should allow listing an item after login', async ({ page }) => {
    // 1. Login
    await loginAsUser(page, DEFAULT_E2E_USER);
    
    // Extra safety: ensure the API/Backend session is also ready if possible
    // (In this case, waiting for the UI greeting is usually sufficient)
    await page.waitForLoadState('networkidle');
    
    // Ensure localstorage is synced before moving to the next page
    await page.waitForFunction(() => localStorage.getItem('user') !== null);
    
    // 2. Go to Sell
    // Using click to maintain session context better than hard navigation
    await page.getByRole('link', { name: 'Sell', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*create/);
    
    // 3. Fill the form
    await fillRequiredItemFields(page, 'E2E Test Game');
    
    // Mock image upload response for CI environment
    await mockImageUpload(page, 'e2e-mock-image-guid.png');

    // Upload multiple cover images
    await uploadCoverImage(page, TEST_IMAGE_PATH, 2);
    
    // Submit
    await page.getByRole('button', { name: 'List Item Now' }).click();
    
    // 4. Verify redirection to home
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should let a registered user create an item and see it listed', async ({ page }) => {
    const uniqueItemName = `E2E Created Item ${Date.now()}`;

    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.getByRole('link', { name: 'Sell', exact: true }).click();
    await expect(page).toHaveURL(/.*create/, { timeout: 15000 });

    await fillRequiredItemFields(page, uniqueItemName);
    await mockImageUpload(page, 'e2e-created-item-image.png');
    await uploadCoverImage(page, TEST_IMAGE_PATH, 1);

    await page.getByRole('button', { name: 'List Item Now' }).click();
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15000 });

    await expect(page.getByRole('heading', { level: 3, name: uniqueItemName }).first()).toBeVisible({ timeout: 15000 });
  });
});
