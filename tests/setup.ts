import { vi } from 'vitest';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.OUTPUT_DIR = './test-output';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
