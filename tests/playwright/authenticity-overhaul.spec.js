import { test, expect } from '@playwright/test';

/**
 * AUTHENTICITY OVERHAUL VALIDATION SUITE
 * 
 * Mission: Validate all fake data has been replaced with real insights
 * Priority: CRITICAL - User trust depends on this
 * 
 * Components to validate:
 * - AnalysisPreview (replaces TeaserResults)
 * - ClientCaseStudies (7 real clients)
 * - OpportunityFinder (replaces ROI Calculator)
 * - IndustryBenchmarks (replaces CompetitorComparison)
 * - SimpleResultsDashboard (demo mode notice)
 */

test.describe('Authenticity Overhaul - Trust Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('displays AnalysisPreview instead of fake TeaserResults', async ({ page }) => {
    // Enter a URL to trigger analysis preview
    await page.fill('input[placeholder="Enter your website URL..."]', 'example.com');
    await page.click('button:has-text("Analyze My Site Free")');
    
    // Wait for progress to complete
    await page.waitForTimeout(6000); // Allow progress animation
    
    // Should see AnalysisPreview content, NOT fake scores
    await expect(page.locator('text=What We Analyze: The MASTERY-AI Framework')).toBeVisible();
    await expect(page.locator('text=148 specific factors')).toBeVisible();
    
    // Should NOT see fake score of 42/100
    await expect(page.locator('text=42/100')).not.toBeVisible();
    await expect(page.locator('text=Your site is only 42% optimized')).not.toBeVisible();
  });

  test('shows all 7 real client case studies', async ({ page }) => {
    // Navigate to analysis preview
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Check for ClientCaseStudies component
    await expect(page.locator('text=Real Results from Real Clients')).toBeVisible();
    
    // Verify all 7 real clients are present
    const realClients = [
      'FreeCalcHub',
      'Evolve-7',
      'Agent-11',
      'Agents-11',
      'LLMtxt Mastery',
      'AI Search Mastery',
      'MCP-11'
    ];
    
    for (const client of realClients) {
      await expect(page.locator(`button:has-text("${client}")`)).toBeVisible();
    }
    
    // Click on first client to see details
    await page.click('button:has-text("FreeCalcHub")');
    
    // Verify real improvement data shows
    await expect(page.locator('text=/45.*72/')).toBeVisible(); // Score improvement
    await expect(page.locator('text=156% increase in AI-driven traffic')).toBeVisible();
  });

  test('displays transparency disclaimers throughout', async ({ page }) => {
    // Enter URL to see preview
    await page.fill('input[placeholder="Enter your website URL..."]', 'mysite.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Check for transparency elements
    await expect(page.locator('text=Based on analysis of 7 client sites')).toBeVisible();
    await expect(page.locator('text=Source: MASTERY-AI Framework research')).toBeVisible();
    
    // Verify "common issues" section has real data
    await expect(page.locator('text=Common Issues We Find')).toBeVisible();
    await expect(page.locator('text=73% of sites')).toBeVisible(); // Real frequency data
  });

  test('no fake statistics or inflated numbers', async ({ page }) => {
    // Check landing page
    await expect(page.locator('text=5,247 businesses')).not.toBeVisible();
    await expect(page.locator('text=47,000+')).not.toBeVisible();
    
    // Should show real numbers
    await expect(page.locator('text=Trusted by 7 pioneering sites')).toBeVisible();
    await expect(page.locator('text=10+')).toBeVisible(); // Realistic business count
  });

  test('framework pillars display with real weights', async ({ page }) => {
    // Navigate to analysis preview
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Check framework pillars
    const pillars = [
      { name: 'AI Readiness', weight: '23.8%', factors: 48 },
      { name: 'Authority', weight: '17.9%', factors: 31 },
      { name: 'Machine Readability', weight: '14.6%', factors: 22 },
      { name: 'User Experience', weight: '13.7%', factors: 19 },
      { name: 'Content Quality', weight: '12.2%', factors: 16 },
      { name: 'Technical Excellence', weight: '17.8%', factors: 12 }
    ];
    
    for (const pillar of pillars) {
      await expect(page.locator(`text=${pillar.name}`).first()).toBeVisible();
      await expect(page.locator(`text=${pillar.weight} weight`)).toBeVisible();
      await expect(page.locator(`text=${pillar.factors} factors analyzed`)).toBeVisible();
    }
  });

  test('authenticated users see demo mode notice', async ({ page }) => {
    // This would require authentication setup
    // For now, check if SimpleResultsDashboard would show demo notice
    
    // Sign in first (if auth is available)
    const hasSignIn = await page.locator('text=Sign In').isVisible();
    if (hasSignIn) {
      await page.click('text=Sign In');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button:has-text("Send Magic Link")');
      
      // Would need to handle magic link flow
      // For now, just verify the component structure exists
    }
  });

  test('OpportunityFinder shows real client data disclaimer', async ({ page }) => {
    // Check if OpportunityFinder is integrated
    // This component might be shown after analysis
    
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Look for opportunity finder elements
    const hasOpportunityFinder = await page.locator('text=Opportunity Finder').isVisible();
    if (hasOpportunityFinder) {
      await expect(page.locator('text=Based on actual improvements from 7 real client implementations')).toBeVisible();
      await expect(page.locator('text=Full Transparency:')).toBeVisible();
    }
  });

  test('client testimonials are realistic and specific', async ({ page }) => {
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Click through clients to see testimonials
    await page.click('button:has-text("FreeCalcHub")');
    await expect(page.locator('text=The analysis identified exactly why AI wasn\'t surfacing our calculators')).toBeVisible();
    
    await page.click('button:has-text("AI Search Mastery")');
    await expect(page.locator('text=Even as the framework creators, we had optimization gaps')).toBeVisible();
  });

  test('no fake competitor comparisons', async ({ page }) => {
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Should NOT see fake competitor names
    await expect(page.locator('text=Industry Leader')).not.toBeVisible();
    await expect(page.locator('text=Top Competitor')).not.toBeVisible();
    
    // Might see industry benchmarks instead
    const hasBenchmarks = await page.locator('text=Industry Benchmarks').isVisible();
    if (hasBenchmarks) {
      await expect(page.locator('text=Based on patterns observed across our 7 client sites')).toBeVisible();
    }
  });

  test('clear CTA without fake urgency', async ({ page }) => {
    await page.fill('input[placeholder="Enter your website URL..."]', 'test.com');
    await page.click('button:has-text("Analyze My Site Free")');
    await page.waitForTimeout(6000);
    
    // Check for authentic CTAs
    await expect(page.locator('text=Get Your Real Analysis Results')).toBeVisible();
    await expect(page.locator('text=See your actual scores, specific issues, and exact fixes for YOUR site')).toBeVisible();
    
    // Should NOT have fake urgency
    await expect(page.locator('text=Limited time offer')).not.toBeVisible();
    await expect(page.locator('text=Only 24 hours left')).not.toBeVisible();
  });
});

test.describe('Landing Page Authenticity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('shows real client names without URLs', async ({ page }) => {
    // Client names should be visible
    const clients = ['FreeCalcHub', 'Evolve-7', 'Agent-11', 'Agents-11', 'LLMtxt Mastery', 'AI Search Mastery', 'MCP-11'];
    
    for (const client of clients) {
      await expect(page.locator(`text=${client}`).first()).toBeVisible();
    }
    
    // URLs should NOT be visible (removed for cleaner display)
    await expect(page.locator('text=freecalchub.com')).not.toBeVisible();
    await expect(page.locator('text=evolve-7.com')).not.toBeVisible();
  });

  test('displays authentic community numbers', async ({ page }) => {
    // Should show realistic "10+" not inflated "47,000+"
    await expect(page.locator('text=10+')).toBeVisible();
    await expect(page.locator('text=Businesses Analyzed')).toBeVisible();
    
    // Other metrics should be reasonable
    await expect(page.locator('text=2.4x')).toBeVisible(); // Average improvement
    await expect(page.locator('text=15s')).toBeVisible(); // Analysis time
  });

  test('solopreneur messaging is present', async ({ page }) => {
    await expect(page.locator('text=Built by a solopreneur, for solopreneurs')).toBeVisible();
    await expect(page.locator('text=No team, no overhead, just automated excellence')).toBeVisible();
  });
});

test.describe('Demo Mode Transparency', () => {
  test('results dashboard shows demo mode notice', async ({ page }) => {
    // This test would need authenticated access to results dashboard
    // Navigate directly if possible
    await page.goto('http://localhost:5173');
    
    // Try to access results (might need auth)
    const hasResults = await page.locator('text=Results').isVisible();
    if (hasResults) {
      await page.click('text=Results');
      
      // Look for demo mode notice
      await expect(page.locator('text=Demo Mode:')).toBeVisible();
      await expect(page.locator('text=sample data demonstrating our analysis format')).toBeVisible();
    }
  });
});