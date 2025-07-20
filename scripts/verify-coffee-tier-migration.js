// verify-coffee-tier-migration.js
// Verifies Coffee tier database migration was applied successfully

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

async function verifyMigration() {
  console.log('🔍 Verifying Coffee tier database migration...\n')
  
  const results = {
    usersColumns: false,
    subscriptionsTable: false,
    usageAnalyticsTable: false,
    incrementFunction: false,
    checkTierFunction: false,
    policies: false
  }

  try {
    // 1. Check users table columns
    console.log('1️⃣ Checking users table columns...')
    const { data: usersColumns, error: colError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('tier', 'tier_expires_at', 'monthly_analyses_used', 'stripe_customer_id')
        `
      })

    if (!colError && usersColumns?.length >= 4) {
      console.log('  ✅ Users table columns added successfully')
      results.usersColumns = true
    } else {
      console.log('  ❌ Users table columns missing or incomplete')
    }

    // 2. Check subscriptions table
    console.log('2️⃣ Checking subscriptions table...')
    const { data: subTable, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(0)

    if (!subError) {
      console.log('  ✅ Subscriptions table exists')
      results.subscriptionsTable = true
    } else {
      console.log('  ❌ Subscriptions table missing:', subError.message)
    }

    // 3. Check usage_analytics table
    console.log('3️⃣ Checking usage_analytics table...')
    const { data: analyticsTable, error: analyticsError } = await supabase
      .from('usage_analytics')
      .select('id')
      .limit(0)

    if (!analyticsError) {
      console.log('  ✅ Usage analytics table exists')
      results.usageAnalyticsTable = true
    } else {
      console.log('  ❌ Usage analytics table missing:', analyticsError.message)
    }

    // 4. Test increment_monthly_analyses function
    console.log('4️⃣ Testing increment_monthly_analyses function...')
    try {
      // Use a test UUID - this will fail gracefully if user doesn't exist
      const testUuid = '00000000-0000-0000-0000-000000000000'
      const { error: incError } = await supabase
        .rpc('increment_monthly_analyses', { user_uuid: testUuid })

      if (!incError || incError.message.includes('violates foreign key')) {
        console.log('  ✅ increment_monthly_analyses function exists')
        results.incrementFunction = true
      } else {
        console.log('  ❌ increment_monthly_analyses function missing')
      }
    } catch (e) {
      console.log('  ❌ increment_monthly_analyses function error:', e.message)
    }

    // 5. Test check_tier_access function
    console.log('5️⃣ Testing check_tier_access function...')
    try {
      const testUuid = '00000000-0000-0000-0000-000000000000'
      const { data: tierData, error: tierError } = await supabase
        .rpc('check_tier_access', { user_uuid: testUuid })

      if (!tierError && Array.isArray(tierData)) {
        console.log('  ✅ check_tier_access function exists')
        results.checkTierFunction = true
      } else {
        console.log('  ❌ check_tier_access function missing or malformed')
      }
    } catch (e) {
      console.log('  ❌ check_tier_access function error:', e.message)
    }

    // 6. Check RLS policies
    console.log('6️⃣ Checking RLS policies...')
    const { data: policies, error: polError } = await supabase
      .rpc('sql', {
        query: `
          SELECT tablename, policyname 
          FROM pg_policies 
          WHERE tablename IN ('subscriptions', 'usage_analytics')
        `
      })

    if (!polError && policies?.length >= 4) {
      console.log('  ✅ RLS policies created')
      results.policies = true
    } else {
      console.log('  ❌ RLS policies missing or incomplete')
    }

  } catch (error) {
    console.error('❌ Verification error:', error.message)
  }

  // Summary
  console.log('\n📊 Migration Verification Summary:')
  console.log('================================')
  
  const checks = [
    ['Users table columns', results.usersColumns],
    ['Subscriptions table', results.subscriptionsTable],
    ['Usage analytics table', results.usageAnalyticsTable],
    ['Increment function', results.incrementFunction],
    ['Check tier function', results.checkTierFunction],
    ['RLS policies', results.policies]
  ]

  checks.forEach(([name, status]) => {
    console.log(`${status ? '✅' : '❌'} ${name}`)
  })

  const successCount = Object.values(results).filter(Boolean).length
  const totalChecks = Object.keys(results).length

  console.log(`\n🎯 Migration Status: ${successCount}/${totalChecks} checks passed`)

  if (successCount === totalChecks) {
    console.log('🎉 Coffee tier migration applied successfully!')
    return true
  } else {
    console.log('⚠️ Migration incomplete. Please apply the SQL manually in Supabase Dashboard.')
    return false
  }
}

// Create a test user for validation
async function createTestUser() {
  console.log('\n🧪 Creating test user for tier validation...')
  
  try {
    // Try to create a test user in the database
    const { data: testUser, error } = await supabase
      .from('users')
      .insert({
        email: 'test-coffee-tier@example.com',
        tier: 'free',
        monthly_analyses_used: 0
      })
      .select()
      .single()

    if (!error && testUser) {
      console.log('✅ Test user created:', testUser.id)
      return testUser.id
    } else {
      console.log('❌ Could not create test user:', error?.message)
      return null
    }
  } catch (e) {
    console.log('❌ Test user creation error:', e.message)
    return null
  }
}

// Test tier access with real user
async function testTierAccess(userId) {
  console.log('\n🔬 Testing tier access validation...')
  
  try {
    const { data, error } = await supabase
      .rpc('check_tier_access', { user_uuid: userId })

    if (!error && data && data.length > 0) {
      const result = data[0]
      console.log('✅ Tier access check successful:')
      console.log(`   - Tier: ${result.tier}`)
      console.log(`   - Allowed: ${result.allowed}`)
      console.log(`   - Remaining: ${result.remaining_analyses}`)
      console.log(`   - Message: ${result.message}`)
      return true
    } else {
      console.log('❌ Tier access check failed:', error?.message)
      return false
    }
  } catch (e) {
    console.log('❌ Tier access test error:', e.message)
    return false
  }
}

// Main execution
async function main() {
  const migrationSuccess = await verifyMigration()
  
  if (migrationSuccess) {
    const testUserId = await createTestUser()
    if (testUserId) {
      await testTierAccess(testUserId)
      
      // Cleanup test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test-coffee-tier@example.com')
      
      console.log('🧹 Test user cleaned up')
    }
  }

  console.log('\n🏁 Verification complete!')
}

main().catch(console.error)