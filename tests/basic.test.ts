import { test, expect } from '@playwright/test';

test.describe('Claude Agent Manager', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads and has the correct title
    await expect(page).toHaveTitle(/Claude Agent Manager/);
    
    // Check for main navigation elements
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Logs' })).toBeVisible();
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to agents page
    await page.getByRole('link', { name: 'Agents' }).click();
    
    // Check that we're on the agents page
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
    
    // Should show empty state or agents list
    await expect(page.getByText('No agents found')).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to analytics page
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Check that we're on the analytics page
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Should show analytics cards
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
  });

  test('should navigate to logs page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to logs page
    await page.getByRole('link', { name: 'Logs' }).click();
    
    // Check that we're on the logs page
    await expect(page.getByRole('heading', { name: 'System Logs' })).toBeVisible();
    
    // Should show logs interface
    await expect(page.getByText('No logs available')).toBeVisible();
  });

  test('should display correct stats on dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check for dashboard stats cards
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();
    
    // All stats should show 0 initially
    const statValues = page.locator('[data-testid="stat-value"]');
    await expect(statValues.first()).toHaveText('0');
  });

  test('should handle responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should still be accessible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Content should adapt appropriately
    await expect(page.getByText('Total Agents')).toBeVisible();
  });
});