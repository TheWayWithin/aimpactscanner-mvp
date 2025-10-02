# Pre-Testing Checklist for Operator

**Mission**: Configure infrastructure dependencies before E2E testing
**Owner**: @operator
**Priority**: CRITICAL - BLOCKS ALL E2E TESTING
**Estimated Time**: 2-3 hours

---

## Overview

This checklist contains **MANDATORY** configuration tasks that must be completed before the tester can execute end-to-end tests of the OAuth-first authentication and monetization system.

**Until these tasks are complete, E2E tests will be marked as SKIPPED or BLOCKED.**

---

## Checklist Status

**Overall Status**: ⏰ PENDING

| Category | Status | Items Complete | Blocker |
|----------|--------|----------------|---------|
| OAuth Configuration | ⏰ PENDING | 0/6 | YES |
| Database Migrations | ⏰ PENDING | 0/4 | YES |
| Stripe Integration | ⏰ PENDING | 0/8 | YES |
| Edge Functions | ⏰ PENDING | 0/4 | YES |
| Environment Variables | ⏰ PENDING | 0/5 | YES |
| Deployment | ⏰ PENDING | 0/4 | NO |

---

## 1. OAuth Provider Configuration

### Google OAuth (CRITICAL - BLOCKS Journey A, B, C)

**Status**: ⏰ PENDING

**Steps**:

1. **Create Google Cloud Project**:
   - [ ] Go to https://console.cloud.google.com/
   - [ ] Click "Create Project"
   - [ ] Name: "AImpactScanner Production"
   - [ ] Organization: [Your organization]
   - [ ] Click "Create"

2. **Configure OAuth Consent Screen**:
   - [ ] Navigate to "APIs & Services" → "OAuth consent screen"
   - [ ] Select "External" user type
   - [ ] Fill in app information:
     - App name: AImpactScanner
     - User support email: support@aimpactscanner.com
     - Developer contact: [Your email]
   - [ ] Add scopes: `email`, `profile` (no additional scopes)
   - [ ] Save and continue

3. **Create OAuth 2.0 Credentials**:
   - [ ] Navigate to "Credentials" tab
   - [ ] Click "Create Credentials" → "OAuth client ID"
   - [ ] Application type: "Web application"
   - [ ] Name: "AImpactScanner Web Client"
   - [ ] Authorized redirect URIs:
     - Production: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
     - Localhost: `http://localhost:54321/auth/v1/callback`
   - [ ] Click "Create"
   - [ ] **SAVE** Client ID and Client Secret (store securely!)

4. **Configure Supabase Google Provider**:
   - [ ] Go to Supabase Dashboard: https://app.supabase.com/
   - [ ] Navigate to "Authentication" → "Providers"
   - [ ] Find "Google" provider
   - [ ] Toggle "Enable Sign in with Google"
   - [ ] Enter Client ID: [from step 3]
   - [ ] Enter Client Secret: [from step 3]
   - [ ] Authorized Client IDs: Leave empty (unless using mobile)
   - [ ] Skip profile URL: Unchecked
   - [ ] Click "Save"

5. **Verify OAuth Configuration**:
   ```bash
   # Query Supabase config (if accessible)
   curl -X GET \
     https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/settings \
     -H "apikey: ${SUPABASE_ANON_KEY}"
   ```
   - [ ] **VERIFY**: `external_google_enabled: true`
   - [ ] **VERIFY**: Redirect URI matches Supabase callback

6. **Test Google OAuth Flow**:
   - [ ] Visit https://aimpactscanner.com/register
   - [ ] Click "Continue with Google"
   - [ ] **VERIFY**: Redirected to Google OAuth consent screen
   - [ ] **VERIFY**: App name "AImpactScanner" shown
   - [ ] **VERIFY**: Requested scopes: email, profile only
   - [ ] Select test account, grant permissions
   - [ ] **VERIFY**: Redirected back to app successfully
   - [ ] **VERIFY**: User authenticated (check session in browser console)
   - [ ] **VERIFY**: User record created in `users` table

**Verification SQL**:
```sql
-- Check user created via Google OAuth
SELECT id, email, auth_provider, tier, created_at
FROM users
WHERE auth_provider = 'google'
ORDER BY created_at DESC
LIMIT 5;
```

**Troubleshooting**:
- **Error**: "Redirect URI mismatch" → Check URIs in Google Console match Supabase exactly
- **Error**: "Access denied" → Check OAuth consent screen is configured and published
- **Error**: "Invalid client" → Verify Client ID/Secret copied correctly

---

### GitHub OAuth (CRITICAL - BLOCKS Journey B)

**Status**: ⏰ PENDING

**Steps**:

1. **Create GitHub OAuth App**:
   - [ ] Go to https://github.com/settings/developers
   - [ ] Click "New OAuth App"
   - [ ] Fill in application details:
     - Application name: AImpactScanner
     - Homepage URL: https://aimpactscanner.com
     - Application description: "AI-powered website analysis tool"
     - Authorization callback URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - [ ] Click "Register application"
   - [ ] **SAVE** Client ID

2. **Generate Client Secret**:
   - [ ] Click "Generate a new client secret"
   - [ ] **SAVE** Client Secret (CRITICAL: only shown once!)

3. **Configure Supabase GitHub Provider**:
   - [ ] Supabase Dashboard → "Authentication" → "Providers"
   - [ ] Find "GitHub" provider
   - [ ] Toggle "Enable Sign in with GitHub"
   - [ ] Enter Client ID: [from step 1]
   - [ ] Enter Client Secret: [from step 2]
   - [ ] Click "Save"

4. **Test GitHub OAuth Flow**:
   - [ ] Visit signup page
   - [ ] Click "Continue with GitHub"
   - [ ] **VERIFY**: Redirected to GitHub authorization page
   - [ ] **VERIFY**: App name "AImpactScanner" shown
   - [ ] **VERIFY**: Requested permission: "email addresses (read-only)"
   - [ ] Authorize app
   - [ ] **VERIFY**: Redirected back successfully
   - [ ] **VERIFY**: User authenticated
   - [ ] **VERIFY**: User record created with `auth_provider='github'`

**Verification SQL**:
```sql
-- Check user created via GitHub OAuth
SELECT id, email, auth_provider, tier
FROM users
WHERE auth_provider = 'github'
ORDER BY created_at DESC
LIMIT 5;
```

**Troubleshooting**:
- **Error**: "Redirect URI mismatch" → GitHub callback URL must match Supabase exactly
- **Error**: "Email not public" → User's primary email must be public on GitHub profile
  - **Fix**: In GitHub settings, make primary email public, or request `user:email` scope

---

## 2. Database Migrations

### Migration 021: Auth & Tier Columns (CRITICAL)

**Status**: ⏰ PENDING

**File**: `/supabase/migrations/021_auth_monetization_tier_routing.sql`

**Steps**:

1. **Verify Migration File Exists**:
   ```bash
   ls -la /Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/021_*.sql
   ```
   - [ ] File exists: `021_auth_monetization_tier_routing.sql`

2. **Review Migration Contents**:
   - [ ] Columns to add: `auth_provider`, `selected_tier`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `is_first_login`, `signup_source`
   - [ ] Indexes created for performance
   - [ ] Existing users backfilled with default values

3. **Deploy Migration to Production**:
   ```bash
   cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp
   supabase db push --db-url $SUPABASE_DB_URL
   ```
   - [ ] Migration executed successfully
   - [ ] No errors in output

4. **Verify Columns Created**:
   ```sql
   -- Check all new columns exist
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'users'
     AND column_name IN (
       'auth_provider', 'selected_tier', 'subscription_status',
       'stripe_customer_id', 'stripe_subscription_id', 'is_first_login'
     );
   ```
   - [ ] **VERIFY**: All 6 columns exist
   - [ ] **VERIFY**: `is_first_login` default value is `true`
   - [ ] **VERIFY**: `subscription_status` default is `'active'`

5. **Verify Indexes Created**:
   ```sql
   -- Check indexes
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'users'
     AND indexname LIKE 'idx_users_%';
   ```
   - [ ] **VERIFY**: Indexes exist for `auth_provider`, `tier`, `subscription_status`, `stripe_customer_id`, `is_first_login`

6. **Test Column Access**:
   ```sql
   -- Test inserting test user with new columns
   INSERT INTO users (email, tier, auth_provider, selected_tier, is_first_login)
   VALUES ('test-migration@example.com', 'free', 'google', 'coffee', true)
   RETURNING *;
   ```
   - [ ] **VERIFY**: Insert succeeds
   - [ ] **VERIFY**: All columns populated correctly

**Troubleshooting**:
- **Error**: "Column already exists" → Migration already ran, skip or create new migration
- **Error**: "Permission denied" → Check database role has ALTER TABLE permission

---

### Migration 022: Waitlist Table (HIGH PRIORITY)

**Status**: ⏰ PENDING

**File**: `/supabase/migrations/022_waitlist_capture.sql`

**Steps**:

1. **Verify Migration File**:
   ```bash
   ls -la /Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/022_*.sql
   ```
   - [ ] File exists: `022_waitlist_capture.sql`

2. **Deploy Migration**:
   ```bash
   supabase db push --db-url $SUPABASE_DB_URL
   ```
   - [ ] Migration executed

3. **Verify Table Created**:
   ```sql
   -- Check waitlist table structure
   \d waitlist

   -- Expected columns: id, user_id, email, current_tier, interested_tier, joined_at, notified, notified_at
   ```
   - [ ] Table exists
   - [ ] UNIQUE constraint on `(user_id, interested_tier)`
   - [ ] RLS policies enabled

4. **Test Waitlist Function**:
   ```sql
   -- Test join_waitlist function (as authenticated user)
   SELECT * FROM join_waitlist('growth');
   ```
   - [ ] Function returns success
   - [ ] Waitlist entry created
   - [ ] Duplicate entry prevented (UNIQUE constraint)

**Troubleshooting**:
- **Error**: "Function does not exist" → Check `join_waitlist()` function created in migration
- **Error**: "RLS policy violation" → Check authenticated user has INSERT permission

---

## 3. Stripe Integration

### Stripe Account Setup (CRITICAL - BLOCKS Coffee Tier)

**Status**: ⏰ PENDING

**Steps**:

1. **Create Stripe Account** (if not exists):
   - [ ] Go to https://stripe.com/
   - [ ] Sign up for account
   - [ ] Complete account verification
   - [ ] **USE TEST MODE** for all testing

2. **Create Coffee Plan Product**:
   - [ ] Stripe Dashboard → "Products"
   - [ ] Click "Add product"
   - [ ] Product information:
     - Name: AImpactScanner Coffee Plan
     - Description: Unlimited AI-powered website analyses
     - Image: [Upload product image]
   - [ ] Pricing information:
     - Recurring: Monthly
     - Price: $4.95 USD
     - Billing period: Monthly
   - [ ] Click "Save product"
   - [ ] **SAVE** Price ID (e.g., `price_1234567890`)

3. **Configure Payment Methods**:
   - [ ] Stripe Dashboard → "Settings" → "Payment methods"
   - [ ] Enable: Cards (minimum)
   - [ ] Optional: Enable Apple Pay, Google Pay
   - [ ] Save settings

4. **Create Webhook Endpoint**:
   - [ ] Stripe Dashboard → "Developers" → "Webhooks"
   - [ ] Click "Add endpoint"
   - [ ] Endpoint URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
   - [ ] Description: "Coffee plan subscription webhooks"
   - [ ] Events to send:
     - [x] `checkout.session.completed`
     - [x] `customer.subscription.created`
     - [x] `customer.subscription.updated`
     - [x] `customer.subscription.deleted`
     - [x] `invoice.payment_succeeded`
     - [x] `invoice.payment_failed`
   - [ ] Click "Add endpoint"
   - [ ] **SAVE** Webhook signing secret (starts with `whsec_...`)

5. **Get API Keys**:
   - [ ] Stripe Dashboard → "Developers" → "API keys"
   - [ ] **SAVE** Publishable key (starts with `pk_test_...`)
   - [ ] **SAVE** Secret key (starts with `sk_test_...`)
   - [ ] **CRITICAL**: NEVER commit secret key to Git!

6. **Test Stripe Checkout Session Creation**:
   ```bash
   # Test creating checkout session via API
   curl -X POST https://api.stripe.com/v1/checkout/sessions \
     -u sk_test_XXXXXX: \
     -d "success_url=https://aimpactscanner.com/checkout-success?session_id={CHECKOUT_SESSION_ID}" \
     -d "cancel_url=https://aimpactscanner.com/checkout-cancel" \
     -d "mode=subscription" \
     -d "line_items[0][price]=price_1234567890" \
     -d "line_items[0][quantity]=1"
   ```
   - [ ] Response includes `url` (Checkout session URL)
   - [ ] No errors

7. **Test Webhook Delivery**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local
   stripe listen --forward-to https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook

   # Trigger test event
   stripe trigger checkout.session.completed
   ```
   - [ ] Webhook received by Edge Function
   - [ ] No errors in function logs

8. **Set Environment Variables**:
   ```bash
   # Add to .env file (client-side)
   echo "VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXX" >> .env

   # Add to Supabase secrets (server-side)
   supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXXXX
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX
   ```
   - [ ] Client-side env var set
   - [ ] Server-side secrets set
   - [ ] Restart dev server to load new vars

**Verification**:
```bash
# Check env vars loaded
node -e "console.log(process.env.VITE_STRIPE_PUBLIC_KEY)"

# Check Supabase secrets
supabase secrets list
```

**Test Cards** (Stripe Test Mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`
- Insufficient Funds: `4000 0000 0000 9995`

**Troubleshooting**:
- **Error**: "No such price" → Price ID incorrect, check Stripe Dashboard
- **Error**: "Invalid API Key" → Check secret key copied correctly (starts with `sk_test_`)
- **Error**: "Webhook signature verification failed" → Check webhook secret matches

---

## 4. Supabase Edge Functions

### Deploy stripe-webhook Function (CRITICAL)

**Status**: ⏰ PENDING

**File**: `/supabase/functions/stripe-webhook/index.ts`

**Steps**:

1. **Verify Function File Exists**:
   ```bash
   ls -la /Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/functions/stripe-webhook/
   ```
   - [ ] File exists: `index.ts`
   - [ ] Handles `checkout.session.completed` event
   - [ ] Updates user tier in database

2. **Deploy Function**:
   ```bash
   cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
   - [ ] Deployment succeeds
   - [ ] Function URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`

3. **Set Function Environment Variables**:
   ```bash
   # Set secrets for Edge Function
   supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXXXX
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyXXXXXXXX
   ```
   - [ ] All secrets set

4. **Test Function Manually**:
   ```bash
   # Send test webhook event
   curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook \
     -H "Content-Type: application/json" \
     -H "Stripe-Signature: t=1234567890,v1=signature_here" \
     -d '{
       "type": "checkout.session.completed",
       "data": {
         "object": {
           "id": "cs_test_123",
           "customer": "cus_test_123",
           "subscription": "sub_test_123",
           "metadata": {
             "user_id": "test-user-uuid",
             "tier": "coffee"
           }
         }
       }
     }'
   ```
   - [ ] Function responds with 200 OK
   - [ ] Check function logs for processing

5. **Check Function Logs**:
   ```bash
   supabase functions logs stripe-webhook --limit 20
   ```
   - [ ] No errors in logs
   - [ ] Webhook events processed successfully

**Troubleshooting**:
- **Error**: "Function not found" → Redeploy function
- **Error**: "Signature verification failed" → Check webhook secret is correct
- **Error**: "Database error" → Check RLS policies allow service role to UPDATE users

---

## 5. Environment Variables

### Production Environment Variables (CRITICAL)

**Status**: ⏰ PENDING

**Required Variables**:

1. **Client-Side (.env)**:
   ```bash
   # Supabase
   VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Stripe (Publishable Key - Safe for client)
   VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXX
   ```
   - [ ] All variables set in `.env` file
   - [ ] `.env` file in `.gitignore` (DO NOT commit secrets!)
   - [ ] Variables loaded in browser (check `import.meta.env`)

2. **Server-Side (Supabase Secrets)**:
   ```bash
   # Stripe
   STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXX

   # Supabase (for Edge Functions)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - [ ] All secrets set via `supabase secrets set`
   - [ ] Verify: `supabase secrets list`

3. **Hosting Platform (Netlify/Vercel)**:
   - [ ] VITE_SUPABASE_URL set
   - [ ] VITE_SUPABASE_ANON_KEY set
   - [ ] VITE_STRIPE_PUBLIC_KEY set
   - [ ] Redeploy after setting variables

**Verification**:
```bash
# Check client-side vars loaded
npm run dev
# Open browser console:
# console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

# Check server-side secrets
supabase secrets list
```

**Security Checklist**:
- [ ] No secrets in Git history (check: `git log --all --full-history --source -- .env`)
- [ ] No secrets in client-side bundle (check: `grep -r "sk_test" dist/`)
- [ ] `.env` file in `.gitignore`
- [ ] Secrets stored securely (password manager, not sticky notes!)

---

## 6. Build & Deployment

### Production Build Verification (MEDIUM PRIORITY)

**Status**: ⏰ PENDING

**Steps**:

1. **Clean Build**:
   ```bash
   cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp
   rm -rf dist/ node_modules/.vite
   npm run build
   ```
   - [ ] Build completes successfully
   - [ ] No TypeScript errors
   - [ ] No critical ESLint warnings
   - [ ] Bundle created in `dist/`

2. **Check Bundle Size**:
   ```bash
   ls -lh dist/assets/*.js | sort -k5 -h -r | head -10
   ```
   - [ ] Main bundle <300KB (uncompressed)
   - [ ] Total size <1MB
   - [ ] Lazy-loaded chunks split appropriately

3. **Test Production Build Locally**:
   ```bash
   npm run preview
   # Visit http://localhost:4173
   ```
   - [ ] App loads without errors
   - [ ] OAuth buttons functional
   - [ ] No console errors
   - [ ] All routes accessible

4. **Deploy to Staging**:
   ```bash
   # If using Netlify
   netlify deploy --prod

   # If using Vercel
   vercel --prod
   ```
   - [ ] Deployment succeeds
   - [ ] Staging URL accessible
   - [ ] Environment variables configured on platform
   - [ ] OAuth redirect URIs include staging domain

**Verification**:
- [ ] Visit staging URL: https://staging.aimpactscanner.com (or equivalent)
- [ ] Test signup flow end-to-end
- [ ] Check Supabase Dashboard → Authentication → Users for new signups
- [ ] Check Stripe Dashboard → Customers for new subscriptions

**Troubleshooting**:
- **Error**: "OAuth redirect URI mismatch" → Add staging URL to OAuth providers
- **Error**: "Stripe checkout fails" → Check webhook points to staging Edge Function
- **Error**: "Database connection failed" → Check Supabase URL/keys correct for staging

---

## Completion Verification

### All Systems Check

**Run this checklist before notifying tester**:

1. **OAuth Providers**:
   ```bash
   # Test Google OAuth
   curl "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/authorize?provider=google" -I
   # Expected: 302 redirect to Google

   # Test GitHub OAuth
   curl "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/authorize?provider=github" -I
   # Expected: 302 redirect to GitHub
   ```

2. **Database Schema**:
   ```sql
   -- Verify all columns exist
   SELECT
     COUNT(*) FILTER (WHERE column_name = 'auth_provider') as auth_provider,
     COUNT(*) FILTER (WHERE column_name = 'is_first_login') as is_first_login,
     COUNT(*) FILTER (WHERE column_name = 'stripe_customer_id') as stripe_customer_id
   FROM information_schema.columns
   WHERE table_name = 'users';
   -- Expected: auth_provider=1, is_first_login=1, stripe_customer_id=1
   ```

3. **Stripe Integration**:
   ```bash
   # Test checkout session creation
   curl -X POST https://aimpactscanner.com/api/create-checkout-session \
     -H "Authorization: Bearer $TEST_USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tier": "coffee"}'
   # Expected: 200 OK with checkout URL
   ```

4. **Edge Functions**:
   ```bash
   # Check function deployed
   supabase functions list
   # Expected: stripe-webhook listed

   # Check function logs
   supabase functions logs stripe-webhook --limit 5
   # Expected: No critical errors
   ```

5. **Environment Variables**:
   ```bash
   # Check all secrets set
   supabase secrets list | grep -E "(STRIPE|SUPABASE)"
   # Expected: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
   ```

**Final Checklist**:
- [ ] Google OAuth working (tested end-to-end)
- [ ] GitHub OAuth working (tested end-to-end)
- [ ] Database migrations deployed (verified with SQL queries)
- [ ] Stripe product/price created (Coffee plan)
- [ ] Stripe webhook configured (endpoint responding)
- [ ] Edge Function deployed (logs show no errors)
- [ ] Environment variables set (client + server)
- [ ] Production build successful (no errors)
- [ ] Staging deployment tested (basic smoke test)

**Estimated Completion Time**: 2-3 hours (if no blockers)

---

## Handoff to Tester

### When All Tasks Complete

**Create handoff message**:

```
@tester - Pre-testing configuration COMPLETE ✅

All dependencies are now configured and ready for E2E testing:

✅ Google OAuth configured and tested
✅ GitHub OAuth configured and tested
✅ Database migrations deployed (021, 022)
✅ Stripe integration configured (Coffee plan, webhooks)
✅ Edge Functions deployed (stripe-webhook)
✅ Environment variables set (client + server)
✅ Staging environment deployed and smoke tested

You can now execute:
- All user journey tests (A-G)
- OAuth flow tests (Google, GitHub)
- Stripe payment flow tests
- Context preservation tests
- Error scenario tests

Staging URL: https://staging.aimpactscanner.com
Test Accounts: [Provide test account credentials]
Stripe Test Mode: Enabled (use test cards from testing guide)

Documentation:
- Testing Guide: /docs/testing-guide.md
- User Stories: /USER_STORIES_AUTH_MONETIZATION.md
- Technical Design: /TECHNICAL_DESIGN_AUTH_MONETIZATION.md

Proceed with comprehensive E2E testing. Report any blockers or critical issues immediately.
```

---

## Rollback Procedure (If Issues Found)

**If critical issues discovered during setup**:

1. **Rollback Database Migrations**:
   ```bash
   supabase db reset --db-url $SUPABASE_DB_URL
   # Or manually drop columns:
   # ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
   ```

2. **Disable OAuth Providers** (temporary):
   - Supabase Dashboard → Authentication → Providers
   - Toggle OFF Google/GitHub providers

3. **Disable Stripe Webhook**:
   - Stripe Dashboard → Webhooks
   - Click webhook endpoint
   - Click "Disable endpoint"

4. **Revert Deployment**:
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main

   # Redeploy previous version
   netlify deploy --prod
   ```

---

**Operator Sign-Off**: ___________________
**Date Completed**: ___________________
**Handoff to Tester**: ___________________

---

*"Infrastructure first, testing second, deployment last."* 🛠️
