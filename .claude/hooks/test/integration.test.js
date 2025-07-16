/**
 * Integration tests for the hook system
 * These tests validate the complete hook functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Hook Integration Tests', () => {
  const hookScript = path.join(__dirname, '..', 'preToolUse.js');
  const testInput = {
    source_app: 'claude-code',
    session_id: 'test-session-123',
    hook_event_type: 'pre_tool_use',
    payload: {
      tool_name: 'Edit',
      tool_input: { file_path: '/test/file.txt' },
      command: 'edit file',
      file_path: '/test/file.txt',
      working_directory: '/test',
      environment: { NODE_ENV: 'test' }
    },
    timestamp: Date.now(),
    chat: []
  };

  beforeEach(() => {
    // Create test log directory
    const logDir = '/tmp/test-logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Set environment variables for testing
    process.env.CAM_SERVER_URL = 'http://localhost:3000';
    process.env.CAM_AGENT_ID = 'test-agent-123';
    process.env.CAM_SESSION_ID = 'test-session-123';
    process.env.CAM_PROJECT_PATH = '/test/project';
    process.env.CAM_LOG_DIRECTORY = logDir;
    process.env.CAM_SECURITY_ENABLED = 'true';
  });

  afterEach(() => {
    // Clean up test environment
    delete process.env.CAM_SERVER_URL;
    delete process.env.CAM_AGENT_ID;
    delete process.env.CAM_SESSION_ID;
    delete process.env.CAM_PROJECT_PATH;
    delete process.env.CAM_LOG_DIRECTORY;
    delete process.env.CAM_SECURITY_ENABLED;
  });

  it('should execute preToolUse hook successfully', (done) => {
    // Test with a longer timeout since the hook might take time
    const timeout = 15000;
    
    const hook = spawn('node', [hookScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    hook.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hook.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    hook.on('close', (code) => {
      try {
        // Hook should always exit with code 0 (success)
        expect(code).toBe(0);
        
        // There should be no critical errors in stderr
        expect(stderr).not.toContain('Error: ');
        
        done();
      } catch (error) {
        done(error);
      }
    });

    hook.on('error', (error) => {
      done(error);
    });

    // Send test input to hook
    hook.stdin.write(JSON.stringify(testInput));
    hook.stdin.end();

    // Set timeout for the test
    setTimeout(() => {
      hook.kill();
      done(new Error('Hook execution timed out'));
    }, timeout);
  });

  it('should handle invalid input gracefully', (done) => {
    const hook = spawn('node', [hookScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    hook.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hook.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    hook.on('close', (code) => {
      try {
        // Hook should still exit with code 0 even with invalid input
        expect(code).toBe(0);
        done();
      } catch (error) {
        done(error);
      }
    });

    hook.on('error', (error) => {
      done(error);
    });

    // Send invalid JSON
    hook.stdin.write('invalid json');
    hook.stdin.end();

    setTimeout(() => {
      hook.kill();
      done(new Error('Hook execution timed out'));
    }, 10000);
  });

  it('should validate security restrictions', (done) => {
    const dangerousInput = {
      ...testInput,
      payload: {
        tool_name: 'Bash',
        command: 'rm -rf *',
        working_directory: '/test'
      }
    };

    const hook = spawn('node', [hookScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    hook.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hook.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    hook.on('close', (code) => {
      try {
        // Hook should exit with code 0 (not blocking Claude)
        expect(code).toBe(0);
        
        // But should log the security violation
        expect(stderr.toLowerCase()).toContain('blocked');
        
        done();
      } catch (error) {
        done(error);
      }
    });

    hook.on('error', (error) => {
      done(error);
    });

    // Send dangerous input
    hook.stdin.write(JSON.stringify(dangerousInput));
    hook.stdin.end();

    setTimeout(() => {
      hook.kill();
      done(new Error('Hook execution timed out'));
    }, 10000);
  });

  it('should create log files', (done) => {
    const hook = spawn('node', [hookScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    hook.on('close', (code) => {
      try {
        // Check if log file was created
        const logDir = '/tmp/test-logs';
        const logFiles = fs.readdirSync(logDir).filter(file => file.startsWith('claude-hooks-'));
        
        expect(logFiles.length).toBeGreaterThan(0);
        
        done();
      } catch (error) {
        done(error);
      }
    });

    hook.on('error', (error) => {
      done(error);
    });

    // Send test input
    hook.stdin.write(JSON.stringify(testInput));
    hook.stdin.end();

    setTimeout(() => {
      hook.kill();
      done(new Error('Hook execution timed out'));
    }, 10000);
  });
});

describe('Security Module Integration', () => {
  const Security = require('../utils/Security');

  it('should validate commands end-to-end', () => {
    const safeCommand = 'ls -la';
    const dangerousCommand = 'rm -rf *';

    const safeResult = Security.validateCommand(safeCommand);
    const dangerousResult = Security.validateCommand(dangerousCommand);

    expect(safeResult.valid).toBe(true);
    expect(dangerousResult.valid).toBe(false);
    expect(dangerousResult.reason).toBeDefined();
  });

  it('should validate file paths end-to-end', () => {
    const safePath = '/home/user/document.txt';
    const dangerousPath = '/etc/passwd';

    const safeResult = Security.validateFilePath(safePath);
    const dangerousResult = Security.validateFilePath(dangerousPath);

    expect(safeResult.valid).toBe(true);
    expect(dangerousResult.valid).toBe(false);
    expect(dangerousResult.reason).toBeDefined();
  });

  it('should sanitize data for logging', () => {
    const sensitiveData = {
      username: 'testuser',
      password: 'secret123',
      api_key: 'key123',
      normal_data: 'safe_value'
    };

    const sanitized = Security.sanitizeForLogging(sensitiveData);

    expect(sanitized.username).toBe('testuser');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.api_key).toBe('[REDACTED]');
    expect(sanitized.normal_data).toBe('safe_value');
  });
});

describe('Hook System Architecture', () => {
  it('should have all required hook files', () => {
    const requiredHooks = [
      'preToolUse.js',
      'postToolUse.js',
      'notification.js',
      'stop.js',
      'subagentStop.js'
    ];

    requiredHooks.forEach(hookFile => {
      const hookPath = path.join(__dirname, '..', hookFile);
      expect(fs.existsSync(hookPath)).toBe(true);
    });
  });

  it('should have all required core modules', () => {
    const coreModules = [
      'core/HookBase.js',
      'core/Config.js',
      'core/Logger.js',
      'core/EventSender.js',
      'utils/Security.js'
    ];

    coreModules.forEach(moduleFile => {
      const modulePath = path.join(__dirname, '..', moduleFile);
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });

  it('should have proper package.json configuration', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    expect(fs.existsSync(packagePath)).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    expect(packageJson.name).toBe('@claude-agent-manager/hooks');
    expect(packageJson.dependencies).toHaveProperty('axios');
    expect(packageJson.dependencies).toHaveProperty('zod');
  });

  it('should have executable hook scripts', () => {
    const hookFiles = [
      'preToolUse.js',
      'postToolUse.js',
      'notification.js',
      'stop.js',
      'subagentStop.js'
    ];

    hookFiles.forEach(hookFile => {
      const hookPath = path.join(__dirname, '..', hookFile);
      const content = fs.readFileSync(hookPath, 'utf8');
      
      // Should have shebang line
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
      
      // Should have main execution block
      expect(content).toContain('if (require.main === module)');
    });
  });
});