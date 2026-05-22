import { test, expect } from '@playwright/test';
import { loginUser } from './support/auth';
import { createItem } from './support/item-creation';

test.describe('Dashboard - My Items', () => {
  test('should display user items in dashboard table', async ({ page }) => {
    // 1. Register and login
    const email = `dashboard-user-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Create Account")');
    
    // Handle email verification if present (may skip or confirm)
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in by checking if we can access protected pages
    await page.goto('/dashboard');
    
    // 2. Create an item first
    await page.goto('/create');
    await page.fill('input[placeholder="English name"]', 'Test Game for Dashboard');
    await page.fill('input[placeholder="Console"]', 'Nintendo Switch');
    await page.fill('input[placeholder*="Price"]', '49.99');
    await page.fill('textarea[placeholder*="Description"]', 'Test item for dashboard display');
    
    // Set condition
    await page.fill('input[type="range"]', '8');
    
    // Click create button
    await page.click('button:has-text("Create")');
    await page.waitForLoadState('networkidle');
    
    // 3. Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify dashboard header
    await expect(page.locator('h1:has-text("Mi Dashboard")')).toBeVisible();
    
    // Verify statistics are displayed
    await expect(page.locator('text=Total de Items')).toBeVisible();
    await expect(page.locator('text=Precio Promedio')).toBeVisible();
    
    // Verify the item appears in the table
    await expect(page.locator('text=Test Game for Dashboard')).toBeVisible();
    await expect(page.locator('text=Nintendo Switch')).toBeVisible();
    await expect(page.locator('text=$49.99')).toBeVisible();
  });

  test('should filter items by search query', async ({ page }) => {
    // Login
    const email = `dashboard-filter-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Create multiple items
    await createItem(page, 'Zelda: Breath of the Wild', 'Nintendo Switch', '59.99');
    await createItem(page, 'Mario Kart 8', 'Nintendo Switch', '49.99');
    await createItem(page, 'Elden Ring', 'PlayStation 5', '69.99');
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test search by name
    await page.fill('input[placeholder*="Buscar"]', 'Zelda');
    await page.waitForTimeout(500); // Wait for filter
    
    await expect(page.locator('text=Zelda: Breath of the Wild')).toBeVisible();
    await expect(page.locator('text=Mario Kart 8')).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder*="Buscar"]', '');
    await page.waitForTimeout(500);
    
    // Test search by console
    await page.fill('input[placeholder*="Buscar"]', 'PlayStation');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Elden Ring')).toBeVisible();
    await expect(page.locator('text=Zelda')).not.toBeVisible();
  });

  test('should filter items by state (condition)', async ({ page }) => {
    // Login
    const email = `dashboard-state-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Create item with good condition
    await createItem(page, 'Good Condition Game', 'Switch', '50', '9');
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Filter by good condition (8-10)
    await page.selectOption('select', 'good');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Good Condition Game')).toBeVisible();
  });

  test('should sort items by different columns', async ({ page }) => {
    // Login
    const email = `dashboard-sort-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Create items with different prices
    await createItem(page, 'Cheap Game', 'Switch', '10.00');
    await createItem(page, 'Expensive Game', 'Switch', '100.00');
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click on Precio header to sort
    await page.click('button:has-text("Precio")');
    await page.waitForTimeout(500);
    
    // Verify items are in the table (order might vary by sorting)
    await expect(page.locator('text=Cheap Game')).toBeVisible();
    await expect(page.locator('text=Expensive Game')).toBeVisible();
  });

  test('should show empty state when no items exist', async ({ page }) => {
    // Login (new user with no items)
    const email = `dashboard-empty-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Go to dashboard
    await page.goto('/dashboard');
    
    // Verify empty state message
    await expect(page.locator('text=No tienes items creados')).toBeVisible();
    await expect(page.locator('button:has-text("Crear tu primer item")')).toBeVisible();
  });

  test('should delete item from dashboard', async ({ page }) => {
    // Login
    const email = `dashboard-delete-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Create an item
    await createItem(page, 'Item to Delete', 'Switch', '29.99');
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify item exists
    await expect(page.locator('text=Item to Delete')).toBeVisible();
    
    // Click delete button
    const deleteButton = page.locator('button[aria-label="Eliminar el item"]').first();
    await deleteButton.click();
    
    // Confirm deletion
    await page.on('dialog', dialog => dialog.accept());
    
    // Verify item is removed
    await page.waitForTimeout(1000); // Wait for deletion to complete
    await expect(page.locator('text=Item to Delete')).not.toBeVisible();
  });

  test('should navigate to dashboard from navbar when logged in', async ({ page }) => {
    // Login
    const email = `navbar-dashboard-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    await loginUser(page, email, password);
    
    // Go to home page
    await page.goto('/');
    
    // Find and click dashboard link in navbar
    const dashboardLink = page.locator('a:has-text("Dashboard")');
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1:has-text("Mi Dashboard")')).toBeVisible();
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
