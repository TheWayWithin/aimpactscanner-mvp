# PRODUCTION ISSUE VISUAL FLOWCHART

## THE PROBLEM

```
Current (BROKEN):
┌──────────────────────────────────────────┐
│  User visits aimpactscanner.com          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Netlify serves production bundle        │
│  Built with: WRONG environment vars      │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Bundle contains HARDCODED:              │
│  VITE_SUPABASE_URL =                     │
│  "pdmtvkcxnqysujnpcnyh.supabase.co"      │
│  (This is STAGING database!)             │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Production users connect to             │
│  ❌ STAGING DATABASE                     │
└──────────────────────────────────────────┘
```

## THE FIX

```
After Fix (CORRECT):
┌──────────────────────────────────────────┐
│  User visits aimpactscanner.com          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Netlify serves production bundle        │
│  Built with: CORRECT environment vars    │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Bundle contains HARDCODED:              │
│  VITE_SUPABASE_URL =                     │
│  "[production-ref].supabase.co"          │
│  (This is PRODUCTION database!)          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  Production users connect to             │
│  ✅ PRODUCTION DATABASE                  │
└──────────────────────────────────────────┘
```

---

## WHY CHANGING DOMAIN DOESN'T FIX IT

```
❌ WRONG THINKING:
┌─────────────────┐
│ Change domain   │  NO! Domain doesn't matter.
│ from staging    │  The database URL is already
│ to production   │  BAKED INTO the JavaScript bundle
└─────────────────┘

✅ CORRECT THINKING:
┌─────────────────┐
│ Rebuild bundle  │  YES! Build with correct env vars
│ with correct    │  to bake the right URL into
│ env variables   │  the JavaScript bundle
└─────────────────┘
```

**Key Concept**: Vite is a **build tool**. It replaces `import.meta.env.*` with actual strings **at build time**, not runtime. The domain you visit doesn't change what's already built into the code.

---

## BUILD TIME vs RUNTIME

```
BUILD TIME (happens on Netlify):
┌─────────────────────────────────────────┐
│ 1. Netlify reads environment variables  │
│    from Dashboard                       │
├─────────────────────────────────────────┤
│ 2. Vite builds JavaScript bundle        │
│    Replaces: import.meta.env.*          │
│    With actual strings from env vars    │
├─────────────────────────────────────────┤
│ 3. Bundle saved to /dist folder         │
│    URL is now HARDCODED in bundle       │
└─────────────────────────────────────────┘

RUNTIME (happens in user's browser):
┌─────────────────────────────────────────┐
│ 1. User visits site                     │
├─────────────────────────────────────────┤
│ 2. Browser downloads JavaScript bundle  │
│    from Netlify CDN                     │
├─────────────────────────────────────────┤
│ 3. JavaScript runs with HARDCODED URL   │
│    (URL cannot be changed at runtime)   │
└─────────────────────────────────────────┘
```

**Why This Matters**: You must rebuild with correct env vars. Just changing settings without rebuilding won't work because the old bundle still has the wrong URL hardcoded.

---

## NETLIFY ENVIRONMENT VARIABLE SCOPES

```
┌─────────────────────────────────────────────────┐
│            NETLIFY DASHBOARD                    │
│  Site: aimpactscanner                           │
├─────────────────────────────────────────────────┤
│  Environment Variables:                         │
│                                                 │
│  ┌───────────────────────────────────────┐     │
│  │ VITE_SUPABASE_URL                     │     │
│  ├───────────────────────────────────────┤     │
│  │ Value: [production-url]               │     │
│  │ Scopes: ✓ Production                  │     │
│  │         □ Deploy previews             │     │
│  └───────────────────────────────────────┘     │
│           ▲                       ▲             │
│           │                       │             │
│    Only used when          Never used for      │
│    building production     deploy previews     │
│           │                       │             │
└───────────┼───────────────────────┼─────────────┘
            │                       │
            ▼                       ▼
  ┌──────────────────┐    ┌──────────────────┐
  │  Production      │    │  Deploy Preview  │
  │  Branch: main    │    │  Branch: develop │
  │  URL: prod.com   │    │  URL: preview... │
  └──────────────────┘    └──────────────────┘
```

**Key Point**: Scope determines WHEN the variable is used during build. Production scope = only for production branch builds.

---

## CURRENT CONFIGURATION GAPS

```
netlify.toml Configuration:

┌─────────────────────────────────────────┐
│ [context.production.environment]        │
│   NODE_ENV = "production"               │
│   ❌ Missing: VITE_SUPABASE_URL         │
│   ❌ Missing: VITE_SUPABASE_ANON_KEY    │
│   ❌ Missing: VITE_STRIPE_...           │
└─────────────────────────────────────────┘
                   │
                   ▼
        ⚠️ Variables not set in netlify.toml
        ⚠️ Variables not set in Netlify Dashboard
                   │
                   ▼
        ❌ Build uses undefined/wrong values
                   │
                   ▼
        ❌ Staging URL gets baked into bundle
```

---

## AFTER FIX - PROPER SETUP

```
┌────────────────────────────────────────────────────┐
│               NETLIFY DASHBOARD                    │
│                                                    │
│  Environment Variables for Production Scope:      │
│  ✓ VITE_SUPABASE_URL = [production URL]           │
│  ✓ VITE_SUPABASE_ANON_KEY = [production key]      │
│  ✓ VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...      │
│  ✓ VITE_STRIPE_COFFEE_PRICE_ID = price_...        │
└────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Trigger Deploy       │
            │  (Rebuild with vars)  │
            └───────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│  Netlify Build Process:                            │
│  1. Reads env vars from Dashboard (Production)     │
│  2. npm ci --include=dev && npm run build          │
│  3. Vite replaces import.meta.env.* with values    │
│  4. Bundle saved with CORRECT URLs                 │
└────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│  Production Deployment:                            │
│  ✅ Bundle has production database URL             │
│  ✅ Users connect to production database           │
│  ✅ Payments use production Stripe                 │
└────────────────────────────────────────────────────┘
```

---

## TWO-SITE ARCHITECTURE (CURRENT)

```
┌──────────────────────────────────────────────────────────┐
│             SINGLE NETLIFY SITE                          │
│             "aimpactscanner"                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────┐  ┌─────────────────────┐   │
│  │  PRODUCTION CONTEXT    │  │  DEPLOY PREVIEW     │   │
│  │                        │  │  CONTEXT            │   │
│  │  Branch: main          │  │  Branch: develop    │   │
│  │  Domain: prod.com      │  │  Domain: preview... │   │
│  │  Database: PRODUCTION  │  │  Database: STAGING  │   │
│  │  Stripe: Live keys     │  │  Stripe: Test keys  │   │
│  └────────────────────────┘  └─────────────────────┘   │
│              ▲                          ▲               │
│              │                          │               │
│              │                          │               │
│    ┌─────────────────┐      ┌──────────────────┐      │
│    │ Production Env  │      │ Preview Env Vars │      │
│    │ Variables       │      │ (from toml or    │      │
│    │ (Dashboard)     │      │  Dashboard)      │      │
│    └─────────────────┘      └──────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Benefits**:
- Single site to manage
- Context-based environment variables
- Same codebase, different configs
- Clear separation of production/staging

---

## WHAT HAPPENS AT EACH STEP

### Step 1: Developer Pushes Code

```
Developer → Git Push to 'main' branch
                     │
                     ▼
          GitHub Repository
                     │
                     ▼
         Netlify detects push
                     │
                     ▼
        Triggers production build
```

### Step 2: Netlify Build Process

```
┌─────────────────────────────────────────┐
│ Netlify Build Environment               │
├─────────────────────────────────────────┤
│ 1. Clone repository                     │
│ 2. Checkout 'main' branch               │
│ 3. Load 'production' context            │
│ 4. Inject environment variables         │
│    from Dashboard (Production scope)    │
│ 5. Run: npm ci --include=dev            │
│ 6. Run: npm run build                   │
│    └─> vite build                       │
│        └─> Replace import.meta.env.*    │
│            with actual values           │
│ 7. Output: /dist folder with bundle     │
└─────────────────────────────────────────┘
```

### Step 3: User Visits Site

```
User → aimpactscanner.com
            │
            ▼
   Netlify CDN serves /dist
            │
            ▼
   Browser downloads bundle
            │
            ▼
   JavaScript executes
            │
            ▼
   Supabase client initialized
   with HARDCODED URL from bundle
            │
            ▼
   Connection to database
   (Production if built correctly,
    Staging if built with wrong vars)
```

---

## COMMON MISCONCEPTIONS

### ❌ Misconception 1: "Domain determines database"

**Wrong**: Changing domain from `staging.com` to `production.com` will fix it.

**Right**: Domain doesn't matter. Database URL is in the JavaScript bundle, which is the same regardless of domain.

### ❌ Misconception 2: "Runtime configuration"

**Wrong**: Supabase client reads URL from environment at runtime.

**Right**: Vite injects URL at BUILD TIME. Runtime can't change it.

### ❌ Misconception 3: "User's browser has env vars"

**Wrong**: Browser reads `.env` file or environment variables.

**Right**: `.env` files only exist on developer machine and build server. Browser only sees JavaScript bundle with hardcoded values.

### ❌ Misconception 4: "netlify.toml is enough"

**Wrong**: Setting variables in `netlify.toml` is sufficient.

**Right**: For security, production credentials should be in Netlify Dashboard, NOT in repository files. `netlify.toml` can document what's needed, but actual values go in Dashboard.

---

## VERIFICATION AFTER FIX

### Check 1: Browser Console

```
Expected Output:
✅ "Connecting to: https://[production-ref].supabase.co"

Failure Output:
❌ "Connecting to: https://pdmtvkcxnqysujnpcnyh.supabase.co"
```

### Check 2: Network Tab

```
Open DevTools → Network Tab → Filter: supabase

Expected:
✅ Requests to production Supabase domain
✅ Status: 200 OK

Failure:
❌ Requests to staging Supabase domain
```

### Check 3: Build Log

```
Netlify Dashboard → Deploys → Latest Deploy → View Log

Look for:
✅ "Building with production environment variables"
✅ "Build succeeded"

Avoid:
❌ "Environment variable not set" warnings
❌ "Build failed" errors
```

---

## EMERGENCY CONTACTS

**If something breaks during fix**:

1. **Rollback immediately**:
   - Netlify Dashboard → Deploys
   - Find previous working deploy
   - Click "Publish deploy" (instant rollback)

2. **Get help**:
   - Netlify Support: https://app.netlify.com/support
   - Supabase Support: https://supabase.com/dashboard/support

3. **Debug**:
   - Check build logs for errors
   - Verify environment variables are set correctly
   - Ensure production Supabase project exists
   - Confirm production database has correct schema

---

**Document**: Visual flowchart companion to PRODUCTION-ENV-DIAGNOSIS.md
**Author**: THE OPERATOR (AGENT-11)
**Date**: 2025-10-24
