# Generate PRP (Product Requirements Prompt)

## Feature file: .claude/feature.md

Generate a comprehensive PRP for feature implementation with thorough research. Read the `.claude/feature.md` file to understand what needs to be created, then create a detailed implementation plan in `.claude/work-analysis.md`.

The AI agent only gets the context you provide in the PRP. Include research findings, documentation URLs, code patterns, and validation gates for self-correction.

## Research Process

1. **Parallel Specialist Analysis**
   - Launch async specialist subagents for concurrent research
   - Architecture specialist: System design patterns and integration points
   - Quality specialist: Testing frameworks and validation approaches
   - Security specialist: Security requirements and risk assessment
   - Performance specialist: Scalability and optimization considerations

2. **Codebase Analysis** (Parallel)
   - Search for similar features/patterns in the codebase
   - Identify files to reference in PRP
   - Note existing conventions to follow
   - Check test patterns for validation approach
   - Look for configuration and setup patterns

3. **Project Structure Analysis** (Parallel)
   - Detect project type (React, Python, Node.js, etc.)
   - Identify build tools and testing frameworks
   - Find existing documentation structure
   - Note deployment and CI/CD patterns

4. **External Research** (Parallel)
   - Search for similar features/patterns online
   - Library documentation (include specific URLs)
   - Implementation examples (GitHub/StackOverflow/blogs)
   - Best practices and common pitfalls

5. **Consolidation Phase**
   - Merge findings from all parallel research streams
   - Resolve conflicts between specialist recommendations
   - Create unified implementation approach
   - Validate approach against codebase constraints

## PRP Generation

Create comprehensive `.claude/work-analysis.md` with:

### Context Section
- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from codebase
- **Gotchas**: Library quirks, version issues, project-specific constraints
- **Patterns**: Existing approaches to follow
- **Project Structure**: Current file organization

### Implementation Blueprint
- **Data Models**: Required data structures and validation
- **Task Breakdown**: Ordered list of implementation tasks
- **Integration Points**: Where feature connects to existing system
- **Validation Gates**: Executable tests/lints (project-specific)
- **Success Criteria**: Measurable outcomes

### Async Specialist Team Analysis
Include consolidated analysis from parallel specialist subagents:
- **🏗️ Architecture Specialist**: System design patterns, integration points, scalability
- **🧪 Quality Assurance Specialist**: Testing frameworks, coverage strategies, automation
- **👨‍💻 Code Review Specialist**: Implementation patterns, security, performance
- **🔧 DevOps Specialist**: Build systems, deployment, CI/CD pipeline integration
- **🎨 Frontend Specialist**: UI/UX patterns, accessibility, responsive design (if applicable)
- **🗄️ Backend Specialist**: API design, data modeling, server architecture (if applicable)
- **🔒 Security Specialist**: Threat assessment, secure coding practices, compliance
- **📊 Performance Specialist**: Optimization opportunities, monitoring, scalability

### Risk Assessment
- **Technical Risks**: Implementation challenges and mitigation
- **Integration Risks**: Compatibility and breaking changes
- **Performance Risks**: Scalability and resource usage
- **Security Risks**: Data protection and access control

## Validation Gates Template

Adapt based on detected project type:

### For Node.js/React Projects
```bash
# Syntax/Style
npm run lint && npm run type-check

# Unit Tests
npm run test

# Build
npm run build

# E2E Tests (if applicable)
npm run test:e2e
```

### For Python Projects
```bash
# Syntax/Style
ruff check --fix && mypy .

# Unit Tests
pytest tests/ -v

# Build/Package
python -m build
```

### For .NET Projects
```bash
# Build and Test
dotnet build && dotnet test

# Code Analysis
dotnet format --verify-no-changes
```

## Quality Checklist

Before saving work-analysis.md:
- [ ] All necessary context included
- [ ] Validation gates are executable by AI
- [ ] References existing patterns
- [ ] Clear implementation path
- [ ] Error handling documented
- [ ] Specialist team analysis complete
- [ ] Risk assessment thorough
- [ ] Success criteria measurable

## Confidence Scoring

Rate PRP on scale of 1-10 for one-pass implementation success:
- **9-10**: Comprehensive context, clear patterns, low risk
- **7-8**: Good context, some unknowns, moderate risk
- **5-6**: Adequate context, several unknowns, higher risk
- **1-4**: Insufficient context, high risk, needs more research

## Output Location

Save as: `.claude/work-analysis.md`

## Success Criteria

- Comprehensive PRP created in work-analysis.md
- All research findings included
- Project-specific validation gates defined
- Ready for `/execute-prp` command
- Confidence score of 7+ for implementation success