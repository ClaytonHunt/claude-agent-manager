# Create Feature from ADO Work Item

## Work Item ID: $ARGUMENTSFeature 

Create a feature specification from an Azure DevOps work item and place it in `.claude/feature.md`.

## Process

1. **Fetch Work Item**
   - Use Azure DevOps MCP to get work item details
   - Extract title, description, requirements, acceptance criteria
   - Identify work item type (User Story, Bug, Task, etc.)

2. **Analyze Work Item Context**
   - Extract business requirements and user value
   - Launch async specialist subagents for parallel analysis
   - Identify technical constraints and dependencies
   - Parse acceptance criteria into testable requirements
   - Note any linked work items or related features
   - Consolidate specialist insights into feature specification

3. **Create Feature Specification**
   - Generate `.claude/feature.md` using extracted information
   - Follow template structure adapted for ADO context
   - Include references to original work item for traceability

## Feature.md Template Structure

### FEATURE:
[Work item title and comprehensive description]

### BUSINESS VALUE:
[Why this feature matters, user impact, business objectives]

### REQUIREMENTS:
[Detailed functional requirements from work item description]

### ACCEPTANCE CRITERIA:
[Testable criteria from work item, formatted as checkboxes]

### TECHNICAL CONSIDERATIONS:
[Any technical constraints, dependencies, or architectural notes]

### EXAMPLES:
[Reference existing code patterns, similar features, or implementation examples]

### DOCUMENTATION:
[Links to relevant documentation, APIs, or external resources]

### OTHER CONSIDERATIONS:
[Edge cases, gotchas, performance requirements, security considerations]

### TRACEABILITY:
- **ADO Work Item**: [Work Item ID and URL]
- **Work Item Type**: [User Story/Bug/Task/etc.]
- **Created**: [Timestamp]

## Error Handling

If work item fetch fails:
- Provide clear error message with work item ID
- Suggest verifying ADO connection and permissions
- Offer alternative to use `/feature-from-description` command

## Success Criteria

- `.claude/feature.md` created with complete specification
- All work item information extracted and formatted
- Traceability maintained to original ADO work item
- Ready for `/generate-prp` command execution