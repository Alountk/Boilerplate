import { test, expect, type Page } from '@playwright/test';

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXIifQ.c2lnbmF0dXJl';

function buildMockUser(seed: number) {
  return {
    id: `buyer-${seed}`,
    firstName: 'Buyer',
    lastName: 'E2E',
    email: `buyer_${seed}@test.com`,
    address: '123 Buyer St',
    city: 'Buyer City',
    country: 'TestLand',
    phone: '+1234567890',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function setupChatApiMocks(page: Page, seed: number) {
  const videogameId = `game-${seed}`;
  const conversationId = `conv-${seed}`;

  const videogame = {
    id: videogameId,
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
    sellerId: `seller-${seed}`,
  };

  const conversation = {
    id: conversationId,
    buyerId: `buyer-${seed}`,
    buyerName: 'Buyer E2E',
    sellerId: `seller-${seed}`,
    sellerName: 'Seller E2E',
    videogameId,
    videogameName: videogame.englishName,
    videogameUrlImg: '',
    createdAt: new Date().toISOString(),
  };

  await page.route(`**/api/Videogames/${videogameId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(videogame),
    });
  });

  await page.route(`**/api/Chat/conversations/${videogameId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(conversation),
    });
  });

  await page.route('**/api/Chat/conversations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([conversation]),
    });
  });

  await page.route(`**/api/Chat/conversations/${conversationId}/messages`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(`**/api/Chat/conversations/${conversationId}/read`, async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  return { videogameId, conversationId, mockUser: buildMockUser(seed) };
}

test.describe('Real-time Messaging E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const statusLabel = (page: Page, label: string) =>
    page.locator('aside').getByText(label, { exact: true }).first();

  test('should start a conversation from product page', async ({ page }) => {
    const timestamp = Date.now();
    const { videogameId, conversationId, mockUser } = await setupChatApiMocks(page, timestamp);

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: MOCK_JWT, user: mockUser }
    );

    await page.goto(`http://localhost:3000/product/${videogameId}`);

    const contactSellerButton = page.getByRole('button', { name: /Contact Seller/i });
    await expect(contactSellerButton).toBeVisible({ timeout: 30000 });
    await contactSellerButton.click();

    await page.waitForURL(new RegExp(`/messages\\?conv=${conversationId}`), { timeout: 15000 });
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible({ timeout: 20000 });
  });

  test('should recover chat view after going back online', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const { conversationId, mockUser } = await setupChatApiMocks(page, timestamp);

    try {
      await page.addInitScript(
        ({ token, user }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        },
        { token: MOCK_JWT, user: mockUser }
      );

      await page.goto(`/messages?conv=${conversationId}`);

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
