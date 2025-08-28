import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'stripe-webhook-tests',
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/webhook/webhook-setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: ['tests/webhook/**/*.test.js'],
    exclude: ['node_modules/**', 'dist/**'],
    reporter: ['verbose', 'json'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './tests/webhook/coverage',
      include: ['supabase/functions/stripe-webhook/**'],
      exclude: ['tests/**', 'node_modules/**']
    }
  },
  define: {
    global: 'globalThis',
  },
});