# Claude Agent Manager CLI

Command-line interface for managing Claude Code agents and subagents.

## Installation

```bash
npm install -g @claude-agent-manager/cli
```

Or run directly with npx:

```bash
npx @claude-agent-manager/cli
```

## Usage

```bash
claude-agent <command> [options]
```

### Available Commands

- `help` - Display help information

### Global Options

- `--version` - Show version number
- `--help` - Show help

## Development

### Setup

```bash
npm install
npm run build
```

### Testing

```bash
npm test
npm run test:watch
```

### Building

```bash
npm run build
```

## Architecture

The CLI is built using:

- **Commander.js** - Command-line framework
- **TypeScript** - Type safety and development experience
- **Chalk** - Terminal colors and styling
- **Jest** - Testing framework

### Project Structure

```
src/
├── cli.ts           # Main CLI class
├── bin/             # Executable entry points
├── commands/        # Command implementations
├── utils/           # Utility functions and types
└── index.ts         # Package exports

tests/
├── cli.test.ts      # Main CLI tests
├── commands/        # Command tests
├── utils/           # Utility tests
└── setup.ts         # Test setup
```

## Contributing

1. Follow TypeScript strict mode
2. Write tests for all new features
3. Use TDD (Test-Driven Development)
4. Follow existing code patterns
5. Update documentation as needed