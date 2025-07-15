// Jest setup file for CLI tests

// Mock chalk to avoid ESM issues in tests
jest.mock('chalk', () => ({
  red: (text: string) => `[ERROR] ${text}`,
  green: (text: string) => `[SUCCESS] ${text}`,
  yellow: (text: string) => `[WARN] ${text}`,
  blue: (text: string) => `[INFO] ${text}`,
  default: {
    red: (text: string) => `[ERROR] ${text}`,
    green: (text: string) => `[SUCCESS] ${text}`,
    yellow: (text: string) => `[WARN] ${text}`,
    blue: (text: string) => `[INFO] ${text}`,
  }
}));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
beforeEach(() => {
  process.exit = jest.fn() as any;
});

afterEach(() => {
  process.exit = originalExit;
  jest.clearAllMocks();
});