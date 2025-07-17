#!/usr/bin/env node

/**
 * Complete Agentic Base Project Setup Script
 * Sets up a complete agentic development environment with:
 * - Hook installation to user ~/.claude/hooks directory
 * - Environment configuration
 * - Dependency installation
 * - Validation of setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.dirname(__dirname);
const HOOKS_SOURCE_DIR = path.join(PROJECT_ROOT, 'hooks');
const USER_CLAUDE_DIR = path.join(os.homedir(), '.claude');
const USER_HOOKS_DIR = path.join(USER_CLAUDE_DIR, 'hooks');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message) {
  log(`\n🚀 ${message}`, colors.bright);
}

function parseCliArgs(args) {
  const options = {
    serverPort: 3001,
    clientPort: 3000,
    skipDependencies: false,
    skipHooks: false,
    environment: 'development',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--server-port':
        options.serverPort = parseInt(args[++i], 10);
        break;
      case '--client-port':
        options.clientPort = parseInt(args[++i], 10);
        break;
      case '--skip-dependencies':
        options.skipDependencies = true;
        break;
      case '--skip-hooks':
        options.skipHooks = true;
        break;
      case '--environment':
        options.environment = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🚀 Agentic Base Setup Script

Usage: node scripts/setup-agentic-base.js [options]

Options:
  --server-port <port>     Set server port (default: 3001)
  --client-port <port>     Set client port (default: 3000)
  --skip-dependencies      Skip dependency installation
  --skip-hooks            Skip hook installation
  --environment <env>      Set environment (default: development)
  --help, -h              Show this help message

Examples:
  node scripts/setup-agentic-base.js
  node scripts/setup-agentic-base.js --server-port 3002 --client-port 3001
  node scripts/setup-agentic-base.js --skip-dependencies
  `);
}

async function detectEnvironment() {
  header('Environment Detection');
  
  const platform = os.platform();
  const nodeVersion = process.version;
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  
  info(`Platform: ${platform}`);
  info(`Node.js: ${nodeVersion}`);
  info(`NPM: ${npmVersion}`);
  
  // Check Node.js version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    warn(`Node.js ${nodeVersion} detected. Node.js 18+ is recommended.`);
  } else {
    success(`Node.js version ${nodeVersion} is compatible`);
  }
  
  return { platform, nodeVersion, npmVersion };
}

async function installHooks() {
  header('Installing Claude Code Hooks');
  
  try {
    // Use the existing install-hooks.js script
    const installScript = path.join(__dirname, 'install-hooks.js');
    if (fs.existsSync(installScript)) {
      require(installScript);
      success('Hooks installed successfully');
    } else {
      throw new Error('install-hooks.js not found');
    }
  } catch (error) {
    throw new Error(`Hook installation failed: ${error.message}`);
  }
}

async function setupEnvironment(options) {
  header('Environment Configuration');
  
  const { serverPort, clientPort, environment } = options;
  
  // Create .env file if it doesn't exist
  const envFile = path.join(PROJECT_ROOT, '.env');
  const envExampleFile = path.join(PROJECT_ROOT, '.env.example');
  
  if (!fs.existsSync(envFile) && fs.existsSync(envExampleFile)) {
    info('Creating .env file from .env.example');
    
    let envContent = fs.readFileSync(envExampleFile, 'utf8');
    
    // Replace port placeholders with actual values
    envContent = envContent
      .replace(/SERVER_PORT=\d+/, `SERVER_PORT=${serverPort}`)
      .replace(/CLIENT_PORT=\d+/, `CLIENT_PORT=${clientPort}`)
      .replace(/NODE_ENV=\w+/, `NODE_ENV=${environment}`);
    
    fs.writeFileSync(envFile, envContent);
    success(`Environment file created with SERVER_PORT=${serverPort}, CLIENT_PORT=${clientPort}`);
  } else if (fs.existsSync(envFile)) {
    info('.env file already exists - skipping creation');
  } else {
    warn('No .env.example found - you may need to create .env manually');
  }
}

async function installDependencies() {
  header('Installing Dependencies');
  
  try {
    info('Installing npm dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
    success('Dependencies installed successfully');
  } catch (error) {
    throw new Error(`Dependency installation failed: ${error.message}`);
  }
}

async function validateInstallation() {
  header('Validating Installation');
  
  const validations = [];
  
  // Check hooks installation
  try {
    const hooksInstalled = fs.existsSync(USER_HOOKS_DIR) && 
                          fs.readdirSync(USER_HOOKS_DIR).length > 0;
    if (hooksInstalled) {
      success('Hooks installed and accessible');
      validations.push({ name: 'Hook Installation', status: 'pass' });
    } else {
      throw new Error('Hooks directory not found or empty');
    }
  } catch (error) {
    error(`Hook validation failed: ${error.message}`);
    validations.push({ name: 'Hook Installation', status: 'fail', error: error.message });
  }
  
  // Check environment configuration
  try {
    const envFile = path.join(PROJECT_ROOT, '.env');
    if (fs.existsSync(envFile)) {
      success('Environment configuration found');
      validations.push({ name: 'Environment Configuration', status: 'pass' });
    } else {
      throw new Error('.env file not found');
    }
  } catch (error) {
    error(`Environment validation failed: ${error.message}`);
    validations.push({ name: 'Environment Configuration', status: 'fail', error: error.message });
  }
  
  // Check package.json and dependencies
  try {
    const packageFile = path.join(PROJECT_ROOT, 'package.json');
    if (fs.existsSync(packageFile)) {
      const nodeModules = path.join(PROJECT_ROOT, 'node_modules');
      if (fs.existsSync(nodeModules)) {
        success('Dependencies installed');
        validations.push({ name: 'Dependencies', status: 'pass' });
      } else {
        throw new Error('node_modules not found');
      }
    } else {
      throw new Error('package.json not found');
    }
  } catch (error) {
    error(`Dependency validation failed: ${error.message}`);
    validations.push({ name: 'Dependencies', status: 'fail', error: error.message });
  }
  
  // Summary
  const failedCount = validations.filter(v => v.status === 'fail').length;
  const passedCount = validations.filter(v => v.status === 'pass').length;
  
  log(`\n📊 Validation Summary: ${passedCount} passed, ${failedCount} failed`, 
      failedCount > 0 ? colors.yellow : colors.green);
  
  if (failedCount > 0) {
    warn('Some validations failed. Check the errors above.');
    return false;
  }
  
  return true;
}

function showQuickStart(options) {
  const { serverPort, clientPort } = options;
  
  header('Setup Complete! 🎉');
  
  log('\n📚 Quick Start Commands:', colors.bright);
  log(`   npm run dev              # Start development servers`);
  log(`   npm run setup:hooks      # Reinstall hooks if needed`);
  log(`   npm run hooks:status     # Check hook status`);
  log(`   npm run hooks:test       # Test hook connectivity`);
  log(`   npm run prd:create       # Create Product Requirements Document`);
  
  log('\n🌐 Default URLs:', colors.bright);
  log(`   Server:  http://localhost:${serverPort}`);
  log(`   Client:  http://localhost:${clientPort}`);
  
  log('\n📋 Next Steps:', colors.bright);
  log('   1. Customize package.json scripts for your project');
  log('   2. Update CLAUDE.md with your project specifics');
  log('   3. Create your first feature with: npm run prd:create');
  log('   4. Start development with: npm run dev');
  
  log('\n💡 Pro Tips:', colors.cyan);
  log('   • Use async specialist subagents for complex tasks');
  log('   • Follow TDD workflows (RED-GREEN-REFACTOR)');
  log('   • Always plan with work-analysis.md before coding');
  log('   • Let Claude Code auto-create PRs after implementation');
}

async function setupAgenticBase(options = {}) {
  try {
    log('🚀 Agentic Base Setup\n', colors.bright);
    
    const {
      serverPort = 3001,
      clientPort = 3000,
      skipDependencies = false,
      skipHooks = false,
      environment = 'development'
    } = options;
    
    // Step 1: Environment Detection
    await detectEnvironment();
    
    // Step 2: Install hooks (reuse existing implementation)
    if (!skipHooks) {
      await installHooks();
    } else {
      warn('Skipping hook installation');
    }
    
    // Step 3: Configure environment
    await setupEnvironment({ serverPort, clientPort, environment });
    
    // Step 4: Install dependencies
    if (!skipDependencies) {
      await installDependencies();
    } else {
      warn('Skipping dependency installation');
    }
    
    // Step 5: Validate installation
    const validationPassed = await validateInstallation();
    
    if (validationPassed) {
      showQuickStart({ serverPort, clientPort });
    } else {
      warn('Setup completed with warnings. Check validation results above.');
    }
    
  } catch (error) {
    error(`Setup failed: ${error.message}`);
    log('\n🔧 Troubleshooting:', colors.yellow);
    log('   • Ensure Node.js 18+ is installed');
    log('   • Check file permissions in project directory');
    log('   • Run with --help for additional options');
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  setupAgenticBase(options);
}

module.exports = { setupAgenticBase };