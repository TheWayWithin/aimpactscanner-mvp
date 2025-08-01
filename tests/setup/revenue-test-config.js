// Revenue Activation Test Configuration
// Specialized configuration for payment flow and revenue testing

import { createClient } from '@supabase/supabase-js'

// Test environment configuration
export const revenueTestConfig = {
  // Test timing configurations
  timeouts: {
    paymentFlow: 30000,      // 30 seconds for complete payment flow
    stripeLoad: 10000,       // 10 seconds for Stripe elements to load
    webhookProcess: 5000,    // 5 seconds for webhook processing
    tierUpdate: 3000,        // 3 seconds for tier update to reflect
    analysisComplete: 20000, // 20 seconds for analysis completion
  },
  
  // Test data
  testUrls: {
    valid: 'https://example.com',
    slow: 'https://httpstat.us/200?sleep=5000',
    invalid: 'not-a-valid-url',
  },
  
  // Stripe test cards
  stripeTestCards: {
    success: '4242424242424242',     // Always succeeds
    declined: '4000000000000002',    // Always declined
    insufficient: '4000000000009995', // Insufficient funds
    expired: '4000000000000069',     // Expired card
    processing: '4000000000000119',  // Processing error
  },
  
  // Expected success criteria (from progress.md)
  successCriteria: {
    paymentSuccessRate: 95,          // >95% payment success rate
    conversionTime: 120000,          // <2 minutes for complete flow
    firstRevenueTarget: 10000,       // $100 revenue target (in cents)
    activePaidUsersTarget: 20,       // 20+ active paid users within 1 week
  },
  
  // Test user configurations
  testUsers: {
    freeUser: {
      tier: 'free',
      monthlyUsed: 0,
      maxAnalyses: 3,
    },
    limitReachedUser: {
      tier: 'free',
      monthlyUsed: 3,
      maxAnalyses: 3,
    },
    coffeeUser: {
      tier: 'coffee',
      monthlyUsed: 15,
      maxAnalyses: -1, // unlimited
    },
  },
}

// Test utilities for revenue activation
export const revenueTestUtils = {
  // Create test user with specific tier status
  async createTestUser(userConfig = revenueTestConfig.testUsers.freeUser) {
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const email = `${userId}@test.local`
    
    return {
      id: userId,
      email: email,
      tier: userConfig.tier,
      monthly_analyses_used: userConfig.monthlyUsed,
      subscription_status: userConfig.tier === 'coffee' ? 'active' : null,
      created_at: new Date().toISOString(),
    }
  },
  
  // Simulate Stripe webhook events
  async simulateStripeWebhook(eventType, customerId, subscriptionId) {
    const webhookEvents = {
      'customer.subscription.created': {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: subscriptionId,
            customer: customerId,
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_coffee_tier',
                  unit_amount: 500, // $5.00
                }
              }]
            }
          }
        }
      },
      'payment_intent.succeeded': {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_${Date.now()}`,
            customer: customerId,
            amount: 500,
            status: 'succeeded',
          }
        }
      },
    }
    
    return webhookEvents[eventType] || null
  },
  
  // Verify payment success indicators
  async verifyPaymentSuccess(page) {
    const indicators = {
      successMessage: page.locator('[data-testid="payment-success"]'),
      tierUpdate: page.locator('[data-testid="tier-indicator"]:has-text("Coffee")'),
      unlimitedAccess: page.locator('text=Unlimited'),
      noUpgradePrompts: page.locator('text=upgrade').count(),
    }
    
    return indicators
  },
  
  // Monitor revenue metrics during test
  async monitorRevenueMetrics(testSession) {
    const metrics = {
      startTime: Date.now(),
      conversionAttempts: 0,
      successfulConversions: 0,
      failedConversions: 0,
      averageConversionTime: 0,
      paymentMethods: [],
      errorTypes: [],
    }
    
    return {
      ...metrics,
      
      recordConversionAttempt() {
        this.conversionAttempts++
      },
      
      recordConversionSuccess(duration) {
        this.successfulConversions++
        this.averageConversionTime = 
          (this.averageConversionTime + duration) / this.successfulConversions
      },
      
      recordConversionFailure(errorType) {
        this.failedConversions++
        this.errorTypes.push(errorType)
      },
      
      getSuccessRate() {
        if (this.conversionAttempts === 0) return 0
        return (this.successfulConversions / this.conversionAttempts) * 100
      },
      
      meetsSuccessCriteria() {
        return {
          successRate: this.getSuccessRate() >= revenueTestConfig.successCriteria.paymentSuccessRate,
          conversionTime: this.averageConversionTime <= revenueTestConfig.successCriteria.conversionTime,
          overallSuccess: this.getSuccessRate() >= revenueTestConfig.successCriteria.paymentSuccessRate &&
                         this.averageConversionTime <= revenueTestConfig.successCriteria.conversionTime
        }
      }
    }
  },
  
  // Generate comprehensive test report
  generateRevenueTestReport(metrics, testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.status === 'passed').length,
        failed: testResults.filter(r => r.status === 'failed').length,
        skipped: testResults.filter(r => r.status === 'skipped').length,
      },
      revenueMetrics: {
        conversionRate: metrics.getSuccessRate(),
        averageConversionTime: metrics.averageConversionTime,
        totalAttempts: metrics.conversionAttempts,
        successfulPayments: metrics.successfulConversions,
        failedPayments: metrics.failedConversions,
      },
      successCriteria: {
        targets: revenueTestConfig.successCriteria,
        achieved: metrics.meetsSuccessCriteria(),
      },
      recommendations: [],
    }
    
    // Generate recommendations based on results
    if (report.revenueMetrics.conversionRate < 95) {
      report.recommendations.push('Payment success rate below target - investigate payment failures')
    }
    
    if (report.revenueMetrics.averageConversionTime > 120000) {
      report.recommendations.push('Conversion time above target - optimize payment flow')
    }
    
    if (report.testSummary.failed > 0) {
      report.recommendations.push('Failed tests detected - address before revenue activation')
    }
    
    return report
  },
  
  // Test environment setup for revenue tests
  async setupRevenueTestEnvironment() {
    console.log('🏗️ Setting up revenue activation test environment...')
    
    // Verify required environment variables
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
    
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }
    
    // Optional Stripe test environment
    if (process.env.STRIPE_TEST_MODE === 'true') {
      const stripeVars = ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY']
      const missingStripeVars = stripeVars.filter(envVar => !process.env[envVar])
      
      if (missingStripeVars.length > 0) {
        console.warn(`⚠️ Stripe test vars missing: ${missingStripeVars.join(', ')} - payment tests will be skipped`)
      } else {
        console.log('✅ Stripe test environment configured')
      }
    }
    
    console.log('✅ Revenue test environment ready')
    return true
  },
  
  // Clean up test data after revenue tests
  async cleanupRevenueTestData() {
    console.log('🧹 Cleaning up revenue test data...')
    
    // This would clean up any test users, subscriptions, analyses created during testing
    // Implementation depends on your specific test data management strategy
    
    console.log('✅ Revenue test data cleanup complete')
  },
}

// Export configuration for use in tests
export default {
  revenueTestConfig,
  revenueTestUtils,
}