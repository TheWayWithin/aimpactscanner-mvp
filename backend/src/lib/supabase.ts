import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase Admin Client (Service Role)
 *
 * SECURITY: This client bypasses Row Level Security (RLS) and should ONLY
 * be used for server-side operations. NEVER expose service role key to frontend.
 *
 * Use cases:
 * - Creating analysis records with system permissions
 * - Updating analysis status/results
 * - Generating LLMs.txt files with full data access
 * - Reading user tier for rate limiting
 *
 * Aligned with existing Supabase patterns from src/lib/supabaseClient.js
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

/**
 * Create a Supabase client for a specific user (from JWT)
 *
 * This respects Row Level Security (RLS) and should be used for
 * user-scoped operations where we want RLS policies to apply.
 *
 * Uses PKCE flow consistent with frontend supabaseClient.js
 *
 * @param accessToken - User's JWT access token from Authorization header
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
}

console.log('🔗 Supabase clients initialized for AImpactScanner backend');
