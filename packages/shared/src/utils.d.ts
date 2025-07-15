import { AgentStatus, LogLevel, Agent, LogEntry } from './types';
/**
 * Utility functions for Claude Agent Manager
 */
export declare function generateId(): string;
export declare function isValidAgentStatus(status: string): status is AgentStatus;
export declare function isValidLogLevel(level: string): level is LogLevel;
export declare function createLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry;
export declare function sanitizeContext(context: Record<string, any>): Record<string, any>;
export declare function getAgentHierarchy(agents: Agent[]): Map<string, Agent[]>;
export declare function formatDuration(ms: number): string;
export declare function calculateUptime(agent: Agent): number;
export declare function getStatusColor(status: AgentStatus): string;
export declare function getLogLevelColor(level: LogLevel): string;
export declare function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare function retry<T>(fn: () => Promise<T>, maxAttempts: number, delay?: number): Promise<T>;
