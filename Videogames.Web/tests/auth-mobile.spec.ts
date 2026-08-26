import { test, expect } from '@playwright/test';

/**
 * Auth (login/register/confirm) — Blueprint migration (Phase 3, Work Unit 3.5).
 *
 * Maps to the `blueprint-design-system` spec mobile scenario: the legacy
 * blur orbs / indigo gradient backgrounds are replaced by the blueprint
 * grid, forms use mono technical inputs, and blueprint buttons. Social
 * entry stays disabled after restyle.
 */
test.describe('auth — blueprint sign-in sheet', () => {
  test('login renders blueprint form shell, mono inputs and blueprint CTA', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
    await expect(page.locator('[data-testid="auth-shell"]')).toBeVisible();

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /SIGN IN/i })).toBeVisible();
  });

  test('register renders the blueprint form shell with a mono CTA', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('[data-testid="auth-shell"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /CREATE ACCOUNT/i })).toBeVisible();
  });

  test('social entry stays disabled after restyle', async ({ page }) => {
    await page.goto('/login');
    const google = page.getByRole('button', { name: /Google/i }).first();
    await expect(google).toBeVisible();
    await expect(google).toBeDisabled();
  });

  test('confirm page renders the blueprint frame', async ({ page }) => {
    await page.goto('/register/confirm?email=test@example.com&sent=true');
    await expect(page.locator('[data-testid="auth-shell"]')).toBeVisible();
    await expect(page.locator('input[name="verification-code"]')).toBeVisible();
  });
});
