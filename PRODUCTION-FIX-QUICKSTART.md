# PRODUCTION FIX QUICK START

**Issue**: Production website using staging database
**Fix Time**: 15-30 minutes
**Severity**: CRITICAL

---

## FASTEST FIX PATH

### Step 1: Get Supabase Production Credentials (5 min)

1. Go to: https://supabase.com/dashboard/projects
2. Click project: **"aimpactscanner-mvp"**
3. Go to: **Settings → API**
4. Copy these TWO values:

```
Project URL: https://[something].supabase.co
anon public: eyJ[long string]...
```

**Save these** - you need them for Step 2.

---

### Step 2: Add Variables to Netlify (5 min)

1. Go to: https://app.netlify.com/
2. Click your site: **"aimpactscanner"**
3. Go to: **Site settings → Build & deploy → Environment**
4. Click **"New variable"** button

**Add these 4 variables** (one at a time):

#### Variable 1:
```
Key: VITE_SUPABASE_URL
Value: [Paste the Project URL from Step 1]
Scopes: ✓ Production ONLY (uncheck "Deploy previews")
```

#### Variable 2:
```
Key: VITE_SUPABASE_ANON_KEY
Value: [Paste the anon public from Step 1]
Scopes: ✓ Production ONLY (uncheck "Deploy previews")
```

#### Variable 3:
```
Key: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_[your production Stripe key]
Scopes: ✓ Production ONLY
```

#### Variable 4:
```
Key: VITE_STRIPE_COFFEE_PRICE_ID
Value: price_[your production Coffee price ID]
Scopes: ✓ Production ONLY
```

**CRITICAL**: For ALL variables, check ONLY "Production" scope - NOT "Deploy previews"!

---

### Step 3: Rebuild Production (5 min)

1. Stay in Netlify Dashboard
2. Click: **"Deploys"** tab (top)
3. Click: **"Trigger deploy"** → **"Deploy site"**
4. Wait ~3-5 minutes for build

---

### Step 4: Verify Fix (2 min)

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Open: https://aimpactscanner.com
3. Press F12 to open Console
4. Check console logs

**Expected**: Should see your PRODUCTION Supabase URL (NOT `pdmtvkcxnqysujnpcnyh`)

**Test login**:
1. Go to: https://aimpactscanner.com/#login
2. Click Google OAuth
3. Should work without errors

✅ **DONE** - Production now uses production database!

---

## TROUBLESHOOTING

### "I don't see my Netlify site"

Look for site name like:
- `aimpactscanner`
- `aimpactscanner-mvp`
- `aimpact-scanner`

### "Where's my production Supabase project?"

Check Supabase dashboard carefully:
- `aimpactscanner-mvp` = PRODUCTION (use this)
- `impactscanner-staging` = STAGING (NOT this)

### "Still seeing staging database after rebuild"

1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache**: Browser Settings → Clear browsing data
3. **Check build logs**: Netlify Deploys → Click latest deploy → View build log

### "Deploy previews broken"

Make sure deploy preview variables exist with staging credentials:
- Go to: Netlify → Environment variables
- Check "Deploy previews" scope
- Should have staging Supabase URL

---

## FULL DETAILS

See `PRODUCTION-ENV-DIAGNOSIS.md` for complete technical analysis.

---

## EMERGENCY ROLLBACK

If something breaks:

1. Go to: Netlify → Deploys
2. Find previous working deploy
3. Click three dots → "Publish deploy"
4. This reverts to previous version while you fix
