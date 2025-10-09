#!/usr/bin/env node

/**
 * CREATE PLAYWRIGHT TEST USERS
 *
 * This script creates dedicated test users for Playwright E2E testing.
 * These users are separate from production accounts and can be safely
 * used for automated testing.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user configurations
const TEST_USERS = [
  {
    email: 'playwright-free@aimpactscanner.com',
    password: 'PlaywrightFree123!',
    tier: 'free',
    subscription_tier: 'free',
    subscription_status: 'active',
    monthly_analyses_limit: 3,
    description: 'Free tier test user (3 analyses/month)'
  },
  {
    email: 'playwright-coffee@aimpactscanner.com',
    password: 'PlaywrightCoffee123!',
    tier: 'coffee',
    subscription_tier: 'coffee',
    subscription_status: 'active',
    monthly_analyses_limit: null,
    description: 'Coffee tier test user (unlimited analyses)'
  },
  {
    email: 'playwright-expired@aimpactscanner.com',
    password: 'PlaywrightExpired123!',
    tier: 'free',
    subscription_tier: 'free',
    subscription_status: 'active',
    monthly_analyses_limit: 3,
    monthly_analyses_used: 3, // Already used all analyses
    description: 'Free tier test user (analyses exhausted)'
  }
];

async function createTestUser(userConfig) {
  console.log(`\n📝 Creating ${userConfig.email}...`);
  console.log(`   Description: ${userConfig.description}`);

  try {
    // Check if user already exists
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuthUsers?.users.find(u => u.email === userConfig.email);

    let userId;

    if (existingUser) {
      console.log('   ℹ️  User already exists in auth.users');
      userId = existingUser.id;

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: userConfig.password
      });

      if (updateError) {
        console.log(`   ⚠️  Could not update password: ${updateError.message}`);
      } else {
        console.log('   ✅ Password updated');
      }
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true // Auto-confirm for testing
      });

      if (authError) {
        console.log(`   ❌ Could not create auth user: ${authError.message}`);
        return;
      }

      console.log('   ✅ Created in auth.users');
      userId = authData.user.id;
    }

    // Check if user exists in public.users
    const { data: existingPublicUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingPublicUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tier: userConfig.tier,
          subscription_tier: userConfig.subscription_tier,
          subscription_status: userConfig.subscription_status,
          monthly_analyses_limit: userConfig.monthly_analyses_limit,
          monthly_analyses_used: userConfig.monthly_analyses_used || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.log(`   ⚠️  Could not update users table: ${updateError.message}`);
      } else {
        console.log('   ✅ Updated in users table');
      }
    } else {
      // Create new user in public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userConfig.email,
          tier: userConfig.tier,
          subscription_tier: userConfig.subscription_tier,
          subscription_status: userConfig.subscription_status,
          monthly_analyses_limit: userConfig.monthly_analyses_limit,
          monthly_analyses_used: userConfig.monthly_analyses_used || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.log(`   ❌ Could not create in users table: ${insertError.message}`);
      } else {
        console.log('   ✅ Created in users table');
      }
    }

    console.log('   ✅ Success!');
    console.log(`   📧 Email: ${userConfig.email}`);
    console.log(`   🔑 Password: ${userConfig.password}`);
    console.log(`   🎯 Tier: ${userConfig.tier}`);
    console.log(`   📊 Limit: ${userConfig.monthly_analyses_limit || 'unlimited'}`);
    console.log(`   📈 Used: ${userConfig.monthly_analyses_used || 0}`);

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('\n🧪 PLAYWRIGHT TEST USER CREATION SCRIPT');
  console.log('═'.repeat(70));
  console.log('Creating dedicated test users for E2E testing...\n');

  for (const userConfig of TEST_USERS) {
    await createTestUser(userConfig);
  }

  // Summary
  console.log('\n\n✅ TEST USERS CREATED SUCCESSFULLY');
  console.log('═'.repeat(70));
  console.log('\n📋 Test User Credentials:');
  console.log('─'.repeat(70));

  TEST_USERS.forEach(user => {
    console.log(`\n${user.description}:`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Tier:     ${user.tier}`);
    console.log(`  Limit:    ${user.monthly_analyses_limit || 'unlimited'}`);
  });

  console.log('\n─'.repeat(70));
  console.log('\n💡 Usage in Playwright Tests:');
  console.log(`
// Free tier test (limited analyses)
const freeTier = {
  email: 'playwright-free@aimpactscanner.com',
  password: 'PlaywrightFree123!'
};

// Coffee tier test (unlimited analyses)
const coffeeTier = {
  email: 'playwright-coffee@aimpactscanner.com',
  password: 'PlaywrightCoffee123!'
};

// Exhausted analyses test
const exhaustedTier = {
  email: 'playwright-expired@aimpactscanner.com',
  password: 'PlaywrightExpired123!'
};
  `);

  console.log('\n📚 Next Steps:');
  console.log('1. Update tests/setup/auth.setup.js to use these credentials');
  console.log('2. Run Playwright tests with: npm run test:e2e');
  console.log('3. See docs/playwright-test-auth-setup.md for full guide\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
