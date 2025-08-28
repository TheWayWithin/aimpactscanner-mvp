/**
 * Webhook Test Setup
 * Configures the test environment for Stripe webhook testing
 */

import { vi } from 'vitest';

// Setup global test environment
globalThis.console = {
  ...console,
  log: vi.fn(console.log),
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
  info: vi.fn(console.info)
};

// Mock global fetch for webhook requests
global.fetch = vi.fn();

// Setup crypto for signature verification
if (!global.crypto) {
  const { webcrypto } = await import('crypto');
  global.crypto = webcrypto;
}

// Mock TextEncoder/TextDecoder for Edge Function compatibility
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// Setup Request/Response for webhook simulation
if (!global.Request) {
  global.Request = class MockRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map();
      this.body = options.body || '';
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    headers = {
      get: (name) => this.headers.get(name.toLowerCase()),
      set: (name, value) => this.headers.set(name.toLowerCase(), value),
      has: (name) => this.headers.has(name.toLowerCase()),
      delete: (name) => this.headers.delete(name.toLowerCase()),
      forEach: (callback) => this.headers.forEach(callback)
    };
    
    async text() {
      return this.body;
    }
    
    async json() {
      return JSON.parse(this.body);
    }
  };
}

if (!global.Response) {
  global.Response = class MockResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || 'OK';
      this.headers = new Map();
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    async text() {
      return this.body;
    }
    
    async json() {
      return JSON.parse(this.body);
    }
  };
}

// Export test utilities
export const webhookTestUtils = {
  createMockStripeEvent: (type, data) => ({
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object: data }
  }),
  
  createMockSubscription: (customerId = 'cus_test', status = 'canceled') => ({
    id: 'sub_test',
    object: 'subscription',
    customer: customerId,
    status,
    canceled_at: status === 'canceled' ? Math.floor(Date.now() / 1000) : null,
    current_period_end: Math.floor(Date.now() / 1000) + 86400,
    current_period_start: Math.floor(Date.now() / 1000) - 86400 * 30,
  }),
  
  createMockSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'test-user-id' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  })
};

console.log('✅ Webhook test environment initialized');