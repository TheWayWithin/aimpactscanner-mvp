// Test script to verify FREE tier limit enforcement
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pdmtvkcxnqysujnpcnyh.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkUser() {
  const testEmail = 'aimpactscannertest@gmail.com'
  
  console.log('Checking test user:', testEmail)
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return
  }
  
  console.log('User data:')
  console.log('  - Tier:', users.tier)
  console.log('  - Monthly analyses used:', users.monthly_analyses_used)
  console.log('  - Subscription status:', users.subscription_status)
  
  const { data: analyses, error: analysesError } = await supabase
    .from('analyses')
    .select('id, created_at, url')
    .eq('user_id', users.id)
    .order('created_at', { ascending: false })
  
  if (!analysesError) {
    console.log('  - Total analyses in DB:', analyses.length)
    console.log('  - Recent analyses:')
    analyses.slice(0, 5).forEach((a, i) => {
      console.log('    ' + (i+1) + '. ' + a.url)
    })
  }
  
  console.log('\nExpected behavior:')
  console.log('  - Limit: 3 analyses per month')
  console.log('  - Current used:', users.monthly_analyses_used)
  console.log('  - Remaining:', Math.max(0, 3 - users.monthly_analyses_used))
  console.log('  - Should block:', users.monthly_analyses_used >= 3 ? 'YES' : 'NO')
}

checkUser().catch(console.error)
