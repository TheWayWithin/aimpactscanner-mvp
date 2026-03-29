/**
 * API Key Management Routes
 *
 * POST   /api/keys     - Create a new API key (returns raw key once)
 * GET    /api/keys     - List user's API keys
 * DELETE /api/keys/:id - Revoke an API key (soft delete)
 *
 * All routes require JWT auth (not API key auth).
 * Keys are managed via the dashboard only.
 */

import { Router, Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// All key management requires JWT auth
router.use(authenticateUser);

const MAX_ACTIVE_KEYS = 10;
const KEY_PREFIX = 'ais_sk_';
const KEY_RANDOM_BYTES = 16; // 16 bytes = 32 hex chars

interface ApiKeyInsertRecord {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
}

interface ApiKeyListRecord {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
}

interface ApiKeyExistingRecord {
  id: string;
  user_id: string;
  is_active: boolean;
}

/**
 * Generate a new API key
 * Format: ais_sk_ + 32 random hex chars = 39 chars total
 */
function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomPart = randomBytes(KEY_RANDOM_BYTES).toString('hex');
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 12); // "ais_sk_xxxxx"
  return { raw, hash, prefix };
}

/**
 * POST /api/keys - Create a new API key
 */
router.post('/', async (req, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    // Verify Scale tier
    if (user.tier !== 'scale') {
      res.status(403).json({
        error: 'API keys require Scale tier',
        code: 'TIER_INSUFFICIENT'
      });
      return;
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Key name is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    if (name.trim().length > 64) {
      res.status(400).json({
        error: 'Key name must be 64 characters or less',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Check active key count
    const { count, error: countError } = await supabaseAdmin
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting API keys:', countError);
      res.status(500).json({ error: 'Failed to create API key', code: 'INTERNAL_ERROR' });
      return;
    }

    if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
      res.status(400).json({
        error: `Maximum of ${MAX_ACTIVE_KEYS} active API keys allowed`,
        code: 'KEY_LIMIT_REACHED'
      });
      return;
    }

    // Generate key
    const { raw, hash, prefix } = generateApiKey();

    // Store hashed key
    const { data: rawKeyRecord, error: insertError } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
      } as never)
      .select('id, name, key_prefix, created_at')
      .single();

    const keyRecord = rawKeyRecord as unknown as ApiKeyInsertRecord | null;

    if (insertError || !keyRecord) {
      console.error('Error inserting API key:', insertError);
      res.status(500).json({ error: 'Failed to create API key', code: 'INTERNAL_ERROR' });
      return;
    }

    // Return raw key ONCE - it cannot be retrieved again
    res.status(201).json({
      id: keyRecord.id,
      name: keyRecord.name,
      key: raw,
      prefix: keyRecord.key_prefix,
      created_at: keyRecord.created_at,
      warning: 'Save this key now. It cannot be shown again.'
    });
  } catch (err) {
    console.error('Error creating API key:', err);
    res.status(500).json({ error: 'Failed to create API key', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/keys - List user's API keys
 */
router.get('/', async (req, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    // Verify Scale tier
    if (user.tier !== 'scale') {
      res.status(403).json({
        error: 'API keys require Scale tier',
        code: 'TIER_INSUFFICIENT'
      });
      return;
    }

    const { data: rawKeys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, is_active, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const keys = rawKeys as unknown as ApiKeyListRecord[] | null;

    if (error) {
      console.error('Error listing API keys:', error);
      res.status(500).json({ error: 'Failed to list API keys', code: 'INTERNAL_ERROR' });
      return;
    }

    res.json({ keys: keys || [] });
  } catch (err) {
    console.error('Error listing API keys:', err);
    res.status(500).json({ error: 'Failed to list API keys', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/keys/:id - Revoke an API key (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const keyId = req.params.id;

    // Verify ownership and existence
    const { data: rawExisting, error: fetchError } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single();

    const existing = rawExisting as unknown as ApiKeyExistingRecord | null;

    if (fetchError || !existing) {
      res.status(404).json({
        error: 'API key not found',
        code: 'NOT_FOUND'
      });
      return;
    }

    if (!existing.is_active) {
      res.status(400).json({
        error: 'API key is already revoked',
        code: 'ALREADY_REVOKED'
      });
      return;
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString()
      } as never)
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error revoking API key:', updateError);
      res.status(500).json({ error: 'Failed to revoke API key', code: 'INTERNAL_ERROR' });
      return;
    }

    res.json({ success: true, message: 'API key revoked' });
  } catch (err) {
    console.error('Error revoking API key:', err);
    res.status(500).json({ error: 'Failed to revoke API key', code: 'INTERNAL_ERROR' });
  }
});

export default router;
