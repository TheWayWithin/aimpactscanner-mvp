// Analytics Testing Suite - Playwright E2E Tests for GTM + GA4 Integration
// Comprehensive verification of all 5 business events and data layer functionality

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5173',
  timeout: 30000,
  gtmContainer: 'GTM-WCQGG5N6',
  ga4Property: 'G-EJ5M874QBZ',
  events: [
    'analysis_start',
    'analysis_complete', 
    'sign_up',
    'purchase',
    'feature_usage'
  ]
};

test.describe('GTM + GA4 Analytics Integration Tests', () => {
  let dataLayerEvents = [];

  test.beforeEach(async ({ page }) => {
    // Capture data layer events
    await page.addInitScript(() => {
      window.dataLayerEvents = [];
      window.dataLayer = window.dataLayer || [];
      
      // Override dataLayer.push to capture events
      const originalPush = window.dataLayer.push;
      window.dataLayer.push = function() {
        const event = arguments[0];
        window.dataLayerEvents.push(event);
        console.log('📊 Data Layer Event:', event);
        return originalPush.apply(window.dataLayer, arguments);
      };
    });

    // Navigate to app
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');
  });

  test('1. GTM Container Loading Verification', async ({ page }) => {
    console.log('🧪 Testing GTM Container Loading...');

    // Check if GTM script is loaded
    const gtmScript = await page.locator(`script[src*="${TEST_CONFIG.gtmContainer}"]`);
    await expect(gtmScript).toBeAttached();

    // Verify data layer exists
    const dataLayerExists = await page.evaluate(() => {
      return Array.isArray(window.dataLayer);
    });
    expect(dataLayerExists).toBe(true);

    // Check for GTM initialization event
    const hasGTMInit = await page.evaluate(() => {
      return window.dataLayer.some(item => item.event === 'gtm.js');
    });
    expect(hasGTMInit).toBe(true);

    console.log('✅ GTM Container loaded successfully');
  });

  test('2. Analytics Test Dashboard Access', async ({ page }) => {
    console.log('🧪 Testing Analytics Test Dashboard Access...');

    // Navigate to analytics test section
    await page.click('button:has-text("🔬 Analytics Test")');
    
    // Verify test dashboard loads
    await expect(page.locator('h1:has-text("Analytics Test Dashboard")')).toBeVisible();
    
    // Check GTM status indicator
    const gtmStatus = page.locator('#gtm-status, [class*="status"]').first();
    await expect(gtmStatus).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Analytics Test Dashboard accessible');
  });

  test('3. Analysis Start Event Testing', async ({ page }) => {
    console.log('🧪 Testing analysis_start event...');

    // Navigate to analytics test
    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);

    // Clear existing events
    await page.evaluate(() => window.dataLayerEvents = []);

    // Trigger analysis start event
    await page.click('button:has-text("Test Analysis Start")');
    await page.waitForTimeout(1000);

    // Verify event was fired
    const events = await page.evaluate(() => window.dataLayerEvents);
    const analysisStartEvent = events.find(event => event.event === 'analysis_start');
    
    expect(analysisStartEvent).toBeTruthy();
    expect(analysisStartEvent.event_category).toBe('engagement');
    expect(analysisStartEvent.analyzed_url).toBe('example.com');
    expect(analysisStartEvent.user_tier).toBeTruthy();

    console.log('✅ analysis_start event fired correctly');
    console.log('📊 Event data:', analysisStartEvent);
  });

  test('4. Analysis Complete Event Testing', async ({ page }) => {
    console.log('🧪 Testing analysis_complete event...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dataLayerEvents = []);

    await page.click('button:has-text("Test Analysis Complete")');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.dataLayerEvents);
    const analysisCompleteEvent = events.find(event => event.event === 'analysis_complete');
    
    expect(analysisCompleteEvent).toBeTruthy();
    expect(analysisCompleteEvent.event_category).toBe('engagement');
    expect(analysisCompleteEvent.analyzed_url).toBe('example.com');
    expect(analysisCompleteEvent.analysis_score).toBe(67);
    expect(analysisCompleteEvent.analysis_duration).toBe(12);

    console.log('✅ analysis_complete event fired correctly');
    console.log('📊 Event data:', analysisCompleteEvent);
  });

  test('5. User Signup Event Testing', async ({ page }) => {
    console.log('🧪 Testing sign_up event...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dataLayerEvents = []);

    await page.click('button:has-text("Test User Signup")');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.dataLayerEvents);
    const signupEvent = events.find(event => event.event === 'sign_up');
    
    expect(signupEvent).toBeTruthy();
    expect(signupEvent.event_category).toBe('conversion');
    expect(signupEvent.method).toBe('email');
    expect(signupEvent.tier).toBe('free');

    console.log('✅ sign_up event fired correctly');
    console.log('📊 Event data:', signupEvent);
  });

  test('6. Enhanced Ecommerce Purchase Event Testing', async ({ page }) => {
    console.log('🧪 Testing purchase event with enhanced ecommerce...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dataLayerEvents = []);

    await page.click('button:has-text("Test Coffee Purchase")');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.dataLayerEvents);
    const purchaseEvent = events.find(event => event.event === 'purchase');
    
    expect(purchaseEvent).toBeTruthy();
    expect(purchaseEvent.event_category).toBe('conversion');
    expect(purchaseEvent.value).toBe(5);
    expect(purchaseEvent.currency).toBe('USD');
    expect(purchaseEvent.transaction_id).toContain('upgrade_');
    
    // Verify enhanced ecommerce items array
    expect(purchaseEvent.items).toBeTruthy();
    expect(purchaseEvent.items).toHaveLength(1);
    expect(purchaseEvent.items[0].item_id).toBe('tier_coffee');
    expect(purchaseEvent.items[0].item_name).toBe('Coffee Tier');
    expect(purchaseEvent.items[0].category).toBe('subscription');
    expect(purchaseEvent.items[0].price).toBe(5);

    console.log('✅ purchase event with enhanced ecommerce fired correctly');
    console.log('📊 Event data:', purchaseEvent);
  });

  test('7. Feature Usage Event Testing', async ({ page }) => {
    console.log('🧪 Testing feature_usage event...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dataLayerEvents = []);

    await page.click('button:has-text("Test Feature Usage")');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.dataLayerEvents);
    const featureEvent = events.find(event => event.event === 'feature_usage');
    
    expect(featureEvent).toBeTruthy();
    expect(featureEvent.event_category).toBe('engagement');
    expect(featureEvent.feature_name).toBe('analytics_test');
    expect(featureEvent.action).toBe('button_click');

    console.log('✅ feature_usage event fired correctly');
    console.log('📊 Event data:', featureEvent);
  });

  test('8. Multiple Events Sequence Testing', async ({ page }) => {
    console.log('🧪 Testing multiple events sequence...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dataLayerEvents = []);

    // Fire all events in sequence
    await page.click('button:has-text("Test Analysis Start")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Test Analysis Complete")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Test User Signup")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Test Coffee Purchase")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Test Feature Usage")');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.dataLayerEvents);
    
    // Verify all 5 business events were fired
    const eventTypes = events.map(e => e.event);
    expect(eventTypes).toContain('analysis_start');
    expect(eventTypes).toContain('analysis_complete');
    expect(eventTypes).toContain('sign_up');
    expect(eventTypes).toContain('purchase');
    expect(eventTypes).toContain('feature_usage');

    console.log('✅ All 5 business events fired in sequence');
    console.log('📊 Event sequence:', eventTypes);
  });

  test('9. Data Layer Structure Validation', async ({ page }) => {
    console.log('🧪 Testing data layer structure and format...');

    await page.click('button:has-text("🔬 Analytics Test")');
    await page.waitForTimeout(2000);

    // Get data layer info
    const dataLayerInfo = await page.evaluate(() => {
      return {
        length: window.dataLayer ? window.dataLayer.length : 0,
        hasGTMStart: window.dataLayer.some(item => item['gtm.start']),
        hasGTMJS: window.dataLayer.some(item => item.event === 'gtm.js'),
        structure: window.dataLayer ? window.dataLayer.slice(0, 3) : []
      };
    });

    expect(dataLayerInfo.length).toBeGreaterThan(0);
    expect(dataLayerInfo.hasGTMStart).toBe(true);
    expect(dataLayerInfo.hasGTMJS).toBe(true);

    console.log('✅ Data layer structure validated');
    console.log('📊 Data layer info:', dataLayerInfo);
  });

  test('10. Performance and Load Time Testing', async ({ page }) => {
    console.log('🧪 Testing GTM load performance...');

    const startTime = Date.now();
    
    await page.goto(TEST_CONFIG.baseURL);
    
    // Wait for GTM to be ready
    await page.waitForFunction(() => {
      return window.dataLayer && window.dataLayer.some(item => item.event === 'gtm.js');
    }, { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    
    // Verify load time is reasonable (< 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    console.log(`✅ GTM loaded in ${loadTime}ms`);
  });
});

// Test runner function for CLI execution
if (require.main === module) {
  console.log('🚀 Starting Analytics Testing Suite...');
  console.log(`📊 Testing GTM: ${TEST_CONFIG.gtmContainer}`);
  console.log(`📈 Testing GA4: ${TEST_CONFIG.ga4Property}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseURL}`);
  console.log('');
}