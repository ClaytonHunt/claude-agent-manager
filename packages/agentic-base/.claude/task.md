# CURRENT TASK: Set up routing - Add /agents/:id route to App.tsx

## Task Overview
**Sprint**: Foundation (Days 1-3)  
**Task ID**: foundation-1  
**Priority**: HIGH  
**Objective**: Implement React Router route for individual agent detail pages using flat routing structure

## ASYNC SPECIALIST ANALYSIS

### 🏗️ Architecture Specialist Findings
- **Recommended Approach**: Use flat routing structure `/agents/:id` for better UX and consistency
- **Integration**: No changes needed to AppLayout - already uses `<Outlet />` for route rendering
- **Route Structure**: Add single route alongside existing routes in App.tsx
- **Parameter Handling**: Use useParams hook with UUID validation and error handling
- **Navigation**: Update AgentCard onClick to use `navigate(\`/agents/${agent.id}\`)`

### 🧪 Quality Specialist Findings  
- **CRITICAL ISSUE**: Jest module resolution for `@/utils/api` imports must be fixed before testing
- **Testing Strategy**: Need comprehensive route parameter validation tests
- **Mock Strategy**: Mock useParams and useNavigate hooks for unit tests
- **E2E Testing**: Implement navigation flow tests from agent card to detail page
- **Validation**: Add tests for invalid agent IDs and error handling

### 📊 Performance Specialist Findings
- **Code Splitting**: Implement lazy loading for AgentDetailPage from the start
- **Bundle Impact**: Route-based splitting can reduce initial bundle by 25-30%
- **RSbuild Config**: Add forceSplitting for agent-detail chunk
- **Memory Management**: Use React.Suspense with proper fallback components
- **Caching**: Plan for agent data caching in future iterations

### 🔒 Security Specialist Findings
- **CRITICAL GAPS**: No authentication/authorization system (acknowledged for development)
- **Route Validation**: Need robust agent ID format validation (UUID pattern)
- **Error Handling**: Prevent information disclosure in error messages
- **Input Sanitization**: Sanitize route parameters to prevent injection attacks
- **Rate Limiting**: Plan for API rate limiting in future security implementation

## IMPLEMENTATION APPROACH

### Phase 1: Basic Route Setup (TDD - RED Phase)
1. **Write failing test** for AgentDetailPage route
2. **Add route to App.tsx** with lazy loading
3. **Create basic AgentDetailPage** component
4. **Update pages index.ts** to export new page

### Phase 2: Route Implementation (TDD - GREEN Phase)
1. **Fix Jest configuration** for module resolution
2. **Implement route parameter validation**
3. **Add error handling** for invalid/missing agents
4. **Update AgentCard navigation** onClick handler

### Phase 3: Testing & Optimization (TDD - REFACTOR Phase)
1. **Add comprehensive unit tests** for route functionality
2. **Implement performance optimizations** (lazy loading, suspense)
3. **Add E2E tests** for navigation flow
4. **Validate security considerations** (input validation)

## VALIDATION GATES

### Pre-Implementation Tests (RED Phase)
```bash
# Fix Jest configuration first
npm run test -w packages/client -- --testNamePattern="should render loading state"

# Test route parameter handling
npm run test -w packages/client -- --testPathPattern="routing"
```

### Implementation Tests (GREEN Phase)
```bash
# Unit tests for AgentDetailPage
npm run test -w packages/client -- --testPathPattern="AgentDetailPage"

# Integration tests for routing
npm run test -w packages/client -- --testNamePattern="route"
```

### Validation Tests (REFACTOR Phase)
```bash
# Full test suite
npm run test:all

# E2E navigation tests
npm run test:e2e -- --grep "navigation"

# Build validation
npm run build

# Performance validation
npm run dev  # Check lazy loading works
```

## PROGRESS TRACKING

- **Current Status**: ✅ COMPLETED - Basic routing implementation finished
- **Blockers**: ✅ RESOLVED - Jest module resolution fixed
- **Dependencies**: None - task completed independently
- **Next Steps**: Ready to proceed to foundation-4 (Create AgentDetailHeader) and foundation-5 (Implement loading/error states)

## SUCCESS CRITERIA

- [x] Route `/agents/:id` accessible and renders AgentDetailPage
- [x] Lazy loading implemented with Suspense fallback
- [x] Route parameter validation prevents invalid IDs
- [x] Error handling for non-existent agents
- [x] Navigation from AgentCard to detail page works
- [x] Back navigation to agents list works
- [x] Jest tests pass with proper module resolution
- [x] Build process includes agent-detail chunk splitting
- [x] Performance: < 500ms navigation from card to detail page

## SECURITY CONSIDERATIONS

- **Input Validation**: Agent ID format validation implemented
- **Error Handling**: Generic error messages prevent information disclosure
- **Future Enhancement**: Authentication/authorization to be added in security phase
- **Rate Limiting**: To be implemented at API level in future iteration

This focused implementation approach ensures a solid foundation for agent detail pages while incorporating performance optimization and security considerations from the start.