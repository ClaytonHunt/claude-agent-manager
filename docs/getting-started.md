# Claude Agent Manager - Getting Started

## Overview

Claude Agent Manager is a comprehensive system for monitoring and managing Claude Code agents and subagents with real-time tracking and context preservation. The system consists of two main components:

1. **Management & Monitoring Server** - Centralized monitoring dashboard
2. **Agentic Base Layer** - Reusable foundation for autonomous development

## Quick Start

### Prerequisites

- Node.js 18+ 
- Redis server
- GitHub token (for issue integration)

### 1. Install Dependencies

```bash
git clone https://github.com/ClaytonHunt/claude-agent-manager.git
cd claude-agent-manager
npm install
```

### 2. Build All Packages

```bash
npm run build
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `REDIS_URL` - Redis connection string
- `GITHUB_TOKEN` - GitHub personal access token
- `PORT` - Server port (default: 3001)

### 4. Start Redis

```bash
redis-server
```

### 5. Start the Server

```bash
npm run dev -w packages/server
```

## Architecture

### Server Components

- **Express/Fastify Server** - REST API and WebSocket endpoints
- **Redis Service** - Agent state management with TTL
- **WebSocket Service** - Real-time client communication
- **Agent Service** - Core agent lifecycle management
- **Hook System** - Claude Code integration

### Agentic Base Layer

- **Hook Manager** - Claude Code event capture
- **Client Utilities** - Server communication helpers
- **CLI Tools** - GitHub issue integration

## Usage

### 1. Register an Agent

```typescript
import { registerClaudeCodeHook, ClaudeCodeEvents } from '@claude-agent-manager/agentic-base';

// Register hook
await registerClaudeCodeHook({
  serverUrl: 'http://localhost:3001',
  events: ['*'] // All events
});

// Emit events
await ClaudeCodeEvents.agentStarted({ task: 'feature-development' });
await ClaudeCodeEvents.taskStarted('implement-auth');
```

### 2. Use GitHub Issue Integration

```bash
# Install CLI globally
npm install -g @claude-agent-manager/agentic-base

# Triage all issues in repository
feature-from-github-issue --triage-only

# Auto-select highest priority issue
feature-from-github-issue --auto

# Create feature from specific issue
feature-from-github-issue -i 123
```

### 3. Monitor Agents

Access the monitoring dashboard at `http://localhost:3001` (when client is built).

## API Reference

### Agent Endpoints

- `POST /api/agents` - Register agent
- `GET /api/agents` - List agents with filtering
- `GET /api/agents/:id` - Get specific agent
- `PATCH /api/agents/:id/status` - Update agent status
- `POST /api/agents/:id/logs` - Add log entry
- `PATCH /api/agents/:id/context` - Update context
- `POST /api/agents/handoff` - Agent handoff
- `DELETE /api/agents/:id` - Delete agent

### Hook Endpoints

- `POST /api/hooks/claude-code` - Claude Code event receiver
- `POST /api/hooks/webhook/:type` - Generic webhook receiver

### WebSocket Events

- `agent_update` - Agent status/data changes
- `log_entry` - New log entries
- `handoff` - Agent handoffs
- `ping/pong` - Connection health

## Configuration

### Server Configuration

```env
PORT=3001
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
RETENTION_DAYS=30
MAX_AGENTS=1000
CLIENT_URL=http://localhost:3000
```

### Hook Configuration

```typescript
{
  serverUrl: 'http://localhost:3001',
  events: ['agent.started', 'tool.called', 'task.completed'],
  authentication: {
    type: 'bearer',
    token: 'your-auth-token'
  }
}
```

## Development

### Project Structure

```
claude-agent-manager/
├── packages/
│   ├── server/          # Express server
│   ├── client/          # React dashboard (TODO)
│   ├── agentic-base/    # Reusable agent layer
│   └── shared/          # Common types/utilities
├── docs/                # Documentation
└── scripts/             # Build scripts
```

### Build Commands

```bash
# Build all packages
npm run build

# Development mode
npm run dev

# Run tests
npm run test

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm run test:all

# Test specific package
npm run test -w packages/server
```

## Deployment

### Local Service

The server can run as a local service for development:

```bash
npm start -w packages/server
```

### Production Deployment

1. Build all packages: `npm run build`
2. Set production environment variables
3. Start Redis server
4. Run server: `node packages/server/dist/index.js`

### Docker (Future Enhancement)

Docker support is planned for easier deployment.

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check REDIS_URL configuration

2. **GitHub API Rate Limiting**
   - Verify GITHUB_TOKEN is set
   - Use personal access token with appropriate scopes

3. **Port Already in Use**
   - Change PORT in .env
   - Kill existing processes on port

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.