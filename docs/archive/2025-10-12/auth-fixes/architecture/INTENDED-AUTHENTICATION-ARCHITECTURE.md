# INTENDED Authentication Architecture - AImpactScanner

**Document Purpose**: Map INTENDED authentication flows based on architecture documentation
**Created**: 2025-10-08
**Status**: Architecture Analysis - DO NOT IMPLEMENT YET
**Source Documents**:
- ADR_AUTH_MONETIZATION.md (dated 2025-10-02, Status: Accepted and Implemented)
- MIGRATION_FROM_PASSWORD_AUTH.md (v2.0, Migration Date: 2025-10-02, Status: Complete)
- oauth-setup-guide.md (dated 2025-10-02)
- architecture.md (v2.2.0, System v1.1.0)

---

## Executive Summary

Based on architecture documentation analysis, the INTENDED authentication system is **OAuth-First** with the following characteristics:

**PRIMARY AUTHENTICATION METHOD**: OAuth (Google + GitHub)
**SECONDARY/FALLBACK METHOD**: Magic Link (passwordless email)
**DEPRECATED METHOD**: Email + password (removed in October 2025 migration)

**Critical Decision**: ADR_AUTH_MONETIZATION.md (2025-10-02) shows a complete migration from password-based auth to OAuth-first, marked as "Accepted and Implemented"

---

## 1. INTENDED New User Signup Flow

### Entry Point
**Landing Page**: `https://aimpactscanner.com/` (or `/#/`)
**Signup URL**: `/#/signup` or `/#/register`

### Step-by-Step INTENDED Flow

```
1. USER LANDS ON SIGNUP PAGE
   ↓
2. TierSelector Component Displays
   - Free tier (3 analyses/month)
   - Coffee tier ($4.95/month unlimited) ← SIMPLIFIED 2-TIER MODEL
   User selects desired tier
   ↓
3. AuthMethodSelector Component Displays
   Three authentication options shown:
   - [Continue with Google] ← PRIMARY
   - [Continue with GitHub] ← SECONDARY
   - [Continue with Email] (Magic Link) ← FALLBACK
   ↓
4a. IF OAUTH SELECTED (Google or GitHub):
    - User clicks OAuth button
    - Redirects to provider (Google/GitHub)
    - User authenticates with provider
    - Provider redirects to: https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
    - Supabase processes OAuth callback
    - Frontend redirects to: /#/oauth-callback
    ↓
4b. IF MAGIC LINK SELECTED:
    - User enters email address
    - Magic link sent via Resend API
    - User clicks link in email
    - Redirects to: /#/oauth-callback
    ↓
5. OAuthCallback Component Processes
   - Verifies Supabase session established
   - Retrieves context from localStorage (pendingAnalysisUrl if set)
   - Checks user tier selection
   ↓
6a. IF FREE TIER SELECTED:
    - is_first_login flag checked
    - IF first login: Navigate to /analyze (skip upsell)
    - IF second+ login: Navigate to /upsell/coffee
    ↓
6b. IF COFFEE TIER SELECTED:
    - Create Stripe checkout session
    - Redirect to Stripe hosted checkout
    - User completes payment
    - Stripe redirects to /checkout-success OR /checkout-cancel
    - Stripe webhook updates user tier in database
    - Navigate to /analyze (or context URL if preserved)
    ↓
7. USER REACHES DESTINATION
   - If context preserved: Analysis page with pre-filled URL
   - If no context: Empty analysis page
   - User can start using the application
```

### Key Architecture Components

**TierSelector.jsx**:
- Displays Free and Coffee tier options
- Captures tier selection before authentication
- Stores selection for post-auth processing

**AuthMethodSelector.jsx**:
- Displays Google, GitHub, and Magic Link buttons
- Handles OAuth redirects
- Initiates magic link email sending

**OAuthCallback.jsx**:
- Post-authentication routing handler
- Retrieves context from localStorage
- Directs to appropriate next step based on tier

### Context Preservation Mechanism

**Decision**: Use localStorage (not URL parameters)

```javascript
// Store on landing page
storeAnalysisContext(url, 'landing');

// Retrieve after OAuth
const context = getAnalysisContext();
if (context?.pendingAnalysisUrl) {
  navigate('/analyze', { state: { prefilledUrl: context.pendingAnalysisUrl } });
}
```

**Why localStorage?**
- Survives OAuth redirects (even in new tabs)
- Survives browser refresh
- 24-hour TTL prevents stale data
- No server-side storage needed

---

## 2. INTENDED Existing User Signin Flow

### Entry Point
**Login URL**: `/#/login`

### Step-by-Step INTENDED Flow

```
1. USER LANDS ON LOGIN PAGE
   ↓
2. AuthMethodSelector Component Displays
   Three authentication options shown:
   - [Continue with Google]
   - [Continue with GitHub]
   - [Continue with Email] (Magic Link)
   NO password field (removed in Oct 2025 migration)
   ↓
3. OAUTH/MAGIC LINK AUTHENTICATION
   (Same as signup flow steps 4a/4b)
   ↓
4. OAuthCallback Component Processes
   - Verifies existing user (matches email)
   - Checks is_first_login flag
   ↓
5. ROUTING LOGIC
   IF is_first_login = true:
     - Mark is_first_login = false
     - Navigate to /analyze (skip upsell)

   IF is_first_login = false:
     - Check user tier
     - Navigate to tier-appropriate upsell page:
       * FREE tier → /upsell/coffee
       * COFFEE tier → /upsell/growth (waitlist)
       * GROWTH tier → /upsell/scale (waitlist)
       * SCALE tier → /welcome/scale (no upsell, highest tier)
   ↓
6. USER REACHES DESTINATION
   - First login: Direct to analysis (fast value delivery)
   - Subsequent logins: See tier-appropriate upsell (monetization)
```

### First Login Detection Strategy

**Purpose**: Skip upsell on first login to reduce friction

**Database Column**:
```sql
is_first_login BOOLEAN DEFAULT true
```

**Implementation**:
```javascript
if (user.is_first_login) {
  await markFirstLoginComplete(user.id);
  navigate('/analyze'); // Skip upsell
} else {
  navigate(getUpsellPage(user.tier)); // Show tier-based upsell
}
```

**Rationale** (from ADR):
- Better onboarding - users reach value faster
- Less pressure - don't push upgrade before they've tried it
- Higher engagement - users explore product first
- Better conversion timing - upsell after they see value

---

## 3. INTENDED OAuth Integration Design

### OAuth Providers
**PRIMARY**: Google OAuth
**SECONDARY**: GitHub OAuth
**FALLBACK**: Magic Link (not technically OAuth, but same redirect pattern)

### OAuth Configuration

**Redirect URLs**:
- **Supabase Callback**: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- **Frontend Callback**: `/#/oauth-callback`

**Scopes Requested**:

**Google**:
- `openid` - OpenID Connect authentication
- `email` - User's email address
- `profile` - User's basic profile info (name, photo)

**GitHub**:
- `read:user` - Read user profile
- `user:email` - Access user email addresses

### OAuth Security Measures

From ADR_AUTH_MONETIZATION.md:

**OAuth Security**:
- CSRF protection via `state` parameter
- Redirect URI validation (exact match)
- Tokens never exposed to client
- Session tokens use secure, httpOnly cookies

**Magic Link Security**:
- Tokens expire in 1 hour
- Tokens single-use only
- 128-bit cryptographic entropy
- Rate limiting (3 requests per email per hour)

### OAuth Implementation Code

```javascript
// Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/#/oauth-callback`
  }
});

// GitHub OAuth
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/#/oauth-callback`
  }
});

// Magic Link
await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: `${window.location.origin}/#/oauth-callback`
  }
});
```

### Expected User Metadata

**Google OAuth User Data**:
```json
{
  "id": "uuid-generated-by-supabase",
  "email": "user@gmail.com",
  "email_confirmed_at": "2025-10-02T...",
  "app_metadata": {
    "provider": "google",
    "providers": ["google"]
  },
  "user_metadata": {
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "email": "user@gmail.com",
    "email_verified": true,
    "full_name": "John Doe",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**GitHub OAuth User Data**:
```json
{
  "id": "uuid-generated-by-supabase",
  "email": "user@github.com",
  "email_confirmed_at": "2025-10-02T...",
  "app_metadata": {
    "provider": "github",
    "providers": ["github"]
  },
  "user_metadata": {
    "avatar_url": "https://avatars.githubusercontent.com/u/...",
    "email": "user@github.com",
    "email_verified": true,
    "full_name": "John Doe",
    "name": "John Doe",
    "preferred_username": "johndoe",
    "user_name": "johndoe"
  }
}
```

---

## 4. INTENDED Redirect URL Specifications

### Critical Redirect URLs

**1. OAuth Provider Callback (Supabase)**:
```
https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
```
- This is where Google/GitHub redirect after authentication
- Configured in Google Cloud Console and GitHub OAuth App
- MUST match exactly (no trailing slash, case-sensitive)

**2. Frontend Callback Route**:
```
/#/oauth-callback
```
- This is where Supabase redirects after processing OAuth
- Handled by OAuthCallback.jsx component
- Determines post-auth routing based on tier and context

**3. Magic Link Redirect**:
```
/#/oauth-callback
```
- Same as OAuth callback (unified handling)
- Magic link email contains link to this route
- Supabase verifies token and establishes session

**4. Stripe Payment Redirects**:
```
Success: /checkout-success
Cancel: /checkout-cancel
```
- Configured in Stripe checkout session creation
- User returns here after payment attempt

### URL Pattern Consistency

**INTENDED Pattern**: All authentication methods redirect to `/#/oauth-callback`

**Rationale**:
- Unified callback handling
- Single component processes all auth flows
- Consistent context preservation
- Simplified routing logic

---

## 5. INTENDED Tier Selection Integration

### Tier Model (Simplified)

**ADR Decision**: 2-tier system optimized for conversion

**Available Tiers**:
1. **FREE**: 3 analyses/month
2. **COFFEE**: $4.95/month, unlimited analyses

**Future Tiers** (Waitlist):
3. **GROWTH**: $29/month (not launched)
4. **SCALE**: $99/month (not launched)

### Tier Selection Timing

**WHEN**: Before authentication (during signup)

**WHY** (from ADR):
- Minimizes signup friction
- Clear value proposition upfront
- Single decision point reduces abandonment
- Psychological pricing ($4.95 vs $5.00)

### Tier Selection Flow

```
Signup Page
   ↓
TierSelector Component
   ↓
User selects tier (Free or Coffee)
   ↓
AuthMethodSelector Component
   ↓
OAuth/Magic Link authentication
   ↓
IF Coffee tier selected:
  → Stripe checkout
  → Payment completion
  → Database updated via webhook
   ↓
User reaches application
```

### Database Tracking

**New Columns** (from Migration 021):
```sql
auth_provider TEXT                    -- 'google', 'github', 'email'
selected_tier TEXT DEFAULT 'free'     -- Tier selected during signup
subscription_status TEXT DEFAULT 'active'
stripe_customer_id TEXT UNIQUE
stripe_subscription_id TEXT UNIQUE
is_first_login BOOLEAN DEFAULT true
```

---

## 6. INTENDED Payment Integration (Coffee Tier)

### Payment Flow Architecture

**Decision**: Stripe Checkout (not Stripe Elements)

**Why Stripe Checkout?** (from ADR):
- PCI compliance handled by Stripe
- Mobile-optimized payment UI
- Multiple payment methods (credit card, Apple Pay, Google Pay)
- Built-in fraud prevention
- Automatic invoice generation

### Coffee Tier Payment Flow

```
1. User selects Coffee tier during signup
   ↓
2. User completes OAuth/Magic Link authentication
   ↓
3. OAuthCallback detects Coffee tier selection
   ↓
4. Backend Edge Function creates Stripe checkout session:
   {
     customer_email: user.email,
     mode: 'subscription',
     line_items: [{ price: COFFEE_PRICE_ID, quantity: 1 }],
     success_url: `${APP_URL}/checkout-success`,
     cancel_url: `${APP_URL}/checkout-cancel`,
     metadata: { user_id: user.id, tier: 'coffee' }
   }
   ↓
5. User redirected to Stripe hosted checkout page
   ↓
6a. IF PAYMENT SUCCEEDS:
    - Stripe redirects to /checkout-success
    - Stripe webhook fires: checkout.session.completed
    - Edge Function processes webhook
    - Database updated: tier = 'coffee', subscription_status = 'active'
    - User can access unlimited analyses
   ↓
6b. IF PAYMENT FAILS OR CANCELED:
    - Stripe redirects to /checkout-cancel
    - User remains on FREE tier (graceful degradation)
    - No blocking - user can still use free tier
    - Can retry payment later
   ↓
7. User continues to application
```

### Stripe Webhook Processing

**Edge Function**: `supabase/functions/stripe-webhook/index.ts`

**Webhook Events Handled**:
- `checkout.session.completed` - Payment succeeded
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_failed` - Payment failed

**Security**:
- Webhook signature verification (HMAC SHA256)
- Idempotency (duplicate event prevention)
- Secret keys never in client code

### Graceful Payment Failure

**CRITICAL PRINCIPLE**: Payment failures NEVER block users

**Implementation**:
- User stays on FREE tier if payment fails
- Can continue using free tier features
- Upgrade prompts shown on subsequent logins
- Can retry payment anytime

---

## 7. Documentation Gaps and Ambiguities

### Gap 1: Actual Component Names and File Locations

**What's Documented**:
- TierSelector.jsx component mentioned
- AuthMethodSelector.jsx component mentioned
- OAuthCallback.jsx component mentioned

**What's NOT Documented**:
- Exact file paths for these components
- Whether these components actually exist
- Relationship to existing components (Auth.jsx, UnifiedRegistration.jsx, etc.)

**Impact**: Unknown if documented architecture is implemented or aspirational

---

### Gap 2: Routing Configuration

**What's Documented**:
- Routes: /#/oauth-callback, /#/signup, /#/register
- Upsell pages: /upsell/coffee, /upsell/growth, /upsell/scale
- Checkout pages: /checkout-success, /checkout-cancel

**What's NOT Documented**:
- Complete routing table
- Which routes exist in App.jsx
- Hash routing vs browser history
- Route guards and authentication checks

**Impact**: Cannot verify if routing matches documented architecture

---

### Gap 3: Legacy vs Current Authentication

**What's Documented**:
- Migration from password auth to OAuth-first (Oct 2025)
- Password auth marked as "removed"
- Old components marked as "deleted"

**What's NOT Documented**:
- Whether old components still exist in codebase
- Migration completion status
- Backward compatibility for existing users with passwords

**Impact**: Unclear if migration is complete or in progress

**USER COMPLAINT SUGGESTS**: Migration may not be complete - user says "OAuth stuff we were supposed to be delivering" implies OAuth may not be working

---

### Gap 4: Magic Link Configuration

**What's Documented**:
- Magic links use Resend API
- Redirect to /#/oauth-callback
- Tokens expire in 1 hour

**What's NOT Documented**:
- Resend API key configuration
- Email template details
- SMTP configuration requirements
- Magic link email delivery confirmation

**Impact**: Cannot verify if magic links are working

---

### Gap 5: Context Preservation Implementation

**What's Documented**:
- localStorage used for context preservation
- 24-hour TTL on stored context
- Functions: storeAnalysisContext(), getAnalysisContext()

**What's NOT Documented**:
- Exact localStorage key names
- Context data structure
- Where these functions are defined
- How context clears after use

**Impact**: Cannot verify if context preservation is implemented

---

### Gap 6: First Login Detection Implementation

**What's Documented**:
- Database column: is_first_login BOOLEAN DEFAULT true
- Function: markFirstLoginComplete(user.id)
- Logic: Skip upsell on first login

**What's NOT Documented**:
- Where markFirstLoginComplete() is implemented
- How is_first_login is checked in routing
- Edge cases (what if database update fails?)

**Impact**: Cannot verify if first login detection works

---

### Gap 7: Stripe Integration Status

**What's Documented**:
- Edge Functions: create-checkout-session, stripe-webhook
- Webhook event handling
- Price ID configuration

**What's NOT Documented**:
- Stripe API keys and where they're stored
- Coffee tier price ID (COFFEE_PRICE_ID)
- Webhook endpoint URL
- Stripe test vs production mode

**Impact**: Cannot verify if payments are working

---

### Gap 8: OAuth Provider Configuration Status

**What's Documented**:
- Detailed setup guide for Google and GitHub OAuth
- Client IDs and secrets needed
- Redirect URLs configured

**What's NOT Documented**:
- Whether OAuth apps are actually created
- Current status of OAuth provider configuration
- Environment variables for OAuth credentials

**Impact**: Cannot verify if OAuth is configured and working

**USER COMPLAINT STRONGLY SUGGESTS**: OAuth may not be configured - "I don't see any of the oauth stuff"

---

## 8. Critical Questions for Implementation Verification

### Authentication Flow Questions

1. **Which signup route is current?**
   - Is it `/signup`, `/register`, or `/unified-registration`?
   - Do multiple routes coexist (legacy paths)?

2. **Do OAuth components exist?**
   - Does TierSelector.jsx exist?
   - Does AuthMethodSelector.jsx exist?
   - Does OAuthCallback.jsx exist?

3. **Is OAuth configured in Supabase?**
   - Are Google and GitHub providers enabled?
   - Are Client IDs and Secrets configured?
   - Are redirect URLs correct?

4. **Is password auth removed?**
   - Can users still sign up with password?
   - Do password fields exist in components?
   - Is password reset functionality removed?

### Integration Questions

5. **Is Stripe integration working?**
   - Are Edge Functions deployed?
   - Is webhook endpoint configured in Stripe?
   - Can users complete Coffee tier payment?

6. **Is Magic Link configured?**
   - Is Resend API configured?
   - Are magic link emails being sent?
   - Do magic links redirect correctly?

7. **Is context preservation working?**
   - Are localStorage functions implemented?
   - Does URL persist through OAuth redirects?
   - Does context clear after use?

8. **Is first login detection working?**
   - Is is_first_login column in database?
   - Does routing skip upsell on first login?
   - Is database updated after first login?

---

## 9. Comparison: Architecture Docs vs User Complaint

### What Architecture Says (Intended)

**Authentication**: OAuth-first (Google + GitHub) with Magic Link fallback
**Status**: "Accepted and Implemented" (ADR dated 2025-10-02)
**Migration**: Complete from password auth to OAuth-first
**Components**: TierSelector, AuthMethodSelector, OAuthCallback

### What User Says (Actual)

> "I don't see any of the oauth stuff we were supposed to be delivering"

**Implies**:
- OAuth may not be visible/working in UI
- OAuth was planned but not delivered
- User expected to see OAuth buttons/flows

**User Also Says**:
> "I feel like you have totally lost the plot and are fixing completely the wrong probably partially legacy journeys"

**Implies**:
- Multiple authentication paths exist (legacy + new)
- Fixes being applied to wrong code paths
- Confusion about which journey is current

---

## 10. Summary: INTENDED vs ACTUAL Status

### INTENDED Architecture (from docs)

**Status**: Documented as "Accepted and Implemented" (2025-10-02)

**Authentication Methods**:
1. Google OAuth (primary)
2. GitHub OAuth (secondary)
3. Magic Link (fallback)
4. Password auth (removed)

**User Journey**:
1. Land on signup page
2. Select tier (Free or Coffee)
3. Choose OAuth method
4. Authenticate via provider
5. Return to /#/oauth-callback
6. If Coffee: Complete Stripe payment
7. Reach /analyze page

**Key Components**:
- TierSelector.jsx
- AuthMethodSelector.jsx
- OAuthCallback.jsx
- Stripe checkout integration
- Context preservation via localStorage

### LIKELY ACTUAL Status (based on user complaint)

**Gap Analysis Needed**:
- OAuth components may not exist
- OAuth providers may not be configured
- Legacy password auth may still be active
- Multiple authentication paths may coexist
- User is seeing wrong authentication journey

**Next Steps**:
1. **DO NOT FIX ANYTHING YET**
2. **Analyst must compare** INTENDED (this doc) vs ACTUAL (codebase)
3. **Identify** which components exist vs documented
4. **Verify** OAuth configuration status
5. **Report** gaps between architecture and implementation
6. **User confirms** correct journey before any fixes

---

## Appendix A: Key Architecture Decisions

### ADR-001: OAuth-First Authentication (2025-10-02)

**Decision**: Implement Google + GitHub OAuth as primary auth methods, with Magic Link as fallback

**Rationale**:
- Zero friction - 2 clicks to sign up
- Email inherently verified (OAuth providers verify)
- Familiar UX - Users expect "Continue with Google"
- Better security - No password management needed
- Lower support burden - No password reset emails
- Higher conversion - 60%+ signup rate vs 30% with password

### ADR-002: Hybrid OAuth + Magic Link (Not OAuth-Only)

**Decision**: Provide Magic Link option alongside OAuth

**Rationale**:
- Accessibility - Not all users have Google/GitHub accounts
- Privacy - Some users prefer not to use OAuth
- Reliability - Email-based fallback if OAuth providers have issues
- Professional users - Some work emails can't use personal OAuth

### ADR-003: Stripe Checkout (Not Stripe Elements)

**Decision**: Use Stripe Checkout hosted pages for payment

**Rationale**:
- PCI compliance handled by Stripe (massive burden lifted)
- Mobile-optimized payment UI
- Multiple payment methods (credit card, Apple Pay, Google Pay)
- Built-in fraud prevention
- Faster development (weeks vs months)

### ADR-004: Tier-Based Upsell Pages (Not Universal Modal)

**Decision**: Create separate upsell pages for each tier transition

**Rationale**:
- Customized messaging per tier
- Full-page real estate for persuasive content
- Easier to A/B test different messaging
- Can show different features/benefits per tier

### ADR-005: Context Preservation via localStorage (Not URL Parameters)

**Decision**: Store pending analysis URL in localStorage, not URL parameters

**Rationale**:
- Survives OAuth redirects (even in new tabs)
- Survives browser refresh
- No server-side storage needed
- 24-hour TTL prevents stale data

### ADR-006: First Login Detection (Skip Upsell Initially)

**Decision**: Skip upsell on first login after signup, show on second login

**Rationale**:
- Better onboarding - Users reach value faster
- Less pressure - Don't push upgrade before they've tried it
- Higher engagement - Users explore product first
- Better conversion timing - Upsell after they see value

---

## Appendix B: Database Schema for Authentication

### Users Table (Extended)

```sql
-- Core authentication
id UUID PRIMARY KEY
email TEXT NOT NULL UNIQUE
email_confirmed_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()

-- OAuth tracking
auth_provider TEXT  -- 'google', 'github', 'email'

-- Tier management
selected_tier TEXT DEFAULT 'free'  -- 'free', 'coffee', 'growth', 'scale'
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

### Waitlist Table

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

---

## Appendix C: Environment Variables Required

### OAuth Configuration

```bash
# Supabase (public)
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# OAuth Redirect URLs (configured in Supabase dashboard)
# Google: https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
# GitHub: https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
```

### Stripe Configuration

```bash
# Stripe (public)
VITE_STRIPE_PUBLIC_KEY=pk_test_... # or pk_live_...

# Stripe Price IDs
VITE_STRIPE_COFFEE_PRICE_ID=price_...

# Stripe (server-side only - Edge Functions)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email Configuration (Magic Link)

```bash
# Resend API (server-side only)
RESEND_API_KEY=re_...
```

---

**END OF INTENDED ARCHITECTURE ANALYSIS**

**Next Action**: Analyst compares this INTENDED architecture with ACTUAL codebase implementation
