# OAuth-First Authentication & Monetization Testing Guide

**Project**: AImpactScanner MVP
**Mission**: Comprehensive testing of OAuth-first auth system
**Created**: 2025-10-02
**Status**: Ready for Execution
**Priority**: CRITICAL - Pre-Production Validation

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Pre-Testing Checklist](#pre-testing-checklist)
3. [Manual Testing Guide](#manual-testing-guide)
4. [User Journey Testing](#user-journey-testing)
5. [Cross-Browser Testing](#cross-browser-testing)
6. [Mobile Responsive Testing](#mobile-responsive-testing)
7. [Error Scenario Testing](#error-scenario-testing)
8. [Security Testing](#security-testing)
9. [Performance Testing](#performance-testing)
10. [Accessibility Testing](#accessibility-testing)
11. [Bug Reporting Template](#bug-reporting-template)

---

## Testing Overview

### Scope

This guide covers comprehensive testing of the OAuth-first authentication and tier-based monetization system, including:

- **Authentication Components**: TierSelector, AuthMethodSelector, OAuthCallback, UnifiedRegistration
- **Upsell Pages**: UpsellCoffee, UpsellGrowth, UpsellScale, WelcomeScale
- **Payment Flow**: Stripe checkout integration, webhook processing
- **Context Preservation**: localStorage routing through OAuth redirects
- **Database Migrations**: Schema changes for auth/monetization

### Testing Priorities

**P0 - CRITICAL (Must Pass)**:
- Journey A: Landing → URL → Signup → Coffee Payment → Analysis
- Journey B: Landing → URL → Signup → Free → Analysis
- OAuth authentication flows (Google, GitHub)
- Stripe payment processing
- Context preservation through redirects

**P1 - HIGH (Should Pass)**:
- Journey D: Returning Free User → Upsell Coffee
- Error scenario handling
- Cross-browser compatibility
- Mobile responsive design

**P2 - MEDIUM (Good to Have)**:
- Journeys E, F, G (Growth/Scale tier flows)
- Waitlist functionality
- Advanced error scenarios

### Testing Environment Requirements

**Development Environment**:
- Node.js v18+
- npm installed
- Supabase CLI (optional for local testing)
- Playwright installed (`npm install -D @playwright/test`)

**Browser Requirements**:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest - macOS only)
- Edge (latest)

**Mobile Testing**:
- iOS Safari (iOS 15+)
- Chrome Mobile (Android 10+)

**Test Accounts**:
- Google OAuth test account
- GitHub OAuth test account
- Test email addresses for Magic Link
- Stripe test mode credentials

---

## Pre-Testing Checklist

### ⚠️ CRITICAL: Complete Before E2E Testing

These dependencies MUST be configured before end-to-end testing can begin. Until these are complete, tests will be marked as **SKIPPED** or **BLOCKED**.

#### 1. OAuth Provider Configuration

**Google OAuth**:
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized redirect URI configured: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- [ ] Supabase Google provider enabled in Dashboard → Authentication → Providers
- [ ] Client ID and Secret added to Supabase
- [ ] Test with: "Continue with Google" button

**GitHub OAuth**:
- [ ] GitHub OAuth App created
- [ ] Authorization callback URL configured: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- [ ] Supabase GitHub provider enabled
- [ ] Client ID and Secret added to Supabase
- [ ] Test with: "Continue with GitHub" button

**Verification Commands**:
```sql
-- Check Supabase auth providers configured
SELECT * FROM auth.config WHERE name IN ('external_google_enabled', 'external_github_enabled');
```

#### 2. Database Migrations

**Migration 021** (Auth & Tier Columns):
- [ ] Migration file exists: `/supabase/migrations/021_auth_monetization_tier_routing.sql`
- [ ] Migration deployed to production: `supabase db push`
- [ ] Verify columns exist in `users` table
- [ ] Test RLS policies allow authenticated users to update tier

**Migration 022** (Waitlist Table):
- [ ] Migration file exists: `/supabase/migrations/022_waitlist_capture.sql`
- [ ] Migration deployed to production
- [ ] Waitlist table created with RLS policies
- [ ] Test waitlist insertion function

**Verification Queries**:
```sql
-- Verify auth columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('auth_provider', 'selected_tier', 'is_first_login', 'stripe_customer_id');

-- Verify waitlist table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'waitlist';

-- Test first_login flag
SELECT id, email, tier, is_first_login FROM users LIMIT 5;
```

#### 3. Stripe Integration

**Stripe Configuration**:
- [ ] Stripe account created (use Test Mode for testing)
- [ ] Coffee Plan product created in Stripe Dashboard
- [ ] Price configured: $4.95/month recurring
- [ ] Webhook endpoint created: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
- [ ] Webhook secret obtained and stored in environment variables
- [ ] Stripe publishable key in `.env`: `VITE_STRIPE_PUBLIC_KEY`
- [ ] Stripe secret key in Supabase secrets: `STRIPE_SECRET_KEY`
- [ ] Webhook events subscribed:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

**Stripe Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

**Verification Commands**:
```bash
# Test Stripe CLI webhook forwarding
stripe listen --forward-to https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

#### 4. Supabase Edge Functions

**Edge Functions Required**:
- [ ] `stripe-webhook` function deployed
- [ ] Function has environment variables configured:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] Function handles `checkout.session.completed` event
- [ ] Function updates user tier in database
- [ ] Function logs webhook processing

**Deploy Commands**:
```bash
# Deploy webhook function
supabase functions deploy stripe-webhook --no-verify-jwt

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Verification**:
```bash
# Check function logs
supabase functions logs stripe-webhook --limit 10

# Test function manually
curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "checkout.session.completed", "data": {...}}'
```

#### 5. Environment Variables

**Required Variables**:
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (test mode)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (server-side only)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Verification**:
```bash
# Check environment variables loaded
echo $VITE_SUPABASE_URL
echo $VITE_STRIPE_PUBLIC_KEY

# Check Supabase secrets
supabase secrets list
```

#### 6. Build & Deployment

**Production Build**:
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical only)
- [ ] Bundle size under 500KB (optimized)
- [ ] All routes accessible

**Deployment**:
- [ ] Staging environment deployed
- [ ] OAuth redirect URIs whitelist staging domain
- [ ] Stripe webhook points to staging
- [ ] All environment variables configured in hosting platform

**Verification**:
```bash
# Build and check for errors
npm run build 2>&1 | tee build.log

# Check bundle size
ls -lh dist/assets/*.js | sort -k5 -h

# Test staging deployment
curl -I https://staging.aimpactscanner.com
```

---

## Manual Testing Guide

### Setting Up Test Environment

**1. Clear Browser State**:
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
// Then hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

**2. Create Test Accounts**:
- Google: Use personal Google account or create test account
- GitHub: Use existing account or create test account
- Email: Use temp email service (mailinator.com, guerrillamail.com)

**3. Test Data Preparation**:
```javascript
// Store test URL in localStorage (simulate landing page entry)
localStorage.setItem('pendingAnalysisUrl', 'https://example.com');
localStorage.setItem('pendingAnalysisId', 'test-' + Date.now());
```

### Testing Browser Console Commands

**Inspect Context**:
```javascript
// Check all stored context
console.log('Pending URL:', localStorage.getItem('pendingAnalysisUrl'));
console.log('Auth Context:', JSON.parse(localStorage.getItem('authContext') || 'null'));
console.log('Session Storage:', sessionStorage);
```

**Manually Set Context** (for testing edge cases):
```javascript
// Simulate landing page context
localStorage.setItem('pendingAnalysisUrl', 'https://test.com');
localStorage.setItem('pendingAnalysisId', 'test-123');

// Simulate auth context (set before OAuth)
const authContext = {
  selectedTier: 'coffee',
  timestamp: Date.now(),
  mode: 'signup',
  pendingAnalysisUrl: 'https://test.com',
  pendingAnalysisId: 'test-123'
};
localStorage.setItem('authContext', JSON.stringify(authContext));
localStorage.setItem('authContextExpiry', (Date.now() + 86400000).toString());
```

**Clear Context for Fresh Test**:
```javascript
// Complete reset
['pendingAnalysisUrl', 'pendingAnalysisId', 'authContext', 'authContextExpiry', 'landingAnalysisData']
  .forEach(key => localStorage.removeItem(key));
sessionStorage.clear();
console.log('✅ All context cleared');
```

**Check User State**:
```javascript
// Get current session
import { supabase } from './src/lib/supabase';
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
```

---

## User Journey Testing

### Journey A: Landing Page → URL Entry → Signup → Coffee Payment → Analysis

**Priority**: P0 - CRITICAL
**Estimated Time**: 15-20 minutes
**Blockers**: OAuth configured, Stripe configured, Database migrations deployed

#### Test Steps

1. **Landing Page - URL Entry**
   - [ ] Navigate to https://aimpactscanner.com (or staging URL)
   - [ ] Ensure not authenticated (clear cookies if needed)
   - [ ] Enter test URL: `https://example.com`
   - [ ] **VERIFY**: `localStorage.pendingAnalysisUrl` is set
   - [ ] Click "Analyze" button
   - [ ] **VERIFY**: Redirected to `/register` (signup page)

2. **Signup - Tier Selection**
   - [ ] Signup page loads without errors
   - [ ] Four tier cards displayed: Free, Coffee, Growth, Scale
   - [ ] **VERIFY**: Coffee tier is highlighted as "MOST POPULAR"
   - [ ] Select "Coffee" tier
   - [ ] **VERIFY**: Selected tier shows visual indicator (checkmark, border, etc.)

3. **Auth Method Selection**
   - [ ] Three auth methods displayed:
     - "Continue with Google" (blue button, prominent)
     - "Continue with GitHub" (dark button)
     - "Continue with Email" (subtle, below OAuth)
   - [ ] Click "Continue with Google"
   - [ ] **VERIFY**: `localStorage.authContext` stored with:
     ```json
     {
       "selectedTier": "coffee",
       "pendingAnalysisUrl": "https://example.com",
       "pendingAnalysisId": "...",
       "timestamp": 1234567890,
       "mode": "signup"
     }
     ```

4. **OAuth Flow**
   - [ ] Redirected to Google OAuth consent screen
   - [ ] Select Google account
   - [ ] Grant permissions (email, profile)
   - [ ] **VERIFY**: Redirected back to app at `/oauth-callback`
   - [ ] Loading indicator shown: "Completing authentication..."
   - [ ] No errors in browser console

5. **Post-OAuth Processing**
   - [ ] OAuthCallback component processes:
     - Retrieves session from Supabase
     - Checks `is_first_login = true`
     - Retrieves `authContext` from localStorage
     - Calls `getPostSignupDestination()`
   - [ ] **VERIFY**: Since `selectedTier = 'coffee'`, user should be routed to Stripe checkout
   - [ ] **VERIFY**: Redirected to Stripe Checkout page

6. **Stripe Payment**
   - [ ] Stripe Checkout session loaded
   - [ ] Product shown: "AImpactScanner Coffee Plan - $4.95/month"
   - [ ] Enter test card: `4242 4242 4242 4242`
   - [ ] Expiry: Any future date (e.g., `12/25`)
   - [ ] CVC: Any 3 digits (e.g., `123`)
   - [ ] ZIP: Any valid ZIP (e.g., `12345`)
   - [ ] Click "Subscribe"
   - [ ] **VERIFY**: Payment processing (loading state)
   - [ ] **VERIFY**: Redirected to `/checkout-success` (success page)

7. **Checkout Success - Webhook Processing**
   - [ ] Success page shows: "Processing your upgrade..."
   - [ ] Polling starts (checking database for tier update)
   - [ ] **VERIFY**: Stripe webhook fires within 2-5 seconds
   - [ ] **VERIFY**: Database updated:
     ```sql
     SELECT tier, subscription_status, stripe_customer_id
     FROM users
     WHERE email = 'your-test-email@example.com';
     -- Expected: tier='coffee', subscription_status='active'
     ```
   - [ ] Success message updates: "✅ Upgrade complete!"
   - [ ] "Continue" button appears

8. **Post-Payment Routing**
   - [ ] Click "Continue" button
   - [ ] **VERIFY**: Redirected to `/analyze` (Analysis page)
   - [ ] **VERIFY**: URL input field is **pre-filled** with `https://example.com`
   - [ ] **VERIFY**: `sessionStorage.prefilledUrl` contains the URL
   - [ ] **VERIFY**: User can see "Coffee" tier badge in navbar

9. **Analysis Execution**
   - [ ] Pre-filled URL is editable
   - [ ] Click "Analyze" button
   - [ ] Analysis starts (loading indicator)
   - [ ] Results page loads (may take 30-60 seconds)
   - [ ] **VERIFY**: Analysis completes successfully
   - [ ] **VERIFY**: PDF export button available (Coffee tier feature)

#### Success Criteria

- ✅ URL context preserved from landing page through signup, OAuth, payment
- ✅ User sees original URL pre-filled after payment
- ✅ First login flag prevents upsell interruption
- ✅ Coffee tier features activated (PDF export)
- ✅ No errors in console throughout journey
- ✅ Smooth UX with appropriate loading states

#### Edge Cases to Test

- **Multiple Tabs**: Open 2 tabs, start signup in one, complete in another
- **Browser Back**: Hit back button during OAuth, context should persist
- **Refresh During Payment**: Refresh on checkout success page, tier should update
- **Network Delay**: Simulate slow connection, test timeout handling

---

### Journey B: Landing Page → URL Entry → Signup → Free Tier → Analysis

**Priority**: P0 - CRITICAL
**Estimated Time**: 10-15 minutes
**Blockers**: OAuth configured, Database migrations deployed

#### Test Steps

1. **Landing Page - URL Entry**
   - [ ] Navigate to landing page (logged out)
   - [ ] Enter test URL: `https://testsite.com`
   - [ ] **VERIFY**: `localStorage.pendingAnalysisUrl` stored
   - [ ] Click "Analyze"
   - [ ] **VERIFY**: Redirected to `/register`

2. **Signup - Free Tier Selection**
   - [ ] Signup page loads
   - [ ] Select "Free" tier (default selection)
   - [ ] **VERIFY**: Free tier shows benefits:
     - 3 analyses per month
     - Basic recommendations
     - Web-only results

3. **Auth Method - GitHub OAuth**
   - [ ] Click "Continue with GitHub"
   - [ ] **VERIFY**: `authContext` stored with `selectedTier: 'free'`
   - [ ] GitHub OAuth consent screen
   - [ ] Authorize app
   - [ ] **VERIFY**: Redirected back to `/oauth-callback`

4. **Post-OAuth - Skip Payment**
   - [ ] OAuthCallback processes:
     - `is_first_login = true`
     - `selectedTier = 'free'`
     - Has `pendingAnalysisUrl`
   - [ ] **VERIFY**: No Stripe redirect (skip payment for free tier)
   - [ ] **VERIFY**: Directly routed to `/analyze`
   - [ ] **VERIFY**: URL **pre-filled** with `https://testsite.com`

5. **Analysis Page - Free Tier**
   - [ ] Analysis page loads with pre-filled URL
   - [ ] Click "Analyze"
   - [ ] Analysis completes
   - [ ] **VERIFY**: Results shown
   - [ ] **VERIFY**: No PDF export button (free tier limitation)
   - [ ] **VERIFY**: "Upgrade to Coffee" CTA shown for PDF export

#### Success Criteria

- ✅ Free tier signup works without payment
- ✅ URL context preserved through OAuth (no payment step)
- ✅ Analysis page pre-filled correctly
- ✅ Free tier limitations enforced (no PDF)
- ✅ Smooth UX, no payment confusion

---

### Journey C: Direct Signup → No URL Context → Analysis

**Priority**: P0 - MUST HAVE
**Estimated Time**: 5-10 minutes

#### Test Steps

1. **Direct Signup**
   - [ ] Navigate directly to `/register` (not from landing page)
   - [ ] **VERIFY**: No `pendingAnalysisUrl` in localStorage
   - [ ] Select "Free" tier
   - [ ] Click "Continue with Google"
   - [ ] Complete OAuth

2. **Post-Auth - No Context**
   - [ ] **VERIFY**: `authContext.pendingAnalysisUrl` is `null`
   - [ ] **VERIFY**: Routed to `/analyze`
   - [ ] **VERIFY**: URL input field is **empty**
   - [ ] **VERIFY**: Placeholder text shown: "Enter URL to analyze..."

3. **Manual URL Entry**
   - [ ] Enter URL manually: `https://newsite.com`
   - [ ] Click "Analyze"
   - [ ] **VERIFY**: Analysis runs successfully
   - [ ] **VERIFY**: Results displayed

#### Success Criteria

- ✅ No errors when `pendingAnalysisUrl` is null
- ✅ User lands on analysis page with empty input
- ✅ Manual URL entry works correctly
- ✅ First login flag prevents upsell

---

### Journey D: Returning Free User → Login → Upsell Coffee

**Priority**: P1 - HIGH
**Estimated Time**: 5-10 minutes

#### Test Steps

1. **Login as Existing Free User**
   - [ ] Ensure test user exists with `tier='free'`, `is_first_login=false`
   - [ ] Navigate to `/login` (or click "Sign In")
   - [ ] Click "Continue with Google"
   - [ ] Complete OAuth

2. **Post-Login - Show Upsell**
   - [ ] **VERIFY**: `is_first_login = false`
   - [ ] **VERIFY**: Routed to `/upsell/coffee` (NOT analysis page)
   - [ ] Coffee upsell page loads

3. **Upsell Page Review**
   - [ ] **VERIFY**: Headline: "Unlock Unlimited Analyses with Coffee Plan"
   - [ ] **VERIFY**: Benefits displayed exactly as specified
   - [ ] **VERIFY**: Pricing: "$4.95/month"
   - [ ] **VERIFY**: Two CTAs:
     - "Upgrade to Coffee Plan" (prominent)
     - "Maybe Later" (subtle)

4. **Dismiss Upsell**
   - [ ] Click "Maybe Later"
   - [ ] **VERIFY**: Redirected to `/dashboard` or `/analyze`
   - [ ] **VERIFY**: User can access app normally

5. **Upgrade via Upsell**
   - [ ] Log in again
   - [ ] Click "Upgrade to Coffee Plan"
   - [ ] **VERIFY**: Redirected to Stripe checkout
   - [ ] Complete payment
   - [ ] **VERIFY**: Tier updated to 'coffee'
   - [ ] **VERIFY**: Next login skips upsell or shows Growth upsell

#### Success Criteria

- ✅ Returning user sees upsell (not skipped)
- ✅ Upsell dismissal works (not blocking)
- ✅ Upgrade flow works from upsell page
- ✅ Correct tier-based upsell shown

---

### Journey E: Returning Coffee User → Login → Upsell Growth

**Priority**: P1 - HIGH
**Estimated Time**: 5 minutes

#### Test Steps

1. **Login as Coffee User**
   - [ ] Ensure test user has `tier='coffee'`, `is_first_login=false`
   - [ ] Click "Sign In" → "Continue with GitHub"
   - [ ] Complete OAuth

2. **Post-Login - Growth Upsell**
   - [ ] **VERIFY**: Routed to `/upsell/growth`
   - [ ] Growth upsell page loads
   - [ ] **VERIFY**: Headline: "Coming Soon: Growth Plan with Advanced Features"
   - [ ] **VERIFY**: Benefits shown (22 factors, AI Remediation Planner)
   - [ ] **VERIFY**: Pricing: "$29/month" with "Coming Soon" badge

3. **Join Waitlist**
   - [ ] Click "Join Waitlist - Be First to Upgrade"
   - [ ] **VERIFY**: Database insert:
     ```sql
     INSERT INTO waitlist (user_id, interested_tier, current_tier)
     VALUES (..., 'growth', 'coffee');
     ```
   - [ ] **VERIFY**: Confirmation shown: "✅ You're on the list!"
   - [ ] **VERIFY**: Redirected to dashboard after 3 seconds

#### Success Criteria

- ✅ Coffee users see Growth upsell
- ✅ Waitlist capture works
- ✅ No duplicate waitlist entries

---

### Journey F: Returning Growth User → Login → Upsell Scale

**Priority**: P2 - MEDIUM
**Estimated Time**: 5 minutes

**Test Steps**: Similar to Journey E, but:
- User has `tier='growth'`
- Routed to `/upsell/scale`
- Scale tier benefits shown
- Pricing: "$99/month"
- Join Scale waitlist

---

### Journey G: Returning Scale User → Login → Welcome Page

**Priority**: P2 - MEDIUM
**Estimated Time**: 3 minutes

**Test Steps**:
1. Login as Scale user (`tier='scale'`)
2. **VERIFY**: Routed to `/welcome/scale`
3. **VERIFY**: Welcome message shown
4. **VERIFY**: No upsell (highest tier)
5. **VERIFY**: "Continue to Dashboard" button works

---

## Cross-Browser Testing

### Browser Compatibility Matrix

Test all P0 journeys on each browser:

| Journey | Chrome | Firefox | Safari | Edge | Status |
|---------|--------|---------|--------|------|--------|
| Journey A (Coffee Payment) | ☐ | ☐ | ☐ | ☐ | Pending |
| Journey B (Free Signup) | ☐ | ☐ | ☐ | ☐ | Pending |
| Journey C (Direct Signup) | ☐ | ☐ | ☐ | ☐ | Pending |
| Journey D (Upsell Coffee) | ☐ | ☐ | ☐ | ☐ | Pending |

### Browser-Specific Issues to Watch

**Safari**:
- [ ] localStorage disabled in private browsing → Test fallback
- [ ] OAuth popups may be blocked → Test redirect flow
- [ ] Stripe 3D Secure may behave differently

**Firefox**:
- [ ] Enhanced Tracking Protection → Test OAuth redirects
- [ ] Different cookie handling → Test session persistence

**Edge**:
- [ ] Similar to Chrome (Chromium-based)
- [ ] Test Windows-specific behavior

### Testing Procedure

1. **Install browsers** (if not already installed)
2. **Test one journey at a time** in all browsers
3. **Document browser-specific bugs** with screenshots
4. **Use browser dev tools** to check console errors
5. **Test in incognito/private mode** to simulate fresh user

---

## Mobile Responsive Testing

### Device Testing Matrix

Test P0 journeys on mobile devices:

| Journey | iOS Safari | Chrome Mobile | Status |
|---------|------------|---------------|--------|
| Journey A | ☐ | ☐ | Pending |
| Journey B | ☐ | ☐ | Pending |

### Mobile-Specific Checks

**UI/UX**:
- [ ] Tier selector cards stack vertically on mobile
- [ ] Auth buttons are touch-friendly (44x44px minimum)
- [ ] Text is readable (16px minimum)
- [ ] Forms are easy to fill (large inputs)
- [ ] No horizontal scrolling

**Functionality**:
- [ ] OAuth redirects work on mobile browsers
- [ ] Stripe checkout mobile-friendly
- [ ] localStorage persists across mobile redirects
- [ ] No input zoom issues (viewport meta tag)

**Testing Tools**:
- Chrome DevTools Device Mode
- BrowserStack (if available)
- Real devices (iPhone, Android phone)

### Testing Procedure

1. **Use responsive design mode** in desktop browser first
2. **Test on real devices** for final validation
3. **Test in portrait and landscape** orientations
4. **Test touch interactions** (tap, swipe)
5. **Test mobile keyboard behavior** (auto-capitalize, autocomplete)

---

## Error Scenario Testing

### Error 1: localStorage Unavailable

**Scenario**: User has localStorage disabled (privacy mode)

**Test Steps**:
1. [ ] Open browser in private/incognito mode
2. [ ] Disable localStorage in browser settings (or use extension)
3. [ ] User enters URL on landing page
4. [ ] Click "Analyze" → Signup
5. [ ] Complete OAuth

**Expected Behavior**:
- Graceful fallback: sessionStorage used instead
- User can still sign up
- No pre-filled URL (context lost) - acceptable
- No user-blocking errors

**Verification**:
```javascript
// Check fallback logic in authHelpers.js
try {
  localStorage.setItem('test', 'value');
} catch (error) {
  console.log('✅ localStorage unavailable, using sessionStorage');
  sessionStorage.setItem('analysisContext', JSON.stringify(context));
}
```

---

### Error 2: Expired authContext

**Scenario**: User stores context, waits 25 hours (past TTL)

**Test Steps**:
1. [ ] Manually set expired context:
   ```javascript
   const expiredContext = {
     pendingAnalysisUrl: 'https://test.com',
     timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
     expiresAt: Date.now() - 1000 // 1 second ago
   };
   localStorage.setItem('analysisContext', JSON.stringify(expiredContext));
   ```
2. [ ] Complete OAuth signup
3. [ ] OAuthCallback checks `getAnalysisContext()`

**Expected Behavior**:
- Context expired, returns `null`
- Default routing used (no pre-filled URL)
- User routed to analysis page with empty input
- No errors

**Verification**:
```javascript
// Check expiry logic
const context = getAnalysisContext();
console.log('Context:', context); // Should be null
```

---

### Error 3: Database Update Fails (is_first_login)

**Scenario**: Network error during first login flag update

**Test Steps**:
1. [ ] Simulate network failure (disconnect WiFi briefly)
2. [ ] Complete OAuth signup
3. [ ] OAuthCallback attempts to mark first login complete
4. [ ] Database update fails

**Expected Behavior**:
- Error logged to console
- User still routed correctly (doesn't block)
- Next login may show upsell (flag still `true`) - acceptable
- No user-facing error

**Verification**:
```javascript
// Check error handling in OAuthCallback
try {
  await markFirstLoginComplete(userId);
} catch (error) {
  console.error('⚠️ Failed to mark first login complete:', error);
  // User journey continues (don't throw)
}
```

---

### Error 4: Webhook Delay (Tier Not Updated)

**Scenario**: Stripe webhook delayed (>30 seconds)

**Test Steps**:
1. [ ] Complete Coffee tier payment
2. [ ] Redirected to `/checkout-success`
3. [ ] Manually delay webhook (pause Stripe CLI or disable endpoint temporarily)
4. [ ] Polling times out after 30 seconds

**Expected Behavior**:
- Polling shows "Processing..." message
- After 30s timeout: "Your upgrade is being processed. Check back in a few minutes."
- User can still click "Go to Dashboard"
- User not blocked from using app
- Tier updates when webhook eventually fires

**Verification**:
```javascript
// Check polling logic in CheckoutSuccess.jsx
const MAX_POLLING_ATTEMPTS = 30;
let attempts = 0;

const pollTierUpdate = setInterval(() => {
  attempts++;
  if (attempts > MAX_POLLING_ATTEMPTS) {
    clearInterval(pollTierUpdate);
    setMessage('Upgrade processing. Check account page later.');
  }
  // Check tier in database
}, 1000);
```

---

### Error 5: Invalid Tier Value

**Scenario**: User has invalid tier in database (e.g., 'pro')

**Test Steps**:
1. [ ] Manually set invalid tier in database:
   ```sql
   UPDATE users SET tier = 'pro' WHERE email = 'test@example.com';
   ```
2. [ ] User logs in
3. [ ] OAuthCallback calls `getUpsellPage(user)`

**Expected Behavior**:
- Default case: route to `/dashboard`
- Warning logged to console
- No crash or blocking error
- User can access app

**Verification**:
```javascript
// Check default case in routing logic
function getUpsellPage(user) {
  switch (user.tier) {
    case 'free': return '/upsell/coffee';
    case 'coffee': return '/upsell/growth';
    case 'growth': return '/upsell/scale';
    case 'scale': return '/welcome/scale';
    default:
      console.warn('⚠️ Unknown tier:', user.tier);
      return '/dashboard'; // Fallback
  }
}
```

---

### Error 6: OAuth Callback Fails

**Scenario**: Google OAuth returns error

**Test Steps**:
1. [ ] Start OAuth flow
2. [ ] Deny permissions on Google consent screen
3. [ ] Redirected back with error parameter

**Expected Behavior**:
- Error message shown: "Authentication failed. Please try again."
- User remains on signup page
- Can retry with different auth method
- Context preserved for retry

---

### Error 7: Stripe Payment Declined

**Scenario**: Payment card declined

**Test Steps**:
1. [ ] Use test card: `4000 0000 0000 0002` (decline)
2. [ ] Complete signup, redirected to Stripe
3. [ ] Enter declined card, submit

**Expected Behavior**:
- Stripe shows error: "Your card was declined"
- User can retry with different card
- If cancel: Redirected to `/checkout-cancel`
- User remains Free tier, sees retry banner on dashboard

---

## Security Testing

### Authentication Security

**OAuth State Parameter**:
- [ ] Test CSRF protection: Modify OAuth state parameter
- [ ] **VERIFY**: OAuth fails with invalid state
- [ ] **VERIFY**: Error logged, user not authenticated

**Session Security**:
- [ ] Test session hijacking: Copy session token to different browser
- [ ] **VERIFY**: Session tied to user agent (if implemented)
- [ ] **VERIFY**: Session expires after inactivity (check timeout)

**Authorization Checks**:
- [ ] Test RLS policies: Manually query users table from client
- [ ] **VERIFY**: Can only read own user data
- [ ] **VERIFY**: Cannot update other users' tier

**SQL Injection**:
- [ ] Test malicious inputs: Enter `'; DROP TABLE users; --` in forms
- [ ] **VERIFY**: Parameterized queries prevent injection
- [ ] **VERIFY**: Input sanitized before database operations

### Payment Security

**Stripe Security**:
- [ ] Test webhook signature: Send fake webhook with invalid signature
- [ ] **VERIFY**: Webhook rejected, tier not updated
- [ ] **VERIFY**: Error logged

**Environment Variables**:
- [ ] Test secret exposure: Check client-side bundle for secrets
- [ ] **VERIFY**: No `STRIPE_SECRET_KEY` in client bundle
- [ ] **VERIFY**: Only `VITE_STRIPE_PUBLIC_KEY` exposed (expected)

**XSS Prevention**:
- [ ] Test XSS in URL input: Enter `<script>alert('XSS')</script>`
- [ ] **VERIFY**: Script not executed
- [ ] **VERIFY**: URL sanitized before display

### Data Privacy

**Personal Data Handling**:
- [ ] Test data minimization: Check what data is stored
- [ ] **VERIFY**: Only essential data stored (email, name, tier)
- [ ] **VERIFY**: No sensitive data in localStorage

**GDPR Compliance** (if applicable):
- [ ] Test data export: Can user export their data?
- [ ] Test data deletion: Can user delete account?
- [ ] **VERIFY**: Cookie consent banner shown (if required)

---

## Performance Testing

### Page Load Performance

**Lighthouse Audit**:
1. [ ] Run Lighthouse on all pages:
   - Landing page
   - Signup/Register page
   - Analysis page
   - Upsell pages
2. [ ] **VERIFY**: Performance score >85
3. [ ] **VERIFY**: LCP (Largest Contentful Paint) <2.5s
4. [ ] **VERIFY**: FID (First Input Delay) <100ms
5. [ ] **VERIFY**: CLS (Cumulative Layout Shift) <0.1

**Lighthouse Command**:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://aimpactscanner.com --view --output html
```

**Bundle Size Analysis**:
1. [ ] Check bundle size after build:
   ```bash
   npm run build
   ls -lh dist/assets/*.js | awk '{print $5, $9}'
   ```
2. [ ] **VERIFY**: Main bundle <300KB (gzipped <100KB)
3. [ ] **VERIFY**: Lazy-loaded routes split into separate chunks

**Performance Metrics Target**:
- Landing Page LCP: <2 seconds
- Signup Page LCP: <2 seconds
- OAuth Callback Processing: <1 second
- Stripe Checkout Creation: <2 seconds
- Database Queries: <100ms (95th percentile)

### Network Performance

**API Response Times**:
1. [ ] Use Chrome DevTools Network tab
2. [ ] Measure API call durations:
   - `POST /auth/v1/signup` - <500ms
   - `GET /rest/v1/users` - <100ms
   - `POST /functions/v1/create-checkout-session` - <2s
3. [ ] **VERIFY**: No slow queries (>1 second)

**Caching**:
1. [ ] Check cache headers on static assets
2. [ ] **VERIFY**: CSS/JS files cached (max-age >1 day)
3. [ ] **VERIFY**: HTML not cached (no-cache)

### Database Performance

**Query Performance**:
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- 100ms
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND attname NOT IN (
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  );
```

**Verification**:
- [ ] All frequently queried columns have indexes
- [ ] Tier lookup query <50ms
- [ ] Waitlist insert <100ms

---

## Accessibility Testing

### Keyboard Navigation

**Keyboard-Only Testing**:
1. [ ] Tab through signup page
2. [ ] **VERIFY**: All interactive elements reachable via Tab
3. [ ] **VERIFY**: Tab order is logical (top to bottom, left to right)
4. [ ] **VERIFY**: Focus indicators visible (outline or highlight)
5. [ ] **VERIFY**: Can submit forms with Enter key
6. [ ] **VERIFY**: Can dismiss modals with Escape key

**Focus Management**:
1. [ ] Test focus after OAuth redirect
2. [ ] **VERIFY**: Focus moves to main content (not lost)
3. [ ] **VERIFY**: Skip links available ("Skip to main content")

### Screen Reader Compatibility

**Screen Reader Testing** (NVDA, JAWS, VoiceOver):
1. [ ] Enable screen reader (VoiceOver: Cmd+F5 on Mac)
2. [ ] Navigate signup page
3. [ ] **VERIFY**: All buttons announced correctly
4. [ ] **VERIFY**: Form fields have labels
5. [ ] **VERIFY**: Error messages announced
6. [ ] **VERIFY**: Tier selection announced with benefits

**ARIA Labels**:
1. [ ] Check ARIA attributes in code:
   ```html
   <button aria-label="Sign up with Google">
   <input aria-describedby="email-help-text">
   <div role="alert" aria-live="polite">Error message</div>
   ```
2. [ ] **VERIFY**: All interactive elements have accessible names
3. [ ] **VERIFY**: Loading states announced (aria-live regions)

### Color Contrast

**Contrast Checker**:
1. [ ] Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. [ ] Test all text/background combinations
3. [ ] **VERIFY**: Normal text: 4.5:1 minimum
4. [ ] **VERIFY**: Large text (18px+): 3:1 minimum
5. [ ] **VERIFY**: Interactive elements: 3:1 minimum

**Common Issues**:
- Gray text on white background
- Blue links on dark blue background
- "Maybe Later" button with low contrast

### Accessibility Audit Tools

**axe DevTools**:
```bash
# Install axe DevTools browser extension
# Open DevTools → axe tab → Scan page
```

**Expected Results**:
- [ ] Zero critical issues
- [ ] <5 moderate issues
- [ ] Document any acceptable issues (false positives)

---

## Bug Reporting Template

### Bug Report Structure

Use this template when reporting bugs:

```markdown
## Bug: [Clear, concise title]

**Severity**: Critical | High | Medium | Low
**Priority**: P0 | P1 | P2 | P3
**Environment**: Production | Staging | Local Development
**Device/Browser**: Chrome 120 / macOS 14.0
**User Journey**: Journey A | Journey B | etc.

### Steps to Reproduce

1. Navigate to https://aimpactscanner.com
2. Click "Sign Up"
3. Select "Coffee" tier
4. Click "Continue with Google"
5. Observe [what happens]

### Expected Behavior

User should be redirected to Stripe checkout after OAuth completes.

### Actual Behavior

User sees error message: "Failed to create checkout session"

### Evidence

**Screenshot**: [Attach screenshot]
**Console Error**:
```
Error: Failed to fetch checkout session
  at createCheckoutSession (App.jsx:123)
```

**Network Tab**:
- POST /functions/v1/create-checkout-session → 500 Internal Server Error

**User Session**:
- User ID: abc-123-def
- Email: test@example.com
- Tier: free (expected: coffee after payment)

### Additional Context

- Frequency: Always | Sometimes | Rare (1/10 attempts)
- User impact: Blocks Coffee tier signups (HIGH)
- Workaround: None (user cannot upgrade)
- Related issues: #123, #456

### Suggested Fix

Check Stripe API key configuration. Error suggests missing `STRIPE_SECRET_KEY` environment variable.

### Testing Notes

To reproduce consistently:
1. Clear localStorage
2. Use test email: test+bug@example.com
3. Use test card: 4242 4242 4242 4242
```

### Bug Severity Classification

**Critical** (P0):
- Blocks primary user flows (signup, payment)
- Data loss or security vulnerability
- App crashes or unusable
- Must fix before production deployment

**High** (P1):
- Degrades important functionality
- Workaround exists but difficult
- Affects significant portion of users
- Fix in next sprint

**Medium** (P2):
- Minor functionality affected
- Easy workaround available
- Affects small subset of users
- Fix when time permits

**Low** (P3):
- Cosmetic issues
- Rare edge cases
- No user impact
- Nice to fix, not urgent

---

## Testing Execution Checklist

### Pre-Testing

- [ ] All dependencies configured (see Pre-Testing Checklist)
- [ ] Test accounts created (Google, GitHub, email)
- [ ] Staging environment deployed
- [ ] Database migrations deployed
- [ ] Stripe test mode configured
- [ ] Browser extensions disabled (to avoid conflicts)

### Manual Testing

- [ ] Journey A tested (Landing → Coffee Payment)
- [ ] Journey B tested (Free Signup)
- [ ] Journey C tested (Direct Signup)
- [ ] Journey D tested (Returning Free User)
- [ ] All error scenarios tested
- [ ] Cross-browser testing complete
- [ ] Mobile responsive testing complete

### Automated Testing

- [ ] Unit tests created and passing
- [ ] Integration tests created and passing
- [ ] E2E tests created (may be skipped pending OAuth config)
- [ ] Accessibility tests passing
- [ ] Performance tests meeting targets

### Documentation

- [ ] Test execution report created
- [ ] All bugs logged with severity
- [ ] Screenshots/videos captured
- [ ] Deployment readiness assessment complete

### Sign-Off

- [ ] QA Lead approval
- [ ] Product Owner approval
- [ ] Security review complete
- [ ] Ready for production deployment

---

## Next Steps

After completing testing:

1. **Create Test Execution Report** (`TEST_EXECUTION_REPORT.md`)
2. **Update Handoff Notes** with testing findings
3. **Log all bugs** in issue tracker
4. **Provide deployment readiness** assessment
5. **Handoff to @operator** for staging/production deployment

---

**Testing Complete**: [Date]
**Tester**: THE TESTER
**Status**: [PASS | FAIL | BLOCKED]
**Deployment Recommendation**: [GO | NO-GO | CONDITIONAL]

---

*"Break it in test, not in production."* 🧪
