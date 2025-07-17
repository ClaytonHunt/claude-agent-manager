# Context Links - Claude Agent Manager

## Project Overview
**Project**: Claude Agent Manager  
**Location**: `/home/clayton/projects/claude-agent-manager`  
**Type**: Node.js TypeScript Monorepo  
**Build Tool**: npm workspaces, rsbuild  

## Key Project Files

### Configuration
- [package.json](/home/clayton/projects/claude-agent-manager/package.json) - Root package configuration and workspaces
- [tsconfig.json](/home/clayton/projects/claude-agent-manager/tsconfig.json) - TypeScript configuration

### Documentation
- [README.md](/home/clayton/projects/claude-agent-manager/README.md) - Project README
- [Getting Started](/home/clayton/projects/claude-agent-manager/docs/getting-started.md) - Setup and usage guide

### Source Packages
- [packages/server](/home/clayton/projects/claude-agent-manager/packages/server) - Express server with WebSocket support
- [packages/client](/home/clayton/projects/claude-agent-manager/packages/client) - React dashboard (future)
- [packages/agentic-base](/home/clayton/projects/claude-agent-manager/packages/agentic-base) - Reusable agent foundation
- [packages/shared](/home/clayton/projects/claude-agent-manager/packages/shared) - Common types and utilities

## Context Engineering Files

### Planning Documents
- [Feature Specification](/home/clayton/projects/claude-agent-manager/.claude/feature.md) - Current feature requirements
- [Work Analysis](/home/clayton/projects/claude-agent-manager/.claude/work-analysis.md) - Implementation roadmap
- [Current Task](/home/clayton/projects/claude-agent-manager/.claude/task.md) - Focused task details

### Documentation Structure
- [Planning](/home/clayton/projects/claude-agent-manager/docs/context-engineering/planning.md) - Project overview
- [Architecture](/home/clayton/projects/claude-agent-manager/docs/context-engineering/architecture.md) - System design
- [Coding Standards](/home/clayton/projects/claude-agent-manager/docs/context-engineering/coding-standards.md) - TypeScript/Node.js conventions
- [Testing Strategy](/home/clayton/projects/claude-agent-manager/docs/context-engineering/testing-strategy.md) - Testing approach
- [Deployment Process](/home/clayton/projects/claude-agent-manager/docs/context-engineering/deployment-process.md) - CI/CD and deployment
- [Domain Knowledge](/home/clayton/projects/claude-agent-manager/docs/context-engineering/domain-knowledge.md) - Business logic

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.5+
- **Framework**: Express.js
- **Database**: Redis (state management)
- **Communication**: WebSockets
- **Testing**: Jest

### Frontend (Future)
- **Framework**: React
- **Build Tool**: rsbuild (not Vite)
- **State Management**: TBD (Zustand or similar)
- **Styling**: TBD

### Development
- **Package Manager**: npm
- **Monorepo**: npm workspaces
- **Bundling**: rsbuild
- **Linting**: ESLint
- **Formatting**: Prettier

## Validation Commands

### Development
```bash
npm run dev                    # Start development servers
npm run build                  # Build all packages
npm run test                   # Run tests
npm run test:all              # Run all tests with timeout
npm run clean                  # Clean build artifacts
```

### Package-Specific
```bash
npm run dev -w packages/server     # Server development
npm run build -w packages/shared   # Build shared package
npm run test -w packages/server    # Test server package
```

## Project Structure Overview
```
claude-agent-manager/
├── .claude/                    # Context Engineering
│   ├── feature.md
│   ├── work-analysis.md
│   ├── task.md
│   └── context-links.md
├── docs/                       # Documentation
│   ├── getting-started.md
│   └── context-engineering/    # CE docs
├── packages/                   # Source packages
│   ├── server/                # Express server
│   ├── client/                # React dashboard
│   ├── agentic-base/          # Agent foundation
│   └── shared/                # Common utilities
├── scripts/                    # Build scripts
├── package.json               # Root configuration
└── tsconfig.json             # TypeScript config
```

## Quick Navigation

### For Development
- Start here: [Getting Started Guide](/home/clayton/projects/claude-agent-manager/docs/getting-started.md)
- Architecture decisions: [Work Analysis](/home/clayton/projects/claude-agent-manager/.claude/work-analysis.md)
- Current work: [Task Document](/home/clayton/projects/claude-agent-manager/.claude/task.md)

### For Context Engineering
- Feature requirements: [Feature Spec](/home/clayton/projects/claude-agent-manager/.claude/feature.md)
- Implementation plan: [Work Analysis](/home/clayton/projects/claude-agent-manager/.claude/work-analysis.md)
- Project patterns: [Coding Standards](/home/clayton/projects/claude-agent-manager/docs/context-engineering/coding-standards.md)

### For Debugging
- Server logs: Check packages/server/src/ for logging utilities
- Redis state: Connect to Redis instance for state inspection
- WebSocket: Browser dev tools for WebSocket communication

## External References

### Claude Code Integration
- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Redis Documentation](https://redis.io/docs/)

### Development Tools
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [rsbuild Documentation](https://rsbuild.dev/)

---

**Last Updated**: 2025-07-15  
**Status**: Context Engineering initialized