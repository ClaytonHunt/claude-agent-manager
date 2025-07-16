#!/usr/bin/env node

const { z } = require('zod');
const HookBase = require('./core/HookBase');
const Security = require('./utils/Security');

/**
 * Notification hook
 * Handles system notifications and alerts
 * Processes user messages and system events
 */
class NotificationHook extends HookBase {
  constructor() {
    super('notification');
  }

  async validateInput(input) {
    const schema = z.object({
      source_app: z.string().optional(),
      session_id: z.string().optional(),
      hook_event_type: z.string().optional(),
      payload: z.object({
        type: z.string().optional(),
        title: z.string().optional(),
        message: z.string().optional(),
        severity: z.enum(['info', 'warning', 'error', 'success']).optional(),
        category: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        user_id: z.string().optional(),
        channel: z.string().optional(),
        tags: z.array(z.string()).optional()
      }).optional(),
      timestamp: z.number().optional(),
      chat: z.array(z.any()).optional()
    });

    return schema.parse(input);
  }

  async processHook(input) {
    const payload = input.payload || {};
    const startTime = Date.now();

    // Extract notification details
    const notification = {
      type: payload.type || 'system',
      title: payload.title || 'Notification',
      message: this.sanitizeMessage(payload.message),
      severity: payload.severity || 'info',
      category: payload.category || 'general',
      metadata: Security.sanitizeForLogging(payload.metadata || {}),
      userId: payload.user_id,
      channel: payload.channel || 'default',
      tags: payload.tags || [],
      timestamp: new Date().toISOString()
    };

    // Process notification based on type
    const processedNotification = await this.processNotificationType(notification);

    // Log notification
    this.logger.info(`Notification processed: ${notification.type}`, {
      notification: processedNotification,
      processingTime: Date.now() - startTime
    });

    // Check if notification requires special handling
    const handlingResult = await this.handleSpecialNotifications(processedNotification);

    return {
      hookType: this.hookType,
      eventType: 'notification.received',
      notificationType: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      category: notification.category,
      metadata: notification.metadata,
      userId: notification.userId,
      channel: notification.channel,
      tags: notification.tags,
      processed: true,
      handlingResult,
      timestamp: notification.timestamp,
      sessionId: this.config.getSessionId(),
      summary: this.generateSummary(input)
    };
  }

  sanitizeMessage(message) {
    if (!message) return '';
    
    // Truncate very long messages
    if (message.length > 1000) {
      message = message.substring(0, 1000) + '... [TRUNCATED]';
    }

    // Remove sensitive information patterns
    const sensitivePatterns = [
      /api[_-]?key[s]?[:\s=]["']?([a-zA-Z0-9_-]+)/gi,
      /password[s]?[:\s=]["']?([a-zA-Z0-9_!@#$%^&*()-]+)/gi,
      /token[s]?[:\s=]["']?([a-zA-Z0-9_.-]+)/gi,
      /secret[s]?[:\s=]["']?([a-zA-Z0-9_.-]+)/gi
    ];

    sensitivePatterns.forEach(pattern => {
      message = message.replace(pattern, (match, group) => {
        return match.replace(group, '[REDACTED]');
      });
    });

    return message;
  }

  async processNotificationType(notification) {
    const processed = { ...notification };

    switch (notification.type) {
      case 'error':
        processed.analysis = this.analyzeError(notification);
        break;
      case 'warning':
        processed.analysis = this.analyzeWarning(notification);
        break;
      case 'success':
        processed.analysis = this.analyzeSuccess(notification);
        break;
      case 'system':
        processed.analysis = this.analyzeSystemEvent(notification);
        break;
      case 'user':
        processed.analysis = this.analyzeUserAction(notification);
        break;
      default:
        processed.analysis = { type: 'unknown', details: {} };
    }

    // Add context information
    processed.context = {
      projectPath: this.config.getProjectPath(),
      agentId: this.config.getAgentId(),
      sessionId: this.config.getSessionId(),
      environment: process.env.NODE_ENV || 'development'
    };

    return processed;
  }

  analyzeError(notification) {
    const analysis = {
      type: 'error_analysis',
      errorType: this.categorizeError(notification.message),
      severity: this.calculateErrorSeverity(notification),
      actionable: this.isActionableError(notification.message),
      suggestedActions: this.suggestErrorActions(notification.message)
    };

    return analysis;
  }

  categorizeError(message) {
    const errorCategories = {
      'syntax_error': /syntax.*error|unexpected.*token|parse.*error/i,
      'runtime_error': /runtime.*error|execution.*error/i,
      'network_error': /network.*error|connection.*failed|timeout/i,
      'permission_error': /permission.*denied|access.*denied|unauthorized/i,
      'file_error': /file.*not.*found|no.*such.*file|directory.*not.*found/i,
      'validation_error': /validation.*failed|invalid.*input|schema.*error/i,
      'configuration_error': /config.*error|setting.*invalid|environment.*error/i
    };

    for (const [category, pattern] of Object.entries(errorCategories)) {
      if (pattern.test(message)) {
        return category;
      }
    }

    return 'unknown_error';
  }

  calculateErrorSeverity(notification) {
    let severity = 1; // Base severity

    // Increase severity for critical keywords
    const criticalKeywords = ['crash', 'fatal', 'critical', 'emergency'];
    if (criticalKeywords.some(keyword => notification.message.toLowerCase().includes(keyword))) {
      severity += 3;
    }

    // Increase severity for system errors
    if (notification.category === 'system') {
      severity += 2;
    }

    // Decrease severity for warnings
    if (notification.severity === 'warning') {
      severity -= 1;
    }

    return Math.max(1, Math.min(5, severity));
  }

  isActionableError(message) {
    const actionablePatterns = [
      /install.*package|missing.*dependency/i,
      /permission.*denied/i,
      /file.*not.*found/i,
      /invalid.*configuration/i,
      /update.*required/i
    ];

    return actionablePatterns.some(pattern => pattern.test(message));
  }

  suggestErrorActions(message) {
    const suggestions = [];

    if (/install.*package|missing.*dependency/i.test(message)) {
      suggestions.push('Install missing package dependencies');
    }

    if (/permission.*denied/i.test(message)) {
      suggestions.push('Check file permissions and access rights');
    }

    if (/file.*not.*found/i.test(message)) {
      suggestions.push('Verify file path and existence');
    }

    if (/invalid.*configuration/i.test(message)) {
      suggestions.push('Review configuration settings');
    }

    if (/network.*error|connection.*failed/i.test(message)) {
      suggestions.push('Check network connectivity and service availability');
    }

    return suggestions;
  }

  analyzeWarning(notification) {
    return {
      type: 'warning_analysis',
      warningType: this.categorizeWarning(notification.message),
      urgency: this.calculateWarningUrgency(notification),
      preventable: this.isPreventableWarning(notification.message)
    };
  }

  categorizeWarning(message) {
    const warningCategories = {
      'deprecation': /deprecated|deprecation|will.*be.*removed/i,
      'performance': /slow|performance|optimization|inefficient/i,
      'security': /security|vulnerability|insecure|unsafe/i,
      'resource': /memory|disk.*space|cpu|resource/i,
      'compatibility': /compatibility|version.*mismatch|outdated/i
    };

    for (const [category, pattern] of Object.entries(warningCategories)) {
      if (pattern.test(message)) {
        return category;
      }
    }

    return 'general_warning';
  }

  calculateWarningUrgency(notification) {
    let urgency = 2; // Base urgency

    if (notification.message.toLowerCase().includes('security')) {
      urgency += 2;
    }

    if (notification.message.toLowerCase().includes('deprecated')) {
      urgency += 1;
    }

    return Math.max(1, Math.min(5, urgency));
  }

  isPreventableWarning(message) {
    const preventablePatterns = [
      /deprecated|outdated|version.*mismatch/i,
      /configuration|setting/i,
      /performance|optimization/i
    ];

    return preventablePatterns.some(pattern => pattern.test(message));
  }

  analyzeSuccess(notification) {
    return {
      type: 'success_analysis',
      successType: this.categorizeSuccess(notification.message),
      impact: this.calculateSuccessImpact(notification)
    };
  }

  categorizeSuccess(message) {
    const successCategories = {
      'deployment': /deploy|published|released/i,
      'build': /build.*successful|compiled|built/i,
      'test': /test.*passed|all.*tests/i,
      'installation': /install|setup.*complete/i,
      'completion': /complete|finished|done/i
    };

    for (const [category, pattern] of Object.entries(successCategories)) {
      if (pattern.test(message)) {
        return category;
      }
    }

    return 'general_success';
  }

  calculateSuccessImpact(notification) {
    let impact = 2; // Base impact

    if (notification.message.toLowerCase().includes('deploy')) {
      impact += 2;
    }

    if (notification.message.toLowerCase().includes('test')) {
      impact += 1;
    }

    return Math.max(1, Math.min(5, impact));
  }

  analyzeSystemEvent(notification) {
    return {
      type: 'system_analysis',
      systemEventType: this.categorizeSystemEvent(notification.message),
      criticality: this.calculateSystemCriticality(notification)
    };
  }

  categorizeSystemEvent(message) {
    const systemCategories = {
      'startup': /start|startup|initialize|boot/i,
      'shutdown': /stop|shutdown|terminate|exit/i,
      'resource': /memory|cpu|disk|network/i,
      'process': /process|thread|worker/i,
      'service': /service|daemon|server/i
    };

    for (const [category, pattern] of Object.entries(systemCategories)) {
      if (pattern.test(message)) {
        return category;
      }
    }

    return 'general_system';
  }

  calculateSystemCriticality(notification) {
    let criticality = 2; // Base criticality

    if (notification.message.toLowerCase().includes('crash')) {
      criticality += 3;
    }

    if (notification.message.toLowerCase().includes('restart')) {
      criticality += 2;
    }

    return Math.max(1, Math.min(5, criticality));
  }

  analyzeUserAction(notification) {
    return {
      type: 'user_analysis',
      actionType: this.categorizeUserAction(notification.message),
      userEngagement: this.calculateUserEngagement(notification)
    };
  }

  categorizeUserAction(message) {
    const actionCategories = {
      'interaction': /click|select|choose|input/i,
      'navigation': /navigate|go.*to|visit/i,
      'modification': /create|update|delete|modify/i,
      'query': /search|find|query|look/i
    };

    for (const [category, pattern] of Object.entries(actionCategories)) {
      if (pattern.test(message)) {
        return category;
      }
    }

    return 'general_action';
  }

  calculateUserEngagement(notification) {
    // Simple engagement scoring based on message content
    let engagement = 1;

    if (notification.message.length > 50) {
      engagement += 1;
    }

    if (notification.tags && notification.tags.length > 0) {
      engagement += 1;
    }

    return Math.max(1, Math.min(5, engagement));
  }

  async handleSpecialNotifications(notification) {
    const handling = {
      escalated: false,
      broadcast: false,
      stored: true,
      actions: []
    };

    // Escalate critical errors
    if (notification.severity === 'error' && notification.analysis?.severity >= 4) {
      handling.escalated = true;
      handling.actions.push('escalate_to_admin');
    }

    // Broadcast system events
    if (notification.type === 'system' && notification.analysis?.criticality >= 3) {
      handling.broadcast = true;
      handling.actions.push('broadcast_to_all_sessions');
    }

    // Special handling for security warnings
    if (notification.category === 'security') {
      handling.escalated = true;
      handling.actions.push('security_review');
    }

    return handling;
  }

  generateSummary(input) {
    const payload = input.payload || {};
    const summary = {
      action: 'notification_received',
      type: payload.type || 'system',
      severity: payload.severity || 'info',
      category: payload.category || 'general',
      timestamp: new Date().toISOString()
    };

    if (payload.title) {
      summary.title = payload.title.substring(0, 50);
    }

    if (payload.message) {
      summary.message = payload.message.substring(0, 100);
    }

    return summary;
  }
}

// Execute the hook
if (require.main === module) {
  const hook = new NotificationHook();
  hook.run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(0); // Always exit successfully
  });
}

module.exports = NotificationHook;