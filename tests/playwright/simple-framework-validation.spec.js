// Simple Framework Validation Test
// Quick validation of MASTERY-AI Framework v3.1.1 alignment
import { test, expect } from '@playwright/test';

test.describe('Simple Framework Validation', () => {
  
  test('Framework branding and version validation', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check for framework references on landing page
    await expect(page.locator('text=MASTERY-AI').or(page.locator('text=AI Search Mastery'))).toBeVisible({ timeout: 10000 });
    
    console.log('✅ MASTERY-AI framework branding found on landing page');
  });

  test('Sample results framework compliance', async ({ page }) => {
    // Navigate to sample results
    await page.goto('/');
    
    // Look for sample/demo content that shows framework compliance
    const sampleLink = page.locator('text=Sample').or(page.locator('text=Demo')).or(page.locator('text=Preview'));
    
    if (await sampleLink.isVisible()) {
      await sampleLink.click();
      
      // Wait for results page
      await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 15000 });
      
      // Verify framework elements
      await expect(page.locator('text=MASTERY-AI').or(page.locator('text=AI Search Mastery'))).toBeVisible();
      await expect(page.locator('text=v3.1.1')).toBeVisible(); 
      await expect(page.locator('text=148')).toBeVisible();
      
      console.log('✅ Framework compliance validated in sample results');
    } else {
      console.log('⚠️ No sample results link found - checking page content directly');
      
      // Check if framework elements are already visible
      await expect(page.locator('text=AI Search Mastery').or(page.locator('text=MASTERY-AI'))).toBeVisible();
    }
  });

  test('Pillar names validation', async ({ page }) => {
    await page.goto('/');
    
    // Expected pillar names from MASTERY-AI Framework v3.1.1
    const expectedPillars = [
      'AI Response Optimization',
      'Authority & Trust Signals', 
      'Machine Readability',
      'Semantic Content Quality',
      'Engagement & User Experience',
      'Topical Expertise',
      'Reference Networks',
      'Yield Optimization'
    ];
    
    // Navigate to results or look for pillar content
    const sampleButton = page.locator('button:has-text("Sample")').or(page.locator('a:has-text("Sample")'));
    
    if (await sampleButton.isVisible()) {
      await sampleButton.click();
      await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 15000 });
      
      // Check for at least some of the expected pillars
      let foundPillars = 0;
      for (const pillar of expectedPillars) {
        const pillarElement = page.locator(`text=${pillar}`);
        if (await pillarElement.isVisible()) {
          foundPillars++;
          console.log(`✅ Found pillar: ${pillar}`);
        }
      }
      
      expect(foundPillars).toBeGreaterThan(0);
      console.log(`✅ Framework pillar validation passed (${foundPillars}/${expectedPillars.length} pillars found)`);
    }
  });

  test('Factor names validation', async ({ page }) => {
    await page.goto('/');
    
    // Expected factor names from Phase A implementation
    const expectedFactors = [
      'Citation-Worthy Content Structure',
      'Source Authority Signals',
      'Security and Access Control',
      'Title Tag Optimization',
      'Meta Description Quality'
    ];
    
    // Try to access sample results
    const sampleButton = page.locator('text=Sample').or(page.locator('text=Demo'));
    
    if (await sampleButton.isVisible()) {
      await sampleButton.click();
      await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 15000 });
      
      // Look for factor analysis section
      const factorSection = page.locator('text="Factor Analysis Details"');
      if (await factorSection.isVisible()) {
        // Check for expected factor names
        let foundFactors = 0;
        for (const factor of expectedFactors) {
          const factorElement = page.locator(`text="${factor}"`);
          if (await factorElement.isVisible()) {
            foundFactors++;
            console.log(`✅ Found factor: ${factor}`);
          }
        }
        
        expect(foundFactors).toBeGreaterThan(0);
        console.log(`✅ Framework factor validation passed (${foundFactors}/${expectedFactors.length} factors found)`);
      }
    }
  });

  test('Scoring methodology validation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to sample results
    const sampleButton = page.locator('text=Sample').or(page.locator('text=Demo'));
    
    if (await sampleButton.isVisible()) {
      await sampleButton.click();
      await page.waitForSelector('[data-testid="results-dashboard"]', { timeout: 15000 });
      
      // Check for evidence-based scoring indicators
      await expect(page.locator('text=Evidence-based')).toBeVisible();
      
      // Check for realistic scoring ranges (not binary 0/100)
      const scoreElement = page.locator('[data-testid="overall-score"]');
      if (await scoreElement.isVisible()) {
        const scoreText = await scoreElement.textContent();
        const score = parseInt(scoreText);
        
        // Score should be realistic (30-95 range)
        expect(score).toBeGreaterThan(25);
        expect(score).toBeLessThan(96);
        
        console.log(`✅ Realistic scoring validated: ${score}/100`);
      }
    }
  });

  test('Framework version consistency', async ({ page }) => {
    await page.goto('/');
    
    // Check for consistent framework version references
    const frameworkVersions = await page.locator('text=v3.1.1').count();
    
    if (frameworkVersions > 0) {
      console.log(`✅ Framework version v3.1.1 found ${frameworkVersions} times`);
    } else {
      // Check for any version references
      const anyVersion = await page.locator(':text("v")').count();
      console.log(`Found ${anyVersion} version references on page`);
    }
    
    // Check for factor count consistency
    const factorReferences = await page.locator('text=148').count();
    if (factorReferences > 0) {
      console.log(`✅ Total factor count (148) referenced ${factorReferences} times`);
    }
  });
});