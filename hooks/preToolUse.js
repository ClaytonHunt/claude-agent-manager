#!/usr/bin/env node

const { z } = require('zod');
const HookBase = require('./core/HookBase');
const Security = require('./utils/Security');

/**
 * Pre-tool use hook
 * Validates and logs tool usage before execution
 * Can block dangerous tools or commands
 */
class PreToolUseHook extends HookBase {
  constructor() {
    super('pre_tool_use');
  }

  async validateInput(input) {
    const schema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.object({
        tool_name: z.string(),
        tool_input: z.record(z.any()).optional(),
        command: z.string().optional(),
        file_path: z.string().optional(),
        environment: z.record(z.string()).optional(),
        working_directory: z.string().optional()
      }).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    const validatedInput = schema.parse(input);
    
    // Perform security validation
    await this.performSecurityValidation(validatedInput);
    
    return validatedInput;
  }

  async performSecurityValidation(input) {
    if (!this.config.isSecurityEnabled()) {
      return;
    }

    const payload = input.payload || {};

    // Validate tool name
    const toolValidation = Security.validateTool(payload.tool_name);
    if (!toolValidation.valid) {
      throw new Error(`Tool blocked: ${toolValidation.reason}`);
    }

    // Validate command if present
    if (payload.command) {
      const commandValidation = Security.validateCommand(payload.command);
      if (!commandValidation.valid) {
        throw new Error(`Command blocked: ${commandValidation.reason}`);
      }
    }

    // Validate file path if present
    if (payload.file_path) {
      const fileValidation = Security.validateFilePath(payload.file_path);
      if (!fileValidation.valid) {
        throw new Error(`File access blocked: ${fileValidation.reason}`);
      }
    }

    // Check for tool-specific restrictions
    await this.validateToolSpecificRestrictions(payload);
  }

  async validateToolSpecificRestrictions(payload) {
    const toolName = payload.tool_name;
    
    switch (toolName) {
      case 'Bash':
      case 'Shell':
        await this.validateBashTool(payload);
        break;
      case 'Edit':
      case 'Write':
        await this.validateEditTool(payload);
        break;
      case 'Read':
        await this.validateReadTool(payload);
        break;
      case 'NetworkRequest':
        await this.validateNetworkTool(payload);
        break;
      default:
        // Allow other tools by default
        break;
    }
  }

  async validateBashTool(payload) {
    const command = payload.command || payload.tool_input?.command;
    if (!command) {
      return;
    }

    // Additional bash-specific validations
    const bashRestrictions = [
      /\bsu\s+/i,                    // Switch user
      /\bsudo\s+su/i,                // Sudo to switch user
      /\bchroot/i,                   // Change root
      /\bmount\s+/i,                 // Mount filesystems
      /\bumount\s+/i,                // Unmount filesystems
      /\biptables/i,                 // Firewall rules
      /\bufw\s+/i,                   // Firewall management
      /\bsystemctl\s+.*stop/i,       // Stop system services
      /\bservice\s+.*stop/i,         // Stop services
      /\bdocker\s+.*--privileged/i,  // Privileged containers
      /\bkubectl\s+.*delete/i        // Kubernetes deletions
    ];

    for (const restriction of bashRestrictions) {
      if (restriction.test(command)) {
        throw new Error(`Bash command blocked: ${command}`);
      }
    }
  }

  async validateEditTool(payload) {
    const filePath = payload.file_path || payload.tool_input?.file_path;
    if (!filePath) {
      return;
    }

    // Additional edit-specific validations
    const editRestrictions = [
      /\/etc\//i,                    // System configuration
      /\/usr\/bin\//i,               // System binaries
      /\/usr\/sbin\//i,              // System admin binaries
      /\/sbin\//i,                   // System binaries
      /\/lib\//i,                    // System libraries
      /\/var\/www\//i,               // Web server files
      /\.bashrc$/i,                  // Shell configuration
      /\.bash_profile$/i,            // Shell configuration
      /\.profile$/i,                 // Shell configuration
      /authorized_keys$/i,           // SSH authorized keys
      /known_hosts$/i                // SSH known hosts
    ];

    for (const restriction of editRestrictions) {
      if (restriction.test(filePath)) {
        throw new Error(`Edit access blocked: ${filePath}`);
      }
    }
  }

  async validateReadTool(payload) {
    const filePath = payload.file_path || payload.tool_input?.file_path;
    if (!filePath) {
      return;
    }

    // Check file size to prevent reading huge files
    const fs = require('fs');
    try {
      const stats = fs.statSync(filePath);
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxFileSize) {
        throw new Error(`File too large: ${filePath} (${stats.size} bytes)`);
      }
    } catch (error) {
      // File doesn't exist or can't be accessed, let the tool handle it
    }
  }

  async validateNetworkTool(payload) {
    const url = payload.url || payload.tool_input?.url;
    if (!url) {
      return;
    }

    // Block internal network requests
    const internalNetworks = [
      /^https?:\/\/localhost/i,
      /^https?:\/\/127\./i,
      /^https?:\/\/192\.168\./i,
      /^https?:\/\/10\./i,
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./i,
      /^https?:\/\/169\.254\./i,     // Link-local
      /^https?:\/\/0\./i,            // Invalid/local
      /^https?:\/\/[^\/]*:\d+/i      // Custom ports (potentially internal)
    ];

    for (const network of internalNetworks) {
      if (network.test(url)) {
        throw new Error(`Internal network request blocked: ${url}`);
      }
    }
  }

  async processHook(input) {
    const payload = input.payload || {};
    const startTime = Date.now();

    // Extract tool information
    const toolInfo = {
      name: payload.tool_name,
      input: Security.sanitizeForLogging(payload.tool_input),
      command: payload.command,
      filePath: payload.file_path,
      workingDirectory: payload.working_directory || this.config.get('agent.projectPath'),
      environment: payload.environment ? Object.keys(payload.environment) : [],
      timestamp: new Date().toISOString()
    };

    // Log tool usage
    this.logger.info(`Tool validation passed: ${toolInfo.name}`, {
      toolInfo,
      validationTime: Date.now() - startTime
    });

    return {
      hookType: this.hookType,
      eventType: 'tool.pre_use',
      toolName: toolInfo.name,
      toolInput: toolInfo.input,
      command: toolInfo.command,
      filePath: toolInfo.filePath,
      workingDirectory: toolInfo.workingDirectory,
      environment: toolInfo.environment,
      validationResult: 'approved',
      timestamp: toolInfo.timestamp,
      sessionId: this.config.getSessionId(),
      summary: this.generateSummary(input)
    };
  }

  generateSummary(input) {
    const payload = input.payload || {};
    const summary = {
      action: 'tool_validation',
      toolName: payload.tool_name,
      approved: true,
      timestamp: new Date().toISOString()
    };

    if (payload.command) {
      summary.command = payload.command.substring(0, 100);
    }

    if (payload.file_path) {
      summary.filePath = payload.file_path;
    }

    return summary;
  }
}

// Execute the hook
if (require.main === module) {
  const hook = new PreToolUseHook();
  hook.run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(0); // Always exit successfully
  });
}

module.exports = PreToolUseHook;