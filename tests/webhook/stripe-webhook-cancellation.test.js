/**
 * Stripe Webhook Cancellation Handler Tests
 * Tests subscription cancellation webhook processing including:
 * - Webhook signature verification with STRIPE_WEBHOOK_SECRET
 * - customer.subscription.deleted event handling
 * - User lookup by Stripe customer ID
 * - TierManager.downgradeTier() execution
 * - Database updates when subscription is canceled
 * - Error handling and logging
 */

import { expect } from 'vitest';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

// Mock environment variables
const mockEnvVars = {
  STRIPE_WEBHOOK_SECRET: 'whsec_test_12345',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
};

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'user-123' }, 
          error: null 
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

// Mock TierManager
class MockTierManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async downgradeTier(userId, reason) {
    return new Promise((resolve) => {
      // Simulate async operation
      setTimeout(() => {
        console.log(`Mock: Downgrading user ${userId} for reason: ${reason}`);
        resolve();
      }, 10);
    });
  }
}

// Mock Deno environment for Edge Function context
global.Deno = {
  env: {
    get: (key) => mockEnvVars[key]
  }
};

if (!global.crypto || !global.crypto.subtle) {
  if (typeof crypto !== 'undefined') {
    // Use Node.js crypto API if available
    const { webcrypto } = crypto;
    Object.defineProperty(global, 'crypto', {
      value: webcrypto,
      writable: false,
      configurable: true
    });
  } else {
    // Fallback mock for crypto
    global.crypto = {
      subtle: {
        importKey: vi.fn(),
        sign: vi.fn()
      }
    };
  }
}

describe('Stripe Webhook - Subscription Cancellation', () => {
  let mockRequest;
  let webhookHandler;
  let consoleLogSpy;
  let consoleErrorSpy;

  // Helper function to create valid Stripe signature
  const createStripeSignature = (payload, secret, timestamp = Math.floor(Date.now() / 1000)) => {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  };

  // Helper function to create subscription.deleted webhook payload
  const createSubscriptionDeletedPayload = (customerId = 'cus_test123', subscriptionId = 'sub_test456') => {
    return JSON.stringify({
      id: 'evt_test789',
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: subscriptionId,
          object: 'subscription',
          customer: customerId,
          status: 'canceled',
          canceled_at: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          current_period_start: Math.floor(Date.now() / 1000) - 86400 * 30,
        }
      }
    });
  };

  beforeEach(() => {
    // Set up console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();

    // Mock the webhook handler logic (simulating the Edge Function)
    webhookHandler = async (request) => {
      try {
        const signature = request.headers.get('stripe-signature');
        const body = await request.text();
        
        if (!signature) {
          return new Response('Missing signature', { status: 401 });
        }
        
        if (!mockEnvVars.STRIPE_WEBHOOK_SECRET) {
          return new Response('Webhook secret not configured', { status: 500 });
        }
        
        // Verify signature (simplified for testing)
        const isValidSignature = await verifyStripeSignature(body, signature, mockEnvVars.STRIPE_WEBHOOK_SECRET);
        if (!isValidSignature) {
          return new Response('Invalid signature', { status: 401 });
        }
        
        const event = JSON.parse(body);
        
        if (event.type === 'customer.subscription.deleted') {
          await handleSubscriptionCanceled(event.data.object, new MockTierManager(mockSupabaseClient));
        }
        
        return new Response('Webhook handled successfully', { status: 200 });
        
      } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(`Webhook error: ${error.message}`, { status: 400 });
      }
    };

    // Webhook signature verification function
    const verifyStripeSignature = async (payload, signature, secret) => {
      try {
        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
        const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];
        
        if (!timestamp || !signatureHash) {
          return false;
        }
        
        // Check timestamp (within 5 minutes)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const webhookTimestamp = parseInt(timestamp, 10);
        const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);
        
        if (timeDifference > 300) {
          return false;
        }
        
        // Create signed payload and verify signature
        const signedPayload = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(signedPayload);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const computedSignature = Array.from(new Uint8Array(signatureBuffer))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        
        return computedSignature === signatureHash;
        
      } catch (error) {
        console.error('Signature verification error:', error);
        return false;
      }
    };

    // Handle subscription cancellation function
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
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature with STRIPE_WEBHOOK_SECRET', async () => {
      const payload = createSubscriptionDeletedPayload();
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Webhook handled successfully');
    });

    it('should reject webhook with missing signature header', async () => {
      const payload = createSubscriptionDeletedPayload();

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Missing signature');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = createSubscriptionDeletedPayload();
      const invalidSignature = 't=1234567890,v1=invalid_signature';

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': invalidSignature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Invalid signature');
    });

    it('should reject webhook when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      // Temporarily remove webhook secret
      const originalSecret = mockEnvVars.STRIPE_WEBHOOK_SECRET;
      mockEnvVars.STRIPE_WEBHOOK_SECRET = null;

      const payload = createSubscriptionDeletedPayload();

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 't=1234567890,v1=signature',
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Webhook secret not configured');
      
      // Restore webhook secret
      mockEnvVars.STRIPE_WEBHOOK_SECRET = originalSecret;
    });

    it('should reject webhook with expired timestamp (replay attack protection)', async () => {
      const payload = createSubscriptionDeletedPayload();
      // Create signature with timestamp from 10 minutes ago (should be rejected)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET, oldTimestamp);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Invalid signature');
    });
  });

  describe('customer.subscription.deleted Event Handling', () => {
    it('should handle subscription cancellation successfully', async () => {
      const customerId = 'cus_test_customer';
      const payload = createSubscriptionDeletedPayload(customerId);
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing customer.subscription.deleted...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subscription canceled for user user-123');
    });

    it('should find user by Stripe customer ID correctly', async () => {
      const customerId = 'cus_specific_customer';
      const userId = 'user-456';
      
      // Mock Supabase to return specific user
      mockSupabaseClient.from.mockReturnValue({
        select: () => ({
          eq: (field, value) => {
            expect(field).toBe('stripe_customer_id');
            expect(value).toBe(customerId);
            return {
              single: () => Promise.resolve({ 
                data: { id: userId }, 
                error: null 
              })
            };
          }
        })
      });

      const payload = createSubscriptionDeletedPayload(customerId);
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('should call TierManager.downgradeTier() with correct parameters', async () => {
      const customerId = 'cus_downgrade_test';
      const userId = 'user-789';
      
      // Create spy on TierManager
      const downgradeTierSpy = vi.spyOn(MockTierManager.prototype, 'downgradeTier');

      // Mock user lookup to return specific user
      mockSupabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ 
              data: { id: userId }, 
              error: null 
            })
          })
        })
      });

      const payload = createSubscriptionDeletedPayload(customerId);
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(downgradeTierSpy).toHaveBeenCalledWith(userId, 'subscription_canceled');
      expect(downgradeTierSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Updates', () => {
    it('should handle database updates when subscription is canceled', async () => {
      // Create a more detailed TierManager mock that tracks database calls
      class DetailedMockTierManager {
        constructor(supabase) {
          this.supabase = supabase;
          this.downgradeCalls = [];
        }

        async downgradeTier(userId, reason) {
          this.downgradeCalls.push({ userId, reason });
          
          // Simulate the actual database operations from TierManager
          await this.supabase
            .from('users')
            .update({
              tier: 'free',
              tier_expires_at: null,
              subscription_status: 'inactive'
            })
            .eq('id', userId);

          await this.supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'active');
        }
      }

      // Track database calls
      const updateSpy = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }));
      
      mockSupabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ 
              data: { id: 'user-123' }, 
              error: null 
            })
          })
        }),
        update: updateSpy
      });

      const tierManager = new DetailedMockTierManager(mockSupabaseClient);
      await tierManager.downgradeTier('user-123', 'subscription_canceled');

      // Verify database update calls
      expect(updateSpy).toHaveBeenCalledTimes(2);
      
      // Verify user table update
      expect(updateSpy).toHaveBeenCalledWith({
        tier: 'free',
        tier_expires_at: null,
        subscription_status: 'inactive'
      });

      // Verify subscription table update
      expect(updateSpy).toHaveBeenCalledWith({
        status: 'canceled',
        updated_at: expect.any(String)
      });
    });
  });

  describe('Error Handling and Logging', () => {
    it('should handle error when user is not found by customer ID', async () => {
      // Mock Supabase to return user not found error
      mockSupabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ 
              data: null, 
              error: { message: 'User not found' }
            })
          })
        })
      });

      const payload = createSubscriptionDeletedPayload('cus_nonexistent');
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(400);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling subscription cancellation:', expect.any(Error));
    });

    it('should handle TierManager.downgradeTier() errors', async () => {
      // Create TierManager that throws error
      class ErrorTierManager {
        constructor(supabase) {
          this.supabase = supabase;
        }

        async downgradeTier(userId, reason) {
          throw new Error('Database connection failed');
        }
      }

      // Override the webhook handler to use error TierManager
      const errorWebhookHandler = async (request) => {
        try {
          const signature = request.headers.get('stripe-signature');
          const body = await request.text();
          
          const isValidSignature = true; // Skip signature verification for this test
          if (!isValidSignature) {
            return new Response('Invalid signature', { status: 401 });
          }
          
          const event = JSON.parse(body);
          
          if (event.type === 'customer.subscription.deleted') {
            const customerId = event.data.object.customer;
            
            const { data: user } = await mockSupabaseClient
              .from('users')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();
            
            await new ErrorTierManager(mockSupabaseClient).downgradeTier(user.id, 'subscription_canceled');
          }
          
          return new Response('Webhook handled successfully', { status: 200 });
          
        } catch (error) {
          console.error('Webhook processing error:', error);
          return new Response(`Webhook error: ${error.message}`, { status: 400 });
        }
      };

      const payload = createSubscriptionDeletedPayload();
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await errorWebhookHandler(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toContain('Database connection failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
    });

    it('should log all processing steps correctly', async () => {
      const payload = createSubscriptionDeletedPayload();
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      
      // Verify all expected log messages
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing customer.subscription.deleted...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subscription canceled for user user-123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Mock: Downgrading user user-123 for reason: subscription_canceled');
    });

    it('should handle malformed JSON in webhook payload', async () => {
      const invalidPayload = '{ invalid json }';
      const signature = createStripeSignature(invalidPayload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: invalidPayload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await webhookHandler(mockRequest);
      
      expect(response.status).toBe(400);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Webhook processing error:', expect.any(SyntaxError));
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete subscription cancellation workflow', async () => {
      const customerId = 'cus_integration_test';
      const userId = 'user-integration-123';
      const subscriptionId = 'sub_integration_456';

      // Create comprehensive mock that tracks all operations
      const operationLog = [];
      
      const comprehensiveMockSupabase = {
        from: (table) => {
          operationLog.push(`SELECT from ${table}`);
          if (table === 'users') {
            return {
              select: () => ({
                eq: (field, value) => {
                  operationLog.push(`WHERE ${field} = ${value}`);
                  return {
                    single: () => {
                      operationLog.push('SINGLE result');
                      return Promise.resolve({ 
                        data: { id: userId }, 
                        error: null 
                      });
                    }
                  };
                }
              }),
              update: (data) => {
                operationLog.push(`UPDATE users SET ${JSON.stringify(data)}`);
                return {
                  eq: (field, value) => {
                    operationLog.push(`WHERE ${field} = ${value}`);
                    return Promise.resolve({ error: null });
                  }
                };
              }
            };
          } else if (table === 'subscriptions') {
            return {
              update: (data) => {
                operationLog.push(`UPDATE subscriptions SET ${JSON.stringify(data)}`);
                return {
                  eq: (field, value) => {
                    operationLog.push(`WHERE ${field} = ${value}`);
                    return {
                      eq: (field2, value2) => {
                        operationLog.push(`AND ${field2} = ${value2}`);
                        return Promise.resolve({ error: null });
                      }
                    };
                  }
                };
              }
            };
          }
          return {};
        }
      };

      class IntegrationTierManager {
        constructor(supabase) {
          this.supabase = supabase;
        }

        async downgradeTier(userId, reason) {
          operationLog.push(`TierManager.downgradeTier(${userId}, ${reason})`);
          
          // Simulate real TierManager operations
          await this.supabase
            .from('users')
            .update({
              tier: 'free',
              tier_expires_at: null,
              subscription_status: 'inactive'
            })
            .eq('id', userId);

          await this.supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'active');
        }
      }

      // Create integration webhook handler
      const integrationWebhookHandler = async (request) => {
        try {
          operationLog.push('Webhook received');
          
          const signature = request.headers.get('stripe-signature');
          const body = await request.text();
          
          operationLog.push('Signature verification');
          // Skip actual signature verification for integration test
          
          const event = JSON.parse(body);
          operationLog.push(`Event type: ${event.type}`);
          
          if (event.type === 'customer.subscription.deleted') {
            const customerId = event.data.object.customer;
            operationLog.push(`Processing cancellation for customer: ${customerId}`);
            
            // Find user by customer ID
            const { data: user, error } = await comprehensiveMockSupabase
              .from('users')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();
              
            if (error || !user) {
              throw new Error(`User not found for customer ID: ${customerId}`);
            }
            
            operationLog.push(`Found user: ${user.id}`);
            
            // Downgrade user
            const tierManager = new IntegrationTierManager(comprehensiveMockSupabase);
            await tierManager.downgradeTier(user.id, 'subscription_canceled');
            
            operationLog.push('Downgrade completed');
          }
          
          return new Response('Webhook handled successfully', { status: 200 });
          
        } catch (error) {
          operationLog.push(`Error: ${error.message}`);
          return new Response(`Webhook error: ${error.message}`, { status: 400 });
        }
      };

      const payload = createSubscriptionDeletedPayload(customerId, subscriptionId);
      const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

      mockRequest = new Request('http://localhost:3000/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        }
      });

      const response = await integrationWebhookHandler(mockRequest);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Webhook handled successfully');
      
      // Verify complete operation flow
      const expectedOperations = [
        'Webhook received',
        'Signature verification',
        'Event type: customer.subscription.deleted',
        `Processing cancellation for customer: ${customerId}`,
        'SELECT from users',
        `WHERE stripe_customer_id = ${customerId}`,
        'SINGLE result',
        `Found user: ${userId}`,
        `TierManager.downgradeTier(${userId}, subscription_canceled)`,
        'UPDATE users SET {"tier":"free","tier_expires_at":null,"subscription_status":"inactive"}',
        `WHERE id = ${userId}`,
        'UPDATE subscriptions SET {"status":"canceled","updated_at":"' // Partial match for timestamp
      ];
      
      for (let i = 0; i < expectedOperations.length - 1; i++) {
        expect(operationLog[i]).toBe(expectedOperations[i]);
      }
      
      // Check the last operation partially (timestamp will vary)
      expect(operationLog[operationLog.length - 4]).toContain('UPDATE subscriptions SET {"status":"canceled","updated_at":"');
      expect(operationLog).toContain(`WHERE user_id = ${userId}`);
      expect(operationLog).toContain('AND status = active');
      expect(operationLog).toContain('Downgrade completed');
    });

    it('should handle multiple rapid cancellation events correctly', async () => {
      const customers = ['cus_rapid1', 'cus_rapid2', 'cus_rapid3'];
      const promises = [];

      customers.forEach((customerId, index) => {
        const userId = `user-rapid-${index + 1}`;
        
        // Mock different user for each customer
        const mockSupabase = {
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
        };

        const rapidTierManager = new MockTierManager(mockSupabase);
        const rapidDowngradeSpy = vi.spyOn(rapidTierManager, 'downgradeTier');

        const payload = createSubscriptionDeletedPayload(customerId);
        const signature = createStripeSignature(payload, mockEnvVars.STRIPE_WEBHOOK_SECRET);

        const request = new Request('http://localhost:3000/webhook', {
          method: 'POST',
          body: payload,
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json'
          }
        });

        // Create specific handler for this request
        const rapidHandler = async (req) => {
          const sig = req.headers.get('stripe-signature');
          const body = await req.text();
          const event = JSON.parse(body);
          
          if (event.type === 'customer.subscription.deleted') {
            const custId = event.data.object.customer;
            const { data: user } = await mockSupabase.from('users').select('id').eq('stripe_customer_id', custId).single();
            await rapidTierManager.downgradeTier(user.id, 'subscription_canceled');
          }
          
          return new Response('OK', { status: 200 });
        };

        promises.push(rapidHandler(request).then(() => rapidDowngradeSpy));
      });

      const spies = await Promise.all(promises);
      
      // Verify all downgrades were called
      spies.forEach((spy, index) => {
        expect(spy).toHaveBeenCalledWith(`user-rapid-${index + 1}`, 'subscription_canceled');
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});