// Performance and Load Tests for AImpactScanner
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testConfig, testUtils, testSupabase } from '../setup/test-config.js'
import testUrls from '../test-data/urls.json'

describe('Performance Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Starting performance tests...')
    await testUtils.cleanupTestData()
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up performance test data...')
    await testUtils.cleanupTestData()
  })

  describe('Edge Function Performance', () => {
    it('should complete analysis within 15 seconds', async () => {
      const testUrl = 'https://example.com'
      const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
      
      const startTime = Date.now()
      
      const { data, error } = await testSupabase.functions.invoke('analyze-page', {
        body: {
          url: testUrl,
          analysisId: analysisId,
          userId: userId
        }
      })

      expect(error).toBeNull()
      expect(data.success).toBe(true)

      await testUtils.waitForAnalysis(analysisId, 15000)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`⏱️  Analysis completed in ${duration}ms`)
      expect(duration).toBeLessThan(15000) // 15 second target
    }, 20000)

    it('should handle fast-loading sites efficiently', async () => {
      const fastSites = testUrls.test_urls.performance_tests.filter(
        site => site.timeout_target < 10000
      )

      for (const site of fastSites) {
        const { analysisId, userId } = await testUtils.createTestAnalysis(site.url)
        
        const startTime = Date.now()
        
        await testSupabase.functions.invoke('analyze-page', {
          body: {
            url: site.url,
            analysisId: analysisId,
            userId: userId
          }
        })

        await testUtils.waitForAnalysis(analysisId, site.timeout_target)
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.log(`⚡ ${site.description}: ${duration}ms`)
        expect(duration).toBeLessThan(site.timeout_target)
      }
    }, 30000)
  })

  describe('Concurrent User Load', () => {
    it('should handle 5 concurrent analyses', async () => {
      const concurrentCount = 5
      const testPromises = []
      const startTime = Date.now()

      console.log(`🔄 Starting ${concurrentCount} concurrent analyses...`)

      for (let i = 0; i < concurrentCount; i++) {
        const testUrl = `https://example.com?concurrent=${i}`
        const promise = (async () => {
          const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
          
          const analysisStart = Date.now()
          
          await testSupabase.functions.invoke('analyze-page', {
            body: {
              url: testUrl,
              analysisId: analysisId,
              userId: userId
            }
          })

          const status = await testUtils.waitForAnalysis(analysisId, 20000)
          const analysisEnd = Date.now()
          
          return {
            analysisId,
            status,
            duration: analysisEnd - analysisStart,
            index: i
          }
        })()
        
        testPromises.push(promise)
      }

      const results = await Promise.all(testPromises)
      const endTime = Date.now()
      const totalDuration = endTime - startTime
      
      console.log(`✅ All concurrent analyses completed in ${totalDuration}ms`)
      
      // Verify all analyses completed successfully
      results.forEach((result, index) => {
        console.log(`   Analysis ${index}: ${result.status} (${result.duration}ms)`)
        expect(result.status).toBe('completed')
        expect(result.duration).toBeLessThan(20000) // Individual timeout
      })
      
      // Total time should be reasonable (not much longer than individual)
      expect(totalDuration).toBeLessThan(25000)
    }, 35000)

    it('should handle 10 concurrent analyses without degradation', async () => {
      const concurrentCount = 10
      const testPromises = []
      const startTime = Date.now()

      console.log(`🔄 Starting ${concurrentCount} concurrent analyses...`)

      for (let i = 0; i < concurrentCount; i++) {
        const testUrl = `https://httpbin.org/delay/${Math.floor(Math.random() * 3)}`
        const promise = (async () => {
          const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
          
          const analysisStart = Date.now()
          
          try {
            await testSupabase.functions.invoke('analyze-page', {
              body: {
                url: testUrl,
                analysisId: analysisId,
                userId: userId
              }
            })

            const status = await testUtils.waitForAnalysis(analysisId, 25000)
            const analysisEnd = Date.now()
            
            return {
              analysisId,
              status,
              duration: analysisEnd - analysisStart,
              index: i,
              success: true
            }
          } catch (error) {
            console.error(`❌ Analysis ${i} failed:`, error.message)
            return {
              analysisId,
              status: 'failed',
              duration: Date.now() - analysisStart,
              index: i,
              success: false,
              error: error.message
            }
          }
        })()
        
        testPromises.push(promise)
      }

      const results = await Promise.all(testPromises)
      const endTime = Date.now()
      const totalDuration = endTime - startTime
      
      console.log(`📊 Concurrent load test completed in ${totalDuration}ms`)
      
      // Calculate success rate
      const successCount = results.filter(r => r.success).length
      const successRate = (successCount / concurrentCount) * 100
      
      console.log(`   Success rate: ${successRate}% (${successCount}/${concurrentCount})`)
      
      // Performance metrics
      const durations = results.filter(r => r.success).map(r => r.duration)
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      
      console.log(`   Average duration: ${avgDuration.toFixed(0)}ms`)
      console.log(`   Max duration: ${maxDuration}ms`)
      
      // Assertions
      expect(successRate).toBeGreaterThan(80) // At least 80% success rate
      expect(avgDuration).toBeLessThan(20000) // Average under 20s
      expect(maxDuration).toBeLessThan(30000) // No single analysis over 30s
    }, 60000)
  })

  describe('Database Performance', () => {
    it('should handle rapid progress updates', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      
      const updateCount = 50
      const startTime = Date.now()
      
      // Insert many progress updates rapidly
      const updatePromises = []
      for (let i = 0; i < updateCount; i++) {
        updatePromises.push(
          testSupabase
            .from('analysis_progress')
            .insert({
              analysis_id: analysisId,
              stage: `rapid_stage_${i}`,
              progress_percent: Math.floor((i / updateCount) * 100),
              message: `Rapid update ${i}`,
              educational_content: `Learning step ${i}`
            })
        )
      }

      const results = await Promise.all(updatePromises)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`📊 ${updateCount} progress updates completed in ${duration}ms`)
      
      // Verify all updates succeeded
      const failedUpdates = results.filter(r => r.error !== null)
      expect(failedUpdates).toHaveLength(0)
      
      // Performance expectation
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
      
      // Verify data integrity
      const progress = await testUtils.getProgressUpdates(analysisId)
      expect(progress).toHaveLength(updateCount)
    }, 10000)

    it('should handle bulk factor insertions', async () => {
      const { analysisId } = await testUtils.createTestAnalysis()
      
      const factorCount = 22 // All MVP factors
      const startTime = Date.now()
      
      // Create mock factor data
      const factors = []
      for (let i = 0; i < factorCount; i++) {
        factors.push({
          analysis_id: analysisId,
          factor_id: `TEST.${i}.${i}`,
          factor_name: `Test Factor ${i}`,
          pillar: ['AI', 'Authority', 'Machine'][i % 3],
          phase: i < 10 ? 'instant' : 'background',
          score: Math.floor(Math.random() * 100),
          confidence: 80 + Math.floor(Math.random() * 20),
          weight: 1.0,
          evidence: [`Evidence for factor ${i}`],
          recommendations: [`Recommendation for factor ${i}`],
          processing_time_ms: 50 + Math.floor(Math.random() * 200)
        })
      }

      // Insert all factors
      const { error } = await testSupabase
        .from('analysis_factors')
        .insert(factors)

      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`📊 ${factorCount} factors inserted in ${duration}ms`)
      
      expect(error).toBeNull()
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
      
      // Verify all factors were inserted
      const insertedFactors = await testUtils.getFactorResults(analysisId)
      expect(insertedFactors).toHaveLength(factorCount)
    }, 5000)
  })

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated analyses', async () => {
      const iterations = 10
      const results = []
      
      console.log(`🔄 Running ${iterations} sequential analyses...`)
      
      for (let i = 0; i < iterations; i++) {
        const testUrl = `https://example.com?iteration=${i}`
        const { analysisId, userId } = await testUtils.createTestAnalysis(testUrl)
        
        const startTime = Date.now()
        
        await testSupabase.functions.invoke('analyze-page', {
          body: {
            url: testUrl,
            analysisId: analysisId,
            userId: userId
          }
        })

        const status = await testUtils.waitForAnalysis(analysisId, 15000)
        const endTime = Date.now()
        
        results.push({
          iteration: i,
          status,
          duration: endTime - startTime
        })
        
        // Clean up after each iteration
        await testSupabase.from('analysis_progress').delete().eq('analysis_id', analysisId)
        await testSupabase.from('analysis_factors').delete().eq('analysis_id', analysisId)
        await testSupabase.from('analyses').delete().eq('id', analysisId)
      }
      
      console.log('📊 Sequential analysis results:')
      results.forEach((result, index) => {
        console.log(`   Iteration ${index}: ${result.status} (${result.duration}ms)`)
      })
      
      // Verify consistent performance (no memory leaks causing slowdown)
      const durations = results.map(r => r.duration)
      const firstHalf = durations.slice(0, Math.floor(durations.length / 2))
      const secondHalf = durations.slice(Math.floor(durations.length / 2))
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      console.log(`   First half average: ${firstHalfAvg.toFixed(0)}ms`)
      console.log(`   Second half average: ${secondHalfAvg.toFixed(0)}ms`)
      
      // Second half should not be significantly slower (indicating memory leaks)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5)
    }, 60000)
  })

  describe('Error Recovery Performance', () => {
    it('should handle and recover from errors quickly', async () => {
      const errorScenarios = [
        'https://httpstat.us/500',
        'https://httpstat.us/404',
        'https://httpstat.us/timeout',
        'not-a-valid-url'
      ]
      
      const results = []
      
      for (const errorUrl of errorScenarios) {
        const { analysisId, userId } = await testUtils.createTestAnalysis(errorUrl)
        
        const startTime = Date.now()
        
        try {
          await testSupabase.functions.invoke('analyze-page', {
            body: {
              url: errorUrl,
              analysisId: analysisId,
              userId: userId
            }
          })

          // Wait for completion or timeout
          const status = await testUtils.waitForAnalysis(analysisId, 10000)
          const endTime = Date.now()
          
          results.push({
            url: errorUrl,
            status,
            duration: endTime - startTime,
            handled: true
          })
        } catch (error) {
          const endTime = Date.now()
          results.push({
            url: errorUrl,
            status: 'error',
            duration: endTime - startTime,
            handled: true,
            error: error.message
          })
        }
      }
      
      console.log('📊 Error handling results:')
      results.forEach(result => {
        console.log(`   ${result.url}: ${result.status} (${result.duration}ms)`)
      })
      
      // All error scenarios should be handled quickly
      results.forEach(result => {
        expect(result.handled).toBe(true)
        expect(result.duration).toBeLessThan(15000) // Should timeout/fail quickly
      })
    }, 30000)
  })
})