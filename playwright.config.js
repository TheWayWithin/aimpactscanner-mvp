// playwright.config.js - Playwright Configuration for Phase 2 Testing
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables for OAuth authentication
dotenv.config({ path: '.env.test' });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['line'],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 10000,
    
    /* Timeout for navigation actions */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup projects - authenticate and save state (run once manually in headed mode)
    {
      name: 'setup-google-auth',
      testMatch: /auth\.setup\.js/,
      testDir: './tests/setup',
    },
    {
      name: 'setup-github-auth',
      testMatch: /auth\.setup\.js/,
      testDir: './tests/setup',
    },

    // Test projects with OAuth authentication - use saved auth state
    {
      name: 'chromium-google-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/setup/.auth/google-user1.json',
      },
      dependencies: ['setup-google-auth'],
      testMatch: ['**/oauth-authentication.spec.js'],
    },
    {
      name: 'chromium-github-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/setup/.auth/github-user1.json',
      },
      dependencies: ['setup-github-auth'],
      testMatch: ['**/oauth-authentication.spec.js'],
    },

    // Standard test projects (no auth required)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true, // Enable touch support for mobile tests
      },
      testMatch: ['**/phase2-auth-pricing.spec.js', '**/tier-selector-mobile.spec.js'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        hasTouch: true, // Enable touch support for mobile tests
      },
      testMatch: ['**/phase2-auth-pricing.spec.js', '**/tier-selector-mobile.spec.js'],
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },
    
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },

    /* Tier Testing Configuration */
    {
      name: 'tier-testing',
      use: { 
        ...devices['Desktop Chrome'],
        // Extended timeout for email processing
        actionTimeout: 15000,
        navigationTimeout: 45000,
        // Additional context for tier testing
        extraHTTPHeaders: {
          'X-Test-Mode': 'tier-testing'
        }
      },
      testMatch: ['**/tier-signup-flows.spec.js'],
    },
  ],

  /* Global setup and teardown */
  globalSetup: './tests/setup/global-setup.js',
  globalTeardown: './tests/setup/global-teardown.js',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
    },
  },
  
  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds per test
  
  /* Global test timeout */
  globalTimeout: 60 * 60 * 1000, // 1 hour for all tests
  
  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds for expect assertions
  },
});