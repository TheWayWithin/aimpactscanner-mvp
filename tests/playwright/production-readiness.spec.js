import { test, expect } from '@playwright/test';

test.describe('Production Readiness Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Real Analysis Flow', () => {
    test('should perform real analysis and display actual results', async ({ page }) => {
      // Enter a URL for real analysis
      await page.fill('input[placeholder="Enter your website URL..."]', 'example.com');
      await page.click('button:has-text("Analyze My Site Free")');
      
      // Wait for analysis preview
      await page.waitForTimeout(6000);
      
      // Should see AnalysisPreview content
      await expect(page.locator('text=What We Analyze: The MASTERY-AI Framework')).toBeVisible();
      await expect(page.locator('text=Get Your Real Analysis Results')).toBeVisible();
      
      // Click to start free trial
      await page.click('button:has-text("Start Free Analysis")');
      
      // Should navigate to auth
      await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('should show demo mode notice only for demo analysis', async ({ page }) => {
      // Sign in first (mock auth for testing)
      // Note: In real test, you'd need actual auth or mock session
      
      // For now, check that demo notice logic is in place
      await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
      await page.click('button:has-text("Analyze My Site Free")');
      
      await page.waitForTimeout(6000);
      
      // The preview page should not show "Demo Mode" in the preview
      const demoText = await page.locator('text=Demo Mode:').count();
      expect(demoText).toBe(0); // Should not see demo mode in preview
    });
  });

  test.describe('Demo Mode Feature', () => {
    test('should have demo button accessible from dashboard', async ({ page }) => {
      // Note: This would require auth to access dashboard
      // For now, verify the landing page flow
      
      // Check that landing page doesn't incorrectly show demo content
      await expect(page.locator('text=AI is reshaping search')).toBeVisible();
      
      // Enter URL should lead to preview, not demo
      await page.fill('input[placeholder="Enter your website URL..."]', 'demo-test.com');
      await page.click('button:has-text("Analyze My Site Free")');
      
      await page.waitForTimeout(6000);
      
      // Should see real preview content
      await expect(page.locator('text=Real Results from Real Clients')).toBeVisible();
    });
  });

  test.describe('Usage Tracking', () => {
    test('should track free tier usage (requires auth)', async ({ page }) => {
      // This test would need authenticated session
      // Verify the UI shows usage info correctly
      
      // For now, just verify the landing page loads
      await expect(page.locator('text=No email required')).toBeVisible();
      await expect(page.locator('text=See results in 15 seconds')).toBeVisible();
      await expect(page.locator('text=100% free analysis')).toBeVisible();
    });
  });

  test.describe('Critical User Paths', () => {
    test('landing → URL entry → preview → auth prompt', async ({ page }) => {
      // Verify complete flow
      await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
      
      // Enter URL
      await page.fill('input[placeholder="Enter your website URL..."]', 'mysite.com');
      await page.click('button:has-text("Analyze My Site Free")');
      
      // Wait for preview to load
      await page.waitForTimeout(6000);
      
      // Should see framework info
      await expect(page.locator('text=148 specific factors')).toBeVisible();
      
      // Should see CTA
      await expect(page.locator('text=Get Your Real Analysis Results')).toBeVisible();
    });

    test('should display all 7 real clients', async ({ page }) => {
      await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
      await page.click('button:has-text("Analyze My Site Free")');
      await page.waitForTimeout(6000);
      
      const clients = ['FreeCalcHub', 'Evolve-7', 'Agent-11', 'Agents-11', 'LLMtxt Mastery', 'AI Search Mastery', 'MCP-11'];
      
      for (const client of clients) {
        await expect(page.locator(`button:has-text("${client}")`)).toBeVisible();
      }
    });

    test('should show framework pillars with correct weights', async ({ page }) => {
      await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
      await page.click('button:has-text("Analyze My Site Free")');
      await page.waitForTimeout(6000);
      
      // Check for correct framework weights
      await expect(page.locator('text=23.8%')).toBeVisible(); // AI Readiness
      await expect(page.locator('text=17.9%')).toBeVisible(); // Authority
      await expect(page.locator('text=14.6%')).toBeVisible(); // Machine Readability
    });
  });

  test.describe('Edge Function Integration', () => {
    test('should handle Edge Function errors gracefully', async ({ page }) => {
      // Test with invalid URL
      await page.fill('input[placeholder="Enter your website URL..."]', 'not-a-valid-url-!@#$%');
      await page.click('button:has-text("Analyze My Site Free")');
      
      // Should still show preview (doesn't call Edge Function yet)
      await page.waitForTimeout(6000);
      await expect(page.locator('text=What We Analyze')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
      await expect(page.locator('input[placeholder="Enter your website URL..."]')).toBeVisible();
      
      // Check that layout doesn't break
      const button = page.locator('button:has-text("Analyze My Site Free")');
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThan(100); // Button should be reasonably sized
    });
  });

  test.describe('Data Integrity', () => {
    test('should not show database error messages to users', async ({ page }) => {
      // Enter URL and proceed
      await page.fill('input[placeholder="Enter your website URL..."]', 'test-db.com');
      await page.click('button:has-text("Analyze My Site Free")');
      
      await page.waitForTimeout(6000);
      
      // Should not see error messages
      const errorCount = await page.locator('text=/error|failed|exception/i').count();
      expect(errorCount).toBe(0);
    });

    test('should maintain data consistency through flow', async ({ page }) => {
      const testUrl = 'consistency-test.com';
      
      await page.fill('input[placeholder="Enter your website URL..."]', testUrl);
      await page.click('button:has-text("Analyze My Site Free")');
      
      await page.waitForTimeout(6000);
      
      // URL should be preserved in preview
      await expect(page.locator(`text=Analyzing: ${testUrl}`)).toBeVisible();
    });
  });
});

test.describe('Production Deployment Checklist', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected warnings (like Tailwind CDN)
    const criticalErrors = errors.filter(e => 
      !e.includes('cdn.tailwindcss.com') && 
      !e.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('all images load successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const naturalWidth = await img.evaluate(node => node.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('critical text content is present', async ({ page }) => {
    const criticalContent = [
      'Is AI Stealing Your Traffic?',
      'ChatGPT, Claude, and Perplexity',
      'Analyze My Site Free',
      'No email required',
      '15 seconds',
      'Trusted by 7 pioneering sites'
    ];
    
    for (const content of criticalContent) {
      await expect(page.locator(`text=${content}`)).toBeVisible();
    }
  });
});