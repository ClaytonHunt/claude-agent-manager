import { CLIConfig, CLIResult, DEFAULT_CONFIG } from '../../src/utils';

describe('CLIConfig', () => {
  it('should define configuration interface for CLI', () => {
    const config: CLIConfig = {
      serverUrl: 'http://localhost:3000',
      apiKey: 'test-api-key',
      timeout: 5000,
      verbose: true
    };

    expect(config.serverUrl).toBe('http://localhost:3000');
    expect(config.apiKey).toBe('test-api-key');
    expect(config.timeout).toBe(5000);
    expect(config.verbose).toBe(true);
  });

  it('should allow optional configuration properties', () => {
    const partialConfig: CLIConfig = {
      serverUrl: 'http://localhost:3000'
    };

    expect(partialConfig.serverUrl).toBe('http://localhost:3000');
    expect(partialConfig.apiKey).toBeUndefined();
    expect(partialConfig.timeout).toBeUndefined();
    expect(partialConfig.verbose).toBeUndefined();
  });

  it('should allow empty configuration', () => {
    const emptyConfig: CLIConfig = {};

    expect(emptyConfig.serverUrl).toBeUndefined();
    expect(emptyConfig.apiKey).toBeUndefined();
    expect(emptyConfig.timeout).toBeUndefined();
    expect(emptyConfig.verbose).toBeUndefined();
  });
});

describe('CLIResult', () => {
  it('should define successful result', () => {
    const successResult: CLIResult<string> = {
      success: true,
      data: 'operation completed'
    };

    expect(successResult.success).toBe(true);
    expect(successResult.data).toBe('operation completed');
    expect(successResult.error).toBeUndefined();
  });

  it('should define error result', () => {
    const errorResult: CLIResult = {
      success: false,
      error: 'Something went wrong'
    };

    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBe('Something went wrong');
    expect(errorResult.data).toBeUndefined();
  });

  it('should support generic data types', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const typedResult: CLIResult<TestData> = {
      success: true,
      data: { id: 1, name: 'test' }
    };

    expect(typedResult.data?.id).toBe(1);
    expect(typedResult.data?.name).toBe('test');
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should provide sensible defaults', () => {
    expect(DEFAULT_CONFIG.serverUrl).toBe('http://localhost:3000');
    expect(DEFAULT_CONFIG.timeout).toBe(30000);
    expect(DEFAULT_CONFIG.verbose).toBe(false);
  });

  it('should be a partial config allowing overrides', () => {
    const customConfig: CLIConfig = {
      ...DEFAULT_CONFIG,
      serverUrl: 'https://api.example.com',
      apiKey: 'custom-key'
    };

    expect(customConfig.serverUrl).toBe('https://api.example.com');
    expect(customConfig.apiKey).toBe('custom-key');
    expect(customConfig.timeout).toBe(30000); // From defaults
  });
});