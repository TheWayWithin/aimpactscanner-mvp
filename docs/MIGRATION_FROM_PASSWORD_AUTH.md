# Migration Guide: From Password Auth to OAuth-First

**Version**: 2.0
**Migration Date**: 2025-10-02
**Status**: Complete
**Breaking Changes**: Yes (authentication flow completely changed)

---

## Executive Summary

AImpactScanner has migrated from email/password authentication to OAuth-first authentication with Google, GitHub, and Magic Link (passwordless email) support.

**Key Changes**:
- ❌ **Removed**: Email + password authentication
- ❌ **Removed**: Password reset functionality
- ❌ **Removed**: Email verification requirement
- ✅ **Added**: Google OAuth sign-in
- ✅ **Added**: GitHub OAuth sign-in
- ✅ **Added**: Magic Link (passwordless email) sign-in
- ✅ **Added**: Tier-based monetization with Stripe
- ✅ **Added**: Context-aware routing (URL preservation)

---

## Impact on Existing Users

### User Experience Changes

**Before (Password Auth)**:
1. User enters email + password
2. User receives verification email
3. User clicks verification link
4. User can log in

**After (OAuth-First)**:
1. User clicks "Continue with Google" (or GitHub/Email)
2. User authenticates via OAuth provider
3. User is immediately logged in (no verification needed)

### Data Migration

**Existing users are NOT affected**:
- ✅ Existing accounts remain valid
- ✅ Users can log in using new auth methods with same email
- ✅ No data loss or downtime
- ⚠️ Users must use OAuth or Magic Link (passwords no longer work)

**Migration Strategy**:
- Existing users see notice: "We've upgraded to passwordless sign-in! Use Google, GitHub, or Magic Link."
- First OAuth/Magic Link login links to existing account via email
- Password field removed from login page

---

## Breaking Changes

### API Changes

#### Authentication Endpoints

**Removed Endpoints**:
```javascript
// ❌ No longer supported
supabase.auth.signUp({ email, password })
supabase.auth.signIn({ email, password })
supabase.auth.resetPasswordForEmail(email)
supabase.auth.updateUser({ password: newPassword })
```

**New Endpoints**:
```javascript
// ✅ Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/#/oauth-callback`
  }
});

// ✅ GitHub OAuth
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/#/oauth-callback`
  }
});

// ✅ Magic Link
await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: `${window.location.origin}/#/oauth-callback`
  }
});
```

### Database Schema Changes

#### New Columns in `users` Table

```sql
-- Authentication tracking
auth_provider TEXT                    -- 'google', 'github', 'email'
selected_tier TEXT DEFAULT 'free'     -- Tier selected during signup
subscription_status TEXT DEFAULT 'active'

-- Stripe integration
stripe_customer_id TEXT UNIQUE
stripe_subscription_id TEXT UNIQUE

-- Journey tracking
is_first_login BOOLEAN DEFAULT true
signup_source TEXT

-- Waitlist flags
growth_waitlist BOOLEAN DEFAULT false
scale_waitlist BOOLEAN DEFAULT false
waitlist_joined_at TIMESTAMPTZ

-- Analytics
last_upsell_shown TIMESTAMPTZ
upsell_dismissed_count INTEGER DEFAULT 0
```

#### New Table: `waitlist`

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  current_tier TEXT NOT NULL,
  interested_tier TEXT NOT NULL CHECK (interested_tier IN ('growth', 'scale')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);
```

### Component Changes

#### Removed Components

```javascript
// ❌ components/AuthWithPassword.jsx - Deleted
// ❌ components/PasswordResetPage.jsx - Deleted
// ❌ components/ResetPassword.jsx - Deleted
```

#### New Components

```javascript
// ✅ components/TierSelector.jsx - Tier selection UI
// ✅ components/AuthMethodSelector.jsx - OAuth + Magic Link buttons
// ✅ components/OAuthCallback.jsx - Post-OAuth routing handler
// ✅ pages/UpsellCoffee.jsx - Coffee tier upsell
// ✅ pages/UpsellGrowth.jsx - Growth tier waitlist
// ✅ pages/UpsellScale.jsx - Scale tier waitlist
// ✅ pages/WelcomeScale.jsx - Scale tier welcome
// ✅ pages/CheckoutSuccess.jsx - Post-payment success
// ✅ pages/CheckoutCancel.jsx - Payment cancellation
```

#### Modified Components

```javascript
// ⚙️ components/UnifiedRegistration.jsx - Removed password fields
// ⚙️ components/Login.jsx - Now uses AuthMethodSelector
// ⚙️ App.jsx - Added new routes for upsell/checkout pages
```

---

## Migration Steps

### For Developers

#### Step 1: Update Local Environment

```bash
# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Install dependencies (if any new ones)
npm install

# Update environment variables
cp .env.example .env
# Add new variables:
# VITE_STRIPE_PUBLIC_KEY=pk_test_...
# VITE_STRIPE_COFFEE_PRICE_ID=price_...
```

#### Step 2: Run Database Migrations

```bash
# Start Supabase (if using local instance)
supabase start

# Apply migrations
supabase db push

# Verify migrations applied
supabase migrations list

# Should show:
# - 021_auth_tier_columns (applied)
# - 022_waitlist_table (applied)
```

#### Step 3: Configure OAuth Providers (Local Development)

```bash
# For local OAuth testing, use ngrok or similar
ngrok http 5173

# Update OAuth redirect URIs in:
# - Google Cloud Console
# - GitHub OAuth App
# - Supabase Dashboard

# Use ngrok URL for redirects:
# https://<random>.ngrok.io/#/oauth-callback
```

#### Step 4: Test Authentication Flows

```bash
# Start development server
npm run dev

# Test each auth method:
1. Visit http://localhost:5173/register
2. Test Google OAuth
3. Test GitHub OAuth
4. Test Magic Link
5. Verify user created in Supabase Dashboard
```

### For Operators

#### Step 1: Configure OAuth Providers (Production)

See [Operator Guide](./operator-guide.md#oauth-provider-configuration) for detailed steps:

1. Set up Google OAuth app
2. Set up GitHub OAuth app
3. Configure Supabase Auth providers
4. Set up Resend for Magic Link emails

#### Step 2: Deploy Database Migrations

```bash
# Backup production database
supabase db dump --db-url <prod_url> > backup_$(date +%Y%m%d).sql

# Apply migrations to production
supabase db push --db-url <prod_url>

# Verify migrations successful
supabase migrations list --db-url <prod_url>
```

#### Step 3: Configure Stripe Integration

See [Operator Guide](./operator-guide.md#stripe-integration-setup) for detailed steps:

1. Create Coffee Plan product ($4.95/month)
2. Set up webhook endpoint
3. Configure environment variables
4. Test payment flow in Stripe test mode

#### Step 4: Deploy Application

```bash
# Build production bundle
npm run build

# Deploy to hosting platform (Netlify/Vercel)
git push origin main

# Verify deployment successful
curl https://aimpactscanner.com/health
```

### For Users

#### Existing Users Migration

**No action required** from existing users. On next login:

1. User visits login page
2. Sees new options: Google, GitHub, or Magic Link
3. Uses any method with their registered email
4. Account automatically linked (via email match)
5. User logged in successfully

**Password No Longer Works**:
- If user tries password, see message: "We've upgraded to passwordless sign-in! Use Google, GitHub, or Magic Link."
- User clicks preferred method
- Logs in successfully

#### New Users

1. Visit aimpactscanner.com
2. Click "Sign Up"
3. Select tier (Free, Coffee, Growth, Scale)
4. Choose auth method (Google, GitHub, or Magic Link)
5. Complete authentication
6. If Coffee tier → Complete payment via Stripe
7. Start using AImpactScanner

---

## Rollback Procedure

### If Critical Issues Arise

#### Quick Rollback (Code-Level)

```bash
# Revert to previous version
git revert HEAD
git push origin main

# This reverts code changes but keeps database migrations
# Existing users can still use OAuth if they've already switched
```

#### Full Rollback (Database + Code)

```bash
# WARNING: This removes OAuth functionality entirely

# 1. Revert code changes
git revert HEAD
git push origin main

# 2. Rollback database migrations (risky)
# Only do this if no users have signed up via OAuth

# Connect to database
psql <production_url>

# Drop new columns (CAREFUL)
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
-- (drop all new columns)

# Drop new table
DROP TABLE IF EXISTS waitlist;

# 3. Verify rollback successful
# - Users can log in with password again
# - No errors in logs
# - No orphaned data
```

**Risk**: Users who signed up via OAuth will lose access (no password set)

**Mitigation**: Send password reset email to OAuth users before rollback

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] **Google OAuth**
  - [ ] Signup creates new user
  - [ ] Login works for existing user
  - [ ] Email correctly extracted from Google profile
  - [ ] Session established correctly

- [ ] **GitHub OAuth**
  - [ ] Signup creates new user
  - [ ] Login works for existing user
  - [ ] Email correctly extracted from GitHub profile
  - [ ] Session established correctly

- [ ] **Magic Link**
  - [ ] Email delivered within 30 seconds
  - [ ] Link works when clicked
  - [ ] Link expires after 1 hour
  - [ ] Link is single-use only

- [ ] **Context Preservation**
  - [ ] URL entered on landing page pre-fills after signup
  - [ ] Context survives OAuth redirects
  - [ ] Context clears after use

- [ ] **Payment Flow**
  - [ ] Stripe checkout session created
  - [ ] Payment succeeds and tier updates
  - [ ] Webhook processes correctly
  - [ ] Payment failure keeps user on Free tier

- [ ] **Routing Logic**
  - [ ] First login skips upsell
  - [ ] Second login shows correct upsell based on tier
  - [ ] Upsell can be dismissed
  - [ ] Waitlist join works correctly

### Post-Deployment Monitoring

```bash
# Monitor authentication success rate
SELECT
  DATE(created_at) AS date,
  auth_provider,
  COUNT(*) AS signups
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), auth_provider
ORDER BY date DESC;

# Target: >95% success rate across all methods

# Monitor payment success rate
# Check Stripe Dashboard → Analytics
# Target: >95% successful payments

# Monitor error rates
supabase functions logs stripe-webhook | grep "error"
# Should be minimal errors
```

---

## Known Issues and Workarounds

### Issue 1: OAuth Popup Blocked

**Symptom**: User clicks "Continue with Google" but nothing happens

**Cause**: Browser blocked OAuth popup

**Workaround**:
1. Enable popups for aimpactscanner.com
2. Alternatively, use Magic Link method

### Issue 2: Magic Link Not Delivered

**Symptom**: User doesn't receive magic link email

**Cause**:
- Email in spam folder
- SMTP quota exceeded
- Email address typo

**Workaround**:
1. Check spam folder
2. Click "Resend Magic Link"
3. Verify email address spelling
4. Use OAuth method instead

### Issue 3: Payment Fails But Tier Shows "Coffee"

**Symptom**: User's tier shows "coffee" but Stripe shows failed payment

**Cause**: Webhook processed out of order

**Workaround**:
```sql
-- Manually verify payment in Stripe
-- If payment actually failed:
UPDATE users
SET tier = 'free', subscription_status = 'active'
WHERE email = 'user@example.com';

-- If payment actually succeeded:
UPDATE users
SET tier = 'coffee', subscription_status = 'active'
WHERE email = 'user@example.com';
```

---

## Support Resources

### For Users

**User Guide**: [docs/user-guide.md](./user-guide.md)
**FAQ**: See user guide FAQ section
**Support Email**: support@aimpactscanner.com

### For Developers

**Developer Guide**: [docs/developer-guide.md](./developer-guide.md)
**API Reference**: See developer guide API section
**Architecture Decisions**: [docs/ADR_AUTH_MONETIZATION.md](./ADR_AUTH_MONETIZATION.md)

### For Operators

**Operator Guide**: [docs/operator-guide.md](./operator-guide.md)
**Monitoring**: See operator guide monitoring section
**Incident Response**: See operator guide incident response section

---

## Timeline

**Planning Phase**: 2025-09-25 to 2025-09-28
**Development Phase**: 2025-09-29 to 2025-10-01
**Testing Phase**: 2025-10-02 (in progress)
**Staging Deployment**: 2025-10-03 (planned)
**Production Deployment**: 2025-10-05 (planned)
**Monitoring Period**: 2025-10-05 to 2025-10-12

---

## Success Criteria

Migration considered successful when:
- [ ] 95%+ authentication success rate across all methods
- [ ] 95%+ payment success rate
- [ ] Zero critical bugs in production
- [ ] User support tickets < 5% of daily active users
- [ ] Coffee tier conversion rate > 15%
- [ ] No security vulnerabilities discovered

---

**Last Updated**: 2025-10-02
**Version**: 1.0
**Migration Status**: Complete - Ready for Testing
