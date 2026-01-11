import {
  Agent,
  LogEntry,
  ActivityEvent,
  ActivityEventType,
  TimelineOptions,
  generateId,
} from '@claude-agent-manager/shared';
import { AgentService } from './AgentService';
import { logger } from '../utils/logger';

/**
 * Service for transforming agent logs into activity timeline events
 */
export class ActivityTimelineService {
  constructor(private agentService: AgentService) {}

  /**
   * Get activity timeline for an agent
   */
  async getActivityTimeline(
    agentId: string,
    options: TimelineOptions = {}
  ): Promise<ActivityEvent[]> {
    const { limit = 50, offset = 0, types, startDate, endDate } = options;

    try {
      const agent = await this.agentService.getAgent(agentId);
      const events = this.transformLogsToEvents(agent);

      // Apply filters
      let filteredEvents = events;

      if (types && types.length > 0) {
        filteredEvents = filteredEvents.filter((e) => types.includes(e.type));
      }

      if (startDate) {
        filteredEvents = filteredEvents.filter(
          (e) => new Date(e.timestamp) >= startDate
        );
      }

      if (endDate) {
        filteredEvents = filteredEvents.filter(
          (e) => new Date(e.timestamp) <= endDate
        );
      }

      // Sort by timestamp descending (most recent first)
      filteredEvents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      return filteredEvents.slice(offset, offset + limit);
    } catch (error) {
      logger.error(`Failed to get activity timeline for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent activity for an agent
   */
  async getRecentActivity(
    agentId: string,
    limit: number = 10
  ): Promise<ActivityEvent[]> {
    return this.getActivityTimeline(agentId, { limit });
  }

  /**
   * Transform agent logs into activity events
   */
  private transformLogsToEvents(agent: Agent): ActivityEvent[] {
    const events: ActivityEvent[] = [];
    const toolStartTimes = new Map<string, Date>();

    for (const log of agent.logs) {
      const event = this.logToEvent(agent.id, log, toolStartTimes);
      if (event) {
        events.push(event);
      }
    }

    // Add agent creation event
    events.push({
      id: generateId(),
      type: 'agent_started',
      timestamp: agent.created,
      agentId: agent.id,
      title: 'Agent Created',
      description: `Agent registered for project: ${agent.projectPath}`,
      status: 'success',
      metadata: {
        projectPath: agent.projectPath,
        parentId: agent.parentId,
      },
    });

    return events;
  }

  /**
   * Convert a log entry to an activity event
   */
  private logToEvent(
    agentId: string,
    log: LogEntry,
    toolStartTimes: Map<string, Date>
  ): ActivityEvent | null {
    const metadata = log.metadata || {};
    const message = log.message.toLowerCase();

    // Tool started
    if (message.includes('tool started') || metadata.event === 'tool_started') {
      const toolName = metadata.tool || this.extractToolName(log.message);
      toolStartTimes.set(toolName, log.timestamp);

      return {
        id: log.id,
        type: 'tool_started',
        timestamp: log.timestamp,
        agentId,
        title: `Tool Started: ${toolName}`,
        description: log.message,
        status: 'pending',
        metadata: { toolName, ...metadata },
      };
    }

    // Tool completed
    if (message.includes('tool completed') || metadata.event === 'tool_completed') {
      const toolName = metadata.tool || this.extractToolName(log.message);
      const startTime = toolStartTimes.get(toolName);
      const duration = startTime
        ? new Date(log.timestamp).getTime() - new Date(startTime).getTime()
        : metadata.duration;

      return {
        id: log.id,
        type: 'tool_completed',
        timestamp: log.timestamp,
        agentId,
        title: `Tool Completed: ${toolName}`,
        description: log.message,
        duration,
        status: metadata.success === false ? 'error' : 'success',
        metadata: { toolName, ...metadata },
      };
    }

    // Status change
    if (message.includes('status changed') || metadata.event === 'status_change') {
      const newStatus = metadata.status || this.extractStatus(log.message);

      return {
        id: log.id,
        type: 'status_change',
        timestamp: log.timestamp,
        agentId,
        title: `Status Changed: ${newStatus}`,
        description: log.message,
        status: 'info',
        metadata: { newStatus, ...metadata },
      };
    }

    // Handoff
    if (message.includes('handoff') || message.includes('handed off')) {
      return {
        id: log.id,
        type: 'handoff',
        timestamp: log.timestamp,
        agentId,
        title: 'Agent Handoff',
        description: log.message,
        status: 'info',
        metadata,
      };
    }

    // Context update
    if (message.includes('context updated') || metadata.event === 'context_update') {
      return {
        id: log.id,
        type: 'context_update',
        timestamp: log.timestamp,
        agentId,
        title: 'Context Updated',
        description: log.message,
        status: 'info',
        metadata,
      };
    }

    // Error logs
    if (log.level === 'error') {
      return {
        id: log.id,
        type: 'error',
        timestamp: log.timestamp,
        agentId,
        title: 'Error',
        description: log.message,
        status: 'error',
        metadata,
      };
    }

    // Generic log entry
    return {
      id: log.id,
      type: 'log',
      timestamp: log.timestamp,
      agentId,
      title: this.getLogTitle(log),
      description: log.message,
      status: log.level === 'warn' ? 'error' : 'info',
      metadata,
    };
  }

  /**
   * Extract tool name from message
   */
  private extractToolName(message: string): string {
    // Try to extract tool name from common patterns
    const patterns = [
      /tool[:\s]+['"]?(\w+)['"]?/i,
      /(\w+)\s+tool/i,
      /executing\s+['"]?(\w+)['"]?/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'Unknown Tool';
  }

  /**
   * Extract status from message
   */
  private extractStatus(message: string): string {
    const statuses = ['idle', 'active', 'error', 'handoff', 'complete'];
    for (const status of statuses) {
      if (message.toLowerCase().includes(status)) {
        return status;
      }
    }
    return 'unknown';
  }

  /**
   * Get a suitable title for a log entry
   */
  private getLogTitle(log: LogEntry): string {
    const message = log.message;

    // Truncate to first sentence or 50 chars
    const firstSentence = message.split(/[.!?]/)[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }

    return message.substring(0, 47) + '...';
  }

  /**
   * Group activity events by session or time period
   */
  groupActivityBySession(
    events: ActivityEvent[]
  ): Map<string, ActivityEvent[]> {
    const groups = new Map<string, ActivityEvent[]>();
    const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

    let currentSessionId = generateId();
    let lastEventTime: Date | null = null;

    // Sort events by timestamp ascending for grouping
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const event of sortedEvents) {
      const eventTime = new Date(event.timestamp);

      // Start new session if gap is too large
      if (
        lastEventTime &&
        eventTime.getTime() - lastEventTime.getTime() > SESSION_GAP_MS
      ) {
        currentSessionId = generateId();
      }

      if (!groups.has(currentSessionId)) {
        groups.set(currentSessionId, []);
      }
      groups.get(currentSessionId)!.push(event);
      lastEventTime = eventTime;
    }

    return groups;
  }

  /**
   * Calculate tool durations by pairing start/complete events
   */
  calculateToolDurations(events: ActivityEvent[]): ActivityEvent[] {
    const startEvents = new Map<string, ActivityEvent>();
    const result: ActivityEvent[] = [];

    for (const event of events) {
      if (event.type === 'tool_started') {
        const toolName = event.metadata?.toolName;
        if (toolName) {
          startEvents.set(toolName, event);
        }
        result.push(event);
      } else if (event.type === 'tool_completed') {
        const toolName = event.metadata?.toolName;
        const startEvent = toolName ? startEvents.get(toolName) : undefined;

        if (startEvent && !event.duration) {
          const duration =
            new Date(event.timestamp).getTime() -
            new Date(startEvent.timestamp).getTime();
          result.push({ ...event, duration });
        } else {
          result.push(event);
        }
      } else {
        result.push(event);
      }
    }

    return result;
  }

  /**
   * Get activity summary for an agent
   */
  async getActivitySummary(agentId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<ActivityEventType, number>;
    errorCount: number;
    lastActivity: Date | null;
  }> {
    const events = await this.getActivityTimeline(agentId, { limit: 1000 });

    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<ActivityEventType, number>
    );

    const errorCount = events.filter((e) => e.status === 'error').length;
    const lastActivity =
      events.length > 0 ? new Date(events[0].timestamp) : null;

    return {
      totalEvents: events.length,
      eventsByType,
      errorCount,
      lastActivity,
    };
  }
}
