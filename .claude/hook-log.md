# Claude Code Hook Execution Log

This file tracks the execution of Claude Code hooks when `CLAUDE_HOOK_LOGGING=true` is set.

## Usage Instructions

### Enable Hook Logging
```bash
# Set environment variable to enable logging
export CLAUDE_HOOK_LOGGING=true

# Or add to your shell profile
echo "export CLAUDE_HOOK_LOGGING=true" >> ~/.bashrc
```

### Disable Hook Logging
```bash
# Unset environment variable to disable logging
unset CLAUDE_HOOK_LOGGING

# Or set to false/empty
export CLAUDE_HOOK_LOGGING=false
```

### View Hook Activity
```bash
# Watch logs in real-time (local .claude directory)
tail -f .claude/hook-log.md

# View recent hook executions
tail -20 .claude/hook-log.md

# Clear log file
> .claude/hook-log.md
```

## Log Format

Each hook execution creates entries like:

```markdown
## preToolUse - START
**Time**: 2024-01-15T10:30:45.123Z
**Process**: 12345
**Session**: claude-session-abc123
---

## preToolUse - COMPLETE
**Time**: 2024-01-15T10:30:45.150Z
**Processing Time**: 27ms
**Result**: {"hookType":"preToolUse","status":"success","validated":true}
**Process**: 12345
**Session**: claude-session-abc123
---

## preToolUse - ERROR
**Time**: 2024-01-15T10:30:45.150Z
**Processing Time**: 15ms
**Error**: Dangerous command blocked: rm -rf /
**Process**: 12345
**Session**: claude-session-abc123
---
```

## Hook Types Monitored

- **preToolUse**: Before tool execution (security validation)
- **postToolUse**: After tool execution (result processing)
- **notification**: System notifications
- **stop**: Session termination
- **subagentStop**: Subagent completion

## Performance Monitoring

The logs include processing times to help identify performance issues:
- **Normal**: <50ms per hook
- **Warning**: 50-100ms per hook
- **Alert**: >100ms per hook

## Security Events

Security-related events are logged with details:
- Blocked dangerous commands
- Prevented sensitive file access
- Path traversal attempts
- Input validation failures

## Troubleshooting

### No Log Entries
1. Check if `CLAUDE_HOOK_LOGGING=true` is set
2. Verify hooks are loaded in Claude Code
3. Ensure hooks directory has write permissions
4. Check for JavaScript errors in hook scripts

### Log File Issues
```bash
# Check file permissions (local .claude directory)
ls -la .claude/hook-log.md

# Fix permissions if needed
chmod 644 .claude/hook-log.md

# Create directory if missing
mkdir -p .claude
```

### Performance Issues
- Review processing times in logs
- Check for patterns in slow operations
- Monitor memory usage during hook execution
- Look for network connectivity issues

---

*This log is automatically managed by the Claude Code hook system. Entries are appended chronologically.*