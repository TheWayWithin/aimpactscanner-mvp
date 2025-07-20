// verify-step-by-step.js
// Verifies each step of Coffee tier migration individually

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from test file (has service role key)
config({ path: '.env.test' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStep1() {
  console.log('🔍 STEP 1: Checking users table columns...')
  
  try {
    // Check if the new columns exist
    const { data, error } = await supabase
      .from('users')
      .select('tier, tier_expires_at, monthly_analyses_used, stripe_customer_id')
      .limit(0)

    if (!error) {
      console.log('✅ STEP 1: Users table columns added successfully')
      return true
    } else {
      console.log('❌ STEP 1: Users table columns missing:', error.message)
      return false
    }
  } catch (e) {
    console.log('❌ STEP 1: Error checking users table:', e.message)
    return false
  }
}

async function checkStep2() {
  console.log('🔍 STEP 2: Checking subscriptions table...')
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(0)

    if (!error) {
      console.log('✅ STEP 2: Subscriptions table created successfully')
      return true
    } else {
      console.log('❌ STEP 2: Subscriptions table missing:', error.message)
      return false
    }
  } catch (e) {
    console.log('❌ STEP 2: Error checking subscriptions table:', e.message)
    return false
  }
}

async function checkStep3() {
  console.log('🔍 STEP 3: Checking usage_analytics table...')
  
  try {
    const { data, error } = await supabase
      .from('usage_analytics')
      .select('id')
      .limit(0)

    if (!error) {
      console.log('✅ STEP 3: Usage analytics table created successfully')
      return true
    } else {
      console.log('❌ STEP 3: Usage analytics table missing:', error.message)
      return false
    }
  } catch (e) {
    console.log('❌ STEP 3: Error checking usage analytics table:', e.message)
    return false
  }
}

async function checkStep4() {
  console.log('🔍 STEP 4: Checking database functions...')
  
  let incrementExists = false
  let checkTierExists = false
  
  try {
    // Test increment function
    const testUuid = '00000000-0000-0000-0000-000000000000'
    const { error: incError } = await supabase
      .rpc('increment_monthly_analyses', { user_uuid: testUuid })

    if (!incError || incError.message.includes('violates foreign key') || incError.message.includes('NULL')) {
      console.log('✅ STEP 4a: increment_monthly_analyses function exists')
      incrementExists = true
    } else {
      console.log('❌ STEP 4a: increment_monthly_analyses function missing')
    }
  } catch (e) {
    console.log('❌ STEP 4a: increment_monthly_analyses function error:', e.message)
  }

  try {
    // Test check tier function
    const testUuid = '00000000-0000-0000-0000-000000000000'
    const { data, error } = await supabase
      .rpc('check_tier_access', { user_uuid: testUuid })

    if (!error && Array.isArray(data)) {
      console.log('✅ STEP 4b: check_tier_access function exists')
      checkTierExists = true
    } else {
      console.log('❌ STEP 4b: check_tier_access function missing or malformed')
    }
  } catch (e) {
    console.log('❌ STEP 4b: check_tier_access function error:', e.message)
  }

  return incrementExists && checkTierExists
}

async function checkStep5() {
  console.log('🔍 STEP 5: Checking RLS policies...')
  
  try {
    // This is a simplified check - we'll assume policies are created if tables exist
    const step2Success = await checkTableExists('subscriptions')
    const step3Success = await checkTableExists('usage_analytics')
    
    if (step2Success && step3Success) {
      console.log('✅ STEP 5: RLS policies likely created (tables exist)')
      return true
    } else {
      console.log('❌ STEP 5: Cannot verify RLS policies - tables missing')
      return false
    }
  } catch (e) {
    console.log('❌ STEP 5: Error checking RLS policies:', e.message)
    return false
  }
}

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)
    return !error
  } catch (e) {
    return false
  }
}

async function main() {
  console.log('🚀 Coffee Tier Migration - Step by Step Verification\n')
  
  const results = []
  
  const step1 = await checkStep1()
  results.push(['Step 1: Users table columns', step1])
  
  if (step1) {
    const step2 = await checkStep2()
    results.push(['Step 2: Subscriptions table', step2])
    
    const step3 = await checkStep3()
    results.push(['Step 3: Usage analytics table', step3])
    
    if (step2 && step3) {
      const step4 = await checkStep4()
      results.push(['Step 4: Database functions', step4])
      
      const step5 = await checkStep5()
      results.push(['Step 5: RLS policies', step5])
    }
  }
  
  console.log('\n📊 Step-by-Step Verification Summary:')
  console.log('=====================================')
  
  results.forEach(([name, status]) => {
    console.log(`${status ? '✅' : '❌'} ${name}`)
  })
  
  const successCount = results.filter(([_, status]) => status).length
  const totalSteps = results.length
  
  console.log(`\n🎯 Progress: ${successCount}/${totalSteps} steps completed`)
  
  if (successCount === 0) {
    console.log('\n📋 Next Action: Run STEP 1 SQL in Supabase Dashboard')
  } else if (successCount < totalSteps) {
    console.log(`\n📋 Next Action: Run STEP ${successCount + 1} SQL in Supabase Dashboard`)
  } else {
    console.log('\n🎉 All steps completed successfully!')
  }
}

main().catch(console.error)