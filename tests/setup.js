import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

/* Charts size themselves from a measured element width, which jsdom reports as
   0 — every chart would render into a 0px box and assert nothing. Give layout a
   real width so the SVG geometry is exercised. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1200 });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1200 });
HTMLElement.prototype.getBoundingClientRect = function () {
  return { width: 1200, height: 400, top: 0, left: 0, right: 1200, bottom: 400, x: 0, y: 0, toJSON() {} };
};

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/* jsdom has no layout, so scrollTo and matchMedia are missing rather than inert. */
window.scrollTo = () => {};
window.matchMedia = window.matchMedia || ((q) => ({
  matches: false, media: q, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
}));

vi.spyOn(console, 'error');
