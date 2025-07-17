# Agentic-Base Starter Kit

A language-agnostic starter kit implementing the **Agentic Development Methodology** - a systematic approach using async specialist subagents for accelerated development workflows with Claude Code.

## 🚀 What is Agentic Development?

The Agentic Development Methodology revolutionizes how you work with Claude Code by leveraging **async specialist subagents** for parallel analysis and implementation. Instead of sequential development, you launch multiple domain experts simultaneously to analyze, plan, and implement features with unprecedented speed and quality.

### Key Benefits

- **🔄 Parallel Analysis**: Multiple specialists analyze concurrently
- **⚡ Accelerated Development**: Reduced iteration cycles through upfront analysis  
- **🎯 Quality Assurance**: Built-in review and validation cycles
- **📊 Knowledge Consolidation**: Expert findings merged systematically
- **🔗 Real-time Integration**: Live updates via Claude Code hooks
- **🌐 Environment Flexibility**: Dynamic port configuration and service discovery

## 📦 What's Included

### Core Components

- **🤖 Enhanced Hook System**: Real-time integration with dynamic service discovery
- **⚙️ Environment Configuration**: Configurable ports and service URLs
- **📋 Agentic Methodology**: Complete workflow templates and specialist protocols
- **🔧 Setup Automation**: One-command project initialization
- **📝 PRD Generation**: Interactive Product Requirements Document creation
- **🎨 Context Engineering**: Comprehensive documentation templates

### Specialist Subagent Roles

- **🏗️ Architecture Specialist**: System design, patterns, scalability
- **🧪 Quality Assurance Specialist**: Testing strategies, automation
- **👨‍💻 Code Review Specialist**: Security, performance, quality
- **🔧 DevOps Specialist**: CI/CD, deployment, infrastructure
- **🎨 Frontend Specialist**: UI/UX, accessibility, components
- **🗄️ Backend Specialist**: APIs, databases, server architecture
- **🔒 Security Specialist**: Threat modeling, secure coding
- **📊 Performance Specialist**: Optimization, monitoring, profiling

## ⚡ Quick Start

### 1. Copy Agentic-Base to Your Project

```bash
# Copy entire agentic-base to your new project
cp -r agentic-base/* /path/to/your/new/project/
cd /path/to/your/new/project/

# Or clone and copy
git clone https://github.com/your-repo/claude-agent-manager.git
cp -r claude-agent-manager/packages/agentic-base/* /path/to/your/project/
```

### 2. One-Command Setup

```bash
# Complete agentic environment setup
npm run setup

# With custom ports
npm run setup -- --server-port 3002 --client-port 3001

# Development environment
npm run setup:dev

# Production environment  
npm run setup:prod
```

### 3. Start Development

```bash
# Check installation
npm run hooks:status
npm run hooks:test

# Create your first Product Requirements Document
npm run prd:create

# Start your development workflow
npm run dev
```

## 🛠️ Setup Process

The setup script automatically handles:

### ✅ Hook Installation
- Copies Claude Code hooks to `~/.claude/hooks`
- Configures real-time integration
- Sets up service discovery

### ⚙️ Environment Configuration  
- Creates `.env` from template
- Configures dynamic ports
- Sets up service URLs

### 📦 Dependency Management
- Installs npm dependencies
- Validates installation
- Checks compatibility

### 🔍 Validation
- Tests hook connectivity
- Verifies environment setup
- Validates service discovery

## 📋 Environment Configuration

All services support dynamic port configuration:

```bash
# Core Service Ports (configurable)
SERVER_PORT=3001          # Your backend server
CLIENT_PORT=3000          # Your frontend client  
WS_PORT=3001             # WebSocket port

# Service URLs (auto-generated)
SERVER_URL=http://localhost:${SERVER_PORT}
CLIENT_URL=http://localhost:${CLIENT_PORT}
WS_URL=ws://localhost:${WS_PORT}

# Claude Code Integration
CAM_SERVER_URL=${SERVER_URL}    # Hook target
CAM_AGENT_ID=your-project-name  # Agent identifier
CAM_PROJECT_PATH=/path/to/project
```

### Service Discovery

The hook system automatically discovers services:

1. **Environment Variables**: Uses configured URLs
2. **Port Scanning**: Falls back to common ports  
3. **Health Checks**: Validates service availability
4. **Circuit Breaker**: Handles service failures gracefully

## 🤖 Agentic Methodology Workflows

### Core Workflow: Async Specialist Protocol

```javascript
// Launch multiple specialists concurrently
Task: Architecture specialist analysis
Task: Quality assurance review
Task: Security assessment  
Task: Performance analysis

// Consolidate findings
// Implement with continuous validation
// Create PR with specialist summary
```

### Mandatory Process Steps

1. **📋 Planning Phase**
   - Create `work-analysis.md` with requirements
   - Launch async specialist subagents
   - Consolidate expert findings
   - Get developer approval

2. **🔄 TDD Implementation**  
   - RED: Write failing tests first
   - GREEN: Minimal code to pass
   - REFACTOR: Improve while tests pass

3. **🌿 Automated Git Workflow**
   - Create feature branch
   - Continuous validation
   - Auto-generate PR with analysis
   - Mark work complete

### TodoWrite Templates

The methodology includes templates for different task types:

```javascript
// Feature Development Template
TodoWrite([
  {"id": "specialists-async", "content": "Launch async specialist subagents", "status": "pending", "priority": "high"},
  {"id": "branch-create", "content": "Create feature branch", "status": "pending", "priority": "high"},
  {"id": "tdd-red", "content": "RED: Write failing test", "status": "pending", "priority": "high"},
  {"id": "tdd-green", "content": "GREEN: Implement code", "status": "pending", "priority": "high"},
  {"id": "pr-create", "content": "Create PR with analysis", "status": "pending", "priority": "high"}
])
```

## 📝 Product Requirements Document (PRD) Generation

Interactive PRD creation for comprehensive project planning:

```bash
# Launch PRD creation wizard
npm run prd:create
```

### PRD Scenarios

1. **New Application**: Full product discovery interview
2. **Existing Application**: Analyze codebase + feature gaps
3. **Modify Existing PRD**: Update and refine requirements

### PRD Features

- **🎯 Product Discovery**: Comprehensive interview process
- **🔍 Application Analysis**: Automated codebase examination
- **📊 Gap Analysis**: Identify missing features
- **📋 Structured Output**: Professional PRD format
- **🔄 Iterative Refinement**: Easy updates and modifications

## 🏗️ Project Structure

After setup, your project will have:

```
your-project/
├── .env                     # Environment configuration
├── CLAUDE.md               # Agentic methodology configuration
├── package.json            # Enhanced scripts for agentic workflow
├── hooks/                  # Claude Code hooks (copied to ~/.claude/hooks)
│   ├── core/              # Hook framework
│   ├── preToolUse.js      # Pre-execution hooks
│   ├── postToolUse.js     # Post-execution hooks
│   └── ...                # Additional hook files
├── scripts/               # Setup and utility scripts
│   ├── setup-agentic-base.js  # Main setup script
│   └── install-hooks.js   # Hook installation
├── .claude/               # Claude Code configuration
│   ├── commands/          # Custom slash commands
│   ├── work-analysis.md   # Current work planning
│   └── settings.json      # Claude Code settings
└── templates/             # Documentation templates
    └── docs/              # Context engineering templates
```

## 🎯 Available Commands

### Setup & Environment
```bash
npm run setup              # Complete project setup
npm run setup:dev          # Development environment
npm run setup:prod         # Production environment  
npm run env:configure      # Configure ports interactively
```

### Development Workflow
```bash
npm run dev                # Start development servers
npm run build              # Build project
npm run test:all           # Run all tests (10min timeout)
npm run validate           # Run all validation checks
```

### Hook Management
```bash
npm run hooks:install      # Install/update hooks
npm run hooks:status       # Check hook status
npm run hooks:test         # Test hook connectivity
```

### Agentic Methodology
```bash
npm run prd:create         # Create Product Requirements Document
npm run feature:status     # Check current feature status
npm run feature:new        # Start new feature
```

### Quality Gates
```bash
npm run lint               # Run linting
npm run typecheck          # Type checking
npm run clean              # Clean build artifacts
```

## 📚 Usage Examples

### Starting a New Feature

```bash
# 1. Create PRD for planning
npm run prd:create

# 2. Claude Code will automatically:
#    - Launch async specialist subagents
#    - Create work-analysis.md plan
#    - Get your approval
#    - Create feature branch
#    - Implement with TDD cycles
#    - Create PR with specialist analysis

# 3. Review the PR and merge when ready
```

### Working with Specialists

In Claude Code, launch multiple specialists:

```
Task: Architecture specialist - analyze system design for user authentication
Task: Security specialist - review authentication security requirements  
Task: Frontend specialist - design user authentication UI/UX
Task: Backend specialist - design authentication API endpoints
```

Claude will run these concurrently and consolidate findings.

### Environment Configuration

```bash
# Different port configuration
npm run setup -- --server-port 8080 --client-port 3000

# Skip certain setup steps
npm run setup -- --skip-dependencies --skip-hooks

# Production environment with custom ports
npm run setup:prod -- --server-port 80 --client-port 443
```

## 🔧 Customization Guide

### For Your Technology Stack

**React/Node.js Projects**:
```bash
# Update package.json scripts
"dev": "concurrently \"npm run server\" \"npm run client\"",
"build": "npm run build:client && npm run build:server",
"test:all": "npm run test:client && npm run test:server"
```

**Python Projects**:
```bash
# Update package.json scripts  
"dev": "python manage.py runserver",
"build": "python -m build",
"test:all": "pytest --timeout=600"
```

**Other Languages**:
- Adapt build/test commands in package.json
- Update CLAUDE.md validation gates
- Customize hook integration for your stack

### Custom Specialist Roles

Add project-specific specialists by extending the methodology:

```javascript
// In .claude/commands/ create new specialist commands
Task: Database specialist - analyze data model design
Task: ML specialist - review machine learning pipeline
Task: Mobile specialist - assess mobile app architecture
```

## 🔍 Troubleshooting

### Common Issues

**Hook Connection Failures**:
```bash
# Check server URL configuration
npm run hooks:test

# Verify environment variables
cat .env | grep CAM_SERVER_URL

# Reinstall hooks
npm run hooks:install
```

**Port Conflicts**:
```bash
# Kill existing processes
npm run kill-ports  # (if available in your package.json)

# Use different ports
npm run setup -- --server-port 3002 --client-port 3001
```

**Environment Issues**:
```bash
# Validate complete setup
npm run validate

# Check Node.js version (18+ required)
node --version

# Recreate environment
rm .env && npm run setup
```

### Debug Procedures

1. **Server Connection**: Check console for server startup messages
2. **Hook Status**: Use `npm run hooks:status` for connectivity
3. **Environment Validation**: Verify `.env` matches your setup
4. **Service Discovery**: Check hook logs for service discovery attempts

## 🚀 Advanced Features

### Multi-Environment Support

```bash
# Environment-specific setup
npm run setup:dev     # Development with debug logging
npm run setup:prod    # Production with optimizations
```

### Custom Port Discovery

The system automatically handles:
- Port conflicts with automatic assignment
- Service health checking
- Fallback URL discovery
- Cross-platform networking

### Hook Circuit Breaker

Built-in resilience features:
- Automatic retry with exponential backoff
- Circuit breaker for failed services
- Graceful degradation when server unavailable
- Health check validation

## 📖 Documentation

### Context Engineering

The starter kit includes comprehensive documentation templates:

- `templates/docs/context-engineering/` - Complete documentation structure
- `CLAUDE.md` - Main project configuration
- Work planning templates and workflows

### Methodology Documentation

- **Specialist Protocols**: How to work with async subagents
- **Workflow Integration**: TDD cycles with specialist validation
- **Quality Gates**: Validation checkpoints throughout development

## 🤝 Contributing

Help improve the agentic methodology:

1. **Test with Real Projects**: Validate workflows in production
2. **Document Patterns**: Share successful specialist combinations  
3. **Extend Capabilities**: Add new specialist types
4. **Improve Documentation**: Clarify setup and usage

## 📄 License

MIT License - use freely in your projects.

---

## 🎯 Next Steps

1. **Complete Setup**: Run `npm run setup` 
2. **Create First PRD**: Use `npm run prd:create`
3. **Launch Specialists**: Start with architecture and quality analysis
4. **Implement with TDD**: Follow RED-GREEN-REFACTOR cycles
5. **Review PR**: Claude will auto-generate PR with specialist findings

**Welcome to accelerated development with the Agentic Methodology! 🚀**