import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateApiKey } from './apiKeyAuth';

/**
 * Subscription tier types - aligned with existing tierUtils.js
 *
 * Tier mapping (from existing codebase):
 * - 'free' = Free tier (5 lifetime analyses)
 * - 'coffee' = Solo tier ($5.95/mo, 10 analyses/mo)
 * - 'growth' = Growth tier ($17.95/mo, 40 analyses/mo)
 * - 'scale' = Scale tier ($49.95/mo, 100 analyses/mo)
 *
 * Legacy mappings (for backward compatibility):
 * - 'professional' -> 'growth'
 * - 'enterprise' -> 'scale'
 */
export type SubscriptionTier = 'free' | 'coffee' | 'growth' | 'scale';

/**
 * Extended Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    tier: SubscriptionTier;
  };
}

/**
 * Normalize tier name for backward compatibility
 * Aligned with hasFeatureAccess() pattern in tierUtils.js
 */
function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (!tier) return 'free';

  const tierLower = tier.toLowerCase();

  // Map legacy tier names
  if (tierLower === 'professional') return 'growth';
  if (tierLower === 'enterprise') return 'scale';

  // Validate known tiers
  if (['free', 'coffee', 'growth', 'scale'].includes(tierLower)) {
    return tierLower as SubscriptionTier;
  }

  return 'free';
}

/**
 * Dual Authentication Middleware
 *
 * Supports two auth methods:
 * 1. API Key via X-API-Key header (Scale tier only)
 * 2. JWT via Authorization: Bearer header (all tiers)
 *
 * Both methods attach the same req.user shape for downstream middleware.
 *
 * SECURITY:
 * - API key: SHA-256 hash lookup, Scale tier verification
 * - JWT: Verifies signature using Supabase, checks expiration
 * - Fetches user tier from database for rate limiting
 *
 * Usage:
 * app.post('/api/analyze', authenticateUser, analyzeHandler);
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check for API key first
  if (req.headers['x-api-key']) {
    return authenticateApiKey(req, res, next);
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing or invalid Authorization header',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error:', error);
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Fetch user tier from users table
    // Aligned with getActualUserTier() pattern in tierUtils.js
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('tier, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    let tier: SubscriptionTier = 'free';

    if (!userError && userData) {
      // Use tier or subscription_tier, with normalization
      // Type assertion needed as Supabase types userData based on Database interface
      const userRecord = userData as { tier?: string | null; subscription_tier?: string | null };
      tier = normalizeTier(userRecord.tier || userRecord.subscription_tier);
    } else {
      console.warn('Could not fetch user tier, defaulting to free:', userError);
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      tier
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Optional Authentication Middleware
 *
 * Attempts to authenticate but allows request to proceed if no token provided.
 * Useful for endpoints that have different behavior for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user
    next();
    return;
  }

  // Auth provided, validate it
  await authenticateUser(req, res, next);
}
