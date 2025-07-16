# Hook-to-Web Data Flow Analysis

## Overview
This document analyzes the complete data flow from Claude Code hooks through the server to the web application, identifying the current implementation status and areas that need verification.

## Current Implementation Status

### 1. Claude Code Hooks → Server Communication ✅
**Status**: Implemented and configured correctly

- **Hook Scripts Location**: `.claude/hooks/`
- **Configuration**: `.claude/settings.json` has correct paths
- **Communication Logic**: 
  - Uses `EventSender.js` with axios HTTP client
  - Sends POST requests to `http://localhost:3001/api/hooks/claude-code`
  - Includes retry logic, circuit breaker pattern, and error handling
  - Hook types: PreToolUse, PostToolUse, Notification, Stop, SubagentStop

**Key Implementation Details**:
```javascript
// EventSender.js sends events to:
baseURL: 'http://localhost:3001'
endpoint: '/api/hooks/claude-code'

// Payload structure:
{
  type: eventType,
  agentId: string,
  sessionId: string,
  timestamp: ISO string,
  data: { projectPath, pid, ...eventData }
}
```

### 2. Server Hook Endpoint → Storage Update ✅
**Status**: Implemented with proper routing and handlers

- **Endpoint**: `/api/hooks/claude-code` in `packages/server/src/routes/hooks.ts`
- **Processing Flow**:
  1. Receives hook event
  2. Validates with Zod schema
  3. Routes to specific handler based on event type
  4. Updates agent status, adds log entries, or updates context
  5. Storage service (Redis/Memory) is updated via AgentService

**Supported Event Types**:
- `agent.started` → Updates status to 'active'
- `agent.stopped` → Updates status to 'complete'
- `agent.error` → Updates status to 'error'
- `tool.called` → Adds log entry
- `tool.completed` → Adds log entry
- `context.updated` → Updates agent context
- `task.started` → Adds log entry
- `task.completed` → Adds log entry

### 3. Storage Layer ✅
**Status**: Dual implementation with automatic fallback

- **Primary**: RedisService (if Redis is running)
- **Fallback**: MemoryStorageService (if Redis unavailable)
- **Both implement**: StorageService interface with same methods
- **Data persistence**: Agent state, logs, context, and status updates

### 4. Server → Web Application Updates ⚠️
**Status**: WebSocket infrastructure exists but connection to hook events unclear

- **WebSocket Service**: Exists in server
- **Client Hooks**: `useWebSocket`, `useAgentUpdates`, `useProjectUpdates`, `useLogStream`
- **Subscription Channels**: 
  - `agent:{agentId}`
  - `project:{projectPath}`
  
**Missing Link**: No clear code showing WebSocketService broadcasting updates when hooks are processed

## Data Flow Verification Requirements

### Phase 1: Hook → Server Communication
1. **Test Hook Firing**:
   - Verify hooks execute when using Claude Code tools
   - Check if EventSender successfully sends HTTP requests
   - Confirm server receives and logs hook events

2. **Debug Points**:
   - Enable `CLAUDE_HOOK_LOGGING=true` 
   - Check `.claude/hook-log.md` for execution logs
   - Monitor server logs for incoming hook requests

### Phase 2: Server Processing → Storage
1. **Verify Storage Updates**:
   - Check if agent status changes in Redis/Memory
   - Confirm log entries are added
   - Validate context updates persist

2. **Debug Points**:
   - Server logs should show handler execution
   - Storage service should log save operations
   - API endpoints can query agent state

### Phase 3: Storage → WebSocket Broadcast
1. **Missing Implementation Check**:
   - Need to verify if WebSocketService is notified of changes
   - Check if broadcasts are sent on the correct channels
   - Confirm client subscriptions receive updates

2. **Required Investigation**:
   - Look for WebSocketService integration in AgentService
   - Check if storage updates trigger WebSocket events
   - Verify broadcast message format matches client expectations

### Phase 4: WebSocket → UI Updates
1. **Client Reception**:
   - Verify WebSocket connection establishes
   - Check if subscriptions are active
   - Confirm UI components update on message receipt

2. **Debug Points**:
   - Browser DevTools WebSocket inspector
   - React DevTools for state updates
   - Console logs in WebSocket handlers

## Next Steps for Verification

1. **Enable Hook Logging**:
   ```bash
   export CLAUDE_HOOK_LOGGING=true
   ```

2. **Start All Services**:
   ```bash
   # Terminal 1: Start server
   cd packages/server && npm run dev
   
   # Terminal 2: Start client
   cd packages/client && npm run dev
   ```

3. **Test Hook Execution**:
   - Use Claude Code to perform actions (Read, Write, Bash)
   - Monitor logs and network traffic
   - Check UI for real-time updates

4. **Identify Missing Links**:
   - Focus on WebSocketService integration in hook handlers
   - May need to add broadcast calls in AgentService methods
   - Ensure proper event formatting for client consumption

## Potential Issues to Investigate

1. **WebSocket Broadcasting**: The critical missing piece appears to be the connection between storage updates and WebSocket broadcasts. Need to check if:
   - AgentService methods call WebSocketService.broadcast()
   - Hook handlers trigger WebSocket events
   - Proper channels are used for broadcasting

2. **Event Type Mapping**: Hook event types (e.g., `tool.called`) may need mapping to WebSocket message types (e.g., `agent_update`)

3. **Authentication/Session Management**: Verify if hook agentId matches WebSocket subscription IDs

4. **Environment Configuration**: Ensure all services use consistent URLs and ports