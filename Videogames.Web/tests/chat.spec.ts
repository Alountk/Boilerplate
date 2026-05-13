import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

type AuthPayload = {
  token: string;
  user: unknown;
};

async function createChatFixture(request: APIRequestContext, seed: number) {
  const sellerResp = await request.post('http://localhost:5017/api/Users', {
    data: {
      firstName: 'Seller',
      lastName: 'E2E',
      email: `seller_${seed}@test.com`,
      password: 'StrongPassword123!',
      address: '123 Seller St',
      city: 'Seller City',
      country: 'TestLand',
      phone: '+1234567890',
    },
  });
  expect(sellerResp.status()).toBe(201);
  const sellerAuth = (await sellerResp.json()) as AuthPayload;

  const buyerResp = await request.post('http://localhost:5017/api/Users', {
    data: {
      firstName: 'Buyer',
      lastName: 'E2E',
      email: `buyer_${seed}@test.com`,
      password: 'StrongPassword123!',
      address: '123 Buyer St',
      city: 'Buyer City',
      country: 'TestLand',
      phone: '+1234567890',
    },
  });
  expect(buyerResp.status()).toBe(201);
  const buyerAuth = (await buyerResp.json()) as AuthPayload;

  const createGameResp = await request.post('http://localhost:5017/api/Videogames', {
    headers: {
      Authorization: `Bearer ${sellerAuth.token}`,
      'Content-Type': 'application/json',
    },
    data: {
      englishName: `Chat Game ${seed}`,
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

  const startConversationResp = await request.post(`http://localhost:5017/api/Chat/conversations/${createdGame.id}`, {
    headers: {
      Authorization: `Bearer ${buyerAuth.token}`,
    },
  });
  expect(startConversationResp.status()).toBe(200);
  const conversation = (await startConversationResp.json()) as { id: string };

  return {
    sellerAuth,
    buyerAuth,
    createdGame,
    conversation,
  };
}

test.describe('Real-time Messaging E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const statusLabel = (page: Page, label: string) =>
    page.locator('aside').getByText(label, { exact: true }).first();

  test('should start a conversation from product page', async ({ page, request }) => {
    const timestamp = Date.now();

    const { buyerAuth, createdGame } = await createChatFixture(request, timestamp);

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

  test('should recover chat view after going back online', async ({ page, request }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const { buyerAuth, conversation } = await createChatFixture(request, timestamp);

    try {
      await page.addInitScript(
        ({ token, user }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        },
        { token: buyerAuth.token, user: buyerAuth.user }
      );

      await page.goto(`/messages?conv=${conversation.id}`);

      const messageInput = 'input[placeholder="Type a message..."]';
      await expect(page.locator(messageInput)).toBeVisible({ timeout: 20000 });

      await expect
        .poll(async () => {
          const candidates = ['Online', 'Connecting...', 'Reconnecting...', 'Offline'];
          for (const label of candidates) {
            const visible = await statusLabel(page, label).isVisible().catch(() => false);
            if (visible) return label;
          }
          return 'unknown';
        }, { timeout: 20000 })
        .not.toBe('unknown');

      await page.context().setOffline(true);

      await expect
        .poll(async () => {
          const reconnectingVisible = await statusLabel(page, 'Reconnecting...').isVisible().catch(() => false);
          const offlineVisible = await statusLabel(page, 'Offline').isVisible().catch(() => false);
          return reconnectingVisible || offlineVisible;
        }, { timeout: 20000 })
        .toBeTruthy();

      await page.context().setOffline(false);
      await page.reload();
      await expect(page.locator(messageInput)).toBeVisible({ timeout: 30000 });

      await expect
        .poll(async () => {
          const candidates = ['Online', 'Connecting...', 'Reconnecting...', 'Offline'];
          for (const label of candidates) {
            const visible = await statusLabel(page, label).isVisible().catch(() => false);
            if (visible) return label;
          }
          return 'unknown';
        }, { timeout: 20000 })
        .not.toBe('unknown');
    } finally {
      await page.context().setOffline(false).catch(() => {});
    }
  });
});
