# Create Feature from GitHub Issue

## Issue URL or Number: $ARGUMENTSFeature

Create a feature specification from a GitHub issue and place it in `.claude/feature.md`.

## Process

1. **Fetch GitHub Issue**
   - Parse issue URL or number from user input
   - Use GitHub API to fetch issue details
   - Extract title, description, labels, and comments
   - Identify issue type (feature request, bug, enhancement, etc.)
   - Collect related issues and pull requests

2. **Analyze Issue Context**
   - Extract business requirements and user value from description
   - Launch async specialist subagents for parallel analysis:
     - Product specialist: Business value and user impact assessment
     - Technical specialist: Implementation approach and constraints
     - QA specialist: Testing requirements and edge cases
   - Parse acceptance criteria from issue comments or description
   - Identify technical constraints and dependencies
   - Analyze issue labels for priority and categorization
   - Review linked issues for broader context
   - Consolidate specialist insights into comprehensive feature specification

3. **Triage and Prioritization**
   - Assess issue complexity and scope
   - Identify business value and user impact
   - Review existing codebase for similar patterns
   - Estimate implementation effort
   - Add triage labels to GitHub issue if needed

4. **Create Feature Specification**
   - Generate `.claude/feature.md` using extracted information
   - Follow template structure adapted for GitHub context
   - Include references to original issue for traceability
   - Link to related issues and documentation

## Feature.md Template Structure

### FEATURE:
[Issue title and comprehensive description from GitHub issue]

### BUSINESS VALUE:
[Why this feature matters, user impact, business objectives extracted from issue]

### REQUIREMENTS:
[Detailed functional requirements from issue description and comments]

### ACCEPTANCE CRITERIA:
[Testable criteria from issue, formatted as checkboxes]

### TECHNICAL CONSIDERATIONS:
[Implementation approach, technical constraints, dependencies, architecture notes]

### EXAMPLES:
[Reference existing code patterns, similar features, or implementation examples from codebase]

### DOCUMENTATION:
[Links to relevant documentation, APIs, or external resources mentioned in issue]

### OTHER CONSIDERATIONS:
[Edge cases, gotchas, performance requirements, security considerations]

### GITHUB CONTEXT:
- **Issue URL**: [Full GitHub issue URL]
- **Issue Number**: [#123]
- **Issue Type**: [Feature/Bug/Enhancement/etc.]
- **Labels**: [Existing GitHub labels]
- **Reporter**: [GitHub username]
- **Participants**: [Users who commented or were mentioned]

### TRACEABILITY:
- **Source**: GitHub Issue
- **Created**: [Timestamp]
- **Repository**: [owner/repo]

## Command Variations

### Basic Usage
```
/feature-from-github-issue https://github.com/owner/repo/issues/123
/feature-from-github-issue #123
/feature-from-github-issue 123
```

### With Repository Context
```
/feature-from-github-issue 123 --repo owner/repo
```

### Auto-select Highest Priority
```
/feature-from-github-issue --auto
```
- Fetches all open issues
- Prioritizes by labels (high-priority, urgent, etc.)
- Selects highest priority untriaged issue
- Creates feature specification

### Triage Mode
```
/feature-from-github-issue --triage-only
```
- Analyzes all open issues without feature.md creation
- Adds appropriate labels (priority, complexity, type)
- Adds triage comments with analysis
- Helps with issue management and prioritization

## Prerequisites

- **GitHub Token**: `GITHUB_TOKEN` environment variable must be set
- **Repository Access**: Token must have read access to issues
- **Git Repository**: Current directory should be a git repository (for auto-detection)

## GitHub API Integration

### Required Permissions
- `repo` scope for private repositories
- `public_repo` scope for public repositories
- Read access to issues and pull requests

### API Endpoints Used
- `GET /repos/{owner}/{repo}/issues/{issue_number}` - Fetch issue details
- `GET /repos/{owner}/{repo}/issues/{issue_number}/comments` - Get comments
- `GET /repos/{owner}/{repo}/issues` - List issues (for auto mode)
- `PATCH /repos/{owner}/{repo}/issues/{issue_number}` - Update labels (triage mode)

## Triage Algorithm

### Business Value Assessment (1-10 scale)
- **Base Score**: 5 (medium value)
- **High Value Indicators** (+2-3 points):
  - Labels: critical, blocker, high-priority, urgent
  - Keywords: security, performance, user experience
  - User impact: affects many users or core functionality
- **Medium Value Indicators** (+1 point):
  - Labels: enhancement, feature, improvement
  - Keywords: efficiency, optimization, usability
- **Lower Value Indicators** (-1-2 points):
  - Labels: documentation, refactor, nice-to-have
  - Keywords: cleanup, internal tooling

### Difficulty Assessment (1-10 scale)
- **Base Score**: 5 (medium difficulty)
- **High Difficulty Indicators** (+2-3 points):
  - Keywords: architecture, migration, breaking change
  - Large scope: affects multiple components
  - External dependencies or integrations
- **Medium Difficulty Indicators** (+1 point):
  - Keywords: database, API, backend, frontend
  - New feature development
  - Performance optimization
- **Lower Difficulty Indicators** (-1-2 points):
  - Keywords: fix, typo, test, documentation
  - Small scope: single component or file
  - Well-defined requirements

### Priority Calculation
```
Priority Score = Business Value / Difficulty
```

### Generated Labels
- `triage-complete`: Added to all analyzed issues
- `high-priority`: Priority > 1.5
- `medium-priority`: 0.8 ≤ Priority ≤ 1.5
- `low-priority`: Priority < 0.8
- `high-value`: Business Value ≥ 8
- `complex`: Difficulty ≥ 8
- `easy`: Difficulty ≤ 3

## Error Handling

### Common Issues
1. **Missing GitHub Token**
   - Error: "GITHUB_TOKEN environment variable not set"
   - Solution: Set token with appropriate permissions

2. **Issue Not Found**
   - Error: "Issue #123 not found in repository owner/repo"
   - Solution: Verify issue number and repository access

3. **Invalid Repository**
   - Error: "Repository owner/repo not found or access denied"
   - Solution: Check repository name and token permissions

4. **Rate Limiting**
   - Error: "GitHub API rate limit exceeded"
   - Solution: Wait for reset or use authenticated token

### Fallback Options
- If GitHub fetch fails, offer to use `/feature-from-description` command
- Provide manual template with issue URL for reference
- Suggest checking GitHub token and permissions

## Success Criteria

- `.claude/feature.md` created with complete specification
- All GitHub issue information extracted and formatted
- Traceability maintained to original GitHub issue
- Ready for `/generate-prp` command execution
- Issue context preserved for implementation reference

## Integration with Workflow

### Next Steps After Creation
1. Review generated feature specification
2. Run `/generate-prp` to create implementation plan
3. Use `/execute-prp` to implement the feature
4. Link pull request back to original GitHub issue

### GitHub Integration
- Reference issue number in commit messages
- Use "Closes #123" in pull request description
- Update issue with implementation progress
- Maintain bidirectional traceability

## Advanced Features

### Multi-Issue Features
- Can reference multiple related issues
- Combines requirements from issue thread
- Creates comprehensive feature specification
- Links all related issues in traceability section

### Label-Based Prioritization
- Respects existing GitHub labels for priority
- Suggests additional labels based on analysis
- Integrates with GitHub project boards
- Supports custom labeling schemes