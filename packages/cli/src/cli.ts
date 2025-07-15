import { Command } from 'commander';
import chalk from 'chalk';

/**
 * Main CLI class for Claude Agent Manager
 * Provides command-line interface for managing Claude agents
 */
export class ClaudeAgentCLI {
  private readonly program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  /**
   * Configure the main program with metadata
   */
  private setupProgram(): void {
    this.program
      .name('claude-agent')
      .description('CLI for Claude Agent Manager')
      .version('0.1.0');
  }

  /**
   * Register all available commands
   */
  private registerCommands(): void {
    this.registerHelpCommand();
    // Additional commands will be added here
  }

  /**
   * Register the help command
   */
  private registerHelpCommand(): void {
    this.program
      .command('help')
      .description('Display help information')
      .action(() => {
        this.program.outputHelp();
      });
  }

  /**
   * Run the CLI with provided arguments
   * @param argv Command line arguments (defaults to process.argv)
   */
  public async run(argv?: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red('Error:'), errorMessage);
      process.exit(1);
    }
  }

  /**
   * Get the commander program instance for testing
   * @returns The commander program instance
   */
  public getProgram(): Command {
    return this.program;
  }
}