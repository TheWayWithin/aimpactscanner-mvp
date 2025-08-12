import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('Checking user in database...\n');
  
  // Check if user exists in users table
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'ugcbwkkfxvhhxyxmih@xfavaj.com')
    .single();
  
  if (error) {
    console.log('Error querying users table:', error.message);
    
    // Try to get the auth user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ugcbwkkfxvhhxyxmih@xfavaj.com',
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.log('Auth error:', authError.message);
    } else {
      console.log('\n✅ Auth user exists:');
      console.log('   ID:', authData.user.id);
      console.log('   Email:', authData.user.email);
      console.log('   Created:', authData.user.created_at);
      
      // Try to create user in users table
      console.log('\n❌ But user NOT in users table!');
      console.log('   This is why checkout is failing.');
      
      console.log('\n📝 Creating user in users table...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          tier: 'free',
          monthly_analyses_used: 0,
          monthly_analyses_limit: 3,
          last_reset_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.log('   ❌ Failed to create user:', createError.message);
      } else {
        console.log('   ✅ User created in users table!');
        console.log('   User data:', newUser);
      }
    }
  } else {
    console.log('✅ User exists in users table:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Tier:', user.tier);
    console.log('   Stripe Customer ID:', user.stripe_customer_id || 'Not set');
    console.log('   Monthly analyses used:', user.monthly_analyses_used);
    console.log('   Monthly analyses limit:', user.monthly_analyses_limit);
  }
  
  process.exit(0);
}

checkUser().catch(console.error);