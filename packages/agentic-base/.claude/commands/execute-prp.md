# Execute PRP (Product Requirements Prompt)

## PRP File: .claude/work-analysis.md

Implement a feature using the comprehensive PRP file. This command orchestrates the entire implementation process including ADO task creation, focused execution, and validation.

## Execution Process

1. **Load PRP Context**
   - Read the `.claude/work-analysis.md` file
   - Understand all context, requirements, and implementation plan
   - Review specialist team analysis and risk assessment
   - Ensure all needed context is available for implementation

2. **Create ADO Child Tasks**
   - Extract task breakdown from work-analysis.md
   - Create matching ADO child tasks for implementation tracking
   - Link tasks to original work item for traceability
   - Set appropriate task states and assignments

3. **ULTRATHINK & Planning**
   - Analyze the complete implementation plan
   - Launch async specialist subagents for parallel analysis
   - Break down complex tasks into manageable checkpoints
   - Use TodoWrite tool to create detailed execution plan
   - Follow existing TDD and checkpoint protocols
   - Identify dependencies and execution order
   - Consolidate specialist findings into unified approach

4. **Focused Implementation**
   - Create `.claude/task.md` for current focused work
   - Include specialist team analysis for current task
   - Implement following TDD cycles (RED-GREEN-REFACTOR)
   - Update both task.md and ADO tasks as work progresses

5. **Validation Loops**
   - Run validation gates from work-analysis.md
   - Fix any failures and iterate
   - Ensure all success criteria are met
   - Update ADO task status upon completion

6. **Completion Verification**
   - Ensure all checklist items are completed
   - Run final validation suite
   - Update work-analysis.md with completion notes
   - Close ADO tasks and update parent work item

## Task.md Structure

Create focused task document with:

### CURRENT TASK:
[Specific task being worked on from work-analysis.md]

### ASYNC SPECIALIST ANALYSIS:
[Consolidated findings from parallel specialist subagents]
- **Architecture Specialist**: [System design recommendations]
- **Quality Specialist**: [Testing and validation strategies]
- **Security Specialist**: [Security considerations and requirements]
- **Performance Specialist**: [Performance optimization opportunities]

### IMPLEMENTATION APPROACH:
[Detailed approach for current task]

### VALIDATION GATES:
[Specific tests/checks for this task]

### PROGRESS TRACKING:
- **ADO Task ID**: [Link to corresponding ADO task]
- **Status**: [Current status]
- **Blockers**: [Any current blockers]
- **Next Steps**: [What comes after this task]

## ADO Task Management

### Task Creation
- Extract tasks from work-analysis.md implementation plan
- Create child tasks under original work item
- Include task descriptions and acceptance criteria
- Set appropriate priority and effort estimates

### Task Updates
- Update ADO task status as work progresses
- Add comments with implementation details
- Link to relevant code changes
- Close tasks when validation passes

### Task Hierarchy
```
Parent Work Item (from /feature-from-ado)
├── Task 1: [Implementation task]
├── Task 2: [Implementation task]
├── Task 3: [Implementation task]
└── Task N: [Implementation task]
```

## Implementation Workflow

1. **Read work-analysis.md** - Load complete context
2. **Create ADO tasks** - Set up tracking
3. **Initialize task.md** - Focus on first task
4. **TDD Implementation** - RED-GREEN-REFACTOR cycles
5. **Validation** - Run gates and iterate
6. **Update tracking** - Both task.md and ADO
7. **Move to next task** - Repeat until complete

## Error Handling

### Validation Failures
- Use error patterns from work-analysis.md
- Iterate on implementation to fix issues
- Update validation approach if needed
- Don't proceed until validation passes

### ADO Integration Issues
- Provide clear error messages
- Suggest checking ADO permissions
- Offer manual task creation guidance
- Continue with implementation if ADO fails

### Context Gaps
- Reference work-analysis.md for guidance
- Perform additional research if needed
- Update work-analysis.md with new findings
- Ask for clarification when needed

## Success Criteria

- [ ] All tasks from work-analysis.md implemented
- [ ] All validation gates pass
- [ ] ADO tasks created and properly tracked
- [ ] Code follows project conventions
- [ ] Tests written and passing
- [ ] Documentation updated if needed
- [ ] Feature meets acceptance criteria
- [ ] Implementation follows TDD and checkpoint protocols

## Completion Actions

1. **Final Validation** - Run complete test suite
2. **Update Documentation** - Ensure all docs are current
3. **Close ADO Tasks** - Update all task statuses
4. **Update Parent Work Item** - Mark as ready for review
5. **Archive Context** - Clean up temporary files if needed

Note: Always maintain bidirectional tracking between Claude tasks and ADO work items throughout the implementation process.