import { test, expect } from '@playwright/test';

test.describe('RAWG API Search Integration', () => {
  test.beforeEach(async ({ page }) => {
    // 1. We need to be logged in to access the create page
    // Mocking the auth state in localStorage is faster than performing a full login
    await page.goto('/');
    await page.evaluate(() => {
      const user = {
        id: '11111111-1111-1111-1111-111111111111',
        firstName: 'Tester',
        lastName: 'User',
        email: 'tester@example.com'
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // 2. Mock RAWG API Responses
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
                platforms: [{ platform: { name: 'Nintendo Switch' } }]
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
          platforms: [{ platform: { name: 'Nintendo Switch' } }]
        })
      });
    });
  });

  test('should search and auto-fill game data from RAWG', async ({ page }) => {
    await page.goto('/create');

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
    await expect(page.locator('input[name="console"]')).toHaveValue('Nintendo'); // Mapped from Nintendo Switch
    await expect(page.locator('[name="description"]')).toHaveValue(/Hyrule/);
    
    // Category should be selected (Nintendo usually has id 2)
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toHaveValue('2');
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/create');

    await page.locator('#englishName').fill('NonExistentGame12345');

    // Wait a bit for debounce and verify no dropdown appears (or shows "No results")
    // In our implementation, we just don't show the dropdown if results are 0
    await page.waitForTimeout(1000);
    await expect(page.locator('div[role="listbox"]')).not.toBeVisible();
  });

  test('should handle RAWG API failures gracefully', async ({ page }) => {
    // Mock a 500 error for a specific search
    await page.route('**/api.rawg.io/api/games?*search=fail*', route => route.fulfill({ status: 500 }));

    await page.goto('/create');
    await page.locator('#englishName').fill('fail');

    // Verify app doesn't crash and name field is still usable
    await page.waitForTimeout(1000);
    await expect(page.locator('#englishName')).toHaveValue('fail');
  });
});
