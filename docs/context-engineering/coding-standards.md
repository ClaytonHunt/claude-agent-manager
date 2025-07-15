# Coding Standards - Claude Agent Manager

## TypeScript/Node.js Standards

### Language Configuration

**TypeScript Version**: 5.5+  
**Node.js Version**: 18+  
**Target**: ES2022  
**Module System**: ESNext with CommonJS interop  

### TypeScript Configuration

```json
// tsconfig.json - Project Standards
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Code Formatting

**Tool**: Prettier  
**Configuration**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Linting

**Tool**: ESLint  
**Extends**: `@typescript-eslint/recommended`

## Project Conventions

### Package Structure

Detected monorepo pattern with npm workspaces:

```
packages/
├── server/          # Express server (TypeScript)
├── client/          # React dashboard (Future)
├── agentic-base/    # NPM package (TypeScript)
└── shared/          # Common types/utilities
```

### File Naming Conventions

**TypeScript Files**:
- `PascalCase.ts` for classes and components
- `camelCase.ts` for utilities and services
- `kebab-case.ts` for CLI tools and scripts
- `index.ts` for package entry points

**Test Files**:
- `*.test.ts` for unit tests
- `*.integration.test.ts` for integration tests
- `*.e2e.test.ts` for end-to-end tests

**Configuration Files**:
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment template
- `README.md` - Package documentation

### Import/Export Standards

**Preferred Import Style**:
```typescript
// Named imports preferred
import { AgentService, LogEntry } from '../services';
import type { Agent, AgentStatus } from '../types';

// Default imports for single exports
import express from 'express';
import Redis from 'ioredis';

// Namespace imports for large libraries
import * as path from 'path';
import * as fs from 'fs/promises';
```

**Export Style**:
```typescript
// Named exports preferred
export { AgentService } from './AgentService';
export { RedisService } from './RedisService';
export type { Agent, LogEntry } from './types';

// Default exports for single-purpose modules
export default class WebSocketService { }
```

### Error Handling Patterns

**Result Pattern** (Preferred):
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchAgent(id: string): Promise<Result<Agent>> {
  try {
    const agent = await agentService.getById(id);
    return { success: true, data: agent };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

**Error Classes**:
```typescript
export class AgentNotFoundError extends Error {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`);
    this.name = 'AgentNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(field: string, value: unknown) {
    super(`Invalid ${field}: ${value}`);
    this.name = 'ValidationError';
  }
}
```

### Async/Await Standards

**Preferred Patterns**:
```typescript
// Use async/await over Promises
async function processAgent(id: string): Promise<void> {
  const agent = await agentService.getById(id);
  await logService.addEntry(agent.id, 'Processing started');
  // ... processing logic
}

// Handle errors appropriately
async function safeProcessAgent(id: string): Promise<Result<void>> {
  try {
    await processAgent(id);
    return { success: true, data: undefined };
  } catch (error) {
    logger.error('Agent processing failed', { agentId: id, error });
    return { success: false, error: error as Error };
  }
}
```

## Type Definitions

### Shared Types Location

**Primary Types**: `packages/shared/src/types.ts`  
**Package-specific Types**: `src/types.ts` within each package

### Type Definition Standards

**Interface Naming**:
```typescript
// Use descriptive names
interface Agent { }
interface AgentRegistrationRequest { }
interface AgentStatusUpdateEvent { }

// Avoid generic names
// ❌ interface Data { }
// ❌ interface Config { }
```

**Utility Types**:
```typescript
// Use built-in utility types
type PartialAgent = Partial<Agent>;
type AgentUpdate = Pick<Agent, 'status' | 'lastActivity'>;
type CreateAgentRequest = Omit<Agent, 'id' | 'created'>;

// Custom utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

**Enum vs Union Types**:
```typescript
// Use const assertions for union types (preferred)
const AGENT_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  ERROR: 'error',
  HANDOFF: 'handoff',
  COMPLETE: 'complete'
} as const;

type AgentStatus = typeof AGENT_STATUS[keyof typeof AGENT_STATUS];

// Use enums for numeric or complex cases
enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}
```

## API Design Standards

### REST API Conventions

**URL Structure**:
```
/api/agents                    # Resource collection
/api/agents/:id                # Specific resource
/api/agents/:id/logs           # Nested resource
/api/hooks/claude-code         # Action endpoint
```

**HTTP Methods**:
- `GET` - Retrieve data (idempotent)
- `POST` - Create new resource or action
- `PATCH` - Partial update (preferred over PUT)
- `DELETE` - Remove resource

**Response Format**:
```typescript
// Success responses
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Error responses
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```

### WebSocket Event Standards

**Event Naming**: `resource_action` pattern
```typescript
// Examples
'agent_registered'
'agent_update'
'log_entry'
'handoff_initiated'
```

**Event Structure**:
```typescript
interface WebSocketEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  source?: string;
}
```

## Database/Storage Patterns

### Redis Key Naming

**Pattern**: `namespace:resource:identifier`

```typescript
// Examples
'agents:12345'                 # Agent data
'agents:12345:logs'           # Agent logs
'agents:index:status'         # Status index
'agents:index:project'        # Project index
```

### Data Serialization

**JSON Serialization**:
```typescript
// Use proper Date handling
function serializeAgent(agent: Agent): string {
  return JSON.stringify({
    ...agent,
    created: agent.created.toISOString(),
    lastActivity: agent.lastActivity.toISOString()
  });
}

function deserializeAgent(data: string): Agent {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    created: new Date(parsed.created),
    lastActivity: new Date(parsed.lastActivity)
  };
}
```

## Testing Standards

### Test Structure

**File Organization**:
```
src/
├── services/
│   ├── AgentService.ts
│   └── __tests__/
│       └── AgentService.test.ts
└── __tests__/
    ├── integration/
    └── e2e/
```

**Test Naming**:
```typescript
describe('AgentService', () => {
  describe('createAgent', () => {
    it('should create agent with valid data', async () => {
      // Test implementation
    });
    
    it('should throw error for invalid project path', async () => {
      // Test implementation
    });
  });
});
```

### Test Patterns

**Arrange-Act-Assert**:
```typescript
it('should update agent status', async () => {
  // Arrange
  const agent = await createTestAgent();
  const newStatus = 'active';
  
  // Act
  const result = await agentService.updateStatus(agent.id, newStatus);
  
  // Assert
  expect(result.success).toBe(true);
  expect(result.data.status).toBe(newStatus);
});
```

**Mock Patterns**:
```typescript
// Use jest.mock for external dependencies
jest.mock('ioredis');
const mockRedis = Redis as jest.MockedClass<typeof Redis>;

// Create factory functions for test data
function createTestAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'test-agent-1',
    projectPath: '/test/project',
    status: 'idle',
    created: new Date(),
    lastActivity: new Date(),
    context: {},
    logs: [],
    ...overrides
  };
}
```

## Logging Standards

### Logging Framework

**Tool**: Winston or similar structured logger  
**Location**: `packages/server/src/utils/logger.ts`

### Log Levels

```typescript
const LOG_LEVELS = {
  error: 0,    // System errors, exceptions
  warn: 1,     // Warning conditions
  info: 2,     // General operational messages
  debug: 3     // Detailed debugging information
} as const;
```

### Log Structure

```typescript
// Structured logging format
logger.info('Agent registered', {
  agentId: agent.id,
  projectPath: agent.projectPath,
  timestamp: new Date().toISOString(),
  userId: request.user?.id
});

// Error logging with context
logger.error('Agent registration failed', {
  error: error.message,
  stack: error.stack,
  agentData: sanitizeAgentData(request.body),
  requestId: request.id
});
```

## Security Standards

### Input Validation

**Validation Library**: Zod (recommended) or Joi

```typescript
import { z } from 'zod';

const AgentSchema = z.object({
  projectPath: z.string().min(1),
  status: z.enum(['idle', 'active', 'error', 'handoff', 'complete']),
  context: z.record(z.unknown()).optional()
});

type AgentInput = z.infer<typeof AgentSchema>;
```

### Data Sanitization

```typescript
// Remove sensitive data before logging/storage
function sanitizeAgentContext(context: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...context };
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

## Performance Standards

### Response Time Targets

- Agent registration: <100ms
- Status updates: <50ms
- Log queries: <200ms
- Dashboard updates: <50ms

### Memory Usage

- Server process: <500MB for 100 active agents
- Redis usage: <1GB for 1000 agents with 30-day retention
- Client bundle: <2MB compressed

### Optimization Patterns

**Database Queries**:
```typescript
// Use connection pooling
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Batch operations when possible
async function updateMultipleAgents(updates: AgentUpdate[]): Promise<void> {
  const pipeline = redis.pipeline();
  
  for (const update of updates) {
    pipeline.hset(`agents:${update.id}`, update);
  }
  
  await pipeline.exec();
}
```

**Caching Strategy**:
```typescript
// Simple in-memory cache for frequently accessed data
class AgentCache {
  private cache = new Map<string, { data: Agent; expires: number }>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes
  
  get(id: string): Agent | null {
    const entry = this.cache.get(id);
    if (!entry || entry.expires < Date.now()) {
      this.cache.delete(id);
      return null;
    }
    return entry.data;
  }
  
  set(id: string, agent: Agent): void {
    this.cache.set(id, {
      data: agent,
      expires: Date.now() + this.ttl
    });
  }
}
```

## Build and Deployment Standards

### Build Scripts

**Package.json scripts** (detected in root):
```json
{
  "scripts": {
    "build": "npm run build -w packages/shared && npm run build -w packages/server && npm run build -w packages/agentic-base",
    "dev": "concurrently \"npm run dev -w packages/server\" \"npm run dev -w packages/client\"",
    "test": "npm run test -w packages/server && npm run test -w packages/client",
    "test:all": "npm run test",
    "clean": "rimraf packages/*/dist packages/*/build"
  }
}
```

### Environment Configuration

**Environment Variables**:
```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001
REDIS_URL=redis://localhost:6379

# Production
NODE_ENV=production
LOG_LEVEL=info
PORT=3001
REDIS_URL=redis://production-host:6379
```

---

**Document Status**: Complete  
**Last Updated**: 2025-07-15  
**Review Schedule**: With major TypeScript updates  
**Related Documents**: [Architecture](./architecture.md), [Testing Strategy](./testing-strategy.md)