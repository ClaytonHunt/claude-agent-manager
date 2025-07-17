/**
 * Core types for Claude Agent Manager
 */

export type AgentStatus = 'idle' | 'active' | 'error' | 'handoff' | 'complete';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

export interface Agent {
  id: string;
  parentId?: string;
  projectPath: string;
  status: AgentStatus;
  created: Date;
  lastActivity: Date;
  context: Record<string, any>;
  logs: LogEntry[];
  tags: string[];
}

export interface AgentEvent {
  type: 'registration' | 'status_change' | 'log' | 'context_update' | 'handoff';
  agentId: string;
  timestamp: Date;
  data: any;
}

export interface HandoffContext {
  fromAgentId: string;
  toAgentId: string;
  context: Record<string, any>;
  timestamp: Date;
  reason: string;
}

export interface WebSocketMessage {
  type: 'agent_update' | 'log_entry' | 'handoff' | 'ping' | 'pong' | 'tool_started' | 'tool_completed' | 'agent_started' | 'agent_stopped' | 'agent_notification' | 'agent_created' | 'agent_deleted';
  data: any;
  timestamp: Date;
}

export interface AgentRegistration {
  id: string;
  projectPath: string;
  parentId?: string;
  context?: Record<string, any>;
  tags?: string[];
}

export interface AgentQuery {
  projectPath?: string;
  status?: AgentStatus;
  parentId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ServerConfig {
  port: number;
  redisUrl: string;
  logLevel: LogLevel;
  retentionDays: number;
  maxAgents: number;
}

export interface ClientConfig {
  serverUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

/**
 * Hook system types
 */
export interface HookEvent {
  type: string;
  agentId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface HookConfig {
  events: string[];
  serverUrl: string;
  authentication?: {
    type: 'bearer' | 'apikey';
    token: string;
  };
}

/**
 * Context engineering types
 */
export interface ContextDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created: Date;
  updated: Date;
  agentId: string;
}

export interface ContextLink {
  fromDocumentId: string;
  toDocumentId: string;
  relationship: 'references' | 'depends_on' | 'extends' | 'contradicts';
  strength: number; // 0-1
}

/**
 * Error types
 */
export class AgentManagerError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AgentManagerError';
  }
}

export class ValidationError extends AgentManagerError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AgentManagerError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AgentManagerError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}