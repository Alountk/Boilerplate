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
  await page.getByLabel('Game Title').fill(itemName);
  await page.getByLabel('Asking Price').fill('45');
  await page.getByLabel('Game Description').fill('This is a test game created by Playwright E2E.');

  await page.locator('details summary', { hasText: 'Advanced Options' }).click();
  await page.locator('input[name="console"]').fill('Test Console');
  await page.locator('input[name="releaseDate"]').fill('2023-01-01');
}

export async function createItem(
  page: Page,
  itemName: string,
  consoleName: string,
  ownPrice: string,
  generalState = '8',
): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  const response = await page.request.post('http://localhost:5017/api/Videogames', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      englishName: itemName,
      names: [],
      qr: '',
      codebar: '',
      console: consoleName,
      assets: [],
      images: [],
      state: 0,
      releaseDate: new Date('2023-01-01').toISOString(),
      versionGame: 'E2E-1.0',
      description: `Auto-created item: ${itemName}`,
      urlImg: '',
      generalState: Number(generalState),
      averagePrice: Number(ownPrice),
      ownPrice: Number(ownPrice),
      acceptOffersRange: 0,
      score: 0,
      category: 2,
      contents: [
        {
          frontalUrl: '',
          backUrl: '',
          rightSideUrl: '',
          leftSideUrl: '',
          topSideUrl: '',
          bottomSideUrl: '',
        },
      ],
    },
  });

  if ([200, 201].includes(response.status())) {
    return true;
  }

  if (response.status() === 403) {
    return false;
  }

  expect([200, 201]).toContain(response.status());
  return false;
}

export async function uploadCoverImage(page: Page, imagePath: string, expectedCount = 1): Promise<void> {
  await page.locator('#imageUpload').setInputFiles(Array(expectedCount).fill(imagePath));

  await expect
    .poll(async () => {
      return page
        .locator('img[alt^="Game image "], img[alt^="Preview "]')
        .count();
    }, { timeout: 10000 })
    .toBe(expectedCount);

  const currentPreviewImages = page.locator('img[alt^="Game image "]');
  if ((await currentPreviewImages.count()) > 0) {
    await expect(currentPreviewImages.first()).toBeVisible({ timeout: 10000 });
    await expect(currentPreviewImages).toHaveCount(expectedCount);
    return;
  }

  const legacyPreviewImages = page.locator('img[alt^="Preview "]');
  await expect(legacyPreviewImages.first()).toBeVisible({ timeout: 10000 });
  await expect(legacyPreviewImages).toHaveCount(expectedCount);
}
