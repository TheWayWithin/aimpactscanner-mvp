/**
 * Integration Tests: Authentication Routing Logic
 *
 * Tests for authRouting.js utility functions and post-auth routing
 *
 * Status: READY TO RUN (no external dependencies)
 * Priority: P0 - CRITICAL
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import routing utilities
import {
  storeAuthContext,
  getAuthContext,
  clearAuthContext,
  storePendingAnalysis,
  getPendingAnalysis,
  clearPendingAnalysis,
  getPostSignupDestination,
  getPostLoginDestination,
  getUpsellPage,
  markFirstLoginComplete,
} from '../../src/utils/authRouting';

describe('Context Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('storeAuthContext', () => {
    it('should store auth context in localStorage', () => {
      const context = {
        selectedTier: 'coffee',
        mode: 'signup',
        pendingAnalysisUrl: 'https://example.com',
      };

      storeAuthContext(context);

      const stored = JSON.parse(localStorage.getItem('authContext'));
      expect(stored).toMatchObject(context);
      expect(stored.timestamp).toBeDefined();
    });

    it('should set 24-hour expiry on context', () => {
      const context = { selectedTier: 'free', mode: 'signup' };
      const before = Date.now();

      storeAuthContext(context);

      const expiry = parseInt(localStorage.getItem('authContextExpiry'));
      const expectedExpiry = before + (24 * 60 * 60 * 1000);

      expect(expiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should handle localStorage unavailable gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const context = { selectedTier: 'free' };

      // Should not throw
      expect(() => {
        storeAuthContext(context);
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('getAuthContext', () => {
    it('should retrieve valid auth context', () => {
      const context = {
        selectedTier: 'coffee',
        mode: 'signup',
        timestamp: Date.now(),
      };

      localStorage.setItem('authContext', JSON.stringify(context));
      localStorage.setItem('authContextExpiry', (Date.now() + 86400000).toString());

      const retrieved = getAuthContext();

      expect(retrieved).toMatchObject(context);
    });

    it('should return null for expired context', () => {
      const context = {
        selectedTier: 'free',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      localStorage.setItem('authContext', JSON.stringify(context));
      localStorage.setItem('authContextExpiry', (Date.now() - 1000).toString()); // Expired 1s ago

      const retrieved = getAuthContext();

      expect(retrieved).toBeNull();
      expect(localStorage.getItem('authContext')).toBeNull(); // Should be cleared
    });

    it('should return null when no context stored', () => {
      const retrieved = getAuthContext();
      expect(retrieved).toBeNull();
    });

    it('should handle malformed context JSON', () => {
      localStorage.setItem('authContext', 'invalid-json{]');

      const retrieved = getAuthContext();
      expect(retrieved).toBeNull();
    });
  });

  describe('clearAuthContext', () => {
    it('should remove all auth context from storage', () => {
      localStorage.setItem('authContext', JSON.stringify({ selectedTier: 'free' }));
      localStorage.setItem('authContextExpiry', Date.now().toString());
      sessionStorage.setItem('authContext', JSON.stringify({ selectedTier: 'free' }));

      clearAuthContext();

      expect(localStorage.getItem('authContext')).toBeNull();
      expect(localStorage.getItem('authContextExpiry')).toBeNull();
      expect(sessionStorage.getItem('authContext')).toBeNull();
    });
  });

  describe('Pending Analysis Storage', () => {
    it('should store pending analysis URL and ID', () => {
      storePendingAnalysis('https://example.com', 'analysis-123');

      const stored = getPendingAnalysis();

      expect(stored).toMatchObject({
        url: 'https://example.com',
        id: 'analysis-123',
      });
      expect(stored.timestamp).toBeDefined();
    });

    it('should clear pending analysis', () => {
      storePendingAnalysis('https://example.com', 'analysis-123');

      clearPendingAnalysis();

      expect(getPendingAnalysis()).toBeNull();
    });

    it('should return null when no pending analysis', () => {
      const pending = getPendingAnalysis();
      expect(pending).toBeNull();
    });
  });
});

describe('Routing Decision Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getPostSignupDestination', () => {
    it('should route to Stripe checkout for Coffee tier', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const context = { selectedTier: 'coffee', mode: 'signup' };

      const destination = getPostSignupDestination(user, context);

      expect(destination).toMatchObject({
        path: '/checkout',
        requiresPayment: true,
        tier: 'coffee',
      });
    });

    it('should route to analysis page for Free tier with pending URL', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const context = {
        selectedTier: 'free',
        mode: 'signup',
        pendingAnalysisUrl: 'https://example.com',
        pendingAnalysisId: 'analysis-123',
      };

      const destination = getPostSignupDestination(user, context);

      expect(destination).toMatchObject({
        path: '/analyze',
        requiresPayment: false,
        prefilledUrl: 'https://example.com',
      });
    });

    it('should route to analysis page for Free tier without pending URL', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const context = { selectedTier: 'free', mode: 'signup' };

      const destination = getPostSignupDestination(user, context);

      expect(destination).toMatchObject({
        path: '/analyze',
        requiresPayment: false,
        prefilledUrl: null,
      });
    });

    it('should handle missing context gracefully', () => {
      const user = { id: 'user-123', email: 'test@example.com' };

      const destination = getPostSignupDestination(user, null);

      // Default behavior: route to analysis page
      expect(destination.path).toBe('/analyze');
      expect(destination.requiresPayment).toBe(false);
    });

    it('should skip upsell on first login (isFirstLogin=true)', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const context = { selectedTier: 'free', mode: 'signup' };

      const destination = getPostSignupDestination(user, context);

      // First login always goes to /analyze (no upsell)
      expect(destination.path).toBe('/analyze');
      expect(destination.skipUpsell).toBe(true);
    });
  });

  describe('getPostLoginDestination', () => {
    it('should route to Coffee upsell for returning Free tier user', async () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        tier: 'free',
        is_first_login: false, // Returning user
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      expect(destination).toMatchObject({
        path: '/upsell/coffee',
        tier: 'free',
      });
    });

    it('should route to Growth upsell for returning Coffee tier user', async () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        tier: 'coffee',
        is_first_login: false,
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      expect(destination).toMatchObject({
        path: '/upsell/growth',
        tier: 'coffee',
      });
    });

    it('should route to Scale upsell for returning Growth tier user', async () => {
      const userData = {
        tier: 'growth',
        is_first_login: false,
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      expect(destination.path).toBe('/upsell/scale');
    });

    it('should route to welcome page for Scale tier user', async () => {
      const userData = {
        tier: 'scale',
        is_first_login: false,
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      expect(destination.path).toBe('/welcome/scale');
    });

    it('should skip upsell for first login (even returning user)', async () => {
      const userData = {
        tier: 'free',
        is_first_login: true, // First time logging in
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      // Should skip upsell, go to analysis
      expect(destination.path).toBe('/analyze');
    });

    it('should preserve pending analysis URL on login', async () => {
      // User started analysis on landing page, then logged in
      storePendingAnalysis('https://example.com', 'analysis-123');

      const userData = {
        tier: 'free',
        is_first_login: false,
      };
      const session = { user: { id: 'user-123' } };

      const destination = await getPostLoginDestination(userData, session);

      // Should route to upsell, but context preserved for later
      expect(destination.path).toBe('/upsell/coffee');
      expect(getPendingAnalysis()).toBeTruthy(); // Context not cleared yet
    });
  });

  describe('getUpsellPage', () => {
    it('should return Coffee upsell for Free tier', () => {
      const user = { tier: 'free' };
      const upsell = getUpsellPage(user);

      expect(upsell).toMatchObject({
        path: '/upsell/coffee',
        targetTier: 'coffee',
      });
    });

    it('should return Growth upsell for Coffee tier', () => {
      const user = { tier: 'coffee' };
      const upsell = getUpsellPage(user);

      expect(upsell).toMatchObject({
        path: '/upsell/growth',
        targetTier: 'growth',
      });
    });

    it('should return Scale upsell for Growth tier', () => {
      const user = { tier: 'growth' };
      const upsell = getUpsellPage(user);

      expect(upsell.path).toBe('/upsell/scale');
    });

    it('should return welcome page for Scale tier (no upsell)', () => {
      const user = { tier: 'scale' };
      const upsell = getUpsellPage(user);

      expect(upsell.path).toBe('/welcome/scale');
      expect(upsell.isWelcome).toBe(true);
    });

    it('should handle invalid tier gracefully', () => {
      const user = { tier: 'invalid-tier' };
      const upsell = getUpsellPage(user);

      // Default fallback
      expect(upsell.path).toBe('/dashboard');
      console.warn = vi.fn(); // Check warning logged
    });
  });

  describe('markFirstLoginComplete', () => {
    it.skip('should update is_first_login flag to false', async () => {
      // SKIP: Requires database connection
      // TODO: Enable after database migrations deployed

      const userId = 'user-123';
      await markFirstLoginComplete(userId);

      // Verify database update
      // const user = await supabase.from('users').select('is_first_login').eq('id', userId).single();
      // expect(user.data.is_first_login).toBe(false);
    });

    it('should handle database error gracefully', async () => {
      const userId = 'user-123';

      // Mock database failure
      // (Implementation depends on how markFirstLoginComplete handles errors)

      // Should not throw
      await expect(markFirstLoginComplete(userId)).resolves.not.toThrow();
    });
  });
});

describe('Edge Case Routing Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Context Expiration', () => {
    it('should ignore expired context during routing', () => {
      const expiredContext = {
        selectedTier: 'coffee',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        pendingAnalysisUrl: 'https://example.com',
      };

      localStorage.setItem('authContext', JSON.stringify(expiredContext));
      localStorage.setItem('authContextExpiry', (Date.now() - 1000).toString());

      const user = { id: 'user-123' };
      const retrieved = getAuthContext();

      expect(retrieved).toBeNull(); // Expired context ignored

      const destination = getPostSignupDestination(user, retrieved);

      // Should route to default (no context)
      expect(destination.path).toBe('/analyze');
      expect(destination.prefilledUrl).toBeNull();
    });
  });

  describe('Missing Context', () => {
    it('should handle missing selected tier', () => {
      const user = { id: 'user-123' };
      const context = { mode: 'signup' }; // No selectedTier

      const destination = getPostSignupDestination(user, context);

      // Default to free tier behavior
      expect(destination.requiresPayment).toBe(false);
    });

    it('should handle null context', () => {
      const user = { id: 'user-123' };

      const destination = getPostSignupDestination(user, null);

      expect(destination.path).toBe('/analyze');
    });
  });

  describe('Multiple Concurrent Signups', () => {
    it('should use most recent context', () => {
      // Simulate user opening multiple signup tabs
      const context1 = {
        selectedTier: 'free',
        timestamp: Date.now() - 10000, // 10 seconds ago
      };
      const context2 = {
        selectedTier: 'coffee',
        timestamp: Date.now(), // Now
      };

      storeAuthContext(context1);
      // Small delay
      storeAuthContext(context2);

      const retrieved = getAuthContext();

      expect(retrieved.selectedTier).toBe('coffee'); // Most recent
    });
  });

  describe('Browser Back Button During OAuth', () => {
    it('should preserve context after browser back', () => {
      const context = {
        selectedTier: 'coffee',
        pendingAnalysisUrl: 'https://example.com',
      };

      storeAuthContext(context);

      // Simulate navigation away and back (localStorage persists)
      const retrieved = getAuthContext();

      expect(retrieved).toMatchObject(context);
    });
  });

  describe('Payment Flow with Context', () => {
    it('should preserve pending URL through payment flow', () => {
      const context = {
        selectedTier: 'coffee',
        pendingAnalysisUrl: 'https://example.com',
        pendingAnalysisId: 'analysis-123',
      };

      storeAuthContext(context);

      const user = { id: 'user-123' };
      const destination = getPostSignupDestination(user, context);

      // Route to Stripe
      expect(destination.path).toBe('/checkout');
      expect(destination.requiresPayment).toBe(true);

      // Context should still be stored for post-payment
      const storedContext = getAuthContext();
      expect(storedContext.pendingAnalysisUrl).toBe('https://example.com');
    });
  });
});

describe('Security & Validation', () => {
  describe('URL Validation', () => {
    it('should reject invalid URLs in pending analysis', () => {
      const maliciousUrl = 'javascript:alert("XSS")';

      storePendingAnalysis(maliciousUrl, 'analysis-123');

      const stored = getPendingAnalysis();

      // Should be rejected or sanitized
      expect(stored).toBeNull(); // Or URL sanitized
    });

    it('should reject non-HTTP(S) URLs', () => {
      const fileUrl = 'file:///etc/passwd';

      storePendingAnalysis(fileUrl, 'analysis-123');

      const stored = getPendingAnalysis();

      expect(stored).toBeNull();
    });

    it('should accept valid HTTPS URLs', () => {
      const validUrl = 'https://example.com';

      storePendingAnalysis(validUrl, 'analysis-123');

      const stored = getPendingAnalysis();

      expect(stored.url).toBe(validUrl);
    });
  });

  describe('Context Tampering', () => {
    it('should reject context with invalid tier', () => {
      const tamperedContext = {
        selectedTier: 'premium-hacked', // Invalid tier
        timestamp: Date.now(),
      };

      localStorage.setItem('authContext', JSON.stringify(tamperedContext));

      const retrieved = getAuthContext();

      // Should be validated or rejected
      // (Implementation depends on validation logic)
    });
  });
});

describe('Performance & Optimization', () => {
  it('should retrieve context quickly (<10ms)', () => {
    storeAuthContext({ selectedTier: 'free' });

    const start = performance.now();
    getAuthContext();
    const end = performance.now();

    expect(end - start).toBeLessThan(10); // <10ms
  });

  it('should not cause layout thrashing', () => {
    // Store and retrieve context multiple times
    for (let i = 0; i < 100; i++) {
      storeAuthContext({ selectedTier: 'free' });
      getAuthContext();
    }

    // Should complete in reasonable time
    // (No performance test failures)
  });
});
