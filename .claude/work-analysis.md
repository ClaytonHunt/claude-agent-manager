# Work Analysis: Fix "Starting tool: unknown" Issue

## Requirements Summary
Address the fundamental issue where all tools are showing as "Starting tool: unknown" in the Claude Agent Manager analytics, making it impossible to understand what agents are actually doing and severely limiting the analytics capabilities.

## Problem Statement
The analytics system consistently shows "Starting tool: unknown" instead of the actual tool names (Edit, Read, Bash, etc.), which:
- Prevents meaningful analysis of agent tool usage
- Makes logs uninformative for debugging
- Undermines the core analytics and monitoring features
- Creates poor user experience for understanding agent activities

## Async Specialist Analysis (Consolidated)

### 🏗️ Architecture Specialist Findings
**Root Cause**: Data extraction and mapping issue in hook processing pipeline
- Hook data structure uses `payload.tool_name`, but extraction logic looks for `data.tool_name`
- Current code: `const toolName = data.toolName || data.tool_name || data.tool || 'unknown'`
- Should access: `data.payload?.tool_name` as primary source

**Data Flow Issue**:
```
Claude Code → Hook System → Agent Manager → Analytics
     ↓              ↓              ↓              ↓
  Tool Call    preToolUse.js   handlePreToolUse   "Starting tool: unknown"
```

### 🧪 Quality Assurance Specialist Findings
**Testing Gaps**:
- No integration tests for hook-to-server communication
- No validation tests for tool name extraction
- Hook test suite has failures (79 failed, 40 passed)
- Missing schema validation for hook events

**Data Format Issues**:
- Hook events structure: `{ payload: { tool_name: "Edit" } }`
- Server expects: `{ toolName: "Edit" }` or `{ tool_name: "Edit" }`
- Mismatch between expected and actual data structure

### 👨‍💻 Code Review Specialist Findings
**Implementation Location**: `/packages/server/src/routes/hooks.ts`
- `handlePreToolUse` function (lines 487-555)
- Tool extraction logic at line 535
- Similar issues in `handleToolCalled`, `handleToolCompleted`, `handlePostToolUse`

**Immediate Fix Required**:
```typescript
// Current (incorrect)
const toolName = data.toolName || data.tool_name || data.tool || 'unknown';

// Fixed (correct)
const toolName = data.payload?.tool_name || data.toolName || data.tool_name || data.tool || 'unknown';
```

## Implementation Plan with Specialist Recommendations

### Phase 1: Immediate Fix (High Priority)
1. **Fix Data Extraction Logic**
   - Update tool name extraction in `handlePreToolUse`
   - Apply same fix to `handleToolCalled`, `handleToolCompleted`, `handlePostToolUse`
   - Add proper error handling and logging

2. **Add Debug Logging**
   - Log actual hook data structure for debugging
   - Add visibility into what data is being received
   - Include structured logging for tool extraction failures

### Phase 2: Robust Implementation (Medium Priority)
3. **Create Centralized Tool Extraction Utility**
   - Extract tool parsing logic into reusable function
   - Handle multiple data formats and edge cases
   - Add comprehensive error handling

4. **Implement Schema Validation**
   - Add TypeScript types for hook event structures
   - Validate incoming hook data against expected schema
   - Add runtime validation for critical fields

### Phase 3: Enhanced Analytics (Low Priority)
5. **Update Analytics Processing**
   - Ensure analytics system properly processes tool usage data
   - Add tool usage metrics and patterns to analytics
   - Create tool usage dashboards and insights

6. **Add Integration Tests**
   - Test hook-to-server communication end-to-end
   - Validate tool name extraction across all event types
   - Add performance tests for hook processing

## File Locations and Dependencies

### Primary Files to Modify:
- `/packages/server/src/routes/hooks.ts` - Main hook processing logic
- `/packages/server/src/services/AgentService.ts` - Agent log processing
- `/packages/server/src/services/AnalyticsService.ts` - Analytics event processing

### Secondary Files (if needed):
- `/packages/shared/src/types/` - Type definitions for hook events
- `/packages/server/src/utils/` - Tool extraction utility functions
- `/packages/server/src/__tests__/` - Integration tests for hook processing

## Success Criteria and Validation Gates

### Phase 1 Success Criteria:
- [ ] Tool names display correctly in agent logs instead of "unknown"
- [ ] All tool types (Edit, Read, Bash, Write, etc.) are properly recognized
- [ ] Debug logging shows actual tool names being extracted
- [ ] No regression in existing hook processing functionality

### Phase 2 Success Criteria:
- [ ] Centralized tool extraction handles edge cases gracefully
- [ ] Schema validation prevents malformed hook data issues
- [ ] Error handling provides meaningful feedback for debugging
- [ ] Performance impact is minimal (<5ms processing time)

### Phase 3 Success Criteria:
- [ ] Analytics dashboard shows proper tool usage statistics
- [ ] Integration tests cover all hook event types
- [ ] Tool usage patterns are visible in analytics insights
- [ ] System handles high-volume tool usage without performance degradation

## Risk Assessment with Mitigation Strategies

### High-Risk Areas:
1. **Data Structure Changes**: Hook event structure may vary between Claude Code versions
   - **Mitigation**: Support multiple data formats with fallback logic
   - **Timeline**: Critical for immediate fix

2. **Performance Impact**: Adding data processing to hook handling
   - **Mitigation**: Implement efficient extraction logic with caching
   - **Timeline**: Monitor during implementation

3. **Breaking Changes**: Modifying hook processing may affect other features
   - **Mitigation**: Comprehensive testing and backward compatibility
   - **Timeline**: Test thoroughly before deployment

### Medium-Risk Areas:
1. **Analytics Integration**: Changes may affect existing analytics processing
   - **Mitigation**: Gradual rollout with monitoring
   - **Timeline**: Can be addressed in Phase 3

2. **Testing Complexity**: Hook processing is complex to test
   - **Mitigation**: Create realistic test scenarios and mock data
   - **Timeline**: Essential for validation

## Handoff Instructions and Context Preservation

### Development Context:
- This issue affects core analytics functionality
- Fix should be applied to all hook event handlers consistently
- Tool recognition is critical for user understanding of agent activities

### Technical Context:
- Hook system receives events from Claude Code via HTTP endpoints
- Data flows through hook processing → agent logs → analytics
- Multiple event types need consistent tool extraction logic

### Next Steps:
1. **Start with Phase 1** - immediate fix for data extraction
2. **Test thoroughly** - validate tool names appear correctly
3. **Monitor analytics** - ensure proper tool usage tracking
4. **Iterate based on results** - refine extraction logic as needed

## Implementation Timeline
- **Phase 1**: 1-2 days (immediate fix)
- **Phase 2**: 3-5 days (robust implementation)
- **Phase 3**: 1-2 weeks (enhanced analytics)

**Total Estimated Time**: 2-3 weeks for complete solution

This analysis provides a comprehensive approach to resolving the "Starting tool: unknown" issue while building a robust foundation for tool recognition and analytics in the Claude Agent Manager system.