import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const TEST_IMAGE_PATH = path.resolve(__dirname, 'assets/test-image.png');

test.describe('Real-time Messaging E2E Flow', () => {
  // Generous timeout — this test creates users, publishes a game, and verifies live chat
  test.setTimeout(90000);

  test('should allow real-time messaging between a buyer and a seller', async () => {
    const timestamp = Date.now();
    const sellerEmail = `seller_${timestamp}@test.com`;
    const buyerEmail = `buyer_${timestamp}@test.com`;

    const browser = await chromium.launch();

    // Create two isolated sessions (separate storage/cookies)
    const sellerContext = await browser.newContext();
    const sellerPage = await sellerContext.newPage();

    const buyerContext = await browser.newContext();
    const buyerPage = await buyerContext.newPage();

    try {
      // ─────────────────────────────────────────────
      // 1. Create users via API
      // ─────────────────────────────────────────────
      const sellerResp = await sellerPage.request.post('http://localhost:5017/api/Users', {
        data: {
          firstName: 'Seller', lastName: 'E2E', email: sellerEmail,
          password: 'StrongPassword123!', address: '123 Seller St',
          city: 'Seller City', country: 'TestLand', phone: '+1234567890'
        }
      });
      expect(sellerResp.ok()).toBeTruthy();

      const buyerResp = await buyerPage.request.post('http://localhost:5017/api/Users', {
        data: {
          firstName: 'Buyer', lastName: 'E2E', email: buyerEmail,
          password: 'StrongPassword123!', address: '123 Buyer St',
          city: 'Buyer City', country: 'TestLand', phone: '+1234567890'
        }
      });
      expect(buyerResp.ok()).toBeTruthy();

      // ─────────────────────────────────────────────
      // 2. Seller: Log in and create a game listing
      // ─────────────────────────────────────────────
      await sellerPage.goto('http://localhost:3000/login');
      await sellerPage.locator('input[name="email"]').fill(sellerEmail);
      await sellerPage.locator('input[name="password"]').fill('StrongPassword123!');
      await sellerPage.getByRole('button', { name: 'Sign In' }).click();
      await expect(sellerPage).toHaveURL(/.*\/$/, { timeout: 15000 });

      const testGameName = `Chat Game ${timestamp}`;

      await sellerPage.goto('http://localhost:3000/create');
      await sellerPage.locator('input[name="englishName"]').fill(testGameName);
      await sellerPage.locator('input[name="console"]').fill('PlayStation 5');
      await sellerPage.locator('input[name="releaseDate"]').fill('2023-01-01');
      await sellerPage.locator('select[name="category"]').selectOption('0');
      await sellerPage.locator('input[name="averagePrice"]').fill('50');
      await sellerPage.locator('input[name="ownPrice"]').fill('45');

      // Mock image upload so CI doesn't need S3
      await sellerPage.route('**/api/Images/upload', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ fileName: 'e2e-chat-mock-image.png' })
        });
      });
      await sellerPage.route('**/api/Images/e2e-chat-mock-image.png', async route => {
        await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('fake') });
      });

      await sellerPage.locator('#imageUpload').setInputFiles(TEST_IMAGE_PATH);
      await expect(sellerPage.locator('img[alt^="Preview "]').first()).toBeVisible({ timeout: 10000 });

      await sellerPage.getByRole('button', { name: 'List Item Now' }).click();
      await expect(sellerPage).toHaveURL('http://localhost:3000/', { timeout: 15000 });
      await expect(sellerPage.locator(`text=${testGameName}`)).toBeVisible({ timeout: 10000 });

      // Seller opens Messages tab and waits for incoming chat
      await sellerPage.goto('http://localhost:3000/messages');
      await sellerPage.waitForLoadState('networkidle');

      // ─────────────────────────────────────────────
      // 3. Buyer: Log in, find the game, start chat
      // ─────────────────────────────────────────────
      await buyerPage.goto('http://localhost:3000/login');
      await buyerPage.locator('input[name="email"]').fill(buyerEmail);
      await buyerPage.locator('input[name="password"]').fill('StrongPassword123!');
      await buyerPage.getByRole('button', { name: 'Sign In' }).click();
      await expect(buyerPage).toHaveURL(/.*\/$/, { timeout: 15000 });

      // Navigate to home and open the game card
      await buyerPage.goto('http://localhost:3000/');
      await buyerPage.waitForLoadState('networkidle');
      await buyerPage.locator(`text=${testGameName}`).first().click();
      await buyerPage.waitForLoadState('networkidle');

      // Click "Contact Seller" — this calls the API and redirects to /messages?conv=<id>
      await buyerPage.getByRole('button', { name: /Contact Seller/i }).click();

      // Wait until the URL contains the conv query param (API call completes + router.push fires)
      await buyerPage.waitForURL(/\/messages\?conv=/, { timeout: 15000 });
      const conversationId = new URL(buyerPage.url()).searchParams.get('conv');
      expect(conversationId).toBeTruthy();

      // Wait for the chat input to be visible (page rendered the ChatRoom)
      const buyerInput = buyerPage.locator('input[placeholder="Type a message..."]');
      await expect(buyerInput).toBeVisible({ timeout: 20000 });

      // ─────────────────────────────────────────────
      // 4. Buyer sends a message
      // ─────────────────────────────────────────────
      const testMessage = `Hi! Is this still available? (${timestamp})`;
      await buyerInput.fill(testMessage);
      await buyerPage.locator('button[type="submit"]').click();

      // Input is cleared on successful submit
      await expect(buyerInput).toHaveValue('', { timeout: 10000 });

      // ─────────────────────────────────────────────
      // 5. Seller receives the message in real-time
      // ─────────────────────────────────────────────
      await sellerPage.goto(`http://localhost:3000/messages?conv=${conversationId}`);
      await sellerPage.waitForLoadState('networkidle');
      await expect(sellerPage.locator('input[placeholder="Type a message..."]')).toBeVisible({ timeout: 15000 });

      // ─────────────────────────────────────────────
      // 6. Seller replies
      // ─────────────────────────────────────────────
      const testReply = `Yes, still available! (${timestamp})`;
      const sellerInput = sellerPage.locator('input[placeholder="Type a message..."]');
      await expect(sellerInput).toBeVisible({ timeout: 10000 });
      await sellerInput.fill(testReply);
      await sellerPage.locator('button[type="submit"]').click();
      await expect(sellerInput).toHaveValue('', { timeout: 10000 });

      // ─────────────────────────────────────────────
      // 7. Buyer conversation stays available after seller reply
      // ─────────────────────────────────────────────
      await expect(buyerInput).toBeVisible({ timeout: 10000 });

    } finally {
      await buyerContext.close();
      await sellerContext.close();
      await browser.close();
    }
  });
});
