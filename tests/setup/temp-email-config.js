// temp-email-config.js - Configuration for temporary email testing
export const TEMP_EMAIL_CONFIG = {
  // Primary service configuration
  primary: {
    service: '10minute.com',
    baseUrl: 'https://10minute.com',
    emailSelector: '#mailAddress',
    inboxSelector: '.mail-item, .email-item, .message-item',
    timeout: 60000,
    pollInterval: 2000
  },
  
  // Fallback services
  fallbacks: [
    {
      service: 'temp-mail.org',
      baseUrl: 'https://temp-mail.org',
      emailSelector: '#mail',
      inboxSelector: '.mail',
      timeout: 45000,
      pollInterval: 3000
    },
    {
      service: 'tempmail.lol',
      baseUrl: 'https://tempmail.lol',
      emailSelector: '.email-address',
      inboxSelector: '.email',
      timeout: 30000,
      pollInterval: 2500
    }
  ],
  
  // Magic link patterns
  magicLinkPatterns: [
    /https?:\/\/[^\s<>"]+confirm[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]+token[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]+auth[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]+verify[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]+magic[^\s<>"]*/gi
  ],
  
  // Link selectors to try
  linkSelectors: [
    'a[href*="supabase"]',
    'a[href*="confirm"]',
    'a[href*="token"]',
    'a[href*="auth"]',
    'a[href*="magic"]',
    'a[href*="login"]',
    'a[href*="verify"]'
  ],
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayBetweenAttempts: 5000,
    fallbackOnFailure: true
  },
  
  // Test environment settings
  testMode: {
    skipEmailGeneration: process.env.SKIP_EMAIL_TESTS === 'true',
    useMockEmails: process.env.USE_MOCK_EMAILS === 'true',
    debugLogging: process.env.DEBUG_EMAIL_TESTS === 'true'
  }
};

// Mock email configuration for CI/test environments
export const MOCK_EMAIL_CONFIG = {
  domain: 'test.example.com',
  patterns: [
    'user-{timestamp}@test.example.com',
    'test-{random}@test.example.com',
    'e2e-{counter}@test.example.com'
  ],
  magicLinkTemplate: 'http://localhost:5174/auth/confirm?token=mock-token-{id}&type=magiclink'
};

// Validation patterns
export const EMAIL_VALIDATION = {
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  minLength: 5,
  maxLength: 254,
  allowedDomains: ['10minute.com', 'temp-mail.org', 'tempmail.lol', 'test.example.com'],
  blockedDomains: ['example.com', 'test.com', 'invalid.com']
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  emailGeneration: 15000, // 15 seconds max
  magicLinkWait: 90000,   // 90 seconds max
  authProcess: 10000,     // 10 seconds max
  totalFlow: 180000       // 3 minutes max for complete flow
};

// CI/CD specific configuration
export const CI_CONFIG = {
  // Reduce timeouts in CI
  timeoutMultiplier: process.env.CI ? 0.7 : 1.0,
  
  // Retry settings for CI
  retries: process.env.CI ? 2 : 1,
  
  // Parallel execution
  maxParallel: process.env.CI ? 2 : 4,
  
  // Screenshot and video settings
  captureOnFailure: true,
  captureOnSuccess: process.env.CI ? false : true
};