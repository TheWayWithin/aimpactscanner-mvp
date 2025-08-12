import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserTable() {
  console.log('🔧 Fixing User Table Issue');
  console.log('==========================\n');
  
  // Sign in to get user info
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ugcbwkkfxvhhxyxmih@xfavaj.com',
    password: 'TestPassword123!'
  });
  
  if (authError) {
    console.log('❌ Auth error:', authError.message);
    return;
  }
  
  console.log('✅ Auth user found:');
  console.log('   ID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  
  // Try to create user with correct column names
  console.log('\n📝 Creating user in users table...');
  
  // First, let's see what columns exist
  console.log('   Checking table structure...');
  
  // Try different column name combinations
  const attempts = [
    {
      name: 'Attempt 1: With monthly_reset_date',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        tier: 'free',
        monthly_analyses_used: 0,
        monthly_analyses_limit: 3,
        monthly_reset_date: new Date().toISOString()
      }
    },
    {
      name: 'Attempt 2: Without reset date',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        tier: 'free',
        monthly_analyses_used: 0,
        monthly_analyses_limit: 3
      }
    },
    {
      name: 'Attempt 3: Minimal data',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        tier: 'free'
      }
    }
  ];
  
  for (const attempt of attempts) {
    console.log(`\n   ${attempt.name}...`);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert(attempt.data)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      // If user already exists, try to update
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('   User already exists, updating instead...');
        
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update({
            tier: 'free',
            monthly_analyses_used: 0,
            monthly_analyses_limit: 3
          })
          .eq('id', authData.user.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
        } else {
          console.log('   ✅ User updated successfully!');
          console.log('   User data:', updated);
          break;
        }
      }
    } else {
      console.log('   ✅ User created successfully!');
      console.log('   User data:', user);
      break;
    }
  }
  
  // Verify user exists now
  console.log('\n📊 Final verification...');
  const { data: finalUser, error: finalError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  
  if (finalError) {
    console.log('   ❌ User still not in table:', finalError.message);
  } else {
    console.log('   ✅ User confirmed in users table!');
    console.log('   ID:', finalUser.id);
    console.log('   Email:', finalUser.email);
    console.log('   Tier:', finalUser.tier);
    console.log('\n🎉 User table issue fixed! Checkout should work now.');
  }
  
  process.exit(0);
}

fixUserTable().catch(console.error);