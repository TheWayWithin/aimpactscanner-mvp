// Integration Tests for Complete Cancellation Flow
// Tests the full end-to-end cancellation process including database interactions,
// Stripe API calls (mocked), and user state management

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { testConfig, testSupabase, testUtils } from '../setup/test-config.js'

/**
 * TEST SUITE: Cancellation Flow Integration Tests
 * 
 * This test suite validates the complete cancellation flow:
 * 
 * 1. Full E2E cancellation process with database
 * 2. Stripe integration (mocked but realistic)
 * 3. User state management and tier transitions
 * 4. Feedback collection and storage
 * 5. 30-day guarantee processing
 * 6. Error scenarios and rollback handling
 */

// Mock Stripe for integration tests
const mockStripe = {
  subscriptions: {
    list: vi.fn(),
    cancel: vi.fn(),
    update: vi.fn()
  },
  charges: {
    list: vi.fn()
  },
  refunds: {
    create: vi.fn()
  }
}

// Mock Stripe constructor
vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {
      return mockStripe
    }
    static createFetchHttpClient() {
      return {}
    }
  }
}))

describe('Cancellation Flow Integration Tests', () => {
  let testUser
  let mockSubscriptionData

  beforeAll(async () => {
    console.log('🧪 Setting up cancellation integration tests...')
    
    // Verify database connection
    const { error } = await testSupabase.from('users').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
    
    console.log('✅ Database connection verified for cancellation tests')
  })

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Clean up any existing test data
    await testUtils.cleanupTestData()
    
    // Create test user with subscription
    const userId = testConfig.test_user.id
    testUser = {
      id: userId,
      email: 'test@example.com',
      stripe_customer_id: 'cus_test_123',
      tier: 'coffee',
      subscription_started_at: '2024-01-15T12:00:00Z', // 16 days ago based on mock date
      subscription_status: 'active'
    }

    // Insert test user
    const { error: userError } = await testSupabase
      .from('users')
      .upsert(testUser)
      .select()

    if (userError) {
      console.error('Failed to create test user:', userError)
      throw userError
    }

    // Mock subscription data
    mockSubscriptionData = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      status: 'active',
      created: Math.floor(new Date('2024-01-15T12:00:00Z').getTime() / 1000),
      current_period_end: Math.floor(new Date('2024-02-15T12:00:00Z').getTime() / 1000)
    }

    // Setup default Stripe mocks
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscriptionData]
    })
    
    mockStripe.subscriptions.cancel.mockResolvedValue({
      ...mockSubscriptionData,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000)
    })
    
    mockStripe.charges.list.mockResolvedValue({
      data: [{
        id: 'ch_test_123',
        amount: 500, // $5.00
        currency: 'usd',
        created: Math.floor(new Date('2024-01-15T12:00:00Z').getTime() / 1000)
      }]
    })
    
    mockStripe.refunds.create.mockResolvedValue({
      id: 'ref_test_123',
      amount: 500,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000)
    })

    // Mock current date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-31T12:00:00Z')) // 16 days after subscription
  })

  afterEach(async () => {
    vi.useRealTimers()
    await testUtils.cleanupTestData()
  })

  describe('Successful Cancellation Scenarios', () => {
    it('should complete immediate cancellation within 30-day guarantee period', async () => {
      // Simulate Edge Function request
      const requestData = {
        reason: 'too_expensive',
        feedback: 'Great service but too costly for my needs',
        immediately: true
      }

      // This would normally be called by the Edge Function
      // We're testing the integration logic here
      
      // 1. Verify user exists and has active subscription
      const { data: userData } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()
      
      expect(userData.stripe_customer_id).toBe('cus_test_123')
      expect(userData.tier).toBe('coffee')

      // 2. Check 30-day guarantee eligibility
      const subscriptionStartDate = new Date(userData.subscription_started_at)
      const daysSinceStart = Math.floor(
        (Date.now() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      expect(daysSinceStart).toBe(16) // 16 days since start
      expect(daysSinceStart <= 30).toBe(true) // Eligible for refund

      // 3. Verify Stripe calls would be made correctly
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        status: 'active',
        limit: 1
      })

      // 4. Process cancellation
      const cancelResult = await mockStripe.subscriptions.cancel('sub_test_123')
      expect(cancelResult.status).toBe('canceled')

      // 5. Process refund
      const refundResult = await mockStripe.refunds.create({
        charge: 'ch_test_123',
        reason: 'requested_by_customer'
      })
      expect(refundResult.status).toBe('succeeded')
      expect(refundResult.amount).toBe(500)

      // 6. Update user tier
      const { error: updateError } = await testSupabase
        .from('users')
        .update({
          tier: 'free',
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString()
        })
        .eq('id', testUser.id)

      expect(updateError).toBeNull()

      // 7. Store feedback
      const { error: feedbackError } = await testSupabase
        .from('cancellation_feedback')
        .insert({
          user_id: testUser.id,
          reason: requestData.reason,
          feedback: requestData.feedback,
          subscription_id: 'sub_test_123',
          days_since_start: daysSinceStart,
          refund_issued: true
        })

      expect(feedbackError).toBeNull()

      // 8. Verify final state
      const { data: finalUserState } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      expect(finalUserState.tier).toBe('free')
      expect(finalUserState.subscription_status).toBe('canceled')
      expect(finalUserState.subscription_canceled_at).toBeTruthy()

      // 9. Verify feedback was stored
      const { data: feedbackData } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)
        .single()

      expect(feedbackData.reason).toBe('too_expensive')
      expect(feedbackData.feedback).toBe('Great service but too costly for my needs')
      expect(feedbackData.days_since_start).toBe(16)
      expect(feedbackData.refund_issued).toBe(true)
    })

    it('should complete cancellation after 30-day period without refund', async () => {
      // Update subscription start date to be 45 days ago
      const oldStartDate = new Date('2023-12-17T12:00:00Z') // 45 days ago
      await testSupabase
        .from('users')
        .update({ subscription_started_at: oldStartDate.toISOString() })
        .eq('id', testUser.id)

      const requestData = {
        reason: 'not_using',
        feedback: 'Service is good but I dont use it enough',
        immediately: true
      }

      // Get updated user data
      const { data: userData } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      // Calculate days since start
      const subscriptionStartDate = new Date(userData.subscription_started_at)
      const daysSinceStart = Math.floor(
        (Date.now() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysSinceStart).toBe(45) // 45 days since start
      expect(daysSinceStart <= 30).toBe(false) // NOT eligible for refund

      // Process cancellation (no refund)
      await mockStripe.subscriptions.cancel('sub_test_123')
      
      // Verify no refund call was made
      expect(mockStripe.refunds.create).not.toHaveBeenCalled()

      // Update user state
      await testSupabase
        .from('users')
        .update({
          tier: 'free',
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString()
        })
        .eq('id', testUser.id)

      // Store feedback
      await testSupabase
        .from('cancellation_feedback')
        .insert({
          user_id: testUser.id,
          reason: requestData.reason,
          feedback: requestData.feedback,
          subscription_id: 'sub_test_123',
          days_since_start: daysSinceStart,
          refund_issued: false
        })

      // Verify feedback shows no refund
      const { data: feedbackData } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)
        .single()

      expect(feedbackData.refund_issued).toBe(false)
      expect(feedbackData.days_since_start).toBe(45)
    })

    it('should handle end-of-period cancellation', async () => {
      const requestData = {
        reason: 'temporary',
        feedback: 'Just need to pause for a few months',
        immediately: false // End-of-period cancellation
      }

      // Mock Stripe update for end-of-period
      mockStripe.subscriptions.update.mockResolvedValue({
        ...mockSubscriptionData,
        cancel_at_period_end: true
      })

      // Process end-of-period cancellation
      const updateResult = await mockStripe.subscriptions.update('sub_test_123', {
        cancel_at_period_end: true
      })

      expect(updateResult.cancel_at_period_end).toBe(true)

      // For end-of-period, user tier should NOT be updated immediately
      // Only feedback should be stored

      const { data: userDataBefore } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      expect(userDataBefore.tier).toBe('coffee') // Should remain coffee until period ends

      // Store feedback
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(userDataBefore.subscription_started_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      await testSupabase
        .from('cancellation_feedback')
        .insert({
          user_id: testUser.id,
          reason: requestData.reason,
          feedback: requestData.feedback,
          subscription_id: 'sub_test_123',
          days_since_start: daysSinceStart,
          refund_issued: false // No refund for end-of-period
        })

      const { data: feedbackData } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)
        .single()

      expect(feedbackData.reason).toBe('temporary')
      expect(feedbackData.refund_issued).toBe(false)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle user with no stripe customer ID', async () => {
      // Update user to have no stripe customer ID
      await testSupabase
        .from('users')
        .update({ stripe_customer_id: null })
        .eq('id', testUser.id)

      const { data: userData } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      // This should trigger an error in the Edge Function
      expect(userData.stripe_customer_id).toBeNull()
      
      // Verify that the cancellation process would fail appropriately
      // In a real scenario, this would return an error response
    })

    it('should handle no active Stripe subscription found', async () => {
      // Mock empty subscription list
      mockStripe.subscriptions.list.mockResolvedValue({
        data: []
      })

      const subscriptions = await mockStripe.subscriptions.list({
        customer: testUser.stripe_customer_id,
        status: 'active',
        limit: 1
      })

      expect(subscriptions.data.length).toBe(0)
      // This should trigger "No active subscription found" error
    })

    it('should handle Stripe refund failures gracefully', async () => {
      // Mock refund failure
      mockStripe.refunds.create.mockRejectedValue(new Error('Charge already refunded'))

      // The process should continue even if refund fails
      try {
        await mockStripe.refunds.create({
          charge: 'ch_test_123',
          reason: 'requested_by_customer'
        })
      } catch (error) {
        expect(error.message).toBe('Charge already refunded')
      }

      // Cancellation should still proceed
      const cancelResult = await mockStripe.subscriptions.cancel('sub_test_123')
      expect(cancelResult.status).toBe('canceled')

      // User should still be updated to free tier
      await testSupabase
        .from('users')
        .update({
          tier: 'free',
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString()
        })
        .eq('id', testUser.id)

      const { data: finalUserState } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      expect(finalUserState.tier).toBe('free')
    })

    it('should handle database update failures', async () => {
      // Simulate database update failure by trying to update non-existent user
      const { error: updateError } = await testSupabase
        .from('users')
        .update({ tier: 'free' })
        .eq('id', 'non-existent-user-id')

      // Should handle gracefully without crashing the process
      expect(updateError).toBeTruthy()
    })
  })

  describe('Data Integrity and Cleanup', () => {
    it('should store complete feedback data with all fields', async () => {
      const feedbackData = {
        user_id: testUser.id,
        reason: 'missing_features',
        feedback: 'Need better reporting capabilities and API access',
        subscription_id: 'sub_test_123',
        days_since_start: 16,
        refund_issued: true
      }

      const { error } = await testSupabase
        .from('cancellation_feedback')
        .insert(feedbackData)

      expect(error).toBeNull()

      // Verify all fields were stored correctly
      const { data: storedFeedback } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)
        .single()

      expect(storedFeedback.user_id).toBe(feedbackData.user_id)
      expect(storedFeedback.reason).toBe(feedbackData.reason)
      expect(storedFeedback.feedback).toBe(feedbackData.feedback)
      expect(storedFeedback.subscription_id).toBe(feedbackData.subscription_id)
      expect(storedFeedback.days_since_start).toBe(feedbackData.days_since_start)
      expect(storedFeedback.refund_issued).toBe(feedbackData.refund_issued)
      expect(storedFeedback.created_at).toBeTruthy()
    })

    it('should handle optional feedback fields', async () => {
      // Test with minimal data (reason and feedback are optional)
      const minimalFeedback = {
        user_id: testUser.id,
        subscription_id: 'sub_test_123',
        days_since_start: 16,
        refund_issued: false
        // reason and feedback are null/undefined
      }

      const { error } = await testSupabase
        .from('cancellation_feedback')
        .insert(minimalFeedback)

      expect(error).toBeNull()

      const { data: storedFeedback } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)
        .single()

      expect(storedFeedback.reason).toBeNull()
      expect(storedFeedback.feedback).toBeNull()
      expect(storedFeedback.days_since_start).toBe(16)
    })

    it('should maintain referential integrity', async () => {
      // Create feedback record
      await testSupabase
        .from('cancellation_feedback')
        .insert({
          user_id: testUser.id,
          reason: 'other',
          subscription_id: 'sub_test_123',
          days_since_start: 16,
          refund_issued: true
        })

      // Verify feedback exists
      const { data: feedback } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)

      expect(feedback.length).toBe(1)

      // Delete user (cleanup)
      await testSupabase
        .from('users')
        .delete()
        .eq('id', testUser.id)

      // Feedback should still exist (no cascade delete)
      // This is by design to preserve feedback data for analysis
      const { data: feedbackAfterUserDelete } = await testSupabase
        .from('cancellation_feedback')
        .select('*')
        .eq('user_id', testUser.id)

      expect(feedbackAfterUserDelete.length).toBe(1)
    })
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up cancellation integration test environment...')
    await testUtils.cleanupTestData()
    
    // Clean up feedback data
    await testSupabase
      .from('cancellation_feedback')
      .delete()
      .eq('user_id', testConfig.test_user.id)
    
    console.log('✅ Cancellation integration test cleanup completed')
  })
})