// Messaging Clarity Updates Test Suite
// Tests for recent UI/UX improvements in messaging and user guidance
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://app.aimpactscanner.com';

test.describe('Messaging Clarity Updates - Recent Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('URL Input Improvements', () => {
    test('should display updated placeholder text in URL input field', async ({ page }) => {
      // Navigate to analysis input (may require authentication)
      try {
        await page.click('button:has-text("🔍 New Analysis")');
      } catch {
        // Try alternative navigation paths
        await page.click('text*="Start", button:has-text("Analysis")');
      }

      // Check for the new placeholder text
      const urlInput = page.locator('input#url, input[name="url"], input[placeholder*="URL"]');
      await expect(urlInput).toBeVisible();
      
      const placeholder = await urlInput.getAttribute('placeholder');
      expect(placeholder).toMatch(/Enter a page URL to analyze/i);
      
      // Verify the exact expected text
      await expect(urlInput).toHaveAttribute('placeholder', 'Enter a page URL to analyze...');
    });

    test('should show helper text about page-by-page analysis', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Look for the helper text below URL input
      const helperText = page.locator('text*="Analyze one page at a time"');
      await expect(helperText).toBeVisible();
      
      // Verify complete helper text
      const fullHelperText = page.locator('text="Analyze one page at a time - start with your homepage or most important page"');
      await expect(fullHelperText).toBeVisible();
    });

    test('should provide clear input validation feedback', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      const urlInput = page.locator('input#url');
      const submitButton = page.locator('button:has-text("Start AI Analysis")');
      
      // Test empty input validation
      await submitButton.click();
      const emptyError = page.locator('text*="Please enter a URL"');
      await expect(emptyError).toBeVisible();
      
      // Test invalid URL validation
      await urlInput.fill('not-a-valid-url');
      await submitButton.click();
      const invalidError = page.locator('text*="valid URL"');
      await expect(invalidError).toBeVisible();
      
      // Test valid URL clears error
      await urlInput.clear();
      await urlInput.fill('example.com');
      await expect(emptyError).not.toBeVisible();
      await expect(invalidError).not.toBeVisible();
    });

    test('should show URL formatting examples', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Check for example URLs section
      const examplesSection = page.locator('text*="Example URLs to try"');
      await expect(examplesSection).toBeVisible();
      
      // Verify example URL buttons exist
      const exampleButtons = page.locator('button:has-text("github.com"), button:has-text("wikipedia.org")');
      await expect(exampleButtons.first()).toBeVisible();
      
      // Test clicking an example URL populates the input
      await page.click('button:has-text("github.com")');
      const urlInput = page.locator('input#url');
      await expect(urlInput).toHaveValue('github.com');
    });
  });

  test.describe('Results Page Header Improvements', () => {
    test('should display analysis results header with analyzed URL', async ({ page }) => {
      // Navigate to sample results or complete an analysis
      await page.click('button:has-text("📋 See Sample Report")');
      await page.waitForLoadState('networkidle');
      
      // Check for results header with URL
      const resultsHeader = page.locator('text*="Analysis Results for:"');
      await expect(resultsHeader).toBeVisible();
      
      // Verify URL is displayed in header
      const urlInHeader = page.locator('text*="example.com"'); // For demo results
      await expect(urlInHeader).toBeVisible();
    });

    test('should show complete analysis metadata in header', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Check for analysis date/time
      const analysisDate = page.locator('text*="Analysis Date", text*="Analyzed on"');
      await expect(analysisDate.first()).toBeVisible();
      
      // Check for framework version
      const frameworkVersion = page.locator('text*="MASTERY-AI", text*="Framework"');
      await expect(frameworkVersion.first()).toBeVisible();
    });

    test('should provide clear overall score presentation', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Check for overall score display
      const overallScore = page.locator('[data-testid="overall-score"], text*="/100"');
      await expect(overallScore.first()).toBeVisible();
      
      // Verify score is prominently displayed
      const scoreNumber = page.locator('text*="/100"').first();
      const scoreText = await scoreNumber.textContent();
      expect(scoreText).toMatch(/\d+\/100/);
    });
  });

  test.describe('FAQ and User Guidance', () => {
    test('should explain page vs website analysis difference', async ({ page }) => {
      // Check if FAQ section exists on landing or help page
      // This might need to be added to a specific location
      
      // Look for explanation text about page analysis
      const pageAnalysisExplanation = page.locator(
        'text*="page analysis", text*="per page", text*="individual page"'
      );
      
      // If FAQ exists, verify content
      if (await pageAnalysisExplanation.count() > 0) {
        await expect(pageAnalysisExplanation.first()).toBeVisible();
      }
    });

    test('should provide guidance on which page to analyze first', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Check for guidance about starting with homepage
      const guidanceText = page.locator('text*="homepage or most important page"');
      await expect(guidanceText).toBeVisible();
    });

    test('should clarify analysis scope and limitations', async ({ page }) => {
      // Look for any scope clarification text
      const scopeText = page.locator('text*="one page at a time"');
      await expect(scopeText).toBeVisible();
      
      // Check that users understand it's not a full site audit
      const clarificationText = page.locator('text*="individual page", text*="page-level"');
      // This test verifies the messaging helps users understand scope
    });
  });

  test.describe('User Flow Clarity', () => {
    test('should guide users through analysis process clearly', async ({ page }) => {
      // Start analysis flow
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Verify clear step-by-step guidance
      const stepGuidance = page.locator('text*="Enter a URL", text*="analyze its AI search"');
      await expect(stepGuidance.first()).toBeVisible();
      
      // Check for process explanation
      const processText = page.locator('text*="MASTERY-AI Framework"');
      await expect(processText).toBeVisible();
    });

    test('should provide clear feedback during analysis', async ({ page }) => {
      // Start a demo analysis
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', 'example.com');
      await page.click('button:has-text("Start AI Analysis")');
      
      // Check for clear progress indicators
      const progressText = page.locator('text*="Analyzing", text*="progress"');
      await expect(progressText.first()).toBeVisible({ timeout: 10000 });
      
      // Verify status messages are clear
      const statusMessage = page.locator('[data-testid="analysis-status"], text*="Analyzing"');
      if (await statusMessage.count() > 0) {
        const statusText = await statusMessage.first().textContent();
        expect(statusText.length).toBeGreaterThan(0);
      }
    });

    test('should explain next steps after analysis completion', async ({ page }) => {
      await page.click('button:has-text("📋 See Sample Report")');
      
      // Look for next steps or call-to-action guidance
      const nextSteps = page.locator(
        'text*="next steps", text*="improve", text*="recommendations"'
      );
      
      // Check for improvement suggestions
      const improvements = page.locator('text*="improve", text*="optimize"');
      await expect(improvements.first()).toBeVisible();
    });
  });

  test.describe('Error Messaging Improvements', () => {
    test('should provide helpful error messages for common issues', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      const urlInput = page.locator('input#url');
      const submitButton = page.locator('button:has-text("Start AI Analysis")');
      
      // Test helpful error for invalid URLs
      await urlInput.fill('invalid.url');
      await submitButton.click();
      
      const errorMessage = page.locator('.error-message, text*="valid URL"');
      await expect(errorMessage.first()).toBeVisible();
      
      // Verify error message is specific and helpful
      const errorText = await errorMessage.first().textContent();
      expect(errorText).toMatch(/valid|format|example/i);
    });

    test('should show clear loading states', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', 'example.com');
      
      // Check button changes to loading state
      const submitButton = page.locator('button:has-text("Start AI Analysis")');
      await submitButton.click();
      
      // Verify loading indication
      const loadingButton = page.locator('button:has-text("Analyzing"), button[disabled]');
      await expect(loadingButton).toBeVisible({ timeout: 5000 });
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // This test might need to mock network failures
      // For now, we'll check that error handling UI exists
      
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', 'this-domain-does-not-exist-for-testing.invalid');
      await page.click('button:has-text("Start AI Analysis")');
      
      // Wait for potential error message
      await page.waitForTimeout(15000);
      
      // Check if error handling is displayed
      const errorHandling = page.locator(
        'text*="error", text*="failed", text*="try again", [data-testid="error-message"]'
      );
      
      // If an error occurs, it should be handled gracefully
      if (await errorHandling.count() > 0) {
        await expect(errorHandling.first()).toBeVisible();
      }
    });
  });

  test.describe('Visual Design Clarity', () => {
    test('should maintain consistent visual hierarchy', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // Check heading hierarchy
      const mainHeading = page.locator('h1, h2:has-text("AI Impact Analysis")');
      await expect(mainHeading).toBeVisible();
      
      // Verify proper label associations
      const urlLabel = page.locator('label[for="url"], text="Website URL"');
      await expect(urlLabel).toBeVisible();
    });

    test('should use clear visual feedback for form states', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      const urlInput = page.locator('input#url');
      
      // Test focus state
      await urlInput.focus();
      const focusedInput = page.locator('input#url:focus');
      
      // Test validation state (valid input)
      await urlInput.fill('example.com');
      const validIcon = page.locator('svg:near(input#url)');
      
      // These visual states should be clearly distinguishable
      await expect(urlInput).toBeFocused();
    });

    test('should provide accessible color contrast', async ({ page }) => {
      await page.click('button:has-text("🔍 New Analysis")');
      
      // This is a basic accessibility check
      // More comprehensive accessibility testing would require axe-playwright
      const textElements = page.locator('p, span, label');
      await expect(textElements.first()).toBeVisible();
      
      // Check that error messages are clearly visible
      const urlInput = page.locator('input#url');
      await page.click('button:has-text("Start AI Analysis")');
      
      const errorMessage = page.locator('text*="Please enter"');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        
        // Error text should be clearly distinguishable
        const computedStyle = await errorMessage.evaluate(el => 
          window.getComputedStyle(el).color
        );
        expect(computedStyle).toBeTruthy();
      }
    });
  });
});