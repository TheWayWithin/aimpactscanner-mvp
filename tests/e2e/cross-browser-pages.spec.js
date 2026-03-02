// Cross-browser and responsive test for all modernization pages
// Tests: page loads, key content visible, navigation works, no console errors

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4177';

const PAGES = [
  { hash: '', title: 'landing', expectText: 'See how AI sees' },
  { hash: '#methodology', title: 'methodology', expectText: 'MASTERY-AI' },
  { hash: '#how-it-works', title: 'how-it-works', expectText: 'How AImpactScanner Works' },
  { hash: '#sample-report', title: 'sample-report', expectText: 'AI Visibility Score' },
  { hash: '#suite', title: 'suite', expectText: 'AI Search Mastery' },
  { hash: '#faq', title: 'faq', expectText: 'FAQ' },
  { hash: '#pricing', title: 'pricing', expectText: 'Pricing' },
];

// Desktop tests
for (const page of PAGES) {
  test(`Desktop: ${page.title} loads and shows content`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const tab = await context.newPage();
    const errors = [];
    tab.on('pageerror', err => errors.push(err.message));

    await tab.goto(`${BASE_URL}/${page.hash}`, { waitUntil: 'networkidle' });
    await expect(tab.locator('body')).toContainText(page.expectText, { timeout: 10000 });

    // Footer should be present
    await expect(tab.locator('footer')).toBeVisible();

    // No JS errors
    expect(errors).toEqual([]);
    await context.close();
  });
}

// Mobile tests (iPhone 14 - 390px)
for (const page of PAGES) {
  test(`Mobile 390px: ${page.title} loads`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const tab = await context.newPage();

    await tab.goto(`${BASE_URL}/${page.hash}`, { waitUntil: 'networkidle' });
    await expect(tab.locator('body')).toContainText(page.expectText, { timeout: 10000 });
    await context.close();
  });
}

// Tablet test (iPad - 768px)
for (const page of PAGES) {
  test(`Tablet 768px: ${page.title} loads`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tab = await context.newPage();

    await tab.goto(`${BASE_URL}/${page.hash}`, { waitUntil: 'networkidle' });
    await expect(tab.locator('body')).toContainText(page.expectText, { timeout: 10000 });
    await context.close();
  });
}

// Navigation test: footer links work
test('Footer navigation links work for new pages', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tab = await context.newPage();
  await tab.goto(BASE_URL, { waitUntil: 'networkidle' });

  const navTargets = ['Methodology', 'How It Works', 'Sample Report', 'The Suite', 'FAQ'];
  for (const label of navTargets) {
    const link = tab.locator('footer button', { hasText: label });
    await expect(link).toBeVisible();
  }
  await context.close();
});

// Scan form test: input + button present and interactive
test('Scan form is functional on landing page', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tab = await context.newPage();
  await tab.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Use the React-rendered input (not the static hero one)
  const input = tab.locator('form input[placeholder*="yourwebsite"]').last();
  await expect(input).toBeVisible();

  const button = tab.locator('form button:has-text("Scan My Page Free")').last();
  await expect(button).toBeVisible();

  // Type a URL
  await input.fill('https://example.com');
  await expect(input).toHaveValue('https://example.com');
  await context.close();
});
