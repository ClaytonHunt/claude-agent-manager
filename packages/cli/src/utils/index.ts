/**
 * Configuration interface for CLI operations
 */
export interface CLIConfig {
  /** Server URL for the Claude Agent Manager API */
  serverUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Timeout for API requests in milliseconds */
  timeout?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Common result type for CLI operations
 */
export interface CLIResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<CLIConfig> = {
  serverUrl: 'http://localhost:3000',
  timeout: 30000,
  verbose: false,
};