import { test, expect } from '@playwright/test';

test.describe('Final Validation - Analytics Page Error Fix', () => {
  test('Analytics page loads without the projectDistribution.slice error', async ({ page }) => {
    // Monitor for the specific error we fixed
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    // Navigate to analytics page
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // The main issue: should not have projectDistribution.slice error
    const hasSliceError = jsErrors.some(error => 
      error.includes('projectDistribution.slice is not a function')
    );
    expect(hasSliceError).toBe(false);

    // Should not have statusDistribution.map error either
    const hasMapError = jsErrors.some(error => 
      error.includes('statusDistribution.map is not a function')
    );
    expect(hasMapError).toBe(false);

    // Should have no JavaScript errors at all
    expect(jsErrors).toHaveLength(0);

    // Page should load successfully
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('Can navigate to analytics from menu without crashes', async ({ page }) => {
    await page.goto('/');
    
    // Click analytics menu - this used to cause the error
    await page.getByRole('link', { name: 'Analytics' }).click();
    
    // Should navigate successfully
    await page.waitForURL('/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('Analytics page renders basic structure', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Should have the analytics heading
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Should have some analytics content (even if empty)
    // We're not testing specific text since it depends on backend data
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Analytics');
  });
});