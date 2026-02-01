import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Prefer PLAYWRIGHT_BASE_URL > staging default. .env.test BASE_URL is for local dev, not Playwright.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://develop--aimpactscanner.netlify.app';

export default defineConfig({
  testDir: './tests',
  testMatch: ['tier1-landing.spec.ts', 'tier2-auth.spec.ts', 'tier3-analysis.spec.ts', 'tier4-checkout.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: ['tier1-landing.spec.ts'],
    },
  ],
});
