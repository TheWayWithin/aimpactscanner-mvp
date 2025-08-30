// Comprehensive Playwright Configuration for AImpactScanner Test Suite
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/playwright',
  
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
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://app.aimpactscanner.com',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all tests */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Global test timeout */
  timeout: 60000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'comprehensive-test-suite.spec.js',
        'messaging-clarity-tests.spec.js',
        'account-fixes-tests.spec.js'
      ]
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: [
        'comprehensive-test-suite.spec.js',
        'messaging-clarity-tests.spec.js'
      ]
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: [
        'comprehensive-test-suite.spec.js'
      ]
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: [
        'comprehensive-test-suite.spec.js'
      ]
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: [
        'comprehensive-test-suite.spec.js'
      ]
    },

    /* Recent Features Testing - High Priority */
    {
      name: 'recent-features',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'messaging-clarity-tests.spec.js',
        'llmstxt-integration-tests.spec.js',
        'account-fixes-tests.spec.js'
      ],
      metadata: {
        priority: 'high',
        category: 'recent-features'
      }
    },

    /* Regression Testing */
    {
      name: 'regression',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'comprehensive-test-suite.spec.js'
      ],
      metadata: {
        priority: 'critical', 
        category: 'regression'
      }
    },

    /* LLMs.txt Integration Testing */
    {
      name: 'llmstxt-integration',
      use: { 
        ...devices['Desktop Chrome'],
        // Extended timeout for external service calls
        actionTimeout: 20000
      },
      testMatch: [
        'llmstxt-integration-tests.spec.js'
      ],
      metadata: {
        priority: 'high',
        category: 'integration'
      }
    }
  ],

  /* Custom test configurations */
  globalSetup: require.resolve('./tests/setup/global-setup.js'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.js'),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

/* Environment-specific configurations */
if (process.env.NODE_ENV === 'production') {
  // Production testing - more conservative settings
  module.exports.timeout = 90000; // Longer timeout for production
  module.exports.retries = 3; // More retries for production
  module.exports.use.actionTimeout = 20000;
}

if (process.env.NODE_ENV === 'development') {
  // Development testing - faster feedback
  module.exports.timeout = 45000;
  module.exports.retries = 1;
  module.exports.fullyParallel = false; // Easier debugging
}