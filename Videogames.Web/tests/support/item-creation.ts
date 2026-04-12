import { expect, type Page } from '@playwright/test';

export async function mockImageUpload(page: Page, fileName: string): Promise<void> {
  await page.route('**/api/Images/upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fileName }),
    });
  });

  await page.route(`**/api/Images/${fileName}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from('fake-image-content'),
    });
  });
}

export async function fillRequiredItemFields(page: Page, itemName: string): Promise<void> {
  await page.getByLabel('English Name').fill(itemName);
  await page.getByLabel('Console').fill('Test Console');
  await page.getByLabel('Release Date').fill('2023-01-01');
  await page.getByLabel('Version').fill('v1.0-Test');
  await page.getByLabel('Category').selectOption('2');
  await page.getByLabel('Average Market Price').fill('50');
  await page.getByLabel('Your Asking Price').fill('45');
  await page.getByLabel('Detailed Description').fill('This is a test game created by Playwright E2E.');
}

export async function uploadCoverImage(page: Page, imagePath: string, expectedCount = 1): Promise<void> {
  await page.locator('#imageUpload').setInputFiles(Array(expectedCount).fill(imagePath));
  await expect(page.locator('img[alt^="Preview "]').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('img[alt^="Preview "]')).toHaveCount(expectedCount);
}
