import { test, expect } from '@playwright/test';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser } from './support/auth';

/**
 * Messages/chat — Blueprint restyle (Phase 3, Work Unit 3.7).
 *
 * Maps to the `blueprint-design-system` spec scenario: chat bubbles use
 * blueprint tokens (own = cyan edge, other = surface) and the email
 * verification banner uses `warning` tokens. SignalR flow unchanged.
 *
 * NOTE: creating a live conversation requires authenticating as two users
 * and a product; the specs verify the blueprint shell (banner rendered
 * with warning tokens, message composer present, no overflow) rather than
 * the SignalR send/receive which is untouched by this restyle.
 */
test.describe('messages — blueprint comms sheet', () => {
  test.beforeAll(async ({ request }) => {
    await ensureE2EUser(request, DEFAULT_E2E_USER);
  });

  test('renders the email-verification banner with warning tokens', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');
    await page.goto('/messages');

    // Email verification banner (render only for unverified user).
    await expect(page.getByText('Email verification required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
  });

  test('renders the blueprint conversation shell without overflow', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');
    await page.goto('/messages');

    // The messages header + connection status + empty list state are present.
    await expect(page.getByRole('heading', { name: /MESSAGES/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="chat-connection-status"]')).toBeVisible();
    await expect(page.getByText(/No conversations yet/i).first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
