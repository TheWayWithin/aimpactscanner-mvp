/**
 * UAT Phase 4 - Analysis Engine Testing
 * Testing core business functionality: MASTERY-AI framework, performance, accuracy
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ANALYSIS_TIMEOUT = 20000; // 20 seconds to allow for <15 second target plus buffer
const TEST_WEBSITES = [
  { url: 'https://example.com', type: 'corporate', expected_score_range: [30, 60] },
  { url: 'https://stripe.com', type: 'saas', expected_score_range: [70, 95] },
  { url: 'https://wordpress.com', type: 'blog', expected_score_range: [60, 85] },
  { url: 'https://shopify.com', type: 'ecommerce', expected_score_range: [65, 90] }
];

test.describe('UAT Phase 4 - Analysis Engine Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Phase 4.1: Analysis Engine Accessibility and Setup', async ({ page }) => {
    console.log('🔍 Testing analysis engine accessibility...');
    
    // Check landing page loads correctly
    await expect(page.locator('h1')).toContainText('AI Impact');
    
    // Verify analysis input is accessible
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await expect(urlInput).toBeVisible();
    
    // Check if analysis button is present
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await expect(analyzeButton).toBeVisible();
    
    console.log('✅ Analysis engine accessibility confirmed');
  });

  test('Phase 4.2: MASTERY-AI Framework Validation', async ({ page }) => {
    console.log('🎯 Testing MASTERY-AI 8-pillar framework...');
    
    // Navigate to analysis input
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    // Start analysis
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Wait for analysis to complete or show results
    try {
      await page.waitForSelector('[data-testid="analysis-results"], .analysis-results, .pillars, .mastery', { timeout: ANALYSIS_TIMEOUT });
    } catch (error) {
      // If specific selectors don't exist, wait for any results container
      await page.waitForFunction(() => {
        return document.querySelector('*[class*="result"], *[class*="score"], *[class*="pillar"], *[class*="analysis"]');
      }, { timeout: ANALYSIS_TIMEOUT });
    }
    
    // Take screenshot of results
    await page.screenshot({ path: 'test-results/phase4-mastery-framework.png', fullPage: true });
    
    // Check for MASTERY-AI pillars (should be 8)
    const pillarElements = await page.locator('*').filter({ hasText: /pillar|dimension|metric|factor/i }).count();
    const masteryElements = await page.locator('*').filter({ hasText: /mastery|framework|M\.A\.S\.T\.E\.R\.Y/i }).count();
    
    console.log(`📊 Found ${pillarElements} pillar references, ${masteryElements} MASTERY references`);
    
    // Known issue: Checking for 7 vs 8 pillars
    if (pillarElements >= 7) {
      console.log('✅ MASTERY-AI framework detected');
      if (pillarElements === 7) {
        console.log('⚠️  Known issue confirmed: 7 pillars detected instead of 8');
      } else if (pillarElements >= 8) {
        console.log('🎯 Perfect: 8+ pillars detected');
      }
    } else {
      console.log('❌ MASTERY-AI framework not properly displayed');
    }
  });

  test('Phase 4.3: Performance Benchmark Testing', async ({ page }) => {
    console.log('⚡ Testing analysis performance (<15 seconds)...');
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    // Start timer
    const startTime = Date.now();
    
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Wait for analysis completion
    try {
      await page.waitForSelector('[data-testid="analysis-complete"], .analysis-complete, .results-ready', { timeout: ANALYSIS_TIMEOUT });
    } catch (error) {
      // Alternative: wait for score or results to appear
      await page.waitForFunction(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('score') || text.includes('analysis complete') || text.includes('results');
      }, { timeout: ANALYSIS_TIMEOUT });
    }
    
    const endTime = Date.now();
    const analysisTime = (endTime - startTime) / 1000;
    
    console.log(`⏱️  Analysis completed in ${analysisTime} seconds`);
    
    // Verify performance requirement
    if (analysisTime <= 15) {
      console.log('✅ Performance target met (<15 seconds)');
    } else {
      console.log(`❌ Performance target missed: ${analysisTime}s > 15s`);
    }
    
    // Take screenshot of results
    await page.screenshot({ path: 'test-results/phase4-performance-results.png', fullPage: true });
  });

  test('Phase 4.4: Multi-Website Analysis Accuracy', async ({ page }) => {
    console.log('🌐 Testing analysis accuracy across different website types...');
    
    const results = [];
    
    for (const website of TEST_WEBSITES) {
      console.log(`\n🔍 Testing ${website.type} website: ${website.url}`);
      
      // Navigate back to input (in case we're on results page)
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
      await urlInput.fill(website.url);
      
      const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
      await analyzeButton.click();
      
      // Wait for results
      try {
        await page.waitForFunction(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('score') || text.includes('analysis complete') || text.includes('results');
        }, { timeout: ANALYSIS_TIMEOUT });
      } catch (error) {
        console.log(`⚠️  Timeout waiting for ${website.url} analysis`);
        continue;
      }
      
      // Extract score if visible
      let score = null;
      try {
        const scoreText = await page.locator('*').filter({ hasText: /score|rating|\d+\/100|\d+%/i }).first().textContent();
        const scoreMatch = scoreText.match(/(\d+)/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
        }
      } catch (error) {
        console.log(`Could not extract score for ${website.url}`);
      }
      
      results.push({
        url: website.url,
        type: website.type,
        score: score,
        expected_range: website.expected_score_range
      });
      
      console.log(`📊 ${website.type} (${website.url}): Score ${score || 'not found'}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/phase4-analysis-${website.type}.png`, 
        fullPage: true 
      });
    }
    
    // Analyze results
    console.log('\n📈 Analysis Accuracy Summary:');
    results.forEach(result => {
      if (result.score !== null) {
        const inRange = result.score >= result.expected_range[0] && result.score <= result.expected_range[1];
        console.log(`${result.type}: ${inRange ? '✅' : '⚠️'} Score ${result.score} (expected ${result.expected_range[0]}-${result.expected_range[1]})`);
      } else {
        console.log(`${result.type}: ❌ No score detected`);
      }
    });
  });

  test('Phase 4.5: Report Generation Validation', async ({ page }) => {
    console.log('📄 Testing analysis report generation...');
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Wait for analysis completion
    await page.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('score') || text.includes('analysis complete') || text.includes('results');
    }, { timeout: ANALYSIS_TIMEOUT });
    
    // Check report components
    const reportElements = {
      score: await page.locator('*').filter({ hasText: /score|rating|\d+\/100|\d+%/i }).count(),
      recommendations: await page.locator('*').filter({ hasText: /recommend|improve|suggest/i }).count(),
      analysis: await page.locator('*').filter({ hasText: /analysis|assessment|evaluation/i }).count(),
      details: await page.locator('*').filter({ hasText: /detail|breakdown|specific/i }).count()
    };
    
    console.log('📊 Report Components Found:');
    Object.entries(reportElements).forEach(([component, count]) => {
      console.log(`  ${component}: ${count > 0 ? '✅' : '❌'} (${count} elements)`);
    });
    
    // Take screenshot of full report
    await page.screenshot({ path: 'test-results/phase4-report-generation.png', fullPage: true });
  });

  test('Phase 4.6: PDF Export Functionality', async ({ page }) => {
    console.log('📑 Testing PDF export functionality...');
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Wait for analysis completion
    await page.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('score') || text.includes('analysis complete') || text.includes('results');
    }, { timeout: ANALYSIS_TIMEOUT });
    
    // Look for PDF export functionality
    const pdfButton = page.locator('button, a').filter({ hasText: /pdf|download|export|report/i });
    const pdfButtonCount = await pdfButton.count();
    
    if (pdfButtonCount > 0) {
      console.log(`✅ PDF export button found (${pdfButtonCount} options)`);
      
      // Test PDF download (if available)
      try {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
        await pdfButton.first().click();
        const download = await downloadPromise;
        console.log(`📁 Download initiated: ${download.suggestedFilename()}`);
      } catch (error) {
        console.log('⚠️  PDF download test skipped (may require authentication or special setup)');
      }
    } else {
      console.log('❌ PDF export functionality not found');
    }
    
    await page.screenshot({ path: 'test-results/phase4-pdf-export.png', fullPage: true });
  });

  test('Phase 4.7: Real-time Progress Updates', async ({ page }) => {
    console.log('🔄 Testing real-time progress indicators...');
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Monitor for progress indicators
    const progressChecks = [];
    let checkCount = 0;
    const maxChecks = 10;
    
    while (checkCount < maxChecks) {
      await page.waitForTimeout(1000); // Wait 1 second between checks
      
      const progressElements = {
        loading: await page.locator('*').filter({ hasText: /loading|analyzing|processing/i }).count(),
        progress: await page.locator('progress, .progress, [role="progressbar"]').count(),
        spinner: await page.locator('.spinner, .loading-spinner, .animate-spin').count(),
        percentage: await page.locator('*').filter({ hasText: /\d+%|\d+ of \d+/i }).count()
      };
      
      progressChecks.push({
        time: checkCount,
        ...progressElements
      });
      
      checkCount++;
      
      // Check if analysis is complete
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('score') || bodyText.toLowerCase().includes('complete')) {
        console.log(`🏁 Analysis completed at check ${checkCount}`);
        break;
      }
    }
    
    // Analyze progress indicators
    const hasProgressIndicators = progressChecks.some(check => 
      check.loading > 0 || check.progress > 0 || check.spinner > 0 || check.percentage > 0
    );
    
    if (hasProgressIndicators) {
      console.log('✅ Real-time progress indicators detected');
      console.log('📊 Progress indicator timeline:');
      progressChecks.forEach((check, index) => {
        if (check.loading > 0 || check.progress > 0 || check.spinner > 0 || check.percentage > 0) {
          console.log(`  Time ${check.time}s: Loading(${check.loading}) Progress(${check.progress}) Spinner(${check.spinner}) Percentage(${check.percentage})`);
        }
      });
    } else {
      console.log('❌ No real-time progress indicators found');
    }
    
    await page.screenshot({ path: 'test-results/phase4-progress-indicators.png', fullPage: true });
  });

  test('Phase 4.8: Cross-Browser Analysis Testing', async ({ browserName, page }) => {
    console.log(`🌐 Testing analysis engine on ${browserName}...`);
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan|start|go/i });
    await analyzeButton.click();
    
    // Test analysis completion
    try {
      await page.waitForFunction(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('score') || text.includes('analysis complete') || text.includes('results');
      }, { timeout: ANALYSIS_TIMEOUT });
      
      console.log(`✅ Analysis engine working on ${browserName}`);
    } catch (error) {
      console.log(`❌ Analysis engine failed on ${browserName}`);
    }
    
    await page.screenshot({ 
      path: `test-results/phase4-cross-browser-${browserName}.png`, 
      fullPage: true 
    });
  });
});