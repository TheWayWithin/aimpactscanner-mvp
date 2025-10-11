/**
 * UAT Phase 4 - Manual Analysis Testing
 * Testing complete analysis flow to see full results
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ANALYSIS_TIMEOUT = 30000; // 30 seconds for complete analysis

test.describe('UAT Phase 4 - Complete Analysis Flow', () => {
  
  test('Phase 4: Complete Analysis Flow Test', async ({ page }) => {
    console.log('🎯 Testing complete analysis flow with example.com...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find and use the main analysis input
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    await mainUrlInput.fill('example.com');
    console.log('✅ URL entered: example.com');
    
    // Start analysis
    await mainUrlInput.press('Enter');
    console.log('🚀 Analysis started');
    
    // Monitor progress with detailed logging
    let currentState = 'starting';
    let analysisCompleted = false;
    let progressUpdates = [];
    
    for (let i = 0; i < 25; i++) { // Monitor for up to 50 seconds
      await page.waitForTimeout(2000);
      
      const bodyText = await page.textContent('body');
      const lowerText = bodyText.toLowerCase();
      
      // Check for various analysis states
      if (lowerText.includes('analyzing') && currentState !== 'analyzing') {
        currentState = 'analyzing';
        console.log(`📊 State: ANALYZING (${i * 2}s)`);
        progressUpdates.push(`${i * 2}s: Analyzing`);
      }
      
      if (lowerText.includes('score') && !lowerText.includes('analyzing')) {
        currentState = 'results';
        analysisCompleted = true;
        console.log(`🎯 State: RESULTS READY (${i * 2}s)`);
        progressUpdates.push(`${i * 2}s: Results ready`);
        break;
      }
      
      if (lowerText.includes('pillar') || lowerText.includes('mastery')) {
        if (currentState !== 'results') {
          currentState = 'results';
          analysisCompleted = true;
          console.log(`🏆 State: MASTERY RESULTS (${i * 2}s)`);
          progressUpdates.push(`${i * 2}s: MASTERY results`);
          break;
        }
      }
      
      // Log progress every 10 seconds
      if (i % 5 === 0) {
        console.log(`⏱️  Monitoring... ${i * 2}s elapsed, current state: ${currentState}`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/phase4-complete-analysis.png', fullPage: true });
    
    // Extract detailed analysis information
    const finalBodyText = await page.textContent('body');
    
    // Look for scores
    const scores = finalBodyText.match(/\d+\/100|\d+%|\d+ score/gi) || [];
    console.log(`📈 Scores found: ${scores.join(', ')}`);
    
    // Look for MASTERY framework elements
    const masteryElements = finalBodyText.toLowerCase().match(/mastery|pillar|dimension|metric|framework/g) || [];
    console.log(`🎯 MASTERY elements: ${masteryElements.length} references`);
    
    // Look for analysis components
    const analysisComponents = {
      recommendations: (finalBodyText.toLowerCase().match(/recommend|improve|suggest|optimize/g) || []).length,
      insights: (finalBodyText.toLowerCase().match(/insight|finding|analysis|assessment/g) || []).length,
      metrics: (finalBodyText.toLowerCase().match(/metric|measure|performance|speed/g) || []).length
    };
    
    console.log('📊 Analysis Components Found:');
    Object.entries(analysisComponents).forEach(([component, count]) => {
      console.log(`  ${component}: ${count} references`);
    });
    
    // Performance assessment
    const totalTime = progressUpdates.length > 0 ? 
      parseInt(progressUpdates[progressUpdates.length - 1].split(':')[0].replace('s', '')) : 'unknown';
    
    console.log('\n🎯 PHASE 4 ANALYSIS SUMMARY:');
    console.log(`✅ Analysis Engine: ${analysisCompleted ? 'WORKING' : 'NEEDS INVESTIGATION'}`);
    console.log(`⏱️  Performance: ${totalTime}s ${totalTime !== 'unknown' && totalTime <= 15 ? '(MEETS TARGET)' : '(NEEDS REVIEW)'}`);
    console.log(`🏆 MASTERY Framework: ${masteryElements.length > 0 ? 'DETECTED' : 'NOT FOUND'}`);
    console.log(`📈 Score Display: ${scores.length > 0 ? 'WORKING' : 'NOT DETECTED'}`);
    console.log(`📊 Analysis Components: ${Object.values(analysisComponents).some(c => c > 0) ? 'PRESENT' : 'MISSING'}`);
    
    console.log('\n📋 Progress Updates:');
    progressUpdates.forEach(update => console.log(`  ${update}`));
  });

});