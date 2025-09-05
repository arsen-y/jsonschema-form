import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);
afterEach(() => cleanup());

// Мок для MUI/JS DOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
