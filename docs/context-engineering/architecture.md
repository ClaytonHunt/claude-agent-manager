# System Architecture - Claude Agent Manager

## Overview

The Claude Agent Manager is designed as a distributed system with three main components working together to provide comprehensive agent monitoring and management capabilities.

## System Components

### 1. Agentic Base Layer (NPM Package)

**Purpose**: Reusable foundation that can be installed in any project to enable Claude Code agent integration.

**Responsibilities**:
- Claude Code hook registration and event capture
- Agent lifecycle event emission
- Context preservation utilities
- Server communication helpers
- Handoff coordination

**Key Files**:
- `packages/agentic-base/src/hooks/claude-code-hooks.ts`
- `packages/agentic-base/src/utils/agent-manager-client.ts`
- `packages/agentic-base/src/cli/feature-from-github-issue.ts`

### 2. Management Server (Node.js/Express)

**Purpose**: Central coordination hub that receives agent events, manages state, and provides real-time updates.

**Responsibilities**:
- Agent registration and lifecycle management
- Event processing and state updates
- Log aggregation and storage
- WebSocket communication with dashboard
- REST API for agent operations
- Redis state management with TTL policies

**Key Files**:
- `packages/server/src/index.ts`
- `packages/server/src/services/AgentService.ts`
- `packages/server/src/services/RedisService.ts`
- `packages/server/src/services/WebSocketService.ts`
- `packages/server/src/routes/agents.ts`
- `packages/server/src/routes/hooks.ts`

### 3. Web Dashboard (React/WebSocket)

**Purpose**: Real-time monitoring interface providing visibility into agent activities and status.

**Responsibilities**:
- Real-time agent status visualization
- Log viewing and filtering
- Agent hierarchy display
- User interactions (dismiss, handoff)
- Performance metrics dashboard

**Key Files** (Future Implementation):
- `packages/client/src/components/AgentCard.tsx`
- `packages/client/src/components/LogViewer.tsx`
- `packages/client/src/hooks/useWebSocket.ts`
- `packages/client/src/store/agentStore.ts`

## Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           Data Flow Overview                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   Claude Code Agent    ┌───────────┐     Management Server     ┌───────────────┐ │
│   (with Agentic Base)  │ Hook      │     (Express/WS)          │ WebSocket      │ │
│           │            │ Events    │           │               │ Updates        │ │
│           └───────────────▶│           │───────────────▶│ Web Dashboard  │ │
│                        └───────────┘           │               │ (React)        │ │
│                                    │               └───────────────┘ │
│                                    │                                   │
│                        ┌───────────┐           │                                   │
│                        │ Redis     │───────────┘                                   │
│                        │ State     │                                                   │
│                        └───────────┘                                                   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Event Flow Sequence

1. **Agent Registration**
   ```
   Claude Code Agent → Agentic Base → POST /api/agents → Server → Redis
   Server → WebSocket → Dashboard (agent_registered)
   ```

2. **Status Updates**
   ```
   Agent Hook Event → Agentic Base → POST /api/hooks/claude-code → Server
   Server → Redis (state update) → WebSocket → Dashboard (agent_update)
   ```

3. **Log Entries**
   ```
   Agent Activity → Agentic Base → POST /api/agents/:id/logs → Server
   Server → Redis (append log) → WebSocket → Dashboard (log_entry)
   ```

## Core Data Models

### Agent Entity
```typescript
interface Agent {
  id: string;                    // Unique identifier
  parentId?: string;             // Parent agent (for subagents)
  projectPath: string;           // Project directory
  status: AgentStatus;           // Current status
  created: Date;                 // Creation timestamp
  lastActivity: Date;            // Last activity timestamp
  context: Record<string, any>;  // Agent context data
  logs: LogEntry[];             // Activity logs
  metadata?: {
    version?: string;            // Claude Code version
    task?: string;              // Current task description
    branch?: string;            // Git branch
    commit?: string;            // Git commit hash
  };
}

type AgentStatus = 'idle' | 'active' | 'error' | 'handoff' | 'complete' | 'dismissed';
```

### Log Entry
```typescript
interface LogEntry {
  id: string;                    // Unique log entry ID
  timestamp: Date;               // When log was created
  level: LogLevel;               // Log severity
  message: string;               // Log message
  category?: string;             // Log category (tool, task, etc.)
  metadata?: Record<string, any>; // Additional context
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

### Hook Event
```typescript
interface HookEvent {
  type: string;                  // Event type (tool.called, task.started)
  agentId: string;              // Source agent ID
  timestamp: Date;              // Event timestamp
  data: Record<string, any>;    // Event-specific data
  source: 'claude-code' | 'webhook' | 'manual';
}
```

## State Management Architecture

### Redis Schema Design

**Agent State Storage**:
```
agents:{agentId}           → JSON serialized Agent object
agents:{agentId}:logs      → List of JSON serialized LogEntry objects
agents:index:status        → Hash of agentId → status mappings
agents:index:project       → Hash of projectPath → Set of agentIds
agents:index:parent        → Hash of parentId → Set of childAgentIds
```

**TTL Strategy**:
- Agent records: No TTL, persist until explicitly dismissed
- Log entries: Configurable retention (default: 30 days)
- Index updates: Refresh TTL on access (6 hours default)
- Temporary data: Short TTL (1 hour)

### State Transitions

```
  ┌─────────────────────────────────────────────────────────┐
  │                    Agent State Transitions                     │
  ├─────────────────────────────────────────────────────────┤
  │                                                               │
  │    [Registration]                                              │
  │          │                                                     │
  │          ▼                                                     │
  │      ┌────────┐    Activity/Tools    ┌─────────┐        │
  │      │  IDLE   │───────────────────▶│ ACTIVE  │        │
  │      └────────┘                    └─────────┘        │
  │          │                          │   │            │
  │          │                     Error│   │Completion │
  │          │                          │   │            │
  │          │                          ▼   ▼            │
  │          │                      ┌────────┐          │
  │          │                      │ ERROR  │          │
  │          │                      └────────┘          │
  │          │                                            │
  │   User   │                                            │
  │  Action  │                                            │
  │          ▼                                            │
  │    ┌────────────┐                                      │
  │    │ DISMISSED  │                                      │
  │    └────────────┘                                      │
  │                                                               │
  └─────────────────────────────────────────────────────────┘
```

## Communication Protocols

### Claude Code Hook Integration

**Hook Configuration**:
```typescript
// packages/agentic-base/src/hooks/claude-code-hooks.ts
interface HookConfig {
  serverUrl: string;           // Management server URL
  events: string[];           // Event types to capture
  authentication?: {
    type: 'bearer' | 'api-key';
    token: string;
  };
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}
```

**Event Types Captured**:
- `agent.started` - Agent initialization
- `agent.stopped` - Agent termination
- `tool.called` - Tool invocation
- `task.started` - Task beginning
- `task.completed` - Task completion
- `error.occurred` - Error events
- `handoff.initiated` - Agent handoff

### WebSocket Protocol

**Client → Server Events**:
```typescript
{
  type: 'subscribe',
  payload: {
    agentId?: string,         // Subscribe to specific agent
    projectPath?: string,     // Subscribe to project agents
    filters?: {
      status?: AgentStatus[],
      logLevel?: LogLevel[]
    }
  }
}

{
  type: 'agent_command',
  payload: {
    agentId: string,
    command: 'dismiss' | 'handoff' | 'restart',
    data?: any
  }
}
```

**Server → Client Events**:
```typescript
{
  type: 'agent_registered',
  payload: Agent
}

{
  type: 'agent_update',
  payload: {
    agentId: string,
    changes: Partial<Agent>
  }
}

{
  type: 'log_entry',
  payload: {
    agentId: string,
    log: LogEntry
  }
}

{
  type: 'handoff',
  payload: {
    fromAgentId: string,
    toAgentId: string,
    context: any
  }
}
```

### REST API Endpoints

**Agent Management**:
```
POST   /api/agents                    # Register new agent
GET    /api/agents                    # List agents (with filtering)
GET    /api/agents/:id                # Get specific agent
PATCH  /api/agents/:id/status         # Update agent status
POST   /api/agents/:id/logs           # Add log entry
PATCH  /api/agents/:id/context        # Update agent context
POST   /api/agents/handoff            # Initiate agent handoff
DELETE /api/agents/:id               # Dismiss agent
```

**Hook Endpoints**:
```
POST   /api/hooks/claude-code         # Claude Code event receiver
POST   /api/hooks/webhook/:type       # Generic webhook receiver
```

## Security Architecture

### Authentication Strategy

**Development Environment**:
- Local service with no authentication (default)
- Optional API key authentication for teams

**Production Environment** (Future):
- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Request encryption

### Data Protection

**Sensitive Data Handling**:
- No credential storage in agent context
- Context data sanitization before storage
- Configurable data retention policies
- Audit logging for security events

**Network Security**:
- HTTPS in production
- WebSocket secure connections (WSS)
- CORS configuration for dashboard
- Request validation and sanitization

## Performance Architecture

### Scalability Design

**Horizontal Scaling Ready**:
- Stateless server design
- Redis clustering support
- Load balancer compatible
- WebSocket sticky sessions

**Performance Targets**:
- Agent registration: <100ms
- Status updates: <50ms
- Log aggregation: <200ms
- Dashboard updates: <50ms
- Memory usage: <500MB for 100 active agents

### Optimization Strategies

**Redis Optimization**:
- Connection pooling
- Pipeline operations for bulk updates
- Efficient data structures (hashes, sets)
- Background key expiration

**WebSocket Optimization**:
- Event batching for high-frequency updates
- Client-side connection management
- Automatic reconnection with backoff
- Message compression for large payloads

## Deployment Architecture

### Development Deployment
```
Local Machine:
├── Redis Server (localhost:6379)
├── Management Server (localhost:3001)
└── Web Dashboard (localhost:3000)
```

### Production Deployment (Future)
```
Production Environment:
├── Load Balancer
├── Management Server Cluster (multiple instances)
├── Redis Cluster
├── Web Dashboard (static hosting)
└── Monitoring & Logging
```

## Integration Points

### Claude Code Integration
- Hook registration via CLI commands
- Event emission through Agentic Base
- Context preservation during handoffs
- Tool call monitoring and logging

### GitHub Integration (Future)
- Issue triage automation
- Pull request status updates
- Branch and commit tracking
- Release management integration

### Development Tool Integration
- VS Code extension potential
- Terminal dashboard views
- CI/CD pipeline integration
- Notification system hooks

---

**Document Status**: Complete  
**Last Updated**: 2025-07-15  
**Review Schedule**: After major feature releases  
**Related Documents**: [Planning](./planning.md), [Domain Knowledge](./domain-knowledge.md)