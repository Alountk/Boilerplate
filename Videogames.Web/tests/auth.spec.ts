import { test, expect } from '@playwright/test';

const mockedAuthResponse = {
  token: '',
  user: {
    id: '11111111-1111-1111-1111-111111111111',
    firstName: 'Auth',
    lastName: 'Tester',
    email: 'auth-e2e@example.com',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    phone: '+1234567890',
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.route('**/api/Auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedAuthResponse),
      });
    });

    await page.goto('/login');
    await page.locator('input[name="email"]').fill(mockedAuthResponse.user.email);
    await page.locator('input[name="password"]').fill('StrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByText('Hi Auth!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.route('**/api/Auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedAuthResponse),
      });
    });

    await page.goto('/login');
    await page.locator('input[name="email"]').fill(mockedAuthResponse.user.email);
    await page.locator('input[name="password"]').fill('StrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.route('**/api/Auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');
    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
