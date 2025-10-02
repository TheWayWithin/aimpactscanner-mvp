# User Stories: OAuth-First Authentication & Tier-Based Monetization

**Project**: AImpactScanner MVP
**Mission**: OAuth-first auth system with strategic monetization
**Created**: 2025-10-02
**Status**: Ready for Implementation

---

## Table of Contents

1. [OAuth Authentication](#1-oauth-authentication-google--github)
2. [Magic Link Authentication](#2-magic-link-authentication)
3. [Context-Aware Post-Signup Routing](#3-context-aware-post-signup-routing)
4. [Tier-Based Upsell Pages](#4-tier-based-upsell-pages)
5. [Stripe Payment Integration](#5-stripe-payment-integration)
6. [Waitlist Capture](#6-waitlist-capture)
7. [First Login Detection](#7-first-login-detection)

---

## 1. OAuth Authentication (Google + GitHub)

### Story 1.1: Google OAuth Signup - New User

**As a** new visitor to AImpactScanner
**I want to** sign up using my Google account
**So that** I can quickly create an account without managing another password

**Priority**: P0 (Must Have)
**Effort**: L (5-8 hours)
**Dependencies**: Supabase OAuth configuration, Google Cloud Console setup

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Continue with Google" button displayed prominently (primary position)
- [ ] Button uses Google brand colors (#4285F4) and official Google icon
- [ ] Clicking button opens Google OAuth consent screen
- [ ] User can select Google account from list
- [ ] After consent, user redirected back to application
- [ ] Account created in `auth.users` with provider='google'
- [ ] Profile created in `public.users` with tier='free' by default
- [ ] User's email verified automatically (OAuth inherent verification)
- [ ] User's name extracted from Google profile data
- [ ] Session established, user logged in immediately

**Edge Cases**:
- [ ] Email already exists with different provider → Show error: "Account exists with different login method. Try GitHub or Magic Link."
- [ ] User cancels Google OAuth flow → Return to signup page with message: "Signup cancelled. Please try again."
- [ ] OAuth callback fails → Show error: "Authentication failed. Please try again or use Magic Link."
- [ ] Network interruption during OAuth → Graceful error: "Connection lost. Please check your internet and retry."
- [ ] Google API rate limit exceeded → Fallback message: "Google login temporarily unavailable. Try GitHub or Magic Link."

**Security Considerations**:
- [ ] OAuth state parameter validated to prevent CSRF attacks
- [ ] Redirect URI matches configured whitelist exactly
- [ ] No sensitive data stored in localStorage during OAuth flow
- [ ] Session tokens use secure, httpOnly cookies where possible
- [ ] OAuth tokens never exposed to client-side JavaScript

**Technical Requirements**:
- [ ] Supabase OAuth provider configured with correct Client ID/Secret
- [ ] Authorized redirect URI: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- [ ] Local dev redirect URI: `http://localhost:54321/auth/v1/callback`
- [ ] Google Cloud Console OAuth credentials configured
- [ ] Scopes requested: email, profile (no excessive permissions)

**Non-Functional Requirements**:
- [ ] OAuth flow completes in under 5 seconds (95th percentile)
- [ ] Button accessible via keyboard navigation
- [ ] Screen reader announces button as "Sign up with Google"
- [ ] Works across Chrome, Firefox, Safari, Edge

---

### Story 1.2: GitHub OAuth Signup - New User

**As a** developer visiting AImpactScanner
**I want to** sign up using my GitHub account
**So that** I can use my existing developer identity without creating new credentials

**Priority**: P0 (Must Have)
**Effort**: L (4-6 hours)
**Dependencies**: GitHub OAuth App setup, Supabase configuration

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Continue with GitHub" button displayed (secondary position, below Google)
- [ ] Button uses GitHub brand colors (#24292e) and official GitHub icon
- [ ] Clicking button opens GitHub OAuth authorization screen
- [ ] After authorization, user redirected back to application
- [ ] Account created in `auth.users` with provider='github'
- [ ] Profile created in `public.users` with tier='free'
- [ ] Email verified automatically (OAuth inherent verification)
- [ ] Username and name extracted from GitHub profile
- [ ] Session established immediately

**Edge Cases**:
- [ ] GitHub email is private → Use primary public email or prompt user to make email public
- [ ] Email already exists with different provider → Show appropriate error message
- [ ] User denies GitHub authorization → Return to signup with cancellation message
- [ ] GitHub API unavailable → Show fallback: "GitHub login unavailable. Try Google or Magic Link."
- [ ] Multiple emails on GitHub account → Use primary email

**Security Considerations**:
- [ ] OAuth state parameter prevents CSRF
- [ ] Only request necessary GitHub scopes (user:email)
- [ ] Validate GitHub user identity via API call after OAuth
- [ ] Secure token storage, never exposed to client
- [ ] RLS policies prevent unauthorized data access

**Technical Requirements**:
- [ ] GitHub OAuth App created with correct callback URL
- [ ] Supabase GitHub provider configured
- [ ] Authorization callback URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- [ ] Local dev: `http://localhost:54321/auth/v1/callback`
- [ ] Scopes: `user:email` (minimal necessary permissions)

**Non-Functional Requirements**:
- [ ] OAuth flow under 6 seconds (95th percentile)
- [ ] Accessible via keyboard and screen readers
- [ ] Mobile responsive button design
- [ ] Works on all major browsers

---

### Story 1.3: OAuth Login - Returning User

**As a** returning user who signed up with OAuth
**I want to** log in with the same OAuth provider
**So that** I can access my account quickly and securely

**Priority**: P0 (Must Have)
**Effort**: M (3-5 hours)
**Dependencies**: Story 1.1, Story 1.2, First Login Detection (Story 7.1)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Continue with Google" and "Continue with GitHub" buttons on login page
- [ ] Clicking appropriate provider button initiates OAuth flow
- [ ] After authentication, user session restored
- [ ] User profile loaded from `public.users`
- [ ] If `isFirstLogin = false`, redirect to tier-based upsell page
- [ ] If `isFirstLogin = true`, redirect to analysis page (skip upsell)
- [ ] User tier and subscription status loaded correctly

**Edge Cases**:
- [ ] User tries wrong OAuth provider → Error: "No account found with this provider. Try [other_provider]."
- [ ] User account was deleted → Error: "Account not found. Please sign up again."
- [ ] Session expired during navigation → Re-prompt for authentication
- [ ] User logged out by admin → Show message: "Your account has been disabled. Contact support."
- [ ] Database unavailable during login → Graceful error with retry option

**Security Considerations**:
- [ ] Verify OAuth token hasn't been tampered with
- [ ] Check user account is active (not banned/deleted)
- [ ] Regenerate session token on login
- [ ] Log login attempts for security monitoring
- [ ] Detect suspicious login patterns (unusual location/device)

**Technical Requirements**:
- [ ] OAuth flow identical to signup flow
- [ ] Supabase automatically matches existing user by email
- [ ] Session management using Supabase auth tokens
- [ ] `isFirstLogin` flag updated to `false` after first successful login

**Non-Functional Requirements**:
- [ ] Login completes in under 4 seconds
- [ ] Smooth transition to post-login destination
- [ ] No flash of unauthenticated content (FOUC)

---

## 2. Magic Link Authentication

### Story 2.1: Magic Link Signup - New User

**As a** user who prefers not to use OAuth providers
**I want to** sign up using a passwordless magic link
**So that** I can create an account securely without managing passwords

**Priority**: P1 (Should Have)
**Effort**: M (4-6 hours)
**Dependencies**: SMTP configuration (Resend API), Email template design

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Continue with Email" button displayed (tertiary position, below OAuth buttons)
- [ ] Button styled subtly (gray, less prominent than OAuth)
- [ ] Clicking button reveals email input field
- [ ] User enters email address
- [ ] Client-side validation: valid email format
- [ ] Click "Send Magic Link" button
- [ ] Magic link email sent via Resend (SMTP)
- [ ] Confirmation shown: "Check your email! We sent a magic link to [email]"
- [ ] Email delivered within 30 seconds
- [ ] User clicks link in email
- [ ] Redirected to application, authenticated automatically
- [ ] Account created in `auth.users` with provider='email'
- [ ] Profile created in `public.users` with tier='free'

**Edge Cases**:
- [ ] Email already exists → Send login magic link instead of signup link
- [ ] Invalid email format → Show error: "Please enter a valid email address"
- [ ] Email bounces (invalid domain) → Log error, inform user: "Email delivery failed. Check your address."
- [ ] User doesn't receive email → Show "Didn't receive email? Resend link" button
- [ ] Magic link expires (1 hour) → Show error: "Link expired. Request a new magic link."
- [ ] User clicks magic link twice → First click works, second shows: "Already authenticated"
- [ ] User opens magic link on different device → Works seamlessly, session established

**Security Considerations**:
- [ ] Magic link token is single-use only
- [ ] Token expires after 1 hour
- [ ] Token cryptographically secure (128+ bits entropy)
- [ ] Email sent over TLS
- [ ] Rate limiting: max 3 magic link requests per email per hour
- [ ] No sensitive data in email content (just the secure link)

**Technical Requirements**:
- [ ] Supabase `signInWithOtp()` method used
- [ ] Resend API configured in Supabase Dashboard
- [ ] SMTP settings verified: `support@aimpactscanner.com` as sender
- [ ] Email template includes magic link with UTM parameters
- [ ] Redirect URL: `${window.location.origin}/auth/callback`
- [ ] Selected tier stored in `data` parameter for post-auth routing

**Non-Functional Requirements**:
- [ ] Email delivery under 30 seconds (95th percentile)
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail, Yahoo
- [ ] Email passes spam filters (SPF, DKIM, DMARC configured)
- [ ] Mobile-friendly email design
- [ ] Clear call-to-action button in email

---

### Story 2.2: Magic Link Login - Returning User

**As a** returning user who signed up with magic link
**I want to** log in by requesting a new magic link
**So that** I can access my account without remembering a password

**Priority**: P1 (Should Have)
**Effort**: S (2-3 hours)
**Dependencies**: Story 2.1, SMTP configuration

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Continue with Email" button on login page
- [ ] User enters email address
- [ ] Click "Send Magic Link"
- [ ] System checks if email exists in database
- [ ] If exists: Send login magic link
- [ ] If not exists: Send signup magic link (or show error)
- [ ] User receives email within 30 seconds
- [ ] Clicks link, authenticated automatically
- [ ] Redirected to tier-based upsell page (unless first login)

**Edge Cases**:
- [ ] Email not found → Option: "Email not found. Sign up instead?" with link
- [ ] Rate limit exceeded → Error: "Too many requests. Try again in 10 minutes."
- [ ] User has multiple accounts (shouldn't happen) → Send link for most recently used account
- [ ] Magic link clicked after session exists → Show: "Already logged in" and redirect to dashboard

**Security Considerations**:
- [ ] Rate limiting per email and per IP
- [ ] Log all magic link requests for audit trail
- [ ] Detect brute force attempts (many failed emails)
- [ ] Token invalidated after first use
- [ ] No enumeration vulnerability (same message for existing/non-existing email)

**Technical Requirements**:
- [ ] Same Supabase `signInWithOtp()` method as signup
- [ ] Email template distinguishes login vs signup (optional)
- [ ] Session established using Supabase auth token
- [ ] `isFirstLogin` flag respected for routing

**Non-Functional Requirements**:
- [ ] Consistent email delivery time
- [ ] Clear messaging that this is a login (not signup) email

---

## 3. Context-Aware Post-Signup Routing

### Story 3.1: Landing Page URL Entry → Signup → Pre-Populated Analysis

**As a** new user who enters a URL on the landing page
**I want to** be redirected to the analysis page with my URL pre-filled after signup
**So that** I can immediately analyze the URL I entered without re-typing it

**Priority**: P0 (Must Have - Critical UX)
**Effort**: M (4-5 hours)
**Dependencies**: localStorage helpers, Post-signup routing logic

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User enters URL in landing page input field
- [ ] URL stored in `localStorage.pendingAnalysisUrl` immediately on input
- [ ] User clicks "Analyze" button
- [ ] Redirected to signup page
- [ ] localStorage context persists through redirect
- [ ] User completes signup (OAuth or Magic Link)
- [ ] After authentication, check localStorage for `pendingAnalysisUrl`
- [ ] If exists: Redirect to `/analyze` with URL pre-populated in input field
- [ ] If Coffee tier selected: Complete Stripe payment FIRST, then redirect to analysis
- [ ] Pre-populated URL is immediately visible to user
- [ ] User can modify URL or click "Analyze" to run scan
- [ ] After analysis starts, clear `localStorage.pendingAnalysisUrl`

**Edge Cases**:
- [ ] URL stored but user abandons signup → Context expires after 24 hours (clear old entries)
- [ ] User refreshes during signup flow → localStorage persists, context restored
- [ ] User closes tab and returns later → Context still available (if under 24h)
- [ ] Invalid URL stored (malformed) → Pre-populate but show validation error on analyze attempt
- [ ] localStorage unavailable (privacy mode) → Fallback: Use URL parameter in redirect
- [ ] User enters URL, signs up, then enters different URL → Use most recent URL
- [ ] Multiple tabs open with different URLs → Each tab has independent context

**Security Considerations**:
- [ ] Validate URL format before storing in localStorage
- [ ] Sanitize URL before displaying in input field (prevent XSS)
- [ ] Don't store sensitive data in localStorage (only public URL)
- [ ] Clear localStorage after use to avoid data leakage
- [ ] Don't trust localStorage blindly (validate on retrieval)

**Technical Requirements**:
- [ ] `storeAnalysisContext(url)` helper function in `/src/lib/authHelpers.js`
- [ ] `getAnalysisContext()` retrieves and validates stored URL
- [ ] `clearAnalysisContext()` removes used context
- [ ] Context includes: `{ pendingAnalysisUrl, timestamp, journeySource }`
- [ ] TTL: 24 hours (ignore contexts older than 24h)
- [ ] Post-signup routing checks context before deciding destination

**Non-Functional Requirements**:
- [ ] Context retrieval under 50ms (localStorage is fast)
- [ ] Smooth transition with no visible loading gaps
- [ ] Pre-populated URL is highlighted/selected for easy modification
- [ ] Works across all browsers that support localStorage

---

### Story 3.2: Direct Signup → Empty Analysis Page

**As a** user who signs up directly (not from landing page)
**I want to** land on the analysis page with an empty URL field
**So that** I can enter any URL I want to analyze

**Priority**: P0 (Must Have)
**Effort**: S (2-3 hours)
**Dependencies**: Story 3.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User clicks "Sign Up" from navbar or CTA (not from landing page URL entry)
- [ ] No URL stored in localStorage
- [ ] User completes signup (OAuth or Magic Link)
- [ ] After authentication, check localStorage for context
- [ ] If no context: Redirect to `/analyze` with empty URL field
- [ ] User sees empty input field with placeholder: "Enter URL to analyze..."
- [ ] User enters URL and runs analysis
- [ ] Normal analysis flow proceeds

**Edge Cases**:
- [ ] Old expired context exists → Ignore it, treat as "no context"
- [ ] Context from different domain stored → Validate and ignore
- [ ] User had context but cleared localStorage → Empty field shown

**Security Considerations**:
- [ ] No context = no security risk (standard empty state)

**Technical Requirements**:
- [ ] Post-signup routing function: `getPostSignupDestination(user, context)`
- [ ] Returns `{ path: '/analyze', state: { prefilledUrl: null } }` when no context

**Non-Functional Requirements**:
- [ ] Consistent UX whether context exists or not
- [ ] Clear visual distinction (empty field vs pre-filled)

---

### Story 3.3: Context Preservation Through OAuth Redirects

**As a** user going through OAuth signup
**I want** my landing page context (URL) preserved through all OAuth redirects
**So that** I don't lose my place in the journey

**Priority**: P0 (Must Have - Critical for OAuth)
**Effort**: M (3-4 hours)
**Dependencies**: Story 1.1, Story 1.2, Story 3.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User enters URL on landing page → localStorage stores it
- [ ] User clicks "Analyze" → Redirected to signup
- [ ] User selects Google OAuth → Redirected to Google
- [ ] After Google consent → Redirected back to app
- [ ] localStorage context still intact
- [ ] Post-auth routing checks localStorage
- [ ] URL pre-populated in analysis page
- [ ] Same flow works for GitHub OAuth

**Edge Cases**:
- [ ] User abandons OAuth at Google consent screen → Returns to app, context still available
- [ ] OAuth fails midway → Return to signup, context preserved for retry
- [ ] User changes mind, picks different auth method → Context works with all methods

**Security Considerations**:
- [ ] NEVER store context in OAuth state parameter (size limits + security risk)
- [ ] localStorage is client-side only (never sent to OAuth provider)
- [ ] Context validated after OAuth completes (don't trust blindly)

**Technical Requirements**:
- [ ] OAuth redirect flow doesn't clear localStorage (natural browser behavior)
- [ ] Supabase OAuth callback preserves localStorage
- [ ] Post-auth hook checks localStorage immediately after session established

**Non-Functional Requirements**:
- [ ] Seamless UX - user never notices localStorage mechanics
- [ ] No data loss across any redirect in flow

---

## 4. Tier-Based Upsell Pages

### Story 4.1: Free → Coffee Upsell Page

**As a** free tier user who logs in
**I want to** see compelling reasons to upgrade to Coffee plan
**So that** I can make an informed decision about upgrading

**Priority**: P0 (Must Have - Primary Monetization)
**Effort**: M (4-6 hours)
**Dependencies**: Stripe integration (Story 5.1), First login detection (Story 7.1)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] Page accessible at `/upsell/coffee`
- [ ] Shown to free tier users on login (EXCEPT first login after signup)
- [ ] Headline: "Unlock Unlimited Analyses with Coffee Plan"
- [ ] Coffee plan benefits displayed EXACTLY as specified in AUTH_MONETIZATION_SPEC.md:
  - ✅ Unlimited AI-powered analyses per month
  - ✅ 10 MASTERY-AI Framework factors (Phase A)
  - ✅ Professional PDF reports (no watermarks)
  - ✅ Clean, exportable results dashboard
  - ✅ Educational content & recommendations
  - ✅ Email support
  - ✅ 30-day money-back guarantee
- [ ] Free plan limitations shown EXACTLY as specified:
  - ⚠️ Only 3 analyses per month
  - ❌ Basic recommendations only
  - ❌ Phase A factors only
  - ❌ Web-only results (no PDF export)
  - ❌ Community support only
  - ❌ No advanced AI insights
- [ ] ZERO RISK section displayed (exact copy from spec)
- [ ] Credibility signals displayed (Expert Solopreneur, Not VC-Funded, Real Results)
- [ ] Security & Privacy section displayed
- [ ] Pricing: "$4.95/month" clearly shown
- [ ] Two CTAs:
  - Primary: "Upgrade to Coffee Plan" button (large, blue, prominent) → Stripe checkout
  - Secondary: "Maybe Later" button (smaller, gray, subtle) → Dashboard
- [ ] Visual design: Professional, clean, persuasive (not pushy)

**Edge Cases**:
- [ ] User already has Coffee tier → Redirect to dashboard (shouldn't see this page)
- [ ] User already has higher tier (Growth/Scale) → Redirect to dashboard
- [ ] User clicks "Upgrade" but Stripe unavailable → Show error: "Payment processing unavailable. Try again later."
- [ ] User clicks "Maybe Later" → Redirect to dashboard immediately
- [ ] User refreshes page during upsell → Page persists (doesn't skip to dashboard)

**Security Considerations**:
- [ ] Verify user is authenticated before showing page
- [ ] Verify user tier matches expected tier (free)
- [ ] Don't allow direct navigation to upsell page from URL bar (redirect if tier wrong)

**Technical Requirements**:
- [ ] React component: `/src/pages/UpsellCoffee.jsx`
- [ ] Route added to `/src/App.jsx`: `/upsell/coffee`
- [ ] Post-login routing function directs free tier users here
- [ ] Messaging imported from constants file (for consistency)
- [ ] Stripe checkout integration (Story 5.1)

**Non-Functional Requirements**:
- [ ] Page loads in under 1 second
- [ ] Mobile-responsive design
- [ ] Images optimized for web
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Clear visual hierarchy (benefits vs limitations)
- [ ] Persuasive but not aggressive tone

---

### Story 4.2: Coffee → Growth Upsell Page (Waitlist)

**As a** Coffee tier user who logs in
**I want to** learn about the upcoming Growth plan and join the waitlist
**So that** I can be notified when advanced features become available

**Priority**: P1 (Should Have)
**Effort**: M (3-5 hours)
**Dependencies**: Waitlist capture (Story 6.1)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] Page accessible at `/upsell/growth`
- [ ] Shown to Coffee tier users on login (EXCEPT first login after signup)
- [ ] Headline: "Coming Soon: Growth Plan with Advanced Features"
- [ ] Growth plan benefits displayed EXACTLY as specified:
  - ✅ Everything in Coffee Plan
  - ✅ 22 total factors (Phase A + Phase B)
  - ✅ Advanced PDF reports with deeper insights
  - ✅ AI Remediation Planner
  - ✅ Progress tracking dashboard
  - ✅ Priority support
  - 🔧 Coming soon!
- [ ] Coffee plan comparison shown (what they currently have)
- [ ] Pricing: "$29/month" shown with "Coming Soon" badge
- [ ] ZERO RISK section displayed
- [ ] Credibility signals displayed
- [ ] Two CTAs:
  - Primary: "Join Waitlist - Be First to Upgrade" button (large, orange, prominent)
  - Secondary: "Stay on Coffee" button (smaller, gray) → Dashboard
- [ ] Clicking "Join Waitlist":
  - Capture user interest in database
  - Show confirmation: "✅ You're on the list! We'll email when Growth launches."
  - Redirect to dashboard after 3 seconds
- [ ] Clicking "Stay on Coffee" → Dashboard immediately

**Edge Cases**:
- [ ] User already on Growth tier → Redirect to dashboard
- [ ] User already on Scale tier → Redirect to dashboard
- [ ] User already joined waitlist → Show: "✅ Already on waitlist!" and skip to dashboard
- [ ] Database insert fails → Show error: "Couldn't join waitlist. Email support@aimpactscanner.com"

**Security Considerations**:
- [ ] Verify user is authenticated and has Coffee tier
- [ ] Prevent duplicate waitlist entries (UNIQUE constraint in DB)

**Technical Requirements**:
- [ ] React component: `/src/pages/UpsellGrowth.jsx`
- [ ] Route: `/upsell/growth`
- [ ] Waitlist capture function (Story 6.1)
- [ ] Database table: `waitlist` (user_id, interested_tier='growth')

**Non-Functional Requirements**:
- [ ] Page loads fast (under 1 second)
- [ ] Mobile-responsive
- [ ] "Coming Soon" clearly communicated
- [ ] Waitlist join feels like positive action (not disappointment)

---

### Story 4.3: Growth → Scale Upsell Page (Waitlist)

**As a** Growth tier user who logs in
**I want to** learn about the upcoming Scale plan and join the waitlist
**So that** I can access enterprise features when they launch

**Priority**: P2 (Nice to Have - Future)
**Effort**: M (3-5 hours)
**Dependencies**: Waitlist capture (Story 6.1)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] Page accessible at `/upsell/scale`
- [ ] Shown to Growth tier users on login (EXCEPT first login)
- [ ] Headline: "Coming Soon: Scale Plan for Enterprise Teams"
- [ ] Scale plan benefits displayed EXACTLY as specified:
  - ✅ Everything in Growth Plan
  - ✅ API access for automation
  - ✅ White-label PDF reports
  - ✅ Team collaboration features
  - ✅ Custom reporting
  - ✅ Webhook integrations
  - ✅ Dedicated support
  - 🔧 Coming soon!
- [ ] Growth plan comparison shown
- [ ] Pricing: "$99/month" with "Coming Soon" badge
- [ ] ZERO RISK section displayed
- [ ] Two CTAs:
  - Primary: "Join Waitlist - Enterprise Early Access"
  - Secondary: "Stay on Growth" → Dashboard
- [ ] Clicking "Join Waitlist":
  - Capture interest in database
  - Show confirmation: "✅ You're on the Scale waitlist! We'll reach out personally."
  - Redirect to dashboard after 3 seconds

**Edge Cases**:
- [ ] User already on Scale tier → Redirect to welcome page
- [ ] User already joined Scale waitlist → Show already joined message
- [ ] Database insert fails → Error message with support email

**Security Considerations**:
- [ ] Verify user has Growth tier
- [ ] Prevent duplicate waitlist entries

**Technical Requirements**:
- [ ] React component: `/src/pages/UpsellScale.jsx`
- [ ] Route: `/upsell/scale`
- [ ] Waitlist capture (interested_tier='scale')

**Non-Functional Requirements**:
- [ ] Enterprise-focused messaging
- [ ] Professional design befitting $99/month tier
- [ ] Clear communication of business value

---

### Story 4.4: Scale Tier Welcome Page

**As a** Scale tier user who logs in
**I want to** see a welcome message and know how to access premium support
**So that** I feel valued as a top-tier customer

**Priority**: P2 (Nice to Have - Future)
**Effort**: S (2-3 hours)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] Page accessible at `/welcome/scale`
- [ ] Shown to Scale tier users on login
- [ ] Headline: "Welcome to AImpactScanner Scale"
- [ ] Sub-headline: "You have full access to all enterprise features"
- [ ] Key features listed (what they have access to)
- [ ] Dedicated support section:
  - Email: support@aimpactscanner.com (priority queue)
  - Response time: Within 4 hours
  - Available: Monday-Friday, 9am-5pm ET
- [ ] Quick links:
  - API Documentation
  - Team Management
  - Custom Reports
  - Dashboard
- [ ] CTA: "Continue to Dashboard" button (large, prominent)
- [ ] NO upsell (they're already at top tier)

**Edge Cases**:
- [ ] User doesn't have Scale tier → Redirect to appropriate upsell page

**Security Considerations**:
- [ ] Verify Scale tier membership
- [ ] Ensure API keys/docs are access-controlled

**Technical Requirements**:
- [ ] React component: `/src/pages/WelcomeScale.jsx`
- [ ] Route: `/welcome/scale`

**Non-Functional Requirements**:
- [ ] Premium feel (high-quality design)
- [ ] Fast load time
- [ ] Clear next steps

---

## 5. Stripe Payment Integration

### Story 5.1: Stripe Checkout - Coffee Plan Upgrade

**As a** user who selects the Coffee plan during signup
**I want to** complete payment securely via Stripe
**So that** I can access unlimited analyses immediately

**Priority**: P0 (Must Have - Critical for Revenue)
**Effort**: L (6-8 hours)
**Dependencies**: Stripe account setup, Webhook configuration

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User completes OAuth/Magic Link authentication with Coffee tier selected
- [ ] Account created with:
  - `tier = 'free'`
  - `selected_tier = 'coffee'`
  - `subscription_status = 'pending_payment'`
- [ ] Immediately after auth, redirect to Stripe Checkout
- [ ] Checkout session created with:
  - Price: $4.95/month recurring
  - Customer email: user's email
  - Product: "AImpactScanner Coffee Plan"
  - Success URL: `${origin}/auth/payment-success`
  - Cancel URL: `${origin}/auth/payment-cancelled`
  - Metadata: `{ user_id, tier: 'coffee' }`
- [ ] User enters payment details in Stripe hosted page
- [ ] On successful payment:
  - Stripe webhook fires: `checkout.session.completed`
  - Webhook handler updates database:
    - `tier = 'coffee'`
    - `subscription_status = 'active'`
    - `stripe_customer_id = session.customer`
    - `stripe_subscription_id = session.subscription`
  - User redirected to analysis page (with URL pre-populated if context exists)
- [ ] User can immediately run unlimited analyses

**Edge Cases**:
- [ ] Payment declined → User redirected to cancel URL, stays Free tier, sees banner: "Payment failed. Would you like to retry?"
- [ ] User closes Stripe checkout → Same as above (payment not completed)
- [ ] Webhook fails to fire → Manual reconciliation process (check Stripe dashboard)
- [ ] User already has Coffee tier → Don't create new checkout session, redirect to dashboard
- [ ] Network error during checkout → Stripe handles gracefully with retry
- [ ] User refreshes during payment → Stripe prevents duplicate charges

**Security Considerations**:
- [ ] Stripe API keys stored securely in environment variables (not in code)
- [ ] Webhook endpoint validates Stripe signature (prevents spoofing)
- [ ] Webhook secret stored securely
- [ ] Customer ID never exposed to client-side JavaScript
- [ ] Payment details handled entirely by Stripe (PCI compliance)
- [ ] HTTPS enforced for all payment-related pages

**Technical Requirements**:
- [ ] Stripe Checkout Session API used (server-side)
- [ ] Webhook endpoint created: `/api/stripe/webhook` or Supabase Edge Function
- [ ] Webhook events subscribed: `checkout.session.completed`, `customer.subscription.deleted`
- [ ] Stripe public key in `.env`: `VITE_STRIPE_PUBLIC_KEY`
- [ ] Stripe secret key in server env: `STRIPE_SECRET_KEY`
- [ ] Webhook secret in server env: `STRIPE_WEBHOOK_SECRET`
- [ ] Idempotency: Prevent duplicate subscription charges

**Non-Functional Requirements**:
- [ ] Checkout session created in under 2 seconds
- [ ] Webhook processes in under 5 seconds
- [ ] User sees updated tier within 10 seconds of payment success
- [ ] Clear loading states during checkout creation
- [ ] Error messages are user-friendly (not technical jargon)

---

### Story 5.2: Graceful Payment Failure Handling

**As a** user whose payment fails during Coffee upgrade
**I want to** still have a working free account with option to retry payment
**So that** I'm not locked out or stuck in a broken state

**Priority**: P0 (Must Have - Critical UX)
**Effort**: M (3-4 hours)
**Dependencies**: Story 5.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User completes authentication with Coffee tier selected
- [ ] Redirected to Stripe checkout
- [ ] Payment fails or user cancels
- [ ] Redirected to cancel URL: `/auth/payment-cancelled`
- [ ] User account remains:
  - `tier = 'free'`
  - `subscription_status = 'active'` (free tier active)
  - `selected_tier = 'coffee'` (record of intent)
- [ ] Banner shown on dashboard:
  - Message: "⚠️ Complete your Coffee plan upgrade to unlock unlimited analyses"
  - CTA: "Complete Payment" button → Retry Stripe checkout
- [ ] Banner persists until user:
  - Completes payment successfully, OR
  - Dismisses banner permanently
- [ ] User can use free tier features (3 analyses/month) while banner shown
- [ ] User can retry payment anytime from banner or account settings

**Edge Cases**:
- [ ] User dismisses banner but wants to upgrade later → "Upgrade" option in account settings
- [ ] User retries payment multiple times → Each attempt creates new checkout session (old ones expire)
- [ ] User completes payment after dismissing banner → Banner removed, tier updated

**Security Considerations**:
- [ ] Never block user account due to payment failure
- [ ] Free tier remains fully functional
- [ ] Don't store payment failure reasons (privacy)

**Technical Requirements**:
- [ ] Cancel URL handler: `/src/pages/PaymentCancelled.jsx`
- [ ] Banner component: persistent notification in dashboard
- [ ] Retry payment function: creates new Stripe checkout session
- [ ] Database flag: `payment_retry_banner_dismissed` (optional)

**Non-Functional Requirements**:
- [ ] Banner is non-intrusive (doesn't block UI)
- [ ] Banner can be dismissed temporarily (closes but reappears on reload)
- [ ] Clear distinction between "temporary failure" and "account locked" (never lock)
- [ ] Positive messaging ("Complete upgrade" not "Payment failed")

---

### Story 5.3: Subscription Cancellation

**As a** Coffee tier user who wants to cancel
**I want to** cancel my subscription instantly
**So that** I'm not charged again and have control over my spending

**Priority**: P1 (Should Have)
**Effort**: M (4-5 hours)
**Dependencies**: Story 5.1, Stripe Customer Portal

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Manage Subscription" button in account settings
- [ ] Clicking button redirects to Stripe Customer Portal
- [ ] User can cancel subscription in one click
- [ ] Confirmation shown: "Subscription cancelled. You'll have access until [end_date]"
- [ ] Webhook fires: `customer.subscription.deleted`
- [ ] Webhook handler updates database:
  - `subscription_status = 'canceled'`
  - `tier` remains 'coffee' until period end
  - After period end, tier reverts to 'free'
- [ ] User retains Coffee features until subscription period ends
- [ ] After period ends:
  - Tier downgraded to free
  - User notified via email
  - Banner shown: "Your Coffee subscription has ended. Resubscribe anytime!"

**Edge Cases**:
- [ ] User cancels and immediately resubscribes → New subscription created
- [ ] User cancels during trial (if applicable) → Immediate cancellation
- [ ] Webhook fails to fire → Cron job checks Stripe API daily for cancelled subscriptions

**Security Considerations**:
- [ ] Verify user owns the subscription before allowing access to Customer Portal
- [ ] Webhook signature validation

**Technical Requirements**:
- [ ] Stripe Customer Portal configured
- [ ] Webhook event: `customer.subscription.deleted`
- [ ] Scheduled job: Daily sync with Stripe for subscription status
- [ ] Database column: `subscription_end_date`

**Non-Functional Requirements**:
- [ ] Cancellation takes effect immediately in Stripe
- [ ] Database updated within 5 seconds of webhook
- [ ] User sees confirmation instantly
- [ ] No retention dark patterns (cancellation is truly one-click)

---

## 6. Waitlist Capture

### Story 6.1: Join Growth Plan Waitlist

**As a** Coffee tier user interested in advanced features
**I want to** join the Growth plan waitlist
**So that** I'm notified when the plan launches

**Priority**: P1 (Should Have)
**Effort**: S (2-3 hours)
**Dependencies**: Waitlist database table (Migration 021)

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Join Waitlist" button on Growth upsell page
- [ ] Clicking button calls waitlist capture function
- [ ] Database insert:
  - `user_id`: current user ID
  - `email`: user's email
  - `current_tier`: 'coffee'
  - `interested_tier`: 'growth'
  - `joined_at`: NOW()
  - `notified`: false
- [ ] Confirmation message: "✅ You're on the Growth waitlist! We'll email when it launches."
- [ ] User redirected to dashboard after 3 seconds
- [ ] Flag set on user profile: `growth_waitlist = true`

**Edge Cases**:
- [ ] User already on waitlist → Show: "✅ Already on waitlist!" and skip insert
- [ ] Database insert fails → Error: "Couldn't join waitlist. Please email support@aimpactscanner.com"
- [ ] User joins waitlist multiple times (different sessions) → Only one entry (UNIQUE constraint)

**Security Considerations**:
- [ ] Verify user is authenticated
- [ ] Prevent spam (rate limit: 1 join per user per 24h)

**Technical Requirements**:
- [ ] Function: `joinWaitlist(userId, interestedTier)`
- [ ] Database table: `waitlist` with UNIQUE(user_id, interested_tier)
- [ ] RLS policy: User can insert own waitlist entry
- [ ] Email notification (future): Trigger when Growth launches

**Non-Functional Requirements**:
- [ ] Insert completes in under 500ms
- [ ] Confirmation message is encouraging (not disappointing)
- [ ] User feels valued for showing interest

---

### Story 6.2: Join Scale Plan Waitlist

**As a** Growth tier user interested in enterprise features
**I want to** join the Scale plan waitlist
**So that** I can be contacted when Scale launches

**Priority**: P2 (Nice to Have)
**Effort**: S (1-2 hours)
**Dependencies**: Story 6.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] "Join Waitlist" button on Scale upsell page
- [ ] Database insert:
  - `interested_tier`: 'scale'
  - `current_tier`: 'growth'
  - Other fields same as Story 6.1
- [ ] Confirmation: "✅ You're on the Scale waitlist! We'll reach out personally when enterprise features launch."
- [ ] Flag set: `scale_waitlist = true`

**Edge Cases**:
- [ ] Same as Story 6.1

**Security Considerations**:
- [ ] Same as Story 6.1

**Technical Requirements**:
- [ ] Same `joinWaitlist()` function with different tier parameter

**Non-Functional Requirements**:
- [ ] Confirmation message emphasizes personal touch (enterprise sales approach)

---

### Story 6.3: Waitlist Notification System (Future)

**As an** admin/operator
**I want to** notify waitlist users when Growth/Scale plans launch
**So that** interested users can upgrade immediately

**Priority**: P3 (Future Enhancement)
**Effort**: M (4-6 hours)
**Dependencies**: Story 6.1, Story 6.2, Email notification system

#### Acceptance Criteria

**Functional Requirements**:
- [ ] Admin dashboard lists all waitlist entries
- [ ] Filter by interested_tier (growth/scale)
- [ ] Sort by joined_at (oldest first)
- [ ] "Send Launch Notification" button
- [ ] Clicking button:
  - Sends email to all users on waitlist for that tier
  - Email includes upgrade CTA link
  - Sets `notified = true` and `notified_at = NOW()` in database
- [ ] Email template includes:
  - Announcement of plan launch
  - Key features recap
  - Direct link to upgrade page
  - Personal thank you for early interest

**Edge Cases**:
- [ ] User already upgraded before notification sent → Skip email
- [ ] Email delivery fails → Log failed emails for retry
- [ ] User unsubscribed from marketing emails → Respect preference

**Security Considerations**:
- [ ] Admin-only access to notification function
- [ ] Rate limit bulk emails (avoid spam flags)

**Technical Requirements**:
- [ ] Admin dashboard page: `/admin/waitlist`
- [ ] Email template: `waitlist-launch-notification.html`
- [ ] Batch email sending via Resend API
- [ ] Update database after successful send

**Non-Functional Requirements**:
- [ ] Send emails in batches (100 per batch) to avoid rate limits
- [ ] Track open rates and click-through rates
- [ ] Personalized emails (use user's name)

---

## 7. First Login Detection

### Story 7.1: Skip Upsell on First Login After Signup

**As a** new user who just signed up
**I want to** go directly to the analysis page (not see an upsell)
**So that** I can start using the product immediately without interruption

**Priority**: P0 (Must Have - Critical UX)
**Effort**: M (3-4 hours)
**Dependencies**: User metadata schema, Post-login routing

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User completes signup (OAuth or Magic Link)
- [ ] Database record created with `is_first_login = true`
- [ ] User authenticated, session established
- [ ] Post-login routing checks `is_first_login` flag
- [ ] If `is_first_login = true`:
  - Skip tier-based upsell page
  - Redirect to analysis page (with URL pre-populated if context exists)
  - Set `is_first_login = false` in database
- [ ] If `is_first_login = false`:
  - Show tier-based upsell page
  - Normal upsell flow proceeds

**Edge Cases**:
- [ ] Database update fails to set `is_first_login = false` → User sees upsell on next login (not ideal but acceptable)
- [ ] User refreshes during first login → Flag already set to false, treated as second login (acceptable)
- [ ] User logs out and logs in immediately → Treated as second login (shows upsell)
- [ ] Multiple tabs during first login → One tab updates flag, others use cached value (acceptable)

**Security Considerations**:
- [ ] Flag cannot be manipulated by client (stored server-side in database)
- [ ] Only updated by trusted backend code

**Technical Requirements**:
- [ ] Database column: `is_first_login BOOLEAN DEFAULT true`
- [ ] Function: `updateFirstLoginFlag(userId)` called after first successful login
- [ ] Post-login routing: `getPostLoginDestination(user)` checks flag
- [ ] Flag persists across sessions (stored in database, not localStorage)

**Non-Functional Requirements**:
- [ ] Flag update completes in under 200ms
- [ ] No visible delay in routing (async update okay)
- [ ] Smooth UX - user doesn't notice flag mechanics

---

### Story 7.2: Show Upsell on Second and Subsequent Logins

**As a** returning user who has used the product
**I want to** see upgrade options when I log in
**So that** I can discover premium features as I get more value from the product

**Priority**: P0 (Must Have)
**Effort**: S (2-3 hours)
**Dependencies**: Story 7.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User logs in (second time or later)
- [ ] Database record has `is_first_login = false`
- [ ] Post-login routing checks flag
- [ ] Flag is false → Show tier-based upsell page
- [ ] Upsell page shown based on current tier:
  - Free → Coffee upsell
  - Coffee → Growth upsell
  - Growth → Scale upsell
  - Scale → Welcome page
- [ ] After upsell interaction (upgrade or dismiss), user redirected to dashboard

**Edge Cases**:
- [ ] User upgrades during upsell → Next login shows next tier upsell
- [ ] User dismisses upsell → Redirect to dashboard, upsell shown on next login
- [ ] User already at highest tier (Scale) → Show welcome page instead of upsell

**Security Considerations**:
- [ ] Verify user tier before showing appropriate upsell

**Technical Requirements**:
- [ ] Same routing function: `getPostLoginDestination(user)`
- [ ] Tier-based upsell routing: `getUpsellPage(user)`

**Non-Functional Requirements**:
- [ ] Upsell shown consistently on every login (builds familiarity)
- [ ] User can always dismiss and proceed (not blocking)

---

### Story 7.3: First Login Flag Persistence Across Auth Methods

**As a** user who signs up with OAuth and later uses Magic Link
**I want** my first login flag to persist across auth methods
**So that** I don't see duplicate "first login" experiences

**Priority**: P1 (Should Have)
**Effort**: XS (1 hour)
**Dependencies**: Story 7.1

#### Acceptance Criteria

**Functional Requirements**:
- [ ] User signs up with Google OAuth → `is_first_login = true`
- [ ] Flag set to `false` after first login
- [ ] User later logs in with Magic Link (same email)
- [ ] Flag remains `false` (no reset)
- [ ] Upsell shown as expected

**Edge Cases**:
- [ ] User has multiple auth methods → Flag is account-level, not auth-method-level
- [ ] User deletes account and re-signs up → New account, new flag (reset to true)

**Security Considerations**:
- [ ] Flag tied to `user_id` (not email or auth method)

**Technical Requirements**:
- [ ] Database column is on `users` table (not auth-provider-specific)
- [ ] Flag survives auth method changes

**Non-Functional Requirements**:
- [ ] Consistent UX across all auth methods

---

## Cross-Cutting Concerns

### Security Requirements (All Stories)

- [ ] All authentication flows use HTTPS
- [ ] OAuth tokens stored securely (never in localStorage)
- [ ] CSRF protection on all forms
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] RLS policies enforce data access control
- [ ] No sensitive data in client-side code
- [ ] Input validation on all user-provided data
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize all outputs)

### Performance Requirements (All Stories)

- [ ] Page load time under 2 seconds (LCP)
- [ ] OAuth flows complete under 6 seconds (95th percentile)
- [ ] Database queries under 100ms (95th percentile)
- [ ] Stripe checkout session creation under 2 seconds
- [ ] Webhook processing under 5 seconds
- [ ] No unnecessary re-renders in React components
- [ ] Lazy load components where appropriate
- [ ] Optimize images and assets

### Accessibility Requirements (All Stories)

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader friendly
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed

### Testing Requirements (All Stories)

- [ ] Unit tests for helper functions
- [ ] Integration tests for auth flows
- [ ] End-to-end tests for critical user journeys
- [ ] Stripe webhook testing (use Stripe CLI)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Error state testing
- [ ] Edge case testing

---

## Definition of Done

A user story is considered DONE when:

- [ ] All acceptance criteria met
- [ ] All edge cases handled
- [ ] Security considerations addressed
- [ ] Code reviewed by peer
- [ ] Tests written and passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Staging testing successful
- [ ] Deployed to production
- [ ] Production smoke tests pass
- [ ] Monitoring confirms no errors

---

## Implementation Priority Order

### Phase 1: Core Authentication (Must Have)
1. Story 1.1: Google OAuth Signup
2. Story 1.2: GitHub OAuth Signup
3. Story 1.3: OAuth Login
4. Story 2.1: Magic Link Signup
5. Story 2.2: Magic Link Login
6. Story 7.1: First Login Detection

### Phase 2: Context & Routing (Must Have)
7. Story 3.1: Landing Page URL Context
8. Story 3.2: Direct Signup Flow
9. Story 3.3: Context Preservation Through OAuth
10. Story 7.2: Upsell on Second Login

### Phase 3: Monetization (Must Have)
11. Story 4.1: Coffee Upsell Page
12. Story 5.1: Stripe Checkout Integration
13. Story 5.2: Graceful Payment Failure

### Phase 4: Future Tiers (Should Have)
14. Story 4.2: Growth Upsell Page
15. Story 6.1: Growth Waitlist
16. Story 4.3: Scale Upsell Page
17. Story 6.2: Scale Waitlist

### Phase 5: Premium Features (Nice to Have)
18. Story 4.4: Scale Welcome Page
19. Story 5.3: Subscription Cancellation
20. Story 7.3: First Login Flag Persistence
21. Story 6.3: Waitlist Notification System

---

## Risk Assessment

### High Risk (Requires Extra Attention)

1. **OAuth Redirect URI Configuration**
   - Risk: Misconfigured URIs break entire OAuth flow
   - Mitigation: Test locally first, verify both localhost and production URIs

2. **Stripe Webhook Reliability**
   - Risk: Missed webhooks result in incorrect user tier
   - Mitigation: Implement webhook retry logic, daily sync job with Stripe API

3. **Context Loss During OAuth**
   - Risk: Users lose landing page URL context during OAuth redirects
   - Mitigation: Thoroughly test localStorage persistence across redirects

4. **First Login Flag Accuracy**
   - Risk: Flag not updated correctly results in wrong routing
   - Mitigation: Add database constraints, logging, and fallback logic

### Medium Risk

5. **Magic Link Email Delivery**
   - Risk: SMTP issues prevent users from logging in
   - Mitigation: Monitor email delivery rates, have OAuth as primary method

6. **Payment Failure Handling**
   - Risk: Poor UX when payment fails could lose customers
   - Mitigation: Clear messaging, easy retry, graceful degradation

### Low Risk

7. **Waitlist Capture**
   - Risk: Database insert fails, user not added to waitlist
   - Mitigation: Show error message, provide support email fallback

---

## Success Metrics

### User Acquisition Metrics
- OAuth signup conversion rate > 60%
- Magic Link signup conversion rate > 40%
- Average time to signup < 30 seconds

### Monetization Metrics
- Coffee plan upgrade rate > 15% (of free tier users)
- Payment success rate > 95%
- Payment retry rate > 30% (of failed payments)

### User Experience Metrics
- Context preservation success rate > 95%
- First login routing accuracy > 99%
- Upsell dismissal rate < 70% (engagement)

### Technical Metrics
- OAuth flow success rate > 98%
- Webhook processing success rate > 99%
- Page load time < 2 seconds
- Zero critical security vulnerabilities

---

**END OF USER STORIES**

*Ready for handoff to @architect for technical design and @developer for implementation.*
