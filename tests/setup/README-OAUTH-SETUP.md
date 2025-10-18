# OAuth Test Account Setup Guide

## Overview

This guide walks you through setting up OAuth test accounts for automated Playwright testing of Google and GitHub authentication flows.

**Status**: Phase 2 Implementation Complete - Ready for Manual Authentication

**Created**: 2025-10-15

---

## Quick Start (For Developers)

### Step 1: Create Test Accounts

You need to create 2 dedicated test accounts:

#### Google Test Account
1. Go to https://accounts.google.com/signup
2. Create account: `aimpactscanner.test+google1@gmail.com` (or similar)
3. Use a strong password (store in password manager)
4. **CRITICAL**: Add to Google Cloud Console Test Users:
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Click "ADD USERS" under Test Users section
   - Add your test email address
   - Save changes

#### GitHub Test Account
1. Go to https://github.com/signup
2. Create account: `aimpactscanner.test+github1@gmail.com` (or similar)
3. Use a strong password (store in password manager)
4. Verify email address

---

### Step 2: Update .env.test

Open `.env.test` and add your test account credentials:

```bash
# Google OAuth Test Account #1
GOOGLE_TEST_EMAIL_1=aimpactscanner.test+google1@gmail.com
GOOGLE_TEST_PASSWORD_1=your-actual-password
GOOGLE_TEST_USER_ID_1=will-be-filled-after-first-auth

# GitHub OAuth Test Account #1
GITHUB_TEST_EMAIL_1=aimpactscanner.test+github1@gmail.com
GITHUB_TEST_PASSWORD_1=your-actual-password
GITHUB_TEST_USER_ID_1=will-be-filled-after-first-auth

# Supabase Staging Environment (already configured)
VITE_SUPABASE_URL=https://isgzvwpjokcmtizstwru.supabase.co
VITE_SUPABASE_ANON_KEY=<your-staging-anon-key>

# Base URL for tests
BASE_URL=http://localhost:5173
# Or use staging: BASE_URL=https://develop--aimpactscanner.netlify.app

# Test environment
TEST_ENV=staging

# Rotation tracking
TEST_ACCOUNT_LAST_ROTATED=2025-10-15
TEST_ACCOUNT_ROTATION_INTERVAL_DAYS=7
```

**SECURITY WARNING**: NEVER commit `.env.test` to Git! It's already in `.gitignore`.

---

### Step 3: Run Manual Authentication (FIRST TIME ONLY)

This step is required ONCE to generate auth state files. After this, tests run automatically.

#### Option A: Authenticate Both Providers at Once
```bash
npx playwright test tests/setup/auth.setup.js --headed
```

#### Option B: Authenticate One Provider at a Time
```bash
# Google OAuth
npx playwright test tests/setup/auth.setup.js --headed --project=setup-google-auth

# GitHub OAuth
npx playwright test tests/setup/auth.setup.js --headed --project=setup-github-auth
```

**What Happens**:
1. Browser window opens (headed mode)
2. Playwright navigates to AImpactScanner login page
3. Clicks "Continue with Google" or "Continue with GitHub"
4. **YOU MANUALLY COMPLETE THE LOGIN** in the browser:
   - Enter email address
   - Enter password
   - Approve OAuth consent if prompted
5. Playwright waits for redirect to dashboard
6. Session state saved to `tests/setup/.auth/*.json`
7. Browser closes automatically

**Expected Output**:
```
✅ Google auth state expired or missing, re-authenticating...
⏳ Please complete Google login in the browser window...
   1. Enter email: aimpactscanner.test+google1@gmail.com
   2. Enter password
   3. Approve OAuth consent if prompted
   4. Wait for redirect to dashboard...
✅ Google authentication successful - redirected to dashboard
✅ Dashboard loaded with authenticated user data
💾 Google auth state saved to: tests/setup/.auth/google-user1.json
✅ Google OAuth setup complete - tests can now reuse this session
```

---

### Step 4: Run OAuth Tests

After manual authentication completes, you can run tests WITHOUT manual login:

```bash
# Run all OAuth tests
npx playwright test tests/e2e/oauth-authentication.spec.js

# Run Google OAuth tests only
npx playwright test tests/e2e/oauth-authentication.spec.js --grep "Google OAuth"

# Run GitHub OAuth tests only
npx playwright test tests/e2e/oauth-authentication.spec.js --grep "GitHub OAuth"

# Run with UI mode (interactive)
npx playwright test tests/e2e/oauth-authentication.spec.js --ui
```

**Expected Behavior**:
- Tests use saved auth state from `.auth/*.json` files
- NO browser login prompts
- Tests execute in seconds (no manual interaction)
- Dashboard accessible immediately (already authenticated)

---

### Step 5: Verify Everything Works

Run this command to verify no credentials are committed:

```bash
git status | grep -E "\.env\.test$|\.auth/"
```

**Expected Output**: Nothing (silence means success)

If you see `.env.test` or `.auth/` files listed, they're about to be committed. **STOP!** Run:

```bash
git reset HEAD .env.test
git reset HEAD tests/setup/.auth/
```

Then verify `.gitignore` includes:
```
.env
.env.*
!.env.template
!.env*.template
tests/setup/.auth/
*.storage.json
```

---

## Authentication State Maintenance

### When to Re-Authenticate

- **Google OAuth**: Every 7 days (refresh token expires for test users)
- **GitHub OAuth**: Every 30 days (proactive security best practice)
- **Passwords**: Every 90 days (industry standard rotation)

### How to Re-Authenticate

Run the same manual auth setup command:

```bash
npx playwright test tests/setup/auth.setup.js --headed
```

The setup script automatically detects expired auth state and prompts re-authentication.

### Checking Auth State Age

```bash
ls -la tests/setup/.auth/
```

Look at the file modification dates. If older than:
- **7 days** (Google): Re-run setup
- **30 days** (GitHub): Re-run setup

---

## Troubleshooting

### Problem: "Auth state not found"

**Cause**: Manual authentication never completed

**Solution**: Run manual auth setup:
```bash
npx playwright test tests/setup/auth.setup.js --headed
```

---

### Problem: "GOOGLE_TEST_EMAIL_1 not set"

**Cause**: `.env.test` missing credentials

**Solution**: 
1. Verify `.env.test` exists
2. Add credentials following `.env.test.template` format
3. Run tests again

---

### Problem: Google login fails with "This app hasn't been verified"

**Cause**: Test account not added to Google Cloud Console Test Users

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "ADD USERS" under Test Users
3. Add test email: `aimpactscanner.test+google1@gmail.com`
4. Save changes
5. Re-run manual auth setup

---

### Problem: Tests fail with "Session not found"

**Cause**: Auth state expired (Google: 7 days, GitHub: 30 days)

**Solution**: Re-run manual authentication:
```bash
npx playwright test tests/setup/auth.setup.js --headed
```

---

### Problem: "Cannot find module 'dotenv'"

**Cause**: Missing dependencies

**Solution**:
```bash
npm install
```

---

### Problem: Browser doesn't open in headed mode

**Cause**: Playwright browsers not installed

**Solution**:
```bash
npx playwright install --with-deps
```

---

## Security Best Practices

### ✅ DO:
- Use dedicated test accounts (never personal accounts)
- Store `.env.test` securely (password manager for team sharing)
- Verify `.gitignore` before commits: `git status | grep .env`
- Rotate credentials every 90 days
- Use staging environment for tests (`BASE_URL=https://develop--aimpactscanner.netlify.app`)
- Keep auth state files in `.auth/` directory (gitignored)

### ❌ DON'T:
- Commit `.env.test` to version control
- Commit `.auth/*.json` files to version control
- Log credentials in test output
- Share test account credentials via email/Slack
- Use production environment for automated tests
- Use personal Google/GitHub accounts for testing

---

## Files Created

```
.env.test.template          # Template for test credentials (SAFE to commit)
.env.test                   # Actual credentials (NEVER commit, in .gitignore)
.gitignore                  # Updated with .env and .auth exclusions
tests/setup/auth.setup.js   # Playwright auth setup script
tests/setup/.auth/          # Directory for auth state files (gitignored)
tests/e2e/oauth-authentication.spec.js  # OAuth tests using saved auth state
playwright.config.js        # Updated with setup projects and dotenv
```

---

## Architecture

### How It Works

1. **One-Time Manual Auth**: Developer logs in via browser (headed mode)
2. **Save Session State**: Playwright captures cookies + localStorage → `.auth/*.json`
3. **Reuse in Tests**: All tests load saved state, skip authentication
4. **Automatic Refresh**: Setup script detects expired state, prompts re-auth

### Benefits

- **Performance**: 10-100x faster (authenticate once, reuse everywhere)
- **Security**: No OAuth tokens in env variables, only session cookies
- **Reliability**: No reCAPTCHA issues, no rate limit concerns
- **Simplicity**: Native Playwright feature, well-documented
- **Compliance**: Aligns with Google/GitHub best practices

### Why `storageState` Pattern?

**Alternative approaches evaluated**:
- ❌ **Direct OAuth Token Injection**: Too complex, tokens in env vars (security risk)
- ❌ **Mock OAuth Provider**: Doesn't test real integration, false sense of security
- ✅ **`storageState` Pattern**: Best balance of security, performance, simplicity

See `/docs/test-account-strategy.md` for complete analysis.

---

## CI/CD Integration (Phase 3)

**Not Yet Implemented** - Will be added in Phase 3 (Week 2)

**Plan**:
1. Generate base64-encoded auth state files
2. Add to GitHub Secrets: `GOOGLE_AUTH_STATE`, `GITHUB_AUTH_STATE`
3. Create `.github/workflows/playwright.yml` with auth state restoration
4. Set up 7-day (Google) and 30-day (GitHub) rotation reminders

---

## Resources

- **Strategic Document**: `/docs/test-account-strategy.md` (complete analysis)
- **Playwright Auth Docs**: https://playwright.dev/docs/auth
- **Google OAuth Best Practices**: https://developers.google.com/identity/protocols/oauth2/resources/best-practices
- **GitHub OAuth Rate Limits**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/rate-limits-for-oauth-apps

---

## Support

**Questions?** Check:
1. `/docs/test-account-strategy.md` (comprehensive strategy document)
2. `handoff-notes.md` (implementation roadmap and context)
3. `agent-context.md` (mission overview)

**Issues?** See Troubleshooting section above.

---

**Last Updated**: 2025-10-15  
**Phase**: Phase 2 Implementation Complete  
**Next Steps**: Manual authentication required (Step 3)
