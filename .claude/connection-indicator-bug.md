# Real-time Dashboard Update Bug Report

## Bug Description
**Title**: Dashboard connection indicator shows "Disconnected" and real-time data updates stop working

## CRITICAL ISSUE
**Real-time data updates are not working** - dashboard data does not update automatically and requires manual page refresh to see current information.

## Steps to Reproduce
1. Start the Claude Agent Manager application
2. Navigate to the main dashboard - connection shows as "Connected"
3. Navigate to another page (e.g., Analytics)
4. Return to the main dashboard
5. **Connection indicator shows "Disconnected"**
6. **Dashboard data is stale - agent status, logs, and metrics do not update in real-time**
7. **Manual page refresh required** to see current data

## Expected Behavior
- Connection indicator should remain "Connected" when WebSocket connection is active
- **Dashboard should show real-time updates** for agent status, logs, and activity
- **No manual refresh should be required** to see current data

## Actual Behavior
- Connection indicator switches to "Disconnected" during page navigation
- **Real-time updates stop working entirely**
- **Dashboard shows stale data until manually refreshed**

## Technical Analysis
- **Root Cause**: WebSocket connection/subscription management failure during navigation
- **Impact**: **CRITICAL** - Core real-time monitoring functionality broken
- **Severity**: **HIGH** (core functionality failure)
- **Priority**: **HIGH** (breaks primary use case of real-time agent monitoring)

## Potential Root Causes
1. **State Reset**: Connection state being reset during React Router navigation
2. **Event Listener Cleanup**: WebSocket event listeners being removed/re-added
3. **Store State**: Zustand store state not properly persisting across navigation
4. **Component Lifecycle**: Connection status component not properly re-initializing

## Suggested Investigation
1. Check WebSocket connection state management in store
2. Verify connection status component lifecycle
3. Test WebSocket event listener persistence across navigation
4. Review React Router navigation effects on global state

## Files to Investigate
- `packages/client/src/stores/` - Connection state management
- `packages/client/src/components/` - Connection indicator component
- `packages/client/src/hooks/` - WebSocket connection hooks

## GitHub Issue Labels
- `bug`
- `frontend`
- `websocket`
- `ux`
- `low-priority`