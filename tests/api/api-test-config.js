/**
 * API Test Configuration
 *
 * Credentials and URLs for API key testing against staging.
 * Reads from environment variables with fallback defaults.
 *
 * Required env vars (set in .env.test):
 *   API_TEST_STAGING_URL - Railway backend URL
 *   API_TEST_SUPABASE_URL - Staging Supabase URL
 *   API_TEST_SUPABASE_ANON_KEY - Staging anon key
 *   API_TEST_SUPABASE_SERVICE_KEY - Staging service role key
 *   API_TEST_SCALE_EMAIL - Scale tier test user email
 *   API_TEST_SCALE_PASSWORD - Scale tier test user password
 */

import { config } from 'dotenv';
config({ path: '.env.test' });

export const apiTestConfig = {
  // Backend URL (staging or local)
  backendUrl: process.env.API_TEST_STAGING_URL
    || process.env.VITE_RAILWAY_API_URL
    || 'http://localhost:3001',

  // Staging Supabase
  supabaseUrl: process.env.API_TEST_SUPABASE_URL
    || process.env.VITE_SUPABASE_URL
    || 'https://isgzvwpjokcmtizstwru.supabase.co',

  supabaseAnonKey: process.env.API_TEST_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || '',

  supabaseServiceKey: process.env.API_TEST_SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || '',

  // Scale tier test account (existing test account upgraded to Scale)
  scaleUser: {
    email: process.env.API_TEST_SCALE_EMAIL || 'jamie.watters.mail@icloud.com',
    password: process.env.API_TEST_SCALE_PASSWORD || 'Qwerty123!',
  },

  // Growth tier test account (for tier gating tests — needs a separate user)
  // If not configured, tier gating tests will be skipped
  growthUser: {
    email: process.env.API_TEST_GROWTH_EMAIL || '',
    password: process.env.API_TEST_GROWTH_PASSWORD || '',
  },
};

/**
 * Get a JWT token for a user by signing in via Supabase
 */
export async function getJwtToken(email, password) {
  const resp = await fetch(`${apiTestConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiTestConfig.supabaseAnonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Auth failed for ${email}: ${err.error_description || err.msg || resp.status}`);
  }

  const data = await resp.json();
  return { token: data.access_token, userId: data.user?.id };
}

/**
 * Make an authenticated API request
 */
export async function apiRequest(method, path, { token, apiKey, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (apiKey) headers['X-API-Key'] = apiKey;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(`${apiTestConfig.backendUrl}${path}`, opts);
  const data = await resp.json().catch(() => null);
  return { status: resp.status, data, ok: resp.ok };
}
