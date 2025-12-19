import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AuthenticatedRequest, SubscriptionTier } from './auth';

/**
 * Rate Limiting Configuration
 *
 * Tier-based rate limits aligned with existing tierUtils.js:
 * - free: 5 analyses/hour (aligned with 5 lifetime limit for free)
 * - coffee (Solo): 20 analyses/hour
 * - growth: 50 analyses/hour
 * - scale: 100 analyses/hour
 *
 * Based on monthly limits from getTierDisplayInfo():
 * - free: 3/month (now 5 lifetime) -> 5/hour for API
 * - coffee: 10/month -> 20/hour for API
 * - growth: 40/month -> 50/hour for API
 * - scale: 100/month -> 100/hour for API
 */

interface TierLimit {
  windowMs: number;
  max: number;
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimit> = {
  free: { windowMs: 60 * 60 * 1000, max: 5 },      // 5 per hour
  coffee: { windowMs: 60 * 60 * 1000, max: 20 },   // 20 per hour
  growth: { windowMs: 60 * 60 * 1000, max: 50 },   // 50 per hour
  scale: { windowMs: 60 * 60 * 1000, max: 100 }    // 100 per hour
};

/**
 * Create tier-based rate limiter
 *
 * Uses user's subscription tier to determine rate limit.
 * Falls back to free tier limits if tier not available.
 *
 * Aligned with hasFeatureAccess() pattern from tierUtils.js
 */
export const createTierRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: (req: Request) => {
      const tier = (req as AuthenticatedRequest).user?.tier || 'free';
      return TIER_LIMITS[tier].max;
    },
    message: (req: Request) => {
      const tier = (req as AuthenticatedRequest).user?.tier || 'free';
      const tierDisplayNames: Record<SubscriptionTier, string> = {
        free: 'Free',
        coffee: 'Solo',
        growth: 'Growth',
        scale: 'Scale'
      };
      return {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        tier: tierDisplayNames[tier],
        limit: TIER_LIMITS[tier].max,
        window: '1 hour',
        message: `You have exceeded the ${tierDisplayNames[tier]} tier limit of ${TIER_LIMITS[tier].max} requests per hour. Please upgrade your plan or try again later.`
      };
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID for authenticated requests, IP for anonymous
      const userId = (req as AuthenticatedRequest).user?.id;
      return userId || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

/**
 * Global rate limiter (stricter, for all endpoints)
 * Prevents abuse from unauthenticated endpoints
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    error: 'Too many requests',
    code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    // Skip for llmstxt endpoint - it has its own auth and tier-based rate limiting
    // Status polling can make many requests during long-running site crawls
    if (req.path === '/api/llmstxt') return true;
    return false;
  }
});
