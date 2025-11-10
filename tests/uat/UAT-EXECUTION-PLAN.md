# UAT Test Execution Plan

## Overview

This document provides step-by-step instructions for running comprehensive User Acceptance Testing (UAT) for AImpactScanner core functionality.

## Test Coverage

The UAT suite validates **6 major areas** across **20+ test scenarios**:

1. **Google OAuth User Journeys** (4 tests)
2. **GitHub OAuth User Journeys** (3 tests)
3. **Tier Selection and Upgrade Flows** (4 tests)
4. **Analysis Functionality** (3 tests)
5. **Account Management** (2 tests)
6. **Cross-Cutting Concerns** (3 tests)

## Prerequisites

### 1. Test Accounts Setup

You need OAuth authentication sessions saved for both Google and GitHub test users.

**First-Time Setup** (One-Time Only):

```bash
# Run Google OAuth setup (requires manual login in browser)
npx playwright test tests/setup/auth.setup.js --headed --project=setup-google-auth

# Run GitHub OAuth setup (requires manual login in browser)
npx playwright test tests/setup/auth.setup.js --headed --project=setup-github-auth
```

**What This Does**:
- Opens a browser window (headed mode)
- You manually complete OAuth login for each provider
- Playwright saves your authenticated session to `tests/setup/.auth/`
- Future tests reuse these sessions (no manual login required)

**Session Expiry**:
- Google sessions: Valid for 7 days
- GitHub sessions: Valid for 30 days
- Re-run setup when sessions expire

### 2. Environment Configuration

Ensure `.env.test` exists with test account credentials:

```bash
# Check if .env.test exists
ls -la .env.test

# If not, copy template and add credentials
cp .env.test.template .env.test
# Edit .env.test and add your test account emails
```

Required variables:
- `GOOGLE_TEST_EMAIL_1` - Google test account email
- `GITHUB_TEST_EMAIL_1` - GitHub test account email/username
- `BASE_URL` - Staging URL (defaults to develop branch)

### 3. Verify Playwright Installation

```bash
# Install dependencies if needed
npm install

# Install Playwright browsers
npx playwright install
```

## Running UAT Tests

### Quick Run - All Tests

```bash
# Run complete UAT suite
npx playwright test tests/uat/core-user-journeys.spec.js
```

### Run Specific Test Suites

```bash
# Google OAuth tests only
npx playwright test tests/uat/core-user-journeys.spec.js -g "Google OAuth"

# GitHub OAuth tests only
npx playwright test tests/uat/core-user-journeys.spec.js -g "GitHub OAuth"

# Tier and upgrade flows only
npx playwright test tests/uat/core-user-journeys.spec.js -g "Tier Selection"

# Analysis functionality only
npx playwright test tests/uat/core-user-journeys.spec.js -g "Analysis Functionality"

# Account management only
npx playwright test tests/uat/core-user-journeys.spec.js -g "Account Management"

# Cross-cutting concerns only
npx playwright test tests/uat/core-user-journeys.spec.js -g "Cross-Cutting"
```

### Run with Visual Feedback

```bash
# Run with headed browser (see what's happening)
npx playwright test tests/uat/core-user-journeys.spec.js --headed

# Run with UI mode (interactive debugging)
npx playwright test tests/uat/core-user-journeys.spec.js --ui

# Run with debug mode (step through tests)
npx playwright test tests/uat/core-user-journeys.spec.js --debug
```

### Run Against Different Environments

```bash
# Test staging (develop branch)
BASE_URL=https://develop--aimpactscanner.netlify.app npx playwright test tests/uat/core-user-journeys.spec.js

# Test production
BASE_URL=https://aimpactscanner.netlify.app npx playwright test tests/uat/core-user-journeys.spec.js

# Test local development
BASE_URL=http://localhost:5173 npx playwright test tests/uat/core-user-journeys.spec.js
```

## Test Suite Details

### Suite 1: Google OAuth User Journeys

**Tests**:
1. **1.1** - Returning user login → Dashboard access
2. **1.2** - Session persistence across page refresh
3. **1.3** - Navigation across authenticated pages
4. **1.4** - Supabase session validity check

**Success Criteria**:
- ✅ Authenticated user reaches dashboard without re-login
- ✅ Session persists after page refresh
- ✅ Navigation works across all authenticated pages
- ✅ Valid Supabase session exists in localStorage

### Suite 2: GitHub OAuth User Journeys

**Tests**:
1. **2.1** - Returning user login → Dashboard access
2. **2.2** - Session persistence across page refresh
3. **2.3** - Supabase session validity check

**Success Criteria**:
- ✅ Authenticated user reaches dashboard without re-login
- ✅ Session persists after page refresh
- ✅ Valid Supabase session exists in localStorage

### Suite 3: Tier Selection and Upgrade Flows

**Tests**:
1. **3.1** - View current tier on account page
2. **3.2** - Navigate to pricing page from account
3. **3.3** - View all tier options on pricing page
4. **3.4** - Coffee tier upgrade button initiates checkout

**Success Criteria**:
- ✅ Current tier visible on account page
- ✅ Can navigate to pricing page
- ✅ All tier options (Free, Coffee) visible
- ✅ Upgrade button present and enabled (doesn't actually click to avoid Stripe)

**Note**: Test 3.4 verifies the upgrade button exists and is enabled but does NOT click it to avoid triggering actual Stripe checkout during automated testing.

### Suite 4: Analysis Functionality

**Tests**:
1. **4.1** - Access analysis input page
2. **4.2** - Submit URL for analysis
3. **4.3** - View analysis history on dashboard

**Success Criteria**:
- ✅ Analysis input page accessible
- ✅ URL input field and analyze button visible
- ✅ Can submit URL for analysis
- ✅ Analysis history accessible on dashboard

### Suite 5: Account Management

**Tests**:
1. **5.1** - View account details
2. **5.2** - Logout functionality

**Success Criteria**:
- ✅ Account page shows email, tier, usage info
- ✅ Logout button present and enabled (doesn't actually click to preserve session)

### Suite 6: Cross-Cutting Concerns

**Tests**:
1. **6.1** - Protected routes redirect unauthenticated users
2. **6.2** - App loads without console errors
3. **6.3** - Page load performance check

**Success Criteria**:
- ✅ Unauthenticated users redirected from protected routes
- ✅ No console errors on page load
- ✅ Dashboard loads in acceptable time (<5s)

## Interpreting Results

### Success Indicators

```
✅ TEST X.X PASSED: Description
```

All tests passed - functionality working as expected.

### Warning Indicators

```
⚠️  Warning message
```

Test passed but with caveats:
- Feature may be in different format than expected
- Non-critical issue detected
- Manual verification recommended

### Failure Indicators

```
❌ TEST X.X FAILED: Description
Error: ...
```

Test failed - requires investigation and fixes.

## HTML Test Report

After running tests, view detailed HTML report:

```bash
# Generate and open HTML report
npx playwright show-report
```

Report includes:
- Pass/fail status for each test
- Screenshots of failures
- Execution time
- Console logs
- Network activity

## CI/CD Integration

To run UAT tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run UAT Tests
  run: |
    # Note: Auth setup requires manual login, so CI should use pre-saved auth states
    # Or use API-based authentication for CI environments
    npx playwright test tests/uat/core-user-journeys.spec.js --reporter=html
```

**Important**: OAuth authentication setup requires manual browser interaction, so CI/CD should either:
1. Use pre-saved auth states committed to secure storage
2. Use API-based authentication for test accounts
3. Skip tests requiring OAuth and run them manually before releases

## Troubleshooting

### "Auth state not found" Error

**Problem**: Missing authentication session files

**Solution**:
```bash
# Re-run auth setup
npx playwright test tests/setup/auth.setup.js --headed --project=setup-google-auth
npx playwright test tests/setup/auth.setup.js --headed --project=setup-github-auth
```

### "Auth state expired" Error

**Problem**: Session older than expiry period (7 days for Google, 30 days for GitHub)

**Solution**: Same as above - re-run auth setup

### Tests Timing Out

**Problem**: Page load too slow or elements not found

**Solution**:
1. Check network connection
2. Verify staging URL is accessible
3. Run with `--headed` flag to see what's happening
4. Check console logs for errors

### "Cannot find element" Errors

**Problem**: UI changes broke test selectors

**Solution**:
1. Run with `--headed` or `--ui` to inspect page
2. Update test selectors in `core-user-journeys.spec.js`
3. Consider using more resilient selectors (test IDs)

## Manual Verification Checklist

After running automated tests, manually verify:

- [ ] Complete new user signup flow (both Google and GitHub)
- [ ] Actual Stripe payment flow (Coffee tier upgrade)
- [ ] PDF export functionality (Coffee tier feature)
- [ ] Email notifications (if implemented)
- [ ] Mobile responsive layout
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

## Test Maintenance

**When to Update Tests**:
- UI changes (new components, layout changes)
- Route changes (URL structure updates)
- Feature additions (new functionality)
- Text/copy changes (button labels, headings)

**Best Practices**:
- Keep selectors flexible (prefer semantic text over CSS classes)
- Add test IDs to critical elements for stability
- Document test changes in progress.md
- Re-run full suite after major changes

## Success Metrics

**UAT Success Criteria**:
- ✅ 100% of critical path tests pass (Suites 1-4)
- ✅ 90%+ of all tests pass (allows for minor UI variations)
- ✅ No critical console errors
- ✅ Page load time <5 seconds
- ✅ All OAuth providers working
- ✅ Payment flow accessible (button present)

**Definition of Done**:
1. All automated tests pass
2. Manual verification checklist completed
3. No blocking bugs discovered
4. Performance acceptable
5. Test results documented in progress.md

## Next Steps

After successful UAT:
1. Document results in `progress.md`
2. Create issues for any warnings or failures
3. Update `project-plan.md` with status
4. Consider deploying to production
5. Schedule regression testing cadence

## Contact

For questions about UAT testing:
- Review test code: `tests/uat/core-user-journeys.spec.js`
- Check auth setup: `tests/setup/auth.setup.js`
- See project docs: `CLAUDE.md`, `progress.md`
