import { test, expect } from '@playwright/test';

test.beforeAll(async ({ request }) => {
  const result = await request.post('http://localhost:5017/api/Users', {
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
  if (result.status() === 201) {
    console.log('Test user created successfully');
  } else if (result.status() === 400) {
    console.log('Test user already exists or validation failed');
  }
});

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Go to homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Click on Sign in link (top bar)
    await page.click('text=Sign in');
    
    // Fill login form
    await page.locator('input[name="email"]').fill('e2e-test@example.com');
    await page.locator('input[name="password"]').fill('StrongPassword123!');
    
    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Verify we are redirected to home
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Verify user greeting in Navbar
    await expect(page.locator('text=Hi John!')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('e2e-test@example.com');
    await page.locator('input[name="password"]').fill('StrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Verify logged in
    await expect(page.locator('text=Hi John!')).toBeVisible();
    
    // Click Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    // Verify Sign in is visible again
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('text=Hi John!')).not.toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Verify error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
