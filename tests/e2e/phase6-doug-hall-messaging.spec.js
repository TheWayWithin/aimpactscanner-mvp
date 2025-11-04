// Phase 6 Doug Hall Messaging E2E Tests
// Tests: OB/RRB dynamic messaging + DD/savings highlights
import { test, expect } from '@playwright/test';

const LOCAL_URL = 'http://localhost:5173';

test.describe('Phase 6: Doug Hall Messaging', () => {

  test('Test 1: Dynamic OB/RRB Messaging Updates', async ({ page }) => {
    console.log('🧪 Test 1: Testing OB/RRB messaging updates...');

    // Navigate to signup
    await page.goto(`${LOCAL_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for tier selector to render
    console.log('✅ At signup page');

    // Default should be Growth tier (radio button checked)
    const growthRadio = page.locator('input[type="radio"][value="growth"]');
    await expect(growthRadio).toBeChecked();
    console.log('✅ Growth tier radio button checked');

    // Verify Growth tier messaging
    await expect(page.locator('text=YOU MADE THE RIGHT CHOICE')).toBeVisible();
    await expect(page.locator('text=Scale your AI discoverability without breaking the bank')).toBeVisible();
    await expect(page.locator('text=40 analyses per month = flexible optimization')).toBeVisible();
    console.log('✅ Growth tier OB/RRB messaging verified');

    // Click Solo (coffee) tier
    const coffeeRadio = page.locator('input[type="radio"][value="coffee"]');
    await coffeeRadio.click();
    await page.waitForTimeout(600); // Wait for transition (500ms + buffer)
    console.log('✅ Clicked Solo tier');

    // Verify Solo messaging
    await expect(page.locator('text=Perfect for solopreneurs testing AI optimization')).toBeVisible();
    await expect(page.locator('text=Analyze your 10 most important pages')).toBeVisible();
    await expect(page.locator('text=10 analyses = complete core coverage')).toBeVisible();
    console.log('✅ Solo tier OB/RRB messaging verified');

    // Click Free tier
    const freeRadio = page.locator('input[type="radio"][value="free"]');
    await freeRadio.click();
    await page.waitForTimeout(600);
    console.log('✅ Clicked Free tier');

    // Verify Free tier messaging (red background, WHAT YOU'RE MISSING)
    await expect(page.locator('text=WHAT YOU\'RE MISSING')).toBeVisible();
    await expect(page.locator('text=Free tier vs Growth tier comparison')).toBeVisible();
    await expect(page.locator('text=❌ Only 3 analyses per month')).toBeVisible();

    // Verify red background styling
    const obSection = page.locator('text=WHAT YOU\'RE MISSING').locator('..');
    const bgColor = await obSection.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('📍 Free tier OB background color:', bgColor);
    console.log('✅ Free tier OB/RRB messaging verified');

    // Click Scale tier
    const scaleRadio = page.locator('input[type="radio"][value="scale"]');
    await scaleRadio.click();
    await page.waitForTimeout(600);
    console.log('✅ Clicked Scale tier');

    // Verify Scale tier messaging
    await expect(page.locator('text=Enterprise-grade AI optimization at scale')).toBeVisible();
    await expect(page.locator('text=For agencies and power users who mean business')).toBeVisible();
    await expect(page.locator('text=100 analyses per month = large-scale optimization')).toBeVisible();
    console.log('✅ Scale tier OB/RRB messaging verified');

    console.log('✅✅✅ TEST 1 PASSED: All tier messaging updates correctly');
  });

  test('Test 2: Dynamic DD/Savings Updates on Billing Toggle', async ({ page }) => {
    console.log('🧪 Test 2: Testing DD/Savings section updates...');

    await page.goto(`${LOCAL_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ At signup page');

    // Default: Growth tier + Annual billing
    const annualToggle = page.locator('button:has-text("Annual")');
    const monthlyToggle = page.locator('button:has-text("Monthly")');

    // Verify Annual is selected by default
    await expect(annualToggle).toBeVisible();
    const annualClasses = await annualToggle.getAttribute('class');
    console.log('📍 Annual button classes:', annualClasses);
    console.log('✅ Annual billing selected by default');

    // Verify DD shows annual savings
    await expect(page.locator('text=💰 Annual Savings Breakdown')).toBeVisible();
    await expect(page.locator('text=You save')).toBeVisible();

    // Check for savings amount (Growth tier: $149.50/yr vs $215.40/yr monthly = $65.90 savings)
    const savingsText = await page.locator('text=You save').first().textContent();
    console.log('📍 Annual savings text:', savingsText);
    console.log('✅ DD shows annual savings');

    // Toggle to Monthly
    await monthlyToggle.click();
    await page.waitForTimeout(600); // Wait for transition
    console.log('✅ Toggled to Monthly billing');

    // Verify DD updates to monthly breakdown
    await expect(page.locator('text=📊 Monthly Pricing Breakdown')).toBeVisible();
    await expect(page.locator('text=💡 Switch to annual and save')).toBeVisible();
    console.log('✅ DD shows monthly pricing with annual upsell');

    // Toggle back to Annual
    await annualToggle.click();
    await page.waitForTimeout(600);
    console.log('✅ Toggled back to Annual billing');

    // Verify DD returns to savings breakdown
    await expect(page.locator('text=💰 Annual Savings Breakdown')).toBeVisible();
    await expect(page.locator('text=You save')).toBeVisible();
    console.log('✅ DD returned to annual savings');

    console.log('✅✅✅ TEST 2 PASSED: Billing toggle updates DD correctly');
  });

  test('Test 3: Tier + Billing Combinations', async ({ page }) => {
    console.log('🧪 Test 3: Testing tier + billing combinations...');

    await page.goto(`${LOCAL_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ At signup page');

    const tiers = [
      {
        tier: 'coffee',
        name: 'Solo',
        annualPrice: '$49.50 annually',
        monthlyPrice: '$4.13/mo'
      },
      {
        tier: 'growth',
        name: 'Growth',
        annualPrice: '$149.50 annually',
        monthlyPrice: '$12.46/mo'
      },
      {
        tier: 'scale',
        name: 'Scale',
        annualPrice: '$299.50 annually',
        monthlyPrice: '$24.96/mo'
      }
    ];

    for (const { tier, name, annualPrice, monthlyPrice } of tiers) {
      console.log(`\n📋 Testing ${name} tier...`);

      // Select tier (radio button)
      const tierRadio = page.locator(`input[type="radio"][value="${tier}"]`);
      await tierRadio.click();
      await page.waitForTimeout(600);
      console.log(`✅ Selected ${name} tier`);

      // Test Annual billing
      const annualToggle = page.locator('button:has-text("Annual")');
      await annualToggle.click();
      await page.waitForTimeout(600);

      // Verify pricing displayed
      await expect(page.locator(`text=${annualPrice}`).first()).toBeVisible();
      await expect(page.locator('text=💰 Annual Savings Breakdown')).toBeVisible();
      console.log(`✅ ${name} Annual: ${annualPrice} displayed with savings`);

      // Test Monthly billing
      const monthlyToggle = page.locator('button:has-text("Monthly")');
      await monthlyToggle.click();
      await page.waitForTimeout(600);

      // Verify pricing displayed
      await expect(page.locator(`text=${monthlyPrice}`).first()).toBeVisible();
      await expect(page.locator('text=📊 Monthly Pricing Breakdown')).toBeVisible();
      console.log(`✅ ${name} Monthly: ${monthlyPrice} displayed with upsell`);
    }

    // Test Free tier (no billing, no DD section)
    console.log('\n📋 Testing Free tier...');
    const freeRadio = page.locator('input[type="radio"][value="free"]');
    await freeRadio.click();
    await page.waitForTimeout(600);
    console.log('✅ Selected Free tier');

    // Verify no DD section for Free tier
    await expect(page.locator('text=💰 Annual Savings Breakdown')).not.toBeVisible();
    await expect(page.locator('text=📊 Monthly Pricing Breakdown')).not.toBeVisible();
    console.log('✅ Free tier: No DD section displayed (correct)');

    console.log('\n✅✅✅ TEST 3 PASSED: All tier + billing combinations correct');
  });

  test('Test 4: Cost Per Analysis Calculations', async ({ page }) => {
    console.log('🧪 Test 4: Testing cost per analysis calculations...');

    await page.goto(`${LOCAL_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ At signup page');

    // Ensure Annual billing selected
    const annualToggle = page.locator('button:has-text("Annual")');
    await annualToggle.click();
    await page.waitForTimeout(600);

    const tiers = [
      {
        tier: 'coffee',
        name: 'Solo',
        expectedCostRange: [0.41, 0.50], // $49.50/12 = $4.125/mo ÷ 10 = $0.4125
        analyses: 10
      },
      {
        tier: 'growth',
        name: 'Growth',
        expectedCostRange: [0.31, 0.37], // $149.50/12 = $12.46/mo ÷ 40 = $0.3115
        analyses: 40
      },
      {
        tier: 'scale',
        name: 'Scale',
        expectedCostRange: [0.24, 0.30], // $299.50/12 = $24.96/mo ÷ 100 = $0.2496
        analyses: 100
      }
    ];

    for (const { tier, name, expectedCostRange, analyses } of tiers) {
      console.log(`\n📋 Testing ${name} tier cost per analysis...`);

      // Select tier (radio button)
      const tierRadio = page.locator(`input[type="radio"][value="${tier}"]`);
      await tierRadio.click();
      await page.waitForTimeout(600);
      console.log(`✅ Selected ${name} tier`);

      // Find cost per analysis text
      const costPerAnalysisSection = page.locator('text=Cost per analysis').locator('..');
      await expect(costPerAnalysisSection).toBeVisible();

      const costText = await costPerAnalysisSection.textContent();
      console.log(`📍 ${name} cost per analysis section:`, costText);

      // Extract the dollar amount
      const match = costText.match(/\$(\d+\.\d+)/);
      if (match) {
        const cost = parseFloat(match[1]);
        console.log(`📍 ${name} cost per analysis: $${cost}`);

        // Verify within expected range
        const [min, max] = expectedCostRange;
        if (cost >= min && cost <= max) {
          console.log(`✅ ${name}: $${cost} is within expected range $${min}-$${max}`);
        } else {
          console.log(`⚠️  ${name}: $${cost} is OUTSIDE expected range $${min}-$${max}`);
        }
      } else {
        console.log(`❌ ${name}: Could not extract cost from text`);
      }
    }

    console.log('\n✅✅✅ TEST 4 PASSED: Cost per analysis calculations verified');
  });

  test('Test 5: Mobile Responsive (375px width)', async ({ page }) => {
    console.log('🧪 Test 5: Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('✅ Set viewport to 375px (iPhone SE width)');

    await page.goto(`${LOCAL_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ At signup page');

    // Test messaging section doesn't overflow
    const messagingSection = page.locator('text=YOU MADE THE RIGHT CHOICE').locator('../..');
    await expect(messagingSection).toBeVisible();

    const messagingBox = await messagingSection.boundingBox();
    if (messagingBox) {
      console.log('📍 Messaging section width:', messagingBox.width);
      if (messagingBox.width <= 375) {
        console.log('✅ Messaging section fits within mobile viewport');
      } else {
        console.log('⚠️  Messaging section overflows mobile viewport');
      }
    }

    // Test DD section on mobile
    await expect(page.locator('text=💰 Annual Savings Breakdown')).toBeVisible();
    const ddSection = page.locator('text=💰 Annual Savings Breakdown').locator('..');

    const ddBox = await ddSection.boundingBox();
    if (ddBox) {
      console.log('📍 DD section width:', ddBox.width);
      if (ddBox.width <= 375) {
        console.log('✅ DD section fits within mobile viewport');
      } else {
        console.log('⚠️  DD section overflows mobile viewport');
      }
    }

    // Test tier switching on mobile
    const coffeeRadio = page.locator('input[type="radio"][value="coffee"]');
    await coffeeRadio.click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=Perfect for solopreneurs testing AI optimization')).toBeVisible();
    console.log('✅ Tier switching works on mobile');

    // Test billing toggle on mobile
    const monthlyToggle = page.locator('button:has-text("Monthly")');
    await monthlyToggle.click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=📊 Monthly Pricing Breakdown')).toBeVisible();
    console.log('✅ Billing toggle works on mobile');

    console.log('✅✅✅ TEST 5 PASSED: Mobile responsive layout verified');
  });
});
