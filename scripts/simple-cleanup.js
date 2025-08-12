#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupJamieAccount() {
  console.log('🔧 Account Setup for jamie.watters.mail@icloud.com\n');
  
  const jamieEmail = 'jamie.watters.mail@icloud.com';
  
  // Try to sign up (will fail if exists, that's ok)
  console.log('📝 Creating/updating account...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: jamieEmail,
    password: 'CoffeeTier2025!'
  });
  
  if (signUpError && !signUpError.message.includes('already registered')) {
    console.log(`⚠️  Sign up issue: ${signUpError.message}`);
  } else if (signUpData?.user) {
    console.log('✅ Account created in auth');
  } else {
    console.log('ℹ️  Account already exists in auth');
  }
  
  // Try to sign in with the new password
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: jamieEmail,
    password: 'CoffeeTier2025!'
  });
  
  if (signInError) {
    console.log(`\n⚠️  Could not sign in with new password`);
    console.log('   You may need to reset password via magic link');
  } else if (signInData?.user) {
    console.log('✅ Successfully signed in');
    console.log(`   User ID: ${signInData.user.id}`);
    
    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (checkError || !existingUser) {
      console.log('\n📝 Adding to users table with Coffee tier...');
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: signInData.user.id,
          email: jamieEmail,
          tier: 'coffee',
          subscription_tier: 'coffee',
          subscription_status: 'active',
          monthly_analyses_used: 0,
          monthly_analyses_limit: null, // Unlimited for coffee
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.log(`   ❌ Could not add to users table: ${insertError.message}`);
      } else {
        console.log('   ✅ Added to users table with Coffee tier!');
      }
    } else {
      console.log('\n📝 Updating existing user to Coffee tier...');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          tier: 'coffee',
          subscription_tier: 'coffee',
          subscription_status: 'active',
          monthly_analyses_limit: null // Unlimited
        })
        .eq('id', signInData.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.log(`   ❌ Could not update: ${updateError.message}`);
      } else {
        console.log('   ✅ Updated to Coffee tier!');
        console.log(`   Current analyses used: ${updatedUser.monthly_analyses_used}`);
        console.log(`   Tier: ${updatedUser.tier} (unlimited analyses)`);
      }
    }
  }
  
  console.log('\n\n📋 MANUAL CLEANUP NEEDED in Supabase Dashboard:');
  console.log('─────────────────────────────────────────────────');
  console.log('1. Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/auth/users');
  console.log('2. Delete these test users:');
  console.log('   • wlkgztsglmfzmhyrok@fxavaj.com');
  console.log('   • ugcbwkkfxvhhxyxmih@xfavaj.com');
  console.log('3. Keep jamie.watters.mail@icloud.com (Coffee tier)');
  console.log('─────────────────────────────────────────────────\n');
  
  console.log('✅ Your Coffee Tier Account:');
  console.log('─────────────────────────────');
  console.log('Email: jamie.watters.mail@icloud.com');
  console.log('Password: CoffeeTier2025!');
  console.log('Tier: Coffee (unlimited analyses)');
  console.log('─────────────────────────────\n');
  
  console.log('🧪 Test Accounts (create manually if needed):');
  console.log('─────────────────────────────────────────────');
  console.log('Free: test-free@aimpactscanner.com / TestFree123!');
  console.log('Coffee: test-coffee@aimpactscanner.com / TestCoffee123!');
  console.log('─────────────────────────────────────────────\n');
  
  // Sign out
  await supabase.auth.signOut();
  process.exit(0);
}

setupJamieAccount().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});