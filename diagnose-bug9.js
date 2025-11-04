// Diagnostic script for Bug #9 - Missing stripe_customer_id
// Queries staging database to check Coffee tier users' Stripe customer IDs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// For service role operations, we need to use the Supabase dashboard to get the service_role key
// For now, use anon key which has limited permissions
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.staging');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl);
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseBug9() {
  console.log('=== Bug #9 Diagnostic Report ===\n');
  console.log('Database:', supabaseUrl);
  console.log('');

  try {
    // 1. Get ALL users first to see what we have
    console.log('📊 Step 1: Fetching all users...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, tier, subscription_tier, stripe_customer_id, subscription_status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allError) {
      console.error('❌ Error fetching users:', allError);
      return;
    }

    console.log(`Found ${allUsers.length} total users\n`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found in database at all');
      return;
    }

    console.log('📋 All Users:\n');
    for (const user of allUsers) {
      console.log(`${user.email}:`);
      console.log(`  Tier: ${user.tier || 'NULL'}`);
      console.log(`  Subscription Tier: ${user.subscription_tier || 'NULL'}`);
      console.log(`  Stripe Customer ID: ${user.stripe_customer_id || 'NULL'}`);
      console.log(`  Status: ${user.subscription_status || 'NULL'}`);
      console.log('');
    }

    // 2. Get Coffee tier users specifically
    console.log('\n📊 Step 2: Fetching Coffee tier users...');
    const { data: coffeeUsers, error: coffeeError } = await supabase
      .from('users')
      .select('id, email, tier, subscription_tier, stripe_customer_id, subscription_status, created_at')
      .or('tier.eq.coffee,subscription_tier.eq.coffee');

    if (coffeeError) {
      console.error('❌ Error fetching Coffee tier users:', coffeeError);
      return;
    }

    console.log(`Found ${coffeeUsers.length} Coffee tier users\n`);

    if (coffeeUsers.length === 0) {
      console.log('⚠️  No Coffee tier users found in database');
      console.log('💡 This means we need to create a test Coffee tier user to reproduce Bug #9');
      console.log('');
      return;
    }

    // 2. Analyze each user's stripe_customer_id
    console.log('📋 Coffee Tier Users Analysis:\n');

    const usersWithIssues = [];

    for (const user of coffeeUsers) {
      const hasCustomerId = !!user.stripe_customer_id;
      const customerIdLength = user.stripe_customer_id?.length || 0;
      const isValid = hasCustomerId && customerIdLength >= 18;

      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Tier: ${user.tier} / ${user.subscription_tier}`);
      console.log(`  Status: ${user.subscription_status}`);
      console.log(`  Stripe Customer ID: ${user.stripe_customer_id || 'NULL/MISSING'}`);
      console.log(`  Customer ID Length: ${customerIdLength} chars`);
      console.log(`  Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      console.log('');

      if (!isValid) {
        usersWithIssues.push({
          userId: user.id,
          email: user.email,
          issue: hasCustomerId ? 'TRUNCATED' : 'MISSING',
          customerId: user.stripe_customer_id,
          length: customerIdLength
        });
      }
    }

    // 3. Check subscriptions table
    console.log('\n📊 Step 2: Checking subscriptions table...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, tier, stripe_subscription_id, status, current_period_end');

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError);
    } else {
      console.log(`Found ${subscriptions.length} subscriptions\n`);

      for (const sub of subscriptions) {
        console.log(`Subscription for user: ${sub.user_id}`);
        console.log(`  Stripe Sub ID: ${sub.stripe_subscription_id}`);
        console.log(`  Tier: ${sub.tier}`);
        console.log(`  Status: ${sub.status}`);
        console.log(`  Period End: ${sub.current_period_end}`);
        console.log('');
      }
    }

    // 4. Summary
    console.log('\n=== DIAGNOSTIC SUMMARY ===\n');
    console.log(`Total Coffee users: ${coffeeUsers.length}`);
    console.log(`Users with issues: ${usersWithIssues.length}`);

    if (usersWithIssues.length > 0) {
      console.log('\n❌ ISSUES FOUND:\n');
      for (const issue of usersWithIssues) {
        console.log(`${issue.email}:`);
        console.log(`  Problem: ${issue.issue}`);
        if (issue.issue === 'TRUNCATED') {
          console.log(`  Current: "${issue.customerId}" (${issue.length} chars)`);
          console.log(`  Expected: minimum 18 chars for valid Stripe customer ID`);
        } else {
          console.log(`  Current: NULL/MISSING`);
          console.log(`  Expected: cus_XXXXXXXXXXXXXXXX format`);
        }
        console.log('');
      }

      console.log('\n💡 ROOT CAUSE ANALYSIS:');
      const missingCount = usersWithIssues.filter(u => u.issue === 'MISSING').length;
      const truncatedCount = usersWithIssues.filter(u => u.issue === 'TRUNCATED').length;

      if (missingCount > 0) {
        console.log(`\n  ❌ ${missingCount} user(s) missing stripe_customer_id:`);
        console.log('     Possible causes:');
        console.log('     1. Stripe webhook failed to fire after checkout');
        console.log('     2. Webhook fired but failed to update database');
        console.log('     3. User upgraded via manual database update');
        console.log('     4. create-checkout-session did not create customer ID');
      }

      if (truncatedCount > 0) {
        console.log(`\n  ❌ ${truncatedCount} user(s) have truncated stripe_customer_id:`);
        console.log('     Possible causes:');
        console.log('     1. Database column too short (VARCHAR limit)');
        console.log('     2. Application code truncating the value');
        console.log('     3. Data corruption during storage');
      }

      console.log('\n📝 RECOMMENDED FIX:');
      console.log('   1. Check database schema for VARCHAR length');
      console.log('   2. Backfill missing customer IDs from Stripe API');
      console.log('   3. Verify webhook is properly configured');
      console.log('   4. Test with new Coffee tier signup');

    } else {
      console.log('✅ All Coffee tier users have valid stripe_customer_id values');
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

diagnoseBug9().then(() => {
  console.log('\n=== Diagnostic Complete ===');
  process.exit(0);
});
