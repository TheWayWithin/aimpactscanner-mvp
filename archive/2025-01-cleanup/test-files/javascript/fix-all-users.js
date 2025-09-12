import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Connect with service role key to bypass RLS
const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

async function fixUsers() {
  console.log('🔧 Fixing all users in database\n');
  
  const users = [
    {
      id: '9b54c8e8-f049-4254-8989-68e3962ab625',
      email: 'wlkgztsglmfzmhyrok@fxavaj.com',
      name: 'Main test user'
    },
    {
      id: '45bacda7-3d43-4235-9bc0-89501361eac6',
      email: 'ugcbwkkfxvhhxyxmih@xfavaj.com',
      name: 'Secondary test user'
    }
  ];
  
  for (const userToFix of users) {
    console.log(`\n📝 Processing ${userToFix.name}...`);
    console.log(`   Email: ${userToFix.email}`);
    
    // First sign in to get a valid token
    const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        email: userToFix.email,
        password: 'TestPassword123!'
      })
    });
    
    if (!signInResponse.ok) {
      console.log(`   ⚠️ Could not sign in (user might not exist in auth)`);
      continue;
    }
    
    const authData = await signInResponse.json();
    const accessToken = authData.access_token;
    
    // Create supabase client with user's token
    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });
    
    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userToFix.id)
      .single();
    
    if (checkError || !existingUser) {
      console.log('   ❌ Not in users table, creating...');
      
      // Try to insert with minimal data
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userToFix.id,
          email: userToFix.email,
          tier: 'free'
        })
        .select()
        .single();
      
      if (insertError) {
        console.log(`   ❌ Could not create: ${insertError.message}`);
        
        // Try an even simpler approach - just the ID
        const { data: simpleUser, error: simpleError } = await supabase
          .from('users')
          .insert({ id: userToFix.id })
          .select()
          .single();
        
        if (simpleError) {
          console.log(`   ❌ Still failed: ${simpleError.message}`);
        } else {
          console.log('   ✅ Created with minimal data!');
        }
      } else {
        console.log('   ✅ User created successfully!');
      }
    } else {
      console.log('   ✅ User already exists in users table');
      console.log(`   Tier: ${existingUser.tier}`);
      console.log(`   Analyses used: ${existingUser.monthly_analyses_used || 0}`);
    }
  }
  
  console.log('\n✅ User fix complete!');
  process.exit(0);
}

fixUsers().catch(console.error);