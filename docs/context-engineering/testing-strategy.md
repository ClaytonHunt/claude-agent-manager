# Testing Strategy - Claude Agent Manager

## Framework: Jest with TypeScript

**Testing Framework**: Jest 29+  
**Language**: TypeScript  
**Coverage Target**: >90% for all packages  
**Test Types**: Unit, Integration, E2E  

## Test Structure

### Project Test Organization

```
packages/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── AgentService.ts
│   │   │   └── __tests__/
│   │   │       └── AgentService.test.ts
│   │   └── __tests__/
│   │       ├── integration/
│   │       │   └── api.integration.test.ts
│   │       └── e2e/
│   │           └── agent-lifecycle.e2e.test.ts
│   └── jest.config.js
├── agentic-base/
│   ├── src/
│   │   └── __tests__/
│   └── jest.config.js
└── shared/
    ├── src/
    │   └── __tests__/
    └── jest.config.js
```

### Jest Configuration

```javascript
// jest.config.js (per package)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

## Unit Testing

### Test Categories

#### Service Layer Tests
```typescript
// packages/server/src/services/__tests__/AgentService.test.ts
import { AgentService } from '../AgentService';
import { RedisService } from '../RedisService';
import { createTestAgent } from '../../__tests__/factories';

// Mock external dependencies
jest.mock('../RedisService');
const mockRedisService = RedisService as jest.MockedClass<typeof RedisService>;

describe('AgentService', () => {
  let agentService: AgentService;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedis = new mockRedisService() as jest.Mocked<RedisService>;
    agentService = new AgentService(mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create agent with valid data', async () => {
      // Arrange
      const agentData = {
        projectPath: '/test/project',
        status: 'idle' as const,
        context: { task: 'test-task' }
      };
      const expectedAgent = createTestAgent(agentData);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.hset.mockResolvedValue(1);

      // Act
      const result = await agentService.createAgent(agentData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectPath).toBe(agentData.projectPath);
        expect(result.data.status).toBe(agentData.status);
        expect(mockRedis.set).toHaveBeenCalledWith(
          `agents:${result.data.id}`,
          expect.any(String)
        );
      }
    });

    it('should return error for invalid project path', async () => {
      // Arrange
      const invalidData = {
        projectPath: '',
        status: 'idle' as const,
        context: {}
      };

      // Act
      const result = await agentService.createAgent(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('project path');
      }
    });
  });

  describe('updateStatus', () => {
    it('should update agent status successfully', async () => {
      // Arrange
      const agentId = 'test-agent-1';
      const newStatus = 'active';
      const existingAgent = createTestAgent({ id: agentId });
      mockRedis.get.mockResolvedValue(JSON.stringify(existingAgent));
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const result = await agentService.updateStatus(agentId, newStatus);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(newStatus);
        expect(result.data.lastActivity).toBeDefined();
      }
    });
  });
});
```

#### Utility Function Tests
```typescript
// packages/shared/src/__tests__/utils.test.ts
import { sanitizeAgentContext, validateAgentData } from '../utils';

describe('sanitizeAgentContext', () => {
  it('should remove sensitive keys', () => {
    // Arrange
    const context = {
      task: 'build-feature',
      apiKey: 'secret-key',
      password: 'secret-password',
      token: 'auth-token',
      normalData: 'keep-this'
    };

    // Act
    const sanitized = sanitizeAgentContext(context);

    // Assert
    expect(sanitized.task).toBe('build-feature');
    expect(sanitized.normalData).toBe('keep-this');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
  });

  it('should handle empty context', () => {
    // Arrange
    const context = {};

    // Act
    const sanitized = sanitizeAgentContext(context);

    // Assert
    expect(sanitized).toEqual({});
  });
});
```

### Test Factories and Utilities

```typescript
// packages/server/src/__tests__/factories.ts
import type { Agent, LogEntry } from '@claude-agent-manager/shared';

let agentCounter = 0;
let logCounter = 0;

export function createTestAgent(overrides: Partial<Agent> = {}): Agent {
  agentCounter++;
  return {
    id: `test-agent-${agentCounter}`,
    projectPath: `/test/project-${agentCounter}`,
    status: 'idle',
    created: new Date(),
    lastActivity: new Date(),
    context: {},
    logs: [],
    ...overrides
  };
}

export function createTestLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  logCounter++;
  return {
    id: `test-log-${logCounter}`,
    timestamp: new Date(),
    level: 'info',
    message: `Test log message ${logCounter}`,
    ...overrides
  };
}

// Mock Redis responses
export const mockRedisResponses = {
  agentCreated: 'OK',
  agentNotFound: null,
  logAdded: 1,
  indexUpdated: 1
};

// Test setup utilities
export function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379/15'; // Test database
  process.env.LOG_LEVEL = 'error'; // Reduce test noise
}

export function teardownTestEnvironment() {
  delete process.env.REDIS_URL;
  delete process.env.LOG_LEVEL;
}
```

## Integration Testing

### API Integration Tests

```typescript
// packages/server/src/__tests__/integration/api.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { RedisService } from '../../services/RedisService';
import { createTestAgent } from '../factories';

describe('Agent API Integration', () => {
  let redisService: RedisService;

  beforeAll(async () => {
    redisService = new RedisService({
      host: 'localhost',
      port: 6379,
      db: 15 // Test database
    });
    await redisService.connect();
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  beforeEach(async () => {
    // Clear test database
    await redisService.flushdb();
  });

  describe('POST /api/agents', () => {
    it('should create agent successfully', async () => {
      // Arrange
      const agentData = {
        projectPath: '/test/project',
        status: 'idle',
        context: { task: 'test-task' }
      };

      // Act
      const response = await request(app)
        .post('/api/agents')
        .send(agentData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.projectPath).toBe(agentData.projectPath);

      // Verify in database
      const storedAgent = await redisService.get(`agents:${response.body.data.id}`);
      expect(storedAgent).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidData = {
        projectPath: '', // Invalid
        status: 'invalid-status'
      };

      // Act
      const response = await request(app)
        .post('/api/agents')
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('validation');
    });
  });

  describe('GET /api/agents', () => {
    it('should return list of agents', async () => {
      // Arrange
      const agent1 = createTestAgent({ projectPath: '/project1' });
      const agent2 = createTestAgent({ projectPath: '/project2' });
      await redisService.set(`agents:${agent1.id}`, JSON.stringify(agent1));
      await redisService.set(`agents:${agent2.id}`, JSON.stringify(agent2));
      await redisService.sadd('agents:index', agent1.id, agent2.id);

      // Act
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBeDefined();
    });

    it('should filter agents by status', async () => {
      // Arrange
      const activeAgent = createTestAgent({ status: 'active' });
      const idleAgent = createTestAgent({ status: 'idle' });
      await redisService.set(`agents:${activeAgent.id}`, JSON.stringify(activeAgent));
      await redisService.set(`agents:${idleAgent.id}`, JSON.stringify(idleAgent));
      await redisService.sadd('agents:index', activeAgent.id, idleAgent.id);

      // Act
      const response = await request(app)
        .get('/api/agents?status=active')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });
  });
});
```

### WebSocket Integration Tests

```typescript
// packages/server/src/__tests__/integration/websocket.integration.test.ts
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupWebSocketHandlers } from '../../services/WebSocketService';

describe('WebSocket Integration', () => {
  let httpServer: any;
  let ioServer: Server;
  let clientSocket: ClientSocket;
  const port = 3002; // Different port for tests

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer);
    setupWebSocketHandlers(ioServer);
    
    httpServer.listen(port, () => {
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
    clientSocket.close();
  });

  it('should receive agent_registered event', (done) => {
    // Arrange
    const testAgent = createTestAgent();
    
    // Act
    clientSocket.on('agent_registered', (data) => {
      // Assert
      expect(data.id).toBe(testAgent.id);
      expect(data.projectPath).toBe(testAgent.projectPath);
      done();
    });

    // Simulate agent registration
    ioServer.emit('agent_registered', testAgent);
  });

  it('should handle subscription to specific agent', (done) => {
    // Arrange
    const agentId = 'test-agent-123';
    
    // Act
    clientSocket.emit('subscribe', { agentId });
    
    clientSocket.on('subscription_confirmed', (data) => {
      // Assert
      expect(data.agentId).toBe(agentId);
      done();
    });
  });
});
```

## End-to-End Testing

### E2E Test Framework

**Framework**: Jest with Puppeteer (for future React dashboard)  
**Current Focus**: API workflows and CLI integration  

```typescript
// packages/server/src/__tests__/e2e/agent-lifecycle.e2e.test.ts
import { spawn } from 'child_process';
import request from 'supertest';
import { app } from '../../app';
import { RedisService } from '../../services/RedisService';

describe('Agent Lifecycle E2E', () => {
  let serverProcess: any;
  let redisService: RedisService;
  const serverPort = 3003;

  beforeAll(async () => {
    // Start test server
    serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test',
        REDIS_URL: 'redis://localhost:6379/15'
      }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    redisService = new RedisService({ db: 15 });
    await redisService.connect();
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    await redisService.disconnect();
  });

  beforeEach(async () => {
    await redisService.flushdb();
  });

  it('should complete full agent lifecycle', async () => {
    const baseUrl = `http://localhost:${serverPort}`;

    // 1. Register agent
    const registerResponse = await request(baseUrl)
      .post('/api/agents')
      .send({
        projectPath: '/test/e2e-project',
        status: 'idle',
        context: { task: 'e2e-test' }
      })
      .expect(201);

    const agentId = registerResponse.body.data.id;
    expect(agentId).toBeDefined();

    // 2. Update status to active
    await request(baseUrl)
      .patch(`/api/agents/${agentId}/status`)
      .send({ status: 'active' })
      .expect(200);

    // 3. Add log entries
    await request(baseUrl)
      .post(`/api/agents/${agentId}/logs`)
      .send({
        level: 'info',
        message: 'Task started',
        metadata: { step: 1 }
      })
      .expect(201);

    await request(baseUrl)
      .post(`/api/agents/${agentId}/logs`)
      .send({
        level: 'info',
        message: 'Task completed',
        metadata: { step: 2 }
      })
      .expect(201);

    // 4. Mark as complete
    await request(baseUrl)
      .patch(`/api/agents/${agentId}/status`)
      .send({ status: 'complete' })
      .expect(200);

    // 5. Verify final state
    const finalResponse = await request(baseUrl)
      .get(`/api/agents/${agentId}`)
      .expect(200);

    expect(finalResponse.body.data.status).toBe('complete');
    expect(finalResponse.body.data.logs).toHaveLength(2);

    // 6. Dismiss agent
    await request(baseUrl)
      .delete(`/api/agents/${agentId}`)
      .expect(204);

    // 7. Verify agent is removed
    await request(baseUrl)
      .get(`/api/agents/${agentId}`)
      .expect(404);
  });
});
```

## Coverage Requirements

### Coverage Targets

**Overall Target**: 90% coverage across all metrics  

**Per Package Targets**:
- `packages/server`: 95% (critical infrastructure)
- `packages/shared`: 90% (utility functions)
- `packages/agentic-base`: 85% (client-side code)
- `packages/client`: 80% (UI components, future)

### Coverage Configuration

```javascript
// Root coverage configuration
module.exports = {
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/__tests__/**',
    '!packages/*/src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'packages/server/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage'
};
```

## Testing Commands

### Development Commands

```bash
# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run specific package tests
npm run test -w packages/server
npm run test -w packages/shared

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# Debug tests
npm run test:debug
```

### CI/CD Commands

```bash
# Full test suite with timeout (10 minutes)
npm run test:all -- --timeout 600000

# Coverage with enforced thresholds
npm run test:coverage -- --coverage --coverageReporters=text-lcov

# Parallel test execution
npm run test:all -- --maxWorkers=4
```

## Test Data Management

### Test Database

**Redis Test Database**: Database 15 (separate from development/production)  
**Cleanup Strategy**: Fresh database for each test suite  
**Data Isolation**: Each test case clears relevant data  

### Test Fixtures

```typescript
// packages/server/src/__tests__/fixtures.ts
export const testAgents = {
  basic: {
    projectPath: '/test/basic-project',
    status: 'idle' as const,
    context: {}
  },
  withLogs: {
    projectPath: '/test/logged-project',
    status: 'active' as const,
    context: { task: 'test-with-logs' },
    logs: [
      {
        level: 'info' as const,
        message: 'Test log entry 1',
        timestamp: new Date('2025-01-01T10:00:00Z')
      },
      {
        level: 'warn' as const,
        message: 'Test log entry 2',
        timestamp: new Date('2025-01-01T10:01:00Z')
      }
    ]
  }
};

export const testHookEvents = {
  agentStarted: {
    type: 'agent.started',
    data: {
      projectPath: '/test/project',
      claudeVersion: '1.0.0'
    }
  },
  toolCalled: {
    type: 'tool.called',
    data: {
      toolName: 'bash',
      args: ['ls', '-la']
    }
  }
};
```

## Test Environment Setup

### Global Test Setup

```typescript
// packages/server/src/__tests__/setup.ts
import { setupTestEnvironment } from './factories';

// Global test setup
beforeAll(() => {
  setupTestEnvironment();
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### Test Utilities

```typescript
// packages/server/src/__tests__/helpers.ts
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

export function createMockWebSocket() {
  const events: Record<string, Function[]> = {};
  
  return {
    on: jest.fn((event: string, handler: Function) => {
      events[event] = events[event] || [];
      events[event].push(handler);
    }),
    emit: jest.fn((event: string, data: any) => {
      if (events[event]) {
        events[event].forEach(handler => handler(data));
      }
    }),
    disconnect: jest.fn()
  };
}
```

---

**Document Status**: Complete  
**Last Updated**: 2025-07-15  
**Review Schedule**: After major testing framework updates  
**Related Documents**: [Coding Standards](./coding-standards.md), [Architecture](./architecture.md)