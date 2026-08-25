import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Alias '@' -> /src so imports stay stable if folders move later.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    // The book is generated at import time from a fixed seed; 1,200 cases plus
    // consolidation is a real amount of work for the first suite that touches it.
    testTimeout: 20000,
  },
});
