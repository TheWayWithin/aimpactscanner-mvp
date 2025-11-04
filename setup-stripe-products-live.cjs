#!/usr/bin/env node
/**
 * Stripe Product Setup Script - LIVE MODE
 *
 * Creates 6 products (Solo, Growth, Scale x monthly/annual) in Stripe LIVE MODE
 * with correct pricing, metadata, and trial configuration.
 *
 * ⚠️  WARNING: This creates REAL products for PRODUCTION use
 *
 * Usage: node setup-stripe-products-live.cjs
 */

const https = require('https');

// LIVE mode API key
const STRIPE_API_KEY = 'REMOVED_STRIPE_LIVE';

// Product configurations (identical to test mode)
const PRODUCTS = {
  solo: {
    name: 'AImpactScanner - Solo',
    description: 'Solo tier - 10 analyses per month with 30-day history',
    prices: {
      monthly: { amount: 595, interval: 'month', metadata: { tier: 'coffee' } },
      annual: { amount: 4950, interval: 'year', metadata: { tier: 'coffee', billing: 'annual' } }
    }
  },
  growth: {
    name: 'AImpactScanner - Growth',
    description: 'Growth tier - 40 analyses per month with 90-day history, CSV export, LLMS.txt',
    prices: {
      monthly: { amount: 1795, interval: 'month', metadata: { tier: 'growth' } },
      annual: { amount: 14950, interval: 'year', metadata: { tier: 'growth', billing: 'annual' }, trial_days: 7 }
    }
  },
  scale: {
    name: 'AImpactScanner - Scale',
    description: 'Scale tier - 100 analyses per month with unlimited history, API access, 3 seats',
    prices: {
      monthly: { amount: 3495, interval: 'month', metadata: { tier: 'scale' } },
      annual: { amount: 29950, interval: 'year', metadata: { tier: 'scale', billing: 'annual' } }
    }
  }
};

// Helper function to make Stripe API calls
function stripeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? new URLSearchParams(data).toString() : '';

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${STRIPE_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
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
    if (postData) req.write(postData);
    req.end();
  });
}

// Helper to format metadata for Stripe API
function flattenMetadata(metadata, prefix = 'metadata') {
  const result = {};
  for (const [key, value] of Object.entries(metadata)) {
    result[`${prefix}[${key}]`] = value;
  }
  return result;
}

async function createProduct(name, description) {
  console.log(`\n📦 Creating product: ${name}...`);
  const product = await stripeRequest('POST', '/products', {
    name,
    description
  });
  console.log(`✅ Product created: ${product.id}`);
  return product;
}

async function createPrice(productId, config, priceName) {
  console.log(`  💰 Creating price: ${priceName}...`);

  const priceData = {
    product: productId,
    unit_amount: config.amount,
    currency: 'usd',
    'recurring[interval]': config.interval,
    ...flattenMetadata(config.metadata)
  };

  // Add trial period for Growth Annual
  if (config.trial_days) {
    priceData['recurring[trial_period_days]'] = config.trial_days.toString();
  }

  const price = await stripeRequest('POST', '/prices', priceData);
  console.log(`  ✅ Price created: ${price.id} ($${(config.amount / 100).toFixed(2)}/${config.interval}${config.trial_days ? ' with 7-day trial' : ''})`);
  return price;
}

async function main() {
  console.log('⚠️  ⚠️  ⚠️  LIVE MODE - CREATING PRODUCTION PRODUCTS ⚠️  ⚠️  ⚠️\n');
  console.log('This will create 3 products with 6 prices total in LIVE MODE:\n');

  const results = {
    products: {},
    prices: {}
  };

  try {
    // Create each product with its prices
    for (const [key, config] of Object.entries(PRODUCTS)) {
      const product = await createProduct(config.name, config.description);
      results.products[key] = product.id;

      // Create monthly price
      const monthlyPrice = await createPrice(product.id, config.prices.monthly, 'Monthly');
      results.prices[`${key}_monthly`] = monthlyPrice.id;

      // Create annual price
      const annualPrice = await createPrice(product.id, config.prices.annual, 'Annual');
      results.prices[`${key}_annual`] = annualPrice.id;

      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log('\n\n✅ ✅ ✅ ALL LIVE MODE PRODUCTS CREATED SUCCESSFULLY ✅ ✅ ✅\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 LIVE MODE PRICE IDs (for STRIPE-PRICE-IDS-LIVE.md):\n');
    console.log(`Solo Monthly:   ${results.prices.solo_monthly}`);
    console.log(`Solo Annual:    ${results.prices.solo_annual}`);
    console.log(`Growth Monthly: ${results.prices.growth_monthly}`);
    console.log(`Growth Annual:  ${results.prices.growth_annual} (7-day trial)`);
    console.log(`Scale Monthly:  ${results.prices.scale_monthly}`);
    console.log(`Scale Annual:   ${results.prices.scale_annual}`);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Write results to JSON file for automation
    const fs = require('fs');
    fs.writeFileSync('stripe-setup-results-live.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to: stripe-setup-results-live.json\n');

    console.log('📝 Next steps:');
    console.log('1. Price IDs will be automatically updated in STRIPE-PRICE-IDS-LIVE.md');
    console.log('2. Verify products in Stripe Dashboard: https://dashboard.stripe.com/products');
    console.log('3. DO NOT use these in staging - only for production deployment');
    console.log('4. Keep these Price IDs safe - they will charge real money!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
