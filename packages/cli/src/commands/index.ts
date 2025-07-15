import { CLIConfig, CLIResult } from '../utils/index.js';

/**
 * Base interface for all CLI commands
 */
export interface BaseCommand {
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command aliases */
  aliases?: string[];
  /** Execute the command */
  execute(config: CLIConfig, ...args: unknown[]): Promise<CLIResult>;
}

/**
 * Command execution context
 */
export interface CommandContext {
  config: CLIConfig;
  verbose: boolean;
  args: string[];
}

/**
 * Command registration helper
 */
export interface CommandRegistration {
  command: BaseCommand;
  options?: CommandOption[];
  arguments?: CommandArgument[];
}

/**
 * Command option definition
 */
export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: unknown;
}

/**
 * Command argument definition
 */
export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
}