# Claude Code Hooks for Agent Manager

This directory contains Claude Code hooks that provide real-time monitoring and management capabilities for the claude-agent-manager project.

## Overview

The hooks system provides comprehensive monitoring of Claude Code sessions, including:
- Pre-tool validation and security checks
- Post-tool analysis and performance metrics
- System notifications and alerts
- Session and subagent lifecycle management
- Real-time communication with the backend monitoring system

## Hook Types

### 1. preToolUse.js
**Purpose**: Validates and secures tool usage before execution
- Blocks dangerous commands (rm -rf, sudo, etc.)
- Validates file access permissions
- Prevents path traversal attacks
- Logs tool usage attempts

### 2. postToolUse.js
**Purpose**: Analyzes tool execution results and performance
- Captures execution metrics and timing
- Analyzes tool output and errors
- Categorizes tool usage patterns
- Provides performance optimization recommendations

### 3. notification.js
**Purpose**: Processes system notifications and alerts
- Handles error notifications
- Processes warning messages
- Manages success confirmations
- Categorizes and prioritizes alerts

### 4. stop.js
**Purpose**: Manages session termination and cleanup
- Captures session metrics and summary
- Handles resource cleanup
- Archives session data
- Provides productivity analysis

### 5. subagentStop.js
**Purpose**: Manages subagent lifecycle and results
- Tracks subagent performance
- Analyzes task completion
- Manages child agent cleanup
- Updates parent agent with results

## Configuration

### Environment Variables

The hooks support environment variables loaded from a `.env` file in the project root or directly from the environment:

```bash
# Server Configuration
CAM_SERVER_URL=http://localhost:3001

# Agent Configuration
CAM_AGENT_ID=claude-agent-manager
CAM_PROJECT_PATH=/path/to/project
CAM_SESSION_ID=session-123

# Feature Flags
CAM_SECURITY_ENABLED=true
CAM_SUMMARIZATION_ENABLED=true

# Logging Configuration
CAM_LOG_LEVEL=info
CAM_LOG_DIRECTORY=/home/user/.claude/logs
```

#### Environment Configuration Options

1. **`.env` file** (recommended): Create a `.env` file in your project root
2. **System environment variables**: Set variables directly in your environment
3. **Legacy settings.json**: Still supported for backwards compatibility

**Example `.env` file:**
```env
# Claude Agent Manager Environment Variables
CAM_SERVER_URL=http://localhost:3001
CAM_AGENT_ID=claude-agent-manager
CAM_PROJECT_PATH=/home/user/projects/claude-agent-manager
CAM_LOG_DIRECTORY=/home/user/.claude/logs
CAM_SECURITY_ENABLED=true
CAM_SUMMARIZATION_ENABLED=true
```

Use the `.env.example` file as a template for your configuration.

### Claude Code Settings

The hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "preToolUse": {
      "command": "node",
      "args": [".claude/hooks/preToolUse.js"],
      "enabled": true
    },
    "postToolUse": {
      "command": "node",
      "args": [".claude/hooks/postToolUse.js"],
      "enabled": true
    },
    "notification": {
      "command": "node",
      "args": [".claude/hooks/notification.js"],
      "enabled": true
    },
    "stop": {
      "command": "node",
      "args": [".claude/hooks/stop.js"],
      "enabled": true
    },
    "subagentStop": {
      "command": "node",
      "args": [".claude/hooks/subagentStop.js"],
      "enabled": true
    }
  }
}
```

## Security Features

### Command Blocking
The hooks automatically block dangerous commands:
- `rm -rf` (destructive file operations)
- `sudo` commands (privilege escalation)
- `chmod 777` (unsafe permissions)
- Network piping (`curl | sh`)
- System modifications (`shutdown`, `reboot`)

### File Access Protection
File access is validated to prevent:
- Access to system files (`/etc/passwd`, `/etc/shadow`)
- SSH key access (`.ssh/id_*`)
- Environment file access (`.env`, `.env.local`)
- Certificate file access (`.pem`, `.key`)

### Path Traversal Prevention
The hooks detect and block:
- Directory traversal attempts (`../../../`)
- URL-encoded traversal (`%2f%2e%2e`)
- Hex-encoded traversal (`\x2f\x2e\x2e`)

## Backend Integration

The hooks communicate with the backend via HTTP API:

### Endpoints
- `POST /api/hooks/claude-code` - Individual hook events
- `POST /api/hooks/claude-code/batch` - Batch hook events
- `GET /api/hooks/health` - Health check

### Event Format
```json
{
  "type": "pre_tool_use",
  "agentId": "claude-agent-123",
  "sessionId": "session-456",
  "timestamp": "2023-07-16T12:00:00Z",
  "data": {
    "toolName": "Edit",
    "filePath": "/project/file.txt",
    "validationResult": "approved"
  }
}
```

## Logging

### Log Format
All hooks use structured JSON logging:
```json
{
  "timestamp": "2023-07-16T12:00:00Z",
  "level": "info",
  "message": "Tool validation passed: Edit",
  "agentId": "claude-agent-123",
  "sessionId": "session-456",
  "projectPath": "/project",
  "pid": 12345,
  "toolInfo": {
    "name": "Edit",
    "filePath": "/project/file.txt"
  }
}
```

### Log Rotation
- Daily log rotation
- Configurable retention period (default: 30 days)
- Automatic cleanup of old logs

## Installation

1. **Install Dependencies**:
   ```bash
   cd .claude/hooks
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in your project root:
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

3. **Make Scripts Executable**:
   ```bash
   chmod +x *.js
   ```

4. **Set Secure Permissions**:
   ```bash
   chmod 600 .env  # Ensure only owner can read/write
   ```

5. **Start Backend Server**:
   Ensure the backend server is running on the configured URL

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
```bash
# Test preToolUse hook
echo '{"payload": {"tool_name": "Edit", "file_path": "/test/file.txt"}}' | node preToolUse.js

# Test postToolUse hook
echo '{"payload": {"tool_name": "Edit", "tool_output": "Success"}}' | node postToolUse.js
```

## Performance Considerations

### Resource Usage
- Minimal CPU overhead per hook execution
- Memory usage typically under 50MB per hook
- Network requests are batched and cached

### Circuit Breaker
- Automatic fallback when backend is unavailable
- Configurable retry logic with exponential backoff
- Graceful degradation without blocking Claude Code

## Troubleshooting

### Common Issues

1. **Hook Not Executing**:
   - Check that the hook is enabled in `.claude/settings.json`
   - Verify the script path is correct
   - Ensure Node.js is installed and accessible

2. **Backend Connection Failures**:
   - Verify the backend server is running
   - Check the `CAM_SERVER_URL` configuration
   - Review network connectivity

3. **Permission Errors**:
   - Ensure hook scripts are executable
   - Check file permissions for log directory
   - Verify Node.js has required permissions

### Debug Mode
Enable debug logging:
```bash
export CAM_LOG_LEVEL=debug
```

### Log Analysis
Check recent logs:
```bash
tail -f ~/.claude/logs/claude-hooks-$(date +%Y-%m-%d).log
```

## Architecture

The hooks system follows a modular architecture:

- **HookBase**: Base class providing common functionality
- **Config**: Hierarchical configuration management
- **Logger**: Structured logging with rotation
- **EventSender**: Resilient HTTP client with circuit breaker
- **Security**: Comprehensive validation and sanitization

This design ensures consistency, maintainability, and extensibility across all hook implementations.

## Contributing

When adding new hooks or modifying existing ones:

1. Extend the `HookBase` class
2. Implement proper input validation using Zod
3. Add comprehensive security checks
4. Include structured logging
5. Write unit tests
6. Update this documentation

## Support

For issues or questions:
1. Check the logs in `~/.claude/logs/`
2. Review the configuration in `.claude/settings.json`
3. Test individual hooks manually
4. Consult the Claude Code hooks documentation