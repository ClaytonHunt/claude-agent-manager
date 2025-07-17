#!/bin/bash

# Claude Code Hooks Setup Script
# This script installs and configures the Claude Code hooks for the agent manager

set -e

echo "🔧 Setting up Claude Code Hooks for Agent Manager..."

# Get the current directory
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${HOOKS_DIR}/../.." && pwd)"

echo "📁 Hooks directory: ${HOOKS_DIR}"
echo "📁 Project directory: ${PROJECT_DIR}"

# Install npm dependencies
echo "📦 Installing dependencies..."
cd "${HOOKS_DIR}"
npm install

# Make hook scripts executable
echo "🔐 Making hook scripts executable..."
chmod +x *.js

# Create log directory
LOG_DIR="${HOME}/.claude/logs"
echo "📝 Creating log directory: ${LOG_DIR}"
mkdir -p "${LOG_DIR}"

# Check if settings.json exists
SETTINGS_FILE="${PROJECT_DIR}/.claude/settings.json"
if [ ! -f "${SETTINGS_FILE}" ]; then
    echo "⚠️  Warning: ${SETTINGS_FILE} not found"
    echo "   The hooks have been installed but may not be active in Claude Code"
    echo "   Please ensure .claude/settings.json is properly configured"
else
    echo "✅ Settings file found: ${SETTINGS_FILE}"
fi

# Test hook execution
echo "🧪 Testing hook execution..."
TEST_INPUT='{"test": "setup"}'

if echo "${TEST_INPUT}" | node "${HOOKS_DIR}/preToolUse.js" >/dev/null 2>&1; then
    echo "✅ preToolUse hook test passed"
else
    echo "❌ preToolUse hook test failed"
    exit 1
fi

if echo "${TEST_INPUT}" | node "${HOOKS_DIR}/postToolUse.js" >/dev/null 2>&1; then
    echo "✅ postToolUse hook test passed"
else
    echo "❌ postToolUse hook test failed"
    exit 1
fi

# Display configuration information
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Configuration:"
echo "  - Hooks directory: ${HOOKS_DIR}"
echo "  - Log directory: ${LOG_DIR}"
echo "  - Settings file: ${SETTINGS_FILE}"
echo ""
echo "Environment variables (optional):"
echo "  - CAM_SERVER_URL: Backend server URL (default: http://localhost:3001)"
echo "  - CAM_AGENT_ID: Agent identifier (default: auto-generated)"
echo "  - CAM_LOG_LEVEL: Log level (default: info)"
echo "  - CAM_SECURITY_ENABLED: Enable security checks (default: true)"
echo ""
echo "Next steps:"
echo "  1. Start the backend server (if not already running)"
echo "  2. Verify .claude/settings.json is properly configured"
echo "  3. Test with Claude Code to ensure hooks are active"
echo ""
echo "For troubleshooting, check logs in: ${LOG_DIR}"
echo "For more information, see: ${HOOKS_DIR}/README.md"