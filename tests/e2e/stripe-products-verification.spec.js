/**
 * Stripe Product Verification Test
 *
 * Verifies all 6 products (Solo, Growth, Scale x monthly/annual) exist in Stripe
 * with correct pricing, metadata, and trial configuration.
 *
 * Tests both TEST MODE and LIVE MODE products.
 */

import { test, expect } from '@playwright/test';

// Test Mode Product IDs
const TEST_PRODUCTS = {
  solo: 'prod_TIrWJJRhCf5L9M',
  growth: 'prod_TIrWgOUJy5D7OM',
  scale: 'prod_TIrW8Xjeee7S3o'
};

const TEST_PRICES = {
  solo_monthly: 'price_1SMFnZIiC84gpR8HBsYj7vsE',
  solo_annual: 'price_1SMFnZIiC84gpR8HD7oRJxlN',
  growth_monthly: 'price_1SMFnaIiC84gpR8HzHaQmjYc',
  growth_annual: 'price_1SMFnbIiC84gpR8HB3CeS1ud',
  scale_monthly: 'price_1SMFncIiC84gpR8HbCRQwnCW',
  scale_annual: 'price_1SMFncIiC84gpR8HaHS0RCGe'
};

// Live Mode Product IDs
const LIVE_PRODUCTS = {
  solo: 'prod_TIsJs3mBI4Ubik',
  growth: 'prod_TIsJsb4yxg0SAV',
  scale: 'prod_TIsJguLGJqqDWi'
};

const LIVE_PRICES = {
  solo_monthly: 'price_1SMGZ2IiC84gpR8H0dShUU0z',
  solo_annual: 'price_1SMGZ2IiC84gpR8HQtENjbRm',
  growth_monthly: 'price_1SMGZ3IiC84gpR8HQvEjhBv5',
  growth_annual: 'price_1SMGZ3IiC84gpR8Hk0aMTjB2',
  scale_monthly: 'price_1SMGZ4IiC84gpR8H30pVuKqm',
  scale_annual: 'price_1SMGZ5IiC84gpR8HTP46tTjj'
};

const STRIPE_TEST_KEY = 'REMOVED_STRIPE_TEST';
const STRIPE_LIVE_KEY = 'REMOVED_STRIPE_LIVE';

/**
 * Helper: Fetch product from Stripe API
 */
async function fetchStripeProduct(productId, apiKey) {
  const response = await fetch(`https://api.stripe.com/v1/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product ${productId}: ${response.status}`);
  }

  return await response.json();
}

/**
 * Helper: Fetch price from Stripe API
 */
async function fetchStripePrice(priceId, apiKey) {
  const response = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price ${priceId}: ${response.status}`);
  }

  return await response.json();
}

test.describe('Stripe Product Verification - TEST MODE', () => {

  test('Solo product exists with correct name and description', async () => {
    const product = await fetchStripeProduct(TEST_PRODUCTS.solo, STRIPE_TEST_KEY);

    expect(product.id).toBe(TEST_PRODUCTS.solo);
    expect(product.name).toBe('AImpactScanner - Solo');
    expect(product.description).toBe('Solo tier - 10 analyses per month with 30-day history');
    expect(product.active).toBe(true);
  });

  test('Solo Monthly price is $5.95/month with correct metadata', async () => {
    const price = await fetchStripePrice(TEST_PRICES.solo_monthly, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.solo_monthly);
    expect(price.unit_amount).toBe(595); // $5.95
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('coffee');
    expect(price.active).toBe(true);
  });

  test('Solo Annual price is $49.50/year with correct metadata', async () => {
    const price = await fetchStripePrice(TEST_PRICES.solo_annual, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.solo_annual);
    expect(price.unit_amount).toBe(4950); // $49.50
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('year');
    expect(price.metadata.tier).toBe('coffee');
    expect(price.metadata.billing).toBe('annual');
    expect(price.active).toBe(true);
  });

  test('Growth product exists with correct name and description', async () => {
    const product = await fetchStripeProduct(TEST_PRODUCTS.growth, STRIPE_TEST_KEY);

    expect(product.id).toBe(TEST_PRODUCTS.growth);
    expect(product.name).toBe('AImpactScanner - Growth');
    expect(product.description).toBe('Growth tier - 40 analyses per month with 90-day history, CSV export, LLMS.txt');
    expect(product.active).toBe(true);
  });

  test('Growth Monthly price is $17.95/month with correct metadata', async () => {
    const price = await fetchStripePrice(TEST_PRICES.growth_monthly, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.growth_monthly);
    expect(price.unit_amount).toBe(1795); // $17.95
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('growth');
    expect(price.active).toBe(true);
  });

  test('Growth Annual price is $149.50/year with 7-day trial', async () => {
    const price = await fetchStripePrice(TEST_PRICES.growth_annual, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.growth_annual);
    expect(price.unit_amount).toBe(14950); // $149.50
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('year');
    expect(price.recurring.trial_period_days).toBe(7); // 7-day trial
    expect(price.metadata.tier).toBe('growth');
    expect(price.metadata.billing).toBe('annual');
    expect(price.active).toBe(true);
  });

  test('Scale product exists with correct name and description', async () => {
    const product = await fetchStripeProduct(TEST_PRODUCTS.scale, STRIPE_TEST_KEY);

    expect(product.id).toBe(TEST_PRODUCTS.scale);
    expect(product.name).toBe('AImpactScanner - Scale');
    expect(product.description).toBe('Scale tier - 100 analyses per month with unlimited history, API access, 3 seats');
    expect(product.active).toBe(true);
  });

  test('Scale Monthly price is $34.95/month with correct metadata', async () => {
    const price = await fetchStripePrice(TEST_PRICES.scale_monthly, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.scale_monthly);
    expect(price.unit_amount).toBe(3495); // $34.95
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('scale');
    expect(price.active).toBe(true);
  });

  test('Scale Annual price is $299.50/year with correct metadata', async () => {
    const price = await fetchStripePrice(TEST_PRICES.scale_annual, STRIPE_TEST_KEY);

    expect(price.id).toBe(TEST_PRICES.scale_annual);
    expect(price.unit_amount).toBe(29950); // $299.50
    expect(price.currency).toBe('usd');
    expect(price.recurring.interval).toBe('year');
    expect(price.metadata.tier).toBe('scale');
    expect(price.metadata.billing).toBe('annual');
    expect(price.active).toBe(true);
  });
});

test.describe('Stripe Product Verification - LIVE MODE', () => {

  test('Solo product exists in LIVE mode', async () => {
    const product = await fetchStripeProduct(LIVE_PRODUCTS.solo, STRIPE_LIVE_KEY);

    expect(product.id).toBe(LIVE_PRODUCTS.solo);
    expect(product.name).toBe('AImpactScanner - Solo');
    expect(product.active).toBe(true);
  });

  test('Solo Monthly LIVE price is $5.95/month', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.solo_monthly, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.solo_monthly);
    expect(price.unit_amount).toBe(595);
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('coffee');
  });

  test('Solo Annual LIVE price is $49.50/year', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.solo_annual, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.solo_annual);
    expect(price.unit_amount).toBe(4950);
    expect(price.recurring.interval).toBe('year');
    expect(price.metadata.tier).toBe('coffee');
    expect(price.metadata.billing).toBe('annual');
  });

  test('Growth product exists in LIVE mode', async () => {
    const product = await fetchStripeProduct(LIVE_PRODUCTS.growth, STRIPE_LIVE_KEY);

    expect(product.id).toBe(LIVE_PRODUCTS.growth);
    expect(product.name).toBe('AImpactScanner - Growth');
    expect(product.active).toBe(true);
  });

  test('Growth Monthly LIVE price is $17.95/month', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.growth_monthly, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.growth_monthly);
    expect(price.unit_amount).toBe(1795);
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('growth');
  });

  test('Growth Annual LIVE price is $149.50/year with 7-day trial', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.growth_annual, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.growth_annual);
    expect(price.unit_amount).toBe(14950);
    expect(price.recurring.interval).toBe('year');
    expect(price.recurring.trial_period_days).toBe(7); // 7-day trial in LIVE mode
    expect(price.metadata.tier).toBe('growth');
    expect(price.metadata.billing).toBe('annual');
  });

  test('Scale product exists in LIVE mode', async () => {
    const product = await fetchStripeProduct(LIVE_PRODUCTS.scale, STRIPE_LIVE_KEY);

    expect(product.id).toBe(LIVE_PRODUCTS.scale);
    expect(product.name).toBe('AImpactScanner - Scale');
    expect(product.active).toBe(true);
  });

  test('Scale Monthly LIVE price is $34.95/month', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.scale_monthly, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.scale_monthly);
    expect(price.unit_amount).toBe(3495);
    expect(price.recurring.interval).toBe('month');
    expect(price.metadata.tier).toBe('scale');
  });

  test('Scale Annual LIVE price is $299.50/year', async () => {
    const price = await fetchStripePrice(LIVE_PRICES.scale_annual, STRIPE_LIVE_KEY);

    expect(price.id).toBe(LIVE_PRICES.scale_annual);
    expect(price.unit_amount).toBe(29950);
    expect(price.recurring.interval).toBe('year');
    expect(price.metadata.tier).toBe('scale');
    expect(price.metadata.billing).toBe('annual');
  });
});

test.describe('Pricing Verification - Annual Savings Calculations', () => {

  test('Solo Annual saves 31% vs monthly ($21.90/year)', async () => {
    const monthly = await fetchStripePrice(TEST_PRICES.solo_monthly, STRIPE_TEST_KEY);
    const annual = await fetchStripePrice(TEST_PRICES.solo_annual, STRIPE_TEST_KEY);

    const monthlyYearly = monthly.unit_amount * 12; // $5.95 x 12 = $71.40
    const annualPrice = annual.unit_amount; // $49.50
    const savings = monthlyYearly - annualPrice; // $21.90
    const savingsPercent = Math.round((savings / monthlyYearly) * 100); // 31%

    expect(monthlyYearly).toBe(7140);
    expect(annualPrice).toBe(4950);
    expect(savings).toBe(2190); // $21.90 savings
    expect(savingsPercent).toBe(31); // 31% discount
  });

  test('Growth Annual saves 31% vs monthly ($65.90/year)', async () => {
    const monthly = await fetchStripePrice(TEST_PRICES.growth_monthly, STRIPE_TEST_KEY);
    const annual = await fetchStripePrice(TEST_PRICES.growth_annual, STRIPE_TEST_KEY);

    const monthlyYearly = monthly.unit_amount * 12; // $17.95 x 12 = $215.40
    const annualPrice = annual.unit_amount; // $149.50
    const savings = monthlyYearly - annualPrice; // $65.90
    const savingsPercent = Math.round((savings / monthlyYearly) * 100); // 31%

    expect(monthlyYearly).toBe(21540);
    expect(annualPrice).toBe(14950);
    expect(savings).toBe(6590); // $65.90 savings
    expect(savingsPercent).toBe(31); // 31% discount
  });

  test('Scale Annual saves 29% vs monthly ($119.90/year)', async () => {
    const monthly = await fetchStripePrice(TEST_PRICES.scale_monthly, STRIPE_TEST_KEY);
    const annual = await fetchStripePrice(TEST_PRICES.scale_annual, STRIPE_TEST_KEY);

    const monthlyYearly = monthly.unit_amount * 12; // $34.95 x 12 = $419.40
    const annualPrice = annual.unit_amount; // $299.50
    const savings = monthlyYearly - annualPrice; // $119.90
    const savingsPercent = Math.round((savings / monthlyYearly) * 100); // 29%

    expect(monthlyYearly).toBe(41940);
    expect(annualPrice).toBe(29950);
    expect(savings).toBe(11990); // $119.90 savings
    expect(savingsPercent).toBe(29); // 29% discount
  });
});
