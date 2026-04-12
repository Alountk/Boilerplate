import { expect, type APIRequestContext, type Page } from '@playwright/test';

export type E2ECredentials = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  country: string;
  phone: string;
};

export const DEFAULT_E2E_USER: E2ECredentials = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'e2e-test@example.com',
  password: 'StrongPassword123!',
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  phone: '+1234567890',
};

export async function ensureE2EUser(
  request: APIRequestContext,
  user: E2ECredentials = DEFAULT_E2E_USER,
): Promise<void> {
  const response = await request.post('http://localhost:5017/api/Users', {
    data: user,
  });

  // 201: created, 400: already exists or validation response used by API
  expect([201, 400]).toContain(response.status());
}

export async function loginAsUser(page: Page, user: E2ECredentials = DEFAULT_E2E_USER): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/.*\//, { timeout: 15000 });
  await expect(page.locator(`text=Hi ${user.firstName}!`)).toBeVisible({ timeout: 15000 });
}
