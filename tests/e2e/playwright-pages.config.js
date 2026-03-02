import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'cross-browser-pages.spec.js',
  fullyParallel: true,
  retries: 0,
  reporter: 'line',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4177',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
