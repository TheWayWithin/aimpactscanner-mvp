# PRODUCTION ENVIRONMENT MISCONFIGURATION DIAGNOSIS

**Date**: 2025-10-24
**Severity**: CRITICAL - Production website connecting to staging database
**Impact**: All production users are writing to staging database, data loss risk, security exposure

---

## INCIDENT SUMMARY

Production website at `https://aimpactscanner.com` is connecting to STAGING Supabase database instead of production database.

**Evidence**:
- User on production domain: `https://aimpactscanner.com/#oauth-callback`
- Console errors show: `pdmtvkcxnqysujnpcnyh.supabase.co` (staging database)
- Should show: Production database URL from `aimpactscanner-mvp` Supabase project

---

## ROOT CAUSE ANALYSIS

### Issue: Netlify Environment Variables Not Set for Production Context

**Current Configuration** (from `netlify.toml`):

```toml
# Lines 49-56 from netlify.toml
[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  # Use test keys for deploy previews
  VITE_SUPABASE_URL = "https://pdmtvkcxnqysujnpcnyh.supabase.co"
  # VITE_SUPABASE_ANON_KEY = "your-test-anon-key"
  # VITE_STRIPE_PUBLISHABLE_KEY = "pk_test_your-test-publishable-key"
  # VITE_STRIPE_COFFEE_PRICE_ID = "price_your-test-coffee-price-id"
```

**Problem Identified**:
1. ❌ **Production context has ONLY `NODE_ENV`** - no Supabase credentials
2. ❌ **Deploy-preview context has staging Supabase URL** - correct for previews
3. ❌ **Missing production Supabase environment variables in production context**

**Why This Causes Production to Use Staging Database**:

When Vite builds the application, it **injects environment variables at BUILD TIME** (not runtime). Here's what happens:

1. **Netlify production build runs** with context `production`
2. **`netlify.toml` provides NO Supabase credentials** in production context
3. **Vite looks for `VITE_SUPABASE_URL`** - NOT FOUND in production context
4. **Fallback behavior**: Either uses default from code OR picks up staging URL from another source
5. **Production bundle is built with WRONG credentials baked in**
6. **Result**: Production domain serves bundle with staging database URL hardcoded

---

## CONFIGURATION ARCHITECTURE

### How Vite Handles Environment Variables

```javascript
// From src/lib/supabaseClient.js (lines 4-5)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

**Critical Understanding**:
- Vite replaces `import.meta.env.*` at **BUILD TIME**
- The values are **hardcoded into the JavaScript bundle**
- Changing domain or runtime environment **DOES NOT** change these values
- **Only rebuilding with correct environment variables fixes this**

### Current File Structure

```
project/
├── .env.local              # Local development (gitignored)
├── .env.staging            # Staging config (gitignored)
├── .env.production.template # Template for production (gitignored)
├── .env.example            # Example file (in repo)
└── netlify.toml            # Netlify configuration (in repo)
```

**Security Note**: `.env.*` files are gitignored - production credentials should NEVER be in the repository.

---

## NETLIFY ARCHITECTURE

### Current Setup (from git history)

**Repository**: `https://github.com/TheWayWithin/aimpactscanner-mvp`

**Branch Structure**:
- `develop` - Deploy previews branch
- `main` (or `master`) - Production branch

**Netlify Build Settings** (from `netlify.toml`):
- Build command: `npm ci --include=dev && npm run build`
- Publish directory: `dist`
- Node version: 20.19.0

### Expected Netlify Site Configuration

**SHOULD BE**: Single Netlify site with two contexts:

1. **Production Context**:
   - Domain: `aimpactscanner.com`
   - Branch: `main` (or `master`)
   - Environment Variables: Production Supabase + Production Stripe

2. **Deploy Preview Context**:
   - Domain: `https://develop--aimpactscanner.netlify.app`
   - Branch: `develop`
   - Environment Variables: Staging Supabase + Test Stripe

---

## REQUIRED PRODUCTION CREDENTIALS

### Supabase Production Project

**Project Name**: `aimpactscanner-mvp`
**Location**: Supabase Dashboard → Project `aimpactscanner-mvp` → Settings → API

**Required Values**:
1. **Project URL**: `https://[project-ref].supabase.co`
   - Will be DIFFERENT from `pdmtvkcxnqysujnpcnyh` (that's staging)
2. **Anon Public Key**: `eyJ...` (JWT token, safe to expose in frontend)

**How to Find**:
```
1. Go to: https://supabase.com/dashboard/projects
2. Select project: "aimpactscanner-mvp"
3. Navigate to: Settings → API
4. Copy:
   - Project URL (API URL)
   - anon public key
```

### Stripe Production Keys

**Location**: Stripe Dashboard → Developers → API Keys

**Required Values**:
1. **Publishable Key**: `pk_live_...` (NOT `pk_test_...`)
2. **Coffee Price ID**: `price_...` (production Coffee tier price ID)

**Note**: DO NOT use test keys (`pk_test_...`) in production.

---

## STEP-BY-STEP FIX INSTRUCTIONS

### Part 1: Get Production Credentials

**Action**: Retrieve production Supabase credentials

1. Open: https://supabase.com/dashboard/projects
2. Select project: **"aimpactscanner-mvp"**
3. Go to: **Settings → API**
4. Copy these values:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: `eyJ...`

**Save these temporarily** - you'll need them for Part 2.

### Part 2: Configure Netlify Environment Variables

**Action**: Add production environment variables to Netlify Dashboard

#### Step 2.1: Access Netlify Site Settings

1. Go to: https://app.netlify.com/
2. Select your site (likely named `aimpactscanner`)
3. Navigate to: **Site settings → Build & deploy → Environment**

#### Step 2.2: Add Production Environment Variables

Click **"New variable"** and add these **FOUR** variables:

**Variable 1: Supabase URL**
```
Key: VITE_SUPABASE_URL
Value: [Production Supabase URL from Part 1]
Scopes: Production ✓ (ONLY check Production)
```

**Variable 2: Supabase Anon Key**
```
Key: VITE_SUPABASE_ANON_KEY
Value: [Production anon public key from Part 1]
Scopes: Production ✓ (ONLY check Production)
```

**Variable 3: Stripe Publishable Key**
```
Key: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... [Your production Stripe publishable key]
Scopes: Production ✓ (ONLY check Production)
```

**Variable 4: Stripe Coffee Price ID**
```
Key: VITE_STRIPE_COFFEE_PRICE_ID
Value: price_... [Your production Coffee tier price ID]
Scopes: Production ✓ (ONLY check Production)
```

**CRITICAL**:
- ✅ **ONLY check "Production"** scope - NOT "Deploy previews"
- ❌ **DO NOT add to deploy-preview scope** - those should use staging credentials

#### Step 2.3: Verify Deploy Preview Variables

Check that deploy previews are using staging credentials:

**Expected Variables for Deploy Previews**:
```
VITE_SUPABASE_URL = https://pdmtvkcxnqysujnpcnyh.supabase.co
VITE_SUPABASE_ANON_KEY = [Staging anon key]
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_... [Test Stripe key]
VITE_STRIPE_COFFEE_PRICE_ID = price_... [Test price ID]
```

Scopes: **Deploy previews ✓** (NOT Production)

### Part 3: Trigger Production Rebuild

**Action**: Force Netlify to rebuild production with new environment variables

**Option A: Via Netlify Dashboard** (Recommended)
1. Navigate to: **Deploys**
2. Click: **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete (~3-5 minutes)

**Option B: Via Git Push**
1. Make a trivial commit to `main` branch
2. Push to trigger automatic deployment

### Part 4: Verify Fix

**Action**: Confirm production is using correct database

1. **Clear browser cache** (important!)
2. Open production site: `https://aimpactscanner.com`
3. Open browser DevTools Console (F12)
4. Look for Supabase connection logs
5. **Expected**: Should see production Supabase URL (NOT `pdmtvkcxnqysujnpcnyh`)

**Test OAuth Flow**:
1. Go to: `https://aimpactscanner.com/#login`
2. Click Google OAuth
3. Check console for errors
4. **Expected**: No Supabase connection errors

---

## VERIFICATION CHECKLIST

After applying fix, verify:

- [ ] Production site (`aimpactscanner.com`) shows production Supabase URL in console
- [ ] OAuth login works without database errors
- [ ] Deploy preview (`develop--aimpactscanner.netlify.app`) still uses staging database
- [ ] New users created in production go to PRODUCTION database
- [ ] Stripe payments use production keys (`pk_live_...`)

---

## NETLIFY DASHBOARD NAVIGATION GUIDE

### Finding Your Site

```
1. Login: https://app.netlify.com/
2. Click: "Sites" in left sidebar
3. Find site: "aimpactscanner" (or similar name)
4. Click the site name
```

### Finding Environment Variables

```
From site dashboard:
1. Click: "Site settings" (top navigation)
2. Scroll to: "Build & deploy" section (left sidebar)
3. Click: "Environment"
4. Click: "New variable" to add variables
```

### Finding Deploy Settings

```
From site dashboard:
1. Click: "Deploys" (top navigation)
2. View recent deploys
3. Click: "Trigger deploy" → "Deploy site" to rebuild
```

---

## PREVENTIVE MEASURES

### Update netlify.toml (Optional but Recommended)

**Current Problem**: `netlify.toml` only documents staging credentials in comments.

**Improvement**: Add production variable names as documentation:

```toml
[context.production.environment]
  NODE_ENV = "production"
  # Production credentials MUST be set in Netlify Dashboard:
  # - VITE_SUPABASE_URL = [Set in Dashboard - NOT in repo]
  # - VITE_SUPABASE_ANON_KEY = [Set in Dashboard - NOT in repo]
  # - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_... [Set in Dashboard]
  # - VITE_STRIPE_COFFEE_PRICE_ID = price_... [Set in Dashboard]

[context.deploy-preview.environment]
  # Use test keys for deploy previews
  VITE_SUPABASE_URL = "https://pdmtvkcxnqysujnpcnyh.supabase.co"
  # VITE_SUPABASE_ANON_KEY = [Set in Dashboard]
  # VITE_STRIPE_PUBLISHABLE_KEY = pk_test_... [Set in Dashboard]
  # VITE_STRIPE_COFFEE_PRICE_ID = price_... [Set in Dashboard]
```

**Why Comments Only**: Never commit production credentials to repository - security risk.

### Create Deployment Checklist

Add to repository documentation:

```markdown
## Production Deployment Checklist

Before going live:
- [ ] Production Supabase project created
- [ ] Production Stripe account configured
- [ ] Environment variables set in Netlify Dashboard (Production scope ONLY)
- [ ] Test deployment triggered and successful
- [ ] OAuth redirect URLs configured in Supabase Dashboard
- [ ] Stripe webhook configured with production edge function URL
```

---

## ADDITIONAL CONTEXT

### Why This Happened

**Most Likely Cause**: Initial deployment used staging credentials as placeholder, never updated.

**Timeline Reconstruction**:
1. Project setup → Used staging database for testing
2. Domain `aimpactscanner.com` configured → Pointed to same Netlify site
3. Production database created → Environment variables never updated in Netlify
4. **Result**: Production domain serving staging database bundle

### Production vs Staging Architecture

**Current Setup** (Recommended):

```
Netlify Site: "aimpactscanner"
├── Production Context (aimpactscanner.com)
│   ├── Branch: main
│   ├── Database: aimpactscanner-mvp (production)
│   └── Stripe: Live keys
└── Deploy Preview Context (develop--aimpactscanner.netlify.app)
    ├── Branch: develop
    ├── Database: impactscanner-staging
    └── Stripe: Test keys
```

**NOT Using** (Less common):
- Two separate Netlify sites
- Different repositories for staging/production

---

## SECURITY CONSIDERATIONS

### What This Incident Exposed

1. **Data Contamination**: Production users writing to staging database
2. **Data Loss Risk**: Staging database may be reset during development
3. **Credential Exposure**: Production users saw staging database URL in console
4. **Payment Issues**: May have used test Stripe keys in production

### Immediate Security Actions

After fix is applied:

1. **Audit User Data**: Check staging database for production user accounts created after domain launch
2. **Migrate Data**: Move any production user data from staging to production database
3. **Verify Payments**: Confirm all payments went through production Stripe (not test mode)
4. **Reset Test Database**: Consider resetting staging database after data migration

### Long-Term Security

- ✅ **Never commit production credentials** to repository
- ✅ **Use Netlify environment variables** for all sensitive keys
- ✅ **Use different database projects** for staging and production
- ✅ **Regularly audit environment configurations**
- ✅ **Document credential management** in team runbooks

---

## CONTACT FOR HELP

If you encounter issues during the fix:

**Netlify Support**:
- Dashboard: https://app.netlify.com/support
- Docs: https://docs.netlify.com/configure-builds/environment-variables/

**Supabase Support**:
- Dashboard: https://supabase.com/dashboard/support
- Docs: https://supabase.com/docs/guides/getting-started

**This Repository**:
- GitHub Issues: https://github.com/TheWayWithin/aimpactscanner-mvp/issues
- File: `PRODUCTION-ENV-DIAGNOSIS.md`

---

## STATUS

**Current State**: ❌ Production using staging database
**Expected Resolution Time**: 15-30 minutes (once credentials obtained)
**Risk Level**: CRITICAL - production data at risk
**Action Required**: Immediate - update Netlify environment variables and rebuild

---

## APPENDIX: Technical Details

### Vite Environment Variable Behavior

```javascript
// Build time (when Netlify builds your site):
const url = import.meta.env.VITE_SUPABASE_URL
// Vite replaces this with actual string:
const url = "https://pdmtvkcxnqysujnpcnyh.supabase.co"
// This string is BAKED INTO the JavaScript bundle

// Runtime (when user visits site):
// The bundle already has the URL hardcoded
// Changing environment does NOT change this value
// Only rebuilding with correct env vars fixes it
```

### Netlify Build Context Priority

Netlify resolves environment variables in this order:

1. **Netlify Dashboard Environment Variables** (highest priority)
2. **netlify.toml context-specific variables**
3. **netlify.toml global variables**
4. **.env files** (NOT uploaded to Netlify, local only)

**For Production**: Dashboard variables override `netlify.toml`.

### Related Files in Repository

- `/netlify.toml` - Netlify configuration (lines 49-56 show context config)
- `/src/lib/supabaseClient.js` - Supabase initialization (lines 4-5 use env vars)
- `/.env.example` - Template for environment variables
- `/.env.production.template` - Template for production credentials (gitignored)
- `/.gitignore` - Contains `.env.*` to prevent credential commits

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: THE OPERATOR (AGENT-11)
