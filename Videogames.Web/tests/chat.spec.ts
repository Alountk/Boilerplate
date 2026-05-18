import { test, expect, type Page } from '@playwright/test';
import crypto from 'node:crypto';

const JWT_SECRET = 'ThisIsAStrongSecretKeyForDevelopmentOnly123!';
const JWT_ISSUER = 'VideogamesAPI';
const JWT_AUDIENCE = 'VideogamesClient';

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function buildSignedJwt(userId: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    exp: nowSeconds + 60 * 60,
    iat: nowSeconds,
    // ClaimTypes.NameIdentifier in .NET
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': userId,
    // Optional claim for diagnostics
    email: `${userId}@test.local`,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${content}.${signature}`;
}

function buildMockUser(seed: number, emailVerified = true) {
  const userId = `11111111-1111-1111-1111-${String(seed).slice(-12).padStart(12, '0')}`;

  return {
    id: userId,
    firstName: 'Buyer',
    lastName: 'E2E',
    email: `buyer_${seed}@test.com`,
    address: '123 Buyer St',
    city: 'Buyer City',
    country: 'TestLand',
    phone: '+1234567890',
    emailVerified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function setupChatApiMocks(page: Page, seed: number, options?: { emailVerified?: boolean }) {
  const videogameId = `game-${seed}`;
  const conversationId = `conv-${seed}`;
  const emailVerified = options?.emailVerified ?? true;
  const mockUser = buildMockUser(seed, emailVerified);

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
    buyerId: mockUser.id,
    buyerName: 'Buyer E2E',
    sellerId: '22222222-2222-2222-2222-222222222222',
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

  return { videogameId, conversationId, mockUser };
}

test.describe('Real-time Messaging E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const statusLabel = (page: Page, label: string) =>
    page.getByTestId('chat-connection-status').filter({ hasText: label }).first();

  test('should start a conversation from product page', async ({ page }) => {
    const timestamp = Date.now();
    const { videogameId, conversationId, mockUser } = await setupChatApiMocks(page, timestamp);

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: buildSignedJwt(mockUser.id), user: mockUser }
    );

    await page.goto(`http://localhost:3000/product/${videogameId}`);

    const contactSellerButton = page.getByRole('button', { name: /Contact Seller/i });
    await expect(contactSellerButton).toBeVisible({ timeout: 30000 });
    await contactSellerButton.click();

    await page.waitForURL(new RegExp(`/messages\\?conv=${conversationId}`), { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Seller E2E' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible({ timeout: 20000 });
  });

  test('should show verification warning when user email is not verified', async ({ page }) => {
    const timestamp = Date.now();
    const { conversationId, mockUser } = await setupChatApiMocks(page, timestamp, { emailVerified: false });

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: buildSignedJwt(mockUser.id), user: mockUser }
    );

    await page.goto(`/messages?conv=${conversationId}`);
    await expect(page.getByText('Email verification required')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible({ timeout: 20000 });
  });

  test('should enable send button only when message input has content', async ({ page }) => {
    const timestamp = Date.now();
    const { conversationId, mockUser } = await setupChatApiMocks(page, timestamp);

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: buildSignedJwt(mockUser.id), user: mockUser }
    );

    await page.goto(`/messages?conv=${conversationId}`);

    const input = page.locator('input[placeholder="Type a message..."]');
    const submitButton = page.locator('footer button[type="submit"]');

    await expect(input).toBeVisible({ timeout: 20000 });
    await expect(submitButton).toBeDisabled();

    await input.fill('   ');
    await expect(submitButton).toBeDisabled();

    await input.fill('Hello from chat smoke test');
    await expect(submitButton).toBeEnabled();
  });

  test('should keep messages page read-only when user is not authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await page.goto('/messages');

    await expect(page.getByText('No conversations yet. Start one from a product details page!')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input[placeholder="Type a message..."]')).toHaveCount(0);
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
        { token: buildSignedJwt(mockUser.id), user: mockUser }
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
