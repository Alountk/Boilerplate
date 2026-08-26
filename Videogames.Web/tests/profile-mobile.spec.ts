import { test, expect } from '@playwright/test';
import { DEFAULT_E2E_USER, ensureE2EUser, loginAsUser } from './support/auth';

/**
 * Profile — Blueprint migration + theme selector (Phase 3, Work Unit 3.6).
 *
 * Maps to the `theme-system` spec scenario "Disabled theme is inert" and
 * "Select Blueprint", plus the profile form migrated to blueprint tokens.
 */
test.describe('profile — blueprint account sheet + theme selector', () => {
  test.beforeAll(async ({ request }) => {
    await ensureE2EUser(request, DEFAULT_E2E_USER);
  });

  test('renders the theme selector with Blueprint active and 01/03 disabled', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');
    await page.goto('/profile');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');

    // Theme cards.
    await expect(page.getByRole('heading', { name: /SELECCIÓN DE TEMA/i })).toBeVisible();
    const blueprintRadio = page.getByRole('radio', { name: 'Blueprint', exact: true });
    await expect(blueprintRadio).toBeVisible();
    await expect(blueprintRadio).toBeChecked();

    // Disabled themes show "próximamente" and cannot be selected.
    await expect(page.getByText('NEON ARCADE').first()).toBeVisible();
    await expect(page.getByText('INDIGO V2').first()).toBeVisible();
    await expect(page.getByText(/PRÓXIMAMENTE/i).first()).toBeVisible();
  });

  test('profile form uses blueprint inputs and persists updates message', async ({ page }) => {
    await loginAsUser(page, DEFAULT_E2E_USER);
    await page.waitForLoadState('networkidle');
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /CONFIGURACIÓN DE CUENTA/i })).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeDisabled();

    // A blueprint-style Save button.
    await expect(page.getByRole('button', { name: /SAVE CHANGES/i })).toBeVisible();
  });
});
