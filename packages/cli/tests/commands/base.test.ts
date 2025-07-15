import { BaseCommand, CommandContext } from '../../src/commands';
import { CLIConfig } from '../../src/utils';

describe('BaseCommand Interface', () => {
  it('should define the contract for CLI commands', async () => {
    const mockConfig: CLIConfig = {
      serverUrl: 'http://localhost:3000',
      verbose: false
    };

    const mockCommand: BaseCommand = {
      name: 'test',
      description: 'Test command',
      execute: jest.fn().mockResolvedValue({ success: true })
    };

    expect(mockCommand.name).toBe('test');
    expect(mockCommand.description).toBe('Test command');
    expect(typeof mockCommand.execute).toBe('function');

    const result = await mockCommand.execute(mockConfig);
    expect(result.success).toBe(true);
  });

  it('should support optional aliases', () => {
    const commandWithAliases: BaseCommand = {
      name: 'test-command',
      description: 'A test command',
      aliases: ['t', 'test'],
      execute: jest.fn().mockResolvedValue({ success: true })
    };

    expect(commandWithAliases.aliases).toEqual(['t', 'test']);
  });

  it('should require commands to have name, description, and execute method', () => {
    const createCommand = (partial: Partial<BaseCommand>): BaseCommand => {
      return {
        name: partial.name || 'default',
        description: partial.description || 'Default command',
        execute: partial.execute || jest.fn().mockResolvedValue({ success: true })
      };
    };

    const command = createCommand({
      name: 'test-command',
      description: 'A test command'
    });

    expect(command.name).toBe('test-command');
    expect(command.description).toBe('A test command');
    expect(command.execute).toBeDefined();
  });
});

describe('CommandContext Interface', () => {
  it('should define command execution context', () => {
    const context: CommandContext = {
      config: {
        serverUrl: 'http://localhost:3000',
        verbose: true
      },
      verbose: true,
      args: ['arg1', 'arg2']
    };

    expect(context.config.serverUrl).toBe('http://localhost:3000');
    expect(context.verbose).toBe(true);
    expect(context.args).toEqual(['arg1', 'arg2']);
  });
});