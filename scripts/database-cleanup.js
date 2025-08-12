#!/usr/bin/env node

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
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   Add: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupDatabase() {
  console.log('🧹 Database Cleanup Script\n');
  console.log('This will:');
  console.log('1. Remove temporary test accounts (@fxavaj.com)');
  console.log('2. Set up jamie.watters.mail@icloud.com with Coffee tier');
  console.log('3. Create clean test accounts\n');
  
  // Step 1: Get all test users to clean up
  console.log('📋 Step 1: Finding test accounts to remove...');
  
  const testEmails = [
    'wlkgztsglmfzmhyrok@fxavaj.com',
    'ugcbwkkfxvhhxyxmih@xfavaj.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\n🗑️  Removing ${email}...`);
    
    // Remove from users table first
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    
    if (usersError) {
      console.log(`   ⚠️  Not in users table or error: ${usersError.message}`);
    } else {
      console.log(`   ✅ Removed from users table`);
    }
    
    // Remove from auth.users (requires admin API)
    try {
      // First get the user ID
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && authUsers) {
        const user = authUsers.users.find(u => u.email === email);
        if (user) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.log(`   ⚠️  Could not remove from auth: ${deleteError.message}`);
          } else {
            console.log(`   ✅ Removed from auth.users`);
          }
        } else {
          console.log(`   ℹ️  Not found in auth.users`);
        }
      }
    } catch (err) {
      console.log(`   ⚠️  Auth cleanup error: ${err.message}`);
    }
  }
  
  // Step 2: Set up Jamie's account
  console.log('\n\n📧 Step 2: Setting up jamie.watters.mail@icloud.com...');
  
  const jamieEmail = 'jamie.watters.mail@icloud.com';
  
  // Check if user exists in auth
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  let jamieAuthUser = authUsers?.users.find(u => u.email === jamieEmail);
  
  if (!jamieAuthUser) {
    console.log('   Creating auth account...');
    // Create auth user
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: jamieEmail,
      password: 'CoffeeTier2025!', // You can change this
      email_confirm: true
    });
    
    if (createAuthError) {
      console.log(`   ❌ Could not create auth user: ${createAuthError.message}`);
    } else {
      console.log(`   ✅ Auth account created`);
      console.log(`   📝 Password: CoffeeTier2025! (please change after first login)`);
      jamieAuthUser = newAuthUser.user;
    }
  } else {
    console.log(`   ✅ Auth account already exists`);
    
    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      jamieAuthUser.id,
      { password: 'CoffeeTier2025!' }
    );
    
    if (!updateError) {
      console.log(`   📝 Password reset to: CoffeeTier2025!`);
    }
  }
  
  if (jamieAuthUser) {
    // Check/create in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', jamieAuthUser.id)
      .single();
    
    if (checkError || !existingUser) {
      console.log('   Adding to users table with Coffee tier...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: jamieAuthUser.id,
          email: jamieEmail,
          tier: 'coffee',
          subscription_tier: 'coffee',
          subscription_status: 'active',
          stripe_customer_id: null, // Will be updated when found in Stripe
          monthly_analyses_used: 0,
          monthly_analyses_limit: null, // Unlimited for coffee tier
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log(`   ❌ Could not add to users table: ${insertError.message}`);
      } else {
        console.log(`   ✅ Added to users table with Coffee tier (unlimited analyses)`);
      }
    } else {
      // Update existing user to coffee tier
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tier: 'coffee',
          subscription_tier: 'coffee',
          subscription_status: 'active',
          monthly_analyses_limit: null // Unlimited
        })
        .eq('id', jamieAuthUser.id);
      
      if (!updateError) {
        console.log(`   ✅ Updated to Coffee tier (unlimited analyses)`);
      }
    }
  }
  
  // Step 3: Create clean test accounts
  console.log('\n\n🧪 Step 3: Creating clean test accounts...');
  
  const testAccounts = [
    {
      email: 'test-free@aimpactscanner.com',
      password: 'TestFree123!',
      tier: 'free',
      monthly_analyses_limit: 3
    },
    {
      email: 'test-coffee@aimpactscanner.com', 
      password: 'TestCoffee123!',
      tier: 'coffee',
      monthly_analyses_limit: null // Unlimited
    }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n📝 Creating ${account.email} (${account.tier} tier)...`);
    
    // Check if exists
    const existing = authUsers?.users.find(u => u.email === account.email);
    
    if (!existing) {
      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true
      });
      
      if (createError) {
        console.log(`   ⚠️  Could not create: ${createError.message}`);
        continue;
      }
      
      if (newUser?.user) {
        // Add to users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUser.user.id,
            email: account.email,
            tier: account.tier,
            subscription_tier: account.tier,
            subscription_status: 'active',
            monthly_analyses_used: 0,
            monthly_analyses_limit: account.monthly_analyses_limit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log(`   ❌ Could not add to users table: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created successfully`);
          console.log(`   📧 Email: ${account.email}`);
          console.log(`   🔑 Password: ${account.password}`);
          console.log(`   🎯 Tier: ${account.tier}`);
        }
      }
    } else {
      console.log(`   ℹ️  Account already exists`);
    }
  }
  
  // Summary
  console.log('\n\n✅ Database Cleanup Complete!\n');
  console.log('📋 Summary:');
  console.log('─────────────────────────────────────────');
  console.log('Removed test accounts: @fxavaj.com emails');
  console.log('\nYour Coffee Tier Account:');
  console.log('  Email: jamie.watters.mail@icloud.com');
  console.log('  Password: CoffeeTier2025!');
  console.log('  Tier: Coffee (unlimited analyses)');
  console.log('\nTest Accounts:');
  console.log('  Free Tier: test-free@aimpactscanner.com / TestFree123!');
  console.log('  Coffee Tier: test-coffee@aimpactscanner.com / TestCoffee123!');
  console.log('─────────────────────────────────────────\n');
  
  process.exit(0);
}

cleanupDatabase().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});