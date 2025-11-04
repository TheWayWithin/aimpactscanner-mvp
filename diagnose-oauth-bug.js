/**
 * OAuth Authentication Bug Diagnostic Tool
 *
 * Purpose: Diagnose 400 Bad Request error when fetching user data after OAuth login
 * Error URL: pdmtvkcxnqysujnpcnyh.supabase.co/rest/v1/users?select=...
 *
 * Root Cause Hypothesis:
 * - Database schema mismatch (migration 021 not applied to staging)
 * - Missing columns: is_first_login, auth_provider, selected_tier, signup_source
 * - Code expects columns that don't exist in staging database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('========================================');
console.log('OAuth Bug Diagnostic Tool');
console.log('========================================');
console.log('Database:', supabaseUrl);
console.log('User ID:', '2e8915de-245b-4872-9bb3-5724cc21ecab');
console.log('========================================\n');

async function diagnose() {
  const userId = '2e8915de-245b-4872-9bb3-5724cc21ecab';

  // Test 1: Check if user exists (basic query)
  console.log('TEST 1: Basic user existence check');
  console.log('-----------------------------------');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ FAILED:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ User exists:', data);
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
  }
  console.log('');

  // Test 2: Check for base columns (should exist)
  console.log('TEST 2: Base columns check');
  console.log('-----------------------------------');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, tier, subscription_status, monthly_analyses_used')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ FAILED:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
    } else {
      console.log('✅ Base columns exist:', data);
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
  }
  console.log('');

  // Test 3: Check for migration 021 columns (OAuth-related)
  console.log('TEST 3: Migration 021 columns check');
  console.log('-----------------------------------');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, is_first_login, auth_provider, selected_tier, signup_source')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ FAILED - Migration 021 likely NOT applied');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);

      if (error.message.includes('is_first_login') ||
          error.message.includes('auth_provider') ||
          error.message.includes('selected_tier')) {
        console.error('\n🔍 DIAGNOSIS: Missing columns from migration 021');
        console.error('   Required columns: is_first_login, auth_provider, selected_tier, signup_source');
        console.error('   Action needed: Apply migration 021 to staging database');
      }
    } else {
      console.log('✅ Migration 021 columns exist:', data);
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
  }
  console.log('');

  // Test 4: Exact query from authRouting.js (line 354)
  console.log('TEST 4: Exact getUserData() query');
  console.log('-----------------------------------');
  console.log('Query: .select(\'id, email, tier, is_first_login, subscription_status, monthly_analyses_used\')');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, tier, is_first_login, subscription_status, monthly_analyses_used')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ FAILED - THIS IS THE 400 ERROR USERS ARE SEEING');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('\n🎯 ROOT CAUSE CONFIRMED: Column mismatch in getUserData()');
      console.error('   File: src/utils/authRouting.js:354');
      console.error('   Problem: Requesting is_first_login column that doesn\'t exist');
    } else {
      console.log('✅ getUserData() query successful:', data);
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
  }
  console.log('');

  // Test 5: Check all columns that exist in users table
  console.log('TEST 5: Discover all available columns');
  console.log('-----------------------------------');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ FAILED:', error.message);
    } else {
      console.log('✅ All columns in users table:');
      console.log(Object.keys(data).sort().join(', '));
      console.log('\nFull user record:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message);
  }
  console.log('');

  // Final diagnosis
  console.log('========================================');
  console.log('DIAGNOSIS SUMMARY');
  console.log('========================================');
  console.log('If migration 021 columns are missing:');
  console.log('  → Migration 021 needs to be applied to staging database');
  console.log('  → Run: npx supabase db push (or apply via Supabase dashboard)');
  console.log('');
  console.log('If migration 021 columns exist:');
  console.log('  → Check RLS policies blocking SELECT');
  console.log('  → Verify user record was created correctly');
  console.log('========================================');
}

diagnose().catch(console.error);
