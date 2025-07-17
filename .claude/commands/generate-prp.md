# Generate Product Requirements Prompt (PRP)

Create a comprehensive implementation plan from a Product Requirements Document or feature specification using the Agentic Development Methodology.

## Context
This command transforms high-level requirements (PRD or feature.md) into detailed implementation plans with specialist analysis. It creates a comprehensive work-analysis.md that serves as the blueprint for development execution using async specialist subagents.

## Prerequisites
- Existing `.claude/prd.md` OR `.claude/feature.md`
- If neither exists, prompt user to run `/create-prd` or `/feature-from-github-issue` first

## Process

### 1. Input Source Detection
Check for existing requirements documents in priority order:
1. `.claude/feature.md` - Feature specification (highest priority)
2. `.claude/prd.md` - Product Requirements Document
3. User-specified file path

If no source found, guide user to create requirements first.

### 2. Launch Async Specialist Subagents
Execute comprehensive parallel analysis with all relevant specialists:

```
Task: Architecture specialist - analyze system design requirements, integration points, and technical architecture for the feature/product requirements
Task: Frontend specialist - design UI/UX approach, component architecture, and user interface requirements
Task: Backend specialist - plan API design, data architecture, and server-side implementation approach
Task: Quality assurance specialist - develop comprehensive testing strategy, test automation, and quality gates
Task: Security specialist - conduct threat assessment, identify security requirements, and define security implementation
Task: Performance specialist - analyze performance requirements, optimization opportunities, and scalability considerations
Task: DevOps specialist - plan deployment strategy, CI/CD integration, and infrastructure requirements
Task: Code review specialist - establish code quality standards, review processes, and implementation best practices
```

### 3. Requirements Analysis
Parse and analyze the source document:

#### Extract Core Elements
- **Objective**: Primary goal and business value
- **Scope**: Feature boundaries and deliverables
- **User Stories**: Primary user workflows and personas
- **Acceptance Criteria**: Testable success conditions
- **Technical Requirements**: System constraints and integrations
- **Dependencies**: External systems and prerequisites

#### Identify Complexity Factors
- **Technical Complexity**: New technologies, integrations, architectural changes
- **Business Complexity**: Complex business logic, multiple user types, workflow variations
- **Integration Complexity**: External APIs, data migrations, system interactions
- **UI/UX Complexity**: New patterns, responsive design, accessibility requirements

### 4. Consolidate Specialist Findings
Wait for all specialist analyses to complete, then synthesize findings:

#### Architecture Assessment
- System design approach and patterns
- Integration points and dependencies
- Scalability and maintainability considerations
- Technology choices and architectural decisions

#### Implementation Strategy
- Development approach and methodology
- Phase breakdown and milestone planning
- Risk assessment and mitigation strategies
- Resource requirements and timeline estimates

#### Quality Framework
- Testing strategy and automation approach
- Code review standards and processes
- Performance benchmarks and monitoring
- Security implementation and validation

### 5. Generate Comprehensive Work Analysis
Create detailed `work-analysis.md` with specialist insights:

```markdown
# Work Analysis: [Feature/Product Name]

## Overview
**Objective**: [Primary goal from requirements]
**Source**: [PRD/Feature source document]
**Complexity**: [Simple/Medium/Complex based on specialist analysis]
**Estimated Effort**: [Based on specialist assessment]

## Requirements Summary
[Distilled requirements from source document]

## Async Specialist Analysis Summary

### 🏗️ Architecture Specialist Findings
**System Design Approach**: [Architectural patterns and design decisions]
**Integration Points**: [External systems and API integrations]
**Technical Dependencies**: [Required technologies and frameworks]
**Scalability Considerations**: [Performance and growth planning]
**Risk Assessment**: [Technical risks and mitigation strategies]

### 🎨 Frontend Specialist Findings
**UI/UX Approach**: [Design patterns and user interface strategy]
**Component Architecture**: [Component structure and reusability]
**User Experience Flow**: [Navigation and interaction design]
**Responsive Design**: [Multi-device support requirements]
**Accessibility Requirements**: [WCAG compliance and inclusive design]

### 🗄️ Backend Specialist Findings
**API Design**: [RESTful endpoints and data contracts]
**Data Architecture**: [Database design and data flow]
**Business Logic**: [Core algorithms and processing]
**Integration Strategy**: [External service connections]
**Performance Optimization**: [Caching, indexing, and efficiency]

### 🧪 Quality Assurance Specialist Findings
**Testing Strategy**: [Unit, integration, and E2E testing approach]
**Test Automation**: [Automated testing framework and tools]
**Quality Gates**: [Validation checkpoints and criteria]
**Edge Cases**: [Error conditions and boundary testing]
**Performance Testing**: [Load testing and performance validation]

### 🔒 Security Specialist Findings
**Threat Assessment**: [Security risks and attack vectors]
**Authentication/Authorization**: [Access control implementation]
**Data Protection**: [Encryption and privacy requirements]
**Compliance Requirements**: [Regulatory and standards compliance]
**Security Testing**: [Penetration testing and vulnerability assessment]

### 📊 Performance Specialist Findings
**Performance Requirements**: [Response time and throughput targets]
**Optimization Strategy**: [Performance improvement approach]
**Monitoring and Alerting**: [Performance tracking implementation]
**Scalability Planning**: [Growth and load handling]
**Resource Optimization**: [Efficiency and cost management]

### 🔧 DevOps Specialist Findings
**Deployment Strategy**: [Release process and environment management]
**CI/CD Pipeline**: [Automated build and deployment workflow]
**Infrastructure Requirements**: [Server and resource provisioning]
**Monitoring and Logging**: [Operational visibility and debugging]
**Backup and Recovery**: [Data protection and disaster recovery]

### 👨‍💻 Code Review Specialist Findings
**Code Quality Standards**: [Coding conventions and best practices]
**Review Process**: [Peer review workflow and criteria]
**Documentation Requirements**: [Code documentation and knowledge sharing]
**Maintainability**: [Code organization and technical debt prevention]
**Performance Optimization**: [Code-level performance considerations]

## Implementation Plan

### Phase 1: Foundation Setup
**Objective**: [Core infrastructure and basic functionality]
**Duration**: [Estimated timeline]
**Key Deliverables**:
- [ ] [Core component 1]
- [ ] [Core component 2]
- [ ] [Basic functionality implementation]

**TDD Approach**:
1. **RED**: Write failing tests for core functionality
2. **GREEN**: Implement minimal code to pass tests
3. **REFACTOR**: Optimize and clean up implementation

### Phase 2: Feature Development
**Objective**: [Main feature implementation]
**Duration**: [Estimated timeline]
**Key Deliverables**:
- [ ] [Feature component 1]
- [ ] [Feature component 2]
- [ ] [Integration implementation]

**TDD Approach**:
1. **RED**: Write failing tests for feature requirements
2. **GREEN**: Implement feature functionality
3. **REFACTOR**: Optimize performance and maintainability

### Phase 3: Integration & Polish
**Objective**: [System integration and refinement]
**Duration**: [Estimated timeline]
**Key Deliverables**:
- [ ] [Integration testing]
- [ ] [Performance optimization]
- [ ] [Security validation]

### Phase 4: Validation & Deployment
**Objective**: [Final validation and production deployment]
**Duration**: [Estimated timeline]
**Key Deliverables**:
- [ ] [End-to-end testing]
- [ ] [Performance validation]
- [ ] [Production deployment]

## File Locations and Dependencies

### Core Implementation Files
[List of primary files to be created/modified]

### Test Files
[List of test files and testing approach]

### Configuration Files
[Environment and configuration updates needed]

### Documentation Updates
[Documentation that needs creation/modification]

## Success Criteria and Validation Gates

### Technical Validation
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Code review standards satisfied

### Business Validation
- [ ] All acceptance criteria met
- [ ] User story validation completed
- [ ] Stakeholder approval received
- [ ] Production readiness confirmed

### Quality Gates
- [ ] Code coverage targets achieved
- [ ] Performance testing completed
- [ ] Security testing passed
- [ ] Documentation updated

## Risk Assessment and Mitigation

### High-Risk Areas
[Specialist-identified high-risk components]

### Mitigation Strategies
[Approaches to reduce identified risks]

### Contingency Plans
[Backup approaches if primary implementation fails]

## Automation and Workflow Integration

### Git Workflow
1. **Feature Branch**: Create branch from main
2. **TDD Implementation**: Follow RED-GREEN-REFACTOR cycles
3. **Continuous Integration**: Automated testing on each commit
4. **Code Review**: Specialist review before merge
5. **Deployment**: Automated deployment pipeline

### Quality Automation
- **Pre-commit Hooks**: Code formatting and basic validation
- **CI Pipeline**: Comprehensive testing and quality checks
- **Deployment Gates**: Automated validation before production
- **Monitoring**: Real-time performance and error tracking

---

**Generated**: [Date]
**Method**: Agentic Development Methodology with Comprehensive Specialist Analysis
**Source**: [PRD/Feature document reference]
**Next Steps**: Use `/execute-prp` to begin implementation with specialist guidance
```

### 6. Validation and Next Steps
- Save comprehensive work analysis to `.claude/work-analysis.md`
- Validate that all specialist findings are incorporated
- Ensure implementation plan is actionable and detailed
- Provide clear next steps for execution

### 7. Integration Points
- **Input**: Requirements from PRD or feature specification
- **Processing**: Comprehensive specialist analysis and planning
- **Output**: Detailed implementation roadmap with specialist insights
- **Next Command**: `/execute-prp` for guided implementation

## Command Variations

### Standard Generation
```
/generate-prp
```
Analyzes existing `.claude/feature.md` or `.claude/prd.md`

### Specify Source Document
```
/generate-prp --source feature.md
/generate-prp --source prd.md
/generate-prp --source custom-requirements.md
```

### Quick Analysis Mode
```
/generate-prp --quick
```
Launches fewer specialists for faster turnaround (Architecture, QA, Security only)

### Deep Analysis Mode
```
/generate-prp --deep
```
Includes additional domain specialists (Data Analyst, Compliance, Support)

## Success Criteria
- Comprehensive `work-analysis.md` created with all specialist insights
- Implementation plan is detailed and actionable
- All technical, business, and quality considerations addressed
- Clear phase breakdown with TDD approach defined
- Risk assessment and mitigation strategies included
- Ready for implementation execution with `/execute-prp`

## Error Handling
- If no requirements document found, guide to `/create-prd` or `/feature-from-github-issue`
- If specialist analysis incomplete, retry with specific specialist focus
- If requirements unclear, prompt for clarification or additional detail

## Integration with Agentic Workflow
This command is the critical bridge between requirements gathering and implementation execution, ensuring comprehensive planning with expert analysis before development begins.