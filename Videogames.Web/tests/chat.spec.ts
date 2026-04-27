import { test, expect } from '@playwright/test';

test.describe('Real-time Messaging E2E Flow', () => {
  test('should start a conversation from product page', async ({ page, request }) => {
    const timestamp = Date.now();

    const sellerResp = await request.post('http://localhost:5017/api/Users', {
      data: {
        firstName: 'Seller',
        lastName: 'E2E',
        email: `seller_${timestamp}@test.com`,
        password: 'StrongPassword123!',
        address: '123 Seller St',
        city: 'Seller City',
        country: 'TestLand',
        phone: '+1234567890',
      },
    });
    expect(sellerResp.status()).toBe(201);
    const sellerAuth = (await sellerResp.json()) as { token: string };

    const buyerResp = await request.post('http://localhost:5017/api/Users', {
      data: {
        firstName: 'Buyer',
        lastName: 'E2E',
        email: `buyer_${timestamp}@test.com`,
        password: 'StrongPassword123!',
        address: '123 Buyer St',
        city: 'Buyer City',
        country: 'TestLand',
        phone: '+1234567890',
      },
    });
    expect(buyerResp.status()).toBe(201);
    const buyerAuth = (await buyerResp.json()) as { token: string; user: unknown };

    const createGameResp = await request.post('http://localhost:5017/api/Videogames', {
      headers: {
        Authorization: `Bearer ${sellerAuth.token}`,
        'Content-Type': 'application/json',
      },
      data: {
        englishName: `Chat Game ${timestamp}`,
        names: [],
        qr: '',
        codebar: '',
        console: 'PlayStation 5',
        assets: [],
        images: [],
        state: 0,
        releaseDate: '2023-01-01T00:00:00.000Z',
        versionGame: 'E2E',
        description: 'Chat flow generated listing',
        urlImg: '',
        generalState: 8,
        averagePrice: 50,
        ownPrice: 45,
        acceptOffersRange: 0,
        score: 80,
        category: 0,
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
    expect(createGameResp.status()).toBe(201);
    const createdGame = (await createGameResp.json()) as { id: string };

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: buyerAuth.token, user: buyerAuth.user }
    );

    await page.goto(`http://localhost:3000/product/${createdGame.id}`);

    const contactSellerButton = page.getByRole('button', { name: /Contact Seller/i });
    await expect(contactSellerButton).toBeVisible({ timeout: 30000 });
    await contactSellerButton.click();

    await page.waitForURL(/\/messages\?conv=/, { timeout: 15000 });
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible({ timeout: 20000 });
  });
});
