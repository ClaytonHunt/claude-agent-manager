/**
 * Security utilities for validating and sanitizing hook inputs
 */
class Security {
  /**
   * Comprehensive command validation
   */
  static validateCommand(command) {
    if (!command || typeof command !== 'string') {
      return { valid: true, reason: null };
    }

    // Check for dangerous commands
    const dangerousResult = this.checkDangerousCommand(command);
    if (!dangerousResult.valid) {
      return dangerousResult;
    }

    // Check for suspicious patterns
    const suspiciousResult = this.checkSuspiciousPatterns(command);
    if (!suspiciousResult.valid) {
      return suspiciousResult;
    }

    // Check for injection attempts
    const injectionResult = this.checkInjectionAttempts(command);
    if (!injectionResult.valid) {
      return injectionResult;
    }

    return { valid: true, reason: null };
  }

  static checkDangerousCommand(command) {
    const dangerousPatterns = [
      // File system destruction
      { pattern: /\brm\s+.*-[a-z]*r[a-z]*f.*\*/i, reason: 'Recursive force delete with wildcard' },
      { pattern: /\brm\s+.*--recursive.*--force/i, reason: 'Recursive force delete' },
      { pattern: /\brmdir\s+.*-r/i, reason: 'Recursive directory removal' },
      { pattern: /\bfind\s+.*-delete/i, reason: 'Find with delete action' },
      
      // System modification
      { pattern: /\bsudo\s+rm/i, reason: 'Sudo with rm command' },
      { pattern: /\bchmod\s+.*777/i, reason: 'Setting world-writable permissions' },
      { pattern: /\bchown\s+.*root/i, reason: 'Changing ownership to root' },
      
      // Network operations
      { pattern: /\bcurl\s+.*\|\s*sh/i, reason: 'Curl piped to shell' },
      { pattern: /\bwget\s+.*\|\s*sh/i, reason: 'Wget piped to shell' },
      { pattern: /\bnc\s+.*-[a-z]*l/i, reason: 'Netcat listening mode' },
      
      // Process manipulation
      { pattern: /\bkill\s+.*-9/i, reason: 'Force kill signal' },
      { pattern: /\bkillall/i, reason: 'Kill all processes' },
      { pattern: /\bpkill/i, reason: 'Process kill command' },
      
      // System control
      { pattern: /\bshutdown/i, reason: 'System shutdown' },
      { pattern: /\breboot/i, reason: 'System reboot' },
      { pattern: /\bhalt/i, reason: 'System halt' },
      
      // Package management
      { pattern: /\bapt\s+.*remove/i, reason: 'Package removal' },
      { pattern: /\byum\s+.*remove/i, reason: 'Package removal' },
      { pattern: /\bnpm\s+.*uninstall.*-g/i, reason: 'Global package uninstall' },
      
      // Environment manipulation
      { pattern: /\bunset\s+PATH/i, reason: 'Unsetting PATH variable' },
      { pattern: /\bexport\s+PATH=/i, reason: 'Modifying PATH variable' },
      
      // Database operations
      { pattern: /\bdrop\s+database/i, reason: 'Database drop operation' },
      { pattern: /\btruncate\s+table/i, reason: 'Table truncation' },
      
      // Disk operations
      { pattern: /\bdd\s+.*\/dev\/zero/i, reason: 'Disk zeroing operation' },
      { pattern: /\bmkfs/i, reason: 'Filesystem creation' },
      { pattern: /\bfdisk/i, reason: 'Disk partitioning' }
    ];

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(command)) {
        return { valid: false, reason };
      }
    }

    return { valid: true, reason: null };
  }

  static checkSuspiciousPatterns(command) {
    const suspiciousPatterns = [
      // Code execution
      { pattern: /\beval\s*\(/i, reason: 'Eval function call' },
      { pattern: /\bexec\s*\(/i, reason: 'Exec function call' },
      { pattern: /\bsystem\s*\(/i, reason: 'System function call' },
      
      // File operations on sensitive locations
      { pattern: /\bcat\s+\/etc\/passwd/i, reason: 'Reading system password file' },
      { pattern: /\bcat\s+\/etc\/shadow/i, reason: 'Reading system shadow file' },
      { pattern: /\bls\s+.*\.ssh/i, reason: 'Listing SSH directory' },
      
      // Network reconnaissance
      { pattern: /\bnmap\s+/i, reason: 'Network mapping' },
      { pattern: /\bping\s+.*-[a-z]*f/i, reason: 'Ping flooding' },
      { pattern: /\btelnet\s+/i, reason: 'Telnet connection' },
      
      // Log manipulation
      { pattern: /\b>\s*\/var\/log/i, reason: 'Writing to system logs' },
      { pattern: /\bcat\s+\/dev\/null\s*>/i, reason: 'Clearing files' },
      
      // Binary execution
      { pattern: /\b\.\/[a-zA-Z0-9_-]+$/i, reason: 'Executing binary file' },
      { pattern: /\bsh\s+.*\.sh/i, reason: 'Executing shell script' }
    ];

    for (const { pattern, reason } of suspiciousPatterns) {
      if (pattern.test(command)) {
        return { valid: false, reason };
      }
    }

    return { valid: true, reason: null };
  }

  static checkInjectionAttempts(command) {
    const injectionPatterns = [
      // Command injection
      { pattern: /[;&|`$()]/g, reason: 'Command injection metacharacters' },
      { pattern: /\$\{[^}]*\}/g, reason: 'Variable substitution' },
      { pattern: /\$\([^)]*\)/g, reason: 'Command substitution' },
      { pattern: /`[^`]*`/g, reason: 'Backtick command execution' },
      
      // SQL injection patterns
      { pattern: /'\s*;\s*drop/i, reason: 'SQL injection attempt' },
      { pattern: /'\s*or\s*'1'\s*=\s*'1/i, reason: 'SQL injection attempt' },
      { pattern: /union\s+select/i, reason: 'SQL union injection' },
      
      // XSS patterns
      { pattern: /<script/i, reason: 'Script tag injection' },
      { pattern: /javascript:/i, reason: 'JavaScript protocol' },
      { pattern: /on\w+\s*=/i, reason: 'Event handler injection' }
    ];

    for (const { pattern, reason } of injectionPatterns) {
      if (pattern.test(command)) {
        return { valid: false, reason };
      }
    }

    return { valid: true, reason: null };
  }

  /**
   * Validate file path for security issues
   */
  static validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return { valid: true, reason: null };
    }

    // Check for path traversal
    const traversalResult = this.checkPathTraversal(filePath);
    if (!traversalResult.valid) {
      return traversalResult;
    }

    // Check for sensitive files
    const sensitiveResult = this.checkSensitiveFile(filePath);
    if (!sensitiveResult.valid) {
      return sensitiveResult;
    }

    return { valid: true, reason: null };
  }

  static checkPathTraversal(filePath) {
    const traversalPatterns = [
      { pattern: /\.\.\//g, reason: 'Path traversal with ../' },
      { pattern: /\.\.\\/g, reason: 'Path traversal with ..\\ (Windows)' },
      { pattern: /\.\.%2f/gi, reason: 'URL-encoded path traversal' },
      { pattern: /\.\.%5c/gi, reason: 'URL-encoded path traversal (Windows)' },
      { pattern: /\.\.\x2f/gi, reason: 'Hex-encoded path traversal' },
      { pattern: /\.\.\x5c/gi, reason: 'Hex-encoded path traversal (Windows)' }
    ];

    for (const { pattern, reason } of traversalPatterns) {
      if (pattern.test(filePath)) {
        return { valid: false, reason };
      }
    }

    return { valid: true, reason: null };
  }

  static checkSensitiveFile(filePath) {
    const sensitivePatterns = [
      // System files
      { pattern: /^\/etc\/passwd$/i, reason: 'System password file' },
      { pattern: /^\/etc\/shadow$/i, reason: 'System shadow file' },
      { pattern: /^\/etc\/sudoers/i, reason: 'Sudo configuration' },
      { pattern: /^\/boot\//i, reason: 'Boot directory' },
      { pattern: /^\/sys\//i, reason: 'System directory' },
      { pattern: /^\/proc\//i, reason: 'Process directory' },
      
      // SSH keys
      { pattern: /\.ssh\/.*_rsa$/i, reason: 'SSH private key' },
      { pattern: /\.ssh\/.*_dsa$/i, reason: 'SSH private key' },
      { pattern: /\.ssh\/.*_ecdsa$/i, reason: 'SSH private key' },
      { pattern: /\.ssh\/.*_ed25519$/i, reason: 'SSH private key' },
      
      // Environment files
      { pattern: /\.env$/i, reason: 'Environment configuration' },
      { pattern: /\.env\.local$/i, reason: 'Local environment configuration' },
      { pattern: /\.env\.production$/i, reason: 'Production environment configuration' },
      
      // Database files
      { pattern: /\.db$/i, reason: 'Database file' },
      { pattern: /\.sqlite$/i, reason: 'SQLite database' },
      { pattern: /\.sqlite3$/i, reason: 'SQLite database' },
      
      // Certificate files
      { pattern: /\.pem$/i, reason: 'Certificate file' },
      { pattern: /\.crt$/i, reason: 'Certificate file' },
      { pattern: /\.key$/i, reason: 'Private key file' },
      { pattern: /\.p12$/i, reason: 'PKCS#12 certificate' },
      { pattern: /\.pfx$/i, reason: 'PKCS#12 certificate' },
      
      // Configuration files
      { pattern: /aws\/credentials$/i, reason: 'AWS credentials' },
      { pattern: /\.aws\/config$/i, reason: 'AWS configuration' },
      { pattern: /\.docker\/config\.json$/i, reason: 'Docker configuration' },
      
      // Log files in system directories
      { pattern: /^\/var\/log\//i, reason: 'System log directory' },
      { pattern: /^\/var\/run\//i, reason: 'System runtime directory' }
    ];

    for (const { pattern, reason } of sensitivePatterns) {
      if (pattern.test(filePath)) {
        return { valid: false, reason };
      }
    }

    return { valid: true, reason: null };
  }

  /**
   * Sanitize input data for logging
   */
  static sanitizeForLogging(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // Remove sensitive keys
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'api_key', 'access_token', 'refresh_token', 'private_key'
    ];
    
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      const result = { ...obj };
      
      Object.keys(result).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]';
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = sanitizeObject(result[key]);
        }
      });
      
      return result;
    };
    
    const result = sanitizeObject(sanitized);

    // Truncate large content
    if (result.file_content && result.file_content.length > 1000) {
      result.file_content = result.file_content.substring(0, 1000) + '... [TRUNCATED]';
    }

    return result;
  }

  /**
   * Check if a tool is allowed to be executed
   */
  static validateTool(toolName) {
    if (!toolName || typeof toolName !== 'string') {
      return { valid: true, reason: null };
    }

    // List of restricted tools
    const restrictedTools = [
      'Shell', 'Bash', 'Terminal', 'Command', 'System',
      'NetworkRequest', 'HTTPRequest', 'FileDownload',
      'DatabaseQuery', 'SQLQuery', 'AdminPanel'
    ];

    if (restrictedTools.includes(toolName)) {
      return { valid: false, reason: `Restricted tool: ${toolName}` };
    }

    return { valid: true, reason: null };
  }
}

module.exports = Security;