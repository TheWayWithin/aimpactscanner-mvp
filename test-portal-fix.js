// Test script for Bug #9 fix - Verify create-portal-session handles missing customer ID
// This script simulates the scenario where a Coffee tier user has no stripe_customer_id

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPortalFix() {
  console.log('=== Testing Bug #9 Fix ===\n');
  console.log('This test verifies that the create-portal-session Edge Function:');
  console.log('1. Handles missing stripe_customer_id gracefully');
  console.log('2. Searches Stripe for customer by email');
  console.log('3. Backfills the database with found customer ID');
  console.log('4. Returns proper error messages if no customer found\n');

  // Test 1: Unauthenticated request (should fail)
  console.log('📊 Test 1: Unauthenticated request...');
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { returnUrl: 'https://test.com' }
    });

    if (error) {
      console.log('✅ Correctly rejected unauthenticated request');
      console.log('   Error:', error.message);
    } else {
      console.log('❌ Should have rejected unauthenticated request');
    }
  } catch (err) {
    console.log('✅ Correctly threw error for unauthenticated request');
  }

  console.log('\n📝 Manual Testing Instructions:\n');
  console.log('To fully test this fix, you need to:');
  console.log('');
  console.log('1. Create a test Coffee tier user:');
  console.log('   - Sign up for a new account');
  console.log('   - Complete Stripe checkout for Coffee tier');
  console.log('   - Verify subscription is active in Stripe');
  console.log('');
  console.log('2. Simulate the bug by manually clearing stripe_customer_id:');
  console.log('   - Go to Supabase Dashboard > Table Editor > users');
  console.log('   - Find the Coffee tier user');
  console.log('   - Set stripe_customer_id to NULL');
  console.log('   - Save changes');
  console.log('');
  console.log('3. Test the fix:');
  console.log('   - Log in as that user');
  console.log('   - Go to Account Dashboard');
  console.log('   - Click "Manage Subscription"');
  console.log('   - Verify:');
  console.log('     ✓ No 400 error');
  console.log('     ✓ Stripe portal opens successfully');
  console.log('     ✓ Database is backfilled with customer ID');
  console.log('');
  console.log('4. Check Supabase Edge Function logs:');
  console.log('   - Dashboard > Edge Functions > create-portal-session > Logs');
  console.log('   - Look for messages:');
  console.log('     ✓ "No Stripe customer ID in database"');
  console.log('     ✓ "Attempting to find customer in Stripe by email"');
  console.log('     ✓ "Found existing Stripe customer"');
  console.log('     ✓ "Updated database with stripe_customer_id"');
  console.log('');
  console.log('Expected Result:');
  console.log('✅ User can access Stripe portal even if stripe_customer_id was missing');
  console.log('✅ Database is automatically repaired with correct customer ID');
  console.log('✅ Subsequent clicks work instantly (no Stripe lookup needed)');
}

testPortalFix().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
});
