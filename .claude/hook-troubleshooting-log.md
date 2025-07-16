# Hook Troubleshooting Log

## Issue Resolved: 2025-07-16

### Problem Description
The Claude Code hooks were failing with a "MODULE_NOT_FOUND" error when trying to execute. The error message showed:
```
Error: Cannot find module '/home/clayton/projects/claude-agent-manager/preToolUse.js'
```

### Root Cause
The `.claude/settings.json` file had incorrect paths for the hook scripts. The configuration was trying to run scripts from the project root directory, but the actual hook scripts are located in `.claude/hooks/`.

### Previous (Incorrect) Configuration
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node preToolUse.js"  // ❌ Wrong path
          }
        ]
      }
    ],
    // ... similar for other hooks
  }
}
```

### Fixed Configuration
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/preToolUse.js"  // ✅ Correct path
          }
        ]
      }
    ],
    // ... similar for other hooks
  }
}
```

### All Hook Scripts Location
The following hook scripts exist in `.claude/hooks/`:
- `preToolUse.js`
- `postToolUse.js`
- `notification.js`
- `stop.js`
- `subagentStop.js`

### Supporting Infrastructure
The hooks directory also contains:
- `core/` - Core modules (Config.js, EventSender.js, HookBase.js, Logger.js)
- `utils/` - Utility modules (Security.js)
- `test/` - Test files and coverage reports
- `package.json` - Hook dependencies
- `setup.sh` - Setup script

### Fix Applied
Updated all hook commands in `.claude/settings.json` to include the correct path prefix `.claude/hooks/`.

### Verification
After applying the fix, tested with a simple Bash command and confirmed hooks execute without errors.

### Notes for Future Sessions
- If hooks fail again, first check the paths in `.claude/settings.json`
- The hooks are Node.js scripts that require the correct path from the project root
- All hook scripts depend on the core modules in `.claude/hooks/core/`
- The hooks are part of the Claude Agent Manager integration feature that was recently implemented