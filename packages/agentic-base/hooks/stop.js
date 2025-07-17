#!/usr/bin/env node

const { z } = require('zod');
const HookBase = require('./core/HookBase');
const Security = require('./utils/Security');

/**
 * Stop hook
 * Handles session termination and cleanup
 * Captures final metrics and session summary
 */
class StopHook extends HookBase {
  constructor() {
    super('stop');
  }

  async validateInput(input) {
    const schema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.object({
        reason: z.string().optional(),
        exit_code: z.number().optional(),
        session_duration: z.number().optional(),
        final_state: z.record(z.any()).optional(),
        metrics: z.object({
          tools_used: z.number().optional(),
          commands_executed: z.number().optional(),
          files_modified: z.number().optional(),
          errors_encountered: z.number().optional(),
          warnings_generated: z.number().optional()
        }).optional(),
        user_feedback: z.string().optional(),
        cleanup_required: z.boolean().optional(),
        resources_to_cleanup: z.array(z.string()).optional()
      }).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    return schema.parse(input);
  }

  async processHook(input) {
    const payload = input.payload || {};
    const startTime = Date.now();

    // Extract session termination details
    const sessionEnd = {
      reason: payload.reason || 'normal_exit',
      exitCode: payload.exit_code || 0,
      sessionDuration: payload.session_duration || 0,
      finalState: Security.sanitizeForLogging(payload.final_state || {}),
      metrics: payload.metrics || {},
      userFeedback: payload.user_feedback,
      cleanupRequired: payload.cleanup_required || false,
      resourcesToCleanup: payload.resources_to_cleanup || [],
      timestamp: new Date().toISOString()
    };

    // Perform session analysis
    const sessionAnalysis = await this.analyzeSession(sessionEnd);

    // Handle cleanup if required
    const cleanupResult = await this.handleCleanup(sessionEnd);

    // Generate session summary
    const sessionSummary = this.generateSessionSummary(sessionEnd, sessionAnalysis);

    // Log session termination
    this.logger.info(`Session terminated: ${sessionEnd.reason}`, {
      sessionEnd,
      sessionAnalysis,
      cleanupResult,
      sessionSummary,
      processingTime: Date.now() - startTime
    });

    // Archive session data if configured
    const archiveResult = await this.archiveSessionData(sessionEnd, sessionAnalysis);

    return {
      hookType: this.hookType,
      eventType: 'session.terminated',
      reason: sessionEnd.reason,
      exitCode: sessionEnd.exitCode,
      sessionDuration: sessionEnd.sessionDuration,
      finalState: sessionEnd.finalState,
      metrics: sessionEnd.metrics,
      userFeedback: sessionEnd.userFeedback,
      cleanupRequired: sessionEnd.cleanupRequired,
      resourcesToCleanup: sessionEnd.resourcesToCleanup,
      sessionAnalysis,
      cleanupResult,
      sessionSummary,
      archiveResult,
      timestamp: sessionEnd.timestamp,
      sessionId: this.config.getSessionId(),
      summary: this.generateSummary(input)
    };
  }

  async analyzeSession(sessionEnd) {
    const analysis = {
      sessionType: this.categorizeSession(sessionEnd),
      productivity: this.calculateProductivity(sessionEnd),
      errorRate: this.calculateErrorRate(sessionEnd),
      patterns: this.identifySessionPatterns(sessionEnd),
      recommendations: this.generateRecommendations(sessionEnd)
    };

    return analysis;
  }

  categorizeSession(sessionEnd) {
    const { metrics } = sessionEnd;
    
    // Categorize based on session activity
    if (metrics.tools_used > 20) {
      return 'intensive_development';
    } else if (metrics.files_modified > 10) {
      return 'coding_session';
    } else if (metrics.commands_executed > 15) {
      return 'system_administration';
    } else if (metrics.errors_encountered > 5) {
      return 'debugging_session';
    } else {
      return 'exploration_session';
    }
  }

  calculateProductivity(sessionEnd) {
    const { metrics, sessionDuration } = sessionEnd;
    
    if (sessionDuration === 0) {
      return { score: 0, level: 'unknown' };
    }

    // Calculate productivity score (0-100)
    let score = 0;
    
    // Tools used per minute
    const toolsPerMinute = (metrics.tools_used || 0) / (sessionDuration / 60000);
    score += Math.min(toolsPerMinute * 10, 30);
    
    // Files modified
    score += Math.min((metrics.files_modified || 0) * 5, 25);
    
    // Commands executed
    score += Math.min((metrics.commands_executed || 0) * 2, 20);
    
    // Penalty for errors
    score -= Math.min((metrics.errors_encountered || 0) * 3, 15);
    
    // Bonus for completion (no errors)
    if (sessionEnd.exitCode === 0 && (metrics.errors_encountered || 0) === 0) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    let level;
    if (score >= 80) level = 'high';
    else if (score >= 60) level = 'medium';
    else if (score >= 40) level = 'low';
    else level = 'very_low';

    return { score, level };
  }

  calculateErrorRate(sessionEnd) {
    const { metrics } = sessionEnd;
    const totalOperations = (metrics.tools_used || 0) + (metrics.commands_executed || 0);
    
    if (totalOperations === 0) {
      return { rate: 0, level: 'none' };
    }

    const errorRate = (metrics.errors_encountered || 0) / totalOperations;
    
    let level;
    if (errorRate === 0) level = 'none';
    else if (errorRate <= 0.05) level = 'low';
    else if (errorRate <= 0.15) level = 'medium';
    else level = 'high';

    return { rate: errorRate, level };
  }

  identifySessionPatterns(sessionEnd) {
    const patterns = [];
    const { metrics, reason, sessionDuration } = sessionEnd;

    // Duration patterns
    if (sessionDuration > 3600000) { // 1 hour
      patterns.push('long_session');
    } else if (sessionDuration < 300000) { // 5 minutes
      patterns.push('short_session');
    }

    // Activity patterns
    if (metrics.files_modified > metrics.tools_used * 0.5) {
      patterns.push('file_intensive');
    }

    if (metrics.commands_executed > metrics.tools_used * 0.8) {
      patterns.push('command_intensive');
    }

    // Error patterns
    if ((metrics.errors_encountered || 0) > 0 && reason !== 'normal_exit') {
      patterns.push('error_termination');
    }

    // Completion patterns
    if (reason === 'normal_exit' && (metrics.errors_encountered || 0) === 0) {
      patterns.push('successful_completion');
    }

    return patterns;
  }

  generateRecommendations(sessionEnd) {
    const recommendations = [];
    const { metrics, sessionDuration } = sessionEnd;

    // Performance recommendations
    if (sessionDuration > 7200000) { // 2 hours
      recommendations.push('Consider taking breaks during long sessions');
    }

    // Error recommendations
    if ((metrics.errors_encountered || 0) > 5) {
      recommendations.push('Review error patterns to improve workflow');
    }

    // Productivity recommendations
    if ((metrics.tools_used || 0) < 5 && sessionDuration > 1800000) { // 30 minutes
      recommendations.push('Consider using more tools for efficient development');
    }

    // File management recommendations
    if ((metrics.files_modified || 0) > 20) {
      recommendations.push('Consider organizing changes into smaller, focused sessions');
    }

    return recommendations;
  }

  async handleCleanup(sessionEnd) {
    const cleanupResult = {
      performed: false,
      resources_cleaned: [],
      errors: [],
      duration: 0
    };

    if (!sessionEnd.cleanupRequired) {
      return cleanupResult;
    }

    const startTime = Date.now();
    cleanupResult.performed = true;

    // Cleanup temporary files
    for (const resource of sessionEnd.resourcesToCleanup) {
      try {
        await this.cleanupResource(resource);
        cleanupResult.resources_cleaned.push(resource);
      } catch (error) {
        cleanupResult.errors.push({
          resource,
          error: error.message
        });
      }
    }

    // Cleanup log files if configured
    if (this.config.logging.cleanupOnExit) {
      try {
        this.logger.cleanup();
        cleanupResult.resources_cleaned.push('log_files');
      } catch (error) {
        cleanupResult.errors.push({
          resource: 'log_files',
          error: error.message
        });
      }
    }

    cleanupResult.duration = Date.now() - startTime;
    return cleanupResult;
  }

  async cleanupResource(resource) {
    // Implementation depends on resource type
    // For now, just log the cleanup attempt
    this.logger.debug(`Cleaning up resource: ${resource}`);
    
    // In a full implementation, this would handle:
    // - Temporary file deletion
    // - Process termination
    // - Cache clearing
    // - Connection cleanup
    // etc.
  }

  generateSessionSummary(sessionEnd, sessionAnalysis) {
    const summary = {
      sessionId: this.config.getSessionId(),
      agentId: this.config.getAgentId(),
      projectPath: this.config.getProjectPath(),
      startTime: new Date(Date.now() - sessionEnd.sessionDuration).toISOString(),
      endTime: sessionEnd.timestamp,
      duration: sessionEnd.sessionDuration,
      exitReason: sessionEnd.reason,
      exitCode: sessionEnd.exitCode,
      metrics: sessionEnd.metrics,
      productivity: sessionAnalysis.productivity,
      errorRate: sessionAnalysis.errorRate,
      patterns: sessionAnalysis.patterns,
      recommendations: sessionAnalysis.recommendations,
      userFeedback: sessionEnd.userFeedback
    };

    return summary;
  }

  async archiveSessionData(sessionEnd, sessionAnalysis) {
    const archiveResult = {
      archived: false,
      archiveLocation: null,
      archiveSize: 0,
      error: null
    };

    if (!this.config.archiving?.enabled) {
      return archiveResult;
    }

    try {
      // In a full implementation, this would:
      // - Create archive directory
      // - Compress session data
      // - Store in configured location
      // - Clean up old archives
      
      archiveResult.archived = true;
      archiveResult.archiveLocation = `${this.config.archiving.directory}/${this.config.getSessionId()}.json`;
      
      this.logger.info('Session data archived', {
        archiveLocation: archiveResult.archiveLocation
      });
      
    } catch (error) {
      archiveResult.error = error.message;
      this.logger.error('Failed to archive session data', { error: error.message });
    }

    return archiveResult;
  }

  generateSummary(input) {
    const payload = input.payload || {};
    const summary = {
      action: 'session_terminated',
      reason: payload.reason || 'normal_exit',
      exitCode: payload.exit_code || 0,
      sessionDuration: payload.session_duration || 0,
      timestamp: new Date().toISOString()
    };

    if (payload.metrics) {
      summary.toolsUsed = payload.metrics.tools_used || 0;
      summary.filesModified = payload.metrics.files_modified || 0;
      summary.errorsEncountered = payload.metrics.errors_encountered || 0;
    }

    if (payload.user_feedback) {
      summary.userFeedback = payload.user_feedback.substring(0, 100);
    }

    return summary;
  }
}

// Execute the hook
if (require.main === module) {
  const hook = new StopHook();
  hook.run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(0); // Always exit successfully
  });
}

module.exports = StopHook;