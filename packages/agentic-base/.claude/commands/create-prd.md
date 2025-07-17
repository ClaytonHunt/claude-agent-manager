# Create Product Requirements Document (PRD)

You are a Product Owner specialist tasked with creating a comprehensive Product Requirements Document through interactive discovery.

## Context
This command implements the Agentic Development Methodology for product discovery and requirements gathering. You will conduct a structured interview process to create a professional PRD that serves as the foundation for development planning.

## Process

### 1. Determine Scenario
Ask the user to choose their scenario:
- **New Application**: Full product discovery interview
- **Existing Application**: Analyze codebase + identify feature gaps  
- **Modify Existing PRD**: Update and refine existing requirements

### 2. Launch Async Specialist Subagents
For comprehensive analysis, launch these specialists concurrently:

```
Task: Architecture specialist - analyze technical feasibility and system design considerations for the product requirements
Task: Frontend specialist - assess user experience and interface requirements 
Task: Backend specialist - evaluate data architecture and API requirements
Task: Security specialist - identify security and compliance requirements
Task: Performance specialist - assess scalability and performance considerations
```

### 3. Conduct Discovery Interview

#### For New Applications:
**Phase 1: Vision & Context (5-10 minutes)**
- What problem are you trying to solve with this application?
- Who are your target users and what are their pain points?
- What's your vision for success? How will you measure it?
- What's the business value or impact you're expecting?
- Are there any existing solutions you're inspired by or competing against?

**Phase 2: Core Functionality (10-15 minutes)**
- What are the 3-5 core features that must exist for MVP?
- Can you walk me through the primary user journey?
- What data will the application need to manage?
- Are there any external systems or APIs to integrate with?
- What are the non-negotiable requirements vs nice-to-haves?

**Phase 3: Technical & Constraints (5-10 minutes)**
- Any specific technology preferences or constraints?
- What's your timeline and budget considerations?
- Any security, compliance, or performance requirements?
- What platforms/devices need to be supported?
- Any existing infrastructure or systems to work with?

**Phase 4: Success & Risks (5 minutes)**
- How will you know if this application is successful?
- What are the biggest risks or unknowns?
- What would cause this project to fail?
- Any regulatory or legal considerations?

#### For Existing Applications:
- What is the path to your existing application?
- Launch specialist subagents to analyze the codebase
- What new functionality needs to be added?
- What existing features need modification?
- Are there any features that should be removed?
- What technical debt needs addressing?
- Any performance or scalability issues to fix?

#### For PRD Modifications:
- Load existing PRD from `.claude/prd.md`
- What aspects of the PRD need updating? (features, timeline, technical, success criteria)
- What triggered this update? (user feedback, market changes, technical constraints, business pivot)
- Any new insights since original PRD? (usage data, customer feedback, technical learnings)

### 4. Consolidate Specialist Findings
Wait for all specialist subagents to complete their analysis, then consolidate their findings into the PRD structure.

### 5. Generate PRD
Create a comprehensive PRD using this structure:

```markdown
# Product Requirements Document: [Product Name]

## Executive Summary
- **Product Vision**: [1-2 sentence vision statement]
- **Target Users**: [Primary user personas]
- **Key Value Proposition**: [Core value delivered]
- **Success Metrics**: [Measurable KPIs]

## Problem Statement
### Current State
[Pain points and problems identified]

### Desired State
[Vision for the solution]

## User Personas
### Primary Persona: [Name]
- **Demographics**: [Age, role, tech savviness]
- **Goals**: [What they want to achieve]
- **Pain Points**: [Current frustrations]
- **User Story**: As a [persona], I want [capability] so that [benefit]

## Feature Requirements
### MVP Features (Must Have)
1. **[Feature Name]**
   - Description: [What it does]
   - User Story: [Who needs it and why]
   - Acceptance Criteria:
     - [ ] [Testable criterion]
     - [ ] [Testable criterion]
   - Priority: P0

### Phase 2 Features (Should Have)
[Similar structure for post-MVP features]

### Future Features (Nice to Have)
[Lower priority features for future consideration]

## Technical Requirements
### Architecture
- **Type**: [Web app, mobile, desktop, API]
- **Stack**: [Frontend, backend, database preferences from specialists]
- **Integrations**: [Third-party services]
- **Performance**: [Response time, concurrent users]

### Data Model
```yaml
Entity: [EntityName]
  - field1: type
  - field2: type
```

### Security & Compliance
- Authentication: [Method]
- Authorization: [Role-based, etc.]
- Compliance: [GDPR, HIPAA, etc.]
- Data Protection: [Encryption requirements]

## User Flows
### Primary Flow: [Name]
1. User arrives at [entry point]
2. User performs [action]
3. System responds with [result]
4. User achieves [goal]

## Success Criteria
### Launch Criteria
- [ ] All P0 features implemented
- [ ] Security review passed (Security Specialist input)
- [ ] Performance benchmarks met (Performance Specialist input)
- [ ] Architecture review completed (Architecture Specialist input)

### Success Metrics
- **User Adoption**: [Target numbers]
- **Engagement**: [Usage metrics]
- **Business Impact**: [Revenue, cost savings]
- **Quality**: [Bug rates, uptime]

## Risks & Mitigations
| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| [Risk from specialists] | High/Med/Low | High/Med/Low | [Strategy] |

## Timeline & Milestones
- **Discovery**: [Dates]
- **Design**: [Dates]
- **MVP Development**: [Dates]
- **Testing**: [Dates]
- **Launch**: [Target date]

## Specialist Analysis Summary
### Architecture Specialist Findings
[Key architectural recommendations]

### Security Specialist Findings
[Security requirements and recommendations]

### Frontend Specialist Findings
[UI/UX considerations and requirements]

### Backend Specialist Findings
[API and data architecture recommendations]

### Performance Specialist Findings
[Performance and scalability considerations]

---

**Generated**: [Date]
**Method**: Agentic Development Methodology with Specialist Analysis
**Next Steps**: Use `/generate-prp` to create implementation plan
```

### 6. Save and Next Steps
- Save the PRD to `.claude/prd.md`
- Inform the user that the PRD is ready
- Recommend next steps:
  1. Review and refine the PRD manually if needed
  2. Use `/generate-prp` to create implementation plan from this PRD
  3. Use `/execute-prp` to begin development with specialist guidance

## Success Criteria
- Comprehensive PRD created based on thorough discovery
- All specialist findings incorporated
- Clear, actionable requirements defined
- Ready for implementation planning phase

## Integration Points
- Input: User requirements and existing codebase (if applicable)
- Output: `.claude/prd.md` - comprehensive requirements document
- Next Command: `/generate-prp` for implementation planning