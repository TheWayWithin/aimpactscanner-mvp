// UAT Test Users Configuration
// Pre-configured test users for different tiers and scenarios

export const TEST_USERS = {
  // Anonymous user (no account)
  anonymous: {
    description: 'Unauthenticated visitor',
    email: null,
    password: null,
    tier: null
  },

  // Free tier users
  freeNew: {
    description: 'New free tier user (uses temp email)',
    email: 'TEMP_EMAIL', // Will be generated dynamically
    password: null, // Magic link auth
    tier: 'free',
    analysisLimit: 1
  },
  
  freeExisting: {
    description: 'Existing free tier user',
    email: 'uat.free@test.com',
    password: 'UATtest123!',
    tier: 'free',
    analysisLimit: 1,
    analysisUsed: 0
  },

  freeAtLimit: {
    description: 'Free tier user at analysis limit',
    email: 'uat.free.limit@test.com',
    password: 'UATtest123!',
    tier: 'free',
    analysisLimit: 1,
    analysisUsed: 1
  },

  // Starter tier ($9/month)
  starterActive: {
    description: 'Active starter tier subscriber',
    email: 'uat.starter@test.com',
    password: 'UATtest123!',
    tier: 'starter',
    analysisLimit: 10,
    analysisUsed: 3,
    stripeCustomerId: 'cus_test_starter',
    subscriptionStatus: 'active'
  },

  starterTrial: {
    description: 'Starter tier in trial period',
    email: 'uat.starter.trial@test.com',
    password: 'UATtest123!',
    tier: 'starter',
    analysisLimit: 10,
    analysisUsed: 0,
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    subscriptionStatus: 'trialing'
  },

  starterCanceled: {
    description: 'Starter tier with canceled subscription',
    email: 'uat.starter.canceled@test.com',
    password: 'UATtest123!',
    tier: 'starter',
    analysisLimit: 10,
    subscriptionStatus: 'canceled',
    accessUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days remaining
  },

  // Growth tier ($49/month)
  growthActive: {
    description: 'Active growth tier subscriber',
    email: 'uat.growth@test.com',
    password: 'UATtest123!',
    tier: 'growth',
    analysisLimit: 100,
    analysisUsed: 25,
    stripeCustomerId: 'cus_test_growth',
    subscriptionStatus: 'active',
    features: ['pdf', 'api', 'priority']
  },

  growthNearLimit: {
    description: 'Growth tier near analysis limit',
    email: 'uat.growth.limit@test.com',
    password: 'UATtest123!',
    tier: 'growth',
    analysisLimit: 100,
    analysisUsed: 95,
    subscriptionStatus: 'active'
  },

  // Business tier ($199/month)
  businessActive: {
    description: 'Active business tier subscriber',
    email: 'uat.business@test.com',
    password: 'UATtest123!',
    tier: 'business',
    analysisLimit: 'unlimited',
    analysisUsed: 500,
    stripeCustomerId: 'cus_test_business',
    subscriptionStatus: 'active',
    features: ['pdf', 'api', 'priority', 'whitelabel', 'support']
  },

  businessEnterprise: {
    description: 'Enterprise business customer',
    email: 'uat.enterprise@test.com',
    password: 'UATtest123!',
    tier: 'business',
    analysisLimit: 'unlimited',
    customDomain: 'analysis.enterprise.com',
    apiKeys: ['sk_test_enterprise_001', 'sk_test_enterprise_002'],
    subscriptionStatus: 'active'
  },

  // Edge case users
  paymentFailed: {
    description: 'User with failed payment',
    email: 'uat.payment.failed@test.com',
    password: 'UATtest123!',
    tier: 'growth',
    subscriptionStatus: 'past_due',
    paymentRetryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },

  multiDevice: {
    description: 'User for multi-device testing',
    email: 'uat.multidevice@test.com',
    password: 'UATtest123!',
    tier: 'starter',
    activeSessions: ['desktop', 'mobile', 'tablet']
  },

  oauthGoogle: {
    description: 'Google OAuth user',
    email: 'uat.oauth@gmail.com',
    authProvider: 'google',
    tier: 'free'
  },

  oauthGitHub: {
    description: 'GitHub OAuth user',
    email: 'uat.github@test.com',
    authProvider: 'github',
    tier: 'starter'
  }
};

// Test credit cards for Stripe
export const TEST_CARDS = {
  success: {
    number: '4242424242424242',
    exp: '12/30',
    cvc: '123',
    zip: '12345',
    description: 'Always succeeds'
  },
  
  declined: {
    number: '4000000000000002',
    exp: '12/30',
    cvc: '123',
    zip: '12345',
    description: 'Always declines'
  },
  
  insufficientFunds: {
    number: '4000000000009995',
    exp: '12/30',
    cvc: '123',
    zip: '12345',
    description: 'Declines with insufficient funds'
  },
  
  requiresAuth: {
    number: '4000002500003155',
    exp: '12/30',
    cvc: '123',
    zip: '12345',
    description: 'Requires 3D Secure authentication'
  },
  
  expired: {
    number: '4000000000000069',
    exp: '12/30',
    cvc: '123',
    zip: '12345',
    description: 'Card expired'
  }
};

// Test websites for analysis
export const TEST_SITES = {
  // Simple sites for quick tests
  simple: [
    'https://example.com',
    'https://httpbin.org',
    'https://placeholder.com'
  ],
  
  // Medium complexity sites
  medium: [
    'https://github.com',
    'https://nodejs.org',
    'https://mozilla.org'
  ],
  
  // Complex sites for thorough testing
  complex: [
    'https://stripe.com',
    'https://vercel.com',
    'https://supabase.com'
  ],
  
  // Sites with specific characteristics
  highAI: [
    'https://openai.com',
    'https://anthropic.com',
    'https://deepmind.com'
  ],
  
  lowAI: [
    'https://wikipedia.org',
    'https://archive.org',
    'https://gov.uk'
  ],
  
  // Problematic sites for edge case testing
  edgeCases: [
    'https://very-long-domain-name-that-might-cause-issues-with-display.example.com',
    'https://redirect-test.example.com', // Tests redirect handling
    'https://slow-loading-site.example.com', // Tests timeout handling
    'https://invalid-ssl-cert.example.com', // Tests SSL error handling
  ]
};

// Environment-specific configurations
export const ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:54321',
    stripeKey: 'pk_test_local',
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'local-anon-key'
  },
  
  staging: {
    baseUrl: 'https://staging.aimpactscanner.com',
    apiUrl: 'https://api.staging.aimpactscanner.com',
    stripeKey: 'pk_test_staging',
    supabaseUrl: 'https://staging-project.supabase.co',
    supabaseAnonKey: 'staging-anon-key'
  },
  
  production: {
    baseUrl: 'https://aimpactscanner.com',
    apiUrl: 'https://api.aimpactscanner.com',
    stripeKey: 'pk_live_production',
    supabaseUrl: 'https://production-project.supabase.co',
    supabaseAnonKey: 'production-anon-key'
  }
};

// Helper function to get test user
export function getTestUser(userType) {
  return TEST_USERS[userType] || TEST_USERS.anonymous;
}

// Helper function to get test card
export function getTestCard(cardType = 'success') {
  return TEST_CARDS[cardType] || TEST_CARDS.success;
}

// Helper function to get test site
export function getTestSite(complexity = 'simple') {
  const sites = TEST_SITES[complexity] || TEST_SITES.simple;
  return sites[Math.floor(Math.random() * sites.length)];
}

// Helper function to get environment config
export function getEnvironment() {
  const env = process.env.TEST_ENV || 'local';
  return ENVIRONMENTS[env] || ENVIRONMENTS.local;
}