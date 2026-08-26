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
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: /Sign In/i }).click();
}

export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  const user: E2ECredentials = {
    ...DEFAULT_E2E_USER,
    email,
    password,
    firstName: 'E2E',
    lastName: `User${Date.now()}`,
  };

  await ensureE2EUser(page.request, user);
  await loginAsUser(page, user);
  await page.waitForLoadState('networkidle');
}
