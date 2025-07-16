import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3001';

  test('should get healthy status from health endpoint', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('0.1.0');
  });

  test('should handle agents CRUD operations', async ({ request }) => {
    // Create an agent with unique ID
    const timestamp = Date.now();
    const agentData = {
      id: `test-agent-api-${timestamp}`,
      projectPath: '/test/project',
      status: 'active',
      context: { task: 'test task' },
      tags: ['test', 'api']
    };

    const createResponse = await request.post(`${baseURL}/api/agents`, {
      data: agentData
    });
    expect(createResponse.status()).toBe(201);
    
    const createdAgent = await createResponse.json();
    expect(createdAgent.id).toBe(`test-agent-api-${timestamp}`);
    expect(createdAgent.status).toBe('idle');

    // Get the agent
    const getResponse = await request.get(`${baseURL}/api/agents/${agentData.id}`);
    expect(getResponse.status()).toBe(200);
    
    const agent = await getResponse.json();
    expect(agent.id).toBe(`test-agent-api-${timestamp}`);
    expect(agent.projectPath).toBe('/test/project');

    // Update the agent
    const updateData = {
      status: 'complete',
      context: { task: 'updated task', result: 'success' }
    };

    const updateResponse = await request.put(`${baseURL}/api/agents/${agentData.id}`, {
      data: updateData
    });
    expect(updateResponse.status()).toBe(200);
    
    const updatedAgent = await updateResponse.json();
    expect(updatedAgent.status).toBe('complete');
    expect(updatedAgent.context.result).toBe('success');

    // Delete the agent
    const deleteResponse = await request.delete(`${baseURL}/api/agents/${agentData.id}`);
    expect(deleteResponse.status()).toBe(204);

    // Verify deletion
    const getDeletedResponse = await request.get(`${baseURL}/api/agents/${agentData.id}`);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('should handle agent logs', async ({ request }) => {
    // Create an agent first
    const timestamp = Date.now();
    const agentData = {
      id: `test-agent-logs-${timestamp}`,
      projectPath: '/test/project',
      status: 'active',
      context: { task: 'test task' },
      tags: ['test', 'logs']
    };

    await request.post(`${baseURL}/api/agents`, {
      data: agentData
    });

    // Add log entries
    const logData = {
      level: 'info',
      message: 'Test log message',
      metadata: { timestamp: new Date().toISOString() }
    };

    const logResponse = await request.post(`${baseURL}/api/agents/${agentData.id}/logs`, {
      data: logData
    });
    expect(logResponse.status()).toBe(201);

    // Get agent logs
    const getLogsResponse = await request.get(`${baseURL}/api/agents/${agentData.id}/logs`);
    expect(getLogsResponse.status()).toBe(200);
    
    const logs = await getLogsResponse.json();
    expect(logs.length).toBeGreaterThan(0);
    // The first log is the registration log, the second is our test log
    expect(logs[logs.length - 1].message).toBe('Test log message');

    // Cleanup
    await request.delete(`${baseURL}/api/agents/${agentData.id}`);
  });

  test('should handle agent status updates', async ({ request }) => {
    // Create an agent
    const timestamp = Date.now();
    const agentData = {
      id: `test-agent-status-${timestamp}`,
      projectPath: '/test/project',
      status: 'idle',
      context: { task: 'test task' },
      tags: ['test', 'status']
    };

    await request.post(`${baseURL}/api/agents`, {
      data: agentData
    });

    // Update status
    const statusResponse = await request.patch(`${baseURL}/api/agents/${agentData.id}/status`, {
      data: { status: 'active' }
    });
    expect(statusResponse.status()).toBe(200);
    
    const updatedAgent = await statusResponse.json();
    expect(updatedAgent.status).toBe('active');

    // Cleanup
    await request.delete(`${baseURL}/api/agents/${agentData.id}`);
  });

  test('should handle agent context updates', async ({ request }) => {
    // Create an agent
    const timestamp = Date.now();
    const agentData = {
      id: `test-agent-context-${timestamp}`,
      projectPath: '/test/project',
      status: 'active',
      context: { task: 'initial task' },
      tags: ['test', 'context']
    };

    await request.post(`${baseURL}/api/agents`, {
      data: agentData
    });

    // Update context
    const newContext = { task: 'updated task', progress: 50 };
    const contextResponse = await request.patch(`${baseURL}/api/agents/${agentData.id}/context`, {
      data: { context: newContext }
    });
    expect(contextResponse.status()).toBe(200);
    
    const updatedAgent = await contextResponse.json();
    expect(updatedAgent.context.task).toBe('updated task');
    expect(updatedAgent.context.progress).toBe(50);

    // Cleanup
    await request.delete(`${baseURL}/api/agents/${agentData.id}`);
  });

  test('should handle query parameters', async ({ request }) => {
    // Create test agents with unique IDs
    const timestamp = Date.now();
    const agents = [
      { id: `agent-1-${timestamp}`, projectPath: '/project1', status: 'active', context: {}, tags: ['tag1'] },
      { id: `agent-2-${timestamp}`, projectPath: '/project2', status: 'complete', context: {}, tags: ['tag2'] },
      { id: `agent-3-${timestamp}`, projectPath: '/project1', status: 'active', context: {}, tags: ['tag1'] }
    ];

    // Create all agents
    for (const agent of agents) {
      await request.post(`${baseURL}/api/agents`, { data: agent });
    }

    // Test limit parameter
    const limitResponse = await request.get(`${baseURL}/api/agents?limit=2`);
    expect(limitResponse.status()).toBe(200);
    const limitedAgents = await limitResponse.json();
    expect(limitedAgents.length).toBe(2);

    // Test offset parameter
    const offsetResponse = await request.get(`${baseURL}/api/agents?offset=1`);
    expect(offsetResponse.status()).toBe(200);
    const offsetAgents = await offsetResponse.json();
    expect(offsetAgents.length).toBe(2);

    // Test status filter
    const statusResponse = await request.get(`${baseURL}/api/agents?status=active`);
    expect(statusResponse.status()).toBe(200);
    const activeAgents = await statusResponse.json();
    expect(activeAgents.length).toBe(2);
    expect(activeAgents.every(agent => agent.status === 'active')).toBe(true);

    // Test project filter
    const projectResponse = await request.get(`${baseURL}/api/agents?projectPath=/project1`);
    expect(projectResponse.status()).toBe(200);
    const projectAgents = await projectResponse.json();
    expect(projectAgents.length).toBe(2);
    expect(projectAgents.every(agent => agent.projectPath === '/project1')).toBe(true);

    // Cleanup
    for (const agent of agents) {
      await request.delete(`${baseURL}/api/agents/${agent.id}`);
    }
  });
});