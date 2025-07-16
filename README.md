# Claude Agent Manager

A comprehensive system for monitoring and managing Claude Code agents with real-time tracking, WebSocket communication, and a professional dashboard interface.

## 🏗️ **Architecture**

```
claude-agent-manager/
├── packages/
│   ├── agentic-base/       # 🎯 Language-agnostic starter kit
│   ├── client/            # 🖥️  React dashboard with real-time monitoring
│   ├── server/            # 🛡️  Express backend with WebSocket support
│   └── shared/            # 📦 Common TypeScript types
├── .claude/               # 🤖 Context Engineering templates
│   ├── hooks/             # 🪝 Claude Code hooks for monitoring
│   └── settings.json      # ⚙️  Claude Code configuration
└── docs/                  # 📚 Documentation and guides
```

## ✨ **Features**

### **Real-time Agent Monitoring**
- Live agent status updates via WebSocket
- Professional dashboard with responsive design
- Agent hierarchy visualization
- Real-time log streaming with filtering
- **Claude Code hooks integration** for comprehensive monitoring

### **Language-Agnostic Starter Kit**
- **agentic-base**: Pure templates for any tech stack
- Context Engineering documentation structure
- Proven Claude Code command patterns
- No dependencies - just copy and customize

### **Production-Ready Backend**
- Express server with Redis/memory storage fallback
- Automatic failover when Redis unavailable
- WebSocket real-time communication
- RESTful API with comprehensive error handling

### **Modern Client Dashboard**
- React + TypeScript with strict mode
- Tailwind CSS professional UI
- rsbuild for lightning-fast builds (0.4s)
- Performance optimized (280KB total bundle)

## 🚀 **Quick Start**

### **Option 1: One-Command Demo**
```bash
./start-demo.sh
```

### **Option 2: Manual Setup**
```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development servers
npm run dev
```

### **Option 3: With Redis (Recommended)**
```bash
# Install Redis (Ubuntu/Debian)
sudo apt update && sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Start the application
npm run dev
```

### **Option 4: With Claude Code Hooks**
```bash
# Setup Claude Code hooks for comprehensive monitoring
cd .claude/hooks
./setup.sh

# Start the application
npm run dev

# Now Claude Code will automatically send monitoring data to the dashboard
```

## 🌐 **Access URLs**

- **Client Dashboard**: http://localhost:3000
- **Server API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws
- **Health Check**: http://localhost:3001/health

## 🎯 **Package Overview**

### **📁 agentic-base** - Starter Kit
```bash
# Copy to your new project
cp -r packages/agentic-base/* /path/to/your/project/

# Includes:
# - CLAUDE.md (project configuration template)
# - .claude/commands/ (proven command patterns)
# - templates/ (Context Engineering docs)
# - README templates and setup guides
```

**Key Features:**
- ✅ Language agnostic (works with any tech stack)
- ✅ No npm package - simple file copying
- ✅ Context Engineering methodology
- ✅ Proven Claude Code workflows

### **🖥️ client** - React Dashboard
```bash
# Development
npm run dev -w packages/client

# Production build
npm run build -w packages/client
```

**Features:**
- ✅ Real-time agent monitoring
- ✅ WebSocket integration with auto-reconnection
- ✅ Professional UI with Tailwind CSS
- ✅ Responsive design (mobile to desktop)
- ✅ Virtual scrolling for performance
- ✅ TypeScript strict mode

### **🛡️ server** - Express Backend
```bash
# Development
npm run dev -w packages/server

# Production build
npm run build -w packages/server
```

**Features:**
- ✅ Express + WebSocket server
- ✅ Redis with in-memory fallback
- ✅ Automatic failover when Redis unavailable
- ✅ RESTful API endpoints
- ✅ Real-time event broadcasting

### **📦 shared** - Common Types
```bash
# Build shared types
npm run build -w packages/shared
```

**Includes:**
- ✅ TypeScript interfaces for Agent, LogEntry, etc.
- ✅ Shared utilities and validation
- ✅ Type-safe communication between packages

## 🪝 **Claude Code Hooks Integration**

The system includes comprehensive Claude Code hooks that provide real-time monitoring of Claude Code sessions:

### **Hook Types**
- **preToolUse**: Validates and secures tool usage before execution
- **postToolUse**: Analyzes tool execution results and performance  
- **notification**: Processes system notifications and alerts
- **stop**: Manages session termination and cleanup
- **subagentStop**: Handles subagent lifecycle and results

### **Security Features**
- **Command blocking**: Prevents dangerous operations (`rm -rf`, `sudo`, etc.)
- **File access validation**: Blocks access to sensitive system files
- **Path traversal protection**: Prevents directory traversal attacks
- **Tool restrictions**: Configurable tool allowlist/blocklist

### **Setup**
```bash
# Install hooks to your user directory (recommended)
npm run hooks:install

# This installs the hooks to ~/.claude/hooks/ so they work from any directory
# The hooks will automatically be available in all your Claude Code sessions
```

**What the installer does:**
- Copies all hooks to `~/.claude/hooks/`
- Updates `~/.claude/settings.json` with hook configuration
- Creates `.env` file with default configuration
- Backs up any existing hooks

### **Configuration**
The hooks are automatically configured in `.claude/settings.json`:
```json
{
  "hooks": {
    "preToolUse": {
      "command": "node", 
      "args": [".claude/hooks/preToolUse.js"],
      "enabled": true
    }
  }
}
```

### **Environment Variables**
```bash
CAM_SERVER_URL=http://localhost:3001    # Backend server URL
CAM_AGENT_ID=claude-agent-manager       # Agent identifier
CAM_SECURITY_ENABLED=true               # Enable security checks
CAM_LOG_LEVEL=info                      # Logging level
```

For detailed configuration and usage, see [.claude/hooks/README.md](.claude/hooks/README.md)

## 🔌 **API Endpoints**

### **REST API**
```bash
# Agent management
GET    /api/agents              # List all agents
GET    /api/agents/:id          # Get specific agent
POST   /api/agents              # Create new agent
PATCH  /api/agents/:id/status   # Update agent status
DELETE /api/agents/:id          # Delete agent

# Hook events (used by Claude Code hooks)
POST   /api/hooks/claude-code   # Individual hook events
POST   /api/hooks/claude-code/batch  # Batch hook events
GET    /api/hooks/health         # Hook system health check

# Health check
GET    /health                  # Server health status
```

### **WebSocket Events**
```javascript
// Real-time events
'agent_update'    // Agent status/data changes
'log_entry'       // New log entries from agents
'handoff'         // Agent-to-agent handoffs
'hook_event'      // Claude Code hook events
'ping'/'pong'     // Heartbeat mechanism
```

## 🛠️ **Development**

### **Available Scripts**
```bash
# Development
npm run dev          # Start server + client concurrently
npm run build        # Build all packages
npm run test:all     # Run all tests
npm run clean        # Clean build artifacts

# Feature Management
npm run feature:status   # Check current active feature
npm run feature:archive  # Archive completed feature to docs/
npm run feature:new      # Archive current + prepare for new feature

# Claude Code Hooks
npm run hooks:install    # Install hooks to ~/.claude/ directory
npm run hooks:setup      # Alias for hooks:install

# Package-specific
npm run dev -w packages/server    # Server only
npm run dev -w packages/client    # Client only
npm run build -w packages/shared  # Shared types only
```

### **Environment Variables**
```bash
# Server configuration (.env)
PORT=3001                           # Server port
REDIS_URL=redis://localhost:6379   # Redis connection
CLIENT_URL=http://localhost:3000    # CORS origin
RETENTION_DAYS=30                   # Data retention period

# Client automatically proxies to server
# No client-specific env vars needed for development
```

## 🔧 **Configuration**

### **Redis Setup (Production)**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping  # Should return: PONG
```

### **Memory Storage (Development)**
The system automatically falls back to in-memory storage when Redis is unavailable:

```
⚠️  Redis connection failed, falling back to memory storage
⚠️  Install Redis for production: sudo apt install redis-server
✅ Memory storage ready (development mode)
```

**Note**: Memory storage data is lost on restart!

## 📊 **Performance**

### **Build Performance**
- **Server**: TypeScript compilation ~0.5s
- **Client**: rsbuild (Rspack) ~0.4s  
- **Total**: Complete workspace build ~1s

### **Client Bundle**
```
File (web)                              Size       Gzip   
dist/index.html                         1.2 kB     0.54 kB
dist/static/js/lib-router.31458202.js   23.4 kB    8.5 kB
dist/static/css/index.05445616.css      24.9 kB    5.4 kB
dist/static/js/469.672d3e49.js          38.5 kB    11.6 kB
dist/static/js/index.cca48c24.js        52.3 kB    12.9 kB
dist/static/js/lib-react.a5ebdfcb.js    140.0 kB   45.0 kB

                               Total:   280.3 kB   84.0 kB
```

### **Runtime Performance**
- **First Paint**: <1 second
- **Time to Interactive**: <2 seconds
- **Memory Usage**: Optimized with virtual scrolling
- **WebSocket**: Automatic reconnection with exponential backoff

## 🧪 **Testing**

```bash
# Run all tests
npm run test:all

# Package-specific tests
npm run test -w packages/server
npm run test -w packages/client
npm run test -w packages/shared

# Test with coverage
npm run test:coverage
```

**Current Status**: All packages configured with Jest, tests pass with `--passWithNoTests`

## 🚀 **Deployment**

### **Development**
```bash
npm run dev  # Starts both server and client
```

### **Production**
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start -w packages/server

# Serve client static files
# (configure nginx/apache to serve packages/client/dist)
```

### **Docker (Optional)**
```bash
# Redis with Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use docker-compose for full stack
# (docker-compose.yml not included - can be added if needed)
```

## 🎯 **Use Cases**

### **For Developers**
1. **Monitor Claude Code agents** in real-time
2. **Debug agent interactions** with live log streaming  
3. **Track agent hierarchies** and handoffs
4. **Analyze agent performance** and bottlenecks

### **For Projects**
1. **Copy agentic-base** to new projects
2. **Customize templates** for your tech stack
3. **Use proven command patterns** for Claude Code
4. **Implement Context Engineering** methodology

### **For Teams**
1. **Shared agent monitoring** across team members
2. **Collaborative debugging** with real-time updates
3. **Project overview** with agent grouping
4. **Performance tracking** and optimization

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run validation: `npm run build && npm run test:all`
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

## 🏆 **Project Status**

**✅ Complete Implementation**
- ✅ Architectural realignment finished
- ✅ Language-agnostic starter kit ready
- ✅ Real-time client dashboard operational
- ✅ Production-ready backend with fallbacks
- ✅ Full TypeScript strict mode
- ✅ Performance optimized
- ✅ Comprehensive documentation

**🎯 Ready for Production Use**

---

**⚡ Get started in 30 seconds:**
```bash
git clone <repository-url>
cd claude-agent-manager
./start-demo.sh
```

Open http://localhost:3000 and start monitoring your Claude Code agents! 🚀