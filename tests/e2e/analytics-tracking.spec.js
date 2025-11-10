import { test, expect } from '@playwright/test';

/**
 * Test Gate 6: Analytics Event Tracking Tests
 *
 * Tests all 5 tier selector analytics events implemented in Phase 8.1:
 * 1. tier_selector_viewed - Fires on component mount
 * 2. tier_selection_changed - Fires on tier dropdown change
 * 3. billing_toggle_clicked - Fires on annual/monthly toggle
 * 4. tier_cta_clicked - Fires on trial/skip trial CTA click
 * 5. trial_details_expanded - Fires on details expand/collapse
 *
 * All tests mock window.dataLayer to avoid actual GTM/GA4 calls.
 */

test.describe('Analytics Tracking - Tier Selector (Phase 8.1)', () => {

  test.beforeEach(async ({ page }) => {
    // Mock window.dataLayer before page loads
    await page.addInitScript(() => {
      window.dataLayer = [];
      window.__capturedEvents = [];

      // Override dataLayer.push to capture events
      const originalPush = window.dataLayer.push;
      window.dataLayer.push = function(...args) {
        // Store events for test verification
        window.__capturedEvents.push(...args);
        return originalPush.apply(this, args);
      };
    });

    // Navigate to signup page
    await page.goto('http://localhost:5173/#signup');

    // Wait for tier selector to mount
    await page.waitForSelector('[data-testid="tier-dropdown-button"]', { timeout: 10000 });

    // Wait for component to be fully rendered
    await page.waitForTimeout(500);
  });

  test('Event #1: tier_selector_viewed fires on component mount', async ({ page }) => {
    // Get captured events from page load
    const events = await page.evaluate(() => window.__capturedEvents || []);

    // Find tier_selector_viewed event
    const viewedEvent = events.find(e => e.event === 'tier_selector_viewed');

    // Verify event exists
    expect(viewedEvent).toBeTruthy();

    // Verify event has correct parameters
    expect(viewedEvent.default_tier).toBe('growth'); // Default tier
    expect(viewedEvent.default_billing).toBe('annual'); // Default billing
    expect(viewedEvent.timestamp).toBeTruthy();

    console.log('✅ tier_selector_viewed event:', viewedEvent);
  });

  test('Event #2: tier_selection_changed fires on tier dropdown change', async ({ page }) => {
    // Clear initial events from mount
    await page.evaluate(() => { window.__capturedEvents = []; });

    // Open dropdown
    await page.click('[data-testid="tier-dropdown-button"]');
    await page.waitForSelector('[data-testid="tier-option-coffee"]', { state: 'visible' });

    // Select Solo (coffee) tier
    await page.click('[data-testid="tier-option-coffee"]');

    // Wait for transition and event to fire
    await page.waitForTimeout(300);

    // Get events
    const events = await page.evaluate(() => window.__capturedEvents || []);
    const changeEvent = events.find(e => e.event === 'tier_selection_changed');

    // Verify event exists and has correct parameters
    expect(changeEvent).toBeTruthy();
    expect(changeEvent.previous_tier).toBe('growth'); // Was Growth
    expect(changeEvent.new_tier).toBe('coffee'); // Now Solo
    expect(changeEvent.billing_frequency).toBe('annual');
    expect(changeEvent.timestamp).toBeTruthy();

    console.log('✅ tier_selection_changed event:', changeEvent);
  });

  test('Event #3: billing_toggle_clicked fires on annual/monthly toggle', async ({ page }) => {
    // Clear initial events
    await page.evaluate(() => { window.__capturedEvents = []; });

    // Click Monthly button (toggle from Annual to Monthly)
    await page.click('[data-testid="billing-monthly"]');

    // Wait for event to fire
    await page.waitForTimeout(200);

    // Get events
    const events = await page.evaluate(() => window.__capturedEvents || []);
    const toggleEvent = events.find(e => e.event === 'billing_toggle_clicked');

    // Verify event exists and has correct parameters
    expect(toggleEvent).toBeTruthy();
    expect(toggleEvent.previous_frequency).toBe('annual'); // Was Annual
    expect(toggleEvent.new_frequency).toBe('monthly'); // Now Monthly
    expect(toggleEvent.current_tier).toBe('growth'); // Growth tier selected
    expect(toggleEvent.timestamp).toBeTruthy();

    console.log('✅ billing_toggle_clicked event:', toggleEvent);
  });

  test('Event #4a: tier_cta_clicked fires for trial CTA button', async ({ page }) => {
    // Clear initial events
    await page.evaluate(() => { window.__capturedEvents = []; });

    // CTA buttons are outside the dropdown menu, just scroll into view and click
    await page.waitForSelector('[data-testid="tier-cta-button"]', { state: 'visible' });
    await page.waitForTimeout(200); // Brief wait for component to stabilize

    // Click "Try Growth Free for 7 Days" button
    await page.click('[data-testid="tier-cta-button"]');

    // Wait for event to fire
    await page.waitForTimeout(200);

    // Get events
    const events = await page.evaluate(() => window.__capturedEvents || []);
    const ctaEvent = events.find(e => e.event === 'tier_cta_clicked');

    // Verify event exists and has correct parameters
    expect(ctaEvent).toBeTruthy();
    expect(ctaEvent.cta_type).toBe('trial'); // Trial button
    expect(ctaEvent.selected_tier).toBe('growth'); // Growth tier
    expect(ctaEvent.billing_frequency).toBe('annual');
    expect(ctaEvent.is_trial).toBe(true); // Trial flow
    expect(ctaEvent.timestamp).toBeTruthy();

    console.log('✅ tier_cta_clicked (trial) event:', ctaEvent);
  });

  test('Event #4b: tier_cta_clicked fires for skip trial CTA button', async ({ page }) => {
    // Clear initial events
    await page.evaluate(() => { window.__capturedEvents = []; });

    // CTA buttons are outside the dropdown menu, just scroll into view and click
    await page.waitForSelector('[data-testid="tier-skip-trial-button"]', { state: 'visible' });
    await page.waitForTimeout(200); // Brief wait for component to stabilize

    // Click "Skip trial, subscribe now" button
    await page.click('[data-testid="tier-skip-trial-button"]');

    // Wait for event to fire
    await page.waitForTimeout(200);

    // Get events
    const events = await page.evaluate(() => window.__capturedEvents || []);
    const ctaEvent = events.find(e => e.event === 'tier_cta_clicked');

    // Verify event exists and has correct parameters
    expect(ctaEvent).toBeTruthy();
    expect(ctaEvent.cta_type).toBe('skip_trial'); // Skip trial button
    expect(ctaEvent.selected_tier).toBe('growth'); // Growth tier
    expect(ctaEvent.billing_frequency).toBe('annual');
    expect(ctaEvent.is_trial).toBe(false); // NOT trial flow
    expect(ctaEvent.timestamp).toBeTruthy();

    console.log('✅ tier_cta_clicked (skip trial) event:', ctaEvent);
  });

  test('Event #5: trial_details_expanded fires on expand/collapse', async ({ page }) => {
    // Clear initial events
    await page.evaluate(() => { window.__capturedEvents = []; });

    // Trial details toggle is outside the dropdown menu
    await page.waitForSelector('text=/Show trial details/i', { state: 'visible' });
    await page.waitForTimeout(200); // Brief wait for component to stabilize

    // Click "Show trial details" to expand
    await page.click('text=/Show trial details/i');

    // Wait for event to fire
    await page.waitForTimeout(200);

    // Get events
    const events = await page.evaluate(() => window.__capturedEvents || []);
    const expandEvent = events.find(e => e.event === 'trial_details_expanded');

    // Verify event exists and has correct parameters
    expect(expandEvent).toBeTruthy();
    expect(expandEvent.expanded).toBe(true); // Expanded state
    expect(expandEvent.selected_tier).toBe('growth'); // Growth tier
    expect(expandEvent.billing_frequency).toBe('annual');
    expect(expandEvent.timestamp).toBeTruthy();

    console.log('✅ trial_details_expanded event:', expandEvent);
  });

  test('Analytics verification: All 5 events have timestamps', async ({ page }) => {
    // This test validates that ALL events include timestamp field
    // We trigger events #1, #2, #3, #5 directly (skip #4 to avoid navigation)

    // Clear events
    await page.evaluate(() => { window.__capturedEvents = []; });

    // Event #1: Already fired on mount, reload to capture fresh
    await page.reload();
    await page.waitForSelector('[data-testid="tier-dropdown-button"]');
    await page.waitForTimeout(500);

    // Event #2: Change tier
    await page.click('[data-testid="tier-dropdown-button"]');
    await page.click('[data-testid="tier-option-coffee"]');
    await page.waitForTimeout(300);

    // Event #3: Toggle billing
    await page.click('[data-testid="billing-monthly"]');
    await page.waitForTimeout(200);

    // Event #4: Skip clicking CTA (causes navigation) - already tested in dedicated test
    // Just verify the event type exists from earlier tests or component mount

    // Event #5: Need Growth tier for trial details - switch back
    await page.click('[data-testid="tier-dropdown-button"]');
    await page.click('[data-testid="tier-option-growth"]');
    await page.waitForTimeout(300);

    // Now expand trial details
    await page.waitForSelector('text=/Show trial details/i', { state: 'visible' });
    await page.waitForTimeout(200);
    await page.click('text=/Show trial details/i');
    await page.waitForTimeout(200);

    // Get all captured events
    const events = await page.evaluate(() => window.__capturedEvents || []);

    // Verify 4 out of 5 event types were captured (all except tier_cta_clicked)
    const capturedEventTypes = [
      'tier_selector_viewed',
      'tier_selection_changed',
      'billing_toggle_clicked',
      'trial_details_expanded'
    ];

    for (const eventType of capturedEventTypes) {
      const event = events.find(e => e.event === eventType);
      expect(event).toBeTruthy();
      expect(event.timestamp).toBeTruthy();
      console.log(`✅ ${eventType} has timestamp:`, event.timestamp);
    }

    console.log(`✅ All core analytics events fired with timestamps (${events.length} total events captured)`);
    console.log('Note: tier_cta_clicked event verified separately in dedicated tests (Events #4a and #4b)');
  });
});
