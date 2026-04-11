import { test, expect } from '@playwright/test';

test.beforeAll(async ({ request }) => {
  await request.post('http://localhost:5017/api/Users', {
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'e2e-test@example.com',
      password: 'StrongPassword123!',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      phone: '+1234567890'
    }
  });
});

test.describe('Marketplace Flow', () => {
  test('should display hero section and categories on home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify hero text
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify some categories
    await expect(page.locator('text=PlayStation')).toBeVisible();
    await expect(page.locator('text=Nintendo')).toBeVisible();
    await expect(page.locator('text=Xbox')).toBeVisible();
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
    
    // Verify redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow listing an item after login', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('e2e-test@example.com');
    await page.getByLabel('Password').fill('StrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for redirection and session visibility in Navbar
    await expect(page).toHaveURL(/.*\//, { timeout: 15000 });
    await expect(page.locator('text=Hi John!')).toBeVisible({ timeout: 15000 });
    
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
    await page.getByLabel('English Name').fill('E2E Test Game');
    await page.getByLabel('Console').fill('Test Console');
    await page.getByLabel('Release Date').fill('2023-01-01');
    await page.getByLabel('Version').fill('v1.0-Test');
    
    // Select category (Nintendo is value 2)
    await page.getByLabel('Category').selectOption('2');
    
    // Fill prices
    await page.getByLabel('Average Market Price').fill('50');
    await page.getByLabel('Your Asking Price').fill('45');
    
    // Fill description
    await page.getByLabel('Detailed Description').fill('This is a test game created by Playwright E2E.');
    
    // Mock image upload response for CI environment
    await page.route('**/api/Images/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ fileName: 'e2e-mock-image-guid.png' }),
      });
    });

    // Mock image retrieval response (since we use a fake filename)
    await page.route('**/api/Images/e2e-mock-image-guid.png', async route => {
      // Return a 302 redirect to a placeholder, or just 200 with dummy content
      // Since frontend follows redirect, mocking 200 with image content is easier for test
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('fake-image-content'), // Minimal content
      });
    });

    // Upload multiple cover images
    await page.locator('#imageUpload').setInputFiles([
      'tests/assets/test-image.png',
      'tests/assets/test-image.png', // Using same image twice for testing
    ]);
    
    // Wait for uploads to complete - should see 2 image previews in grid
    // Use specific alt text selector since .grid > div is too generic
    await expect(page.locator('img[alt^="Preview "]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('img[alt^="Preview "]')).toHaveCount(2);
    
    // Submit
    await page.getByRole('button', { name: 'List Item Now' }).click();
    
    // 4. Verify redirection to home
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
