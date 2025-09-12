import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['tests/webhook/pure-webhook.test.js'],
    exclude: ['node_modules/**'],
    isolate: true,
    reporters: ['verbose'],
    // No setupFiles - avoid database connections
  },
});