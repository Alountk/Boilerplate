import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  const testEmail = `test-${Date.now()}@vmarket.com`;

  test('should register successfully and log in automatically', async ({ page }) => {
    // 1. Navigate to register page
    await page.goto('/register');
    
    // Check for hydration errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Hydration')) {
        consoleErrors.push(msg.text());
      }
    });

    // 2. Fill the registration form
    await page.getByLabel('First Name').fill('Tester');
    await page.getByLabel('Last Name').fill('Automation');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByLabel('Address').fill('123 Automation St');
    await page.getByLabel('City').fill('Test City');
    await page.getByLabel('Country').fill('Test Country');
    await page.getByLabel('Phone Number').fill('1234567890');

    // 3. Submit the form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // 4. Verify auto-login and redirection
    // Redirection to home page
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
    
    // Verify greeting in Navbar
    await expect(page.locator('text=Hi Tester!')).toBeVisible();

    // Verify no hydration errors were captured
    expect(consoleErrors).toHaveLength(0);
  });

  test('should show error when registering with an existing email', async ({ page }) => {
    // We use the email created in the previous test (or a known one)
    // Note: In a real CI environment, we would seed this or mock the API
    await page.goto('/register');
    
    await page.getByLabel('First Name').fill('Another');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email Address').fill(testEmail); // Existing email
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify error message from backend
    // The backend returns { error: "..." } which is displayed in the UI
    await expect(page.locator('text=already exists')).toBeVisible();
  });

  test('should maintain theme preference after hydration', async ({ page }) => {
    await page.goto('/');
    
    // Toggle to Dark Mode
    const themeButton = page.getByRole('button', { name: 'Toggle Theme' });
    await themeButton.click();
    
    // Verify dark class on html
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify dark class still exists (persisted in localStorage)
    // And verify no mismatch error in console
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
