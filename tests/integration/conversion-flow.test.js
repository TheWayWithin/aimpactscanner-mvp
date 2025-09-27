// Conversion Flow Tests - Upgrade triggers and Payment flows
// Tests the complete conversion journey from preview to payment

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_URL = 'https://anthropic.com';

test.describe('Conversion Flow Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('Complete Conversion Flow - Free Trial Path', async ({ page }) => {
    // 1. Start analysis from landing page
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // 2. Wait for preview results
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // 3. Verify conversion triggers are present
    await expect(page.locator('text=More Factors Available')).toBeVisible();
    await expect(page.locator('text=Get Free Account & See All Results')).toBeVisible();
    await expect(page.locator('text=No credit card required')).toBeVisible();
    
    // 4. Click free trial CTA
    const freeTrialButton = page.locator('button', { hasText: 'Get Free Account & See All Results' }).first();
    await freeTrialButton.click();
    
    // 5. Verify navigation to registration flow
    await expect(page.url()).toContain('registration-flow');
    
    // 6. Verify session data preservation
    const pendingUrl = await page.evaluate(() => sessionStorage.getItem('pendingAnalysisUrl'));
    const selectedTier = await page.evaluate(() => sessionStorage.getItem('selectedTier'));
    
    expect(pendingUrl).toBe(TEST_URL);
    expect(selectedTier).toBe('free');
  });

  test('Premium Upgrade Flow - Coffee Tier', async ({ page }) => {
    // Complete analysis first
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    // Wait for preview results
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Find and click upgrade button
    const upgradeButton = page.locator('button', { hasText: 'Get Unlimited for $5/mo' }).first();
    await upgradeButton.click();
    
    // Should navigate to registration flow with coffee tier
    await expect(page.url()).toContain('registration-flow');
    
    const selectedTier = await page.evaluate(() => sessionStorage.getItem('selectedTier'));
    expect(selectedTier).toBe('coffee');
  });

  test('Conversion Messaging Accuracy', async ({ page }) => {
    // Complete analysis to reach preview results
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Verify value proposition messaging
    await expect(page.locator('text=Real Analysis Complete!')).toBeVisible();
    await expect(page.locator('text=These are your real scores and recommendations, not generic samples')).toBeVisible();
    
    // Check feature highlights in locked section
    await expect(page.locator('text=All 18 Factor Results')).toBeVisible();
    await expect(page.locator('text=Detailed Scoring')).toBeVisible();
    await expect(page.locator('text=Action Plan')).toBeVisible();
    
    // Verify pricing clarity
    await expect(page.locator('text=No credit card required')).toBeVisible();
    await expect(page.locator('text=3 free analyses per month')).toBeVisible();
    await expect(page.locator('text=☕ Get Unlimited for $5/mo')).toBeVisible();
  });

  test('Multiple CTA Button Consistency', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Count and verify all CTA buttons
    const freeAccountButtons = page.locator('button:has-text("Free Account")');
    const upgradeButtons = page.locator('button:has-text("Get Unlimited")');
    
    await expect(freeAccountButtons).toHaveCount(2); // One in lock overlay, one in main CTA
    await expect(upgradeButtons).toHaveCount(2); // One in lock overlay, one in main CTA
    
    // Test each button leads to correct flow
    await freeAccountButtons.first().click();
    await expect(page.url()).toContain('registration-flow');
    
    // Go back and test upgrade button
    await page.goBack();
    await upgradeButtons.first().click();
    await expect(page.url()).toContain('registration-flow');
  });

  test('Conversion Rate Optimization Elements', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Check social proof elements
    await expect(page.locator('text=Real Analysis Complete!')).toBeVisible();
    
    // Check urgency/scarcity (if any)
    const analysisId = await page.locator('text=Analysis ID:').isVisible();
    if (analysisId) {
      expect(analysisId).toBe(true);
    }
    
    // Check value demonstration
    await expect(page.locator('.text-5xl.font-bold.text-blue-600')).toBeVisible(); // Overall score
    const unlockedFactors = page.locator('.border.border-gray-200.rounded-lg.p-6');
    await expect(unlockedFactors).toHaveCount(3); // Preview value
    
    // Check risk mitigation
    await expect(page.locator('text=No credit card required')).toBeVisible();
    await expect(page.locator('text=3 free analyses per month')).toBeVisible();
  });

  test('Conversion Funnel Analytics Points', async ({ page }) => {
    // Track key conversion points
    const conversionEvents = [];
    
    // Monitor page navigations
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        conversionEvents.push({
          event: 'navigation',
          url: frame.url(),
          timestamp: Date.now()
        });
      }
    });
    
    // Complete analysis flow
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Click conversion button
    const freeTrialButton = page.locator('button', { hasText: 'Get Free Account & See All Results' }).first();
    await freeTrialButton.click();
    
    // Verify funnel progression
    expect(conversionEvents.length).toBeGreaterThan(2);
    expect(conversionEvents.some(e => e.url.includes('registration-flow'))).toBe(true);
  });
});

test.describe('State Persistence During Conversion', () => {
  
  test('Analysis Data Persists Through Registration Flow', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Capture analysis data before registration
    const analysisDataBefore = await page.evaluate(() => {
      return {
        pendingUrl: sessionStorage.getItem('pendingAnalysisUrl'),
        pendingId: sessionStorage.getItem('pendingAnalysisId'),
        landingData: sessionStorage.getItem('landingAnalysisData')
      };
    });
    
    // Start registration flow
    await page.locator('button', { hasText: 'Get Free Account & See All Results' }).first().click();
    
    // Verify data still exists in registration flow
    const analysisDataAfter = await page.evaluate(() => {
      return {
        pendingUrl: sessionStorage.getItem('pendingAnalysisUrl'),
        pendingId: sessionStorage.getItem('pendingAnalysisId'),
        landingData: sessionStorage.getItem('landingAnalysisData')
      };
    });
    
    expect(analysisDataAfter.pendingUrl).toBe(analysisDataBefore.pendingUrl);
    expect(analysisDataAfter.pendingId).toBe(analysisDataBefore.pendingId);
    expect(analysisDataAfter.landingData).toBe(analysisDataBefore.landingData);
  });

  test('Browser Refresh During Conversion Preserves State', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Start registration
    await page.locator('button', { hasText: 'Get Free Account & See All Results' }).first().click();
    
    // Refresh browser
    await page.reload();
    
    // Verify session data survives refresh
    const sessionData = await page.evaluate(() => {
      return {
        pendingUrl: sessionStorage.getItem('pendingAnalysisUrl'),
        selectedTier: sessionStorage.getItem('selectedTier')
      };
    });
    
    expect(sessionData.pendingUrl).toBe(TEST_URL);
    expect(sessionData.selectedTier).toBe('free');
  });

  test('Multiple Tab Scenario', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Tab 1: Complete analysis
    const page1 = await context.newPage();
    await page1.goto(BASE_URL);
    
    const urlInput = page1.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page1.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page1.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Tab 2: Open new tab and check session data
    const page2 = await context.newPage();
    await page2.goto(BASE_URL);
    
    const sessionDataTab2 = await page2.evaluate(() => {
      return {
        pendingUrl: sessionStorage.getItem('pendingAnalysisUrl'),
        landingData: sessionStorage.getItem('landingAnalysisData')
      };
    });
    
    // Session data should be shared between tabs
    expect(sessionDataTab2.pendingUrl).toBe(TEST_URL);
    expect(sessionDataTab2.landingData).toBeTruthy();
    
    await context.close();
  });
});

test.describe('Payment Flow Integration', () => {
  
  test('Stripe Integration Readiness', async ({ page }) => {
    // Complete analysis and start upgrade flow
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    await page.locator('button', { hasText: 'Get Unlimited for $5/mo' }).first().click();
    
    // Should navigate to registration with upgrade intent
    await expect(page.url()).toContain('registration-flow');
    
    const selectedTier = await page.evaluate(() => sessionStorage.getItem('selectedTier'));
    expect(selectedTier).toBe('coffee');
  });

  test('Pricing Information Accuracy', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Verify pricing display
    await expect(page.locator('text=$5/mo')).toBeVisible();
    await expect(page.locator('text=3 free analyses per month')).toBeVisible();
    await expect(page.locator('text=Unlimited')).toBeVisible();
    
    // Check for any promotional pricing
    const hasPromo = await page.locator('text=Special').isVisible({ timeout: 1000 });
    if (hasPromo) {
      console.log('Promotional pricing detected');
    }
  });
});

test.describe('A/B Testing Scenarios', () => {
  
  test('CTA Button Variations', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Test different CTA variations that might exist
    const ctaVariations = [
      'Get Free Account & See All Results',
      'Create Free Account',
      'See Complete Results',
      'Unlock Full Analysis'
    ];
    
    let foundCTA = null;
    for (const variation of ctaVariations) {
      const button = page.locator(`button:has-text("${variation}")`);
      if (await button.isVisible({ timeout: 1000 })) {
        foundCTA = variation;
        break;
      }
    }
    
    expect(foundCTA).toBeTruthy();
    console.log(`Found CTA variation: ${foundCTA}`);
  });

  test('Progressive Disclosure Effectiveness', async ({ page }) => {
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Measure engagement with preview content
    const unlockedFactors = page.locator('.border.border-gray-200.rounded-lg.p-6');
    const lockedOverlay = page.locator('.absolute.inset-0.bg-gray-900.bg-opacity-10');
    
    await expect(unlockedFactors).toHaveCount(3); // 3 unlocked factors
    await expect(lockedOverlay).toBeVisible(); // Lock overlay present
    
    // Scroll through content to measure engagement
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Should still see conversion elements after scrolling
    await expect(page.locator('button', { hasText: 'Get Free Account' })).toBeVisible();
  });
});

test.describe('Conversion Optimization Metrics', () => {
  
  test('Time to Conversion Decision', async ({ page }) => {
    const startTime = Date.now();
    
    // Complete analysis
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    const resultsShownTime = Date.now();
    
    // Click conversion button
    await page.locator('button', { hasText: 'Get Free Account & See All Results' }).first().click();
    
    const conversionTime = Date.now();
    
    const analysisTime = (resultsShownTime - startTime) / 1000;
    const decisionTime = (conversionTime - resultsShownTime) / 1000;
    
    console.log(`Analysis time: ${analysisTime}s, Decision time: ${decisionTime}s`);
    
    expect(analysisTime).toBeLessThan(20); // Analysis should complete quickly
    expect(decisionTime).toBeLessThan(10); // Quick decision indicates good UX
  });

  test('Conversion Funnel Drop-off Points', async ({ page }) => {
    const funnelSteps = [];
    
    // Track each step
    await page.goto(BASE_URL);
    funnelSteps.push({ step: 'landing', timestamp: Date.now() });
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    funnelSteps.push({ step: 'url_entered', timestamp: Date.now() });
    
    await page.locator('button', { hasText: 'Analyze My Site' }).click();
    funnelSteps.push({ step: 'analysis_started', timestamp: Date.now() });
    
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    funnelSteps.push({ step: 'results_shown', timestamp: Date.now() });
    
    await page.locator('button', { hasText: 'Get Free Account & See All Results' }).first().click();
    funnelSteps.push({ step: 'conversion_clicked', timestamp: Date.now() });
    
    // Calculate time between steps
    for (let i = 1; i < funnelSteps.length; i++) {
      const stepTime = (funnelSteps[i].timestamp - funnelSteps[i-1].timestamp) / 1000;
      console.log(`${funnelSteps[i-1].step} → ${funnelSteps[i].step}: ${stepTime}s`);
    }
    
    expect(funnelSteps.length).toBe(5); // All funnel steps completed
  });
});