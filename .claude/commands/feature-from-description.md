# Create Feature from Description

## Interactive Feature Creation

Create a feature specification from user description and place it in `.claude/feature.md`.

## Process

1. **Gather Requirements**
   - Prompt user for feature description
   - Launch async specialist subagents for domain analysis
   - Ask clarifying questions about business value
   - Identify technical requirements and constraints
   - Gather acceptance criteria and success metrics
   - Consolidate specialist insights with user input

2. **Interactive Prompts**
   - **Feature Description**: "What feature do you want to build?"
   - **Business Value**: "Why is this feature important? What problem does it solve?"
   - **User Story**: "Who is the user and what are they trying to achieve?"
   - **Technical Requirements**: "Any specific technical constraints or requirements?"
   - **Acceptance Criteria**: "How will you know this feature is complete?"
   - **Examples**: "Are there existing patterns or examples to follow?"
   - **Documentation**: "Any specific documentation or APIs to reference?"
   - **Edge Cases**: "Any gotchas or edge cases to consider?"

3. **Create Feature Specification**
   - Generate `.claude/feature.md` using gathered information
   - Follow INITIAL.md template structure
   - Include timestamp and source information

## Feature.md Template Structure

### FEATURE:
[User-provided feature description and requirements]

### BUSINESS VALUE:
[Why this feature matters, user impact, business objectives]

### USER STORY:
[As a [user type], I want [functionality] so that [benefit]]

### REQUIREMENTS:
[Detailed functional requirements from user input]

### ACCEPTANCE CRITERIA:
[Testable criteria provided by user, formatted as checkboxes]

### TECHNICAL CONSIDERATIONS:
[Any technical constraints, dependencies, or architectural notes]

### EXAMPLES:
[Reference existing code patterns, similar features, or implementation examples]

### DOCUMENTATION:
[Links to relevant documentation, APIs, or external resources]

### OTHER CONSIDERATIONS:
[Edge cases, gotchas, performance requirements, security considerations]

### TRACEABILITY:
- **Source**: Manual description
- **Created**: [Timestamp]
- **Created by**: User input

## Interactive Questions

Ask these questions to build comprehensive feature specification:

1. **Feature Overview**
   - "Describe the feature you want to build in 2-3 sentences"
   - "What's the main functionality this feature provides?"

2. **Business Context**
   - "What problem does this solve for users?"
   - "What business value does this deliver?"
   - "Who are the primary users of this feature?"

3. **Technical Details**
   - "Are there any specific technical requirements?"
   - "Any existing patterns or features this should follow?"
   - "What technologies or frameworks should be used?"

4. **Success Criteria**
   - "How will you know this feature is working correctly?"
   - "What are the key behaviors that must be implemented?"
   - "Any performance or scalability requirements?"

5. **Context & Examples**
   - "Are there similar features in the codebase to reference?"
   - "Any external documentation or APIs to integrate with?"
   - "Common pitfalls or gotchas to avoid?"

## Success Criteria

- `.claude/feature.md` created with complete specification
- All user input captured and organized
- Ready for `/generate-prp` command execution
- Comprehensive enough for successful PRP generation