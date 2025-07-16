import { test, expect } from '@playwright/test';

test.describe('Analytics Page Tests', () => {
  test('should display analytics with no data', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check that the analytics page loads
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    
    // Check for stat cards
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();
    
    // Check for charts section
    await expect(page.getByText('Agent Status Distribution')).toBeVisible();
    await expect(page.getByText('Project Distribution')).toBeVisible();
  });

  test('should handle empty analytics data without errors', async ({ page }) => {
    await page.goto('/analytics');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check that no JavaScript errors occurred
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Wait a bit to catch any async errors
    await page.waitForTimeout(1000);
    
    // Should not have the analytics.statusDistribution.map error
    expect(errors).not.toContain(expect.stringContaining('analytics.statusDistribution.map is not a function'));
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('should display analytics with sample data', async ({ page, request }) => {
    const baseURL = 'http://localhost:3001';
    
    // Create test agents to populate analytics
    const agents = [
      { id: 'analytics-1', projectPath: '/project1', status: 'active', context: {}, tags: ['test'] },
      { id: 'analytics-2', projectPath: '/project1', status: 'complete', context: {}, tags: ['test'] },
      { id: 'analytics-3', projectPath: '/project2', status: 'error', context: {}, tags: ['test'] },
      { id: 'analytics-4', projectPath: '/project2', status: 'active', context: {}, tags: ['test'] }
    ];

    // Create all agents
    for (const agent of agents) {
      await request.post(`${baseURL}/api/agents`, { data: agent });
    }

    // Add some log entries
    await request.post(`${baseURL}/api/agents/analytics-1/logs`, {
      data: { level: 'info', message: 'Test log 1', metadata: {} }
    });
    await request.post(`${baseURL}/api/agents/analytics-2/logs`, {
      data: { level: 'info', message: 'Test log 2', metadata: {} }
    });

    // Navigate to analytics page
    await page.goto('/analytics');
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Check that stats are updated
    await expect(page.getByText('Total Agents')).toBeVisible();
    
    // Check for status distribution
    await expect(page.getByText('Agent Status Distribution')).toBeVisible();
    
    // Should show different statuses
    await expect(page.getByText('active')).toBeVisible();
    await expect(page.getByText('complete')).toBeVisible();
    await expect(page.getByText('error')).toBeVisible();
    
    // Check for project distribution
    await expect(page.getByText('Project Distribution')).toBeVisible();
    
    // Should show different projects
    await expect(page.getByText('/project1')).toBeVisible();
    await expect(page.getByText('/project2')).toBeVisible();
    
    // Cleanup
    for (const agent of agents) {
      await request.delete(`${baseURL}/api/agents/${agent.id}`);
    }
  });

  test('should update analytics in real-time', async ({ page, request }) => {
    const baseURL = 'http://localhost:3001';
    
    await page.goto('/analytics');
    
    // Initially should show no agents
    await expect(page.getByText('Total Agents')).toBeVisible();
    
    // Create an agent
    const agentData = {
      id: 'realtime-agent',
      projectPath: '/test/project',
      status: 'active',
      context: {},
      tags: ['realtime']
    };
    
    await request.post(`${baseURL}/api/agents`, { data: agentData });
    
    // Refresh the page to see updated data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should now show the agent data
    await expect(page.getByText('Agent Status Distribution')).toBeVisible();
    await expect(page.getByText('active')).toBeVisible();
    
    // Cleanup
    await request.delete(`${baseURL}/api/agents/${agentData.id}`);
  });
});