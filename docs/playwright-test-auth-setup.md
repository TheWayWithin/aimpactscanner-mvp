# Playwright Test Authentication Setup Guide

## Overview

This guide provides best practices for setting up authentication in Playwright tests for an OAuth-first application with Supabase backend.

## Current Authentication Architecture

**Primary Methods**:
- Google OAuth
- GitHub OAuth
- Magic Link (passwordless email)

**OAuth Callback**: `/#/oauth-callback`
**Auth Components**: `AuthMethodSelector.jsx`, `OAuthCallback.jsx`

## Challenge: Testing OAuth Flows

OAuth providers (Google, GitHub) require:
- Real user interaction
- Browser redirects to external domains
- CAPTCHA challenges
- 2FA verification
- Cannot be fully automated in CI/CD

## Recommended Test Authentication Strategies

### ✅ Strategy 1: Pre-Authenticated State Storage (RECOMMENDED)

**Best for**: E2E tests, CI/CD pipelines, consistent test runs

**How It Works**:
1. Authenticate once manually or in setup
2. Save authentication state to file
3. Reuse saved state in all tests
4. No repeated OAuth flows needed

**Implementation**:

```javascript
// tests/setup/auth.setup.js
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Option A: Use magic link for test user
  await page.goto('http://localhost:5173/#/signup');
  await page.fill('input[type="email"]', 'test@aimpactscanner.com');
  await page.click('button:has-text("Send Magic Link")');

  // Wait for email (use test email service like Mailosaur or manual step)
  // Then extract magic link and visit it
  await page.goto('MAGIC_LINK_URL_FROM_EMAIL');

  // Wait for authentication to complete
  await page.waitForURL('**/analyze');

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});

// tests/e2e/authenticated.spec.js
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('authenticated user can analyze pages', async ({ page }) => {
  await page.goto('http://localhost:5173/#/analyze');
  // User is already authenticated!
  // Test your authenticated flows...
});
```

**Advantages**:
- ✅ No OAuth provider interaction needed
- ✅ Fast test execution
- ✅ Works in CI/CD
- ✅ Consistent results
- ✅ Reusable across tests

**Disadvantages**:
- ❌ Doesn't test actual OAuth flow
- ❌ Requires initial manual authentication (if using real OAuth)

---

### ✅ Strategy 2: Direct Database User Creation (FASTEST)

**Best for**: Unit tests, integration tests, rapid development

**How It Works**:
1. Create test user directly in database
2. Generate session token programmatically
3. Inject session into Playwright browser
4. Skip OAuth entirely

**Implementation**:

```javascript
// tests/helpers/create-test-user.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createTestUser(email, tier = 'free') {
  // Create user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: 'TestPassword123!',
  });

  if (authError) throw authError;

  // Add to users table
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      tier,
      subscription_tier: tier,
      subscription_status: 'active',
      monthly_analyses_used: 0,
      monthly_analyses_limit: tier === 'free' ? 3 : null,
    });

  if (userError) throw userError;

  return authData.user;
}

export async function getTestUserSession(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

// tests/setup/db-auth.setup.js
import { test as setup } from '@playwright/test';
import { createTestUser, getTestUserSession } from './helpers/create-test-user';

setup('setup test user', async ({ page }) => {
  const testEmail = 'test@aimpactscanner.com';

  // Create test user (if doesn't exist)
  try {
    await createTestUser(testEmail, 'coffee');
  } catch (err) {
    console.log('User already exists, continuing...');
  }

  // Get session tokens
  const { accessToken, refreshToken } = await getTestUserSession(
    testEmail,
    'TestPassword123!'
  );

  // Inject session into browser
  await page.goto('http://localhost:5173');
  await page.evaluate(({ access_token, refresh_token }) => {
    const session = {
      access_token,
      refresh_token,
      expires_at: Date.now() + 3600 * 1000, // 1 hour
      user: { email: 'test@aimpactscanner.com' },
    };

    localStorage.setItem(
      'sb-pdmtvkcxnqysujnpcnyh-auth-token',
      JSON.stringify(session)
    );
  }, { access_token: accessToken, refresh_token: refreshToken });

  // Save state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

**Advantages**:
- ✅ Fastest setup
- ✅ No external dependencies
- ✅ Full control over user state
- ✅ Works offline
- ✅ Perfect for CI/CD

**Disadvantages**:
- ❌ Doesn't test OAuth flow
- ❌ Requires service role key

---

### ✅ Strategy 3: Mock Email Service (BEST FOR MAGIC LINK)

**Best for**: Testing magic link flow end-to-end

**How It Works**:
1. Use test email service (Mailosaur, MailTrap, etc.)
2. Send magic link to test email
3. Playwright fetches email via API
4. Extract magic link and navigate to it

**Implementation**:

```javascript
// tests/helpers/email-helper.js
import fetch from 'node-fetch';

const MAILOSAUR_API_KEY = process.env.MAILOSAUR_API_KEY;
const MAILOSAUR_SERVER_ID = process.env.MAILOSAUR_SERVER_ID;

export async function getLatestEmail(emailAddress) {
  const response = await fetch(
    `https://mailosaur.com/api/messages?server=${MAILOSAUR_SERVER_ID}`,
    {
      headers: { Authorization: `Basic ${Buffer.from(MAILOSAUR_API_KEY + ':').toString('base64')}` }
    }
  );

  const data = await response.json();
  return data.items.find(email => email.to[0].email === emailAddress);
}

export function extractMagicLink(emailHtml) {
  const linkMatch = emailHtml.match(/href="([^"]*oauth-callback[^"]*)"/);
  return linkMatch ? linkMatch[1] : null;
}

// tests/e2e/magic-link.spec.js
import { test, expect } from '@playwright/test';
import { getLatestEmail, extractMagicLink } from './helpers/email-helper';

test('magic link authentication', async ({ page }) => {
  const testEmail = `test-${Date.now()}@${process.env.MAILOSAUR_SERVER_ID}.mailosaur.net`;

  // Request magic link
  await page.goto('http://localhost:5173/#/signup');
  await page.fill('input[type="email"]', testEmail);
  await page.click('button:has-text("Send Magic Link")');

  // Wait for success message
  await expect(page.locator('text=Check your email')).toBeVisible();

  // Fetch email
  await page.waitForTimeout(2000); // Give email time to arrive
  const email = await getLatestEmail(testEmail);
  const magicLink = extractMagicLink(email.html.body);

  // Click magic link
  await page.goto(magicLink);

  // Verify authentication success
  await expect(page).toHaveURL(/.*analyze/);
});
```

**Advantages**:
- ✅ Tests real magic link flow
- ✅ End-to-end validation
- ✅ Catches email delivery issues
- ✅ Works in CI/CD

**Disadvantages**:
- ❌ Requires paid email testing service
- ❌ Slower than other methods
- ❌ Depends on external service

---

### ❌ Strategy 4: OAuth Provider Testing (NOT RECOMMENDED)

**Why Not**:
- Google/GitHub don't provide test accounts
- CAPTCHA blocks automation
- 2FA prevents automated login
- Flaky and unreliable
- Violates OAuth provider ToS

**Alternative**: Test OAuth flow manually, automate everything else

---

## Recommended Setup for This Project

### Phase 1: Development Testing (Use Strategy 2)

**Setup File**: `tests/setup/auth.setup.js`

```javascript
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

setup('authenticate test user', async ({ page }) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create test user
  const testEmail = 'playwright-test@aimpactscanner.com';
  const testPassword = 'PlaywrightTest123!';

  const { data: authData } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (authData?.user) {
    await supabase.from('users').insert({
      id: authData.user.id,
      email: testEmail,
      tier: 'coffee',
      subscription_tier: 'coffee',
      subscription_status: 'active',
      monthly_analyses_used: 0,
      monthly_analyses_limit: null,
    });
  }

  // Sign in and save state
  await page.goto('http://localhost:5173');

  // Use magic link or password to authenticate
  // Since we have password, we can use a hidden login endpoint
  // OR inject session directly

  const { data: session } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (session) {
    await page.evaluate((sessionData) => {
      localStorage.setItem(
        'sb-pdmtvkcxnqysujnpcnyh-auth-token',
        JSON.stringify(sessionData)
      );
    }, session);
  }

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Phase 2: CI/CD Configuration

**Playwright Config**: `playwright.config.js`

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test User Credentials

### Dedicated Test Users (Create These)

```javascript
// Free tier test user
{
  email: 'playwright-free@aimpactscanner.com',
  password: 'PlaywrightFree123!',
  tier: 'free',
  analyses_limit: 3
}

// Coffee tier test user
{
  email: 'playwright-coffee@aimpactscanner.com',
  password: 'PlaywrightCoffee123!',
  tier: 'coffee',
  analyses_limit: null // unlimited
}
```

### Script to Create Test Users

```bash
# Create file: scripts/create-playwright-users.js
node scripts/create-playwright-users.js
```

---

## Security Best Practices

### ✅ DO
- Use dedicated test users, not production accounts
- Store service keys in environment variables
- Use `.gitignore` for auth state files
- Rotate test user credentials regularly
- Use separate database for testing (if possible)

### ❌ DON'T
- Don't use real user accounts in tests
- Don't commit auth state files
- Don't share test credentials publicly
- Don't test OAuth flows in CI (too flaky)

---

## File Structure

```
tests/
├── setup/
│   ├── auth.setup.js          # Authentication setup
│   └── create-test-user.js    # Helper to create users
├── e2e/
│   ├── authenticated.spec.js  # Tests requiring auth
│   └── unauthenticated.spec.js # Tests without auth
├── helpers/
│   └── email-helper.js        # Email testing utilities
└── playwright/.auth/
    └── user.json              # Saved auth state (gitignored)
```

---

## Summary

### ✅ Recommended Approach for This Project

1. **Use Strategy 2** (Direct Database User Creation) for development
2. **Create dedicated test users** via script
3. **Save authentication state** for reuse
4. **Use Playwright projects** with dependencies
5. **Keep tests isolated** from production data

### 📋 Implementation Checklist

- [ ] Create `scripts/create-playwright-users.js`
- [ ] Add `tests/setup/auth.setup.js`
- [ ] Configure `playwright.config.js` with setup project
- [ ] Add `playwright/.auth/` to `.gitignore`
- [ ] Create test users in database
- [ ] Save authenticated state
- [ ] Update test files to use `storageState`

### 🔗 Related Files

- Authentication: `/src/components/AuthMethodSelector.jsx`
- OAuth Callback: `/src/components/OAuthCallback.jsx`
- Supabase Client: `/src/lib/supabaseClient.js`

---

**Status**: Ready for implementation ✓
