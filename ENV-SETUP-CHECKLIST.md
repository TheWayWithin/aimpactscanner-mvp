# Environment Variables Setup Checklist

**Created**: 2025-10-25
**Purpose**: Track where Stripe Price IDs need to be configured
**Source**: See `STRIPE-ENV-VARS.txt` for all variable values

---

## Quick Reference

All Stripe Test Mode variables are in: **`STRIPE-ENV-VARS.txt`**

---

## Setup Locations

### ✅ 1. Local Development (`.env.local`)

**Status**: ⏳ Pending
**Location**: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/.env.local`
**Required Variables**:
```bash
# Copy from STRIPE-ENV-VARS.txt:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_SOLO_MONTHLY=price_1SMFnZ...
STRIPE_PRICE_SOLO_ANNUAL=price_1SMFnZ...
STRIPE_PRICE_GROWTH_MONTHLY=price_1SMFna...
STRIPE_PRICE_GROWTH_ANNUAL=price_1SMFnb...
STRIPE_PRICE_SCALE_MONTHLY=price_1SMFnc...
STRIPE_PRICE_SCALE_ANNUAL=price_1SMFnc...
```

**Action**: Manually copy from `STRIPE-ENV-VARS.txt` to `.env.local`

---

### ✅ 2. Staging Environment (`.env.staging`)

**Status**: ⏳ Pending
**Location**: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/.env.staging`
**Required Variables**: Same as `.env.local` (see above)

**Action**: Manually copy from `STRIPE-ENV-VARS.txt` to `.env.staging`

---

### ✅ 3. Supabase Edge Functions (Secrets)

**Status**: ⏳ Pending
**Method**: Supabase CLI or Dashboard
**Required Secrets**:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_SOLO_MONTHLY=price_1SMFnZ...
STRIPE_PRICE_SOLO_ANNUAL=price_1SMFnZ...
STRIPE_PRICE_GROWTH_MONTHLY=price_1SMFna...
STRIPE_PRICE_GROWTH_ANNUAL=price_1SMFnb...
STRIPE_PRICE_SCALE_MONTHLY=price_1SMFnc...
STRIPE_PRICE_SCALE_ANNUAL=price_1SMFnc...
STRIPE_WEBHOOK_SECRET=whsec_... (when webhooks configured)
```

**Action Option A - CLI** (Recommended):
```bash
# Set each secret using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_51KSrA8...
supabase secrets set STRIPE_PRICE_SOLO_MONTHLY=price_1SMFnZ...
supabase secrets set STRIPE_PRICE_SOLO_ANNUAL=price_1SMFnZ...
supabase secrets set STRIPE_PRICE_GROWTH_MONTHLY=price_1SMFna...
supabase secrets set STRIPE_PRICE_GROWTH_ANNUAL=price_1SMFnb...
supabase secrets set STRIPE_PRICE_SCALE_MONTHLY=price_1SMFnc...
supabase secrets set STRIPE_PRICE_SCALE_ANNUAL=price_1SMFnc...
```

**Action Option B - Dashboard**:
1. Go to Supabase Dashboard → Project Settings
2. Navigate to Edge Functions → Secrets
3. Add each variable manually

---

### ✅ 4. Netlify Environment Variables

**Status**: ⏳ Pending
**Method**: Netlify Dashboard
**Required Variables** (frontend only):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note**: Price IDs are NOT needed in Netlify env vars - they're only used in Supabase Edge Functions (backend).

**Action**:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add `VITE_STRIPE_PUBLISHABLE_KEY`
3. Scope: "Deploy previews" (for test mode)

---

## Webhook Setup (Phase 6+)

### ✅ 5. Stripe Webhook Endpoint

**Status**: ⏳ Pending (will be configured in Phase 6)
**Webhook URL**: `https://[supabase-project-url].supabase.co/functions/v1/stripe-webhook`

**Steps**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set Endpoint URL: `https://isgzvwpjokcmtizstwru.supabase.co/functions/v1/stripe-webhook` (staging)
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy signing secret** (starts with `whsec_...`)
7. Add to Supabase secrets: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Verification Checklist

Before testing checkout flow:

- [ ] `.env.local` updated with all Stripe Price IDs
- [ ] `.env.staging` updated with all Stripe Price IDs
- [ ] Supabase secrets configured (all 7 Price IDs + secret key)
- [ ] Netlify env var configured (publishable key)
- [ ] Webhook endpoint created in Stripe (Phase 6)
- [ ] Webhook signing secret added to Supabase secrets (Phase 6)
- [ ] Test checkout locally to verify Price IDs work
- [ ] Test checkout in staging to verify Edge Function access

---

## Production Setup (DO NOT DO YET)

⚠️ **WARNING**: Do NOT configure production until Phase 10

When ready for production:
1. Create products in Stripe **LIVE MODE** (identical to test mode)
2. Update `STRIPE-PRICE-IDS-LIVE.md` with Live Mode Price IDs
3. Create `STRIPE-ENV-VARS-LIVE.txt` with Live Mode credentials
4. Update production Supabase secrets with Live Mode values
5. Update Netlify production env vars with Live Mode publishable key
6. Create webhook endpoint pointing to production Supabase

---

## Files Reference

- **Price IDs (Test)**: `STRIPE-PRICE-IDS.md`
- **Price IDs (Live)**: `STRIPE-PRICE-IDS-LIVE.md`
- **Env Vars (Test)**: `STRIPE-ENV-VARS.txt`
- **Env Vars (Live)**: `STRIPE-ENV-VARS-LIVE.txt` (create when needed)
- **Setup Script**: `setup-stripe-products.cjs`
- **Setup Results**: `stripe-setup-results.json`

---

*Last updated: 2025-10-25*
