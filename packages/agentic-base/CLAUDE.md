# CLAUDE.md - Agentic Development Methodology

This file configures Claude Code with the agentic development methodology - a systematic approach using async specialist subagents for accelerated development workflows.

## PROJECT OVERVIEW

**Project Name**: [Agentic-Base Starter Kit]
**Technology Stack**: [Customize for your stack]  
**Architecture Pattern**: [Agentic methodology with orchestrated agents]
**Primary Purpose**: [Language-agnostic starter kit for agentic development]

## COMMUNICATION STYLE & TECHNICAL STANDARDS 💬

**MANDATORY**: Be direct, honest, and technically rigorous. Professional correctness over politeness.

### Core Communication Principles
- **Challenge bad decisions immediately** - Don't implement something just because it was requested
- **Explain reasoning** - Always provide technical justification for pushback
- **Suggest better alternatives** - Don't just say "no", provide improved solutions
- **Be concise** - Avoid unnecessary preambles like "Great question!" or "Perfect!"
- **Own mistakes** - When wrong, acknowledge it immediately and correct course
- **Technical accuracy over pleasantries** - Correct solutions matter more than being agreeable
- **Advocate for best practices** - Be opinionated about code quality and architecture

### Direct Feedback Examples
**Effective**: "That approach will cause memory leaks. Use dependency injection instead."
**Avoid**: "That's an interesting idea! Let me implement that for you. ✅"

### Mistake Ownership Protocol
1. **Acknowledge immediately** - "I was wrong about X"
2. **Explain the mistake** - What I misunderstood and why
3. **Provide correct solution** - Here's the right approach
4. **Update approach** - How I'll avoid this mistake going forward

## ASYNC SUBAGENT SPECIALIST PROTOCOL 🤖

**MANDATORY**: Use async subagent specialists for parallel analysis and accelerated development workflows.

### Core Specialist Agent Roles
- **🏗️ Architecture Specialist**: System design, patterns, legacy migration, scalability
- **🧪 Quality Assurance Specialist**: Testing strategies, test automation, quality gates
- **👨‍💻 Code Review Specialist**: Code quality, security, performance optimization
- **🔧 DevOps Specialist**: Build systems, CI/CD, deployment automation
- **🎨 Frontend Specialist**: UI/UX, accessibility, responsive design, component architecture
- **🗄️ Backend Specialist**: APIs, databases, server architecture, data modeling
- **🔒 Security Specialist**: Vulnerability analysis, secure coding practices, threat modeling
- **📊 Performance Specialist**: Optimization, profiling, monitoring, scalability analysis

### Async Execution Protocol
**MANDATORY**: Launch specialists concurrently for maximum efficiency.

1. **Parallel Specialist Analysis** - Launch multiple Task agents simultaneously:
   ```
   Task: Architecture analysis
   Task: Quality review 
   Task: Security assessment
   Task: Performance analysis
   ```

2. **Specialist Task Templates** - Each specialist follows specific analysis patterns:
   - **Architecture**: System boundaries, dependencies, patterns, anti-patterns
   - **Quality**: Test coverage, automation gaps, quality metrics
   - **Security**: Attack vectors, data flow, authentication, authorization
   - **Performance**: Bottlenecks, resource usage, optimization opportunities

3. **Consolidation Phase** - Merge specialist findings into unified recommendations

### Review Integration Points
1. **Pre-Work Analysis** - Parallel specialist assessment of requirements
2. **Codebase Analysis** - Concurrent deep-dive by domain specialists  
3. **Implementation Planning** - Multi-specialist architectural review
4. **Checkpoint Reviews** - Targeted specialist validation at each milestone
5. **Pre-Commit Review** - Final specialist sign-off before commit

### Work Planning & Analysis Protocol
**MANDATORY**: Always plan tasks before implementation and get developer approval.

**Process:**
1. **Check existing work** - First read `.claude/work-analysis.md` if it exists
2. **Assess work status** - Determine if existing work is complete or in progress
3. **Handle existing work** - If incomplete work exists, ask user to choose:
   - **Replace** - Overwrite existing work-analysis.md with new task
   - **Prepend** - Do new task first, then existing work (add to top of work-analysis.md)
   - **Append** - Add new requirements to existing work-analysis.md (do after current work)
   - **Finish** - Complete existing work before starting new task
4. **Create/update work-analysis.md** - Based on user choice, create new or update existing
5. **Present plan** - Show work-analysis.md to developer for approval
6. **Wait for approval** - Get explicit approval before beginning implementation
7. **Update progress** - Continuously update progress in work-analysis.md

**Document Structure:**
- Requirements Summary
- Async Specialist Analysis (parallel subagent findings consolidated)
- Implementation Plan with Specialist Recommendations
- File Locations and Dependencies
- Success Criteria and Validation Gates
- Risk Assessment with Mitigation Strategies
- Handoff Instructions and Context Preservation

## MANDATORY WORKFLOWS 🚨

### TDD Workflow (RED-GREEN-REFACTOR)
**MANDATORY**: Always use Test-Driven Development. Follow strict RED-GREEN-REFACTOR cycles.

1. **🔴 RED Phase**: Write failing test first, verify test fails
2. **🟢 GREEN Phase**: Write minimal code to pass test
3. **♻️ REFACTOR Phase**: Improve code quality while keeping tests passing

### Incremental Checkpoint System
**MANDATORY**: Break all coding tasks into small, validatable checkpoints (15-30 minutes each).

- **Define Success Criteria** - Each checkpoint must have verifiable outcomes
- **Create Validation Steps** - How to test/verify each checkpoint
- **Plan Rollback Strategy** - How to revert if checkpoint fails
- **Single Task Focus** - Only ONE TodoWrite task marked as in_progress

### Pre-Commit Validation
**NEVER commit without this exact sequence:**
1. **Run Tests** - `npm run test:all` (timeout: 600000ms)
2. **Run Build** - `npm run build` (timeout: 600000ms)  
3. **Commit** - `git commit` (timeout: 600000ms, includes pre-commit hooks)

### Automated Branching & PR Workflow
**MANDATORY**: All development follows automated Git workflow:

1. **Feature Branch Creation**: Auto-create descriptive branches
2. **Implementation**: Follow TDD cycles with continuous validation
3. **Quality Gates**: Tests, build, and lint must pass
4. **PR Creation**: Auto-generate PR with specialist analysis
5. **Completion**: Mark work complete in work-analysis.md

**Branch Naming**: `feat/[description]`, `fix/[description]`, `refactor/[description]`

## TODOWRITE TEMPLATES 📋

**MANDATORY**: Use appropriate TodoWrite templates based on task type.

### Master Template System
Choose based on task type:

**TDD Feature Development**:
```javascript
TodoWrite([
  {"id": "plan-1", "content": "Analyze requirements and create task plan", "status": "pending", "priority": "high"},
  {"id": "specialists-async", "content": "Launch async specialist subagents for parallel analysis", "status": "pending", "priority": "high"},
  {"id": "plan-2", "content": "Consolidate specialist findings and get developer approval", "status": "pending", "priority": "high"},
  {"id": "branch-create", "content": "Create feature branch with descriptive name", "status": "pending", "priority": "high"},
  {"id": "tdd1-red", "content": "RED: Write failing test for [functionality]", "status": "pending", "priority": "high"},
  {"id": "tdd1-green", "content": "GREEN: Implement minimal code to pass test", "status": "pending", "priority": "high"},
  {"id": "tdd1-refactor", "content": "REFACTOR: Clean up code while keeping tests passing", "status": "pending", "priority": "medium"},
  {"id": "final-test", "content": "Run full test suite with 10min timeout", "status": "pending", "priority": "high"},
  {"id": "final-build", "content": "Run build with 10min timeout", "status": "pending", "priority": "high"},
  {"id": "pr-create", "content": "Create PR with specialist analysis summary", "status": "pending", "priority": "high"},
  {"id": "work-complete", "content": "Mark work complete in work-analysis.md", "status": "pending", "priority": "medium"}
])
```

**Bug Fix**:
```javascript
TodoWrite([
  {"id": "debug-1", "content": "Reproduce bug and understand root cause", "status": "pending", "priority": "high"},
  {"id": "debug-2", "content": "Write test that demonstrates the bug", "status": "pending", "priority": "high"},
  {"id": "debug-3", "content": "Implement fix while keeping test passing", "status": "pending", "priority": "high"},
  {"id": "debug-4", "content": "Run full test suite with 10min timeout", "status": "pending", "priority": "high"},
  {"id": "pr-create", "content": "Create PR with fix description", "status": "pending", "priority": "high"},
  {"id": "work-complete", "content": "Mark work complete in work-analysis.md", "status": "pending", "priority": "medium"}
])
```

**Research/Analysis**:
```javascript
TodoWrite([
  {"id": "research-1", "content": "Define research objectives and questions", "status": "pending", "priority": "high"},
  {"id": "research-2", "content": "Launch async specialist subagents for domain analysis", "status": "pending", "priority": "high"},
  {"id": "research-3", "content": "Explore existing codebase and documentation", "status": "pending", "priority": "high"},
  {"id": "research-4", "content": "Consolidate findings and recommendations", "status": "pending", "priority": "medium"},
  {"id": "research-5", "content": "Present findings for developer review", "status": "pending", "priority": "low"}
])
```

### TodoWrite Best Practices
- **Update immediately** - Mark tasks complete as soon as finished
- **One task in_progress** - Never have multiple tasks marked as in_progress
- **Specific descriptions** - Include file names, function names, or specific objectives
- **Proper priorities** - High for critical path, medium for important, low for optional

## ENVIRONMENT CONFIGURATION 🔧

### Port Configuration
All ports are configurable via environment variables:

```bash
# Core Service Ports
SERVER_PORT=3001
CLIENT_PORT=3000
WS_PORT=3001

# Dynamic Service URLs
SERVER_URL=http://localhost:${SERVER_PORT}
CLIENT_URL=http://localhost:${CLIENT_PORT}
WS_URL=ws://localhost:${WS_PORT}

# Claude Code Hooks Configuration
CAM_SERVER_URL=${SERVER_URL}
CAM_AGENT_ID=your-project-name
CAM_PROJECT_PATH=/path/to/your/project
```

### Hook Installation
Hooks provide real-time integration with Claude Code:

```bash
# Install hooks (one-time setup)
npm run setup:hooks

# Validate hook installation
npm run hooks:status
```

## BUILD & TEST COMMANDS

```bash
# Environment setup
npm run setup              # Complete project setup
npm run setup:dev          # Development environment setup  
npm run env:configure      # Configure ports interactively

# Development workflow
npm run dev                # Start development servers
npm run build              # Build all packages
npm run test:all           # Run all tests with 10min timeout
npm run lint               # Run linting
npm run typecheck          # Type checking

# Hook management
npm run hooks:install      # Install Claude Code hooks
npm run hooks:status       # Check hook status
npm run hooks:test         # Test hook connectivity

# Quality gates
npm run validate           # Run all validation checks
npm run clean              # Clean build artifacts
```

## VALIDATION GATES

**Pre-commit requirements**:
- [ ] All tests pass (`npm run test:all`)
- [ ] Build succeeds (`npm run build`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Hook integration working (`npm run hooks:status`)

## PROCESS VALIDATION & CONTEXT PRESERVATION 💾

### Pre-Task Validation Checklist
Before starting ANY coding task:
- [ ] Task Planning Complete (work-analysis.md created)
- [ ] Async Specialist Subagents Launched
- [ ] Specialist Findings Consolidated
- [ ] Developer Approval Received
- [ ] TodoWrite Template Selected
- [ ] Success Criteria Defined
- [ ] Checkpoint Plan Created

### Context Preservation Protocol
**Before approaching token limits:**
1. **Create context preservation document** with current state
2. **Document key decisions and rationale**
3. **List remaining tasks and success criteria**
4. **Provide clear handoff instructions**

## CODING STANDARDS

### Language-Agnostic Principles
- **Security First**: Input validation, output sanitization, secure defaults
- **Performance Aware**: Consider memory usage, async patterns, caching
- **Maintainable**: Clear naming, small functions, documented decisions
- **Testable**: Dependency injection, pure functions, isolated side effects

### Testing Approach
- **Framework**: [Customize for your stack - Jest, Pytest, NUnit, etc.]
- **Coverage Target**: 80% minimum
- **Test Structure**: Unit → Integration → E2E
- **TDD Cycles**: RED-GREEN-REFACTOR mandatory

### Error Handling
- **Fail Fast**: Validate inputs early
- **Graceful Degradation**: Handle expected failures
- **Comprehensive Logging**: Structured logging with context
- **Recovery Strategies**: Retry logic, circuit breakers

## ARCHITECTURE DECISIONS

### Agentic Methodology Benefits
- **Parallel Analysis**: Multiple specialists analyze concurrently
- **Quality Assurance**: Built-in review and validation cycles
- **Knowledge Consolidation**: Expert findings merged systematically
- **Accelerated Development**: Reduced iteration cycles through upfront analysis

### Integration Patterns
- **Hook-Based Events**: Real-time integration with Claude Code
- **Service Discovery**: Dynamic port configuration and failover
- **Modular Architecture**: Reusable components across projects
- **Environment Flexibility**: Configuration-driven deployment

## TROUBLESHOOTING

### Common Issues
1. **Hook Connection Failures**: Check CAM_SERVER_URL and port configuration
2. **Build Errors**: Verify all dependencies installed and environment configured
3. **Test Failures**: Run tests individually to isolate issues

### Debug Procedures
- **Server Logs**: Check console output for connection status
- **Hook Status**: Use `npm run hooks:status` to verify integration
- **Environment Variables**: Verify .env configuration matches your setup

## RESOURCES

### Documentation Links
- **Context Engineering**: `/docs/context-engineering/`
- **Architecture Patterns**: `/docs/architecture.md`
- **Development Workflows**: `/docs/workflows.md`

### Agentic Methodology
- **Specialist Roles**: Defined specialist subagent responsibilities
- **Workflow Integration**: How specialists integrate with development cycles
- **Quality Gates**: Validation checkpoints throughout development

---

**Last Updated**: [Auto-populated]  
**Version**: Agentic-Base v2.0  
**Methodology**: Async Specialist Subagent Protocol