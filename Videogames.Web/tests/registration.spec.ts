import { test, expect } from '@playwright/test';

const buildMockedAuthResponse = (email: string) => ({
  token: 'mocked-token',
  user: {
    id: '22222222-2222-2222-2222-222222222222',
    firstName: 'Tester',
    lastName: 'Automation',
    email,
    address: '123 Automation St',
    city: 'Test City',
    country: 'Test Country',
    phone: '1234567890',
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

test.describe('User Registration Flow', () => {
  test('should redirect to email confirmation page after successful register', async ({ page }) => {
    const testEmail = `test-${Date.now()}@vmarket.com`;

    await page.route('**/api/Users', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(buildMockedAuthResponse(testEmail)),
      });
    });

    await page.route('**/api/Auth/register-email/send-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sent: true }),
      });
    });

    await page.goto('/register');

    await page.locator('input[name="firstName"]').fill('Tester');
    await page.locator('input[name="lastName"]').fill('Automation');
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');
    await page.locator('input[name="address"]').fill('123 Automation St');
    await page.locator('input[name="city"]').fill('Test City');
    await page.locator('input[name="country"]').fill('Test Country');
    await page.locator('input[name="phone"]').fill('1234567890');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(new RegExp(`/register/confirm\\?email=${encodeURIComponent(testEmail)}&sent=true`));
    await expect(page.getByRole('heading', { name: 'Confirma tu email' })).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test('should redirect with sent=false if code delivery fails', async ({ page }) => {
    const testEmail = `send-fail-${Date.now()}@vmarket.com`;

    await page.route('**/api/Users', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(buildMockedAuthResponse(testEmail)),
      });
    });

    await page.route('**/api/Auth/register-email/send-code', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'smtp unavailable' }),
      });
    });

    await page.goto('/register');

    await page.locator('input[name="firstName"]').fill('Another');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(new RegExp(`/register/confirm\\?email=${encodeURIComponent(testEmail)}&sent=false`));
    await expect(page.getByText('No pudimos enviar el codigo automaticamente. Puedes reenviarlo aqui.')).toBeVisible();
  });

  test('should validate that passwords match', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[name="firstName"]').fill('Mismatch');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill(`mismatch-${Date.now()}@vmarket.com`);
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123?');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});
