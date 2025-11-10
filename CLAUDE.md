## Communication Guidelines

**User has ADHD** - adapt communication style accordingly:

### Core Principles
- **One step at a time** - wait for confirmation before proceeding
- **Start from current state** - continue from where user left off (don't jump)
- **Brief context** (1-2 sentences why) + **specific instructions** (what to click/type)
- **Keep responses short** - avoid lengthy lists requiring scrolling
- **Expect issues mid-flow** - rarely complete all planned steps without adjustments

### Response Structure
```
1. Brief Context: What we're doing and why (1-2 sentences)
2. Next Step: One specific action from current state
3. Ask: "Done? Ready for next step?"
```

### What NOT to Do
- ❌ Don't dump 10+ steps at once
- ❌ Don't assume previous step completed
- ❌ Don't give vague instructions ("check the settings")
- ❌ Don't jump to new context without closure

### What TO Do
- ✅ Give specific instructions ("Click the blue button labeled 'Save'")
- ✅ Confirm completion before moving forward
- ✅ Offer quick recap if user seems lost
- ✅ Pause and ask if overwhelmed

### Documentation Policy

⛔ **NEVER CREATE DOCUMENTATION FILES UNLESS EXPLICITLY REQUESTED**

**Prohibited**:
- ❌ Implementation guides (e.g., PHASE-X-IMPLEMENTATION-COMPLETE.md)
- ❌ Test reports (e.g., TEST-RESULTS.md, UAT-REPORT.md)
- ❌ Analysis documents (e.g., ANALYSIS.md, INVESTIGATION.md)
- ❌ Summary documents (e.g., EXECUTIVE-SUMMARY.md)
- ❌ Any markdown files that document work completed

**Why**: These create enormous clutter. User will never read them.

**Exceptions** (ASK FIRST):
- README files for new major features (ask before creating)
- API documentation (ask before creating)
- Setup guides for external users (ask before creating)

**Instead**:
- ✅ Update existing `handoff-notes.md` with findings
- ✅ Update existing `progress.md` with changelog entries
- ✅ Update existing `project-plan.md` with task status
- ✅ Communicate findings directly to user in chat

---

## Project Infrastructure

### Supabase Databases

**PRODUCTION (DO NOT TOUCH)**: `pdmtvkcxnqysujnpcnyh.supabase.co`
- Project Name: `aimpactscanner-mvp`
- Used for: Production website ONLY (https://aimpactscanner.com)
- Region: AWS us-east-2
- **⛔ NEVER MODIFY THIS WITHOUT EXPLICIT USER APPROVAL ⛔**
- **⛔ NEVER USE IN LOCAL DEV OR TESTING ⛔**
- **⛔ CHECK BROWSER CONSOLE BEFORE TESTING ⛔**

**STAGING (SAFE FOR TESTING)**: `isgzvwpjokcmtizstwru.supabase.co`
- Project Name: `impactscanner-staging`
- Used for: Deploy previews, staging environment, **AND LOCAL DEVELOPMENT**
- Region: AWS us-east-2
- **✅ THIS IS THE SAFE TESTING DATABASE**

### Deployment Environments

**Local Development**: `http://localhost:5173`
- Uses: **STAGING** Supabase database (`isgzvwpjokcmtizstwru`)
- Safe to test - will NOT affect production

**Staging/Deploy Previews**: `https://develop--aimpactscanner.netlify.app`
- Uses: **STAGING** Supabase database (`isgzvwpjokcmtizstwru`)
- Netlify configuration: `netlify.toml` line 54
- Safe to test - will NOT affect production

**Production**: `https://aimpactscanner.com`
- Uses: **PRODUCTION** Supabase database (`pdmtvkcxnqysujnpcnyh`)
- **⛔ DO NOT MODIFY WITHOUT EXPLICIT APPROVAL ⛔**

### CRITICAL GUARDRAILS

⛔ **NEVER** suggest changes to production Supabase (`pdmtvkcxnqysujnpcnyh`) without explicit user approval
⛔ **NEVER** assume local development uses production database
✅ **ALWAYS** test on staging database (`isgzvwpjokcmtizstwru`) first
✅ **ALWAYS** verify which environment we're working in before suggesting database changes

### Current Testing Environment

**WE ARE TESTING ON**: `http://localhost:5173` (local) OR `https://develop--aimpactscanner.netlify.app` (staging)
**WHICH USES**: `isgzvwpjokcmtizstwru` Supabase database (STAGING)
**SAFE TO MODIFY**: YES - this is the staging/testing database

**⚠️ BEFORE TESTING - VERIFY DATABASE**:
1. Open browser DevTools → Console
2. Look for Supabase client initialization logs
3. Confirm URL contains `isgzvwpjokcmtizstwru` (STAGING)
4. If you see `pdmtvkcxnqysujnpcnyh` (PRODUCTION) → **STOP**

### Environment Setup & Safety Guidelines

⚠️ **CRITICAL**: Always verify which database your environment connects to before testing.

#### Quick Reference

| Environment | Database URL | Project | Safe for Testing? |
|------------|--------------|---------|-------------------|
| Local Dev | `isgzvwpjokcmtizstwru` | impactscanner-staging | ✅ YES |
| Deploy Previews | `isgzvwpjokcmtizstwru` | impactscanner-staging | ✅ YES |
| Production | `pdmtvkcxnqysujnpcnyh` | aimpactscanner-mvp | ❌ NO |

#### Local Development Setup

**1. Create `.env.local` (gitignored)**:
```bash
cp .env.example .env.local
```

**2. Verify `.env.local` uses STAGING database**:
```bash
# Should contain:
VITE_SUPABASE_URL="https://isgzvwpjokcmtizstwru.supabase.co"  # STAGING
VITE_SUPABASE_ANON_KEY="your-staging-anon-key"
```

**3. Verify database connection**:
```bash
npm run dev
# Open browser DevTools → Console
# Should see: isgzvwpjokcmtizstwru.supabase.co (STAGING)
# Should NOT see: pdmtvkcxnqysujnpcnyh.supabase.co (PRODUCTION)
```

#### Pre-Testing Checklist

Before ANY testing (local or staging):

- [ ] Check browser console for Supabase URL
- [ ] Confirm URL is `isgzvwpjokcmtizstwru` (STAGING)
- [ ] If URL is `pdmtvkcxnqysujnpcnyh` (PRODUCTION) → **STOP IMMEDIATELY**
- [ ] Never copy credentials from `.env.production.template`
- [ ] Never test OAuth/Stripe on production database

#### Netlify Configuration

**Deploy Previews** (staging):
- Uses `netlify.toml` → `[context.deploy-preview.environment]`
- Should use: `isgzvwpjokcmtizstwru.supabase.co` (STAGING)
- **Fixed**: November 5, 2025 (commit 79ba318)

**Production**:
- Uses Netlify Dashboard environment variables
- Should use: `pdmtvkcxnqysujnpcnyh.supabase.co` (PRODUCTION)
- **Verification**: Required via Netlify Dashboard

#### Emergency: If You Accidentally Connect to Production

1. **STOP TESTING IMMEDIATELY**
2. Verify `.env.local` or `netlify.toml` configuration
3. Check browser console for Supabase URL
4. If production URL detected:
   - Close all browser tabs
   - Fix `.env.local` to use staging URL
   - Restart dev server
   - Verify in console before continuing
5. Report incident to project lead

#### Historical Context

**October 24-26, 2025**: Phase 5 trial testing accidentally used production database
**Root Cause**: Local dev `.env.local` pointed to production
**Fix**: Updated `.env.local` to staging (Oct 26)
**Remaining Issue**: `netlify.toml` deploy previews still used production
**Final Fix**: Updated `netlify.toml` line 71 (Nov 5, commit 79ba318)

## Active Implementation

**Current Work**: Phase 1 Signup UX Optimization
**Spec**: `/docs/SIGNUP-UX-OPTIMIZATION-PLAN.md`
**Goal**: Increase Coffee tier conversions from 8-12% to 25-35%

## OAuth Testing (Automated)

### Quick Test After OAuth Fixes

To test OAuth redirects after making fixes:

```bash
# Run the OAuth redirect test (takes ~60 seconds)
npx playwright test tests/e2e/test-oauth-redirect.spec.js --headed --project=chromium

# What it tests:
# 1. /#login shows OAuth buttons (not legacy password form)
# 2. Google OAuth completes successfully  
# 3. Redirects to #dashboard (NOT #landing)
# 4. User is authenticated

# Credentials are in .env.test (gitignored)
```

### Test Maintenance

The test uses credentials from `.env.test`:
- `GOOGLE_TEST_EMAIL_1`: Test Google account
- `GOOGLE_TEST_PASSWORD_1`: Password

**Re-run when**:
- OAuth routing logic changes
- Supabase redirect URLs updated
- Hash routing changes
- New OAuth providers added

**File**: `tests/e2e/test-oauth-redirect.spec.js`
