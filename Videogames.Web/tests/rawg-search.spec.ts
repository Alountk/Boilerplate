import { test, expect } from '@playwright/test';

const RAWG_TEST_USER = {
  firstName: 'Rawg',
  lastName: 'Tester',
  email: 'rawg-e2e-test@example.com',
  password: 'StrongPassword123!',
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  phone: '+1234567890'
};

test.beforeAll(async ({ request }) => {
  const result = await request.post('http://localhost:5017/api/Users', {
    data: RAWG_TEST_USER
  });

  expect([200, 201, 400]).toContain(result.status());
});

test.describe('RAWG API Search Integration', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock RAWG API Responses
    // Search Response
    await page.route('**/api.rawg.io/api/games?*', async route => {
      const url = route.request().url();
      if (url.includes('search=Zelda')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 123,
                name: 'The Legend of Zelda: Breath of the Wild',
                released: '2017-03-03',
                background_image: 'https://example.com/zelda.jpg',
                platforms: [{ platform: { id: 130, name: 'Nintendo Switch', slug: 'nintendo-switch' } }]
              }
            ]
          })
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ results: [] }) });
      }
    });

    // Details Response
    await page.route('**/api.rawg.io/api/games/123?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'The Legend of Zelda: Breath of the Wild',
          description_raw: 'An epic adventure in the kingdom of Hyrule.',
          released: '2017-03-03',
          metacritic: 97,
          platforms: [{ platform: { id: 130, name: 'Nintendo Switch', slug: 'nintendo-switch' } }]
        })
      });
    });

    // 2. Login with a real user so /create is accessible consistently
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(RAWG_TEST_USER.email);
    await page.locator('input[name="password"]').fill(RAWG_TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15000 });

    await page.goto('/create');
    await expect(page).toHaveURL(/\/create/, { timeout: 15000 });
  });

  test('should search and auto-fill game data from RAWG', async ({ page }) => {
    // 1. Type in English Name
    const nameInput = page.locator('#englishName');
    await nameInput.fill('Zelda');

    // 2. Verify search results dropdown appears
    const resultItem = page.locator('text=Breath of the Wild');
    await expect(resultItem).toBeVisible({ timeout: 5000 });

    // 3. Select the game
    await resultItem.click();

    // 4. Verify fields are auto-populated
    await expect(page.locator('input[name="releaseDate"]')).toHaveValue('2017-03-03');
    await expect(page.locator('input[name="console"]')).toHaveValue('Nintendo Switch');
    await expect(page.locator('textarea#description')).toHaveValue(/Hyrule/);
    
    // Category should be selected (Nintendo usually has id 2)
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toHaveValue('2');
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.locator('#englishName').fill('NonExistentGame12345');

    // Wait a bit for debounce and verify no dropdown appears (or shows "No results")
    // In our implementation, we just don't show the dropdown if results are 0
    await page.waitForTimeout(1000);
    await expect(page.locator('div[role="listbox"]')).not.toBeVisible();
  });

  test('should handle RAWG API failures gracefully', async ({ page }) => {
    // Mock a 500 error for a specific search
    await page.route('**/api.rawg.io/api/games?*search=fail*', route => route.fulfill({ status: 500 }));
    await page.locator('#englishName').fill('fail');

    // Verify app doesn't crash and name field is still usable
    await page.waitForTimeout(1000);
    await expect(page.locator('#englishName')).toHaveValue('fail');
  });
});
