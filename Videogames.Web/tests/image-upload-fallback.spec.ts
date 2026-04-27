import { test, expect } from '@playwright/test';
import path from 'path';
import { type E2ECredentials } from './support/auth';

const TEST_IMAGE_PATH = path.resolve(__dirname, 'assets/test-image.png');
const runSuffix = Date.now();
const fallbackE2EUser: E2ECredentials = {
  firstName: 'Fallback',
  lastName: 'Tester',
  email: `fallback-e2e-${runSuffix}@example.com`,
  password: 'StrongPassword123!',
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  phone: '+1234567890',
};
let authToken = '';
let authUser: unknown = null;

test.beforeAll(async ({ request }) => {
  const response = await request.post('http://localhost:5017/api/Users', {
    data: fallbackE2EUser,
  });

  expect(response.status()).toBe(201);
  const body = (await response.json()) as { token: string; user: unknown };
  authToken = body.token;
  authUser = body.user;
});

test.describe('Image Upload Fallback', () => {
  test('should fallback to legacy upload when presigned endpoint fails', async ({ page }) => {
    let presignedRequested = false;
    let legacyRequested = false;

    await page.route('**/api/Images/presigned-upload', async (route) => {
      presignedRequested = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'presigned unavailable' }),
      });
    });

    await page.route('**/api/Images/upload', async (route) => {
      legacyRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ fileName: 'fallback-image.png' }),
      });
    });

    await page.route('**/api/Images/fallback-image.png', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('fake-image-content'),
      });
    });

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: authToken, user: authUser }
    );

    await page.goto('/create');
    await expect(page).toHaveURL(/\/create/, { timeout: 15000 });

    await page.locator('#imageUpload').setInputFiles(TEST_IMAGE_PATH);

    await expect(page.locator('img[alt="Preview 1"]')).toBeVisible({ timeout: 10000 });
    expect(presignedRequested).toBeTruthy();
    expect(legacyRequested).toBeTruthy();
  });
});
