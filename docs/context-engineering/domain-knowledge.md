# Domain Knowledge - Claude Agent Manager

## Business Logic and Domain Rules

**Domain**: Claude Code Agent Monitoring and Management  
**Primary Users**: Developers using Claude Code  
**Business Context**: Development productivity and agent orchestration  

## Core Domain Concepts

### Agent Lifecycle

**Agent States and Transitions**:
```
Registration → Idle → Active → {Complete|Error|Handoff} → Dismissed
```

**State Definitions**:
- **Idle**: Agent registered but not actively working
- **Active**: Agent performing tasks or tool operations
- **Complete**: Agent finished its work successfully
- **Error**: Agent encountered unrecoverable error
- **Handoff**: Agent transferring work to another agent
- **Dismissed**: Agent removed from tracking (terminal state)

**Business Rules**:
1. Agents must be registered before any activity tracking
2. Only active agents can generate log entries
3. Parent agents cannot be dismissed while child agents are active
4. Agent context is preserved until explicit dismissal
5. Log entries are immutable once created

### Agent Hierarchy

**Parent-Child Relationships**:
```
Main Agent (Project Root)
  ├── Subagent 1 (Feature Development)
  │   ├── Subagent 1.1 (Component Creation)
  │   └── Subagent 1.2 (Testing)
  └── Subagent 2 (Bug Fix)
      └── Subagent 2.1 (Investigation)
```

**Hierarchy Rules**:
1. Agents can spawn subagents for specific tasks
2. Subagents inherit project context from parent
3. Parent agent remains active while subagents work
4. Subagent completion can trigger parent agent actions
5. Maximum nesting depth: 3 levels (configurable)

### Context Preservation

**Context Types**:
- **Project Context**: Repository path, branch, commit hash
- **Task Context**: Current task description, objectives
- **Tool Context**: Recently used tools, configurations
- **Progress Context**: Completed steps, remaining work
- **Handoff Context**: Information for next agent

**Context Rules**:
1. Context must not contain sensitive information (API keys, passwords)
2. Context is automatically sanitized before storage
3. Context updates trigger lastActivity timestamp refresh
4. Context size limited to 64KB per agent
5. Context preservation extends Redis TTL automatically

## Claude Code Integration Domain

### Hook Events Domain

**Event Categories**:
```typescript
// Agent Lifecycle Events
'agent.started'     // Agent initialization
'agent.stopped'     // Agent termination
'agent.paused'      // Agent temporary suspension
'agent.resumed'     // Agent continuation

// Task Events
'task.started'      // Begin specific task
'task.completed'    // Task completion
'task.failed'       // Task failure
'task.cancelled'    // Task cancellation

// Tool Events
'tool.called'       // Tool invocation
'tool.completed'    // Tool execution finished
'tool.failed'       // Tool execution error
'tool.timeout'      // Tool execution timeout

// Collaboration Events
'handoff.initiated' // Agent requesting handoff
'handoff.accepted'  // New agent accepting work
'handoff.rejected'  // Handoff declined
'context.updated'   // Context information changed

// Error Events
'error.occurred'    // General error
'error.recovered'   // Error resolution
'fatal.error'       // Unrecoverable error
```

**Event Processing Rules**:
1. All events must include timestamp and source agent ID
2. Events are processed asynchronously to avoid blocking Claude Code
3. Failed event processing is retried with exponential backoff
4. Events older than 24 hours are automatically discarded
5. Duplicate events within 1 second are deduplicated

### Tool Monitoring Domain

**Monitored Tool Categories**:
- **File Operations**: Read, Write, Edit, MultiEdit
- **System Operations**: Bash commands, process management
- **Search Operations**: Grep, Glob, file searches
- **Communication**: WebFetch, API calls
- **Development**: Git operations, build commands

**Tool Monitoring Rules**:
1. Track tool usage frequency and patterns
2. Monitor tool execution time for performance insights
3. Capture tool errors for debugging assistance
4. Log tool arguments (sanitized for security)
5. Aggregate tool statistics per agent and project

## Real-Time Monitoring Domain

### WebSocket Communication Rules

**Connection Management**:
1. Clients must authenticate before receiving updates
2. Subscriptions are filtered by user permissions
3. Connection drops trigger automatic reconnection
4. Heartbeat every 30 seconds to maintain connection
5. Maximum 100 concurrent connections per server

**Event Broadcasting Rules**:
1. Agent updates broadcast to all subscribed clients
2. Log entries broadcast only to relevant project subscribers
3. System events broadcast to administrative users
4. Personal agent data filtered per user permissions
5. Rate limiting: max 100 events per minute per client

### Dashboard Domain Rules

**Agent Display Rules**:
1. Agents sorted by last activity (most recent first)
2. Child agents grouped under parent agents
3. Inactive agents (>1 hour) shown with reduced opacity
4. Error states highlighted with red indicators
5. Complete agents shown with green checkmarks

**Log Display Rules**:
1. Latest logs shown first (reverse chronological)
2. Error logs highlighted and prioritized
3. Debug logs hidden by default in production
4. Log timestamps shown in user's local timezone
5. Virtual scrolling for performance with large log sets

## Data Management Domain

### Redis Storage Strategy

**Key Namespace Rules**:
```
agents:{agentId}                    # Main agent data
agents:{agentId}:logs              # Agent log entries
agents:{agentId}:children          # Child agent IDs
agents:index:active                # Active agent index
agents:index:project:{path}        # Project-specific agents
agents:index:user:{userId}         # User-specific agents
agents:stats:daily:{date}          # Daily statistics
system:config                      # System configuration
system:metrics:{timestamp}         # Performance metrics
```

**TTL Management Rules**:
1. Agent data: No TTL (persist until dismissed)
2. Log entries: 30 days TTL (configurable)
3. Index entries: 6 hours TTL (refreshed on access)
4. Statistics: 90 days TTL
5. Temporary data: 1 hour TTL

**Data Consistency Rules**:
1. Agent updates are atomic (use Redis transactions)
2. Index updates must be consistent with main data
3. Failed writes trigger automatic retry (3 attempts)
4. Orphaned child agents are automatically cleaned up
5. Periodic data integrity checks every 24 hours

## Security Domain

### Data Protection Rules

**Sensitive Data Patterns**:
```typescript
const SENSITIVE_PATTERNS = [
  /password/i,
  /apikey/i,
  /api_key/i,
  /secret/i,
  /token/i,
  /auth/i,
  /credential/i,
  /private_key/i,
  /ssh_key/i
];
```

**Sanitization Rules**:
1. Scan all context data for sensitive patterns
2. Replace sensitive values with `[REDACTED]`
3. Log sanitization actions for audit trail
4. Never store original sensitive data
5. Apply sanitization before any storage or transmission

**Access Control Rules** (Future):
1. Users can only see their own agents by default
2. Team leads can see team member agents
3. Administrators can see all agents
4. Project-based access control for shared projects
5. Read-only access for monitoring-only users

## Performance Domain

### Response Time Requirements

**Service Level Objectives (SLOs)**:
- Agent registration: <100ms (95th percentile)
- Status updates: <50ms (95th percentile)
- Log retrieval: <200ms (95th percentile)
- Dashboard updates: <50ms (95th percentile)
- WebSocket message delivery: <25ms (95th percentile)

**Performance Rules**:
1. Database queries must complete within timeout limits
2. WebSocket events are queued if client is slow
3. Large log sets use pagination automatically
4. Background processing for non-critical operations
5. Circuit breaker pattern for external dependencies

### Scalability Rules

**Resource Limits**:
- Maximum active agents per server: 1000
- Maximum log entries per agent: 10000
- Maximum WebSocket connections: 100
- Maximum memory usage: 500MB
- Maximum Redis memory: 1GB

**Scaling Triggers**:
1. Scale up when CPU usage > 70% for 5 minutes
2. Scale up when memory usage > 80%
3. Scale up when response time > SLO for 3 minutes
4. Scale up when agent count > 80% of limit
5. Scale down when resource usage < 30% for 15 minutes

## Business Rules Engine

### Agent Management Rules

**Creation Rules**:
```typescript
function validateAgentCreation(agentData: AgentCreationRequest): ValidationResult {
  const rules = [
    () => agentData.projectPath.length > 0,
    () => fs.existsSync(agentData.projectPath),
    () => isValidProjectPath(agentData.projectPath),
    () => !hasMaxAgentsReached(agentData.projectPath),
    () => isValidContext(agentData.context)
  ];
  
  return rules.every(rule => rule());
}
```

**Update Rules**:
```typescript
function validateAgentUpdate(agentId: string, updates: AgentUpdateRequest): ValidationResult {
  const rules = [
    () => agentExists(agentId),
    () => isValidStatusTransition(currentStatus, updates.status),
    () => updates.context ? isValidContext(updates.context) : true,
    () => !hasCircularParentChild(agentId, updates.parentId),
    () => userCanModifyAgent(currentUser, agentId)
  ];
  
  return rules.every(rule => rule());
}
```

### Retention Rules

**Data Retention Policy**:
1. Active agents: Retained indefinitely
2. Completed agents: Retained until user dismisses
3. Error agents: Retained for 7 days minimum
4. Dismissed agents: Purged immediately
5. Log entries: Configurable retention (default 30 days)

**Cleanup Rules**:
```typescript
function cleanupStaleData(): void {
  // Clean up agents inactive for > 24 hours with no children
  cleanupOrphanedAgents();
  
  // Remove expired log entries
  cleanupExpiredLogs();
  
  // Clean up stale index entries
  refreshIndexes();
  
  // Archive old statistics
  archiveOldStats();
}
```

## Integration Rules

### GitHub Integration Domain (Future)

**Issue Triage Rules**:
1. Prioritize issues by business value and effort estimation
2. Skip issues already triaged (has triage labels)
3. Consider dependencies between issues
4. Factor in team capacity and expertise
5. Respect project milestones and deadlines

**Automation Rules**:
1. Auto-create agents for high-priority issues
2. Link agent progress to issue comments
3. Update issue status based on agent completion
4. Tag team members for review when agent completes
5. Close issues automatically when agents mark complete

### Development Tool Integration

**VS Code Integration** (Future):
1. Show agent status in status bar
2. Highlight files being worked on by agents
3. Provide quick access to agent logs
4. Allow agent dismissal from editor
5. Show agent hierarchy in explorer panel

**Terminal Integration** (Future):
1. Display agent status in terminal prompt
2. Show recent agent activity in terminal
3. Provide CLI commands for agent management
4. Integration with existing development workflows
5. Notification system for agent events

## Error Handling Domain

### Error Categories

**System Errors**:
- Database connection failures
- Redis unavailability
- WebSocket connection drops
- File system permission errors
- Network connectivity issues

**Validation Errors**:
- Invalid agent data
- Malformed context information
- Invalid state transitions
- Permission violations
- Data integrity violations

**Business Logic Errors**:
- Agent limit exceeded
- Circular parent-child relationships
- Invalid project paths
- Context size violations
- Unsupported operations

### Error Recovery Rules

**Automatic Recovery**:
1. Retry failed database operations (max 3 attempts)
2. Reconnect WebSocket connections automatically
3. Refresh stale data when inconsistencies detected
4. Graceful degradation when Redis unavailable
5. Fallback to local storage for critical operations

**Manual Recovery**:
1. Administrative tools for data corruption repair
2. Agent state reset capabilities
3. Manual context cleanup and sanitization
4. Backup and restore procedures
5. Emergency system shutdown procedures

## Compliance and Audit

### Audit Trail Requirements

**Logged Events**:
- Agent creation, modification, deletion
- User authentication and authorization
- Data access and modification
- System configuration changes
- Error occurrences and recovery actions

**Audit Log Format**:
```typescript
interface AuditLogEntry {
  timestamp: Date;
  userId?: string;
  agentId?: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'partial';
}
```

**Retention Requirements**:
1. Audit logs retained for 12 months minimum
2. Security events retained for 24 months
3. Compliance logs retained per regulatory requirements
4. Personal data deletion honored within 30 days
5. Data export capabilities for audit purposes

---

**Document Status**: Complete  
**Last Updated**: 2025-07-15  
**Review Schedule**: Monthly during active development  
**Domain Expert**: Development Team  
**Related Documents**: [Architecture](./architecture.md), [Coding Standards](./coding-standards.md)