const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const Config = require('./Config');
const Logger = require('./Logger');
const EventSender = require('./EventSender');

/**
 * Base class for all Claude Code hooks
 * Provides common functionality for input validation, processing, and event sending
 */
class HookBase {
  constructor(hookType) {
    this.hookType = hookType;
    this.config = new Config();
    this.logger = new Logger(this.config);
    this.eventSender = new EventSender(this.config, this.logger);
    this.startTime = Date.now();
  }

  /**
   * Main entry point for hook processing
   * Reads input from stdin, validates, processes, and sends events
   */
  async run() {
    // Set environment variable to suppress console output
    process.env.CLAUDE_HOOK_EXECUTION = 'true';
    
    try {
      // Log hook execution start
      await this.logHookExecution('start');
      
      // Read input from stdin
      const input = await this.readInput();
      
      // Validate input
      const validatedInput = await this.validateInput(input);
      
      // Process hook-specific logic
      const result = await this.processHook(validatedInput);
      
      // Send event to backend
      await this.sendEvent(result);
      
      // Log success
      const processingTime = Date.now() - this.startTime;
      this.logger.logHookEvent(this.hookType, result, processingTime);
      
      // Log hook execution completion
      await this.logHookExecution('complete', result, processingTime);
      
      // Output result as JSON to stdout for Claude Code
      console.log(JSON.stringify(result, null, 2));
      
      // Clean exit
      process.exit(0);
      
    } catch (error) {
      // Log hook execution error
      await this.logHookExecution('error', error);
      
      this.logger.logError(error, {
        hookType: this.hookType,
        processingTime: Date.now() - this.startTime
      });
      
      // Output error result as JSON to stdout for Claude Code
      const errorResult = {
        hookType: this.hookType,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(errorResult, null, 2));
      
      // Always exit successfully to not block Claude Code
      process.exit(0);
    }
  }

  /**
   * Read and parse input from stdin
   */
  async readInput() {
    return new Promise((resolve, reject) => {
      let input = '';
      
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', (chunk) => {
        input += chunk;
      });
      
      process.stdin.on('end', () => {
        try {
          if (input.trim()) {
            resolve(JSON.parse(input));
          } else {
            resolve({});
          }
        } catch (error) {
          reject(new Error(`Invalid JSON input: ${error.message}`));
        }
      });
      
      process.stdin.on('error', (error) => {
        reject(new Error(`Input read error: ${error.message}`));
      });
      
      // Set timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Input timeout'));
      }, 10000);
    });
  }

  /**
   * Validate input using Zod schema
   * Override in subclasses to provide specific validation
   */
  async validateInput(input) {
    const baseSchema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.record(z.any()).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    try {
      return baseSchema.parse(input);
    } catch (error) {
      throw new Error(`Input validation failed: ${error.message}`);
    }
  }

  /**
   * Process hook-specific logic
   * Override in subclasses to implement specific behavior
   */
  async processHook(input) {
    return {
      hookType: this.hookType,
      timestamp: new Date().toISOString(),
      input: input
    };
  }

  /**
   * Send processed event to backend
   */
  async sendEvent(eventData) {
    return await this.eventSender.sendEvent(this.hookType, eventData);
  }

  /**
   * Security validation for commands and file paths
   */
  validateSecurity(input) {
    if (!this.config.isSecurityEnabled || !this.config.isSecurityEnabled()) {
      return true;
    }

    // Check for dangerous commands
    if (input.command && this.isDangerousCommand(input.command)) {
      throw new Error(`Dangerous command blocked: ${input.command}`);
    }

    // Check for sensitive file access
    if (input.file_path && this.isSensitiveFile(input.file_path)) {
      throw new Error(`Sensitive file access blocked: ${input.file_path}`);
    }

    // Validate file paths
    if (input.file_path && !this.isValidPath(input.file_path)) {
      throw new Error(`Invalid file path: ${input.file_path}`);
    }

    return true;
  }

  isDangerousCommand(command) {
    const dangerousPatterns = [
      // Destructive file operations
      /\brm\s+.*-[a-z]*r[a-z]*f/i,
      /\brm\s+.*--recursive.*--force/i,
      /\brm\s+.*\*/,
      /\brmdir\s+.*-[a-z]*r/i,
      
      // System modification
      /\bsudo\s+rm/i,
      /\bchmod\s+.*777/i,
      /\bchown\s+.*root/i,
      
      // Network operations
      /\bcurl\s+.*\|\s*sh/i,
      /\bwget\s+.*\|\s*sh/i,
      /\bnc\s+.*-[a-z]*l/i,
      
      // Process manipulation
      /\bkill\s+.*-9/i,
      /\bkillall/i,
      /\bpkill/i,
      
      // System shutdown
      /\bshutdown/i,
      /\breboot/i,
      /\bhalt/i,
      
      // Package management
      /\bapt\s+.*remove/i,
      /\byum\s+.*remove/i,
      /\bnpm\s+.*uninstall.*-g/i,
      
      // Environment manipulation
      /\bunset\s+PATH/i,
      /\bexport\s+PATH=/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  isSensitiveFile(filePath) {
    const sensitivePatterns = [
      // System files
      /^\/etc\/passwd$/i,
      /^\/etc\/shadow$/i,
      /^\/etc\/sudoers/i,
      /^\/boot\//i,
      /^\/sys\//i,
      /^\/proc\//i,
      
      // SSH keys
      /\.ssh\/.*_rsa$/i,
      /\.ssh\/.*_dsa$/i,
      /\.ssh\/.*_ecdsa$/i,
      /\.ssh\/.*_ed25519$/i,
      
      // Environment files
      /\.env$/i,
      /\.env\.local$/i,
      /\.env\.production$/i,
      
      // Database files
      /\.db$/i,
      /\.sqlite$/i,
      /\.sqlite3$/i,
      
      // Certificate files
      /\.pem$/i,
      /\.crt$/i,
      /\.key$/i,
      /\.p12$/i,
      /\.pfx$/i,
      
      // Configuration files
      /aws\/credentials$/i,
      /\.aws\/config$/i,
      /\.docker\/config\.json$/i,
      
      // Log files in system directories
      /^\/var\/log\//i,
      /^\/var\/run\//i
    ];

    return sensitivePatterns.some(pattern => pattern.test(filePath));
  }

  isValidPath(filePath) {
    // Check for path traversal attempts
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /\.\.%2f/i,
      /\.\.%5c/i,
      /\.\.\x2f/i,
      /\.\.\x5c/i
    ];

    if (pathTraversalPatterns.some(pattern => pattern.test(filePath))) {
      return false;
    }

    // Must be absolute path or relative to current directory
    if (filePath.startsWith('/')) {
      return true; // Absolute path
    }

    if (filePath.startsWith('./') || !filePath.includes('/')) {
      return true; // Relative path
    }

    return false;
  }

  /**
   * Generate summary of event for condensed logging
   */
  generateSummary(input) {
    if (!this.config.isSummarizationEnabled || !this.config.isSummarizationEnabled()) {
      return null;
    }

    // Basic summarization - can be enhanced with AI
    const summary = {
      hookType: this.hookType,
      timestamp: new Date().toISOString(),
      agentId: this.config.getAgentId(),
      sessionId: this.config.getSessionId()
    };

    if (input.command) {
      summary.command = input.command.substring(0, 100);
    }

    if (input.file_path) {
      summary.filePath = input.file_path;
    }

    if (input.tool_name) {
      summary.toolName = input.tool_name;
    }

    return summary;
  }

  /**
   * Log hook execution to hook-log.md file
   * Controlled by CLAUDE_HOOK_LOGGING environment variable
   */
  async logHookExecution(status, data = null, processingTime = null) {
    // Only log if environment variable is set
    if (!process.env.CLAUDE_HOOK_LOGGING) {
      return;
    }

    try {
      const logPath = path.join(__dirname, '..', '..', 'hook-log.md');
      const timestamp = new Date().toISOString();
      
      let logEntry = `\n## ${this.hookType} - ${status.toUpperCase()}\n`;
      logEntry += `**Time**: ${timestamp}\n`;
      
      if (processingTime !== null) {
        logEntry += `**Processing Time**: ${processingTime}ms\n`;
      }
      
      if (status === 'error' && data) {
        logEntry += `**Error**: ${data.message || data}\n`;
      } else if (status === 'complete' && data) {
        logEntry += `**Result**: ${JSON.stringify(data, null, 2)}\n`;
      }
      
      logEntry += `**Process**: ${process.pid}\n`;
      logEntry += `**Session**: ${process.env.CLAUDE_SESSION_ID || 'unknown'}\n`;
      logEntry += `---\n`;
      
      // Append to log file
      fs.appendFileSync(logPath, logEntry);
      
    } catch (error) {
      // Fail silently to not interfere with hook execution
      console.error(`Hook logging failed: ${error.message}`);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.logger) {
      this.logger.cleanup();
    }
  }
}

module.exports = HookBase;