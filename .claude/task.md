# Current Task: Phase 1.1 - Clean Up Agentic Base Package

## CURRENT TASK
**Task**: Remove all business logic from agentic-base to transform it into a pure starter kit  
**Priority**: High  
**Estimated Time**: 1-2 hours  
**GitHub Issue**: https://github.com/ClaytonHunt/claude-agent-manager/issues/1
**Parent Feature**: Architectural Realignment & Feature Completion

## SPECIALIST ANALYSIS

### 🏗️ Architecture Reviewer
**Scope**: Transform agentic-base from application to pure starter kit
**Recommendations**: 
- Remove ALL business logic - CLI tools, client libraries, hook managers
- Keep only templates, setup files, and documentation
- Ensure zero dependencies on business logic packages
**Files to Review**: 
- packages/agentic-base/src/: All business logic files to be deleted
- packages/agentic-base/package.json: Remove application dependencies

### 🧪 Quality Engineer
**Testing Approach**: Verify removal doesn't break existing functionality
**Test Files**: 
- No tests needed for deletion, but verify build still works
**Coverage Target**: N/A for deletion task

### 👨‍💻 Senior Developer
**Implementation Notes**: Clean deletion with proper dependency cleanup
**Patterns to Use**: 
- Verify no other packages depend on deleted code
- Clean package.json of unused dependencies
**Code Review Focus**: 
- Complete removal of business logic
- Proper dependency cleanup

### 🔧 DevOps Engineer
**Build Impact**: Remove packages from build pipeline temporarily
**Environment Considerations**: Build should still work after cleanup
**Dependencies**: Remove CLI and client library dependencies

### 🎨 Design Reviewer
**UI/UX Impact**: No UI impact for this cleanup task
**Accessibility**: N/A
**Design Consistency**: N/A

### 📋 Product Owner
**Business Logic**: Remove application logic to create true starter kit
**User Impact**: Sets foundation for proper starter kit templates
**Acceptance Criteria**: 
- [ ] All CLI tools deleted (feature-from-github-issue.ts)
- [ ] All client libraries deleted (AgentManagerClient.ts)
- [ ] All hook managers deleted (ClaudeCodeHookManager.ts)
- [ ] Package size reduced from 734 lines to ~50 lines
- [ ] Only template files and setup utilities remain

## IMPLEMENTATION APPROACH

### TDD Cycle 1: Analyze Current Structure
**Focus**: Understand what needs to be deleted
- [ ] **RED**: Document current structure and dependencies
- [ ] **GREEN**: Create deletion plan
- [ ] **REFACTOR**: Verify plan is complete

### TDD Cycle 2: Remove Business Logic Files
**Focus**: Delete all application code
- [ ] **RED**: Verify files exist before deletion
- [ ] **GREEN**: Delete CLI tools, client libraries, hook managers
- [ ] **REFACTOR**: Clean up empty directories

### TDD Cycle 3: Clean Dependencies
**Focus**: Remove unused dependencies from package.json
- [ ] **RED**: Identify unused dependencies
- [ ] **GREEN**: Remove unused dependencies
- [ ] **REFACTOR**: Verify build still works

## FILE CHANGES

**Files to Delete**:
- packages/agentic-base/src/cli/feature-from-github-issue.ts: CLI tool (331 lines)
- packages/agentic-base/src/utils/agent-manager-client.ts: Client library (231 lines)
- packages/agentic-base/src/hooks/claude-code-hooks.ts: Hook manager (172 lines)
- packages/agentic-base/src/cli/: Entire CLI directory
- packages/agentic-base/.claude/commands/feature-from-github-issue.md: Incorrectly placed command

**Files to Modify**:
- packages/agentic-base/package.json: Remove CLI and client dependencies
- packages/agentic-base/src/index.ts: Remove exports of deleted modules

**Files to Keep**:
- packages/agentic-base/README.md: Will be updated in Phase 1.2
- packages/agentic-base/package.json: Structure kept, dependencies cleaned

## VALIDATION

### Unit Tests
- [ ] Build succeeds after deletion
- [ ] No broken imports remain
- [ ] Package.json is valid
- [ ] Workspace configuration still works

### Integration Tests
- [ ] Root build command works
- [ ] Other packages not affected
- [ ] Monorepo structure intact

### Manual Testing
- [ ] Can navigate to agentic-base directory
- [ ] Package structure is clean
- [ ] No business logic remains

## DEPENDENCIES

**Blocked By**: None (first task in sequence)

**Blocks**: 
- Phase 1.2: Create agentic-base starter kit templates
- Phase 1.3: Remove incorrect CLI package

**External Dependencies**: 
- None for deletion task

## CONTEXT FOR NEXT DEVELOPER

### Key Decisions Made
- Complete removal of business logic to create pure starter kit
- Preserving package structure for template creation in Phase 1.2
- Clean dependency removal to avoid build issues

### Gotchas to Watch For
- Don't delete package.json entirely - just clean dependencies
- Verify no other packages import from deleted modules
- Keep directory structure for template creation

### Resources
- Work Analysis: .claude/work-analysis.md (corrected architectural context)
- GitHub Issue: https://github.com/ClaytonHunt/claude-agent-manager/issues/1
- Current agentic-base: packages/agentic-base/src/ (to be cleaned)

## PROGRESS LOG

**Started**: 2025-07-15 (current session)
**Current Status**: In Progress - TDD Cycle 1
**GitHub Issue**: #1 - Phase 1.1: Clean up agentic-base package
**Completed Milestones**: 
- Requirements analysis ✅
- GitHub issue created ✅
- Specialist team consultation ✅

**Current Work**: 
Analyzing current agentic-base structure for complete business logic removal

**Next Steps**: 
1. Document current file structure and sizes
2. Identify all business logic files to delete
3. Remove CLI tools, client libraries, hook managers
4. Clean package.json dependencies
5. Verify build still works

**Time Tracking**: 
- Estimated: 1-2 hours
- Actual: Starting now
- Remaining: 1-2 hours