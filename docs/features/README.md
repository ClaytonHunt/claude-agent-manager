# Feature Development and Archival Process

## Overview
This document outlines the standardized process for feature development, completion, and archival in the Claude Agent Manager project.

## Feature Lifecycle

### 1. Feature Planning Phase
```bash
# Create new feature specification
# Location: .claude/feature.md
# Format: Feature specification with user stories, acceptance criteria, implementation plan
```

### 2. PRP (Product Requirements Prompt) Workflow
```bash
# Generate comprehensive work analysis
generate-prp

# This creates:
# - .claude/work-analysis.md (comprehensive implementation plan)
# - Specialist analysis integration
# - TDD implementation strategy
```

### 3. Feature Implementation Phase
```bash
# Execute the implementation plan
execute-prp

# Follow TDD cycles:
# - RED: Write failing tests
# - GREEN: Implement minimal code to pass
# - REFACTOR: Optimize and clean up code
```

### 4. Feature Completion and Archival

#### When to Archive a Feature
- ✅ All acceptance criteria met
- ✅ All tests passing (unit, integration, E2E)
- ✅ Code review completed
- ✅ Production deployment successful
- ✅ User acceptance validated

#### Archival Process

**Step 1: Prepare for Next Feature**
```bash
# Before starting a new feature, archive the completed one
```

**Step 2: Archive Completed Feature**
```bash
# Create descriptive filename with version/date
mv .claude/feature.md docs/features/completed/{feature-name}-v{version}.md

# Example:
mv .claude/feature.md docs/features/completed/claude-agent-manager-system-v1.0.md
mv .claude/feature.md docs/features/completed/agent-detail-pages-v1.1.md
```

**Step 3: Update Feature Archive Index**
```bash
# Add entry to docs/features/completed/INDEX.md
echo "## {Feature Name} - v{version} - {date}" >> docs/features/completed/INDEX.md
echo "- **Status**: Completed" >> docs/features/completed/INDEX.md
echo "- **Business Value**: {description}" >> docs/features/completed/INDEX.md
echo "- **File**: [{feature-name}-v{version}.md](./{feature-name}-v{version}.md)" >> docs/features/completed/INDEX.md
```

**Step 4: Clean Up Working Files**
```bash
# Archive or clean up work-analysis.md if needed
# Keep .claude/ directory clean for next feature
```

## Directory Structure

```
docs/
├── features/
│   ├── README.md                     # This file - process documentation
│   ├── completed/                    # Archived completed features
│   │   ├── INDEX.md                 # Index of all completed features
│   │   ├── claude-agent-manager-system-v1.0.md
│   │   ├── agent-detail-pages-v1.1.md
│   │   └── ...
│   └── templates/                    # Feature specification templates
│       └── feature-template.md
├── context-engineering/              # Technical documentation
└── getting-started.md               # Project onboarding
```

## Feature Naming Convention

### Archive File Names
- **Pattern**: `{feature-name}-v{version}.md`
- **Examples**:
  - `claude-agent-manager-system-v1.0.md` - Initial system implementation
  - `agent-detail-pages-v1.1.md` - Agent detail pages feature
  - `real-time-dashboard-fix-v1.2.md` - Dashboard real-time updates fix
  - `advanced-search-v2.0.md` - Advanced search and filtering

### Version Guidelines
- **v1.0**: Initial implementation of core system
- **v1.x**: Major features added to existing system
- **v2.0**: Major architectural changes or rewrites
- **vX.x**: Follow semantic versioning principles

## Integration with Development Workflow

### Git Integration
```bash
# Create feature branch
git checkout -b feature/agent-detail-pages

# Commit feature specification
git add .claude/feature.md
git commit -m "Add agent detail pages feature specification"

# Implement feature following TDD
# ... development work ...

# Before completion, archive feature
mv .claude/feature.md docs/features/completed/agent-detail-pages-v1.1.md
git add docs/features/completed/agent-detail-pages-v1.1.md
git add docs/features/completed/INDEX.md
git commit -m "Archive completed agent detail pages feature v1.1"

# Merge to main
git checkout main
git merge feature/agent-detail-pages
```

### Project Commands Integration

#### Recommended Command Extensions
```bash
# Archive current feature (add to package.json scripts)
"archive-feature": "node scripts/archive-feature.js",

# Start new feature (clean slate)
"new-feature": "npm run archive-feature && echo 'Ready for new feature.md'",

# Feature status check
"feature-status": "node scripts/check-feature-status.js"
```

## Benefits of This Process

### Organization Benefits
- ✅ **Clean .claude/ directory** - Only active feature files
- ✅ **Historical record** - All completed features documented
- ✅ **Easy reference** - Searchable archive of past implementations
- ✅ **Version tracking** - Clear feature evolution history

### Development Benefits
- ✅ **Consistent workflow** - Standardized feature development process
- ✅ **Context preservation** - Implementation details preserved for future reference
- ✅ **Knowledge sharing** - Team can reference past feature implementations
- ✅ **Onboarding** - New team members can understand feature history

### Project Management Benefits
- ✅ **Progress tracking** - Clear record of completed work
- ✅ **Business value documentation** - Why features were built
- ✅ **Decision history** - Technical and business decisions preserved
- ✅ **Compliance** - Audit trail of feature development

## Best Practices

### Feature Documentation
- Include clear business value proposition
- Document technical decisions and trade-offs
- Preserve specialist analysis and recommendations
- Include success metrics and validation results

### Archival Timing
- Archive immediately after feature completion
- Don't accumulate multiple completed features in .claude/
- Update index file with each archival
- Include lessons learned and post-implementation notes

### File Management
- Use descriptive, consistent naming conventions
- Include version numbers for tracking evolution
- Maintain chronological order in index
- Keep archive files read-only to preserve history

This process ensures clean project organization, historical preservation, and efficient feature development workflows.