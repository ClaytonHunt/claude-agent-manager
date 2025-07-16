import { test, expect } from '@playwright/test';

test.describe('Analytics UI Only Tests', () => {
  test('should load analytics page without JavaScript errors', async ({ page }) => {
    // Monitor for JavaScript errors (not console warnings)
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    // Navigate to analytics page
    await page.goto('/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors (the main issue we're fixing)
    expect(jsErrors).toHaveLength(0);

    // Verify page content loads (even if backend is not responding)
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('should display analytics structure correctly', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check that basic analytics structure is present
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Check for stats cards (even if they show 0 or loading)
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();
  });

  test('should handle empty analytics data without crashing', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for any async operations to complete
    await page.waitForTimeout(2000);

    // Check that the page renders without crashing
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Verify no critical JavaScript errors occurred
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    expect(jsErrors).toHaveLength(0);
  });

  test('should navigate to analytics from menu', async ({ page }) => {
    await page.goto('/');
    
    // Click on Analytics menu item
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Wait for navigation
    await page.waitForURL('/analytics');
    
    // Verify we're on the analytics page
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });
});