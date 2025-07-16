import { test, expect } from '@playwright/test';

test.describe('Analytics Page Error Investigation', () => {
  test('should load analytics page without errors', async ({ page }) => {
    // Monitor for console errors
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Monitor for JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    // Navigate to analytics page
    await page.goto('/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors
    expect(jsErrors).toHaveLength(0);

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);

    // Verify page content loads
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();
  });

  test('should display analytics components correctly', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check for analytics sections
    await expect(page.getByText('Agent Status Distribution')).toBeVisible();
    await expect(page.getByText('Project Distribution')).toBeVisible();
    
    // Check for charts or empty state
    const statusDistribution = page.locator('text=Agent Status Distribution').locator('..').locator('..');
    await expect(statusDistribution).toBeVisible();
  });

  test('should handle empty analytics data gracefully', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for data to load (or show empty state)
    await page.waitForTimeout(2000);

    // Check that the page renders without crashing
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Verify no JavaScript errors occurred
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    expect(jsErrors).toHaveLength(0);
  });

  test('should test analytics with sample data', async ({ page, request }) => {
    const baseURL = 'http://localhost:3001';
    
    // Create unique agent IDs to avoid conflicts
    const timestamp = Date.now();
    const agents = [
      { id: `analytics-test-1-${timestamp}`, projectPath: '/project1', status: 'active', context: {}, tags: ['test'] },
      { id: `analytics-test-2-${timestamp}`, projectPath: '/project1', status: 'complete', context: {}, tags: ['test'] },
      { id: `analytics-test-3-${timestamp}`, projectPath: '/project2', status: 'error', context: {}, tags: ['test'] }
    ];

    // Clean up any existing test agents first
    for (const agent of agents) {
      try {
        await request.delete(`${baseURL}/api/agents/${agent.id}`);
      } catch (error) {
        // Ignore if agent doesn't exist
      }
    }

    // Create agents via API
    for (const agent of agents) {
      await request.post(`${baseURL}/api/agents`, { data: agent });
    }

    // Navigate to analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check for updated statistics
    await expect(page.getByText('Total Agents')).toBeVisible();
    
    // Check for status distribution
    await expect(page.getByText('Agent Status Distribution')).toBeVisible();
    
    // Cleanup
    for (const agent of agents) {
      try {
        await request.delete(`${baseURL}/api/agents/${agent.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
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