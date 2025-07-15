# Deployment Process - Claude Agent Manager

## CI/CD and Deployment Strategy

**Current Status**: MVP Development Phase  
**Build Tool**: npm workspaces with TypeScript  
**Target Environment**: Local development service  
**Future Goal**: Production-ready deployment pipeline  

## Build Process

### Validation Gates

**Pre-commit Validation** (detected working):
```bash
# Full build validation - PASSES ✅
npm run build                  # Build all packages (working)

# Test validation - NEEDS SETUP ⚠️
npm run test:all              # Run all tests (no tests found currently)
```

**Build Command Breakdown**:
```bash
# Sequential build process (working)
npm run build -w packages/shared      # 1. Build shared types/utils
npm run build -w packages/server      # 2. Build server (depends on shared)
npm run build -w packages/agentic-base # 3. Build agentic-base (depends on shared)
```

### Package Dependencies

**Build Order** (enforced by dependency chain):
1. `packages/shared` - Core types and utilities
2. `packages/server` - Express server (imports from shared)
3. `packages/agentic-base` - NPM package (imports from shared)
4. `packages/client` - React dashboard (future, imports from shared)

### TypeScript Compilation

**Configuration**: Each package has own `tsconfig.json`  
**Output**: `dist/` directory in each package  
**Target**: ES2022 with Node.js compatibility  

```json
// Example tsconfig.json structure
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

## Development Workflow

### Local Development Setup

**Prerequisites**:
- Node.js 18+
- Redis server
- npm (comes with Node.js)

**Setup Commands**:
```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Start Redis (in separate terminal)
redis-server

# 4. Start development servers
npm run dev
```

**Development Commands**:
```bash
# Development mode with hot reload
npm run dev                    # Start all dev servers
npm run dev -w packages/server # Start only server

# Build and test
npm run build                  # Build all packages
npm run test:all              # Run all tests (when implemented)
npm run clean                  # Clean build artifacts
```

### Package Scripts Analysis

**Root Package Scripts** (from package.json):
```json
{
  "build": "npm run build -w packages/shared && npm run build -w packages/server && npm run build -w packages/agentic-base",
  "dev": "concurrently \"npm run dev -w packages/server\" \"npm run dev -w packages/client\"",
  "test": "npm run test -w packages/server && npm run test -w packages/client",
  "test:all": "npm run test",
  "clean": "rimraf packages/*/dist packages/*/build",
  "setup": "npm install && npm run build"
}
```

## Testing Integration

### Current Test Status

**Issue Identified**: No tests currently exist  
**Error**: `No tests found, exiting with code 1`  
**Impact**: CI/CD pipeline will fail until tests are implemented  

**Immediate Action Items**:
1. Create basic test files in each package
2. Configure Jest in each package
3. Add `--passWithNoTests` flag temporarily
4. Implement test suites as part of development

### Test Configuration Setup

**Package-level Jest Config** (to be created):
```javascript
// packages/server/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

**Temporary Fix for CI**:
```bash
# Add to package.json test scripts temporarily
"test": "jest --passWithNoTests"
```

## Environment Configuration

### Environment Variables

**Development Environment**:
```bash
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
RETENTION_DAYS=30
MAX_AGENTS=1000
CLIENT_URL=http://localhost:3000
```

**Test Environment**:
```bash
NODE_ENV=test
PORT=3002
REDIS_URL=redis://localhost:6379/15  # Test database
LOG_LEVEL=error
```

**Production Environment** (future):
```bash
NODE_ENV=production
PORT=3001
REDIS_URL=redis://production-host:6379
LOG_LEVEL=info
RETENTION_DAYS=90
MAX_AGENTS=10000
```

### Configuration Management

**Config Files**:
- `.env.example` - Environment template
- `.env.development` - Development overrides
- `.env.test` - Test environment
- `.env.production` - Production settings

**Config Loading Pattern**:
```typescript
// packages/server/src/config.ts
import dotenv from 'dotenv';

// Load environment-specific config
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
dotenv.config(); // Load .env as fallback

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  logLevel: process.env.LOG_LEVEL || 'info',
  retentionDays: parseInt(process.env.RETENTION_DAYS || '30'),
  maxAgents: parseInt(process.env.MAX_AGENTS || '1000')
};
```

## Local Service Deployment

### Service Architecture

**Current Setup**: Development service  
**Target**: Local daemon service  
**Components**:
- Management Server (port 3001)
- Redis instance (port 6379)
- Web Dashboard (port 3000, future)

### Service Start/Stop Commands

**Manual Start**:
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Management Server
npm run dev -w packages/server

# Terminal 3: Start Dashboard (future)
npm run dev -w packages/client
```

**Daemon Service** (future implementation):
```bash
# Install as system service
npm install -g @claude-agent-manager/server
claude-agent-manager install

# Service management
claude-agent-manager start
claude-agent-manager stop
claude-agent-manager restart
claude-agent-manager status
```

### Health Checks

**Service Health Endpoints**:
```bash
# Server health
curl http://localhost:3001/health
# Expected: {"status":"ok","redis":"connected","uptime":12345}

# Redis health
redis-cli ping
# Expected: PONG
```

**Monitoring Script** (to be created):
```bash
#!/bin/bash
# scripts/health-check.sh

echo "Checking Claude Agent Manager health..."

# Check server
if curl -s http://localhost:3001/health > /dev/null; then
  echo "✅ Server: Running"
else
  echo "❌ Server: Not responding"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis: Running"
else
  echo "❌ Redis: Not running"
fi
```

## Production Deployment (Future)

### Container Strategy

**Docker Configuration** (planned):
```dockerfile
# Dockerfile.server
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY packages/shared/dist ./packages/shared/dist
COPY packages/server/dist ./packages/server/dist

EXPOSE 3001
CMD ["node", "packages/server/dist/index.js"]
```

**Docker Compose** (planned):
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    
  server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - redis
      
  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.client
    ports:
      - "3000:3000"
    depends_on:
      - server

volumes:
  redis_data:
```

### CI/CD Pipeline (Future)

**GitHub Actions Workflow** (planned):
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build packages
        run: npm run build
      
      - name: Run tests
        run: npm run test:all
        env:
          REDIS_URL: redis://localhost:6379/15
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: echo "Deploy to production"
```

## Monitoring and Logging

### Application Logging

**Log Configuration**:
```typescript
// packages/server/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

**Log Levels**:
- `error`: System errors, exceptions
- `warn`: Warning conditions
- `info`: General operational messages
- `debug`: Detailed debugging information

### Performance Monitoring

**Metrics to Track**:
- Agent registration latency
- WebSocket connection count
- Redis memory usage
- HTTP response times
- Error rates

**Monitoring Tools** (future):
- Prometheus for metrics collection
- Grafana for visualization
- AlertManager for notifications

## Backup and Recovery

### Redis Data Backup

**Backup Strategy**:
```bash
# Manual backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d-%H%M%S).rdb

# Automated backup (cron)
0 2 * * * /scripts/backup-redis.sh
```

**Recovery Process**:
```bash
# Stop Redis
sudo systemctl stop redis

# Restore backup
cp /backup/redis-20250715-020000.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis
```

### Configuration Backup

**Important Files to Backup**:
- Environment configurations (.env files)
- SSL certificates (future)
- Application configuration files
- User data and preferences

## Security Considerations

### Development Security

**Current Level**: Development-friendly (minimal security)  
**Access Control**: None (local service)  
**Data Protection**: Basic sanitization  

### Production Security (Future)

**Authentication**:
- JWT-based authentication
- API key management
- Role-based access control

**Data Protection**:
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention
- XSS protection

**Infrastructure Security**:
- Network segmentation
- Firewall configuration
- Regular security updates
- Vulnerability scanning

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# TypeScript compilation errors
npm run clean && npm run build

# Dependency issues
rm -rf node_modules package-lock.json
npm install
```

**Service Issues**:
```bash
# Port already in use
lsof -ti:3001 | xargs kill -9

# Redis connection failed
redis-cli ping
sudo systemctl start redis
```

**Test Issues**:
```bash
# No tests found (current issue)
# Temporary fix: add --passWithNoTests to test scripts
# Permanent fix: implement test suites
```

### Debug Mode

**Enable Debug Logging**:
```bash
export LOG_LEVEL=debug
export NODE_ENV=development
npm run dev
```

**Debug Tools**:
- VS Code debugger configuration
- Node.js inspector
- Redis CLI for data inspection
- Browser dev tools for WebSocket debugging

---

**Document Status**: Complete (with current limitations noted)  
**Last Updated**: 2025-07-15  
**Next Review**: After test implementation and production deployment  
**Related Documents**: [Testing Strategy](./testing-strategy.md), [Architecture](./architecture.md)