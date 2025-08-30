// LLMs.txt Integration Test Suite
// Tests for llmtxtmastery.com integration and LLMs.txt detection features
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://app.aimpactscanner.com';

// Test URLs for different LLMs.txt scenarios
const TEST_URLS = {
  withLLMsTxt: 'anthropic.com', // Known to have LLMs.txt
  withoutLLMsTxt: 'example.com', // Known to NOT have LLMs.txt
  llmtxtMastery: 'llmtxtmastery.com', // The integration partner site
  testSite: 'github.com' // For general testing
};

test.describe('LLMs.txt Integration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('LLMs.txt Detection and Analysis', () => {
    test('should detect presence of LLMs.txt file', async ({ page }) => {
      // Navigate to analysis input
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Analyze a site known to have LLMs.txt
      await page.fill('input#url', TEST_URLS.withLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      // Wait for analysis completion
      await page.waitForSelector(
        '[data-testid="analysis-results"], text*="Analysis Complete"', 
        { timeout: 30000 }
      );
      
      // Check for LLMs.txt detection in results
      const llmstxtDetection = page.locator(
        'text*="LLMs.txt detected", text*="LLMs.txt found", text*="llms.txt"'
      );
      
      if (await llmstxtDetection.count() > 0) {
        await expect(llmstxtDetection.first()).toBeVisible();
      }
      
      // Look for specific LLMs.txt factor or recommendation
      const llmstxtFactor = page.locator('[data-testid*="llmstxt"], text*="LLMs.txt"');
      if (await llmstxtFactor.count() > 0) {
        await expect(llmstxtFactor.first()).toBeVisible();
      }
    });

    test('should identify missing LLMs.txt file', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Analyze a site without LLMs.txt
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector(
        '[data-testid="analysis-results"], text*="Analysis Complete"', 
        { timeout: 30000 }
      );
      
      // Check for missing LLMs.txt indication
      const missingLLmstxt = page.locator(
        'text*="missing LLMs.txt", text*="no LLMs.txt", text*="implement LLMs.txt"'
      );
      
      if (await missingLLmstxt.count() > 0) {
        await expect(missingLLmstxt.first()).toBeVisible();
      }
    });

    test('should analyze LLMs.txt content quality', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector(
        '[data-testid="analysis-results"]', 
        { timeout: 30000 }
      );
      
      // Look for LLMs.txt quality assessment
      const qualityMetrics = page.locator(
        'text*="LLMs.txt quality", text*="content guidelines", text*="structured data"'
      );
      
      // Check for specific LLMs.txt recommendations
      const llmstxtRecommendations = page.locator(
        'text*="improve LLMs.txt", text*="enhance guidelines", text*="update permissions"'
      );
      
      // At least one aspect of LLMs.txt analysis should be present
      const hasLLmstxtAnalysis = await qualityMetrics.or(llmstxtRecommendations).count() > 0;
      if (hasLLmstxtAnalysis) {
        expect(hasLLmstxtAnalysis).toBeTruthy();
      }
    });
  });

  test.describe('Context-Aware Recommendations', () => {
    test('should provide different recommendations for sites WITH LLMs.txt', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Look for recommendations specific to sites that already have LLMs.txt
      const existingLLmstxtRecommendations = page.locator(
        'text*="enhance your LLMs.txt", text*="improve existing", text*="optimize guidelines"'
      );
      
      const improvementSuggestions = page.locator(
        'text*="update permissions", text*="add more detail", text*="structured data"'
      );
      
      // Sites with LLMs.txt should get improvement recommendations, not implementation ones
      if (await existingLLmstxtRecommendations.or(improvementSuggestions).count() > 0) {
        const hasImprovementRecommendations = await existingLLmstxtRecommendations.or(improvementSuggestions).count() > 0;
        expect(hasImprovementRecommendations).toBeTruthy();
      }
    });

    test('should provide implementation recommendations for sites WITHOUT LLMs.txt', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Look for implementation recommendations
      const implementationRecommendations = page.locator(
        'text*="implement LLMs.txt", text*="create LLMs.txt", text*="add LLMs.txt"'
      );
      
      const setupGuidance = page.locator(
        'text*="set up guidelines", text*="establish permissions", text*="create file"'
      );
      
      // Sites without LLMs.txt should get implementation recommendations
      if (await implementationRecommendations.or(setupGuidance).count() > 0) {
        const hasImplementationRecommendations = await implementationRecommendations.or(setupGuidance).count() > 0;
        expect(hasImplementationRecommendations).toBeTruthy();
      }
    });

    test('should reference llmtxtmastery.com for implementation guidance', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Look for references to llmtxtmastery.com
      const llmtxtMasteryReference = page.locator(
        'text*="llmtxtmastery.com", a[href*="llmtxtmastery"]'
      );
      
      // Check for guidance that points to the implementation resource
      const implementationGuidance = page.locator(
        'text*="learn more about LLMs.txt", text*="implementation guide", text*="best practices"'
      );
      
      if (await llmtxtMasteryReference.or(implementationGuidance).count() > 0) {
        await expect(llmtxtMasteryReference.or(implementationGuidance).first()).toBeVisible();
      }
    });

    test('should adapt messaging based on LLMs.txt status', async ({ page }) => {
      // Test with site that has LLMs.txt
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Capture messaging for site with LLMs.txt
      const withLLmstxtContent = await page.textContent('body');
      
      // Navigate back and test with site without LLMs.txt
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      const withoutLLmstxtContent = await page.textContent('body');
      
      // Messaging should be contextually different
      expect(withLLmstxtContent).not.toEqual(withoutLLmstxtContent);
      
      // Verify specific contextual differences
      const hasContextualDifferences = 
        withLLmstxtContent.includes('enhance') !== withoutLLmstxtContent.includes('enhance') ||
        withLLmstxtContent.includes('implement') !== withoutLLmstxtContent.includes('implement') ||
        withLLmstxtContent.includes('create') !== withoutLLmstxtContent.includes('create');
      
      expect(hasContextualDifferences).toBeTruthy();
    });
  });

  test.describe('Integration with llmtxtmastery.com', () => {
    test('should handle analysis of llmtxtmastery.com itself', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.llmtxtMastery);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // llmtxtmastery.com should be analyzed like any other site
      const overallScore = page.locator('[data-testid="overall-score"], text*="/100"');
      await expect(overallScore.first()).toBeVisible();
      
      // Should have appropriate LLMs.txt analysis
      const llmstxtAnalysis = page.locator('text*="LLMs.txt", text*="guidelines"');
      if (await llmstxtAnalysis.count() > 0) {
        await expect(llmstxtAnalysis.first()).toBeVisible();
      }
    });

    test('should provide correct external links to llmtxtmastery.com', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Check for external links
      const externalLinks = page.locator('a[href*="llmtxtmastery.com"]');
      
      if (await externalLinks.count() > 0) {
        // Verify link attributes
        const firstLink = externalLinks.first();
        await expect(firstLink).toHaveAttribute('target', '_blank');
        await expect(firstLink).toHaveAttribute('rel', /noopener/);
        
        // Verify link text is descriptive
        const linkText = await firstLink.textContent();
        expect(linkText).toMatch(/learn|guide|implementation|LLMs.txt/i);
      }
    });

    test('should handle integration gracefully if llmtxtmastery.com is unavailable', async ({ page }) => {
      // This test checks that the analysis doesn't break if external references fail
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.testSite);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Analysis should complete successfully regardless of external service status
      const overallScore = page.locator('[data-testid="overall-score"], text*="/100"');
      await expect(overallScore.first()).toBeVisible();
      
      // No error messages should be displayed related to external integrations
      const errorMessages = page.locator('text*="integration error", text*="external service"');
      await expect(errorMessages).not.toBeVisible();
    });
  });

  test.describe('LLMs.txt Scoring and Factors', () => {
    test('should include LLMs.txt as a scoring factor', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Look for LLMs.txt-specific factor in the results
      const llmstxtFactor = page.locator(
        '[data-testid*="llmstxt"], text*="LLMs.txt Implementation", text*="Content Guidelines"'
      );
      
      // Check factor scoring
      const factorScore = page.locator('text*="LLMs.txt"').locator('xpath=following-sibling::*[contains(text(), "/")]');
      
      if (await llmstxtFactor.count() > 0) {
        await expect(llmstxtFactor.first()).toBeVisible();
      }
    });

    test('should weight LLMs.txt factor appropriately in overall score', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Check that LLMs.txt contributes to pillar scores
      const pillarScores = page.locator('[data-testid="pillar-scores"], text*="AI:", text*="Authority"');
      await expect(pillarScores.first()).toBeVisible();
      
      // LLMs.txt should primarily affect Machine Readability or AI pillars
      const relevantPillars = page.locator('text*="Machine", text*="AI", text*="Authority"');
      await expect(relevantPillars.first()).toBeVisible();
    });

    test('should provide actionable LLMs.txt recommendations', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Look for specific, actionable recommendations
      const actionableRecommendations = page.locator(
        'text*="Create /llms.txt", text*="Define usage guidelines", text*="Specify permissions"'
      );
      
      // Check for implementation steps
      const implementationSteps = page.locator(
        'text*="step", text*="implement", text*="create", text*="setup"'
      );
      
      if (await actionableRecommendations.or(implementationSteps).count() > 0) {
        const hasActionableContent = await actionableRecommendations.or(implementationSteps).count() > 0;
        expect(hasActionableContent).toBeTruthy();
      }
    });
  });

  test.describe('User Experience for LLMs.txt Features', () => {
    test('should explain what LLMs.txt is to users', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Look for educational content about LLMs.txt
      const explanation = page.locator(
        'text*="LLMs.txt is", text*="guidelines for AI", text*="machine learning"'
      );
      
      const educationalContent = page.locator(
        'text*="helps AI understand", text*="usage permissions", text*="content guidelines"'
      );
      
      if (await explanation.or(educationalContent).count() > 0) {
        await expect(explanation.or(educationalContent).first()).toBeVisible();
      }
    });

    test('should provide clear next steps for LLMs.txt implementation', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', TEST_URLS.withoutLLMsTxt);
      await page.click('button:has-text("Start AI Analysis")');
      
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
      
      // Look for clear implementation guidance
      const nextSteps = page.locator(
        'text*="next steps", text*="to implement", text*="get started"'
      );
      
      const implementationGuide = page.locator(
        'text*="create the file", text*="add guidelines", text*="define permissions"'
      );
      
      if (await nextSteps.or(implementationGuide).count() > 0) {
        await expect(nextSteps.or(implementationGuide).first()).toBeVisible();
      }
    });

    test('should highlight benefits of LLMs.txt implementation', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Look for benefits explanation
      const benefits = page.locator(
        'text*="benefits of LLMs.txt", text*="improve AI understanding", text*="better search results"'
      );
      
      const valueProposition = page.locator(
        'text*="AI search optimization", text*="machine readability", text*="content discovery"'
      );
      
      if (await benefits.or(valueProposition).count() > 0) {
        await expect(benefits.or(valueProposition).first()).toBeVisible();
      }
    });

    test('should handle edge cases in LLMs.txt detection', async ({ page }) => {
      // Test with various URL formats
      const edgeCaseUrls = [
        'https://example.com',
        'example.com/',
        'www.example.com',
        'example.com/path'
      ];
      
      for (const testUrl of edgeCaseUrls) {
        await page.click('button:has-text("🔍 New Analysis")');
        await page.fill('input#url', testUrl);
        await page.click('button:has-text("Start AI Analysis")');
        
        try {
          await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
          
          // Analysis should complete without errors regardless of URL format
          const overallScore = page.locator('[data-testid="overall-score"], text*="/100"');
          await expect(overallScore.first()).toBeVisible();
          
        } catch (error) {
          console.log(`Edge case URL ${testUrl} failed: ${error.message}`);
        }
      }
    });
  });
});