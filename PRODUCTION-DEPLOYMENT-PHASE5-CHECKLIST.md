# Production Deployment Checklist - Phase 5 Trial Integration

**Purpose**: Deploy Growth tier 7-day trial integration to production
**Environment**: Production Supabase (`pdmtvkcxnqysujnpcnyh`) + Stripe Live Mode
**Prerequisites**: All staging tests passed, Phase 5 complete

---

## Pre-Deployment Checklist

### 1. Staging Verification
- [ ] Growth trial flow tested end-to-end on staging
- [ ] Trial charges $0 initially, then bills after 7 days
- [ ] Webhook returns 200 OK (not 401)
- [ ] Tier updates automatically from "free" to "growth"
- [ ] CheckoutSuccess page displays correctly
- [ ] Account page shows correct limits (40 analyses)
- [ ] No console errors or warnings

### 2. Code Review
- [ ] All trial-related code committed to `develop` branch
- [ ] No debug logging or commented-out code
- [ ] Environment variables documented
- [ ] Edge Functions deployed to staging and tested

### 3. Stripe Products (Live Mode)
- [ ] Verify all products exist in Stripe Live Mode:
  - [ ] Solo Monthly: $5.95/month
  - [ ] Solo Annual: $49.50/year
  - [ ] Growth Monthly: $17.95/month
  - [ ] Growth Annual: $149.50/year (with 7-day trial)
  - [ ] Scale Monthly: $34.95/month
  - [ ] Scale Annual: $299.50/year
- [ ] Copy production price IDs to `STRIPE-PRICE-IDS-LIVE.md`

---

## Deployment Steps

### Step 1: Stripe Webhook Setup (Live Mode)

**⚠️ CRITICAL: This must be done BEFORE deploying code to production**

1. **Create Webhook in Stripe Live Mode**:
   - Go to: https://dashboard.stripe.com/webhooks (ensure "Live mode" toggle is ON)
   - Click "Add endpoint"
   - Endpoint URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
   - Description: "Production webhook - tier updates"
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"

2. **Copy Webhook Signing Secret**:
   - Click "Reveal" next to "Signing secret"
   - Copy the full secret (starts with `whsec_`)
   - **KEEP THIS SECRET SAFE** - it's different from test mode secret

3. **Add Secret to Supabase Production**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/settings/functions
   - Scroll to "Secrets" section
   - Click "Add new secret"
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: (paste the signing secret from step 2)
   - Click "Save"

4. **🚨 CRITICAL: Disable JWT Verification**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/functions/stripe-webhook
   - Click "Details" tab
   - Find "Verify JWT with legacy secret" toggle (will be green/enabled)
   - **Click toggle to DISABLE** (turns gray/off)
   - Click "Save changes"
   - **Why**: Stripe webhooks don't send JWT tokens, so JWT verification must be OFF

5. **Verify Webhook Configuration**:
   - [ ] Webhook URL is production Supabase: `pdmtvkcxnqysujnpcnyh`
   - [ ] Webhook is in Stripe LIVE mode (not test mode)
   - [ ] Secret added to Supabase production Edge Function secrets
   - [ ] JWT verification is DISABLED
   - [ ] 5 events are selected

---

### Step 2: Update Environment Variables

1. **Update Netlify Production Environment Variables**:
   - Go to: https://app.netlify.com/sites/aimpactscanner/settings/env
   - Verify these variables point to PRODUCTION Supabase:
     - `VITE_SUPABASE_URL`: `https://pdmtvkcxnqysujnpcnyh.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: (production anon key)
   - Add/update Stripe LIVE mode keys:
     - `VITE_STRIPE_PUBLISHABLE_KEY`: (live publishable key from Stripe)
   - Click "Save"

2. **Update Supabase Production Secrets**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/settings/functions
   - Verify these secrets exist:
     - `STRIPE_SECRET_KEY`: (Stripe live secret key)
     - `STRIPE_WEBHOOK_SECRET`: (added in Step 1)
     - `SUPABASE_URL`: `https://pdmtvkcxnqysujnpcnyh.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: (production service role key)

---

### Step 3: Deploy Code to Production

1. **Merge to Main Branch**:
   ```bash
   git checkout main
   git pull origin main
   git merge develop --no-ff -m "Deploy Phase 5: Growth tier 7-day trial integration"
   git push origin main
   ```

2. **Deploy Edge Functions to Production**:
   ```bash
   # Deploy create-checkout-session (handles trial checkout)
   supabase functions deploy create-checkout-session --project-ref pdmtvkcxnqysujnpcnyh

   # Deploy stripe-webhook (handles tier updates)
   supabase functions deploy stripe-webhook --project-ref pdmtvkcxnqysujnpcnyh
   ```

3. **Verify Netlify Production Build**:
   - Netlify will auto-deploy from `main` branch
   - Monitor build: https://app.netlify.com/sites/aimpactscanner/deploys
   - Wait for "Published" status
   - Check production URL: https://aimpactscanner.com

---

### Step 4: Disable JWT Verification (CRITICAL - Double Check)

**⚠️ This step is so critical it's listed twice**

Even though you did this in Step 1, verify it again after deploying Edge Functions:

1. Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/functions/stripe-webhook
2. Click "Details" tab
3. Verify "Verify JWT with legacy secret" toggle is OFF (gray)
4. If it's ON (green), click to disable and save

**Why This Matters**:
- Edge Function deployment may reset this setting
- If JWT verification is ON, webhooks will fail with 401 errors
- Tier updates won't work, requiring manual SQL intervention

---

## Post-Deployment Testing

### Test 1: Webhook Connectivity

1. **Trigger a Test Event from Stripe**:
   - Go to: https://dashboard.stripe.com/webhooks (Live mode)
   - Click on your production webhook
   - Click "Send test webhook"
   - Select event: `checkout.session.completed`
   - Click "Send test webhook"

2. **Verify Response**:
   - Status should be: "200 OK" (NOT 401)
   - If 401: JWT verification is still enabled (go back to Step 4)

3. **Check Edge Function Logs**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/functions/stripe-webhook
   - Click "Logs" tab
   - Should see: "Webhook signature verified successfully"
   - Should NOT see: 401 errors or authentication failures

---

### Test 2: Growth Trial Flow (Live Payment)

**⚠️ WARNING: This will create a REAL subscription and charge REAL money after 7 days**

1. **Create Test Account**:
   - Use a REAL email you control (you'll need to cancel the subscription)
   - Go to: https://aimpactscanner.com/#signup
   - Sign in with Google using your test email

2. **Select Growth Tier with Trial**:
   - Select "Growth" tier
   - Toggle to "Annual" billing
   - Click "🎁 Try Growth Free for 7 Days"

3. **Complete Stripe Checkout**:
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout form

4. **Verify Trial Checkout**:
   - [ ] Stripe checkout showed "$0.00 due today"
   - [ ] Stripe checkout showed "7-day free trial" notice
   - [ ] Redirected to checkout-success page
   - [ ] Welcome message displays correctly
   - [ ] Message says "Welcome to Growth Tier!"

5. **Verify Database**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/editor
   - Run: `SELECT id, email, tier FROM users WHERE email = 'YOUR_TEST_EMAIL';`
   - Verify tier = 'growth' (NOT 'free')

6. **Verify Account Page**:
   - Go to: https://aimpactscanner.com/#account
   - Verify tier shows: "🚀 Growth"
   - Verify analyses remaining: "40" (NOT "3")

7. **Verify Webhook in Stripe**:
   - Go to: https://dashboard.stripe.com/events (Live mode)
   - Find most recent `checkout.session.completed` event
   - Click on it
   - Scroll to "Deliveries to webhook endpoints"
   - Verify: "200 OK" (NOT 401 ERR)

8. **Cancel Test Subscription**:
   - Go to: https://aimpactscanner.com/#account
   - Click "Manage Subscription"
   - Click "Cancel subscription"
   - Confirm cancellation
   - **IMPORTANT**: Do this within 7 days to avoid being charged

---

### Test 3: Webhook Recovery

**Test that webhook retries work if initial delivery fails**

1. **Temporarily Break Webhook**:
   - Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/functions/stripe-webhook/details
   - Enable "Verify JWT with legacy secret" (turn it ON)
   - Save changes

2. **Trigger a Payment**:
   - Create a new test signup with Coffee tier (no trial, immediate payment)
   - Complete checkout

3. **Verify 401 Error**:
   - Check Stripe events: should show 401 ERR
   - Check database: tier should be "free" (webhook failed)

4. **Fix Webhook**:
   - Go back to Edge Function details
   - Disable "Verify JWT with legacy secret" (turn it OFF)
   - Save changes

5. **Verify Auto-Recovery**:
   - Stripe will automatically retry failed webhooks
   - Wait 1-2 minutes for retry
   - Check Stripe events: should now show 200 OK
   - Check database: tier should now be "coffee" (webhook succeeded on retry)

---

## Rollback Plan

**If issues are discovered in production:**

### Emergency Rollback (< 5 minutes)

1. **Revert Code Deployment**:
   ```bash
   git checkout main
   git revert HEAD --no-edit
   git push origin main
   ```
   - Netlify will auto-deploy reverted code

2. **Revert Edge Functions**:
   ```bash
   # Deploy previous version from staging
   supabase functions deploy create-checkout-session --project-ref pdmtvkcxnqysujnpcnyh
   supabase functions deploy stripe-webhook --project-ref pdmtvkcxnqysujnpcnyh
   ```

3. **Disable Production Webhook**:
   - Go to: https://dashboard.stripe.com/webhooks (Live mode)
   - Click on webhook
   - Click "..." menu → "Disable endpoint"
   - This prevents failed webhook attempts

---

## Success Criteria

**Phase 5 is successfully deployed to production when:**

- [ ] All pre-deployment checks passed
- [ ] Stripe webhook configured in Live mode
- [ ] Webhook secret added to production Supabase
- [ ] JWT verification DISABLED on stripe-webhook function
- [ ] Code deployed to production (main branch)
- [ ] Edge Functions deployed to production Supabase
- [ ] Netlify production build successful
- [ ] Test webhook returns 200 OK (not 401)
- [ ] Growth trial flow works end-to-end
- [ ] Trial charges $0 initially (not $149.50)
- [ ] Tier updates automatically to "growth"
- [ ] CheckoutSuccess page displays correctly
- [ ] Account page shows 40 analyses remaining
- [ ] No console errors or 401 webhook errors

---

## Monitoring (First 48 Hours)

1. **Monitor Stripe Webhook Logs**:
   - Check every 6 hours for 401 errors
   - https://dashboard.stripe.com/webhooks (Live mode)

2. **Monitor Supabase Edge Function Logs**:
   - Check for errors or unusual patterns
   - https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/functions/stripe-webhook/logs

3. **Monitor User Sign-ups**:
   - Check database for new Growth tier users
   - Verify tiers are updating correctly via webhook

4. **User Support**:
   - Watch for support tickets about payment issues
   - Watch for users reporting tier not updating

---

## Troubleshooting

### Issue: Webhook Returns 401

**Cause**: JWT verification is enabled

**Fix**:
1. Go to: Edge Function → Details tab
2. Disable "Verify JWT with legacy secret"
3. Save changes
4. Resend failed webhook from Stripe

### Issue: Tier Stays "Free" After Payment

**Cause**: Webhook not configured or failing

**Fix**:
1. Check Stripe webhook logs for 401/500 errors
2. Verify webhook secret is correct
3. Verify JWT verification is disabled
4. Manually update tier with SQL (temporary fix):
   ```sql
   UPDATE users SET tier = 'growth' WHERE id = 'USER_ID';
   ```

### Issue: Trial Charges Immediately

**Cause**: Trial parameter not being set correctly

**Fix**:
1. Verify user clicked "Try Growth Free for 7 Days" button (not "Skip trial")
2. Check Edge Function logs for `isTrial: true` in metadata
3. Refund customer via Stripe dashboard
4. Investigate create-checkout-session logic

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Created By**: THE DEVELOPER (AGENT-11)
