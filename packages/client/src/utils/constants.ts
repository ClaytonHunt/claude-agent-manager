import { ClientConfig, NavItem } from '@/types';

// Environment configuration
export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

// Default client configuration
export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  serverUrl: API_BASE_URL,
  wsUrl: WS_URL,
  reconnectInterval: 3000, // 3 seconds
  maxReconnectAttempts: 10,
};

// WebSocket configuration
export const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const WS_RECONNECT_DELAY = 3000; // 3 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

// UI constants
export const SIDEBAR_WIDTH = 240;
export const HEADER_HEIGHT = 64;
export const MOBILE_BREAKPOINT = 768;

// Data refresh intervals
export const AGENT_REFRESH_INTERVAL = 5000; // 5 seconds
export const LOG_REFRESH_INTERVAL = 2000; // 2 seconds
export const STATS_REFRESH_INTERVAL = 10000; // 10 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Log viewer
export const DEFAULT_LOG_LINES = 100;
export const MAX_LOG_LINES = 1000;

// Agent status colors
export const STATUS_COLORS = {
  idle: 'gray',
  active: 'success',
  error: 'error',
  handoff: 'warning',
  complete: 'primary',
} as const;

// Agent status labels
export const STATUS_LABELS = {
  idle: 'Idle',
  active: 'Active',
  error: 'Error',
  handoff: 'Handoff',
  complete: 'Complete',
} as const;

// Log level colors
export const LOG_LEVEL_COLORS = {
  debug: 'gray',
  info: 'primary',
  warn: 'warning',
  error: 'error',
} as const;

// Navigation items
export const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    exact: true,
  },
  {
    path: '/agents',
    label: 'Agents',
    icon: 'Bot',
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: 'FolderOpen',
  },
  {
    path: '/logs',
    label: 'Logs',
    icon: 'FileText',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: 'BarChart3',
  },
];

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'cam_theme',
  SIDEBAR_COLLAPSED: 'cam_sidebar_collapsed',
  DASHBOARD_VIEW: 'cam_dashboard_view',
  LOG_FILTERS: 'cam_log_filters',
  AGENT_FILTERS: 'cam_agent_filters',
  RECENT_PROJECTS: 'cam_recent_projects',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  WEBSOCKET_ERROR: 'WebSocket connection failed. Real-time updates unavailable.',
  AGENT_NOT_FOUND: 'Agent not found.',
  INVALID_INPUT: 'Invalid input provided.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  AGENT_CREATED: 'Agent created successfully.',
  AGENT_UPDATED: 'Agent updated successfully.',
  AGENT_DELETED: 'Agent deleted successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  DATA_EXPORTED: 'Data exported successfully.',
} as const;

// Chart colors for analytics
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
];

// Date format patterns
export const DATE_FORMATS = {
  SHORT: 'MMM d',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMM d, yyyy HH:mm',
  TIME_ONLY: 'HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SIDEBAR: 'cmd+b',
  SEARCH: 'cmd+k',
  REFRESH: 'cmd+r',
  NEW_AGENT: 'cmd+n',
  SETTINGS: 'cmd+comma',
} as const;

// Feature flags (for gradual rollout)
export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: true,
  DARK_MODE_ENABLED: true,
  EXPORT_ENABLED: true,
  REAL_TIME_LOGS: true,
  AGENT_HIERARCHY: true,
} as const;