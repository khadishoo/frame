import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// В jsdom нет matchMedia — она нужна теме (prefers-color-scheme)
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
});

// В jsdom нет scrollIntoView (в браузерах есть всегда) — заглушка для списков со стрелками
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => {
  cleanup();
});
