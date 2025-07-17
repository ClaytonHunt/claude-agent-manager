#!/usr/bin/env node

/**
 * Dynamic hook setup script that finds the project root
 * and updates the settings.json with proper paths
 */

const fs = require('fs');
const path = require('path');

/**
 * Find the project root by looking for .claude directory
 * @param {string} startPath - Starting directory
 * @returns {string|null} - Project root path or null if not found
 */
function findProjectRoot(startPath = process.cwd()) {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const claudePath = path.join(currentPath, '.claude');
    if (fs.existsSync(claudePath) && fs.statSync(claudePath).isDirectory()) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

/**
 * Create hook command with dynamic path resolution
 * @param {string} hookFile - Hook file name
 * @returns {string} - Command to run hook
 */
function createHookCommand(hookFile) {
  // Use a shell command that finds the project root dynamically
  return `node "$(dirname "$(dirname "$(readlink -f "$0" || echo "$0")")")/.claude/hooks/${hookFile}"`;
}

/**
 * Alternative: Create a wrapper script approach
 */
function createWrapperScript() {
  const wrapperContent = `#!/usr/bin/env node
// Dynamic hook wrapper that finds project root

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function findProjectRoot(startPath = process.cwd()) {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const claudePath = path.join(currentPath, '.claude');
    if (fs.existsSync(claudePath) && fs.statSync(claudePath).isDirectory()) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return null;
}

const projectRoot = findProjectRoot();
if (!projectRoot) {
  console.error('Could not find project root with .claude directory');
  process.exit(1);
}

// Get the hook name from the script name
const scriptName = path.basename(process.argv[1], '.js');
const actualHookPath = path.join(projectRoot, '.claude', 'hooks', scriptName + '.js');

// Run the actual hook with all arguments
const hookProcess = spawn('node', [actualHookPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PROJECT_ROOT: projectRoot }
});

hookProcess.on('exit', (code) => {
  process.exit(code || 0);
});
`;

  return wrapperContent;
}

/**
 * Update settings.json with dynamic approach
 */
function updateSettings() {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error('Could not find project root with .claude directory');
    process.exit(1);
  }

  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  
  // Option 1: Create wrapper scripts
  console.log('Creating dynamic hook wrapper scripts...');
  
  const hooks = ['preToolUse', 'postToolUse', 'notification', 'stop', 'subagentStop'];
  const wrapperDir = path.join(projectRoot, '.claude', 'hook-wrappers');
  
  // Create wrapper directory
  if (!fs.existsSync(wrapperDir)) {
    fs.mkdirSync(wrapperDir, { recursive: true });
  }

  // Create wrapper scripts
  const wrapperContent = createWrapperScript();
  hooks.forEach(hook => {
    const wrapperPath = path.join(wrapperDir, `${hook}.js`);
    fs.writeFileSync(wrapperPath, wrapperContent);
    fs.chmodSync(wrapperPath, '755');
  });

  // Update settings to use wrapper scripts
  const settings = {
    hooks: {
      PreToolUse: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: `node .claude/hook-wrappers/preToolUse.js`
        }]
      }],
      PostToolUse: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: `node .claude/hook-wrappers/postToolUse.js`
        }]
      }],
      Notification: [{
        hooks: [{
          type: "command",
          command: `node .claude/hook-wrappers/notification.js`
        }]
      }],
      Stop: [{
        hooks: [{
          type: "command",
          command: `node .claude/hook-wrappers/stop.js`
        }]
      }],
      SubagentStop: [{
        hooks: [{
          type: "command",
          command: `node .claude/hook-wrappers/subagentStop.js`
        }]
      }]
    }
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✅ Created dynamic hook configuration');
  console.log('✅ Hooks will now work from any subdirectory');
}

// Run the setup
if (require.main === module) {
  updateSettings();
}

module.exports = { findProjectRoot, createHookCommand };