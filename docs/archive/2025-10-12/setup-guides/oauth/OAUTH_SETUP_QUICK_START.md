# OAuth Setup Quick Start - User Action Required

## What You Need to Do (90-120 minutes)

Before development can begin on the authentication system, you need to manually configure OAuth providers and environment variables. This is **configuration work** (clicking through dashboards), not coding.

---

## Step 1: Google OAuth Setup (30-40 minutes)

**Guide**: `/docs/oauth-setup-guide.md` (Google OAuth Setup section)

### Quick Actions

1. **Create Google Cloud Project**:
   - Go to: https://console.cloud.google.com/
   - Create new project: "AImpactScanner"

2. **Configure OAuth Consent Screen**:
   - APIs & Services → OAuth consent screen
   - User type: External
   - App name: AImpactScanner
   - Add your email for support/developer contact

3. **Create OAuth Credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - **CRITICAL**: Authorized redirect URI:
     ```
     https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
     ```
   - Copy Client ID and Client Secret (you'll need these for Supabase)

4. **Enable Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API" → Enable

### What You'll Get
- Google OAuth Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
- Google OAuth Client Secret (looks like: `GOCSPX-abc123...`)

---

## Step 2: GitHub OAuth Setup (20-30 minutes)

**Guide**: `/docs/oauth-setup-guide.md` (GitHub OAuth Setup section)

### Quick Actions

1. **Create GitHub OAuth App**:
   - Go to: https://github.com/settings/developers
   - OAuth Apps → New OAuth App
   - Application name: AImpactScanner
   - Homepage URL: `https://aimpactscanner.com`
   - **CRITICAL**: Authorization callback URL:
     ```
     https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
     ```

2. **Generate Client Secret**:
   - After creating app, click "Generate a new client secret"
   - Copy immediately (won't be shown again)

### What You'll Get
- GitHub OAuth Client ID (20-character alphanumeric)
- GitHub OAuth Client Secret (40-character hex string)

---

## Step 3: Configure Supabase (10 minutes)

**Guide**: `/docs/oauth-setup-guide.md` (Supabase Configuration section)

### Quick Actions

1. **Login to Supabase**:
   - Go to: https://supabase.com/dashboard
   - Select project: aimpactscanner-mvp

2. **Configure Google Provider**:
   - Authentication → Providers → Google
   - Enable: ON
   - Paste Google Client ID
   - Paste Google Client Secret
   - Save

3. **Configure GitHub Provider**:
   - Same page → GitHub
   - Enable: ON
   - Paste GitHub Client ID
   - Paste GitHub Client Secret
   - Save

### Verification
- Both providers show "Enabled" status with green checkmarks

---

## Step 4: Server-Side Environment Variables (15 minutes)

**Guide**: `/docs/environment-variables.md`

### Quick Actions

1. **Get Supabase Service Role Key**:
   - Supabase Dashboard → Settings → API
   - Click "Reveal" next to "service_role" key
   - Copy (very long JWT token)

2. **Get Stripe Secret Key**:
   - Stripe Dashboard: https://dashboard.stripe.com
   - Switch to **Live Mode** (toggle top right)
   - Developers → API keys
   - Copy "Secret key" (starts with `sk_live_`)

3. **Configure Netlify**:
   - Netlify Dashboard: https://app.netlify.com
   - Select site: aimpactscanner
   - Site settings → Environment variables
   - Add these variables:
     - `SUPABASE_SERVICE_ROLE_KEY` = [paste Supabase service role key]
     - `STRIPE_SECRET_KEY` = [paste Stripe secret key]
     - `VITE_STRIPE_COFFEE_PRICE_ID` = `price_1RnSa4IiC84gpR8HXmbDgaNy`
   - Scope: All (or Production for Stripe secret)

4. **Trigger Redeploy**:
   - Deploys → Trigger deploy → Deploy site

---

## Step 5: Test OAuth (15 minutes)

### Test Google OAuth

1. Navigate to: https://aimpactscanner.com/#/signup (or local dev server)
2. Click "Sign in with Google"
3. Select your Google account
4. Authorize application
5. Verify you're logged in and redirected

### Test GitHub OAuth

1. Navigate to signup page
2. Click "Sign in with GitHub"
3. Authorize application
4. Verify you're logged in and redirected

### Verify in Supabase

1. Supabase Dashboard → Authentication → Users
2. You should see your test accounts
3. Check user metadata has email, name, avatar

---

## Common Issues & Quick Fixes

### "redirect_uri_mismatch" Error

**Fix**: Go back to Google Cloud Console or GitHub OAuth App settings and verify the redirect URI is EXACTLY:
```
https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
```
No trailing slash, HTTPS (not HTTP), case-sensitive.

### "invalid_client" Error

**Fix**: Double-check you copied the Client ID and Client Secret correctly from provider to Supabase. Try copying again.

### OAuth Button Doesn't Work

**Fix**: Check browser console for errors. Verify providers are "Enabled" in Supabase dashboard.

---

## What Happens After You Complete This

Once you complete these steps:

1. OAuth providers will be fully configured
2. Development can begin on authentication components
3. Developer (@developer) will implement:
   - OAuth buttons and callback handling
   - Database migrations for new auth columns
   - Routing logic for post-signup flow
   - Stripe integration for Coffee tier
   - Upsell pages for tier upgrades

**Timeline After Setup**: 12 days (96 hours) for full implementation

---

## Need Help?

**Detailed Instructions**: See `/docs/oauth-setup-guide.md` for step-by-step screenshots and explanations

**Environment Variables**: See `/docs/environment-variables.md` for complete reference

**Questions?**:
- Google OAuth issues: Check troubleshooting section in oauth-setup-guide.md
- GitHub OAuth issues: Check troubleshooting section in oauth-setup-guide.md
- Supabase configuration: See Supabase Configuration section in oauth-setup-guide.md

---

## Summary

**What**: Configure Google and GitHub OAuth + environment variables
**Why**: Required before authentication system development can begin
**How Long**: 90-120 minutes of manual configuration
**Cost**: $0 (all free services)
**Result**: Fully configured OAuth providers ready for development

**Next**: Developer will implement components using configured OAuth providers

---

*Last Updated: October 2, 2025*
*Status: Ready for user to complete*
*Estimated Completion Time: 90-120 minutes*
