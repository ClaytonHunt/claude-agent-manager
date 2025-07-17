#!/usr/bin/env node

const { z } = require('zod');
const HookBase = require('./core/HookBase');
const Security = require('./utils/Security');

/**
 * Post-tool use hook
 * Captures tool execution results and performance metrics
 * Logs tool completion and any errors
 */
class PostToolUseHook extends HookBase {
  constructor() {
    super('post_tool_use');
  }

  async validateInput(input) {
    const schema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.object({
        tool_name: z.string(),
        tool_input: z.record(z.any()).optional(),
        tool_output: z.any().optional(),
        tool_error: z.string().optional(),
        command: z.string().optional(),
        file_path: z.string().optional(),
        execution_time: z.number().optional(),
        exit_code: z.number().optional(),
        stdout: z.string().optional(),
        stderr: z.string().optional()
      }).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    return schema.parse(input);
  }

  async processHook(input) {
    const payload = input.payload || {};
    const startTime = Date.now();

    // Extract tool execution results
    const toolResult = {
      name: payload.tool_name,
      input: Security.sanitizeForLogging(payload.tool_input),
      output: this.sanitizeToolOutput(payload.tool_output),
      error: payload.tool_error,
      command: payload.command,
      filePath: payload.file_path,
      executionTime: payload.execution_time,
      exitCode: payload.exit_code,
      stdout: this.truncateOutput(payload.stdout),
      stderr: this.truncateOutput(payload.stderr),
      timestamp: new Date().toISOString()
    };

    // Log tool completion
    const logLevel = payload.tool_error ? 'error' : 'info';
    const message = payload.tool_error ? 
      `Tool execution failed: ${toolResult.name}` : 
      `Tool execution completed: ${toolResult.name}`;

    this.logger.log(logLevel, message, {
      toolResult,
      processingTime: Date.now() - startTime
    });

    // Analyze tool usage patterns
    const analysisResult = this.analyzeToolUsage(toolResult);

    return {
      hookType: this.hookType,
      eventType: 'tool.post_use',
      toolName: toolResult.name,
      toolInput: toolResult.input,
      toolOutput: toolResult.output,
      toolError: toolResult.error,
      command: toolResult.command,
      filePath: toolResult.filePath,
      executionTime: toolResult.executionTime,
      exitCode: toolResult.exitCode,
      stdout: toolResult.stdout,
      stderr: toolResult.stderr,
      success: !payload.tool_error,
      analysis: analysisResult,
      timestamp: toolResult.timestamp,
      sessionId: this.config.getSessionId(),
      summary: this.generateSummary(input)
    };
  }

  sanitizeToolOutput(output) {
    if (!output) return null;
    
    // Convert to string if object
    let outputStr = typeof output === 'object' ? JSON.stringify(output) : String(output);
    
    // Truncate very long outputs
    if (outputStr.length > 5000) {
      outputStr = outputStr.substring(0, 5000) + '... [TRUNCATED]';
    }

    return Security.sanitizeForLogging(outputStr);
  }

  truncateOutput(output) {
    if (!output) return null;
    
    // Truncate stdout/stderr to reasonable length
    if (output.length > 2000) {
      return output.substring(0, 2000) + '... [TRUNCATED]';
    }
    
    return output;
  }

  analyzeToolUsage(toolResult) {
    const analysis = {
      toolType: this.categorizeToolType(toolResult.name),
      performance: this.analyzePerformance(toolResult),
      riskLevel: this.assessRiskLevel(toolResult),
      patterns: this.identifyPatterns(toolResult)
    };

    return analysis;
  }

  categorizeToolType(toolName) {
    const categories = {
      'file_operations': ['Edit', 'Write', 'Read', 'MultiEdit'],
      'system_operations': ['Bash', 'Shell', 'Terminal'],
      'network_operations': ['WebFetch', 'NetworkRequest', 'HTTPRequest'],
      'search_operations': ['Grep', 'Glob', 'Find'],
      'navigation': ['LS', 'CD', 'PWD'],
      'development': ['Task', 'Test', 'Build', 'Deploy'],
      'other': []
    };

    for (const [category, tools] of Object.entries(categories)) {
      if (tools.includes(toolName)) {
        return category;
      }
    }

    return 'other';
  }

  analyzePerformance(toolResult) {
    const performance = {
      duration: toolResult.executionTime || 0,
      outputSize: toolResult.output ? toolResult.output.length : 0,
      memoryUsage: this.estimateMemoryUsage(toolResult),
      efficiency: 'normal'
    };

    // Classify performance
    if (performance.duration > 30000) { // 30 seconds
      performance.efficiency = 'slow';
    } else if (performance.duration > 5000) { // 5 seconds
      performance.efficiency = 'moderate';
    } else {
      performance.efficiency = 'fast';
    }

    return performance;
  }

  estimateMemoryUsage(toolResult) {
    let estimatedBytes = 0;
    
    // Estimate based on output size
    if (toolResult.output) {
      estimatedBytes += toolResult.output.length * 2; // UTF-16 encoding
    }
    
    if (toolResult.stdout) {
      estimatedBytes += toolResult.stdout.length * 2;
    }
    
    if (toolResult.stderr) {
      estimatedBytes += toolResult.stderr.length * 2;
    }

    return estimatedBytes;
  }

  assessRiskLevel(toolResult) {
    let riskLevel = 'low';
    
    // Increase risk for system operations
    if (toolResult.name === 'Bash' || toolResult.name === 'Shell') {
      riskLevel = 'medium';
    }
    
    // Increase risk for network operations
    if (toolResult.name === 'WebFetch' || toolResult.name === 'NetworkRequest') {
      riskLevel = 'medium';
    }
    
    // Increase risk for file operations on sensitive paths
    if (toolResult.filePath) {
      const sensitivePatterns = [
        /^\//,  // Root filesystem
        /\.env/,  // Environment files
        /\.key/,  // Key files
        /\.pem/,  // Certificate files
        /\.ssh/   // SSH directory
      ];
      
      if (sensitivePatterns.some(pattern => pattern.test(toolResult.filePath))) {
        riskLevel = 'high';
      }
    }
    
    // Increase risk for errors
    if (toolResult.error || toolResult.exitCode !== 0) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    return riskLevel;
  }

  identifyPatterns(toolResult) {
    const patterns = [];
    
    // File operation patterns
    if (toolResult.filePath) {
      if (toolResult.filePath.endsWith('.js') || toolResult.filePath.endsWith('.ts')) {
        patterns.push('javascript_development');
      }
      if (toolResult.filePath.endsWith('.py')) {
        patterns.push('python_development');
      }
      if (toolResult.filePath.includes('test')) {
        patterns.push('testing');
      }
      if (toolResult.filePath.includes('config')) {
        patterns.push('configuration');
      }
    }
    
    // Command patterns
    if (toolResult.command) {
      if (toolResult.command.includes('npm') || toolResult.command.includes('yarn')) {
        patterns.push('package_management');
      }
      if (toolResult.command.includes('git')) {
        patterns.push('version_control');
      }
      if (toolResult.command.includes('docker')) {
        patterns.push('containerization');
      }
    }
    
    // Error patterns
    if (toolResult.error) {
      if (toolResult.error.includes('permission')) {
        patterns.push('permission_issue');
      }
      if (toolResult.error.includes('not found')) {
        patterns.push('missing_resource');
      }
      if (toolResult.error.includes('timeout')) {
        patterns.push('timeout_issue');
      }
    }

    return patterns;
  }

  generateSummary(input) {
    const payload = input.payload || {};
    const summary = {
      action: 'tool_completion',
      toolName: payload.tool_name,
      success: !payload.tool_error,
      executionTime: payload.execution_time,
      timestamp: new Date().toISOString()
    };

    if (payload.tool_error) {
      summary.error = payload.tool_error.substring(0, 200);
    }

    if (payload.file_path) {
      summary.filePath = payload.file_path;
    }

    return summary;
  }
}

// Execute the hook
if (require.main === module) {
  const hook = new PostToolUseHook();
  hook.run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(0); // Always exit successfully
  });
}

module.exports = PostToolUseHook;