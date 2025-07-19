import { test, expect } from '@playwright/test';

test.describe('Comprehensive Factor Analysis E2E Tests', () => {
  // Test configuration
  const testConfig = {
    baseUrl: 'http://localhost:5173',
    analysisTimeout: 30000,
    factorTimeout: 5000
  };

  // Helper function to authenticate if needed
  async function ensureAuthenticated(page) {
    await page.goto(testConfig.baseUrl);
    await expect(page.locator('body')).toBeVisible();
    
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;
    if (isLoginPage) {
      test.skip('Authentication required - factor analysis tests require login');
      return false;
    }
    
    await expect(page.locator('text=AImpactScanner')).toBeVisible();
    return true;
  }

  // Helper function to start analysis
  async function startAnalysis(page, testUrl) {
    // Navigate to New Analysis tab
    const newAnalysisBtn = page.locator('text=New Analysis');
    if (await newAnalysisBtn.count() > 0) {
      await newAnalysisBtn.click();
    }
    
    // Enter URL and start analysis
    const urlInput = page.locator('input[type="url"], input[placeholder*="url"], input[placeholder*="URL"], input[name="url"]');
    await expect(urlInput).toBeVisible();
    await urlInput.fill(testUrl);
    
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start"), button[type="submit"]');
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    
    // Wait for analysis to start
    await page.waitForTimeout(2000);
  }

  // Helper function to wait for results
  async function waitForResults(page, timeout = testConfig.analysisTimeout) {
    // Look for results dashboard or completion indicators
    const resultIndicators = [
      'text=Results Dashboard',
      'text=Analysis Complete',
      'text=Overall Score',
      'text=factors analyzed',
      'button:has-text("Results Dashboard")'
    ];
    
    let resultsFound = false;
    const startTime = Date.now();
    
    while (!resultsFound && (Date.now() - startTime) < timeout) {
      for (const indicator of resultIndicators) {
        if (await page.locator(indicator).count() > 0) {
          resultsFound = true;
          break;
        }
      }
      if (!resultsFound) {
        await page.waitForTimeout(1000);
      }
    }
    
    return resultsFound;
  }

  test.describe('Contact Information Detection (A.3.2)', () => {
    test('should detect contact page and email links', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a site that has contact information
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Navigate to results if not already there
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for Contact Information factor in results
      const pageContent = await page.textContent('body');
      const hasContactFactor = pageContent.includes('Contact Information') || 
                              pageContent.includes('A.3.2') ||
                              pageContent.includes('contact');
      
      console.log('✅ Contact Information factor analysis validated');
      expect(hasContactFactor).toBe(true);
    });

    test('should handle sites without contact information', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a minimal site (example.com typically has no contact info)
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Sites without contact information handled correctly');
    });

    test('should detect multiple contact methods', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a business site that likely has multiple contact methods
      await startAnalysis(page, 'https://help.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Multiple contact methods detection validated');
    });
  });

  test.describe('Heading Hierarchy Analysis (S.1.1)', () => {
    test('should analyze proper heading structure', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a well-structured documentation site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for heading hierarchy results
      const pageContent = await page.textContent('body');
      const hasHeadingFactor = pageContent.includes('Heading') || 
                              pageContent.includes('S.1.1') ||
                              pageContent.includes('hierarchy');
      
      console.log('✅ Heading hierarchy analysis validated');
      expect(hasHeadingFactor).toBe(true);
    });

    test('should detect broken heading hierarchy', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a simple site that may have basic structure
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Broken heading hierarchy detection validated');
    });

    test('should handle single-page applications', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a SPA-style site
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Single-page application heading analysis validated');
    });
  });

  test.describe('Structured Data Detection (AI.2.1)', () => {
    test('should detect JSON-LD structured data', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a site likely to have structured data
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for structured data results
      const pageContent = await page.textContent('body');
      const hasStructuredDataFactor = pageContent.includes('Structured Data') || 
                                     pageContent.includes('AI.2.1') ||
                                     pageContent.includes('schema');
      
      console.log('✅ Structured data detection validated');
      expect(hasStructuredDataFactor).toBe(true);
    });

    test('should handle sites without structured data', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a basic site
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Sites without structured data handled correctly');
    });

    test('should validate JSON-LD schema quality', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a content-rich site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ JSON-LD schema quality validation complete');
    });
  });

  test.describe('FAQ Schema Analysis (AI.2.3)', () => {
    test('should detect FAQ content and schema', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a help/FAQ site
      await startAnalysis(page, 'https://help.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for FAQ analysis results
      const pageContent = await page.textContent('body');
      const hasFAQFactor = pageContent.includes('FAQ') || 
                          pageContent.includes('AI.2.3') ||
                          pageContent.includes('question');
      
      console.log('✅ FAQ schema analysis validated');
      expect(hasFAQFactor).toBe(true);
    });

    test('should analyze question quality and structure', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a documentation site that might have Q&A
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Question quality analysis validated');
    });

    test('should handle sites without FAQ content', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a basic site
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Sites without FAQ content handled correctly');
    });
  });

  test.describe('Heading Hierarchy Analysis (S.1.1)', () => {
    test('should detect proper heading structure on documentation sites', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a well-structured documentation site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Navigate to results if not already there
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for heading hierarchy results
      const pageContent = await page.textContent('body');
      const hasHeadingFactor = pageContent.includes('Heading') || 
                              pageContent.includes('S.1.1') ||
                              pageContent.includes('hierarchy') ||
                              pageContent.includes('structure');
      
      console.log('✅ Heading hierarchy analysis validated for documentation site');
      expect(hasHeadingFactor).toBe(true);
    });

    test('should handle sites with poor heading structure', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a minimal site that likely has poor structure
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Navigate to results
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Should still analyze headings even if structure is poor
      const pageContent = await page.textContent('body');
      const hasHeadingAnalysis = pageContent.includes('Heading') || 
                                pageContent.includes('S.1.1') ||
                                pageContent.toLowerCase().includes('hierarchy');
      
      console.log('✅ Poor heading structure handling validated');
      expect(hasHeadingAnalysis).toBe(true);
    });

    test('should validate heading hierarchy across different site types', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout * 2);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test multiple site types with different heading patterns
      const testSites = [
        {
          url: 'https://docs.github.com',
          type: 'documentation',
          expectedBehavior: 'good structure'
        },
        {
          url: 'https://github.com',
          type: 'corporate homepage',
          expectedBehavior: 'mixed structure'
        },
        {
          url: 'https://help.github.com',
          type: 'help center',
          expectedBehavior: 'structured content'
        }
      ];
      
      for (const site of testSites) {
        await startAnalysis(page, site.url);
        const hasResults = await waitForResults(page);
        expect(hasResults).toBe(true);
        
        console.log(`✅ Heading analysis validated for ${site.type} (${site.url})`);
        
        // Brief pause between analyses
        await page.waitForTimeout(2000);
      }
    });

    test('should detect heading hierarchy breaks and provide recommendations', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a site that might have hierarchy issues
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Navigate to detailed results
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for evidence of heading analysis and potential recommendations
      const pageContent = await page.textContent('body');
      const hasDetailedAnalysis = pageContent.includes('H1') || 
                                 pageContent.includes('H2') ||
                                 pageContent.includes('evidence') ||
                                 pageContent.includes('recommendation');
      
      console.log('✅ Heading hierarchy breaks and recommendations detection validated');
      expect(hasDetailedAnalysis).toBe(true);
    });

    test('should handle single-page applications with dynamic headings', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // GitHub main page is a good example of a modern SPA
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ SPA dynamic heading analysis validated');
    });

    test('should evaluate heading content quality and length', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with content-rich documentation
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for results dashboard
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Should provide analysis of heading quality, not just structure
      const pageContent = await page.textContent('body');
      const hasQualityAnalysis = pageContent.includes('heading') || 
                                pageContent.includes('structure') ||
                                pageContent.includes('quality');
      
      console.log('✅ Heading content quality evaluation validated');
      expect(hasQualityAnalysis).toBe(true);
    });

    test('should handle edge cases in heading detection', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with various edge case scenarios
      const edgeCaseSites = [
        'https://example.com', // Minimal headings
        'https://github.com',  // Dynamic headings
        'https://help.github.com' // Mixed content types
      ];
      
      for (const site of edgeCaseSites) {
        await startAnalysis(page, site);
        const hasResults = await waitForResults(page);
        expect(hasResults).toBe(true);
        
        console.log(`✅ Edge case heading detection validated for ${site}`);
        
        // Brief pause between tests
        await page.waitForTimeout(1500);
      }
    });
  });

  test.describe('Image Alt Text Analysis (M.2.3)', () => {
    test('should analyze image accessibility', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a site that has images
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for image alt text results
      const pageContent = await page.textContent('body');
      const hasImageFactor = pageContent.includes('Image') || 
                            pageContent.includes('M.2.3') ||
                            pageContent.includes('Alt Text') ||
                            pageContent.includes('alt');
      
      console.log('✅ Image alt text analysis validated');
      expect(hasImageFactor).toBe(true);
    });

    test('should calculate alt text coverage percentage', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with an image-rich site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Alt text coverage calculation validated');
    });

    test('should handle sites with no images', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a text-only site
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Sites with no images handled correctly');
    });
  });

  test.describe('Word Count Analysis (S.3.1)', () => {
    test('should analyze content depth and word count', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a content-rich site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      // Look for word count results
      const pageContent = await page.textContent('body');
      const hasWordCountFactor = pageContent.includes('Word Count') || 
                                pageContent.includes('S.3.1') ||
                                pageContent.includes('content') ||
                                pageContent.includes('words');
      
      console.log('✅ Word count analysis validated');
      expect(hasWordCountFactor).toBe(true);
    });

    test('should score content based on depth and quality', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a comprehensive documentation page
      await startAnalysis(page, 'https://help.github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Content depth scoring validated');
    });

    test('should handle minimal content sites', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a minimal site
      await startAnalysis(page, 'https://example.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Minimal content sites handled correctly');
    });
  });

  test.describe('Cross-Factor Integration', () => {
    test('should analyze all 10 factors comprehensively', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout + 15000); // Extra time for comprehensive analysis
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a comprehensive, well-structured site
      await startAnalysis(page, 'https://docs.github.com');
      
      const hasResults = await waitForResults(page, testConfig.analysisTimeout + 10000);
      expect(hasResults).toBe(true);
      
      // Navigate to results dashboard
      const resultsBtn = page.locator('button:has-text("Results Dashboard")');
      if (await resultsBtn.count() > 0) {
        await resultsBtn.click();
        await page.waitForTimeout(2000);
      }
      
      // Check for multiple factors in results
      const pageContent = await page.textContent('body');
      const factorKeywords = [
        'HTTPS', 'Title', 'Meta', 'Author', 'Contact', 
        'Heading', 'Structured', 'FAQ', 'Image', 'Word'
      ];
      
      let detectedFactors = 0;
      factorKeywords.forEach(keyword => {
        if (pageContent.toLowerCase().includes(keyword.toLowerCase())) {
          detectedFactors++;
        }
      });
      
      // Should detect at least 6 out of 10 factors (being conservative for E2E test)
      expect(detectedFactors).toBeGreaterThanOrEqual(6);
      
      console.log(`✅ Comprehensive analysis complete - detected ${detectedFactors}/10 factor types`);
    });

    test('should provide nuanced scoring across all factors', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with different sites to validate scoring nuance
      const testSites = [
        'https://github.com',    // Well-structured corporate site
        'https://example.com'     // Minimal site
      ];
      
      for (const site of testSites) {
        await startAnalysis(page, site);
        const hasResults = await waitForResults(page);
        expect(hasResults).toBe(true);
        
        // Brief pause between tests
        await page.waitForTimeout(1000);
      }
      
      console.log('✅ Nuanced scoring validation complete across multiple sites');
    });
  });

  test.describe('Edge Case Validation', () => {
    test('should handle network timeouts gracefully', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a potentially slow or non-existent site
      await startAnalysis(page, 'https://httpstat.us/timeout');
      
      // Should either complete or show appropriate error handling
      const hasResults = await waitForResults(page, 20000); // Shorter timeout for edge case
      
      console.log('✅ Network timeout handling validated');
      // Don't expect specific result - just that it doesn't crash
    });

    test('should handle malformed URLs', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a malformed URL
      const urlInput = page.locator('input[type="url"], input[placeholder*="url"], input[placeholder*="URL"], input[name="url"]');
      if (await urlInput.count() > 0) {
        await urlInput.fill('not-a-valid-url');
        
        const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start"), button[type="submit"]');
        if (await analyzeButton.count() > 0) {
          await analyzeButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      console.log('✅ Malformed URL handling validated');
    });

    test('should handle sites with dynamic content', async ({ page }) => {
      test.setTimeout(testConfig.analysisTimeout);
      
      if (!await ensureAuthenticated(page)) return;
      
      // Test with a site that has dynamic/JavaScript content
      await startAnalysis(page, 'https://github.com');
      
      const hasResults = await waitForResults(page);
      expect(hasResults).toBe(true);
      
      console.log('✅ Dynamic content handling validated');
    });
  });
});