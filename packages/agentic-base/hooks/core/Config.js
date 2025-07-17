const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables from .env file
// Suppress dotenv output by temporarily redirecting console.log
const originalConsoleLog = console.log;
try {
  // Temporarily suppress console.log during dotenv loading
  console.log = () => {};
  require('dotenv').config({ 
    path: path.join(process.cwd(), '.env'),
    debug: false
  });
} catch (error) {
  // Fail silently - dotenv is optional
} finally {
  // Restore original console.log
  console.log = originalConsoleLog;
}

/**
 * Configuration management for Claude Code hooks
 * Supports hierarchical configuration with environment variables taking precedence
 */
class Config {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      server: {
        url: 'http://localhost:3001',
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        retryDelayMultiplier: 2
      },
      agent: {
        id: null, // Auto-generated if not provided
        projectPath: this.getProjectRoot(),
        sessionId: null // Auto-generated if not provided
      },
      hooks: {
        enableSummarization: true,
        enableTTS: false,
        enableSecurityChecks: true,
        batchSize: 10,
        flushInterval: 5000
      },
      logging: {
        level: 'info',
        directory: path.join(os.homedir(), '.claude', 'logs'),
        rotation: 'daily',
        maxFiles: 30
      },
      security: {
        blockDangerousCommands: true,
        blockSensitiveFiles: true,
        validatePaths: true
      }
    };

    // Load configuration from multiple sources in order of precedence
    const sources = [
      this.loadEnvironmentConfig(),
      this.loadFileConfig(path.join(os.homedir(), '.claude', 'hooks-config.json')),
      this.loadFileConfig(path.join(process.cwd(), '.claude', 'hooks-config.json')),
      this.loadFileConfig(path.join(os.homedir(), '.claude', 'settings.json')),
      this.loadFileConfig(path.join(process.cwd(), '.claude', 'settings.json'))
    ];

    // Merge configurations with defaultConfig as base
    return sources.reduce((merged, source) => {
      return this.deepMerge(merged, source);
    }, defaultConfig);
  }

  loadEnvironmentConfig() {
    const env = process.env;
    const config = {};

    // Server configuration (support both CLAUDE_ and CAM_ prefixes)
    // Support new hierarchical environment variables
    const serverUrl = this.getServerUrlFromEnv(env);
    if (serverUrl) {
      config.server = { url: serverUrl };
    }
    
    if (env.CLAUDE_HOOKS_TIMEOUT) {
      config.server = { ...config.server, timeout: parseInt(env.CLAUDE_HOOKS_TIMEOUT) };
    }
    if (env.CLAUDE_HOOKS_RETRIES) {
      config.server = { ...config.server, retries: parseInt(env.CLAUDE_HOOKS_RETRIES) };
    }
    if (env.CLAUDE_HOOKS_RETRY_DELAY) {
      config.server = { ...config.server, retryDelay: parseInt(env.CLAUDE_HOOKS_RETRY_DELAY) };
    }

    // Agent configuration (support both CLAUDE_ and CAM_ prefixes)
    if (env.CLAUDE_AGENT_ID || env.CAM_AGENT_ID) {
      config.agent = { id: env.CAM_AGENT_ID || env.CLAUDE_AGENT_ID };
    }
    if (env.CLAUDE_SESSION_ID) {
      config.agent = { ...config.agent, sessionId: env.CLAUDE_SESSION_ID };
    }
    if (env.CAM_PROJECT_PATH) {
      config.agent = { ...config.agent, projectPath: env.CAM_PROJECT_PATH };
    }

    // Hook configuration (support both CLAUDE_ and CAM_ prefixes)
    if (env.CLAUDE_HOOKS_ENABLE_SUMMARIZATION || env.CAM_SUMMARIZATION_ENABLED) {
      const value = env.CAM_SUMMARIZATION_ENABLED || env.CLAUDE_HOOKS_ENABLE_SUMMARIZATION;
      config.hooks = { enableSummarization: value === 'true' };
    }
    if (env.CLAUDE_HOOKS_ENABLE_TTS) {
      config.hooks = { ...config.hooks, enableTTS: env.CLAUDE_HOOKS_ENABLE_TTS === 'true' };
    }
    if (env.CLAUDE_HOOKS_ENABLE_SECURITY_CHECKS || env.CAM_SECURITY_ENABLED) {
      const value = env.CAM_SECURITY_ENABLED || env.CLAUDE_HOOKS_ENABLE_SECURITY_CHECKS;
      config.hooks = { ...config.hooks, enableSecurityChecks: value === 'true' };
    }

    // Logging configuration (support both CLAUDE_ and CAM_ prefixes)
    if (env.CLAUDE_HOOKS_LOG_LEVEL) {
      config.logging = { level: env.CLAUDE_HOOKS_LOG_LEVEL };
    }
    if (env.CLAUDE_HOOKS_LOG_DIR || env.CAM_LOG_DIRECTORY) {
      config.logging = { ...config.logging, directory: env.CAM_LOG_DIRECTORY || env.CLAUDE_HOOKS_LOG_DIR };
    }

    return config;
  }

  loadFileConfig(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      // Ignore file loading errors, use defaults
    }
    return {};
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  get(path) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && current.hasOwnProperty(key)) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  getProjectRoot() {
    const currentDir = process.cwd();
    
    // If we're in the .claude/hooks directory, go up two levels to get project root
    if (currentDir.endsWith('.claude/hooks')) {
      return path.dirname(path.dirname(currentDir));
    }
    
    // If we're in the .claude directory, go up one level
    if (currentDir.endsWith('.claude')) {
      return path.dirname(currentDir);
    }
    
    // Otherwise, assume we're already in project root
    return currentDir;
  }

  getProjectPath() {
    return this.get('agent.projectPath');
  }

  generateAgentId() {
    if (!this.config.agent.id) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      this.config.agent.id = `claude-agent-${timestamp}-${random}`;
    }
    return this.config.agent.id;
  }

  generateSessionId() {
    if (!this.config.agent.sessionId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      this.config.agent.sessionId = `session-${timestamp}-${random}`;
    }
    return this.config.agent.sessionId;
  }

  getServerUrlFromEnv(env) {
    // Multi-layer discovery strategy for server URL
    const candidates = [
      // 1. Explicit URL override
      env.CAM_SERVER_URL,
      env.CLAUDE_MANAGER_URL,
      env.SERVER_URL,
      
      // 2. Construct from SERVER_PORT
      env.SERVER_PORT ? `http://localhost:${env.SERVER_PORT}` : null,
      
      // 3. Construct from PORT (legacy support)
      env.PORT ? `http://localhost:${env.PORT}` : null
    ];
    
    // Return first valid URL
    return candidates.find(url => url && this.isValidUrl(url));
  }

  isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  async getServerUrl() {
    // Try service discovery first, then fall back to config
    const discoveredUrl = await this.discoverServerUrl();
    return discoveredUrl || this.config.server.url;
  }

  async discoverServerUrl() {
    const candidates = [
      this.config.server.url,
      'http://localhost:3001', // default fallback
      'http://localhost:3000', // alternative port
    ];
    
    for (const url of candidates) {
      if (await this.validateServerHealth(url)) {
        return url;
      }
    }
    return null;
  }

  async validateServerHealth(url) {
    const http = require('http');
    const https = require('https');
    
    return new Promise((resolve) => {
      const client = url.startsWith('https:') ? https : http;
      const timeout = 5000;
      
      const req = client.get(`${url}/health`, { timeout }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  getAgentId() {
    return this.config.agent.id || this.generateAgentId();
  }

  getSessionId() {
    return this.config.agent.sessionId || this.generateSessionId();
  }

  getProjectPath() {
    return this.config.agent.projectPath;
  }

  isSecurityEnabled() {
    return this.config.hooks.enableSecurityChecks;
  }

  isSummarizationEnabled() {
    return this.config.hooks.enableSummarization;
  }

  isTTSEnabled() {
    return this.config.hooks.enableTTS;
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = Config;