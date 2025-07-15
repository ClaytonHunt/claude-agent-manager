import { AgentStatus, LogLevel, Agent, LogEntry } from './types';

/**
 * Utility functions for Claude Agent Manager
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidAgentStatus(status: string): status is AgentStatus {
  return ['idle', 'active', 'error', 'handoff', 'complete'].includes(status);
}

export function isValidLogLevel(level: string): level is LogLevel {
  return ['info', 'warn', 'error', 'debug'].includes(level);
}

export function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>
): LogEntry {
  return {
    id: generateId(),
    timestamp: new Date(),
    level,
    message,
    metadata,
  };
}

export function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    // Remove sensitive keys
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('secret')) {
      continue;
    }
    
    // Limit string length
    if (typeof value === 'string' && value.length > 10000) {
      sanitized[key] = value.substring(0, 10000) + '... (truncated)';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function getAgentHierarchy(agents: Agent[]): Map<string, Agent[]> {
  const hierarchy = new Map<string, Agent[]>();
  
  for (const agent of agents) {
    const parentId = agent.parentId || 'root';
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }
    hierarchy.get(parentId)!.push(agent);
  }
  
  return hierarchy;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function calculateUptime(agent: Agent): number {
  return Date.now() - agent.created.getTime();
}

export function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'idle': return '#6B7280'; // gray
    case 'active': return '#10B981'; // green
    case 'error': return '#EF4444'; // red
    case 'handoff': return '#F59E0B'; // yellow
    case 'complete': return '#8B5CF6'; // purple
    default: return '#6B7280';
  }
}

export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'info': return '#3B82F6'; // blue
    case 'warn': return '#F59E0B'; // yellow
    case 'error': return '#EF4444'; // red
    case 'debug': return '#6B7280'; // gray
    default: return '#6B7280';
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(attempt, delay * attempts);
        }
      }
    };
    
    attempt();
  });
}