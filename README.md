# Claude Agent Manager

A comprehensive system for monitoring and managing Claude Code agents and subagents with real-time tracking and context preservation.

## Project Structure

```
claude-agent-manager/
├── .claude/                 # Claude Code context and configuration
├── packages/
│   ├── server/             # Express/Fastify server for agent management
│   ├── client/             # React dashboard with rsbuild
│   ├── agentic-base/       # Reusable agentic layer for projects
│   └── shared/             # Shared types and utilities
├── docs/                   # Project documentation
└── scripts/                # Build and utility scripts
```

## Features

- **Agent Monitoring**: Real-time tracking of Claude Code agents and subagents
- **Context Preservation**: Maintain agent histories and context between handoffs
- **Agentic Base Layer**: Reusable foundation for autonomous development
- **GitHub Integration**: Automated issue triage and work management

## Technology Stack

- **Backend**: Node.js with TypeScript, Express/Fastify
- **Frontend**: React with rsbuild
- **State Management**: Redis for agent state tracking
- **Communication**: WebSockets for real-time updates
- **Integration**: Claude Code hooks and webhooks