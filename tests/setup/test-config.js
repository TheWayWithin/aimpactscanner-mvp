// Test Configuration for AImpactScanner MVP
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Test environment configuration
export const testConfig = {
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
  },
  timeouts: {
    factor_analysis: 2000,
    edge_function: 15000,
    integration_test: 30000
  },
  test_user: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@aiimpactscanner.com',
    password: 'test-password-123'
  }
}

// Test database client
export const testSupabase = createClient(
  testConfig.supabase.url,
  testConfig.supabase.serviceRoleKey
)

// Test utilities
export const testUtils = {
  // Clean up test data
  async cleanupTestData() {
    // Clean up analyses created by test user
    const testUserId = testConfig.test_user.id
    
    // First get the analysis IDs for the test user
    const { data: testAnalyses } = await testSupabase
      .from('analyses')
      .select('id')
      .eq('user_id', testUserId)
    
    if (testAnalyses && testAnalyses.length > 0) {
      const analysisIds = testAnalyses.map(a => a.id)
      
      // Delete related data
      await testSupabase.from('analysis_progress').delete().in('analysis_id', analysisIds)
      await testSupabase.from('analysis_factors').delete().in('analysis_id', analysisIds)
    }
    
    // Delete the analyses themselves
    await testSupabase.from('analyses').delete().eq('user_id', testUserId)
  },

  // Create test analysis
  async createTestAnalysis(url = 'https://example.com') {
    // Generate a proper UUID v4 for testing
    const analysisId = crypto.randomUUID()
    const userId = testConfig.test_user.id

    const { data, error } = await testSupabase
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userId,
        url: url,
        status: 'pending',
        scores: { overall: 0 },
        factor_results: {}
      })
      .select()
      .single()

    if (error) throw error
    return { analysisId, userId, data }
  },

  // Wait for analysis completion
  async waitForAnalysis(analysisId, timeout = 30000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const { data } = await testSupabase
        .from('analyses')
        .select('status')
        .eq('id', analysisId)
        .single()

      if (data?.status === 'completed' || data?.status === 'failed') {
        return data.status
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error(`Analysis ${analysisId} timed out after ${timeout}ms`)
  },

  // Get progress updates
  async getProgressUpdates(analysisId) {
    const { data } = await testSupabase
      .from('analysis_progress')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true })

    return data || []
  },

  // Get factor results
  async getFactorResults(analysisId) {
    const { data } = await testSupabase
      .from('analysis_factors')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true })

    return data || []
  }
}

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  
  // Verify database connection
  const { data, error } = await testSupabase.from('analyses').select('count').limit(1)
  if (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
  
  console.log('✅ Database connection verified')
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  await testUtils.cleanupTestData()
  console.log('✅ Test cleanup completed')
})

beforeEach(async () => {
  // Clean up any existing test data before each test
  await testUtils.cleanupTestData()
})

afterEach(async () => {
  // Optional: Clean up after each test (can be disabled for debugging)
  // await testUtils.cleanupTestData()
})