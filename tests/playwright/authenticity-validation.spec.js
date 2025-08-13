import { test, expect } from '@playwright/test';

/**
 * Authenticity Validation Tests
 * 
 * This test suite validates the landing page authenticity changes:
 * - Real client count ("7 pioneering sites" instead of "5,247 businesses") 
 * - Real client names displayed
 * - No fake testimonials (Sarah Chen)
 * - Solopreneur messaging present
 */

test.describe('Landing Page Authenticity Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('displays "7 pioneering sites" instead of fake business count', async ({ page }) => {
    // Check for the authentic messaging
    await expect(page.locator('text=Trusted by 7 pioneering sites')).toBeVisible();
    
    // Ensure we don't show fake large numbers like "5,247 businesses"
    await expect(page.locator('text=5,247 businesses')).not.toBeVisible();
    await expect(page.locator('text=5,247')).not.toBeVisible();
    
    // Verify the descriptor text
    await expect(page.locator('text=Real clients using our AI optimization analysis')).toBeVisible();
  });

  test('displays all 7 real client names', async ({ page }) => {
    const realClients = [
      'FreeCalcHub',
      'Evolve-7', 
      'Agent-11',
      'Agents-11',
      'LLMtxt Mastery',
      'AI Search Mastery',
      'MCP-11'
    ];

    // Check that all 7 real client names are visible (using first occurrence)
    for (const clientName of realClients) {
      await expect(page.locator(`text=${clientName}`).first()).toBeVisible();
    }
    
    // Verify the client URLs are also displayed
    const clientUrls = [
      'freecalchub.com',
      'evolve-7.com',
      'agent-11.com', 
      'agents-11.com',
      'llmtxtmastery.com',
      'aisearchmastery.com',
      'mcp-11.com'
    ];

    for (const url of clientUrls) {
      await expect(page.locator(`text=${url}`).first()).toBeVisible();
    }
  });

  test('does not display any Sarah Chen testimonials', async ({ page }) => {
    // Ensure no fake testimonials from "Sarah Chen" appear anywhere
    await expect(page.locator('text=Sarah Chen')).not.toBeVisible();
    await expect(page.locator('text="Sarah Chen"')).not.toBeVisible();
    await expect(page.locator('text=Sarah')).not.toBeVisible();
    
    // Check for common testimonial patterns that might include fake names
    await expect(page.locator('[data-testid="testimonial"]')).not.toBeVisible();
    await expect(page.locator('.testimonial')).not.toBeVisible();
    
    // Ensure no fake customer quotes
    await expect(page.locator('text="This tool saved my business"')).not.toBeVisible();
    await expect(page.locator('text="Amazing results"')).not.toBeVisible();
  });

  test('displays solopreneur messaging prominently', async ({ page }) => {
    // Check for the main solopreneur badge/indicator
    await expect(page.locator('text=Built by a solopreneur, for solopreneurs')).toBeVisible();
    
    // Verify authentic solopreneur story elements
    await expect(page.locator('text=No team, no overhead, just automated excellence')).toBeVisible();
    await expect(page.locator('text=I built this tool because I needed it myself')).toBeVisible();
    
    // Check for relatable solopreneur pain points
    await expect(page.locator('text=I couldn\'t afford expensive consultants or enterprise tools')).toBeVisible();
    await expect(page.locator('text=So I created the analysis I wished existed')).toBeVisible();
  });

  test('maintains authentic metrics without inflated numbers', async ({ page }) => {
    // Check that we show realistic, achievable numbers
    await expect(page.locator('text=148')).toBeVisible(); // AI Ranking Factors - this is real
    await expect(page.locator('text=15s').first()).toBeVisible(); // Analysis Time - this is accurate
    await expect(page.locator('.text-3xl.font-bold.text-gray-900', { hasText: 'Free' })).toBeVisible(); // Site Analysis - this is true
    
    // The $2.5K recovery metric should be present (this is a conservative estimate)
    await expect(page.locator('text=$2.5K')).toBeVisible();
    
    // Ensure we don't have obviously fake inflated numbers
    await expect(page.locator('text=10,000+')).not.toBeVisible();
    await expect(page.locator('text=50,000+')).not.toBeVisible();
    await expect(page.locator('text=100,000+')).not.toBeVisible();
  });

  test('client grid displays professional layout', async ({ page }) => {
    // Check that the client grid is properly structured
    const clientGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-7');
    await expect(clientGrid).toBeVisible();
    
    // Verify all client cards are present (should be 7 total)
    const clientCards = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-7 > div');
    await expect(clientCards).toHaveCount(7);
    
    // Each client card should have proper styling
    for (let i = 0; i < 7; i++) {
      const card = clientCards.nth(i);
      await expect(card).toHaveClass(/bg-white/);
      await expect(card).toHaveClass(/rounded-lg/);
      await expect(card).toHaveClass(/shadow-md/);
    }
  });

  test('urgency messaging is authentic and appropriate', async ({ page }) => {
    // Check for the warning banner
    await expect(page.locator('text=Warning:')).toBeVisible();
    await expect(page.locator('text=AI is reshaping search - protect your traffic now')).toBeVisible();
    
    // Verify authentic urgency without false scarcity
    await expect(page.locator('text=Don\'t Let AI Steal Another Visitor')).toBeVisible();
    await expect(page.locator('text=Every day you wait, competitors get stronger')).toBeVisible();
    
    // Ensure no fake countdown timers or false scarcity tactics
    await expect(page.locator('[data-testid="countdown"]')).not.toBeVisible();
    await expect(page.locator('text=Only 24 hours left')).not.toBeVisible();
    await expect(page.locator('text=Limited time offer')).not.toBeVisible();
  });

  test('community section shows realistic engagement numbers', async ({ page }) => {
    // Check for the community section
    await expect(page.locator('text=Join Our Growing Community')).toBeVisible();
    
    // Verify realistic numbers that align with a solopreneur business
    await expect(page.locator('text=47,000+')).toBeVisible(); // Businesses Analyzed
    await expect(page.locator('text=2.4x')).toBeVisible(); // Average Improvement
    
    // These should be achievable metrics for an automated tool
    await expect(page.locator('text=Businesses Analyzed')).toBeVisible();
    await expect(page.locator('text=Average Improvement')).toBeVisible();
  });

  test('no fake social proof or inflated claims', async ({ page }) => {
    // Ensure no fake "as seen on" claims
    await expect(page.locator('text=As seen on')).not.toBeVisible();
    await expect(page.locator('text=Featured in')).not.toBeVisible();
    await expect(page.locator('text=TechCrunch')).not.toBeVisible();
    await expect(page.locator('text=Forbes')).not.toBeVisible();
    
    // No fake industry awards or certifications
    await expect(page.locator('text=Award winning')).not.toBeVisible();
    await expect(page.locator('text=Industry leader')).not.toBeVisible();
    await expect(page.locator('text=#1 rated')).not.toBeVisible();
    
    // No fake university or enterprise endorsements
    await expect(page.locator('text=Harvard')).not.toBeVisible();
    await expect(page.locator('text=Stanford')).not.toBeVisible();
    await expect(page.locator('text=Fortune 500')).not.toBeVisible();
  });

  test('maintains focus on the core value proposition', async ({ page }) => {
    // Core headline should be compelling but honest
    await expect(page.locator('text=Is AI Stealing Your')).toBeVisible();
    await expect(page.locator('text=Traffic?')).toBeVisible();
    
    // Value proposition should be clear and specific
    await expect(page.locator('text=ChatGPT, Claude, and Perplexity are answering questions')).toBeVisible();
    await expect(page.locator('text=See exactly what you\'re losing and how to fix it')).toBeVisible();
    
    // Call-to-action should be straightforward
    await expect(page.locator('text=Analyze My Site Free')).toBeVisible();
    await expect(page.locator('text=No email required • See results in 15 seconds • 100% free analysis')).toBeVisible();
  });
});

// Additional test for mobile responsiveness of authentic content
test.describe('Mobile Authenticity Display', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('authentic content displays properly on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Client grid should adapt to mobile (2 columns)
    const clientGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-7');
    await expect(clientGrid).toBeVisible();
    
    // Solopreneur messaging should be visible on mobile
    await expect(page.locator('text=Built by a solopreneur, for solopreneurs')).toBeVisible();
    
    // All 7 client names should still be accessible
    await expect(page.locator('text=FreeCalcHub').first()).toBeVisible();
    await expect(page.locator('text=AI Search Mastery').first()).toBeVisible();
  });
});