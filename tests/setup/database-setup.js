// Database setup script for testing
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables
config({ path: '.env.test' })

// Test configuration
const testConfig = {
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
  }
}

console.log('🔧 Setting up test database...')

// Create Supabase client
const supabase = createClient(testConfig.supabase.url, testConfig.supabase.serviceRoleKey)

async function setupTestDatabase() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...')
    const { data, error } = await supabase.from('analyses').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.log('💡 Make sure your Supabase project is running and environment variables are set:')
      console.log('   - SUPABASE_URL')
      console.log('   - SUPABASE_SERVICE_ROLE_KEY')
      process.exit(1)
    }
    
    console.log('✅ Database connection verified')
    
    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...')
    
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'
    
    // First get the analysis IDs for the test user
    const { data: testAnalyses } = await supabase
      .from('analyses')
      .select('id')
      .eq('user_id', testUserId)
    
    if (testAnalyses && testAnalyses.length > 0) {
      const analysisIds = testAnalyses.map(a => a.id)
      
      // Delete related data
      await supabase.from('analysis_progress').delete().in('analysis_id', analysisIds)
      await supabase.from('analysis_factors').delete().in('analysis_id', analysisIds)
    }
    
    // Delete the analyses themselves
    await supabase.from('analyses').delete().eq('user_id', testUserId)
    
    console.log('✅ Test data cleaned up')
    
    // Verify required tables exist
    console.log('🔍 Verifying required tables...')
    
    const requiredTables = ['analyses', 'analysis_progress', 'analysis_factors', 'users']
    const tableChecks = []
    
    for (const table of requiredTables) {
      const { data, error } = await supabase.from(table).select('count').limit(1)
      tableChecks.push({
        table,
        exists: !error,
        error: error?.message
      })
    }
    
    console.log('📋 Table verification results:')
    tableChecks.forEach(check => {
      const status = check.exists ? '✅' : '❌'
      console.log(`   ${status} ${check.table}`)
      if (!check.exists) {
        console.log(`      Error: ${check.error}`)
      }
    })
    
    const missingTables = tableChecks.filter(check => !check.exists)
    if (missingTables.length > 0) {
      console.log('❌ Missing required tables. Please run database migrations:')
      console.log('   supabase migration up --linked')
      process.exit(1)
    }
    
    // Create test user if needed
    console.log('👤 Setting up test user...')
    
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
      email: 'test@aiimpactscanner.com'
    }
    
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'id' })
    
    if (upsertError) {
      console.log('⚠️  Test user setup failed:', upsertError.message)
      console.log('   This is not critical for testing')
    } else {
      console.log('✅ Test user ready')
    }
    
    // Test Edge Function availability
    console.log('🔍 Testing Edge Function availability...')
    
    let testAnalysisId = null
    try {
      testAnalysisId = crypto.randomUUID()
      const { data: functionData, error: functionError } = await supabase.functions.invoke('analyze-page', {
        body: {
          url: 'https://example.com',
          analysisId: testAnalysisId,
          userId: '123e4567-e89b-12d3-a456-426614174000'
        }
      })
      
      if (functionError) {
        console.log('⚠️  Edge Function test failed:', functionError.message)
        console.log('   This may affect integration tests')
      } else {
        console.log('✅ Edge Function is available')
      }
    } catch (error) {
      console.log('⚠️  Edge Function test error:', error.message)
    }
    
    // Clean up test analysis if it was created
    if (testAnalysisId) {
      await supabase.from('analysis_progress').delete().eq('analysis_id', testAnalysisId)
      await supabase.from('analysis_factors').delete().eq('analysis_id', testAnalysisId)
      await supabase.from('analyses').delete().eq('id', testAnalysisId)
    }
    
    console.log('🎉 Test database setup complete!')
    console.log('')
    console.log('📝 Available test commands:')
    console.log('   npm run test              - Run all tests')
    console.log('   npm run test:unit         - Run unit tests')
    console.log('   npm run test:integration  - Run integration tests')
    console.log('   npm run test:e2e          - Run end-to-end tests')
    console.log('   npm run test:performance  - Run performance tests')
    console.log('   npm run test:coverage     - Run with coverage report')
    console.log('   npm run test:ui           - Run with UI dashboard')
    console.log('')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setupTestDatabase()