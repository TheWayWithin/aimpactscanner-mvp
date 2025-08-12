#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('☕ Setting up Coffee Tier Account\n');
  
  const email = 'jamie.watters.mail@icloud.com';
  
  console.log('📧 Sending password reset email to:', email);
  console.log('   This will let you set your own password\n');
  
  // Send password reset email
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://aimpactscanner.com/reset-password'
  });
  
  if (resetError) {
    console.log('❌ Could not send reset email:', resetError.message);
    console.log('\n📝 Alternative: Sign in with magic link at https://aimpactscanner.com');
  } else {
    console.log('✅ Password reset email sent!');
    console.log('   Check your inbox and click the link to set a new password');
  }
  
  console.log('\n\n📋 SETUP INSTRUCTIONS:');
  console.log('═══════════════════════════════════════════════════════');
  
  console.log('\n1️⃣  Set Your Password:');
  console.log('   • Check email for password reset link');
  console.log('   • Click link and set your password');
  console.log('   • Or use magic link sign in at https://aimpactscanner.com');
  
  console.log('\n2️⃣  Manual Database Cleanup (Supabase Dashboard):');
  console.log('   • Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh');
  console.log('   • Navigate to: Authentication → Users');
  console.log('   • Delete test users (@fxavaj.com emails)');
  console.log('   • Keep jamie.watters.mail@icloud.com');
  
  console.log('\n3️⃣  Your Account Status:');
  console.log('   • Email: jamie.watters.mail@icloud.com');
  console.log('   • Tier: Coffee (unlimited analyses)');
  console.log('   • Stripe: Payment already processed ($5/month)');
  
  console.log('\n4️⃣  Stripe Subscription Management:');
  console.log('   • Dashboard: https://dashboard.stripe.com');
  console.log('   • Find customer: jamie.watters.mail@icloud.com');
  console.log('   • Cancel subscription if needed');
  
  console.log('\n5️⃣  Test the Coffee Tier:');
  console.log('   • Sign in at https://aimpactscanner.com');
  console.log('   • You should see "Coffee" tier in header');
  console.log('   • Unlimited analyses available');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Setup process initiated! Check your email.\n');
  
  process.exit(0);
}

main().catch(console.error);