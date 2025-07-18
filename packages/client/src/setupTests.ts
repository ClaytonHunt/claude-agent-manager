// Setup file for Jest tests
import '@testing-library/jest-dom';

// Mock URL.createObjectURL for blob downloads
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance.memory for memory usage tests
Object.defineProperty(performance, 'memory', {
  configurable: true,
  enumerable: true,
  get: () => ({
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  }),
});

// Mock HTMLElement.prototype.scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));