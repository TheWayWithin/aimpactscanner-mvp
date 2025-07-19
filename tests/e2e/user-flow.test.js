// End-to-End User Flow Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testConfig, testUtils, testSupabase } from '../setup/test-config.js'

// Note: These tests would ideally use Playwright for full browser testing
// For now, they test the API flow that mirrors the user experience

describe('End-to-End User Flow Tests', () => {
  beforeAll(async () => {
    console.log('🧪 Starting E2E user flow tests...')
    await testUtils.cleanupTestData()
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E test data...')
    await testUtils.cleanupTestData()
  })

  describe('Complete User Analysis Journey', () => {
    it('should complete full user analysis workflow', async () => {
      // Step 1: User submits URL for analysis
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      
      console.log(`🔍 User submits URL: ${testUrl}`)
      
      // Verify initial state
      const { data: initialAnalysis } = await testSupabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      
      expect(initialAnalysis.status).toBe('pending')
      expect(initialAnalysis.url).toBe(testUrl)
      
      // Step 2: Analysis starts (Edge Function invocation)
      console.log('🚀 Starting analysis...')
      
      const { data: functionResponse, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      expect(error).toBeNull()
      expect(functionResponse.success).toBe(true)
      expect(functionResponse.analysisId).toBe(analysisId)
      
      // Step 3: User sees real-time progress updates
      console.log('📈 Monitoring progress updates...')
      
      // Wait a bit for progress updates to appear
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const progressUpdates = await testUtils.getProgressUpdates(analysisId)
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Verify progress updates are in chronological order
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress_percent).toBeGreaterThanOrEqual(
          progressUpdates[i - 1].progress_percent
        )
      }
      
      // Step 4: Analysis completes
      console.log('⏳ Waiting for analysis completion...')
      
      const finalStatus = await testUtils.waitForAnalysis(analysisId, 20000)
      expect(finalStatus).toBe('completed')
      
      // Step 5: User views results
      console.log('📊 Retrieving analysis results...')
      
      const { data: completedAnalysis } = await testSupabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      
      expect(completedAnalysis.status).toBe('completed')
      expect(completedAnalysis.overall_score).toBeGreaterThan(0)
      expect(completedAnalysis.completed_at).toBeDefined()
      
      // Step 6: User views detailed factor results
      console.log('🔍 Retrieving factor results...')
      
      const factorResults = await testUtils.getFactorResults(analysisId)
      expect(factorResults.length).toBeGreaterThan(0)
      
      // Verify factor results structure
      factorResults.forEach(factor => {
        expect(factor.factor_id).toBeDefined()
        expect(factor.factor_name).toBeDefined()
        expect(factor.pillar).toBeDefined()
        expect(factor.score).toBeGreaterThanOrEqual(0)
        expect(factor.score).toBeLessThanOrEqual(100)
        expect(factor.confidence).toBeGreaterThanOrEqual(0)
        expect(factor.confidence).toBeLessThanOrEqual(100)
        expect(Array.isArray(factor.evidence)).toBe(true)
        expect(Array.isArray(factor.recommendations)).toBe(true)
      })
      
      // Step 7: Verify final progress shows 100% completion
      const finalProgress = await testUtils.getProgressUpdates(analysisId)
      const lastUpdate = finalProgress[finalProgress.length - 1]
      expect(lastUpdate.progress_percent).toBe(100)
      
      console.log('✅ Complete user workflow test passed!')
    }, 30000)

    it('should handle user abandonment gracefully', async () => {
      // Simulate user starting analysis but not waiting
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      
      // Start analysis
      await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      // User "abandons" - we just check the system continues working
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Analysis should still complete even if user isn't watching
      const finalStatus = await testUtils.waitForAnalysis(analysisId, 15000)
      expect(finalStatus).toBe('completed')
      
      // Results should still be available
      const factorResults = await testUtils.getFactorResults(analysisId)
      expect(factorResults.length).toBeGreaterThan(0)
    }, 25000)
  })

  describe('User Error Scenarios', () => {
    it('should handle invalid URL submission', async () => {
      const invalidUrl = 'not-a-valid-url'
      const { analysisId, userId } = await testUtils.createTestAnalysis(invalidUrl)
      
      const { data, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: invalidUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      // Should either return error or handle gracefully
      if (error) {
        expect(error.message).toBeDefined()
        console.log(`✅ Invalid URL properly rejected: ${error.message}`)
      } else {
        // If no immediate error, check if analysis was marked as failed
        const finalStatus = await testUtils.waitForAnalysis(analysisId, 10000)
        expect(['failed', 'completed']).toContain(finalStatus)
        console.log(`✅ Invalid URL handled gracefully: ${finalStatus}`)
      }
    })

    it('should handle slow/timeout scenarios', async () => {
      // Use a slow-responding URL
      const slowUrl = 'https://httpstat.us/200?sleep=8000'
      const { analysisId, userId } = await testUtils.createTestAnalysis(slowUrl)
      
      const startTime = Date.now()
      
      const { data, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: slowUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      // Should handle timeout gracefully
      if (error) {
        expect(error.message).toBeDefined()
      } else {
        const finalStatus = await testUtils.waitForAnalysis(analysisId, 20000)
        expect(['failed', 'completed']).toContain(finalStatus)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`⏱️  Slow URL handled in ${duration}ms`)
      expect(duration).toBeLessThan(25000) // Should not hang indefinitely
    }, 30000)
  })

  describe('Multi-User Scenarios', () => {
    it('should handle multiple users analyzing simultaneously', async () => {
      const userCount = 3
      const testPromises = []
      
      console.log(`👥 Testing ${userCount} simultaneous users...`)
      
      for (let i = 0; i < userCount; i++) {
        const testUrl = `https://example.com?user=${i}`
        const promise = (async () => {
          const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
          
          // User starts analysis
          await testSupabase.functions.invoke('analyze-page', {
            body: {
              url: testUrl,
              analysisId: analysisId,
              userId: userId
            }
          })
          
          // User waits for completion
          const status = await testUtils.waitForAnalysis(analysisId, 20000)
          
          // User views results
          const factors = await testUtils.getFactorResults(analysisId)
          
          return {
            userId: i,
            analysisId,
            status,
            factorCount: factors.length
          }
        })()
        
        testPromises.push(promise)
      }
      
      const results = await Promise.all(testPromises)
      
      // All users should complete successfully
      results.forEach((result, index) => {
        console.log(`   User ${index}: ${result.status} (${result.factorCount} factors)`)
        expect(result.status).toBe('completed')
        expect(result.factorCount).toBeGreaterThan(0)
      })
    }, 40000)
  })

  describe('Data Consistency', () => {
    it('should maintain data integrity across user session', async () => {
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      
      // Start analysis
      await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      // Monitor progress throughout analysis
      const progressSnapshots = []
      const snapshotInterval = setInterval(async () => {
        const progress = await testUtils.getProgressUpdates(analysisId)
        const factors = await testUtils.getFactorResults(analysisId)
        
        progressSnapshots.push({
          timestamp: Date.now(),
          progressCount: progress.length,
          factorCount: factors.length,
          lastProgress: progress[progress.length - 1]?.progress_percent || 0
        })
      }, 1000)
      
      // Wait for completion
      await testUtils.waitForAnalysis(analysisId, 20000)
      clearInterval(snapshotInterval)
      
      // Verify progress was monotonic (always increasing)
      for (let i = 1; i < progressSnapshots.length; i++) {
        expect(progressSnapshots[i].lastProgress).toBeGreaterThanOrEqual(
          progressSnapshots[i - 1].lastProgress
        )
      }
      
      // Verify final state is consistent
      const finalProgress = await testUtils.getProgressUpdates(analysisId)
      const finalFactors = await testUtils.getFactorResults(analysisId)
      const finalAnalysis = await testSupabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      
      expect(finalAnalysis.data.status).toBe('completed')
      expect(finalProgress[finalProgress.length - 1].progress_percent).toBe(100)
      expect(finalFactors.length).toBeGreaterThan(0)
      
      console.log(`✅ Data integrity maintained through ${progressSnapshots.length} snapshots`)
    }, 35000)
  })

  describe('Performance from User Perspective', () => {
    it('should provide good user experience timing', async () => {
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      
      const startTime = Date.now()
      
      // User submits URL
      await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })
      
      // Time to first progress update
      let firstProgressTime = null
      while (!firstProgressTime) {
        const progress = await testUtils.getProgressUpdates(analysisId)
        if (progress.length > 0) {
          firstProgressTime = Date.now()
        } else {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Time to first factor results
      let firstFactorTime = null
      while (!firstFactorTime) {
        const factors = await testUtils.getFactorResults(analysisId)
        if (factors.length > 0) {
          firstFactorTime = Date.now()
        } else {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Time to completion
      await testUtils.waitForAnalysis(analysisId, 20000)
      const completionTime = Date.now()
      
      // Calculate user experience metrics
      const timeToFirstProgress = firstProgressTime - startTime
      const timeToFirstResults = firstFactorTime - startTime
      const timeToCompletion = completionTime - startTime
      
      console.log(`📊 User Experience Timing:`)
      console.log(`   First progress: ${timeToFirstProgress}ms`)
      console.log(`   First results: ${timeToFirstResults}ms`)
      console.log(`   Completion: ${timeToCompletion}ms`)
      
      // User experience expectations
      expect(timeToFirstProgress).toBeLessThan(2000) // Progress within 2 seconds
      expect(timeToFirstResults).toBeLessThan(12000) // Results within 12 seconds
      expect(timeToCompletion).toBeLessThan(18000) // Complete within 18 seconds
    }, 25000)
  })
})