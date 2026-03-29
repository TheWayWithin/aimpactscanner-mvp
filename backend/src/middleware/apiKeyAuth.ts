import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { supabaseAdmin } from '../lib/supabase';
import { AuthenticatedRequest, SubscriptionTier } from './auth';

interface ApiKeyRecord {
  id: string;
  user_id: string;
  is_active: boolean;
  revoked_at: string | null;
}

/**
 * Hash an API key using SHA-256
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * API Key Authentication Middleware
 *
 * Authenticates requests using X-API-Key header.
 * Looks up the SHA-256 hash, verifies the key is active and user is Scale tier.
 * Attaches req.user with the same shape as JWT auth.
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      res.status(401).json({
        error: 'Missing X-API-Key header',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // Validate key format
    if (!apiKey.startsWith('ais_sk_') || apiKey.length !== 39) {
      res.status(401).json({
        error: 'Invalid API key format',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    const keyHash = hashApiKey(apiKey);

    // Look up key by hash
    const { data: rawKeyRecord, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, is_active, revoked_at')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    const keyRecord = rawKeyRecord as unknown as ApiKeyRecord | null;

    if (keyError || !keyRecord) {
      res.status(401).json({
        error: 'Invalid or revoked API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    // Fetch user tier
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('tier, subscription_tier, subscription_status')
      .eq('id', keyRecord.user_id)
      .single();

    if (userError || !userData) {
      res.status(401).json({
        error: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Normalize tier
    const userRecord = userData as { tier?: string | null; subscription_tier?: string | null };
    const rawTier = (userRecord.tier || userRecord.subscription_tier || 'free').toLowerCase();
    let tier: SubscriptionTier = 'free';
    if (rawTier === 'professional') tier = 'growth';
    else if (rawTier === 'enterprise') tier = 'scale';
    else if (['free', 'coffee', 'growth', 'scale'].includes(rawTier)) {
      tier = rawTier as SubscriptionTier;
    }

    // Verify Scale tier
    if (tier !== 'scale') {
      res.status(403).json({
        error: 'API access requires Scale tier',
        code: 'TIER_INSUFFICIENT'
      });
      return;
    }

    // Fetch user email from auth.users
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(keyRecord.user_id);

    // Attach user to request (same shape as JWT auth)
    (req as AuthenticatedRequest).user = {
      id: keyRecord.user_id,
      email: authUser?.email,
      tier
    };

    // Update last_used_at (fire and forget)
    supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq('id', keyRecord.id)
      .then();

    next();
  } catch (err) {
    console.error('API key authentication error:', err);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}
