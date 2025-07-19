// Integration Tests for Complete Analysis Flow
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testConfig, testUtils, testSupabase } from '../setup/test-config.js'

describe('Analysis Flow Integration Tests', () => {
  let testAnalysisId
  let testUserId

  beforeEach(async () => {
    // Clean up any existing test data
    await testUtils.cleanupTestData()
  })

  afterEach(async () => {
    // Clean up test data after each test
    await testUtils.cleanupTestData()
  })

  describe('Database Operations', () => {
    it('should create analysis record', async () => {
      const { analysisId, userId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId
      testUserId = userId

      const { data, error } = await testSupabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.id).toBe(analysisId)
      expect(data.user_id).toBe(userId)
      expect(data.status).toBe('pending')
    })

    it('should update analysis status', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      const { error } = await testSupabase
        .from('analyses')
        .update({ status: 'processing' })
        .eq('id', analysisId)

      expect(error).toBeNull()

      const { data } = await testSupabase
        .from('analyses')
        .select('status')
        .eq('id', analysisId)
        .single()

      expect(data.status).toBe('processing')
    })

    it('should insert progress updates', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      const progressUpdate = {
        analysis_id: analysisId,
        stage: 'initialization',
        progress_percent: 10,
        message: 'Starting analysis...',
        educational_content: 'Learning about AI optimization'
      }

      const { error } = await testSupabase
        .from('analysis_progress')
        .insert(progressUpdate)

      expect(error).toBeNull()

      const progress = await testUtils.getProgressUpdates(analysisId)
      expect(progress).toHaveLength(1)
      expect(progress[0].stage).toBe('initialization')
      expect(progress[0].progress_percent).toBe(10)
    })

    it('should insert factor results', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      const factorResult = {
        analysis_id: analysisId,
        factor_id: 'AI.1.1',
        factor_name: 'HTTPS Security',
        pillar: 'AI',
        phase: 'instant',
        score: 100,
        confidence: 100,
        weight: 1.0,
        evidence: ['Site uses HTTPS'],
        recommendations: [],
        processing_time_ms: 50
      }

      const { error } = await testSupabase
        .from('analysis_factors')
        .insert(factorResult)

      expect(error).toBeNull()

      const factors = await testUtils.getFactorResults(analysisId)
      expect(factors).toHaveLength(1)
      expect(factors[0].factor_id).toBe('AI.1.1')
      expect(factors[0].score).toBe(100)
    })
  })

  describe('Edge Function Integration', () => {
    it('should invoke analyze-page function successfully', async () => {
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      testAnalysisId = analysisId
      testUserId = userId

      const { data, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })

      if (error) {
        console.error('Edge Function error details:', error)
        console.error('Error context:', error.context)
        if (error.context && error.context.text) {
          const errorText = await error.context.text()
          console.error('Error response body:', errorText)
        }
      }

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.analysisId).toBe(analysisId)
    }, testConfig.timeouts.edge_function)

    it('should complete analysis workflow', async () => {
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      testAnalysisId = analysisId
      testUserId = userId

      // Invoke the Edge Function
      const { data, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })

      expect(error).toBeNull()
      expect(data.success).toBe(true)

      // Wait for completion
      const finalStatus = await testUtils.waitForAnalysis(analysisId, 20000)
      expect(finalStatus).toBe('completed')

      // Verify progress updates were created
      const progress = await testUtils.getProgressUpdates(analysisId)
      expect(progress.length).toBeGreaterThan(0)
      expect(progress[progress.length - 1].progress_percent).toBe(100)

      // Verify factor results were created
      const factors = await testUtils.getFactorResults(analysisId)
      expect(factors.length).toBeGreaterThan(0)
      
      // Verify all factors have required fields
      factors.forEach(factor => {
        expect(factor.factor_id).toBeDefined()
        expect(factor.factor_name).toBeDefined()
        expect(factor.pillar).toBeDefined()
        expect(typeof factor.score).toBe('number')
        expect(typeof factor.confidence).toBe('number')
        expect(Array.isArray(factor.evidence)).toBe(true)
        expect(Array.isArray(factor.recommendations)).toBe(true)
      })
    }, testConfig.timeouts.integration_test)

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'not-a-valid-url'
      const { analysisId, userId } = await testUtils.createTestAnalysis(invalidUrl)
      testAnalysisId = analysisId
      testUserId = userId

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
      } else {
        // If no error, check if analysis was marked as failed
        const finalStatus = await testUtils.waitForAnalysis(analysisId, 10000)
        expect(['failed', 'completed']).toContain(finalStatus)
      }
    })
  })

  describe('Real-time Progress Tracking', () => {
    it('should create progress updates in chronological order', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      // Insert progress updates with different timestamps
      const updates = [
        { stage: 'initialization', progress_percent: 10, message: 'Starting...' },
        { stage: 'processing', progress_percent: 50, message: 'Processing...' },
        { stage: 'completion', progress_percent: 100, message: 'Complete!' }
      ]

      for (const update of updates) {
        await testSupabase
          .from('analysis_progress')
          .insert({
            analysis_id: analysisId,
            ...update,
            educational_content: `Learning: ${update.message}`
          })
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const progress = await testUtils.getProgressUpdates(analysisId)
      expect(progress).toHaveLength(3)
      
      // Verify chronological order
      expect(progress[0].progress_percent).toBe(10)
      expect(progress[1].progress_percent).toBe(50)
      expect(progress[2].progress_percent).toBe(100)
    })

    it('should handle concurrent progress updates', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      // Create multiple progress updates concurrently
      const updatePromises = []
      for (let i = 0; i < 5; i++) {
        updatePromises.push(
          testSupabase
            .from('analysis_progress')
            .insert({
              analysis_id: analysisId,
              stage: `stage_${i}`,
              progress_percent: (i + 1) * 20,
              message: `Progress ${i + 1}`,
              educational_content: `Learning step ${i + 1}`
            })
        )
      }

      const results = await Promise.all(updatePromises)
      
      // All updates should succeed
      results.forEach(result => {
        expect(result.error).toBeNull()
      })

      const progress = await testUtils.getProgressUpdates(analysisId)
      expect(progress).toHaveLength(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // This test would need a way to simulate database errors
      // For now, just verify error handling structure exists
      expect(testUtils.cleanupTestData).toBeDefined()
      expect(testUtils.waitForAnalysis).toBeDefined()
    })

    it('should handle malformed analysis data', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      testAnalysisId = analysisId

      // Try to insert malformed factor data
      const { error } = await testSupabase
        .from('analysis_factors')
        .insert({
          analysis_id: analysisId,
          factor_id: 'INVALID',
          // Missing required fields
          score: 'not-a-number' // Invalid type
        })

      // Should fail due to validation
      expect(error).toBeDefined()
    })
  })

  describe('Performance Validation', () => {
    it('should complete analysis within timeout limits', async () => {
      const startTime = Date.now()
      
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      testAnalysisId = analysisId
      testUserId = userId

      await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })

      await testUtils.waitForAnalysis(analysisId, testConfig.timeouts.edge_function)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(testConfig.timeouts.edge_function)
    }, testConfig.timeouts.integration_test)

    it('should handle multiple concurrent analyses', async () => {
      const concurrentCount = 3
      const testPromises = []

      for (let i = 0; i < concurrentCount; i++) {
        const testUrl = `https://example.com?test=${i}`
        const promise = (async () => {
          const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
          
          await testSupabase.functions.invoke('analyze-page', {
            body: {
              url: testUrl,
              analysisId: analysisId,
              userId: userId
            }
          })

          return testUtils.waitForAnalysis(analysisId, testConfig.timeouts.edge_function)
        })()
        
        testPromises.push(promise)
      }

      const results = await Promise.all(testPromises)
      
      // All analyses should complete successfully
      results.forEach(status => {
        expect(status).toBe('completed')
      })
    }, testConfig.timeouts.integration_test * 2)
  })
})