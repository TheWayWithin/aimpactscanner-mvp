# Environment Variables Guide - AImpactScanner

## Overview

This guide documents all environment variables required for the AImpactScanner authentication and monetization system, including where to obtain them and how to configure them.

---

## Quick Reference

### Environment Files

**Local Development**:
- `.env.local` - Your local environment variables (NOT committed to git)
- `.env.example` - Template for local development (committed to git)

**Production (Netlify)**:
- Netlify Dashboard → Site Settings → Environment Variables

**MCP Configuration**:
- `.env.mcp` - MCP server configuration (NOT committed to git)
- `.env.mcp.template` - Template for MCP setup (committed to git)

---

## Required Environment Variables

### 1. Supabase Configuration

#### VITE_SUPABASE_URL
**Purpose**: Supabase project URL for client-side API calls
**Required For**: Authentication, database queries, realtime subscriptions
**Visibility**: PUBLIC (safe to expose in frontend)

**Where to Get**:
1. Login to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `aimpactscanner-mvp`
3. Settings → API → Project URL
4. Copy URL

**Example Value**:
```bash
VITE_SUPABASE_URL="https://pdmtvkcxnqysujnpcnyh.supabase.co"
```

**Current Status**: ✅ CONFIGURED

---

#### VITE_SUPABASE_ANON_KEY
**Purpose**: Public anonymous key for client-side Supabase authentication
**Required For**: Authentication, RLS-protected database access
**Visibility**: PUBLIC (safe to expose in frontend, RLS policies protect data)

**Where to Get**:
1. Supabase Dashboard → Settings → API → Project API keys
2. Copy "anon" "public" key (very long JWT token)

**Example Value**:
```bash
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg"
```

**Current Status**: ✅ CONFIGURED

---

#### SUPABASE_SERVICE_ROLE_KEY
**Purpose**: Service role key for server-side operations that bypass RLS
**Required For**: Stripe webhook handler, admin operations
**Visibility**: PRIVATE (NEVER expose in frontend)

**Where to Get**:
1. Supabase Dashboard → Settings → API → Project API keys
2. Click "Reveal" next to "service_role" key
3. Copy the key (very long JWT token)

**Example Value**:
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg4NDcyMCwiZXhwIjoyMDY2NDYwNzIwfQ.REDACTED"
```

**Storage Location**:
- ❌ NOT in `.env.local` (frontend has access)
- ✅ Netlify Dashboard → Environment Variables (server-side only)
- ✅ `.env.mcp` if needed for local testing (add to .gitignore)

**Security Warning**:
- This key bypasses ALL Row Level Security policies
- Can read/write ANY data in database
- MUST be stored server-side only
- NEVER commit to git
- NEVER expose in frontend code

**Current Status**: ⚠️ NEEDS CONFIGURATION (for webhook handler)

---

### 2. Stripe Configuration

#### VITE_STRIPE_PUBLISHABLE_KEY
**Purpose**: Stripe public key for client-side checkout
**Required For**: Creating Stripe checkout sessions, displaying payment UI
**Visibility**: PUBLIC (safe to expose in frontend)

**Where to Get**:
1. Login to Stripe Dashboard: https://dashboard.stripe.com
2. Switch to **Live Mode** (toggle top right) for production
3. Developers → API keys
4. Copy "Publishable key" (starts with `pk_live_` for production)

**Example Value**:
```bash
# Production (Live Mode)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51KSrA8IiC84gpR8Hf9dKTFIdR2rSzWtEuFlvQHBi3dLBNmojL0LLdTRDkCYfBtX1tYGbSNbIeykeDpLaSa3oUnnT00eelqRDiA"

# Development (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_51KSrA8IiC84gpR8H..."
```

**Current Status**: ✅ CONFIGURED (Live Mode key)

---

#### STRIPE_SECRET_KEY
**Purpose**: Stripe secret key for server-side API calls
**Required For**: Creating checkout sessions, processing webhooks
**Visibility**: PRIVATE (NEVER expose in frontend)

**Where to Get**:
1. Stripe Dashboard → Developers → API keys
2. Switch to **Live Mode** for production
3. Copy "Secret key" (starts with `sk_live_` for production)
4. Click "Reveal live key token" if hidden

**Example Value**:
```bash
# Production (Live Mode)
STRIPE_SECRET_KEY="sk_live_51KSrA8IiC84gpR8H..."

# Development (Test Mode)
STRIPE_SECRET_KEY="sk_test_51KSrA8IiC84gpR8H..."
```

**Storage Location**:
- ❌ NOT in `.env.local` (frontend has access)
- ✅ Netlify Dashboard → Environment Variables (server-side only)
- ✅ `.env.mcp` if needed for local testing (add to .gitignore)

**Security Warning**:
- This key can charge customers and access sensitive data
- MUST be stored server-side only
- NEVER commit to git
- NEVER expose in frontend code

**Current Status**: ⚠️ NEEDS CONFIGURATION (obtain from Stripe dashboard)

---

#### STRIPE_WEBHOOK_SECRET
**Purpose**: Webhook signing secret for verifying Stripe webhook authenticity
**Required For**: Stripe webhook handler security
**Visibility**: PRIVATE (NEVER expose in frontend)

**Where to Get**:
1. Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint" or select existing endpoint
3. After creating webhook endpoint, click to view details
4. Copy "Signing secret" (starts with `whsec_`)

**Webhook Endpoint URL**:
```
https://aimpactscanner.com/.netlify/functions/stripe-webhook
```

**Events to Subscribe**:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Example Value**:
```bash
STRIPE_WEBHOOK_SECRET="REMOVED_STRIPE_WEBHOOK"
```

**Storage Location**:
- ❌ NOT in `.env.local`
- ✅ Netlify Dashboard → Environment Variables (server-side only)

**Security Warning**:
- This secret verifies webhook authenticity
- Without verification, attackers could fake payment confirmations
- CRITICAL for payment security
- NEVER skip webhook signature verification

**Current Status**: ⚠️ NEEDS CONFIGURATION (after webhook endpoint created)

---

#### VITE_STRIPE_COFFEE_PRICE_ID
**Purpose**: Stripe Price ID for Coffee tier subscription ($4.95/month)
**Required For**: Creating checkout sessions for Coffee tier
**Visibility**: PUBLIC (safe to expose, just a product identifier)

**Where to Get**:
1. Stripe Dashboard → Products → Select "Coffee Plan" (or create it)
2. Under "Pricing", copy the Price ID (starts with `price_`)
3. OR create new product:
   - Click "+ Add product"
   - Name: "Coffee Plan"
   - Description: "Unlimited analyses, priority support"
   - Pricing: Recurring, $4.95/month
   - Save and copy Price ID

**Example Value**:
```bash
VITE_STRIPE_COFFEE_PRICE_ID="price_1RnSa4IiC84gpR8HXmbDgaNy"
```

**Current Status**: ✅ CONFIGURED

---

#### VITE_STRIPE_GROWTH_PRICE_ID (Future)
**Purpose**: Stripe Price ID for Growth tier subscription ($29/month)
**Required For**: Future Growth tier checkout (currently waitlist only)
**Visibility**: PUBLIC

**Where to Get**: Create in Stripe Dashboard when ready to launch Growth tier
- Name: "Growth Plan"
- Pricing: Recurring, $29/month
- Status: Can be created as "Draft" for now

**Example Value**:
```bash
VITE_STRIPE_GROWTH_PRICE_ID="price_1Gr..."
```

**Current Status**: ⏳ NOT NEEDED YET (Growth tier on waitlist)

---

#### VITE_STRIPE_SCALE_PRICE_ID (Future)
**Purpose**: Stripe Price ID for Scale tier subscription ($99/month)
**Required For**: Future Scale tier checkout (currently waitlist only)
**Visibility**: PUBLIC

**Where to Get**: Create in Stripe Dashboard when ready to launch Scale tier
- Name: "Scale Plan"
- Pricing: Recurring, $99/month
- Status: Can be created as "Draft" for now

**Example Value**:
```bash
VITE_STRIPE_SCALE_PRICE_ID="price_1Sc..."
```

**Current Status**: ⏳ NOT NEEDED YET (Scale tier on waitlist)

---

### 3. Analytics & Tracking (Already Configured)

#### VITE_GTM_CONTAINER_ID
**Purpose**: Google Tag Manager container ID
**Current Value**: `GTM-WCQGG5N6`
**Status**: ✅ CONFIGURED

---

#### VITE_GA4_MEASUREMENT_ID
**Purpose**: Google Analytics 4 measurement ID
**Current Value**: `G-EJ5M874QBZ`
**Status**: ✅ CONFIGURED

---

### 4. Site Configuration (Already Configured)

#### VITE_SITE_URL
**Purpose**: Production site URL for redirects and canonical URLs
**Current Value**: `https://aimpactscanner.com`
**Status**: ✅ CONFIGURED

---

## Configuration Checklist

### Local Development (.env.local)

**Required NOW**:
```bash
# Supabase (Already Configured)
VITE_SUPABASE_URL="https://pdmtvkcxnqysujnpcnyh.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGc..."

# Stripe Frontend (Already Configured)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51KSrA8..."
VITE_STRIPE_COFFEE_PRICE_ID="price_1RnSa4..."

# Analytics (Already Configured)
VITE_GTM_CONTAINER_ID="GTM-WCQGG5N6"
VITE_GA4_MEASUREMENT_ID="G-EJ5M874QBZ"

# Site Config (Already Configured)
VITE_SITE_URL="https://aimpactscanner.com"
```

**Current Status**: ✅ All frontend variables configured

---

### Production (Netlify Environment Variables)

**Required for Stripe Integration**:

1. **Navigate to Netlify**:
   - Login: https://app.netlify.com
   - Select site: `aimpactscanner`
   - Site settings → Environment variables

2. **Add Server-Side Variables**:

   **SUPABASE_SERVICE_ROLE_KEY**:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `[Get from Supabase Dashboard → Settings → API → service_role key]`
   - Scopes: All (production, preview, branch deploys)

   **STRIPE_SECRET_KEY**:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_live_51KSrA8...` (from Stripe Dashboard → API keys)
   - Scopes: Production only (use test key for preview/branch deploys)

   **STRIPE_WEBHOOK_SECRET**:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (from Stripe Dashboard → Webhooks → Signing secret)
   - Scopes: Production only

   **VITE_STRIPE_COFFEE_PRICE_ID**:
   - Key: `VITE_STRIPE_COFFEE_PRICE_ID`
   - Value: `price_1RnSa4IiC84gpR8HXmbDgaNy`
   - Scopes: All

3. **Redeploy Site**:
   - After adding variables, trigger redeploy
   - Deploys → Trigger deploy → Deploy site

**Current Status**: ⚠️ NEEDS CONFIGURATION

---

## Environment Variable Scopes (Netlify)

### Development/Preview Deploys
Use **test mode** Stripe keys:
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..." (from test mode webhook)
VITE_STRIPE_COFFEE_PRICE_ID="price_test_..." (test mode price)
```

### Production Deploys
Use **live mode** Stripe keys:
```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." (from live mode webhook)
VITE_STRIPE_COFFEE_PRICE_ID="price_1RnSa4..." (live mode price)
```

**How to Configure**:
- Netlify Dashboard → Environment variables
- Select "Scopes" dropdown for each variable
- Choose "Production" for live keys
- Choose "Deploy Previews" for test keys

---

## Security Best Practices

### Never Commit These Files
Add to `.gitignore`:
```bash
.env.local
.env.production
.env.mcp
*.env
!.env.example
!.env.mcp.template
```

**Current Status**: ✅ .gitignore configured correctly

---

### Secret Rotation Schedule

**Supabase Keys**:
- Service Role Key: Rotate every 90 days
- Anon Key: Only rotate if compromised (breaking change)

**Stripe Keys**:
- Secret Key: Rotate every 90 days
- Webhook Secret: Rotate when rotating secret key
- Publishable Key: Only rotate if compromised

**Rotation Process**:
1. Generate new key in provider dashboard
2. Add new key to Netlify environment variables
3. Trigger redeploy
4. Test production deployment
5. Delete old key from provider dashboard
6. Document rotation date

---

### Environment Variable Validation

**Validate Before Deployment**:
```bash
# Check all required variables are set
node scripts/validate-env.js

# Expected output:
# ✅ VITE_SUPABASE_URL: Configured
# ✅ VITE_SUPABASE_ANON_KEY: Configured
# ✅ VITE_STRIPE_PUBLISHABLE_KEY: Configured
# ⚠️ SUPABASE_SERVICE_ROLE_KEY: Missing (server-side)
# ⚠️ STRIPE_SECRET_KEY: Missing (server-side)
# ⚠️ STRIPE_WEBHOOK_SECRET: Missing (server-side)
```

**Note**: Create this validation script if needed:
```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_COFFEE_PRICE_ID',
];

const serverEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

console.log('Frontend Environment Variables:');
requiredEnvVars.forEach(key => {
  const value = import.meta.env[key];
  console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Configured' : 'Missing'}`);
});

console.log('\nServer Environment Variables (configure in Netlify):');
serverEnvVars.forEach(key => {
  console.log(`⚠️ ${key}: Configure in Netlify Dashboard`);
});
```

---

## Troubleshooting

### Error: "Supabase URL not found"

**Cause**: `VITE_SUPABASE_URL` not set or incorrect

**Solution**:
1. Check `.env.local` file exists
2. Verify variable name starts with `VITE_` (required for Vite)
3. Restart dev server (`npm run dev`)

---

### Error: "Invalid Stripe key"

**Cause**: Wrong Stripe key mode (test vs live) or incorrect key

**Solution**:
1. Verify you're using correct mode:
   - Development: `pk_test_...` and `sk_test_...`
   - Production: `pk_live_...` and `sk_live_...`
2. Check key is copied correctly (no extra spaces)
3. Verify key is for correct Stripe account

---

### Error: "Webhook signature verification failed"

**Cause**: `STRIPE_WEBHOOK_SECRET` incorrect or missing

**Solution**:
1. Go to Stripe Dashboard → Webhooks
2. Select your webhook endpoint
3. Copy "Signing secret"
4. Update in Netlify environment variables
5. Redeploy site

---

### Error: "Service role key unauthorized"

**Cause**: Using service role key in frontend or RLS policies blocking

**Solution**:
1. Verify service role key ONLY used in server-side functions
2. Check Netlify function has access to environment variable
3. Service role key bypasses RLS - should not be blocked

---

## Testing Configuration

### Local Testing Script

Create a test script to verify all environment variables:

```bash
#!/bin/bash
# scripts/test-env-config.sh

echo "🧪 Testing Environment Configuration"
echo "===================================="

# Check frontend variables
echo ""
echo "Frontend Variables (should be visible):"
if [ -n "$VITE_SUPABASE_URL" ]; then
  echo "✅ VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
else
  echo "❌ VITE_SUPABASE_URL: Not set"
fi

if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "✅ VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:30}..."
else
  echo "❌ VITE_SUPABASE_ANON_KEY: Not set"
fi

if [ -n "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then
  echo "✅ VITE_STRIPE_PUBLISHABLE_KEY: ${VITE_STRIPE_PUBLISHABLE_KEY:0:30}..."
else
  echo "❌ VITE_STRIPE_PUBLISHABLE_KEY: Not set"
fi

# Check server variables (Netlify only)
echo ""
echo "Server Variables (configure in Netlify Dashboard):"
echo "⚠️ SUPABASE_SERVICE_ROLE_KEY: Check Netlify Dashboard"
echo "⚠️ STRIPE_SECRET_KEY: Check Netlify Dashboard"
echo "⚠️ STRIPE_WEBHOOK_SECRET: Check Netlify Dashboard"

echo ""
echo "===================================="
echo "✅ Configuration test complete"
```

Run with:
```bash
chmod +x scripts/test-env-config.sh
./scripts/test-env-config.sh
```

---

## Summary

### Current Status

**Frontend Variables (✅ Configured)**:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_STRIPE_COFFEE_PRICE_ID
- VITE_GTM_CONTAINER_ID
- VITE_GA4_MEASUREMENT_ID
- VITE_SITE_URL

**Server Variables (⚠️ Need Configuration)**:
- SUPABASE_SERVICE_ROLE_KEY (obtain from Supabase Dashboard)
- STRIPE_SECRET_KEY (obtain from Stripe Dashboard)
- STRIPE_WEBHOOK_SECRET (obtain after creating webhook endpoint)

**Future Variables (⏳ Not Needed Yet)**:
- VITE_STRIPE_GROWTH_PRICE_ID (when Growth tier launches)
- VITE_STRIPE_SCALE_PRICE_ID (when Scale tier launches)

### Next Steps

1. **Obtain Server-Side Keys**:
   - [ ] Get Supabase service role key
   - [ ] Get Stripe secret key (live mode)
   - [ ] Create Stripe webhook endpoint
   - [ ] Get webhook signing secret

2. **Configure Netlify**:
   - [ ] Add SUPABASE_SERVICE_ROLE_KEY
   - [ ] Add STRIPE_SECRET_KEY
   - [ ] Add STRIPE_WEBHOOK_SECRET
   - [ ] Trigger redeploy

3. **Test Configuration**:
   - [ ] Run validation script
   - [ ] Test Stripe checkout flow
   - [ ] Verify webhook delivery
   - [ ] Monitor logs for errors

---

## Reference Documentation

- **Supabase API Settings**: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/settings/api
- **Stripe Dashboard**: https://dashboard.stripe.com/apikeys
- **Netlify Environment Variables**: https://app.netlify.com/sites/aimpactscanner/settings/deploys#environment
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html

---

*Last Updated: October 2, 2025*
*Status: Frontend configured, server-side needs configuration*
*Next Action Required: Obtain server-side keys and configure in Netlify Dashboard*
