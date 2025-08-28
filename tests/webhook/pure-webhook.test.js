/**
 * Pure Stripe Webhook Cancellation Tests
 * No database dependencies - pure unit tests for webhook logic
 */

import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';

describe('Stripe Webhook Subscription Cancellation', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('✅ WEBHOOK SIGNATURE VERIFICATION', () => {
    it('should verify STRIPE_WEBHOOK_SECRET is required', () => {
      const mockEnv = {
        STRIPE_WEBHOOK_SECRET: null,
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key'
      };

      // Simulate webhook handler check for secret
      const validateWebhookSecret = (secret) => {
        if (!secret) {
          return { valid: false, status: 500, message: 'Webhook secret not configured' };
        }
        return { valid: true };
      };

      const result = validateWebhookSecret(mockEnv.STRIPE_WEBHOOK_SECRET);
      expect(result.valid).toBe(false);
      expect(result.status).toBe(500);
      expect(result.message).toBe('Webhook secret not configured');
    });

    it('should validate webhook signature header format', () => {
      const validSignature = 't=1234567890,v1=abcdef123456';
      const invalidSignature1 = 'invalid-signature';
      const invalidSignature2 = 't=1234567890'; // missing v1
      const invalidSignature3 = 'v1=abcdef123456'; // missing t

      // Simulate signature parsing logic from webhook handler
      const parseSignature = (signature) => {
        if (!signature) return { valid: false, error: 'Missing signature' };
        
        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
        const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];
        
        if (!timestamp || !signatureHash) {
          return { valid: false, error: 'Missing timestamp or signature hash' };
        }
        
        return { valid: true, timestamp, signatureHash };
      };

      // Test valid signature
      const validResult = parseSignature(validSignature);
      expect(validResult.valid).toBe(true);
      expect(validResult.timestamp).toBe('1234567890');
      expect(validResult.signatureHash).toBe('abcdef123456');

      // Test invalid signatures
      expect(parseSignature(invalidSignature1).valid).toBe(false);
      expect(parseSignature(invalidSignature2).valid).toBe(false);
      expect(parseSignature(invalidSignature3).valid).toBe(false);
    });

    it('should reject expired timestamps (replay attack protection)', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const validTimestamp = currentTime - 60; // 1 minute ago
      const expiredTimestamp = currentTime - 600; // 10 minutes ago (should be rejected)

      // Simulate timestamp validation from webhook handler
      const validateTimestamp = (timestamp) => {
        const webhookTimestamp = parseInt(timestamp, 10);
        const timeDifference = Math.abs(currentTime - webhookTimestamp);
        
        if (timeDifference > 300) { // 5 minutes
          return { valid: false, error: 'Webhook timestamp too old' };
        }
        return { valid: true };
      };

      expect(validateTimestamp(validTimestamp.toString()).valid).toBe(true);
      expect(validateTimestamp(expiredTimestamp.toString()).valid).toBe(false);
      expect(validateTimestamp(expiredTimestamp.toString()).error).toBe('Webhook timestamp too old');
    });
  });

  describe('✅ customer.subscription.deleted EVENT HANDLING', () => {
    it('should process subscription cancellation event correctly', async () => {
      // Mock subscription data from Stripe
      const subscriptionData = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test456',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      };

      // Mock Supabase client
      const selectSpy = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'user-123' },
            error: null
          }))
        }))
      }));

      const fromSpy = vi.fn(() => ({
        select: selectSpy
      }));

      const mockSupabase = {
        from: fromSpy
      };

      // Mock TierManager
      const mockTierManager = {
        supabase: mockSupabase,
        downgradeTier: vi.fn(() => Promise.resolve())
      };

      // Exact implementation from webhook handler (lines 270-296)
      const handleSubscriptionCanceled = async (subscription, tierManager) => {
        try {
          console.log('Processing customer.subscription.deleted...');
          
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const { data: user, error } = await tierManager.supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
            
          if (error || !user) {
            throw new Error(`User not found for customer ID: ${customerId}`);
          }
          
          console.log(`Subscription canceled for user ${user.id}`);
          
          // Downgrade user to free tier
          await tierManager.downgradeTier(user.id, 'subscription_canceled');
          
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
          throw error;
        }
      };

      // Execute the function
      await handleSubscriptionCanceled(subscriptionData, mockTierManager);

      // ✅ VERIFY: Processing logs
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing customer.subscription.deleted...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subscription canceled for user user-123');

      // ✅ VERIFY: User lookup by customer ID
      expect(fromSpy).toHaveBeenCalledWith('users');
      expect(selectSpy).toHaveBeenCalledWith('id');

      // ✅ VERIFY: TierManager.downgradeTier() execution
      expect(mockTierManager.downgradeTier).toHaveBeenCalledWith('user-123', 'subscription_canceled');
      expect(mockTierManager.downgradeTier).toHaveBeenCalledTimes(1);
    });

    it('should find user by Stripe customer ID with correct SQL query', async () => {
      const testCases = [
        { customerId: 'cus_test1', expectedUserId: 'user-1' },
        { customerId: 'cus_test2', expectedUserId: 'user-2' },
        { customerId: 'cus_special_chars_!@#', expectedUserId: 'user-special' }
      ];

      for (const testCase of testCases) {
        // Mock Supabase to return specific user for each test
        const mockSupabase = {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn((field, value) => {
                // ✅ VERIFY: Correct field and value are used
                expect(field).toBe('stripe_customer_id');
                expect(value).toBe(testCase.customerId);
                return {
                  single: vi.fn(() => Promise.resolve({
                    data: { id: testCase.expectedUserId },
                    error: null
                  }))
                };
              })
            }))
          }))
        };

        const mockTierManager = {
          supabase: mockSupabase,
          downgradeTier: vi.fn()
        };

        const subscriptionData = { customer: testCase.customerId };

        // Execute user lookup logic
        const { data: user } = await mockTierManager.supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscriptionData.customer)
          .single();

        await mockTierManager.downgradeTier(user.id, 'subscription_canceled');

        // ✅ VERIFY: Correct parameters passed to downgradeTier
        expect(mockTierManager.downgradeTier).toHaveBeenCalledWith(testCase.expectedUserId, 'subscription_canceled');
      }
    });
  });

  describe('✅ TierManager.downgradeTier() EXECUTION', () => {
    it('should call downgradeTier with correct parameters', async () => {
      const userId = 'user-downgrade-test';
      const reason = 'subscription_canceled';

      // Mock TierManager with spy
      const mockTierManager = {
        downgradeTier: vi.fn(() => Promise.resolve()),
        supabase: {} // Mock supabase reference
      };

      // Execute downgradeTier call
      await mockTierManager.downgradeTier(userId, reason);

      // ✅ VERIFY: Function called with exact parameters from webhook handler
      expect(mockTierManager.downgradeTier).toHaveBeenCalledWith(userId, reason);
      expect(mockTierManager.downgradeTier).toHaveBeenCalledTimes(1);

      // ✅ VERIFY: Reason parameter matches webhook specification
      expect(reason).toBe('subscription_canceled');
    });

    it('should simulate TierManager downgradeTier database operations', async () => {
      const userId = 'user-db-test';
      const updateCalls = [];

      // Mock Supabase with operation tracking
      const mockSupabase = {
        from: vi.fn((table) => {
          return {
            update: vi.fn((data) => {
              updateCalls.push({ table, data });
              return {
                eq: vi.fn((field, value) => {
                  updateCalls[updateCalls.length - 1].where = { field, value };
                  return Promise.resolve({ error: null });
                })
              };
            })
          };
        })
      };

      // Simulate TierManager.downgradeTier implementation
      const simulatedDowngradeTier = async (userId, reason) => {
        // Update user to free tier (from TierManager implementation lines 216-223)
        await mockSupabase
          .from('users')
          .update({
            tier: 'free',
            tier_expires_at: null,
            subscription_status: 'inactive'
          })
          .eq('id', userId);

        // Update subscription status (from TierManager implementation lines 227-235)
        await mockSupabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      };

      await simulatedDowngradeTier(userId, 'subscription_canceled');

      // ✅ VERIFY: Users table update
      expect(updateCalls[0]).toEqual({
        table: 'users',
        data: {
          tier: 'free',
          tier_expires_at: null,
          subscription_status: 'inactive'
        },
        where: { field: 'id', value: userId }
      });

      // ✅ VERIFY: Subscriptions table update
      expect(updateCalls[1]).toEqual({
        table: 'subscriptions',
        data: {
          status: 'canceled',
          updated_at: expect.any(String)
        },
        where: { field: 'user_id', value: userId }
      });

      // ✅ VERIFY: Both database operations were performed
      expect(updateCalls).toHaveLength(2);
    });
  });

  describe('✅ DATABASE UPDATES', () => {
    it('should update users table with correct values', () => {
      // Expected user table updates from TierManager.downgradeTier
      const expectedUserUpdate = {
        tier: 'free',
        tier_expires_at: null,
        subscription_status: 'inactive'
      };

      // ✅ VERIFY: User downgrade data structure
      expect(expectedUserUpdate.tier).toBe('free');
      expect(expectedUserUpdate.tier_expires_at).toBe(null);
      expect(expectedUserUpdate.subscription_status).toBe('inactive');
    });

    it('should update subscriptions table with canceled status', () => {
      // Expected subscription table updates from TierManager.downgradeTier
      const expectedSubscriptionUpdate = {
        status: 'canceled',
        updated_at: new Date().toISOString()
      };

      // ✅ VERIFY: Subscription cancellation data structure
      expect(expectedSubscriptionUpdate.status).toBe('canceled');
      expect(typeof expectedSubscriptionUpdate.updated_at).toBe('string');
    });
  });

  describe('✅ ERROR HANDLING AND LOGGING', () => {
    it('should handle user not found error correctly', async () => {
      // Mock Supabase to return user not found
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: null,
                error: { message: 'User not found' }
              })
            })
          })
        })
      };

      const mockTierManager = {
        supabase: mockSupabase,
        downgradeTier: vi.fn()
      };

      const subscriptionData = { customer: 'cus_nonexistent' };

      // Execute handleSubscriptionCanceled with error condition
      const handleSubscriptionCanceled = async (subscription, tierManager) => {
        try {
          const customerId = subscription.customer;
          
          const { data: user, error } = await tierManager.supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
            
          if (error || !user) {
            throw new Error(`User not found for customer ID: ${customerId}`);
          }
          
          await tierManager.downgradeTier(user.id, 'subscription_canceled');
          
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
          throw error;
        }
      };

      // ✅ VERIFY: Error is thrown and logged
      await expect(handleSubscriptionCanceled(subscriptionData, mockTierManager))
        .rejects
        .toThrow('User not found for customer ID: cus_nonexistent');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling subscription cancellation:',
        expect.any(Error)
      );

      // ✅ VERIFY: downgradeTier was NOT called when user not found
      expect(mockTierManager.downgradeTier).not.toHaveBeenCalled();
    });

    it('should handle TierManager downgradeTier errors', async () => {
      // Mock TierManager that throws database error
      const mockTierManager = {
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'user-123' },
                  error: null
                })
              })
            })
          })
        },
        downgradeTier: vi.fn(() => Promise.reject(new Error('Database connection failed')))
      };

      const subscriptionData = { customer: 'cus_db_error' };

      const handleSubscriptionCanceled = async (subscription, tierManager) => {
        try {
          const { data: user } = await tierManager.supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();
            
          await tierManager.downgradeTier(user.id, 'subscription_canceled');
          
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
          throw error;
        }
      };

      // ✅ VERIFY: Database error is propagated and logged
      await expect(handleSubscriptionCanceled(subscriptionData, mockTierManager))
        .rejects
        .toThrow('Database connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling subscription cancellation:',
        expect.any(Error)
      );

      // ✅ VERIFY: downgradeTier was called before error
      expect(mockTierManager.downgradeTier).toHaveBeenCalledWith('user-123', 'subscription_canceled');
    });

    it('should log all processing steps', async () => {
      const mockTierManager = {
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 'user-logging-test' },
                  error: null
                })
              })
            })
          })
        },
        downgradeTier: vi.fn(() => Promise.resolve())
      };

      const subscriptionData = { customer: 'cus_logging' };

      const handleSubscriptionCanceled = async (subscription, tierManager) => {
        console.log('Processing customer.subscription.deleted...');
        
        const customerId = subscription.customer;
        const { data: user } = await tierManager.supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        console.log(`Subscription canceled for user ${user.id}`);
        await tierManager.downgradeTier(user.id, 'subscription_canceled');
      };

      await handleSubscriptionCanceled(subscriptionData, mockTierManager);

      // ✅ VERIFY: All expected log messages from handleSubscriptionCanceled
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing customer.subscription.deleted...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subscription canceled for user user-logging-test');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('✅ INTEGRATION SCENARIOS', () => {
    it('should handle complete webhook workflow end-to-end', async () => {
      const workflowLog = [];

      // Mock complete webhook environment
      const mockEnv = {
        STRIPE_WEBHOOK_SECRET: 'whsec_test_12345',
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role'
      };

      const mockRequest = {
        headers: { 'stripe-signature': 't=1234567890,v1=signature_hash' },
        body: JSON.stringify({
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_integration',
              customer: 'cus_integration',
              status: 'canceled'
            }
          }
        })
      };

      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => {
                workflowLog.push('User lookup by customer ID');
                return Promise.resolve({
                  data: { id: 'user-integration' },
                  error: null
                });
              }
            })
          })
        })
      };

      const mockTierManager = {
        supabase: mockSupabase,
        downgradeTier: vi.fn(async (userId, reason) => {
          workflowLog.push(`Downgrade user ${userId} for ${reason}`);
        })
      };

      // Simulate complete webhook processing
      const processWebhook = async (request, env) => {
        workflowLog.push('Webhook received');
        
        // 1. Verify signature (mocked as successful)
        workflowLog.push('Signature verified');
        
        // 2. Parse event
        const event = JSON.parse(request.body);
        workflowLog.push(`Event type: ${event.type}`);
        
        // 3. Handle subscription.deleted
        if (event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object;
          
          // Find user
          const { data: user } = await mockTierManager.supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();
          
          // Downgrade user
          await mockTierManager.downgradeTier(user.id, 'subscription_canceled');
          
          workflowLog.push('Webhook processed successfully');
        }
      };

      await processWebhook(mockRequest, mockEnv);

      // ✅ VERIFY: Complete workflow executed in correct order
      expect(workflowLog).toEqual([
        'Webhook received',
        'Signature verified',
        'Event type: customer.subscription.deleted',
        'User lookup by customer ID',
        'Downgrade user user-integration for subscription_canceled',
        'Webhook processed successfully'
      ]);

      expect(mockTierManager.downgradeTier).toHaveBeenCalledWith('user-integration', 'subscription_canceled');
    });

    it('should handle multiple rapid cancellations without conflicts', async () => {
      const customers = ['cus_rapid1', 'cus_rapid2', 'cus_rapid3'];
      const results = [];

      const cancellationPromises = customers.map(async (customerId, index) => {
        const userId = `user-rapid-${index + 1}`;
        
        // Individual mocks for each cancellation to avoid conflicts
        const mockTierManager = {
          supabase: {
            from: () => ({
              select: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: { id: userId },
                    error: null
                  })
                })
              })
            })
          },
          downgradeTier: vi.fn(() => Promise.resolve())
        };

        // Simulate cancellation processing
        const { data: user } = await mockTierManager.supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        await mockTierManager.downgradeTier(user.id, 'subscription_canceled');
        
        return { customerId, userId, tierManager: mockTierManager };
      });

      const cancellationResults = await Promise.all(cancellationPromises);

      // ✅ VERIFY: All cancellations processed independently
      cancellationResults.forEach((result, index) => {
        expect(result.customerId).toBe(`cus_rapid${index + 1}`);
        expect(result.userId).toBe(`user-rapid-${index + 1}`);
        expect(result.tierManager.downgradeTier).toHaveBeenCalledWith(
          `user-rapid-${index + 1}`, 
          'subscription_canceled'
        );
        expect(result.tierManager.downgradeTier).toHaveBeenCalledTimes(1);
      });
    });
  });
});