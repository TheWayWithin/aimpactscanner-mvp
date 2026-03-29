#!/usr/bin/env node
/**
 * Setup Scale Tier Test User in Staging
 *
 * Upgrades the existing test account to Scale tier in staging Supabase
 * for API key testing. Run once before first test run.
 *
 * Strategy: Use the existing Growth test account and upgrade it to Scale.
 * This avoids trigger conflicts when creating new users.
 *
 * Usage: node tests/api/setup-scale-user.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.test' });

const SUPABASE_URL = process.env.API_TEST_SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || 'https://isgzvwpjokcmtizstwru.supabase.co';

const SUPABASE_SERVICE_KEY = process.env.API_TEST_SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use the existing test account — we'll upgrade its tier to Scale
const SCALE_EMAIL = process.env.API_TEST_SCALE_EMAIL || 'jamie.watters.mail@icloud.com';
const SCALE_PASSWORD = process.env.API_TEST_SCALE_PASSWORD || 'Qwerty123!';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or API_TEST_SUPABASE_SERVICE_KEY in .env.test');
  console.error('Add it to .env.test to create the Scale test user.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Setting up Scale tier test user in staging...');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Email: ${SCALE_EMAIL}`);

  // Safety check: refuse to run against production
  if (SUPABASE_URL.includes('pdmtvkcxnqysujnpcnyh')) {
    console.error('REFUSING TO RUN AGAINST PRODUCTION DATABASE');
    process.exit(1);
  }

  // Step 1: Sign in with existing test account
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: SCALE_EMAIL,
    password: SCALE_PASSWORD,
  });

  if (signInError) {
    console.error(`Cannot sign in as ${SCALE_EMAIL}: ${signInError.message}`);
    console.error('This account must already exist in staging.');
    process.exit(1);
  }

  const userId = signIn.user.id;
  console.log(`  Signed in: ${userId}`);

  // Step 2: Upgrade tier to Scale in users table
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('tier, subscription_tier')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Cannot read user row:', fetchError.message);
    process.exit(1);
  }

  console.log(`  Current tier: ${currentUser.tier} / ${currentUser.subscription_tier}`);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      tier: 'scale',
      subscription_tier: 'scale',
      subscription_status: 'active',
      monthly_limit: 100,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update tier:', updateError.message);
    process.exit(1);
  }

  // Step 3: Verify the update
  const { data: updated } = await supabase
    .from('users')
    .select('tier, subscription_tier')
    .eq('id', userId)
    .single();

  console.log(`  Updated tier: ${updated.tier} / ${updated.subscription_tier}`);

  console.log('');
  console.log('Scale test user ready:');
  console.log(`  Email:    ${SCALE_EMAIL}`);
  console.log(`  User ID:  ${userId}`);
  console.log(`  Tier:     scale`);
  console.log(`  JWT:      ${signIn.session.access_token.substring(0, 20)}...`);

  // Clean up any existing test API keys from previous runs
  const { data: oldKeys } = await supabase
    .from('api_keys')
    .select('id')
    .eq('user_id', userId);

  if (oldKeys && oldKeys.length > 0) {
    await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', userId);
    console.log(`  Cleaned up ${oldKeys.length} old test API keys`);
  }

  console.log('');
  console.log('Done. Run: node tests/api/api-keys-test.js');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
