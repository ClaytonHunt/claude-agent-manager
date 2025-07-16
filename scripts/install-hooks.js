#!/usr/bin/env node

/**
 * Install Claude Agent Manager hooks to user's ~/.claude directory
 * This allows hooks to work from any project location
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOKS_SOURCE_DIR = path.join(__dirname, '..', '.claude', 'hooks');
const USER_CLAUDE_DIR = path.join(os.homedir(), '.claude');
const USER_HOOKS_DIR = path.join(USER_CLAUDE_DIR, 'hooks');
const USER_SETTINGS_FILE = path.join(USER_CLAUDE_DIR, 'settings.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Copy our specific hook files and dependencies
 */
function copyOurHookFiles() {
  // Ensure hooks directory exists
  if (!fs.existsSync(USER_HOOKS_DIR)) {
    fs.mkdirSync(USER_HOOKS_DIR, { recursive: true });
  }

  // Copy our main hook files
  const ourHookFiles = ['preToolUse.js', 'postToolUse.js', 'notification.js', 'stop.js', 'subagentStop.js'];
  
  ourHookFiles.forEach(hookFile => {
    const srcPath = path.join(HOOKS_SOURCE_DIR, hookFile);
    const destPath = path.join(USER_HOOKS_DIR, hookFile);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      fs.chmodSync(destPath, '755');
      log(`   📋 Copied ${hookFile}`, colors.cyan);
    }
  });

  // Copy supporting directories (core, utils, test) - these are shared dependencies
  const supportDirs = ['core', 'utils', 'test'];
  
  supportDirs.forEach(dirName => {
    const srcDir = path.join(HOOKS_SOURCE_DIR, dirName);
    const destDir = path.join(USER_HOOKS_DIR, dirName);
    
    if (fs.existsSync(srcDir)) {
      copyDirectoryRecursive(srcDir, destDir);
      log(`   📁 Copied ${dirName}/ directory`, colors.cyan);
    }
  });

  // Copy package.json and package-lock.json for dependencies
  const packageFiles = ['package.json', 'package-lock.json', 'README.md'];
  
  packageFiles.forEach(fileName => {
    const srcPath = path.join(HOOKS_SOURCE_DIR, fileName);
    const destPath = path.join(USER_HOOKS_DIR, fileName);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      log(`   📄 Copied ${fileName}`, colors.cyan);
    }
  });

  // Copy node_modules if it exists (for dependencies)
  const srcNodeModules = path.join(HOOKS_SOURCE_DIR, 'node_modules');
  const destNodeModules = path.join(USER_HOOKS_DIR, 'node_modules');
  
  if (fs.existsSync(srcNodeModules)) {
    copyDirectoryRecursive(srcNodeModules, destNodeModules);
    log(`   📦 Copied node_modules/ (dependencies)`, colors.cyan);
  }
}

/**
 * Copy directory recursively (helper function)
 */
function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      // Preserve execute permissions for .js files
      if (path.extname(entry.name) === '.js') {
        fs.chmodSync(destPath, '755');
      }
    }
  }
}

/**
 * Backup specific hook files if they exist and are different from ours
 */
function backupOurHookFiles() {
  const ourHookFiles = ['preToolUse.js', 'postToolUse.js', 'notification.js', 'stop.js', 'subagentStop.js'];
  const backupDir = path.join(USER_CLAUDE_DIR, `hooks.backup.${Date.now()}`);
  let backedUpAny = false;

  ourHookFiles.forEach(hookFile => {
    const existingFile = path.join(USER_HOOKS_DIR, hookFile);
    if (fs.existsSync(existingFile)) {
      // Check if the file is different from our source
      const sourceFile = path.join(HOOKS_SOURCE_DIR, hookFile);
      if (fs.existsSync(sourceFile)) {
        const existingContent = fs.readFileSync(existingFile, 'utf8');
        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        
        if (existingContent !== sourceContent) {
          // Files are different, backup the existing one
          if (!backedUpAny) {
            fs.mkdirSync(backupDir, { recursive: true });
            backedUpAny = true;
          }
          const backupFile = path.join(backupDir, hookFile);
          fs.copyFileSync(existingFile, backupFile);
          log(`   📦 Backed up ${hookFile} (was different)`, colors.yellow);
        } else {
          log(`   ✅ ${hookFile} already up to date`, colors.green);
        }
      }
    }
  });

  if (backedUpAny) {
    log(`📦 Backed up modified hook files to ${backupDir}`, colors.yellow);
  }
}

/**
 * Check if a hook command matches our hook pattern
 */
function isOurHook(command) {
  if (!command || typeof command !== 'string') return false;
  
  // Match patterns like "node ~/.claude/hooks/preToolUse.js" or variations
  const patterns = [
    /\/hooks\/preToolUse\.js/,
    /\/hooks\/postToolUse\.js/,
    /\/hooks\/notification\.js/,
    /\/hooks\/stop\.js/,
    /\/hooks\/subagentStop\.js/
  ];
  
  return patterns.some(pattern => pattern.test(command));
}

/**
 * Get our hook command for a specific hook type
 */
function getOurHookCommand(hookType) {
  const hookMap = {
    'PreToolUse': 'node ~/.claude/hooks/preToolUse.js',
    'PostToolUse': 'node ~/.claude/hooks/postToolUse.js',
    'Notification': 'node ~/.claude/hooks/notification.js',
    'Stop': 'node ~/.claude/hooks/stop.js',
    'SubagentStop': 'node ~/.claude/hooks/subagentStop.js'
  };
  
  return hookMap[hookType];
}

/**
 * Update or add our hook to an existing hook configuration
 */
function updateHookArray(existingHooks, hookType) {
  if (!existingHooks || !Array.isArray(existingHooks)) {
    // No existing hooks, create new array with our hook
    return [{
      matcher: "",
      hooks: [{
        type: "command",
        command: getOurHookCommand(hookType)
      }]
    }];
  }

  let updated = false;
  const ourCommand = getOurHookCommand(hookType);

  // Process each matcher group
  const updatedHooks = existingHooks.map(matcherGroup => {
    if (!matcherGroup.hooks || !Array.isArray(matcherGroup.hooks)) {
      return matcherGroup;
    }

    // Check if any hooks in this group are ours
    const updatedGroupHooks = matcherGroup.hooks.map(hook => {
      if (hook.type === 'command' && isOurHook(hook.command)) {
        log(`   🔄 Updating existing hook: ${hook.command}`, colors.yellow);
        updated = true;
        return {
          ...hook,
          command: ourCommand
        };
      }
      return hook;
    });

    return {
      ...matcherGroup,
      hooks: updatedGroupHooks
    };
  });

  // If we didn't update any existing hooks, add ours to the first matcher group
  // or create a new matcher group if none exist
  if (!updated) {
    if (updatedHooks.length > 0 && updatedHooks[0].hooks) {
      // Add to first existing matcher group
      updatedHooks[0].hooks.push({
        type: "command",
        command: ourCommand
      });
      log(`   ➕ Added hook to existing matcher group`, colors.green);
    } else {
      // Create new matcher group
      updatedHooks.push({
        matcher: "",
        hooks: [{
          type: "command",
          command: ourCommand
        }]
      });
      log(`   ➕ Created new matcher group with our hook`, colors.green);
    }
  }

  return updatedHooks;
}

/**
 * Create or update settings.json with hook configuration
 */
function updateSettings() {
  let settings = {};
  
  // Load existing settings if they exist
  if (fs.existsSync(USER_SETTINGS_FILE)) {
    try {
      const content = fs.readFileSync(USER_SETTINGS_FILE, 'utf8');
      settings = JSON.parse(content);
      log('📄 Found existing settings.json', colors.cyan);
    } catch (err) {
      log('⚠️  Could not parse existing settings.json, creating new one', colors.yellow);
      settings = {};
    }
  }

  // Ensure hooks section exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Update each hook type intelligently
  const hookTypes = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];
  
  hookTypes.forEach(hookType => {
    log(`🔍 Processing ${hookType} hooks...`, colors.cyan);
    settings.hooks[hookType] = updateHookArray(settings.hooks[hookType], hookType);
  });

  // Write settings
  fs.writeFileSync(USER_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  log('✅ Updated ~/.claude/settings.json with hook configuration', colors.green);
}

/**
 * Show current hook status
 */
function showHookStatus() {
  log('\n📊 Current Hook Status\n', colors.bright);
  
  // Check if hooks directory exists
  if (!fs.existsSync(USER_HOOKS_DIR)) {
    log('❌ No hooks installed in ~/.claude/hooks/', colors.red);
    return;
  }
  
  // Check our specific hooks
  const ourHookFiles = ['preToolUse.js', 'postToolUse.js', 'notification.js', 'stop.js', 'subagentStop.js'];
  
  ourHookFiles.forEach(hookFile => {
    const filePath = path.join(USER_HOOKS_DIR, hookFile);
    if (fs.existsSync(filePath)) {
      log(`✅ ${hookFile}`, colors.green);
    } else {
      log(`❌ ${hookFile} (missing)`, colors.red);
    }
  });
  
  // Check settings.json
  if (fs.existsSync(USER_SETTINGS_FILE)) {
    try {
      const settings = JSON.parse(fs.readFileSync(USER_SETTINGS_FILE, 'utf8'));
      if (settings.hooks) {
        const hookTypes = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];
        let ourHooksConfigured = 0;
        
        hookTypes.forEach(hookType => {
          if (settings.hooks[hookType]) {
            const hasOurHook = settings.hooks[hookType].some(group => 
              group.hooks && group.hooks.some(hook => 
                hook.type === 'command' && isOurHook(hook.command)
              )
            );
            if (hasOurHook) ourHooksConfigured++;
          }
        });
        
        log(`\n⚙️  Settings: ${ourHooksConfigured}/${hookTypes.length} hooks configured`, 
             ourHooksConfigured === hookTypes.length ? colors.green : colors.yellow);
      } else {
        log('\n❌ No hooks configured in settings.json', colors.red);
      }
    } catch (err) {
      log('\n❌ Could not read settings.json', colors.red);
    }
  } else {
    log('\n❌ No settings.json found', colors.red);
  }
}

/**
 * Main installation function
 */
function installHooks(options = {}) {
  log('\n🚀 Claude Agent Manager Hook Installer\n', colors.bright);

  // Check if source hooks exist
  if (!fs.existsSync(HOOKS_SOURCE_DIR)) {
    log('❌ Error: Could not find hooks directory at ' + HOOKS_SOURCE_DIR, colors.red);
    log('   Please run this script from the claude-agent-manager project root', colors.red);
    process.exit(1);
  }

  // Show current status if requested
  if (options.status) {
    showHookStatus();
    return;
  }

  // Create ~/.claude directory if it doesn't exist
  if (!fs.existsSync(USER_CLAUDE_DIR)) {
    log(`📁 Creating ${USER_CLAUDE_DIR}`, colors.cyan);
    fs.mkdirSync(USER_CLAUDE_DIR, { recursive: true });
  }

  // Backup any existing hooks that would be overwritten
  if (fs.existsSync(USER_HOOKS_DIR)) {
    log(`🔍 Checking existing hooks for backup...`, colors.cyan);
    backupOurHookFiles();
  }

  // Copy our hooks to user directory
  log(`📋 Installing Claude Agent Manager hooks to ${USER_HOOKS_DIR}`, colors.cyan);
  copyOurHookFiles();

  // Update settings.json intelligently
  log(`⚙️  Updating hook configuration...`, colors.cyan);
  updateSettings();

  // Create .env file in user hooks directory if it doesn't exist
  const userEnvFile = path.join(USER_HOOKS_DIR, '.env');
  if (!fs.existsSync(userEnvFile)) {
    const envContent = `# Claude Agent Manager Hook Configuration
CAM_SERVER_URL=http://localhost:3001
CAM_AGENT_ID=claude-agent-manager
CAM_SECURITY_ENABLED=true
CAM_LOG_LEVEL=info
CAM_LOG_TO_FILE=false
`;
    fs.writeFileSync(userEnvFile, envContent);
    log('📝 Created ~/.claude/hooks/.env with default configuration', colors.green);
  } else {
    log('📝 Found existing .env file (preserved)', colors.cyan);
  }

  // Remove hook-wrappers from project if they exist
  const projectWrappers = path.join(__dirname, '..', '.claude', 'hook-wrappers');
  if (fs.existsSync(projectWrappers)) {
    fs.rmSync(projectWrappers, { recursive: true, force: true });
    log('🧹 Cleaned up project hook-wrappers', colors.cyan);
  }

  log('\n✅ Installation complete!', colors.green + colors.bright);
  log('\n📍 Hooks installed to: ' + USER_HOOKS_DIR, colors.cyan);
  log('⚙️  Settings updated at: ' + USER_SETTINGS_FILE, colors.cyan);
  log('\n🎯 The hooks will now work from any directory on your system!', colors.green);
  log('💡 To customize hook behavior, edit ~/.claude/hooks/.env', colors.yellow);
  log('📊 To check hook status, run: npm run hooks:install -- --status\n', colors.yellow);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (const arg of args) {
    if (arg === '--status' || arg === '-s') {
      options.status = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  
  return options;
}

// Show help message
function showHelp() {
  log('\n🚀 Claude Agent Manager Hook Installer\n', colors.bright);
  log('Usage: npm run hooks:install [options]\n', colors.cyan);
  log('Options:', colors.bright);
  log('  --status, -s    Show current hook installation status', colors.cyan);
  log('  --force, -f     Force reinstall even if hooks are up to date', colors.cyan);
  log('  --help, -h      Show this help message', colors.cyan);
  log('\nExamples:', colors.bright);
  log('  npm run hooks:install           # Install/update hooks', colors.cyan);
  log('  npm run hooks:install -- --status   # Check hook status', colors.cyan);
  log('  npm run hooks:install -- --force    # Force reinstall\n', colors.cyan);
}

// Run installation if called directly
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
  } else {
    installHooks(options);
  }
}

module.exports = { installHooks, showHookStatus };