import { ClaudeAgentCLI } from '../src/cli';

describe('ClaudeAgentCLI', () => {
  let cli: ClaudeAgentCLI;

  beforeEach(() => {
    cli = new ClaudeAgentCLI();
  });

  describe('constructor', () => {
    it('should create CLI instance with commander program', () => {
      expect(cli).toBeInstanceOf(ClaudeAgentCLI);
      expect(cli.getProgram()).toBeDefined();
      expect(cli.getProgram().name()).toBe('claude-agent');
    });

    it('should set program description and version', () => {
      const program = cli.getProgram();
      expect(program.description()).toBe('CLI for Claude Agent Manager');
      expect(program.version()).toBe('0.1.0');
    });
  });

  describe('registerCommands', () => {
    it('should register basic help command', () => {
      const program = cli.getProgram();
      const commands = program.commands;
      expect(commands).toHaveLength(1);
      expect(commands[0].name()).toBe('help');
      expect(commands[0].description()).toBe('Display help information');
    });
  });

  describe('run', () => {
    it('should handle errors gracefully for unknown commands', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

      try {
        // This will throw because the command doesn't exist
        await cli.run(['node', 'claude-agent', 'nonexistent-command']);
      } catch (error) {
        // Commander throws an error for unknown commands
        expect(error).toBeDefined();
      }

      // The error should be caught and handled by our CLI class
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should run successfully with valid help command', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock process.stdout.write to capture help output
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await expect(cli.run(['node', 'claude-agent', 'help'])).resolves.not.toThrow();

      stdoutSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});