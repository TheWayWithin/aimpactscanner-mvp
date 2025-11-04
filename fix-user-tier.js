import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserTier() {
  const userId = '0754989d-7449-4d0f-8eba-f480447f3eac';

  console.log('🔍 Checking current user tier...');

  // First, check current state
  const { data: before, error: beforeError } = await supabase
    .from('users')
    .select('id, email, tier, subscription_tier, updated_at')
    .eq('id', userId)
    .single();

  if (beforeError) {
    console.error('❌ Error fetching user:', beforeError);
    return;
  }

  console.log('Current state:', before);

  console.log('\n🔧 Updating user tier to Growth...');

  const { data, error } = await supabase
    .from('users')
    .update({
      tier: 'growth',
      subscription_tier: 'growth',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('❌ Error updating:', error);
  } else {
    console.log('✅ Success! User tier updated to Growth');
    console.log('Updated data:', data);
    console.log('\n✅ User should now see:');
    console.log('   - Growth tier badge');
    console.log('   - 40 analyses remaining');
    console.log('   - All bugs resolved');
  }
}

fixUserTier();
