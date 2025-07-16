// Re-export shared types
export * from '@claude-agent-manager/shared';

// Client-specific types
export interface ClientConfig {
  serverUrl: string;
  wsUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectCount: number;
  lastConnected: Date | null;
}

export interface AgentFilters {
  status?: string[];
  projectPath?: string;
  tags?: string[];
  search?: string;
}

export interface AgentStats {
  total: number;
  idle: number;
  active: number;
  error: number;
  handoff: number;
  complete: number;
}

export interface ProjectStats {
  projectPath: string;
  totalAgents: number;
  activeAgents: number;
  lastActivity: Date;
  errorCount: number;
}

export interface LogViewerState {
  autoScroll: boolean;
  filter: {
    level?: string[];
    search?: string;
    agent?: string;
  };
  maxLines: number;
}

export interface DashboardView {
  layout: 'grid' | 'list';
  sortBy: 'created' | 'lastActivity' | 'status' | 'projectPath';
  sortOrder: 'asc' | 'desc';
  showInactive: boolean;
}

// Navigation and routing types
export interface NavItem {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  children?: NavItem[];
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventId?: string;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket message types for client
export interface ClientWebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'pong';
  data: any;
  timestamp?: Date;
}

export interface SubscriptionChannels {
  agents: string[];
  projects: string[];
  global: boolean;
}

// Real-time update types
export interface RealtimeUpdate<T = any> {
  type: 'add' | 'update' | 'delete';
  entity: string;
  data: T;
  timestamp: Date;
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  updateCount: number;
  memoryUsage?: number;
  wsLatency?: number;
}