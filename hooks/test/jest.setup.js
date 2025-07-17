// Jest setup file for hooks testing

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset console mocks
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn();
});

afterAll(() => {
  process.exit = originalExit;
});

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  unlinkSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
  readFileSync: jest.fn().mockReturnValue('{}')
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/home/user'),
  hostname: jest.fn().mockReturnValue('test-host'),
  platform: jest.fn().mockReturnValue('linux'),
  tmpdir: jest.fn().mockReturnValue('/tmp')
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => '/' + args.join('/'))
}));

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    get: jest.fn().mockResolvedValue({ status: 200, data: { health: 'ok' } })
  }))
}));

// Global test utilities
global.createMockInput = (overrides = {}) => {
  return {
    source_app: 'claude-code',
    session_id: 'test-session-123',
    hook_event_type: 'test',
    payload: {
      tool_name: 'TestTool',
      tool_input: { test: 'input' },
      command: 'test command',
      file_path: '/test/file.txt',
      working_directory: '/test',
      environment: { NODE_ENV: 'test' }
    },
    timestamp: Date.now(),
    chat: [],
    ...overrides
  };
};

global.createMockConfig = (overrides = {}) => {
  return {
    getAgentId: jest.fn().mockReturnValue('test-agent-123'),
    getSessionId: jest.fn().mockReturnValue('test-session-123'),
    getProjectPath: jest.fn().mockReturnValue('/test/project'),
    isSecurityEnabled: jest.fn().mockReturnValue(true),
    isSummarizationEnabled: jest.fn().mockReturnValue(true),
    server: {
      url: 'http://localhost:3000',
      timeout: 5000,
      retries: 3,
      retryDelay: 1000,
      retryDelayMultiplier: 2
    },
    logging: {
      level: 'info',
      directory: '/tmp/logs',
      maxFiles: 30,
      cleanupOnExit: false
    },
    archiving: {
      enabled: false,
      directory: '/tmp/archives'
    },
    ...overrides
  };
};

global.createMockLogger = (overrides = {}) => {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    logError: jest.fn(),
    logHookEvent: jest.fn(),
    logHttpRequest: jest.fn(),
    cleanup: jest.fn(),
    ...overrides
  };
};

global.createMockEventSender = (overrides = {}) => {
  return {
    sendEvent: jest.fn().mockResolvedValue({ success: true }),
    sendBatch: jest.fn().mockResolvedValue({ success: true }),
    testConnection: jest.fn().mockResolvedValue(true),
    getCircuitBreakerState: jest.fn().mockReturnValue({
      state: 'closed',
      failures: 0,
      lastFailureTime: null
    }),
    ...overrides
  };
};

// Helper to create readable streams for stdin mocking
global.createMockStdin = (data) => {
  const { Readable } = require('stream');
  return Readable.from([data]);
};

// Helper to wait for promises
global.waitForPromises = () => new Promise(resolve => setImmediate(resolve));

// Helper to advance timers
global.advanceTimers = (time) => {
  jest.advanceTimersByTime(time);
  return waitForPromises();
};

// Error matchers
expect.extend({
  toThrowWithMessage(received, expectedMessage) {
    let pass = false;
    let actualMessage = '';

    try {
      received();
    } catch (error) {
      actualMessage = error.message;
      pass = actualMessage.includes(expectedMessage);
    }

    return {
      pass,
      message: () =>
        pass
          ? `Expected function not to throw with message containing "${expectedMessage}"`
          : `Expected function to throw with message containing "${expectedMessage}", but got "${actualMessage}"`
    };
  }
});

// Async error matchers
expect.extend({
  async toRejectWithMessage(received, expectedMessage) {
    let pass = false;
    let actualMessage = '';

    try {
      await received;
    } catch (error) {
      actualMessage = error.message;
      pass = actualMessage.includes(expectedMessage);
    }

    return {
      pass,
      message: () =>
        pass
          ? `Expected promise not to reject with message containing "${expectedMessage}"`
          : `Expected promise to reject with message containing "${expectedMessage}", but got "${actualMessage}"`
    };
  }
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});