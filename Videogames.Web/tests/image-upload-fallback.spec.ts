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
  test.describe.configure({ mode: 'serial' });

  test('should fallback to legacy upload when presigned endpoint fails', async ({ page }) => {
    let presignedRequested = false;
    let legacyRequested = false;

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

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

    await expect(page.locator('img[alt="Game image 1"]')).toBeVisible({ timeout: 10000 });
    expect(presignedRequested).toBeTruthy();
    expect(legacyRequested).toBeTruthy();
  });

  test('should refresh image access url when initial access url fails', async ({ page }) => {
    let metadataRequestCount = 0;

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.route('**/api/Images/presigned-upload', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'presigned unavailable' }),
      });
    });

    await page.route('**/api/Images/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ fileName: 'refresh-image.png' }),
      });
    });

    await page.route('**/api/Images/refresh-image.png/metadata', async (route) => {
      metadataRequestCount += 1;

      if (metadataRequestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            fileName: 'refresh-image.png',
            accessUrl: 'http://cdn.test/expired.png',
            expiresAtUtc: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fileName: 'refresh-image.png',
          accessUrl: 'http://cdn.test/fresh.png',
          expiresAtUtc: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.route('**/expired.png', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'expired',
      });
    });

    await page.route('**/fresh.png', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('fresh-image-content'),
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

    const preview = page.locator('img[alt="Game image 1"]').first();
    await page.locator('#imageUpload').setInputFiles(TEST_IMAGE_PATH);

    await expect(preview).toBeVisible({ timeout: 10000 });
    const previewSrc = await preview.getAttribute('src');
    expect(previewSrc).toBeTruthy();
    expect(metadataRequestCount).toBeGreaterThanOrEqual(2);
  });
});
