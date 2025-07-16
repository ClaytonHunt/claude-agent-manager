const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Structured logging system for Claude Code hooks
 * Supports multiple log levels, file rotation, and contextual logging
 */
class Logger {
  constructor(config) {
    this.config = config;
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Handle both Config instance and plain config object
    const configObj = config.config || config;
    this.currentLevel = this.logLevels[configObj.logging.level] || this.logLevels.info;
    this.logDirectory = configObj.logging.directory;
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDirectory, `claude-hooks-${date}.log`);
  }

  formatLogEntry(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      agentId: this.config.getAgentId ? this.config.getAgentId() : 'unknown',
      sessionId: this.config.getSessionId ? this.config.getSessionId() : 'unknown',
      projectPath: this.config.getProjectPath ? this.config.getProjectPath() : process.cwd(),
      pid: process.pid,
      ...context
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(logEntry) {
    try {
      const logFile = this.getLogFileName();
      fs.appendFileSync(logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, context = {}) {
    const levelValue = this.logLevels[level];
    if (levelValue > this.currentLevel) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, context);
    
    // Write to file
    this.writeToFile(logEntry);
    
    // Only write to console for development and not in hook execution
    if (process.env.NODE_ENV !== 'production' && !process.env.CLAUDE_HOOK_EXECUTION) {
      const consoleMethod = level === 'error' ? console.error : 
                          level === 'warn' ? console.warn : 
                          console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  error(message, context = {}) {
    this.log('error', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    this.log('debug', message, context);
  }

  logHookEvent(hookType, eventData, processingTime = null) {
    const context = {
      hookType,
      eventData: this.sanitizeEventData(eventData),
      processingTime
    };
    this.info(`Hook event processed: ${hookType}`, context);
  }

  logError(error, context = {}) {
    const errorContext = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...context
    };
    this.error('Hook processing error', errorContext);
  }

  logHttpRequest(method, url, statusCode, responseTime, error = null) {
    const context = {
      http: {
        method,
        url,
        statusCode,
        responseTime
      }
    };

    if (error) {
      context.error = {
        message: error.message,
        code: error.code
      };
      this.error('HTTP request failed', context);
    } else {
      this.info('HTTP request completed', context);
    }
  }

  sanitizeEventData(eventData) {
    // Remove sensitive data from logs
    const sanitized = { ...eventData };
    
    // Remove file contents to avoid logging large amounts of data
    if (sanitized.file_content) {
      sanitized.file_content = `[CONTENT LENGTH: ${sanitized.file_content.length}]`;
    }
    
    // Remove sensitive environment variables
    if (sanitized.env) {
      sanitized.env = '[ENVIRONMENT VARIABLES REDACTED]';
    }
    
    // Truncate very long values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '... [TRUNCATED]';
      }
    });
    
    return sanitized;
  }

  rotateLogFiles() {
    try {
      const maxFiles = this.config.logging.maxFiles || 30;
      const files = fs.readdirSync(this.logDirectory)
        .filter(file => file.startsWith('claude-hooks-') && file.endsWith('.log'))
        .sort()
        .reverse(); // Newest first

      if (files.length > maxFiles) {
        const filesToDelete = files.slice(maxFiles);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(path.join(this.logDirectory, file));
          } catch (error) {
            console.error(`Failed to delete old log file ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  cleanup() {
    this.rotateLogFiles();
  }
}

module.exports = Logger;