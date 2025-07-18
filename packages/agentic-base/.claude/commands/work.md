Following all established project standards and workflow in CLAUDE.md and connected documentation.

Use async specialist subagents for parallel analysis and execution:

**Core Technical Specialists:**
- **🏗️ Architecture Specialist**: System design, patterns, scalability, integration points
- **🧪 Quality Assurance Specialist**: Testing strategies, automation, coverage, validation
- **👨‍💻 Code Review Specialist**: Implementation patterns, security, performance optimization
- **🔧 DevOps Specialist**: Build systems, CI/CD, deployment, infrastructure automation
- **🎨 Frontend Specialist**: UI/UX, accessibility, responsive design, component architecture
- **🗄️ Backend Specialist**: APIs, databases, server architecture, data modeling
- **🔒 Security Specialist**: Threat assessment, secure coding, vulnerability analysis
- **📊 Performance Specialist**: Optimization, monitoring, profiling, scalability

**Domain Specialists:**
- **📋 Product Owner**: Requirements analysis, business logic, user workflows
- **📝 Tech Writer**: Documentation, knowledge management, process documentation
- **🔍 Researcher**: Information gathering, technology research, pattern analysis
- **👤 Support**: User experience, feedback analysis, support processes
- **📈 Data Analyst**: Data modeling, analytics, reporting requirements
- **⚖️ Compliance**: Regulatory requirements, audit trails, governance

**MANDATORY WORKFLOW VALIDATION:**

Before starting work, Claude must validate:
- [ ] Async specialist subagents launched for parallel domain analysis
- [ ] work-analysis.md created with clear objectives and specialist reviews
- [ ] Specialist findings consolidated into unified implementation approach
- [ ] Appropriate TodoWrite template selected and customized
- [ ] TDD workflow will be followed (RED-GREEN-REFACTOR)
- [ ] Incremental checkpoints planned for tasks >30 minutes
- [ ] Context preservation strategy established

**PROCESS ENFORCEMENT:**
- All coding follows strict TDD cycles
- Only ONE TodoWrite task marked as in_progress at a time
- Tests, build, and lint must pass before commits
- Process validation checkpoints at each stage
- Recovery protocols if processes are skipped

**RESEARCH & TOOLS:**
- Use curl (not WebFetch) for web content fetching
- Reference process-adherence-guide.md if workflow issues occur
- Use context-preservation-template.md before token limits

$ARGUMENTS