# OAuth Test Account Strategy for Automated Playwright Testing

**Document Version**: 1.0
**Date**: 2025-10-15
**Status**: Strategic Recommendation - Ready for Implementation
**Author**: THE STRATEGIST

---

## Executive Summary

This document provides a comprehensive strategy for implementing automated OAuth authentication testing with Playwright for AImpactScanner MVP. After extensive research into Google and GitHub OAuth provider policies, security best practices, and Playwright authentication patterns, we recommend a **hybrid approach** using dedicated test accounts with Playwright's `storageState` pattern for optimal security, performance, and maintainability.

**Key Recommendation**: Use 2-3 dedicated test accounts per OAuth provider (4-6 total) with Playwright's `storageState` authentication pattern, secure .env-based credential management, and 90-day rotation schedule.

**Feasibility**: ✅ **APPROVED** - All approaches comply with provider policies and security requirements.

---

## 1. OAuth Provider Policy Analysis

### 1.1 Google OAuth Testing Policy

#### **Test Account Creation: ✅ ALLOWED (with limitations)**

**Official Policy**:
- Google does NOT provide dedicated test user accounts like Facebook
- Google does NOT offer a test user API for automated account creation
- Test users can be added manually via OAuth Consent Screen (up to 100 test users)

**Testing Status Behavior**:
- Apps in "Testing" status have special test user restrictions:
  - **User Limit**: Up to 100 test users per project
  - **Authorization Expiry**: Test user authorizations expire after **7 days**
  - **Refresh Token Expiry**: Refresh tokens also expire after 7 days for test users
  - **Warning Messages**: Test users see "Google hasn't verified this app" warning

**Scope-Specific Exceptions**:
- **Basic Scopes** (email, profile, openid): Any Google account can authenticate even in "Testing" status
- **Sensitive Scopes** (Calendar, Drive, etc.): Only designated test users can authenticate
- **AImpactScanner Impact**: We only use basic scopes, so test user restrictions are minimal

**Rate Limits**:
- No specific rate limits for authentication attempts documented
- Google blocks automated login attempts and may trigger reCAPTCHA
- Manual authentication required for initial setup

**Best Practices from Google**:
- Use OAuth 2.0 Playground to generate refresh tokens for testing
- Store refresh tokens securely and reuse them to avoid repeated logins
- Consider service accounts for server-to-server testing (not applicable to user authentication)

**Verdict**: ✅ **Test accounts feasible** - Use personal Google accounts designated as test users, authenticate manually once, store session state for automated tests.

---

### 1.2 GitHub OAuth Testing Policy

#### **Test Account Creation: ✅ ALLOWED (no restrictions)**

**Official Policy**:
- GitHub allows creation of personal accounts for testing purposes
- No "test user" designation required
- OAuth Apps can be configured with unlimited callback URLs
- GitHub Apps are preferred over OAuth Apps for automation (but not applicable for user authentication)

**Rate Limits**:
- **OAuth Token Generation**: 2,000 access token requests per hour
- **Token Reuse Limit**: Max 10 tokens per user/application/scope combination
- **Sign-In Rate Limit**: Max 10 sign-ins per user per hour (triggers re-authorization warning)
- **API Requests**: 5,000 requests/hour for personal accounts, 15,000/hour for organization accounts

**Security Features**:
- OAuth Apps use long-lived access tokens (no automatic expiry)
- GitHub Apps use short-lived tokens (more secure, but require more complex flow)
- PKCE flow supported and recommended for security

**Best Practices from GitHub**:
- Always cache OAuth tokens to minimize re-authentication
- Use dedicated test accounts to avoid hitting rate limits with production accounts
- Monitor authorization attempts to avoid triggering security warnings
- Use GitHub Apps instead of OAuth Apps for server-to-server automation (not our use case)

**Verdict**: ✅ **Test accounts highly feasible** - Create dedicated GitHub accounts for testing, authenticate once, store session state for automated tests. Rate limits are generous for testing purposes.

---

### 1.3 Terms of Service Compliance

**Google OAuth ToS**:
- ✅ Automated testing with stored credentials: **ALLOWED**
- ✅ Using refresh tokens for testing: **EXPLICITLY RECOMMENDED**
- ❌ Automated account creation: **NOT ALLOWED**
- ❌ Bypassing security measures: **PROHIBITED**

**GitHub OAuth ToS**:
- ✅ Automated testing with test accounts: **ALLOWED**
- ✅ Creating test accounts: **ALLOWED**
- ✅ Token caching and reuse: **RECOMMENDED**
- ❌ Violating rate limits: **PROHIBITED**

**Compliance Summary**: ✅ All recommended approaches comply with both providers' terms of service.

---

## 2. Test Account Strategy Design

### 2.1 Recommended Account Quantity

**Minimum Viable (Phase 1)**:
- **Google**: 1 dedicated test account
- **GitHub**: 1 dedicated test account
- **Total**: 2 test accounts

**Ideal Production (Phase 2)**:
- **Google**: 2-3 dedicated test accounts (for parallel testing, account rotation)
- **GitHub**: 2-3 dedicated test accounts (for parallel testing, account rotation)
- **Total**: 4-6 test accounts

**Rationale**:
1. **Single Account (Phase 1)**: Sufficient for basic automated testing, quick setup
2. **Multiple Accounts (Phase 2)**: Enable parallel test execution, account rotation during expiry, redundancy if one account is locked

**Recommendation**: Start with **2 accounts (1 per provider)**, expand to **4-6 accounts** as test suite grows.

---

### 2.2 Account Isolation Strategy

**Email Strategy**:
- **Option A (Recommended)**: Dedicated test emails with `+` aliasing
  - Example: `aimpactscanner.test+google1@gmail.com`, `aimpactscanner.test+google2@gmail.com`
  - Pros: Easy to manage, free, all emails go to one inbox
  - Cons: Some services don't support `+` aliasing (Gmail and GitHub do)

- **Option B**: Separate email accounts per provider
  - Example: `aimpactscanner.google.test@gmail.com`, `aimpactscanner.github.test@gmail.com`
  - Pros: Complete isolation, no `+` aliasing issues
  - Cons: More accounts to manage, separate inboxes

- **Option C**: Use temporary email service for initial setup
  - Example: Use `tempmail.lol` (already validated in UAT Phase 2)
  - Pros: No personal email required, disposable
  - Cons: Emails expire, cannot receive password resets after expiry

**Recommendation**: **Option A** - Use `+` aliasing with a dedicated test email account for easy management and maximum flexibility.

**Account Naming Convention**:
```
Google OAuth Test Accounts:
- aimpactscanner.test+google1@gmail.com
- aimpactscanner.test+google2@gmail.com

GitHub OAuth Test Accounts:
- aimpactscanner.test+github1@gmail.com
- aimpactscanner.test+github2@gmail.com
```

---

### 2.3 Credential Rotation Schedule

**Google OAuth Credentials**:
- **Access Tokens**: Expire after 1 hour (automatic refresh via Supabase)
- **Refresh Tokens**: Expire after 7 days for test users in "Testing" status
- **Session State**: Re-authenticate every **7 days** (before token expiry)
- **Password Rotation**: Every **90 days** (industry standard)

**GitHub OAuth Credentials**:
- **Access Tokens**: Long-lived (no automatic expiry)
- **Session State**: Re-authenticate every **30 days** (proactive security)
- **Password Rotation**: Every **90 days** (industry standard)

**Recommended Rotation Schedule**:
1. **Weekly** (Every 7 days): Re-authenticate Google test accounts (required for refresh token expiry)
2. **Monthly** (Every 30 days): Re-authenticate GitHub test accounts (proactive security)
3. **Quarterly** (Every 90 days): Rotate account passwords (security best practice)

**Automation**:
- Use Playwright global setup (`auth.setup.js`) to re-authenticate when `storageState` expires
- Store expiry timestamp in `storageState` metadata
- Automatically trigger re-authentication when expiry detected

---

### 2.4 Risk Mitigation for Account Suspension

**Google Account Suspension Risks**:
- ⚠️ **Risk**: Google blocks automated login attempts (reCAPTCHA)
- ✅ **Mitigation**: Use manual authentication once, store `storageState` for reuse
- ⚠️ **Risk**: Test user authorization expires after 7 days
- ✅ **Mitigation**: Automate re-authentication in CI/CD weekly
- ⚠️ **Risk**: Account locked due to suspicious activity
- ✅ **Mitigation**: Use dedicated test accounts, avoid production accounts

**GitHub Account Suspension Risks**:
- ⚠️ **Risk**: Rate limit exceeded (10 sign-ins/hour)
- ✅ **Mitigation**: Use `storageState` to avoid repeated logins, cache tokens
- ⚠️ **Risk**: Account flagged for suspicious activity
- ✅ **Mitigation**: Use dedicated test accounts, add to test users in OAuth app settings
- ⚠️ **Risk**: Token revoked by user or admin
- ✅ **Mitigation**: Implement error handling to re-authenticate automatically

**General Mitigation Strategies**:
1. **Dedicated Test Accounts**: Never use personal or production accounts for testing
2. **Session State Caching**: Authenticate once, reuse session state across tests (Playwright best practice)
3. **Error Handling**: Detect expired sessions, trigger automatic re-authentication
4. **Monitoring**: Log authentication failures, alert on repeated failures
5. **Backup Accounts**: Maintain 2-3 accounts per provider for redundancy

---

### 2.5 Personal vs. Dedicated Test Accounts

| Criteria | Personal Accounts | Dedicated Test Accounts |
|----------|-------------------|-------------------------|
| **Security** | ❌ High risk if compromised | ✅ Isolated from personal data |
| **Compliance** | ⚠️ May violate ToS | ✅ Explicitly allowed |
| **Maintenance** | ❌ Mixed test/personal activity | ✅ Clean separation |
| **Rotation** | ❌ Cannot rotate without losing personal data | ✅ Easy to rotate credentials |
| **Team Access** | ❌ Cannot share with team | ✅ Shared credentials for CI/CD |
| **Cost** | ✅ Free | ✅ Free (no additional cost) |

**Recommendation**: ✅ **Dedicated Test Accounts** - Create separate accounts exclusively for automated testing to maintain security, compliance, and clean separation from personal/production accounts.

---

## 3. Credential Storage Architecture

### 3.1 Required Environment Variables

**Minimum Required Variables**:
```bash
# Google OAuth Test Account #1
GOOGLE_TEST_EMAIL_1=aimpactscanner.test+google1@gmail.com
GOOGLE_TEST_PASSWORD_1=<secure-password>
GOOGLE_TEST_USER_ID_1=<supabase-user-id>

# GitHub OAuth Test Account #1
GITHUB_TEST_EMAIL_1=aimpactscanner.test+github1@gmail.com
GITHUB_TEST_PASSWORD_1=<secure-password>
GITHUB_TEST_USER_ID_1=<supabase-user-id>

# Supabase Test Database (if different from dev)
VITE_SUPABASE_URL=https://isgzvwpjokcmtizstwru.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
```

**Extended Variables (Phase 2 - Multiple Accounts)**:
```bash
# Google OAuth Test Account #2
GOOGLE_TEST_EMAIL_2=aimpactscanner.test+google2@gmail.com
GOOGLE_TEST_PASSWORD_2=<secure-password>
GOOGLE_TEST_USER_ID_2=<supabase-user-id>

# GitHub OAuth Test Account #2
GITHUB_TEST_EMAIL_2=aimpactscanner.test+github2@gmail.com
GITHUB_TEST_PASSWORD_2=<secure-password>
GITHUB_TEST_USER_ID_2=<supabase-user-id>

# Test Environment Configuration
TEST_ACCOUNT_ROTATION_DATE=2025-10-15
TEST_ACCOUNT_EXPIRY_DAYS=7
```

**Optional Variables (Advanced)**:
```bash
# OAuth Refresh Tokens (if using direct API approach)
GOOGLE_TEST_REFRESH_TOKEN_1=<refresh-token>
GITHUB_TEST_ACCESS_TOKEN_1=<access-token>

# Test Data
TEST_ANALYSIS_URL=https://example.com
TEST_STRIPE_CARD_TOKEN=tok_visa  # Stripe test token

# Environment Selector
TEST_ENV=staging  # Options: local, staging, production
BASE_URL=https://develop--aimpactscanner.netlify.app
```

---

### 3.2 .env File Naming Strategy

**Recommended Structure**:
```
Project Root:
├── .env.test               # Test-specific credentials (gitignored)
├── .env.test.template      # Template for documentation (committed)
├── .env.local              # Local dev overrides (gitignored)
├── .env.staging            # Staging credentials (gitignored, already exists)
├── .gitignore              # Ensure all .env files except .template are ignored
└── tests/
    └── setup/
        └── auth.setup.js   # Playwright auth setup using .env.test
```

**File Naming Rationale**:

| File | Purpose | Committed? | Used By |
|------|---------|-----------|---------|
| `.env.test` | Test account credentials | ❌ No | Local Playwright tests |
| `.env.test.template` | Documentation of required variables | ✅ Yes | New developers |
| `.env.local` | Local dev overrides | ❌ No | Vite dev server |
| `.env.staging` | Staging env credentials | ❌ No | Staging deployments |

**Why `.env.test` instead of `.env.playwright`?**
- Aligns with Node.js convention (`NODE_ENV=test`)
- Playwright can load with `dotenv` using `dotenvConfig: { path: '.env.test' }` in `playwright.config.js`
- Clear separation from `.env.local` (dev) and `.env.staging` (deployment)

---

### 3.3 .env.template Structure

**`.env.test.template` Content**:
```bash
# =============================================================================
# AImpactScanner - Test Account Credentials
# =============================================================================
# This file documents required environment variables for automated testing.
# Copy this file to .env.test and fill in actual values.
#
# SECURITY WARNING: NEVER commit .env.test to version control!
# =============================================================================

# -----------------------------------------------------------------------------
# Google OAuth Test Account #1
# -----------------------------------------------------------------------------
# Create a dedicated Gmail account for testing (e.g., aimpactscanner.test+google1@gmail.com)
# Add this account to "Test Users" in Google Cloud Console OAuth Consent Screen
# Manually authenticate once via browser to generate initial session state
GOOGLE_TEST_EMAIL_1=your-google-test-email@gmail.com
GOOGLE_TEST_PASSWORD_1=your-secure-password-here
GOOGLE_TEST_USER_ID_1=supabase-user-id-from-database

# -----------------------------------------------------------------------------
# GitHub OAuth Test Account #1
# -----------------------------------------------------------------------------
# Create a dedicated GitHub account for testing
# Manually authenticate once via browser to generate initial session state
GITHUB_TEST_EMAIL_1=your-github-test-email@gmail.com
GITHUB_TEST_PASSWORD_1=your-secure-password-here
GITHUB_TEST_USER_ID_1=supabase-user-id-from-database

# -----------------------------------------------------------------------------
# Supabase Test Environment
# -----------------------------------------------------------------------------
# Use staging environment for tests to avoid polluting production
VITE_SUPABASE_URL=https://isgzvwpjokcmtizstwru.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key-here

# -----------------------------------------------------------------------------
# Test Configuration
# -----------------------------------------------------------------------------
# Base URL for Playwright tests
BASE_URL=https://develop--aimpactscanner.netlify.app
# Or for local testing:
# BASE_URL=http://localhost:5173

# Test environment selector
TEST_ENV=staging

# Account rotation tracking (update after re-authentication)
TEST_ACCOUNT_LAST_ROTATED=2025-10-15
TEST_ACCOUNT_ROTATION_INTERVAL_DAYS=7

# -----------------------------------------------------------------------------
# Optional: Advanced Configuration
# -----------------------------------------------------------------------------
# Uncomment if using direct OAuth API approach instead of storageState

# Google OAuth Refresh Token (from OAuth Playground)
# GOOGLE_TEST_REFRESH_TOKEN_1=your-refresh-token-here

# GitHub OAuth Access Token (from Settings > Developer settings)
# GITHUB_TEST_ACCESS_TOKEN_1=your-access-token-here

# Test data
# TEST_ANALYSIS_URL=https://example.com
# TEST_STRIPE_CARD_TOKEN=tok_visa
```

---

### 3.4 .gitignore Configuration

**Update `.gitignore`** (already partially configured):
```bash
# Environment Variables - CRITICAL SECURITY
.env
.env.*
!.env.template
!.env*.template

# Existing (keep these)
.env.staging  # Already gitignored
*.local       # Already covers .env.local

# Playwright Authentication State
tests/setup/.auth/
playwright/.auth/
*.storage.json
*-storage-state.json
```

**Verification**:
```bash
# After updating .gitignore, verify no credentials are staged
git status | grep -E "\.env|\.auth|storage"
# Should return nothing

# Double-check with git ls-files
git ls-files | grep -E "\.env|\.auth|storage"
# Should only show .env.test.template (not .env.test)
```

---

### 3.5 CI/CD Environment Variable Handling

**GitHub Actions** (recommended CI/CD for GitHub repos):

**Setup in Repository**:
1. Go to Repository Settings > Secrets and Variables > Actions
2. Add secrets for each test account:

```
Repository Secrets:
├── GOOGLE_TEST_EMAIL_1        (aimpactscanner.test+google1@gmail.com)
├── GOOGLE_TEST_PASSWORD_1     (secure password)
├── GOOGLE_TEST_USER_ID_1      (Supabase user ID)
├── GITHUB_TEST_EMAIL_1        (aimpactscanner.test+github1@gmail.com)
├── GITHUB_TEST_PASSWORD_1     (secure password)
├── GITHUB_TEST_USER_ID_1      (Supabase user ID)
├── VITE_SUPABASE_URL          (staging Supabase URL)
└── VITE_SUPABASE_ANON_KEY     (staging anon key)
```

**GitHub Actions Workflow** (`.github/workflows/playwright.yml`):
```yaml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Create .env.test from secrets
        run: |
          echo "GOOGLE_TEST_EMAIL_1=${{ secrets.GOOGLE_TEST_EMAIL_1 }}" >> .env.test
          echo "GOOGLE_TEST_PASSWORD_1=${{ secrets.GOOGLE_TEST_PASSWORD_1 }}" >> .env.test
          echo "GOOGLE_TEST_USER_ID_1=${{ secrets.GOOGLE_TEST_USER_ID_1 }}" >> .env.test
          echo "GITHUB_TEST_EMAIL_1=${{ secrets.GITHUB_TEST_EMAIL_1 }}" >> .env.test
          echo "GITHUB_TEST_PASSWORD_1=${{ secrets.GITHUB_TEST_PASSWORD_1 }}" >> .env.test
          echo "GITHUB_TEST_USER_ID_1=${{ secrets.GITHUB_TEST_USER_ID_1 }}" >> .env.test
          echo "VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}" >> .env.test
          echo "VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}" >> .env.test

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: test-results/
          retention-days: 30
```

**Security Best Practices**:
- ✅ Never log secrets in CI/CD output
- ✅ Use GitHub encrypted secrets (AES-256 encryption at rest)
- ✅ Limit secret access to specific workflows
- ✅ Rotate secrets every 90 days
- ✅ Use environment-specific secrets (staging vs. production)

---

## 4. Playwright Authentication Approach

### 4.1 Recommended Technical Approach: `storageState` Pattern

**Winner**: ✅ **Playwright `storageState` Pattern** - Industry best practice for OAuth testing

**How It Works**:
1. **One-Time Manual Authentication**: Developer logs in via browser, Playwright captures session
2. **Save Session State**: Playwright saves cookies + localStorage to `storageState.json`
3. **Reuse in Tests**: All tests load saved state, skip authentication
4. **Automatic Refresh**: Global setup re-authenticates when state expires

**Benefits**:
- ✅ **Performance**: Authenticate once, reuse session across all tests (10-100x faster)
- ✅ **Security**: No need to store OAuth tokens in env variables
- ✅ **Reliability**: No reCAPTCHA issues, no rate limit concerns
- ✅ **Simplicity**: Native Playwright feature, well-documented
- ✅ **Compliance**: Aligns with provider best practices (Google, GitHub)

**Drawbacks**:
- ⚠️ Requires manual authentication every 7-30 days (Google refresh token expiry)
- ⚠️ Session state specific to one user (need separate state files for multiple accounts)

---

### 4.2 Alternative Approaches Evaluated

#### **Option B: Direct OAuth Token Injection**

**How It Works**:
1. Use OAuth Playground (Google) or Personal Access Tokens (GitHub) to get refresh/access tokens
2. Store tokens in environment variables
3. Inject tokens directly into localStorage before tests run
4. Set Supabase session manually via `supabase.auth.setSession()`

**Benefits**:
- ✅ No manual authentication required
- ✅ Programmatic token refresh possible

**Drawbacks**:
- ❌ **Complex Setup**: Requires understanding of OAuth flows, token formats
- ❌ **Security Risk**: Tokens stored in environment variables (less secure than `storageState`)
- ❌ **Maintenance Burden**: Manual token refresh required when expired
- ❌ **Google Limitation**: Refresh tokens expire after 7 days for test users
- ❌ **GitHub Limitation**: Long-lived tokens are security risk

**Verdict**: ❌ **Not Recommended** - Added complexity without significant benefit over `storageState`

---

#### **Option C: Mock OAuth Provider**

**How It Works**:
1. Use tools like `msw` (Mock Service Worker) or Playwright route mocking
2. Intercept OAuth redirect requests, return fake tokens
3. Mock Supabase session creation

**Benefits**:
- ✅ No real OAuth provider required
- ✅ Fast test execution
- ✅ No rate limits or account suspension risk

**Drawbacks**:
- ❌ **Not Real E2E Testing**: Doesn't validate actual OAuth integration
- ❌ **Maintenance Burden**: Must keep mocks in sync with real OAuth APIs
- ❌ **False Positives**: Tests pass but real OAuth may be broken
- ❌ **Limited Value**: Doesn't test the most critical part (provider integration)

**Verdict**: ❌ **Not Recommended for E2E** - Useful for unit tests, but not for validating real OAuth flows

---

### 4.3 Implementation: Playwright `storageState` Pattern

**Project Structure**:
```
tests/
├── setup/
│   ├── auth.setup.js          # Global setup: authenticate and save state
│   ├── global-setup.js        # Existing global setup
│   ├── global-teardown.js     # Existing global teardown
│   └── .auth/                 # Storage for auth state (gitignored)
│       ├── google-user1.json  # Google test account #1 session
│       ├── github-user1.json  # GitHub test account #1 session
│       ├── google-user2.json  # Google test account #2 session (optional)
│       └── github-user2.json  # GitHub test account #2 session (optional)
├── e2e/
│   └── oauth-authentication.spec.js  # Tests using saved auth state
└── playwright.config.js       # Configure projects with dependencies
```

**Updated `playwright.config.js`**:
```javascript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['line'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Projects with authentication dependencies
  projects: [
    // Setup projects - authenticate and save state
    {
      name: 'setup-google-auth',
      testMatch: /auth\.setup\.js/,
      testDir: './tests/setup',
    },
    {
      name: 'setup-github-auth',
      testMatch: /auth\.setup\.js/,
      testDir: './tests/setup',
    },

    // Test projects - use saved auth state
    {
      name: 'chromium-google-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/setup/.auth/google-user1.json',
      },
      dependencies: ['setup-google-auth'],
      testMatch: ['**/oauth-authentication.spec.js'],
    },
    {
      name: 'chromium-github-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/setup/.auth/github-user1.json',
      },
      dependencies: ['setup-github-auth'],
      testMatch: ['**/oauth-authentication.spec.js'],
    },

    // Existing projects (no auth required)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.js'],
      testIgnore: ['**/oauth-authentication.spec.js', '**/auth.setup.js'],
    },
    // ... other projects
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
    },
  },

  timeout: 30 * 1000,
  globalTimeout: 60 * 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});
```

**`tests/setup/auth.setup.js`** (New File):
```javascript
// tests/setup/auth.setup.js - Authenticate and save session state
import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const authDir = path.join(__dirname, '.auth');

// Ensure .auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const GOOGLE_AUTH_FILE = path.join(authDir, 'google-user1.json');
const GITHUB_AUTH_FILE = path.join(authDir, 'github-user1.json');

// Check if auth state is expired (Google: 7 days, GitHub: 30 days)
function isAuthStateExpired(authFile, expiryDays) {
  if (!fs.existsSync(authFile)) return true;

  const stats = fs.statSync(authFile);
  const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays >= expiryDays;
}

// Google OAuth Authentication Setup
setup('authenticate with Google OAuth', async ({ page }) => {
  // Skip if auth state exists and not expired
  if (!isAuthStateExpired(GOOGLE_AUTH_FILE, 7)) {
    console.log('✅ Google auth state still valid, skipping re-authentication');
    return;
  }

  console.log('🔄 Google auth state expired or missing, re-authenticating...');

  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  // Navigate to login page
  await page.goto(baseUrl);
  await page.click('text=Sign In');

  // Wait for auth page to load
  await page.waitForURL(/unified-registration|login/);

  // Click Google OAuth button
  const googleButton = page.locator('button:has-text("Continue with Google")');
  await expect(googleButton).toBeVisible();
  await googleButton.click();

  // MANUAL STEP: Developer must complete Google login in headed browser
  // This will open Google login page - enter credentials manually
  console.log('⏳ Please complete Google login in the browser window...');
  console.log('📧 Email:', process.env.GOOGLE_TEST_EMAIL_1);

  // Wait for OAuth callback redirect to complete
  await page.waitForURL(/dashboard|oauth-callback/, { timeout: 60000 });

  // Verify authentication succeeded
  await expect(page).toHaveURL(/dashboard/);
  console.log('✅ Google authentication successful');

  // Save authentication state
  await page.context().storageState({ path: GOOGLE_AUTH_FILE });
  console.log('💾 Google auth state saved to:', GOOGLE_AUTH_FILE);
});

// GitHub OAuth Authentication Setup
setup('authenticate with GitHub OAuth', async ({ page }) => {
  // Skip if auth state exists and not expired
  if (!isAuthStateExpired(GITHUB_AUTH_FILE, 30)) {
    console.log('✅ GitHub auth state still valid, skipping re-authentication');
    return;
  }

  console.log('🔄 GitHub auth state expired or missing, re-authenticating...');

  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  // Navigate to login page
  await page.goto(baseUrl);
  await page.click('text=Sign In');

  // Wait for auth page to load
  await page.waitForURL(/unified-registration|login/);

  // Click GitHub OAuth button
  const githubButton = page.locator('button:has-text("Continue with GitHub")');
  await expect(githubButton).toBeVisible();
  await githubButton.click();

  // MANUAL STEP: Developer must complete GitHub login in headed browser
  console.log('⏳ Please complete GitHub login in the browser window...');
  console.log('📧 Email:', process.env.GITHUB_TEST_EMAIL_1);

  // Wait for OAuth callback redirect to complete
  await page.waitForURL(/dashboard|oauth-callback/, { timeout: 60000 });

  // Verify authentication succeeded
  await expect(page).toHaveURL(/dashboard/);
  console.log('✅ GitHub authentication successful');

  // Save authentication state
  await page.context().storageState({ path: GITHUB_AUTH_FILE });
  console.log('💾 GitHub auth state saved to:', GITHUB_AUTH_FILE);
});
```

**`tests/e2e/oauth-authentication.spec.js`** (Example Test Using Saved State):
```javascript
// tests/e2e/oauth-authentication.spec.js - OAuth authentication tests
import { test, expect } from '@playwright/test';

test.describe('Google OAuth Authentication', () => {
  test.use({ storageState: 'tests/setup/.auth/google-user1.json' });

  test('should redirect to dashboard after OAuth callback', async ({ page }) => {
    // Navigation with pre-authenticated session
    await page.goto('/');

    // Should already be authenticated - verify dashboard accessible
    await page.goto('/#dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Verify authenticated user elements visible
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('text=analyses remaining')).toBeVisible();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    await page.goto('/#dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Refresh page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });
});

test.describe('GitHub OAuth Authentication', () => {
  test.use({ storageState: 'tests/setup/.auth/github-user1.json' });

  test('should redirect to dashboard after OAuth callback', async ({ page }) => {
    await page.goto('/');

    // Should already be authenticated
    await page.goto('/#dashboard');
    await expect(page).toHaveURL(/dashboard/);

    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });
});
```

---

### 4.4 First-Time Setup Process

**Developer Onboarding Steps**:

1. **Copy environment template**:
   ```bash
   cp .env.test.template .env.test
   ```

2. **Fill in test account credentials** in `.env.test`:
   ```bash
   GOOGLE_TEST_EMAIL_1=aimpactscanner.test+google1@gmail.com
   GOOGLE_TEST_PASSWORD_1=<your-password>
   GITHUB_TEST_EMAIL_1=aimpactscanner.test+github1@gmail.com
   GITHUB_TEST_PASSWORD_1=<your-password>
   ```

3. **Run auth setup in headed mode** (FIRST TIME ONLY):
   ```bash
   # This opens browser windows for manual login
   npx playwright test auth.setup --headed
   ```

4. **Complete manual authentication**:
   - Google login window opens → Enter credentials → Approve OAuth consent
   - GitHub login window opens → Enter credentials → Approve OAuth consent
   - Playwright saves session state to `tests/setup/.auth/*.json`

5. **Run tests with saved auth state**:
   ```bash
   # All tests now use saved session, no manual login required
   npx playwright test oauth-authentication.spec.js
   ```

6. **Re-authentication schedule**:
   - **Google**: Re-run setup every 7 days (before refresh token expires)
   - **GitHub**: Re-run setup every 30 days (proactive security)
   - Setup script auto-detects expired state and prompts re-authentication

---

### 4.5 CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/playwright.yml`):

**Challenge**: CI/CD cannot perform manual authentication (no browser interaction)

**Solutions**:

#### **Option A (Recommended): Pre-Generated Auth State in CI Secrets**
1. Developer authenticates locally in headed mode
2. Copy `tests/setup/.auth/*.json` files
3. Add as GitHub repository secrets (base64 encoded)
4. CI/CD decodes and uses pre-saved state

**Implementation**:
```yaml
- name: Restore authentication state from secrets
  run: |
    mkdir -p tests/setup/.auth
    echo "${{ secrets.GOOGLE_AUTH_STATE }}" | base64 -d > tests/setup/.auth/google-user1.json
    echo "${{ secrets.GITHUB_AUTH_STATE }}" | base64 -d > tests/setup/.auth/github-user1.json

- name: Run Playwright tests
  run: npx playwright test oauth-authentication.spec.js
```

**Generating secrets** (run locally after manual auth):
```bash
# After running auth.setup in headed mode:
base64 tests/setup/.auth/google-user1.json
base64 tests/setup/.auth/github-user1.json

# Copy output, add to GitHub Secrets:
# - GOOGLE_AUTH_STATE
# - GITHUB_AUTH_STATE
```

**Maintenance**:
- **Google**: Update secret every 7 days (before refresh token expires)
- **GitHub**: Update secret every 30 days
- Automate with scheduled workflow reminders

#### **Option B: Skip OAuth Tests in CI, Run Manually**
```yaml
- name: Run Playwright tests (skip OAuth)
  run: npx playwright test --grep-invert oauth-authentication
```

**Use Case**: If CI/CD OAuth testing is too complex, run OAuth tests manually before releases.

---

### 4.6 Security Implications

**Security Trade-offs**:

| Approach | Security Level | Pros | Cons |
|----------|----------------|------|------|
| **`storageState`** | ✅ HIGH | Session cookies encrypted by browser, no tokens in env vars | Auth state files must be gitignored |
| **Direct Token Injection** | ⚠️ MEDIUM | Programmatic, no manual steps | Tokens stored in env vars, higher exposure risk |
| **Mock OAuth** | ✅ HIGH | No real credentials needed | Doesn't test real integration |

**Recommended Security Controls**:

1. **Gitignore Auth State Files**:
   ```bash
   # .gitignore
   tests/setup/.auth/
   *.storage.json
   ```

2. **Encrypt Auth State in CI/CD**:
   - Use GitHub encrypted secrets (AES-256)
   - Never log auth state contents
   - Rotate every 30-90 days

3. **Limit Auth State Scope**:
   - Use staging environment (not production)
   - Test accounts with minimal data access
   - Revoke tokens when no longer needed

4. **Monitor for Compromises**:
   - Alert on unexpected logins from test accounts
   - Review Supabase auth logs monthly
   - Rotate credentials after suspected breach

5. **Principle of Least Privilege**:
   - Test accounts only have access to staging database
   - No admin permissions
   - No access to production data

---

## 5. Implementation Roadmap

### Phase 1: Minimum Viable Setup (Week 1)

**Goal**: Get basic OAuth authentication working in Playwright tests

**Tasks**:
1. ✅ Create 2 dedicated test accounts (1 Google, 1 GitHub)
2. ✅ Set up `.env.test` and `.env.test.template`
3. ✅ Update `.gitignore` to exclude credentials
4. ✅ Implement `tests/setup/auth.setup.js` with `storageState` pattern
5. ✅ Run manual authentication in headed mode to generate auth state
6. ✅ Write 2-3 basic OAuth tests using saved auth state
7. ✅ Verify tests pass locally

**Deliverables**:
- 2 test accounts created and configured
- Playwright auth setup working locally
- 2-3 OAuth tests passing

**Success Criteria**:
- Tests run without manual authentication after initial setup
- Auth state persists for 7+ days (Google) and 30+ days (GitHub)
- Zero credentials committed to Git

---

### Phase 2: CI/CD Integration (Week 2)

**Goal**: Enable OAuth testing in GitHub Actions

**Tasks**:
1. ✅ Generate base64-encoded auth state files
2. ✅ Add `GOOGLE_AUTH_STATE` and `GITHUB_AUTH_STATE` to GitHub Secrets
3. ✅ Create `.github/workflows/playwright.yml` with auth state restoration
4. ✅ Test CI/CD pipeline with OAuth tests
5. ✅ Set up calendar reminders for 7-day and 30-day auth state rotation
6. ✅ Document rotation procedure in `tests/setup/README.md`

**Deliverables**:
- GitHub Actions workflow running OAuth tests
- Automated secret rotation reminders
- CI/CD documentation

**Success Criteria**:
- OAuth tests pass in CI/CD pipeline
- No manual intervention required during test runs
- Auth state rotation process documented

---

### Phase 3: Scale & Optimize (Week 3-4)

**Goal**: Expand to multiple test accounts and optimize for parallel execution

**Tasks**:
1. ✅ Create 2-3 additional test accounts per provider (4-6 total)
2. ✅ Implement parallel test execution with separate auth states
3. ✅ Add automated expiry detection and re-authentication triggers
4. ✅ Create monitoring dashboard for test account health
5. ✅ Implement quarterly password rotation workflow
6. ✅ Expand test coverage to include edge cases (tier selection, account creation, etc.)

**Deliverables**:
- 4-6 test accounts operational
- Parallel test execution with 2-3x speedup
- Automated auth state management

**Success Criteria**:
- Tests run 2-3x faster with parallel execution
- Zero test flakiness due to auth issues
- Automated rotation reminders working

---

## 6. Risk Assessment & Mitigation

### 6.1 High-Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Google refresh token expires after 7 days** | HIGH | HIGH | Automate re-authentication reminders, implement expiry detection |
| **Auth state files committed to Git** | MEDIUM | CRITICAL | Strict `.gitignore`, pre-commit hooks, repo scanning |
| **Test account suspended by provider** | LOW | HIGH | Use dedicated accounts, follow ToS, monitor for anomalies |
| **CI/CD auth state becomes stale** | MEDIUM | MEDIUM | Calendar reminders, automated expiry detection |
| **Rate limits exceeded during test runs** | LOW | MEDIUM | Use `storageState` to minimize logins, cache tokens |

---

### 6.2 Mitigation Strategies

**Automated Expiry Detection**:
```javascript
// tests/setup/auth.setup.js - Expiry detection logic
function isAuthStateExpired(authFile, expiryDays) {
  if (!fs.existsSync(authFile)) return true;

  const stats = fs.statSync(authFile);
  const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays >= expiryDays) {
    console.warn(`⚠️ Auth state expired (${ageInDays.toFixed(1)} days old)`);
    return true;
  }

  console.log(`✅ Auth state valid (${ageInDays.toFixed(1)} days old, expires in ${(expiryDays - ageInDays).toFixed(1)} days)`);
  return false;
}
```

**Pre-Commit Hook** (prevent credential commits):
```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for sensitive files staged for commit
if git diff --cached --name-only | grep -E "\.env\.test$|\.auth/|storage.*\.json$"; then
  echo "❌ ERROR: Attempting to commit sensitive test credentials!"
  echo "Files detected:"
  git diff --cached --name-only | grep -E "\.env\.test$|\.auth/|storage.*\.json$"
  echo ""
  echo "These files should be in .gitignore. Run:"
  echo "  git reset HEAD <file>"
  exit 1
fi
```

**Repository Secret Scanning** (GitHub Advanced Security):
- Enable secret scanning in repository settings
- Add custom patterns for Supabase keys, OAuth tokens
- Automated alerts on credential exposure

---

## 7. Appendix

### 7.1 Alternative Playwright Authentication Patterns

**Pattern 1: Page Object Model with Auth Fixture**:
```javascript
// tests/fixtures/auth.fixture.js
import { test as base } from '@playwright/test';

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Load auth state dynamically
    await page.context().addCookies(/* load from storageState */);
    await use(page);
  },
});

export { test };
```

**Pattern 2: Shared Worker for Auth State**:
```javascript
// playwright.config.js
export default defineConfig({
  workers: 1, // Single worker reuses auth state
  use: {
    storageState: 'tests/setup/.auth/google-user1.json',
  },
});
```

**Pattern 3: API-Based Token Acquisition** (for direct Supabase testing):
```javascript
// tests/utils/get-auth-token.js
import { createClient } from '@supabase/supabase-js';

export async function getAuthToken(email, password) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session.access_token;
}
```

---

### 7.2 Troubleshooting Guide

**Issue**: Auth state file not loading
- **Cause**: File path incorrect or file doesn't exist
- **Solution**: Verify `storageState` path in `playwright.config.js` matches actual file location
  ```bash
  ls -la tests/setup/.auth/  # Verify files exist
  ```

**Issue**: Google refresh token expired
- **Cause**: Auth state older than 7 days
- **Solution**: Re-run auth setup in headed mode
  ```bash
  npx playwright test auth.setup --headed --project=setup-google-auth
  ```

**Issue**: GitHub OAuth redirects to "Authorize OAuth App" every time
- **Cause**: Session cookies expired or cleared
- **Solution**: Re-authenticate and save new storageState
  ```bash
  npx playwright test auth.setup --headed --project=setup-github-auth
  ```

**Issue**: Tests fail in CI/CD but pass locally
- **Cause**: Auth state secrets not configured or stale
- **Solution**: Update GitHub Secrets with fresh auth state
  ```bash
  base64 tests/setup/.auth/google-user1.json
  # Copy output to GitHub Secrets > GOOGLE_AUTH_STATE
  ```

**Issue**: "Session not found" error in Playwright tests
- **Cause**: Supabase session expired or not properly loaded
- **Solution**: Verify auth state includes Supabase session cookies
  ```bash
  cat tests/setup/.auth/google-user1.json | grep -i supabase
  ```

---

### 7.3 Resources & References

**Official Documentation**:
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [GitHub OAuth Apps Rate Limits](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/rate-limits-for-oauth-apps)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

**Community Resources**:
- [Playwright Solutions: Authentication Best Practices](https://playwrightsolutions.com/)
- [Stack Overflow: Playwright OAuth Testing](https://stackoverflow.com/questions/tagged/playwright+oauth)
- [GitHub Discussions: OAuth Automation](https://github.com/microsoft/playwright/discussions)

**AImpactScanner Specific**:
- UAT Phase 2 Results: `/test-results/phase2-auth-pricing-report.md`
- Existing OAuth Implementation: `/src/components/OAuthCallback.jsx`
- Supabase Client Config: `/src/lib/supabaseClient.js`

---

## 8. Final Recommendations

### 8.1 Executive Summary for Coordinator

**Strategic Decision**: ✅ **APPROVED FOR IMPLEMENTATION**

**Recommended Approach**:
1. **Test Account Strategy**: 2 dedicated accounts (1 Google, 1 GitHub) for Phase 1, expand to 4-6 for Phase 2
2. **Authentication Pattern**: Playwright `storageState` with manual one-time authentication
3. **Credential Storage**: `.env.test` (gitignored) with `.env.test.template` documentation
4. **Rotation Schedule**: Google 7 days, GitHub 30 days, passwords 90 days
5. **CI/CD Integration**: Pre-generated auth state stored in GitHub Secrets

**Feasibility**: ✅ **HIGH** - All approaches comply with OAuth provider policies and security best practices

**Implementation Timeline**:
- **Phase 1** (Week 1): Basic setup with 2 accounts
- **Phase 2** (Week 2): CI/CD integration
- **Phase 3** (Week 3-4): Scale to 4-6 accounts, optimization

**Estimated Effort**: 16-24 hours total across 3-4 weeks

**Risk Level**: ✅ **LOW** - Well-established patterns with industry best practices

---

### 8.2 Next Steps for Developer

**Immediate Actions**:
1. Review this document and approve strategic recommendations
2. Create 2 dedicated test accounts (Google + GitHub)
3. Set up `.env.test` with credentials
4. Implement `tests/setup/auth.setup.js` following code examples
5. Run manual authentication in headed mode to generate auth state
6. Write 2-3 OAuth tests using saved auth state
7. Verify tests pass locally without manual intervention

**Handoff Checklist**:
- [ ] Strategic document reviewed and approved
- [ ] Test accounts created and configured
- [ ] `.env.test.template` created for documentation
- [ ] `.gitignore` updated to exclude credentials
- [ ] `auth.setup.js` implemented with expiry detection
- [ ] Manual authentication completed (headed mode)
- [ ] Auth state files generated in `tests/setup/.auth/`
- [ ] 2-3 OAuth tests written and passing locally
- [ ] CI/CD integration plan documented
- [ ] Rotation schedule calendar reminders set

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**
**Next Agent**: Developer to implement Phase 1 setup based on this strategic analysis
**Success Criteria**: OAuth tests running automatically without manual authentication after initial setup

---

*Generated by THE STRATEGIST - AGENT-11 Product Strategy Specialist*
*Reference: `/project/agents/specialists/the-strategist.md`*
