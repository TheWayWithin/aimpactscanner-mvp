// Vitest config for pure logic tests that need no database or network.
// The main vitest.config.js global setup requires a live Supabase connection,
// which no longer exists for local runs (staging DB removed July 2026).
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/pillar-display.test.js'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  }
})
