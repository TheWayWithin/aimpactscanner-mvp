# AImpactScanner Operator Guide

**Version**: 2.0
**Last Updated**: 2025-10-02
**Status**: OAuth-First Authentication & Monetization System

---

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [OAuth Provider Configuration](#oauth-provider-configuration)
3. [Database Migration Procedures](#database-migration-procedures)
4. [Stripe Integration Setup](#stripe-integration-setup)
5. [Supabase Edge Functions](#supabase-edge-functions)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Incident Response](#incident-response)
9. [Backup and Recovery](#backup-and-recovery)
10. [Security Checklist](#security-checklist)

---

## Infrastructure Setup

### System Requirements

**Production Environment**:
- Frontend Hosting: Netlify or Vercel (CDN + auto-deploy)
- Backend: Supabase (PostgreSQL + Auth + Edge Functions)
- Payment Processing: Stripe
- Email Delivery: Resend (via Supabase SMTP)
- Domain: Custom domain with SSL

**Minimum Specifications**:
- Supabase: Pro plan ($25/month) for production workloads
- Stripe: Standard account (no monthly fee)
- Netlify/Vercel: Free tier sufficient for MVP
- Resend: Free tier (3,000 emails/month)

---

## OAuth Provider Configuration

### Google OAuth Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Create Project"**
3. Name: "AImpactScanner Production"
4. Click **"Create"**

#### Step 2: Enable Google+ API

1. In project dashboard, click **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click **"Enable"**

#### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for public users)
3. Fill in application information:
   - **App name**: AImpactScanner
   - **User support email**: support@aimpactscanner.com
   - **App logo**: (Upload 120x120 logo)
   - **Application home page**: https://aimpactscanner.com
   - **Application privacy policy**: https://aimpactscanner.com/privacy
   - **Application terms of service**: https://aimpactscanner.com/terms
   - **Authorized domains**: aimpactscanner.com
   - **Developer contact**: support@aimpactscanner.com
4. Click **"Save and Continue"**

#### Step 4: Add OAuth Scopes

1. Click **"Add or Remove Scopes"**
2. Select:
   - `userinfo.email`
   - `userinfo.profile`
3. Click **"Update"** → **"Save and Continue"**

#### Step 5: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **"Web application"**
4. Name: "AImpactScanner Production"
5. **Authorized JavaScript origins**:
   - `https://aimpactscanner.com`
   - `https://pdmtvkcxnqysujnpcnyh.supabase.co`
6. **Authorized redirect URIs**:
   - `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
7. Click **"Create"**
8. **Copy Client ID and Client Secret** (you'll need these for Supabase)

#### Step 6: Configure in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **"Authentication"** → **"Providers"**
4. Find **"Google"** and click **"Edit"**
5. Toggle **"Enable Google provider"** ON
6. Paste **Client ID** and **Client Secret**
7. Click **"Save"**

#### Step 7: Test OAuth Flow

```bash
# Test Google OAuth
1. Visit https://aimpactscanner.com/register
2. Click "Continue with Google"
3. Should redirect to Google consent screen
4. After approval, should redirect back and create user
5. Check Supabase Dashboard → Authentication → Users
6. Verify new user created with provider='google'
```

---

### GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/applications/new)
2. Or: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
3. Fill in:
   - **Application name**: AImpactScanner
   - **Homepage URL**: https://aimpactscanner.com
   - **Application description**: AI-powered website analysis for LLM visibility
   - **Authorization callback URL**: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
4. Click **"Register application"**

#### Step 2: Generate Client Secret

1. In OAuth App page, click **"Generate a new client secret"**
2. **Copy Client ID and Client Secret** immediately (secret shown only once)

#### Step 3: Configure in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Find **"GitHub"** and click **"Edit"**
3. Toggle **"Enable GitHub provider"** ON
4. Paste **Client ID** and **Client Secret**
5. Click **"Save"**

#### Step 4: Test OAuth Flow

```bash
# Test GitHub OAuth
1. Visit https://aimpactscanner.com/register
2. Click "Continue with GitHub"
3. Should redirect to GitHub authorization page
4. After approval, should redirect back and create user
5. Verify in Supabase Dashboard that user created with provider='github'
```

---

### Magic Link (Email) Setup

#### Step 1: Configure SMTP Provider (Resend)

1. Go to [Resend](https://resend.com)
2. Sign up for account (free tier: 3,000 emails/month)
3. Go to **API Keys** → **Create API Key**
4. Name: "AImpactScanner Production"
5. **Copy API Key** (starts with `re_...`)

#### Step 2: Verify Sending Domain

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter: `aimpactscanner.com`
4. Copy DNS records provided by Resend
5. Add DNS records to your domain registrar:
   - **TXT record** for domain verification
   - **MX records** for email delivery
   - **DKIM records** for email authentication
6. Click **"Verify Domain"** (may take 24-48 hours)

#### Step 3: Configure Supabase SMTP

1. Go to Supabase Dashboard → Project Settings → Authentication
2. Scroll to **SMTP Settings**
3. Fill in:
   - **Sender name**: AImpactScanner
   - **Sender email**: support@aimpactscanner.com
   - **Host**: smtp.resend.com
   - **Port**: 587
   - **Username**: resend
   - **Password**: (Your Resend API key)
4. Click **"Save"**

#### Step 4: Customize Email Template

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **"Magic Link"** template
3. Customize:
   ```html
   <h2>Sign in to AImpactScanner</h2>
   <p>Click the link below to sign in to your account:</p>
   <p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
   <p>This link expires in 1 hour.</p>
   <p>If you didn't request this email, you can safely ignore it.</p>
   ```
4. Click **"Save"**

#### Step 5: Test Magic Link

```bash
# Test Magic Link
1. Visit https://aimpactscanner.com/register
2. Click "Continue with Email"
3. Enter test email address
4. Click "Send Magic Link"
5. Check email inbox (should receive within 30 seconds)
6. Click link in email
7. Should redirect to app and create user
8. Verify in Supabase Dashboard that user created with provider='email'
```

---

## Database Migration Procedures

### Migration 021: Auth & Tier Columns

**File**: `supabase/migrations/021_auth_tier_columns.sql`

#### Step 1: Review Migration

```bash
# Read migration file
cat supabase/migrations/021_auth_tier_columns.sql

# Verify adds these columns:
# - auth_provider
# - selected_tier
# - subscription_status
# - stripe_customer_id
# - stripe_subscription_id
# - is_first_login
# - signup_source
# - growth_waitlist
# - scale_waitlist
# - waitlist_joined_at
# - last_upsell_shown
# - upsell_dismissed_count
```

#### Step 2: Backup Database

```bash
# Create backup before migration
supabase db dump --db-url <production_url> > backup_pre_021.sql

# Verify backup created
ls -lh backup_pre_021.sql
```

#### Step 3: Apply Migration

```bash
# Dry run (test on local database first)
supabase db push --dry-run

# Apply to production
supabase db push --db-url <production_url>

# Verify migration applied
supabase migrations list --db-url <production_url>
```

#### Step 4: Verify Schema Changes

```sql
-- Connect to production database
psql <production_url>

-- Check new columns exist
\d users

-- Should show all new columns:
-- auth_provider, selected_tier, subscription_status, etc.

-- Verify indexes created
\di

-- Should show:
-- idx_users_auth_provider
-- idx_users_tier
-- idx_users_subscription_status
-- idx_users_stripe_customer_id
-- idx_users_is_first_login
```

#### Step 5: Backfill Existing Users

```sql
-- Migration should auto-backfill, but verify:
SELECT
  COUNT(*) AS total_users,
  COUNT(auth_provider) AS with_auth_provider,
  COUNT(subscription_status) AS with_subscription_status
FROM users;

-- All counts should match (no NULLs)

-- If NULLs exist, run backfill:
UPDATE users
SET
  auth_provider = 'email',
  subscription_status = 'active',
  selected_tier = COALESCE(tier, 'free')
WHERE auth_provider IS NULL OR subscription_status IS NULL;
```

---

### Migration 022: Waitlist Table

**File**: `supabase/migrations/022_waitlist_table.sql`

#### Step 1: Apply Migration

```bash
# Backup first
supabase db dump --db-url <production_url> > backup_pre_022.sql

# Apply migration
supabase db push --db-url <production_url>
```

#### Step 2: Verify Table Created

```sql
-- Connect to database
psql <production_url>

-- Check table structure
\d waitlist

-- Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'waitlist';

-- Should show 3 policies:
-- 1. Users can view own waitlist entries
-- 2. Users can insert own waitlist entries
-- 3. Service role full access
```

#### Step 3: Test Waitlist Function

```sql
-- Test join_waitlist function
SELECT * FROM join_waitlist('growth');

-- Should return: (true, 'Added to waitlist', <uuid>)

-- Verify entry created
SELECT * FROM waitlist WHERE user_id = auth.uid();

-- Test duplicate prevention
SELECT * FROM join_waitlist('growth');

-- Should return: (true, 'Already on waitlist', NULL)
```

---

## Stripe Integration Setup

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Complete business verification
3. Activate account (required for live payments)

### Step 2: Create Coffee Plan Product

1. In Stripe Dashboard, go to **Products**
2. Click **"Add product"**
3. Fill in:
   - **Name**: Coffee Plan
   - **Description**: Unlimited AI-powered analyses
   - **Pricing**:
     - **Model**: Recurring
     - **Price**: $4.95
     - **Billing period**: Monthly
   - **Tax behavior**: Select appropriate tax code
4. Click **"Save product"**
5. **Copy Price ID** (starts with `price_...`)

### Step 3: Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Fill in:
   - **Endpoint URL**: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
   - **Description**: AImpactScanner Subscription Webhooks
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
4. Click **"Add endpoint"**
5. **Copy Webhook Signing Secret** (starts with `whsec_...`)

### Step 4: Get API Keys

1. Go to **Developers** → **API keys**
2. **Publishable key**: Starts with `pk_live_...` (for client-side)
3. **Secret key**: Click **"Reveal"** → Starts with `sk_live_...` (for server-side)
4. **Copy both keys**

### Step 5: Set Environment Variables

```bash
# Client-side (.env)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_STRIPE_COFFEE_PRICE_ID=price_...

# Server-side (Supabase secrets)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_COFFEE_PRICE_ID=price_...
```

### Step 6: Test Payment Flow

```bash
# Use Stripe test mode first
1. Create test product with price_id (test mode)
2. Configure test webhook endpoint
3. Use test API keys (pk_test_..., sk_test_...)
4. Test checkout with Stripe test card: 4242 4242 4242 4242
5. Verify webhook received and processed
6. Check user tier updated in database
7. Repeat with production keys when ready
```

---

## Supabase Edge Functions

### Deploy stripe-webhook Function

```bash
# Step 1: Navigate to Edge Functions directory
cd supabase/functions/stripe-webhook

# Step 2: Review function code
cat index.ts

# Step 3: Deploy to production
supabase functions deploy stripe-webhook --project-ref <project_id>

# Step 4: Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref <project_id>
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref <project_id>
supabase secrets set SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co --project-ref <project_id>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key> --project-ref <project_id>

# Step 5: Verify deployment
supabase functions list --project-ref <project_id>

# Should show: stripe-webhook (deployed, version X)

# Step 6: Test function
curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{}'

# Should return 400 (signature verification failed) - this is expected
```

### Monitor Edge Function Logs

```bash
# View real-time logs
supabase functions logs stripe-webhook --project-ref <project_id>

# View specific event
supabase functions logs stripe-webhook --event <event_id> --project-ref <project_id>

# Filter by timestamp
supabase functions logs stripe-webhook --since "2025-10-01 00:00:00" --project-ref <project_id>
```

---

## Environment Variables Configuration

### Client-Side Variables (.env)

**Location**: `/aimpactscanner-mvp/.env`

```bash
# Supabase
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_from_supabase_dashboard>

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_<your_stripe_public_key>
VITE_STRIPE_COFFEE_PRICE_ID=price_<coffee_plan_price_id>

# App
VITE_APP_URL=https://aimpactscanner.com

# Analytics (optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Security Notes**:
- ✅ `VITE_` prefix makes variables available to client
- ✅ Anon key is safe to expose (RLS protects data)
- ✅ Publishable Stripe key is safe to expose
- ❌ NEVER expose secret keys in client-side .env

### Server-Side Variables (Supabase Secrets)

```bash
# Set all secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref <project_id>
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref <project_id>
supabase secrets set SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co --project-ref <project_id>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key> --project-ref <project_id>
supabase secrets set RESEND_API_KEY=re_... --project-ref <project_id>
supabase secrets set APP_URL=https://aimpactscanner.com --project-ref <project_id>

# Verify all secrets set
supabase secrets list --project-ref <project_id>

# Should show:
# STRIPE_SECRET_KEY (set)
# STRIPE_WEBHOOK_SECRET (set)
# SUPABASE_URL (set)
# SUPABASE_SERVICE_ROLE_KEY (set)
# RESEND_API_KEY (set)
# APP_URL (set)
```

### Hosting Platform Variables (Netlify/Vercel)

**Netlify**:
1. Go to Site Settings → Build & deploy → Environment
2. Add variables (same as client-side .env)
3. Trigger redeploy

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Add variables for Production, Preview, Development
3. Redeploy

---

## Monitoring and Logging

### Supabase Monitoring

#### Authentication Metrics

```sql
-- Daily signups by provider
SELECT
  DATE(created_at) AS date,
  auth_provider,
  COUNT(*) AS signups
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), auth_provider
ORDER BY date DESC, signups DESC;

-- OAuth success rate (requires auth logs)
-- Check Supabase Dashboard → Logs → Auth logs
```

#### Database Performance

```sql
-- Slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Stripe Monitoring

#### Payment Success Rate

1. Go to Stripe Dashboard → Analytics
2. Check **Successful payments** vs **Failed payments**
3. Target: >95% success rate

#### Webhook Delivery

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on webhook endpoint
3. Check **Events sent** and **Events delivered**
4. Investigate any failed deliveries

#### Revenue Metrics

```sql
-- Monthly recurring revenue (MRR)
SELECT
  COUNT(*) FILTER (WHERE tier = 'coffee') AS coffee_subscribers,
  COUNT(*) FILTER (WHERE tier = 'coffee') * 4.95 AS coffee_mrr,
  COUNT(*) FILTER (WHERE tier = 'growth') AS growth_subscribers,
  COUNT(*) FILTER (WHERE tier = 'growth') * 29.00 AS growth_mrr,
  COUNT(*) FILTER (WHERE tier = 'scale') AS scale_subscribers,
  COUNT(*) FILTER (WHERE tier = 'scale') * 99.00 AS scale_mrr
FROM users
WHERE subscription_status = 'active';
```

### Application Logs

#### Frontend Errors (Sentry/LogRocket)

1. Configure error tracking service
2. Monitor error rates
3. Set up alerts for critical errors
4. Review user session recordings

#### Edge Function Logs

```bash
# Real-time monitoring
supabase functions logs stripe-webhook --tail --project-ref <project_id>

# Filter by status code
supabase functions logs stripe-webhook | grep "status: 200"

# Export logs for analysis
supabase functions logs stripe-webhook --since "2025-10-01" > logs_oct.txt
```

---

## Incident Response

### Authentication Failures

**Symptoms**:
- Users unable to sign in
- OAuth redirects failing
- Magic links not delivered

**Investigation Steps**:
1. Check Supabase status page
2. Verify OAuth provider status (Google/GitHub)
3. Check SMTP delivery (Resend dashboard)
4. Review auth logs in Supabase

**Resolution**:
- OAuth failures: Verify redirect URIs haven't changed
- Magic link failures: Check SMTP settings and Resend quota
- Rate limiting: Temporarily increase Supabase auth rate limits

---

### Payment Processing Failures

**Symptoms**:
- Users report payment declined
- Webhooks not processing
- Tier not updating after payment

**Investigation Steps**:
1. Check Stripe Dashboard → Payments
2. Find customer by email
3. Check payment intent status
4. Check webhook delivery logs
5. Query database for user tier

**Resolution**:
- Payment declined: Advise user to try different card
- Webhook failed: Manually update tier via SQL
- Tier not updated: Check Edge Function logs for errors

**Manual Tier Update** (last resort):
```sql
-- Verify payment in Stripe first
UPDATE users
SET
  tier = 'coffee',
  subscription_status = 'active',
  stripe_customer_id = '<customer_id_from_stripe>',
  stripe_subscription_id = '<subscription_id_from_stripe>',
  updated_at = NOW()
WHERE email = 'user@example.com';
```

---

### Database Connection Issues

**Symptoms**:
- Application timeouts
- Connection pool exhausted
- Slow query performance

**Investigation Steps**:
```sql
-- Check active connections
SELECT
  COUNT(*),
  state
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;

-- Check connection pool usage
SELECT
  numbackends,
  max_connections
FROM pg_stat_database, (SELECT setting::int AS max_connections FROM pg_settings WHERE name = 'max_connections') AS mc
WHERE datname = 'postgres';

-- Identify long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > INTERVAL '5 minutes'
ORDER BY duration DESC;
```

**Resolution**:
- Terminate long-running queries: `SELECT pg_terminate_backend(<pid>);`
- Increase connection pool size in Supabase Dashboard
- Optimize slow queries with indexes
- Scale up Supabase plan if needed

---

## Backup and Recovery

### Database Backups

#### Automated Backups (Supabase Pro)

- **Daily backups**: Automatic (retained 7 days)
- **Point-in-time recovery**: Available (up to 7 days)

#### Manual Backup

```bash
# Full database dump
supabase db dump --db-url <production_url> > backup_$(date +%Y%m%d).sql

# Specific tables only
supabase db dump --db-url <production_url> --schema public --table users > users_backup.sql

# Compressed backup
supabase db dump --db-url <production_url> | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Backup Schedule

```bash
# Cron job for daily backups (run on server)
0 2 * * * /usr/local/bin/supabase db dump --db-url $PROD_DB_URL | gzip > /backups/aimpactscanner_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days of backups
0 3 * * * find /backups -name "aimpactscanner_*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# Restore full database
psql <production_url> < backup_20251002.sql

# Restore specific table
psql <production_url> -c "TRUNCATE TABLE users;"
psql <production_url> < users_backup.sql

# Restore from compressed backup
gunzip -c backup_20251002.sql.gz | psql <production_url>
```

### Disaster Recovery Plan

**RPO (Recovery Point Objective)**: 24 hours
**RTO (Recovery Time Objective)**: 2 hours

**Steps**:
1. Assess severity (data loss vs corruption vs infrastructure failure)
2. Restore from most recent backup
3. Apply transaction logs if available (point-in-time recovery)
4. Verify data integrity
5. Resume operations
6. Notify users of downtime
7. Conduct post-mortem analysis

---

## Security Checklist

### Pre-Launch Security Audit

- [ ] **Authentication**
  - [ ] OAuth redirect URIs correctly configured
  - [ ] HTTPS enforced for all auth endpoints
  - [ ] Session tokens secure (httpOnly, secure, sameSite)
  - [ ] Magic link tokens expire in 1 hour
  - [ ] Magic link tokens single-use only

- [ ] **Authorization**
  - [ ] RLS policies enabled on all tables
  - [ ] Users can only access their own data
  - [ ] Service role access restricted to server-side
  - [ ] API keys never exposed in client code

- [ ] **Payment Security**
  - [ ] Stripe webhook signature verified
  - [ ] Payment amounts validated server-side
  - [ ] Stripe secret key never exposed
  - [ ] Idempotency implemented (no duplicate charges)

- [ ] **Data Protection**
  - [ ] HTTPS enforced site-wide
  - [ ] Database connections encrypted (TLS)
  - [ ] Sensitive data not logged
  - [ ] CORS configured correctly

- [ ] **Infrastructure**
  - [ ] Environment variables secured
  - [ ] Secrets rotated regularly
  - [ ] Database backups automated
  - [ ] Monitoring and alerting configured

### Post-Launch Security Monitoring

```bash
# Check for exposed secrets in logs
supabase functions logs stripe-webhook | grep -i "sk_live"

# Should return nothing - if it does, rotate keys immediately

# Monitor failed auth attempts
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS failed_attempts
FROM auth.audit_log_entries
WHERE action = 'login_failed'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

# Alert if > 100 failed attempts per day

# Check for suspicious activity
SELECT
  user_id,
  COUNT(*) AS actions,
  MIN(created_at) AS first_action,
  MAX(created_at) AS last_action
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY actions DESC;

# Alert if > 50 actions per hour from single user (possible bot)
```

---

## Troubleshooting Common Issues

### OAuth Redirect Loop

**Symptom**: User stuck in redirect loop after OAuth

**Cause**: Redirect URI mismatch

**Fix**:
1. Check OAuth provider settings
2. Verify redirect URI exactly matches: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
3. Ensure no trailing slashes
4. Clear browser cookies and try again

---

### Webhook Not Receiving Events

**Symptom**: Stripe payment succeeds but tier not updated

**Cause**: Webhook endpoint unreachable or signature verification failing

**Fix**:
```bash
# 1. Test endpoint manually
curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 400 (signature error) - means endpoint is reachable

# 2. Check Edge Function logs
supabase functions logs stripe-webhook --tail --project-ref <project_id>

# 3. Verify webhook secret
supabase secrets list --project-ref <project_id> | grep WEBHOOK

# 4. Test webhook in Stripe Dashboard
# Go to Developers → Webhooks → Send test webhook
```

---

### High Database CPU Usage

**Symptom**: Slow queries, timeout errors

**Cause**: Missing indexes, N+1 queries, connection pool exhaustion

**Fix**:
```sql
-- Identify slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX CONCURRENTLY idx_waitlist_user_tier ON waitlist(user_id, interested_tier);

-- Optimize queries to use indexes
-- Upgrade Supabase plan if needed
```

---

## Maintenance Schedule

### Daily
- [ ] Check Stripe webhook delivery (>95% success)
- [ ] Monitor authentication success rate (>98%)
- [ ] Review error logs for critical issues

### Weekly
- [ ] Review database performance metrics
- [ ] Check backup integrity
- [ ] Analyze user growth trends
- [ ] Review support tickets

### Monthly
- [ ] Rotate API keys and secrets
- [ ] Update dependencies (`npm update`)
- [ ] Review and optimize database queries
- [ ] Conduct security audit
- [ ] Review infrastructure costs

### Quarterly
- [ ] Load testing and performance benchmarking
- [ ] Disaster recovery drill
- [ ] Security penetration testing
- [ ] Infrastructure capacity planning

---

## Contact and Escalation

**On-Call Rotation**: TBD
**Escalation Path**: TBD

**Critical Incident** (P0 - Production down):
- Immediate response required
- Notify: CTO, Lead Engineer, Operations

**High Priority** (P1 - Major feature broken):
- Response within 1 hour
- Notify: Lead Engineer, Operations

**Medium Priority** (P2 - Minor feature broken):
- Response within 4 hours
- Notify: Operations

**Low Priority** (P3 - Enhancement/bug):
- Response within 24 hours
- Handle via support queue

---

**Last Updated**: 2025-10-02
**Version**: 2.0 (OAuth-First Authentication System)
