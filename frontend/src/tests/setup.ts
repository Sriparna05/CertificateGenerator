import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(cleanup);

// Mock global browser APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-object-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock react-dom/client for React 18+ compatibility with @testing-library/react-hooks
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

// Mock react-dom for older render calls
vi.mock('react-dom', () => ({
  render: vi.fn(),
  unmountComponentAtNode: vi.fn(),
}));