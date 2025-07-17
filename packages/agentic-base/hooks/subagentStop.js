#!/usr/bin/env node

const { z } = require('zod');
const HookBase = require('./core/HookBase');
const Security = require('./utils/Security');

/**
 * Subagent stop hook
 * Handles termination of subagent processes
 * Captures subagent metrics and results
 */
class SubagentStopHook extends HookBase {
  constructor() {
    super('subagent_stop');
  }

  async validateInput(input) {
    const schema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.object({
        subagent_id: z.string().optional(),
        subagent_type: z.string().optional(),
        parent_agent_id: z.string().optional(),
        task_description: z.string().optional(),
        reason: z.string().optional(),
        exit_code: z.number().optional(),
        execution_time: z.number().optional(),
        task_result: z.any().optional(),
        task_error: z.string().optional(),
        metrics: z.object({
          tools_used: z.number().optional(),
          commands_executed: z.number().optional(),
          files_accessed: z.number().optional(),
          network_requests: z.number().optional(),
          memory_usage: z.number().optional(),
          cpu_time: z.number().optional()
        }).optional(),
        output_summary: z.string().optional(),
        success: z.boolean().optional(),
        child_agents: z.array(z.string()).optional()
      }).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    return schema.parse(input);
  }

  async processHook(input) {
    const payload = input.payload || {};
    const startTime = Date.now();

    // Extract subagent termination details
    const subagentEnd = {
      subagentId: payload.subagent_id || `subagent_${Date.now()}`,
      subagentType: payload.subagent_type || 'unknown',
      parentAgentId: payload.parent_agent_id || this.config.getAgentId(),
      taskDescription: payload.task_description,
      reason: payload.reason || 'task_completed',
      exitCode: payload.exit_code || 0,
      executionTime: payload.execution_time || 0,
      taskResult: Security.sanitizeForLogging(payload.task_result),
      taskError: payload.task_error,
      metrics: payload.metrics || {},
      outputSummary: payload.output_summary,
      success: payload.success !== undefined ? payload.success : payload.exit_code === 0,
      childAgents: payload.child_agents || [],
      timestamp: new Date().toISOString()
    };

    // Analyze subagent performance
    const performanceAnalysis = this.analyzeSubagentPerformance(subagentEnd);

    // Analyze task completion
    const taskAnalysis = this.analyzeTaskCompletion(subagentEnd);

    // Handle child agent cleanup
    const childCleanupResult = await this.handleChildAgentCleanup(subagentEnd);

    // Generate subagent summary
    const subagentSummary = this.generateSubagentSummary(subagentEnd, performanceAnalysis, taskAnalysis);

    // Log subagent termination
    this.logger.info(`Subagent terminated: ${subagentEnd.subagentId}`, {
      subagentEnd,
      performanceAnalysis,
      taskAnalysis,
      childCleanupResult,
      subagentSummary,
      processingTime: Date.now() - startTime
    });

    // Update parent agent with subagent results
    const parentUpdateResult = await this.updateParentAgent(subagentEnd, taskAnalysis);

    return {
      hookType: this.hookType,
      eventType: 'subagent.terminated',
      subagentId: subagentEnd.subagentId,
      subagentType: subagentEnd.subagentType,
      parentAgentId: subagentEnd.parentAgentId,
      taskDescription: subagentEnd.taskDescription,
      reason: subagentEnd.reason,
      exitCode: subagentEnd.exitCode,
      executionTime: subagentEnd.executionTime,
      taskResult: subagentEnd.taskResult,
      taskError: subagentEnd.taskError,
      metrics: subagentEnd.metrics,
      outputSummary: subagentEnd.outputSummary,
      success: subagentEnd.success,
      childAgents: subagentEnd.childAgents,
      performanceAnalysis,
      taskAnalysis,
      childCleanupResult,
      subagentSummary,
      parentUpdateResult,
      timestamp: subagentEnd.timestamp,
      sessionId: this.config.getSessionId(),
      summary: this.generateSummary(input)
    };
  }

  analyzeSubagentPerformance(subagentEnd) {
    const { metrics, executionTime } = subagentEnd;
    
    const performance = {
      efficiency: this.calculateEfficiency(metrics, executionTime),
      resourceUsage: this.analyzeResourceUsage(metrics),
      throughput: this.calculateThroughput(metrics, executionTime),
      bottlenecks: this.identifyBottlenecks(metrics, executionTime)
    };

    return performance;
  }

  calculateEfficiency(metrics, executionTime) {
    if (executionTime === 0) {
      return { score: 0, level: 'unknown' };
    }

    let score = 0;
    const timeInSeconds = executionTime / 1000;

    // Tools used per second
    const toolsPerSecond = (metrics.tools_used || 0) / timeInSeconds;
    score += Math.min(toolsPerSecond * 20, 30);

    // Commands executed per second
    const commandsPerSecond = (metrics.commands_executed || 0) / timeInSeconds;
    score += Math.min(commandsPerSecond * 15, 25);

    // Files accessed per second
    const filesPerSecond = (metrics.files_accessed || 0) / timeInSeconds;
    score += Math.min(filesPerSecond * 10, 20);

    // Network requests per second
    const networkPerSecond = (metrics.network_requests || 0) / timeInSeconds;
    score += Math.min(networkPerSecond * 5, 15);

    // Time bonus for quick completion
    if (timeInSeconds < 10) {
      score += 10;
    } else if (timeInSeconds < 30) {
      score += 5;
    }

    score = Math.max(0, Math.min(100, score));

    let level;
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else level = 'poor';

    return { score, level };
  }

  analyzeResourceUsage(metrics) {
    const usage = {
      memory: {
        amount: metrics.memory_usage || 0,
        level: this.categorizeMemoryUsage(metrics.memory_usage || 0)
      },
      cpu: {
        time: metrics.cpu_time || 0,
        level: this.categorizeCpuUsage(metrics.cpu_time || 0)
      },
      network: {
        requests: metrics.network_requests || 0,
        level: this.categorizeNetworkUsage(metrics.network_requests || 0)
      },
      files: {
        accessed: metrics.files_accessed || 0,
        level: this.categorizeFileUsage(metrics.files_accessed || 0)
      }
    };

    return usage;
  }

  categorizeMemoryUsage(memoryUsage) {
    if (memoryUsage < 10 * 1024 * 1024) return 'low'; // < 10MB
    if (memoryUsage < 100 * 1024 * 1024) return 'moderate'; // < 100MB
    if (memoryUsage < 500 * 1024 * 1024) return 'high'; // < 500MB
    return 'very_high';
  }

  categorizeCpuUsage(cpuTime) {
    if (cpuTime < 1000) return 'low'; // < 1 second
    if (cpuTime < 10000) return 'moderate'; // < 10 seconds
    if (cpuTime < 60000) return 'high'; // < 1 minute
    return 'very_high';
  }

  categorizeNetworkUsage(networkRequests) {
    if (networkRequests === 0) return 'none';
    if (networkRequests < 5) return 'low';
    if (networkRequests < 20) return 'moderate';
    return 'high';
  }

  categorizeFileUsage(filesAccessed) {
    if (filesAccessed === 0) return 'none';
    if (filesAccessed < 5) return 'low';
    if (filesAccessed < 20) return 'moderate';
    return 'high';
  }

  calculateThroughput(metrics, executionTime) {
    if (executionTime === 0) {
      return { rate: 0, level: 'unknown' };
    }

    const timeInSeconds = executionTime / 1000;
    const totalOperations = (metrics.tools_used || 0) + 
                          (metrics.commands_executed || 0) + 
                          (metrics.files_accessed || 0) + 
                          (metrics.network_requests || 0);

    const rate = totalOperations / timeInSeconds;

    let level;
    if (rate >= 2) level = 'high';
    else if (rate >= 1) level = 'moderate';
    else if (rate >= 0.5) level = 'low';
    else level = 'very_low';

    return { rate, level };
  }

  identifyBottlenecks(metrics, executionTime) {
    const bottlenecks = [];

    // Long execution time
    if (executionTime > 60000) { // 1 minute
      bottlenecks.push({
        type: 'execution_time',
        severity: 'high',
        description: 'Subagent took longer than expected to complete'
      });
    }

    // High memory usage
    if (metrics.memory_usage > 100 * 1024 * 1024) { // 100MB
      bottlenecks.push({
        type: 'memory_usage',
        severity: 'medium',
        description: 'High memory consumption detected'
      });
    }

    // Many network requests
    if (metrics.network_requests > 50) {
      bottlenecks.push({
        type: 'network_requests',
        severity: 'medium',
        description: 'Excessive network requests may impact performance'
      });
    }

    // Low operation rate
    const timeInSeconds = executionTime / 1000;
    const operationsPerSecond = (metrics.tools_used || 0) / timeInSeconds;
    if (operationsPerSecond < 0.1 && executionTime > 10000) {
      bottlenecks.push({
        type: 'low_throughput',
        severity: 'low',
        description: 'Low operation throughput detected'
      });
    }

    return bottlenecks;
  }

  analyzeTaskCompletion(subagentEnd) {
    const analysis = {
      completionStatus: this.categorizeCompletion(subagentEnd),
      qualityScore: this.calculateQualityScore(subagentEnd),
      taskType: this.categorizeTaskType(subagentEnd.taskDescription),
      complexity: this.estimateTaskComplexity(subagentEnd),
      recommendations: this.generateTaskRecommendations(subagentEnd)
    };

    return analysis;
  }

  categorizeCompletion(subagentEnd) {
    if (subagentEnd.taskError) {
      return 'failed';
    }

    if (subagentEnd.success && subagentEnd.exitCode === 0) {
      return 'successful';
    }

    if (subagentEnd.exitCode === 0 && subagentEnd.taskResult) {
      return 'completed';
    }

    return 'partial';
  }

  calculateQualityScore(subagentEnd) {
    let score = 50; // Base score

    // Success bonus
    if (subagentEnd.success) {
      score += 30;
    }

    // No error bonus
    if (!subagentEnd.taskError) {
      score += 20;
    }

    // Result completeness
    if (subagentEnd.taskResult) {
      score += 15;
    }

    // Output summary bonus
    if (subagentEnd.outputSummary) {
      score += 10;
    }

    // Execution time penalty
    if (subagentEnd.executionTime > 300000) { // 5 minutes
      score -= 15;
    }

    // Child agent management bonus
    if (subagentEnd.childAgents.length > 0) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  categorizeTaskType(taskDescription) {
    if (!taskDescription) return 'unknown';

    const taskPatterns = {
      'analysis': /analy[sz]e|review|examine|investigate/i,
      'creation': /create|generate|build|make|write/i,
      'modification': /modify|update|change|edit|fix/i,
      'search': /search|find|locate|discover/i,
      'validation': /validate|verify|check|test/i,
      'cleanup': /clean|remove|delete|clear/i,
      'optimization': /optimize|improve|enhance|refactor/i
    };

    for (const [type, pattern] of Object.entries(taskPatterns)) {
      if (pattern.test(taskDescription)) {
        return type;
      }
    }

    return 'general';
  }

  estimateTaskComplexity(subagentEnd) {
    let complexity = 1; // Base complexity

    // Task description complexity
    if (subagentEnd.taskDescription) {
      if (subagentEnd.taskDescription.length > 200) {
        complexity += 1;
      }
    }

    // Execution time complexity
    if (subagentEnd.executionTime > 60000) { // 1 minute
      complexity += 1;
    }

    // Resource usage complexity
    if (subagentEnd.metrics.tools_used > 10) {
      complexity += 1;
    }

    // Child agent complexity
    if (subagentEnd.childAgents.length > 0) {
      complexity += 1;
    }

    // Network complexity
    if (subagentEnd.metrics.network_requests > 5) {
      complexity += 1;
    }

    return Math.min(5, complexity);
  }

  generateTaskRecommendations(subagentEnd) {
    const recommendations = [];

    // Performance recommendations
    if (subagentEnd.executionTime > 300000) { // 5 minutes
      recommendations.push('Consider breaking down long-running tasks into smaller subtasks');
    }

    // Error handling recommendations
    if (subagentEnd.taskError) {
      recommendations.push('Implement better error handling and recovery mechanisms');
    }

    // Resource optimization
    if (subagentEnd.metrics.memory_usage > 200 * 1024 * 1024) { // 200MB
      recommendations.push('Consider memory optimization techniques');
    }

    // Child agent recommendations
    if (subagentEnd.childAgents.length > 5) {
      recommendations.push('Monitor child agent spawning to prevent resource exhaustion');
    }

    // Network recommendations
    if (subagentEnd.metrics.network_requests > 20) {
      recommendations.push('Consider caching or batching network requests');
    }

    return recommendations;
  }

  async handleChildAgentCleanup(subagentEnd) {
    const cleanupResult = {
      processed: subagentEnd.childAgents.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const childAgentId of subagentEnd.childAgents) {
      try {
        // In a full implementation, this would:
        // - Send termination signals to child agents
        // - Wait for graceful shutdown
        // - Clean up child agent resources
        // - Log child agent termination
        
        this.logger.debug(`Cleaning up child agent: ${childAgentId}`);
        cleanupResult.successful++;
      } catch (error) {
        cleanupResult.failed++;
        cleanupResult.errors.push({
          childAgentId,
          error: error.message
        });
      }
    }

    return cleanupResult;
  }

  generateSubagentSummary(subagentEnd, performanceAnalysis, taskAnalysis) {
    const summary = {
      subagentId: subagentEnd.subagentId,
      subagentType: subagentEnd.subagentType,
      parentAgentId: subagentEnd.parentAgentId,
      taskDescription: subagentEnd.taskDescription,
      executionTime: subagentEnd.executionTime,
      success: subagentEnd.success,
      exitCode: subagentEnd.exitCode,
      reason: subagentEnd.reason,
      metrics: subagentEnd.metrics,
      performance: {
        efficiency: performanceAnalysis.efficiency.level,
        throughput: performanceAnalysis.throughput.level,
        bottlenecks: performanceAnalysis.bottlenecks.length
      },
      taskCompletion: {
        status: taskAnalysis.completionStatus,
        quality: taskAnalysis.qualityScore,
        complexity: taskAnalysis.complexity,
        type: taskAnalysis.taskType
      },
      childAgents: subagentEnd.childAgents.length,
      timestamp: subagentEnd.timestamp
    };

    return summary;
  }

  async updateParentAgent(subagentEnd, taskAnalysis) {
    const updateResult = {
      notified: false,
      error: null
    };

    try {
      // In a full implementation, this would:
      // - Send results to parent agent
      // - Update parent agent state
      // - Trigger any necessary parent agent actions
      
      this.logger.debug(`Updating parent agent: ${subagentEnd.parentAgentId}`, {
        subagentId: subagentEnd.subagentId,
        taskResult: subagentEnd.taskResult,
        taskAnalysis
      });

      updateResult.notified = true;
    } catch (error) {
      updateResult.error = error.message;
      this.logger.error('Failed to update parent agent', {
        parentAgentId: subagentEnd.parentAgentId,
        error: error.message
      });
    }

    return updateResult;
  }

  generateSummary(input) {
    const payload = input.payload || {};
    const summary = {
      action: 'subagent_terminated',
      subagentId: payload.subagent_id || 'unknown',
      subagentType: payload.subagent_type || 'unknown',
      success: payload.success !== undefined ? payload.success : true,
      executionTime: payload.execution_time || 0,
      timestamp: new Date().toISOString()
    };

    if (payload.task_description) {
      summary.taskDescription = payload.task_description.substring(0, 100);
    }

    if (payload.task_error) {
      summary.taskError = payload.task_error.substring(0, 100);
    }

    if (payload.reason) {
      summary.reason = payload.reason;
    }

    return summary;
  }
}

// Execute the hook
if (require.main === module) {
  const hook = new SubagentStopHook();
  hook.run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(0); // Always exit successfully
  });
}

module.exports = SubagentStopHook;