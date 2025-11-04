#!/usr/bin/env node
/**
 * Stripe Product Verification Script
 *
 * Verifies all 6 products exist in both TEST and LIVE mode with correct configuration
 */

const https = require('https');

const STRIPE_TEST_KEY = 'REMOVED_STRIPE_TEST';
const STRIPE_LIVE_KEY = 'REMOVED_STRIPE_LIVE';

// Test Mode Price IDs
const TEST_PRICES = {
  solo_monthly: 'price_1SMFnZIiC84gpR8HBsYj7vsE',
  solo_annual: 'price_1SMFnZIiC84gpR8HD7oRJxlN',
  growth_monthly: 'price_1SMFnaIiC84gpR8HzHaQmjYc',
  growth_annual: 'price_1SMFnbIiC84gpR8HB3CeS1ud',
  scale_monthly: 'price_1SMFncIiC84gpR8HbCRQwnCW',
  scale_annual: 'price_1SMFncIiC84gpR8HaHS0RCGe'
};

// Live Mode Price IDs
const LIVE_PRICES = {
  solo_monthly: 'price_1SMGZ2IiC84gpR8H0dShUU0z',
  solo_annual: 'price_1SMGZ2IiC84gpR8HQtENjbRm',
  growth_monthly: 'price_1SMGZ3IiC84gpR8HQvEjhBv5',
  growth_annual: 'price_1SMGZ3IiC84gpR8Hk0aMTjB2',
  scale_monthly: 'price_1SMGZ4IiC84gpR8H30pVuKqm',
  scale_annual: 'price_1SMGZ5IiC84gpR8HTP46tTjj'
};

// Expected pricing configuration
const EXPECTED = {
  solo_monthly: { amount: 595, interval: 'month', tier: 'coffee' },
  solo_annual: { amount: 4950, interval: 'year', tier: 'coffee', billing: 'annual' },
  growth_monthly: { amount: 1795, interval: 'month', tier: 'growth' },
  growth_annual: { amount: 14950, interval: 'year', tier: 'growth', billing: 'annual', trial: 7 },
  scale_monthly: { amount: 3495, interval: 'month', tier: 'scale' },
  scale_annual: { amount: 29950, interval: 'year', tier: 'scale', billing: 'annual' }
};

function stripeRequest(path, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: `/v1${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`Stripe API error: ${json.error?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyPrice(priceId, expected, apiKey, mode) {
  const price = await stripeRequest(`/prices/${priceId}`, apiKey);

  const errors = [];

  if (price.unit_amount !== expected.amount) {
    errors.push(`  ❌ Amount: expected ${expected.amount}, got ${price.unit_amount}`);
  }

  if (price.recurring.interval !== expected.interval) {
    errors.push(`  ❌ Interval: expected ${expected.interval}, got ${price.recurring.interval}`);
  }

  if (price.metadata.tier !== expected.tier) {
    errors.push(`  ❌ Tier metadata: expected ${expected.tier}, got ${price.metadata.tier}`);
  }

  if (expected.billing && price.metadata.billing !== expected.billing) {
    errors.push(`  ❌ Billing metadata: expected ${expected.billing}, got ${price.metadata.billing}`);
  }

  if (expected.trial && price.recurring.trial_period_days !== expected.trial) {
    errors.push(`  ❌ Trial: expected ${expected.trial} days, got ${price.recurring.trial_period_days}`);
  }

  if (errors.length > 0) {
    console.log(`❌ ${mode} ${priceId}:`);
    errors.forEach(err => console.log(err));
    return false;
  } else {
    console.log(`✅ ${mode} ${priceId}: $${(expected.amount / 100).toFixed(2)}/${expected.interval}${expected.trial ? ` (${expected.trial}d trial)` : ''}`);
    return true;
  }
}

async function main() {
  console.log('🔍 Verifying Stripe Products Configuration\n');
  console.log('═══════════════════════════════════════════════════════\n');

  let testPass = 0;
  let testFail = 0;
  let livePass = 0;
  let liveFail = 0;

  try {
    // Verify Test Mode
    console.log('📋 TEST MODE Verification:\n');

    for (const [key, priceId] of Object.entries(TEST_PRICES)) {
      try {
        const result = await verifyPrice(priceId, EXPECTED[key], STRIPE_TEST_KEY, 'TEST');
        if (result) testPass++;
        else testFail++;
      } catch (error) {
        console.log(`❌ TEST ${priceId}: ${error.message}`);
        testFail++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Verify Live Mode
    console.log('📋 LIVE MODE Verification:\n');

    for (const [key, priceId] of Object.entries(LIVE_PRICES)) {
      try {
        const result = await verifyPrice(priceId, EXPECTED[key], STRIPE_LIVE_KEY, 'LIVE');
        if (result) livePass++;
        else liveFail++;
      } catch (error) {
        console.log(`❌ LIVE ${priceId}: ${error.message}`);
        liveFail++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 VERIFICATION SUMMARY:\n');
    console.log(`TEST MODE:  ${testPass} passed, ${testFail} failed (${testPass}/6)`);
    console.log(`LIVE MODE:  ${livePass} passed, ${liveFail} failed (${livePass}/6)`);
    console.log(`TOTAL:      ${testPass + livePass} passed, ${testFail + liveFail} failed (${testPass + livePass}/12)\n`);

    if (testFail === 0 && liveFail === 0) {
      console.log('✅ ✅ ✅ ALL PRODUCTS VERIFIED SUCCESSFULLY ✅ ✅ ✅\n');
      console.log('Phase 3: Stripe Product Setup is COMPLETE ✅\n');
      process.exit(0);
    } else {
      console.log('❌ Some products have configuration errors\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();
