// tier-test-config.js - Configuration for Tier System Testing
// Centralized configuration for all tier-related test scenarios

/**
 * TIER TESTING CONFIGURATION
 * 
 * This configuration file provides all settings, test data, and utilities
 * needed for comprehensive tier system testing including email verification,
 * payment flows, and database validation.
 */

// Environment Configuration
export const TIER_TEST_CONFIG = {
  // Application URLs
  BASE_URL: 'http://localhost:5173',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  
  // Stripe Configuration (Test Mode)
  STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  STRIPE_COFFEE_PRICE_ID: process.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_test_coffee',
  STRIPE_TEST_MODE: true,
  
  // Testing Timeouts
  EMAIL_TIMEOUT: 120000, // 2 minutes for email delivery
  PAYMENT_TIMEOUT: 60000, // 1 minute for payment processing
  DB_TIMEOUT: 15000, // 15 seconds for database operations
  ANIMATION_WAIT: 2000, // UI animation wait time
  MAGIC_LINK_TIMEOUT: 90000, // 1.5 minutes for magic link processing
  
  // Test Behavior
  CLEANUP_AFTER_TESTS: true,
  SCREENSHOT_ON_FAILURE: true,
  VERBOSE_LOGGING: true,
  RETRY_ATTEMPTS: 3,
};

// Tier Definitions and Test Data
export const TIER_DEFINITIONS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    displayName: 'Free Tier',
    price: '$0',
    priceValue: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      '1 Analysis/Month',
      'Basic Framework Scoring',
      '15-Second Analysis',
      'MASTERY-AI Framework Access',
      'Community Support'
    ],
    limits: {
      analysesPerMonth: 1,
      pdfReports: false,
      apiAccess: false,
      prioritySupport: false,
    },
    expectedDbTier: 'FREE',
    requiresPayment: false,
    requiresEmailVerification: true,
    testSelectors: {
      signupButton: 'button:has-text("Start Free Trial"), button:has-text("Current Plan")',
      tierCard: ':text("Free"):near(:text("$0"))',
      priceDisplay: ':text("$0")',
      featuresList: 'text=Basic recommendations, text=Phase A factors',
    }
  },
  
  COFFEE: {
    id: 'COFFEE',
    name: 'Coffee',
    displayName: 'Coffee Tier',
    price: '$4.99',
    priceValue: 4.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      '10 Analyses/Month',
      'Framework Compliance Reports',
      'PDF Report Generation',
      'Priority Framework Updates',
      'Email Support'
    ],
    limits: {
      analysesPerMonth: 10,
      pdfReports: true,
      apiAccess: false,
      prioritySupport: false,
    },
    expectedDbTier: 'COFFEE',
    requiresPayment: true,
    requiresEmailVerification: true,
    stripePriceId: process.env.VITE_STRIPE_COFFEE_PRICE_ID,
    testSelectors: {
      signupButton: 'button:has-text("Buy Me a Coffee"), button:has-text("Choose Coffee Plan")',
      tierCard: ':text("☕ Coffee"):near(:text("$4.95"))',
      priceDisplay: ':text("$4.95")',
      featuresList: 'text=Unlimited Phase A analyses, text=Professional PDF reports',
    }
  },
  
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    displayName: 'Growth',
    price: '$29.99',
    priceValue: 29.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Unlimited Analyses',
      'Advanced Competitive Analysis',
      'API Access',
      'Custom Reporting',
      'Priority Support'
    ],
    limits: {
      analysesPerMonth: -1, // Unlimited
      pdfReports: true,
      apiAccess: true,
      prioritySupport: true,
    },
    comingSoon: true,
    waitlistAvailable: true,
    expectedDbTier: 'GROWTH',
    requiresPayment: true,
    requiresEmailVerification: true,
    testSelectors: {
      tierCard: '.tier-growth, [data-tier="GROWTH"], .tier-card:has-text("Growth")',
      comingSoonIndicator: 'text=Coming Soon, .coming-soon, [data-coming-soon="true"]',
      waitlistButton: 'button:has-text("Join Waitlist"), .waitlist-button',
      priceDisplay: 'text=$29.99',
    }
  },
  
  SCALE: {
    id: 'SCALE',
    name: 'Scale',
    displayName: 'Scale',
    price: '$99.99',
    priceValue: 99.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Enterprise-Grade Analysis',
      'White-Label Solutions',
      'Custom Framework Development',
      'Dedicated Success Manager',
      'SLA Guarantees'
    ],
    limits: {
      analysesPerMonth: -1, // Unlimited
      pdfReports: true,
      apiAccess: true,
      prioritySupport: true,
      enterpriseFeatures: true,
    },
    comingSoon: true,
    contactRequired: true,
    expectedDbTier: 'SCALE',
    requiresPayment: true,
    requiresEmailVerification: true,
    testSelectors: {
      tierCard: '.tier-scale, [data-tier="SCALE"], .tier-card:has-text("Scale")',
      comingSoonIndicator: 'text=Coming Soon, .coming-soon, [data-coming-soon="true"]',
      contactButton: 'button:has-text("Contact Us"), button:has-text("Get in Touch")',
      priceDisplay: 'text=$99.99',
    }
  }
};

// Test User Patterns for Email Generation
export const TEST_USER_PATTERNS = {
  FREE_USER: {
    namePrefix: 'free-test',
    expectedFlow: ['signup', 'email-verification', 'dashboard'],
    timeoutBehavior: 'graceful',
  },
  COFFEE_USER: {
    namePrefix: 'coffee-test',
    expectedFlow: ['signup', 'email-verification', 'payment', 'subscription-active'],
    timeoutBehavior: 'retry',
  },
  GROWTH_USER: {
    namePrefix: 'growth-test',
    expectedFlow: ['waitlist-signup', 'confirmation'],
    timeoutBehavior: 'graceful',
  },
  SCALE_USER: {
    namePrefix: 'scale-test',
    expectedFlow: ['contact-form', 'lead-capture'],
    timeoutBehavior: 'graceful',
  }
};

// Email Service Configuration
export const EMAIL_CONFIG = {
  PRIMARY_SERVICE: '10minute.com',
  FALLBACK_SERVICES: [
    'temp-mail.org',
    'tempmail.lol', 
    'guerrillamail.com'
  ],
  SELECTORS: {
    '10minute.com': {
      emailDisplay: '#mailAddress',
      inboxContainer: '.mail-list',
      messageItem: '.mail-item',
    },
    'temp-mail.org': {
      emailDisplay: '#mail',
      inboxContainer: '.inbox',
      messageItem: '.message',
    },
    'tempmail.lol': {
      emailDisplay: '.email-address',
      inboxContainer: '.messages',
      messageItem: '.message-item',
    }
  },
  MAGIC_LINK_PATTERNS: [
    /https?:\/\/[^\s<>"]+(?:confirm|token|auth|verify)[^\s<>"]*/gi,
    /https?:\/\/[^\s<>"]*supabase[^\s<>"]*[?&]token=[^\s<>"&]*/gi,
    /https?:\/\/[^\s<>"]*[?&](?:confirmation_token|access_token)[^\s<>"&]*/gi
  ]
};

// Database Validation Queries
export const DB_VALIDATION = {
  CHECK_USER_EXISTS: `
    SELECT id, email, tier, created_at 
    FROM users 
    WHERE email = $1
  `,
  CHECK_SUBSCRIPTION: `
    SELECT u.*, s.* 
    FROM users u 
    LEFT JOIN subscriptions s ON u.id = s.user_id 
    WHERE u.email = $1
  `,
  CHECK_USAGE_LIMITS: `
    SELECT u.tier, u.monthly_analyses_used, u.monthly_limit
    FROM users u
    WHERE u.email = $1
  `
};

// Test Assertions and Validation Rules
export const VALIDATION_RULES = {
  EMAIL_FORMAT: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  MAGIC_LINK_VALID: /^https?:\/\/.+[?&]token=.+$/,
  STRIPE_SESSION_ID: /^cs_test_.+$/,
  UUID_FORMAT: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Error Messages and Expected Behaviors
export const EXPECTED_BEHAVIORS = {
  INVALID_EMAIL: {
    shouldShow: 'validation error',
    shouldNotProceed: true,
    errorMessages: ['Invalid email', 'Please enter a valid email', 'Email format is incorrect']
  },
  NETWORK_TIMEOUT: {
    shouldShow: 'retry option or error message',
    shouldGracefullyDegrade: true,
    maxRetries: 3
  },
  PAYMENT_FAILURE: {
    shouldShow: 'payment error message',
    shouldReturnToPricing: true,
    shouldPreserveUserData: true
  },
  SUBSCRIPTION_SUCCESS: {
    shouldRedirect: 'dashboard or account page',
    shouldUpdateTier: true,
    shouldSendConfirmation: true
  }
};

// Test Data Generation Utilities
export const TestDataGenerator = {
  /**
   * Generate test email address
   */
  generateTestEmail(prefix = 'test', domain = null) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const baseName = `${prefix}-${timestamp}-${randomId}`;
    
    if (domain) {
      return `${baseName}@${domain}`;
    }
    
    return `${baseName}@example.com`;
  },
  
  /**
   * Generate test user data
   */
  generateTestUser(tierType = 'FREE') {
    const userPattern = TEST_USER_PATTERNS[`${tierType}_USER`] || TEST_USER_PATTERNS.FREE_USER;
    
    return {
      email: this.generateTestEmail(userPattern.namePrefix),
      tier: tierType,
      expectedFlow: userPattern.expectedFlow,
      timeoutBehavior: userPattern.timeoutBehavior,
      generatedAt: new Date().toISOString(),
      testRunId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    };
  },
  
  /**
   * Generate test payment data (for Stripe test mode)
   */
  generateTestPaymentData() {
    return {
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2030',
      cvc: '123',
      zip: '12345',
      country: 'US'
    };
  }
};

// Browser and Device Testing Configuration
export const BROWSER_CONFIG = {
  DESKTOP: {
    viewport: { width: 1280, height: 720 },
    userAgent: 'desktop-test'
  },
  TABLET: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'tablet-test'
  },
  MOBILE: {
    viewport: { width: 375, height: 667 },
    userAgent: 'mobile-test'
  }
};

// Performance Monitoring
export const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD_TIME: 5000, // 5 seconds
  EMAIL_DELIVERY_TIME: 60000, // 1 minute
  PAYMENT_PROCESSING_TIME: 30000, // 30 seconds
  DB_QUERY_TIME: 5000, // 5 seconds
  MAGIC_LINK_PROCESSING: 10000 // 10 seconds
};

export default {
  TIER_TEST_CONFIG,
  TIER_DEFINITIONS,
  TEST_USER_PATTERNS,
  EMAIL_CONFIG,
  DB_VALIDATION,
  VALIDATION_RULES,
  EXPECTED_BEHAVIORS,
  TestDataGenerator,
  BROWSER_CONFIG,
  PERFORMANCE_THRESHOLDS
};