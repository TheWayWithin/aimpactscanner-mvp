import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('Checking user issue...\n');
  
  const email = 'wlkgztsglmfzmhyrok@fxavaj.com';
  const userId = '9b54c8e8-f049-4254-8989-68e3962ab625';
  
  // Check if user exists in users table
  console.log('1️⃣ Checking users table...');
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.log('   ❌ User NOT in users table:', error.message);
    
    // Try to create the user
    console.log('\n2️⃣ Creating user in users table...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        tier: 'free',
        monthly_analyses_used: 0
      })
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ Failed to create:', createError.message);
    } else {
      console.log('   ✅ User created!');
      console.log('   Data:', newUser);
    }
  } else {
    console.log('   ✅ User exists in users table');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Tier:', user.tier);
    console.log('   Stripe Customer ID:', user.stripe_customer_id || 'Not set');
    console.log('   Monthly analyses used:', user.monthly_analyses_used);
  }
  
  // Also check the other test user
  console.log('\n3️⃣ Checking other test user...');
  const { data: testUser, error: testError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'ugcbwkkfxvhhxyxmih@xfavaj.com')
    .single();
  
  if (testError) {
    console.log('   ❌ Test user not found:', testError.message);
  } else {
    console.log('   ✅ Test user exists');
    console.log('   ID:', testUser.id);
    console.log('   Tier:', testUser.tier);
  }
  
  process.exit(0);
}

checkUser().catch(console.error);