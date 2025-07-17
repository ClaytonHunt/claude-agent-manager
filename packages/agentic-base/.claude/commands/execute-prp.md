# Execute Product Requirements Prompt (PRP)

Execute the implementation plan created by `/generate-prp` using Test-Driven Development cycles with async specialist oversight.

## Context
This command executes the comprehensive work analysis and implementation plan from `work-analysis.md`, using the Agentic Development Methodology with continuous specialist guidance throughout the development process.

## Prerequisites
- Existing `.claude/work-analysis.md` (created by `/generate-prp`)
- If work-analysis.md doesn't exist, prompt user to run `/generate-prp` first
- Feature specification in `.claude/feature.md` or `.claude/prd.md`

## Process

### 1. Load and Validate Work Analysis
Read and parse the existing work analysis:
- Load `.claude/work-analysis.md`
- Validate implementation plan completeness
- Extract phase breakdown and success criteria
- Identify file locations and dependencies

### 2. Launch Async Specialist Oversight Team
Execute continuous specialist monitoring throughout implementation:

```
Task: Architecture specialist - monitor implementation for architectural compliance and design pattern adherence
Task: Quality assurance specialist - oversee TDD implementation and test coverage validation
Task: Code review specialist - review code quality and provide optimization recommendations
Task: Security specialist - validate security implementation and identify vulnerabilities
Task: Performance specialist - monitor performance implications and optimization opportunities
```

### 3. Initialize Implementation Environment
Prepare the development environment:

#### Git Workflow Setup
- Create feature branch with descriptive name based on work analysis
- Ensure clean working directory
- Set up branch protection and validation hooks

#### Validation Environment
- Verify test framework is configured
- Validate build pipeline is working
- Ensure lint and typecheck commands are available
- Confirm pre-commit hooks are installed

### 4. Execute Phased Implementation

#### Phase Execution Pattern
For each phase in the work analysis:

1. **Phase Initialization**
   - Mark phase as in_progress in TodoWrite
   - Review phase objectives and deliverables
   - Validate prerequisites are met
   - Set up phase-specific validation criteria

2. **TDD Cycle Implementation**
   - Follow strict RED-GREEN-REFACTOR cycles
   - Write tests first based on acceptance criteria
   - Implement minimal code to pass tests
   - Refactor for quality while keeping tests passing

3. **Specialist Validation Checkpoints**
   - Architecture review at each major component
   - Security validation for sensitive operations
   - Performance assessment for critical paths
   - Code quality review before phase completion

4. **Phase Completion**
   - Run full test suite with 10-minute timeout
   - Execute build validation
   - Run lint and typecheck validation
   - Mark phase as completed in TodoWrite

### 5. TDD Implementation Protocol

#### RED Phase - Write Failing Tests
```
1. Extract acceptance criteria from work analysis
2. Write test cases that validate acceptance criteria
3. Ensure tests fail (confirming test validity)
4. Commit failing tests with descriptive message
```

#### GREEN Phase - Minimal Implementation
```
1. Write minimal code to make tests pass
2. Focus on functionality, not optimization
3. Validate all tests pass
4. Commit working implementation
```

#### REFACTOR Phase - Quality Enhancement
```
1. Improve code quality while keeping tests passing
2. Apply design patterns and best practices
3. Optimize performance based on specialist feedback
4. Validate tests still pass after refactoring
5. Commit refactored code
```

### 6. Specialist Integration Points

#### Architecture Specialist Oversight
- **Component Design**: Validate architectural patterns and dependencies
- **System Integration**: Ensure proper integration points and data flow
- **Scalability Review**: Assess implementation for future scalability
- **Technical Debt**: Identify and address potential technical debt

#### Quality Assurance Specialist Oversight
- **Test Coverage**: Monitor and validate test coverage targets
- **Test Quality**: Review test design and edge case coverage
- **Automation Strategy**: Ensure automated testing pipeline
- **Quality Gates**: Validate quality checkpoints are met

#### Security Specialist Oversight
- **Vulnerability Assessment**: Continuous security review during implementation
- **Data Protection**: Validate encryption and data handling practices
- **Authentication/Authorization**: Review access control implementation
- **Compliance Validation**: Ensure regulatory compliance requirements

#### Performance Specialist Oversight
- **Performance Benchmarks**: Monitor performance against targets
- **Resource Optimization**: Identify optimization opportunities
- **Monitoring Integration**: Implement performance tracking
- **Scalability Testing**: Validate performance under load

#### Code Review Specialist Oversight
- **Code Quality Standards**: Enforce coding conventions and best practices
- **Maintainability**: Ensure code is maintainable and well-documented
- **Performance Optimization**: Review code-level performance considerations
- **Knowledge Sharing**: Document decisions and implementation details

### 7. Continuous Validation Gates

#### Per-Commit Validation
- All tests pass (`npm run test:all` with 10min timeout)
- Build succeeds (`npm run build` with 10min timeout)
- Lint passes (`npm run lint`)
- Type checking passes (`npm run typecheck`)

#### Phase Completion Validation
- All phase deliverables completed
- Specialist sign-off received
- Performance benchmarks met
- Security review passed

#### Final Implementation Validation
- Complete end-to-end testing
- Full system integration testing
- Performance validation under realistic load
- Security penetration testing
- Documentation completeness review

### 8. Implementation Progress Tracking

#### TodoWrite Integration
```javascript
TodoWrite([
  {"id": "prp-init", "content": "Initialize implementation environment and validate prerequisites", "status": "pending", "priority": "high"},
  {"id": "specialists-launch", "content": "Launch async specialist oversight team", "status": "pending", "priority": "high"},
  {"id": "branch-create", "content": "Create feature branch with descriptive name", "status": "pending", "priority": "high"},
  {"id": "phase1-init", "content": "Initialize Phase 1: [Phase Name]", "status": "pending", "priority": "high"},
  {"id": "phase1-red", "content": "RED: Write failing tests for Phase 1 deliverables", "status": "pending", "priority": "high"},
  {"id": "phase1-green", "content": "GREEN: Implement minimal code for Phase 1", "status": "pending", "priority": "high"},
  {"id": "phase1-refactor", "content": "REFACTOR: Optimize Phase 1 implementation", "status": "pending", "priority": "medium"},
  {"id": "phase1-validate", "content": "Validate Phase 1 completion with specialists", "status": "pending", "priority": "high"},
  {"id": "final-validation", "content": "Run complete validation suite and specialist review", "status": "pending", "priority": "high"},
  {"id": "pr-create", "content": "Create pull request with implementation summary", "status": "pending", "priority": "high"}
])
```

#### Progress Updates
- Update work-analysis.md with implementation progress
- Mark completed deliverables in phase checklists
- Document any deviations from original plan
- Record specialist feedback and recommendations

### 9. Error Handling and Recovery

#### Implementation Blockers
- If tests fail unexpectedly, pause and analyze with QA specialist
- If architectural issues arise, consult with Architecture specialist
- If performance problems occur, engage Performance specialist
- If security concerns emerge, immediate Security specialist review

#### Recovery Strategies
- Rollback to last known good state
- Alternative implementation approaches from specialists
- Scope adjustment based on specialist recommendations
- Timeline adjustment with stakeholder notification

### 10. Completion and Handoff

#### Final Deliverables
- All implementation phases completed successfully
- Complete test suite passing
- Performance benchmarks met
- Security validation completed
- Documentation updated

#### Pull Request Creation
```markdown
## Summary
- [Brief description of implemented features]
- [Key achievements and technical decisions]

## Implementation Details
### Phase 1: [Phase Name]
- [Completed deliverables]
- [Technical decisions made]

### Phase 2: [Phase Name]
- [Completed deliverables]
- [Technical decisions made]

## Specialist Reviews
### 🏗️ Architecture Review
- [Architecture specialist feedback and approval]

### 🧪 Quality Assurance Review
- [QA specialist testing and validation results]

### 🔒 Security Review
- [Security specialist assessment and approval]

### 📊 Performance Review
- [Performance specialist benchmarks and validation]

### 👨‍💻 Code Review
- [Code review specialist quality assessment]

## Test Coverage
- Unit Tests: [Coverage percentage]
- Integration Tests: [Coverage summary]
- End-to-End Tests: [Validation results]

## Performance Metrics
- [Key performance benchmarks achieved]
- [Performance test results]

## Security Validation
- [Security testing completed]
- [Vulnerability assessment results]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Work Analysis Update
Mark implementation as complete in work-analysis.md:
```markdown
## Implementation Status: ✅ COMPLETED

### Completion Summary
- **Start Date**: [Date]
- **Completion Date**: [Date]
- **Total Duration**: [Duration]
- **Phases Completed**: [All phases]
- **Specialist Reviews**: All approved

### Final Validation Results
- [ ] ✅ All tests passing
- [ ] ✅ Build successful
- [ ] ✅ Performance benchmarks met
- [ ] ✅ Security review passed
- [ ] ✅ Code quality standards met

### Post-Implementation Notes
[Any important notes for future maintenance or enhancement]
```

## Command Variations

### Standard Execution
```
/execute-prp
```
Executes the complete implementation plan from work-analysis.md

### Phase-Specific Execution
```
/execute-prp --phase 1
/execute-prp --phase "Foundation Setup"
```
Execute only a specific phase of the implementation

### Resume Implementation
```
/execute-prp --resume
```
Resume implementation from the last completed checkpoint

### Quick Implementation Mode
```
/execute-prp --quick
```
Reduced specialist oversight for faster implementation (Architecture and QA only)

### Deep Validation Mode
```
/execute-prp --deep
```
Enhanced specialist oversight with additional validation checkpoints

## Success Criteria
- All phases from work-analysis.md completed successfully
- Complete TDD implementation with full test coverage
- All specialist validations passed
- Pull request created with comprehensive documentation
- Implementation ready for production deployment

## Error Handling
- If work-analysis.md not found, guide to `/generate-prp` first
- If implementation environment not ready, provide setup instructions
- If specialist oversight incomplete, retry with specific specialist focus
- If validation gates fail, provide recovery strategies

## Integration with Agentic Workflow
This command represents the execution phase of the Agentic Development Methodology, transforming comprehensive planning into working software through specialist-guided TDD implementation.