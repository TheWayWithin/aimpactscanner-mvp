# Authentication & Monetization - Execution Plan

**Project**: AImpactScanner MVP - Auth System Redesign
**Coordinator Mission Type**: BUILD
**Estimated Duration**: 8-12 hours (autonomous execution)
**Priority**: CRITICAL

---

## Mission Briefing for Coordinator

**Objective**: Replace password-based authentication with OAuth-first + magic link system, implement tier-based upsell pages, integrate Stripe payments with graceful degradation, and preserve user journey context through signup.

**Key Deliverables**:
1. ✅ Google + GitHub OAuth authentication
2. ✅ Passwordless magic link authentication
3. ✅ 4 tier-based upsell pages (Free→Coffee, Coffee→Growth, Growth→Scale, Scale Welcome)
4. ✅ Context-aware post-signup routing (preserve landing page URL)
5. ✅ Stripe checkout integration with graceful payment failure handling
6. ✅ Waitlist capture for unreleased tiers (Growth, Scale)
7. ✅ Database migrations for new schema
8. ✅ Complete test coverage

**Critical Constraints**:
- ⚠️ **DO NOT modify tier benefit messaging** (conversion-optimized by user)
- ⚠️ **DO NOT change Doug Hall framework messaging** (ZERO RISK section, etc.)
- ⚠️ **MUST preserve localStorage context** through signup redirects
- ⚠️ **MUST implement graceful degradation** for Stripe payment failures
- ⚠️ **MUST skip upsell on first login** (only show for returning users)

---

## Specialist Delegation Plan

### Phase 1: Strategic Planning (STRATEGIST)
**Duration**: 30 minutes

**Delegation**:
```
Task(
  subagent_type='strategist',
  description='Create user stories and acceptance criteria',
  prompt='First read AUTH_MONETIZATION_SPEC.md for complete context.

  Create detailed user stories with acceptance criteria for:
  1. OAuth authentication (Google + GitHub)
  2. Magic link authentication
  3. Context-aware post-signup routing
  4. Tier-based upsell pages
  5. Stripe payment integration
  6. Waitlist capture

  Output format:
  - User story for each feature
  - Acceptance criteria (Given/When/Then)
  - Edge cases to handle
  - Dependencies between stories

  Update handoff-notes.md with user stories for developer.'
)
```

**Success Criteria**:
- [ ] User stories cover all authentication methods
- [ ] Edge cases documented (payment failure, OAuth errors, etc.)
- [ ] Dependencies identified (OAuth setup before testing, etc.)

---

### Phase 2: Technical Architecture (ARCHITECT)
**Duration**: 1 hour

**Delegation**:
```
Task(
  subagent_type='architect',
  description='Design system architecture',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Design technical architecture for:
  1. Component hierarchy (AuthMethodSelector, UpsellPages, etc.)
  2. State management (user metadata, localStorage context)
  3. Routing logic (post-signup, post-login, upsell)
  4. API integration (Supabase OAuth, Stripe Checkout)
  5. Database schema updates

  Provide:
  - Component tree diagram
  - Data flow diagrams (signup, login, payment)
  - API endpoint specifications
  - Database migration SQL
  - Error handling strategy

  Critical: Follow Security-First principles - OAuth must be secure, Stripe webhook signature verification required.

  Update handoff-notes.md with architecture diagrams and implementation guidance.'
)
```

**Success Criteria**:
- [ ] Component hierarchy clear and logical
- [ ] Data flow diagrams show all user journeys
- [ ] Database migrations ready to execute
- [ ] Security considerations documented

---

### Phase 3: OAuth Configuration (OPERATOR)
**Duration**: 1 hour

**Delegation**:
```
Task(
  subagent_type='operator',
  description='Configure OAuth providers',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Set up OAuth authentication:

  1. **Google OAuth**:
     - Configure in Supabase Dashboard (Authentication → Providers)
     - Document Client ID and Secret setup
     - Set redirect URIs (production + localhost)
     - Test OAuth flow

  2. **GitHub OAuth**:
     - Configure in Supabase Dashboard
     - Document Client ID and Secret setup
     - Set redirect URIs
     - Test OAuth flow

  3. **Magic Link SMTP**:
     - Verify Resend SMTP configuration
     - Test email delivery
     - Check sender domain verification
     - Troubleshoot if emails not sending

  Provide step-by-step setup guide for:
  - Google Cloud Console OAuth setup
  - GitHub OAuth App setup
  - Supabase provider configuration
  - Testing OAuth locally and in production

  Update handoff-notes.md with OAuth configuration status and any credentials needed.'
)
```

**Success Criteria**:
- [ ] Google OAuth configured and tested
- [ ] GitHub OAuth configured and tested
- [ ] Magic link emails delivering
- [ ] Redirect URIs correct for production and local

---

### Phase 4: Database Migrations (DEVELOPER)
**Duration**: 30 minutes

**Delegation**:
```
Task(
  subagent_type='developer',
  description='Create database migrations',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create migration file: /supabase/migrations/021_auth_monetization_schema.sql

  Add to users table:
  - auth_provider (google/github/email)
  - selected_tier (originally selected tier)
  - subscription_status (active/pending_payment/canceled)
  - stripe_customer_id
  - stripe_subscription_id
  - is_first_login (boolean, default true)
  - signup_source (landing_url_entry/direct_signup/oauth)
  - growth_waitlist (boolean)
  - scale_waitlist (boolean)
  - waitlist_joined_at (timestamp)
  - last_upsell_shown (timestamp)
  - upsell_dismissed_count (integer)

  Create waitlist table:
  - id (uuid primary key)
  - user_id (references auth.users)
  - email
  - current_tier
  - interested_tier
  - joined_at
  - notified (boolean)
  - notified_at (timestamp)
  - RLS policies (users can view/insert own entries)

  Test migration locally, verify no errors.

  Update handoff-notes.md with migration status and schema documentation.'
)
```

**Success Criteria**:
- [ ] Migration file created and syntactically valid
- [ ] All columns added to users table
- [ ] Waitlist table created with RLS
- [ ] Migration tested locally without errors

---

### Phase 5: Authentication Components (DEVELOPER)
**Duration**: 3 hours

**Delegation**:
```
Task(
  subagent_type='developer',
  description='Build authentication components',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create/modify components:

  1. **/src/components/AuthMethodSelector.jsx** (NEW):
     - Google OAuth button (primary, large, blue)
     - GitHub OAuth button (secondary, medium, dark)
     - Magic Link button (subtle, small, gray)
     - Visual hierarchy per spec
     - Handle OAuth callbacks
     - Handle magic link email sending
     - Loading states
     - Error handling

  2. **/src/components/UnifiedRegistration.jsx** (MODIFY):
     - REMOVE all password fields
     - REMOVE password validation
     - REMOVE supabase.auth.signUp() with password
     - ADD AuthMethodSelector component
     - ADD tier selection dropdown (Free/Coffee/Growth/Scale)
     - ADD localStorage.setItem("pendingAnalysisUrl") on mount if URL in query
     - Keep existing tier benefit messaging EXACTLY as is

  3. **/src/components/Auth.jsx** (MODIFY):
     - REMOVE password-based login
     - ADD AuthMethodSelector for login
     - Handle OAuth callbacks
     - Redirect to post-login destination

  4. **/src/lib/authHelpers.js** (NEW):
     - getPostSignupDestination(user, context)
     - getPostLoginDestination(user)
     - getUpsellPage(user)
     - storeAnalysisContext(url, id)
     - getAnalysisContext()
     - clearAnalysisContext()

  5. **/src/hooks/useAuthRedirect.js** (NEW):
     - Hook for post-login routing
     - Checks isFirstLogin flag
     - Routes to upsell or destination

  Implementation notes:
  - Use Supabase OAuth: supabase.auth.signInWithOAuth({ provider: "google" })
  - Use Magic Link: supabase.auth.signInWithOtp({ email })
  - Store tier selection in user metadata during signup
  - Preserve localStorage context through OAuth redirects

  Test all auth methods work correctly.

  Update handoff-notes.md with implementation status and testing results.'
)
```

**Success Criteria**:
- [ ] AuthMethodSelector displays correctly with visual hierarchy
- [ ] Google OAuth flow works (signup + login)
- [ ] GitHub OAuth flow works (signup + login)
- [ ] Magic link emails send and auth works
- [ ] Password fields completely removed
- [ ] Tier selection works
- [ ] localStorage context preserved

---

### Phase 6: Upsell Pages (DESIGNER + DEVELOPER)
**Duration**: 3 hours

**Delegation 6A: Design**:
```
Task(
  subagent_type='designer',
  description='Design upsell page UI/UX',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create UI specifications for 4 upsell pages:

  1. UpsellCoffee (Free → Coffee)
  2. UpsellGrowth (Coffee → Growth)
  3. UpsellScale (Growth → Scale)
  4. WelcomeScale (Scale welcome)

  Use EXACT messaging from AUTH_MONETIZATION_SPEC.md:
  - Tier benefits (Coffee/Growth/Scale)
  - ZERO RISK section (verbatim)
  - Credibility signals (verbatim)
  - Security & privacy (verbatim)

  Layout structure:
  - Hero section with tier name and emoji
  - Benefits section (✅ checkmarks, green)
  - Current tier limitations (❌ X marks, red/gray, strikethrough)
  - ZERO RISK section (shields, money bags, emojis)
  - Clear CTA buttons (Upgrade Now / Join Waitlist / Maybe Later)
  - Credibility footer

  Design should be:
  - Conversion-focused
  - Clear visual hierarchy
  - Mobile responsive
  - Consistent with existing brand
  - Emphasize value proposition

  Provide component structure and Tailwind CSS classes.

  Update handoff-notes.md with design specifications.'
)
```

**Delegation 6B: Implementation**:
```
Task(
  subagent_type='developer',
  description='Implement upsell pages',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md (including design specs).

  Create components:

  1. **/src/pages/UpsellCoffee.jsx**:
     - Show Coffee plan benefits vs Free limitations
     - "Upgrade to Coffee" button → createCheckoutSession("coffee")
     - "Maybe Later" button → navigate to dashboard
     - Use EXACT messaging from spec

  2. **/src/pages/UpsellGrowth.jsx**:
     - Show Growth plan benefits vs Coffee limitations
     - "Join Waitlist" button → capture waitlist signup
     - "Stay on Coffee" button → navigate to dashboard
     - Show "Coming Soon" badge

  3. **/src/pages/UpsellScale.jsx**:
     - Show Scale plan benefits vs Growth limitations
     - "Join Waitlist" button → capture waitlist signup
     - "Stay on Growth" button → navigate to dashboard
     - Show "Coming Soon" badge

  4. **/src/pages/WelcomeScale.jsx**:
     - Thank you message for Scale users
     - Enterprise contact info
     - "Continue to Dashboard" button

  5. Add routes to **/src/App.jsx**:
     - /upsell/coffee
     - /upsell/growth
     - /upsell/scale
     - /welcome/scale

  6. Implement waitlist capture:
     - Insert into waitlist table
     - Show confirmation message
     - Update user metadata (growth_waitlist or scale_waitlist = true)

  Critical: DO NOT modify tier benefit messaging. Use exact wording from spec.

  Update handoff-notes.md with implementation status.'
)
```

**Success Criteria**:
- [ ] All 4 pages render correctly
- [ ] Messaging matches spec exactly
- [ ] Navigation works (upgrade, maybe later, join waitlist)
- [ ] Waitlist capture saves to database
- [ ] Mobile responsive
- [ ] Consistent styling

---

### Phase 7: Stripe Integration (DEVELOPER + OPERATOR)
**Duration**: 2 hours

**Delegation 7A: Checkout Session**:
```
Task(
  subagent_type='developer',
  description='Implement Stripe checkout',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create Stripe checkout integration:

  1. **/src/lib/stripeHelpers.js** (or API route):
     - createCheckoutSession(userId, tier, email)
     - Redirect to Stripe checkout
     - Store metadata: userId, tier, pendingAnalysisUrl
     - Success URL: /auth/payment-success
     - Cancel URL: /auth/payment-cancelled

  2. **/src/pages/PaymentSuccess.jsx**:
     - Show "Processing payment..." spinner
     - Wait for webhook to update tier
     - Poll user tier status
     - Redirect to analysis page (with context if exists)

  3. **/src/pages/PaymentCancelled.jsx**:
     - Show "Payment cancelled" message
     - User stays on Free tier
     - "Try again" button → retry checkout
     - "Continue as Free" → dashboard

  4. Update useUserInitializer.js:
     - Handle pending_payment state
     - Show appropriate UI while waiting for payment

  Use Stripe Elements or Checkout:
  - Stripe Checkout (easier, recommended)
  - Collect payment via Stripe hosted page
  - Handle success/cancel redirects

  Update handoff-notes.md with implementation status.'
)
```

**Delegation 7B: Webhook Handler**:
```
Task(
  subagent_type='operator',
  description='Set up Stripe webhooks',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create webhook handler (Supabase Edge Function or API route):

  1. **Endpoint**: /api/stripe-webhook

  2. **Handle events**:
     - checkout.session.completed (payment success)
     - customer.subscription.deleted (cancellation)
     - customer.subscription.updated (tier change)

  3. **Payment success handler**:
     ```javascript
     async function handlePaymentSuccess(session) {
       const userId = session.metadata.user_id;
       const tier = session.metadata.tier;

       await supabase
         .from("users")
         .update({
           tier: tier,
           subscription_status: "active",
           stripe_customer_id: session.customer,
           stripe_subscription_id: session.subscription
         })
         .eq("id", userId);
     }
     ```

  4. **Verify webhook signature** (security requirement)

  5. **Test with Stripe CLI**:
     - stripe listen --forward-to localhost:54321/api/stripe-webhook
     - Trigger test events
     - Verify database updates

  6. **Configure production webhook**:
     - Add webhook endpoint in Stripe Dashboard
     - Set webhook secret in environment variables

  Update handoff-notes.md with webhook status and testing results.'
)
```

**Success Criteria**:
- [ ] Stripe checkout opens correctly
- [ ] Payment success updates user tier
- [ ] Payment cancellation handled gracefully
- [ ] Webhook signature verified
- [ ] Tested with Stripe CLI
- [ ] Production webhook configured

---

### Phase 8: Routing Logic (DEVELOPER)
**Duration**: 1.5 hours

**Delegation**:
```
Task(
  subagent_type='developer',
  description='Implement routing logic',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Implement routing in /src/App.jsx and auth helpers:

  1. **Post-Signup Routing**:
     - Check if pendingAnalysisUrl exists in localStorage
     - If yes → /analyze with URL pre-populated
     - If no → /analyze without URL
     - Set isFirstLogin = false after routing

  2. **Post-Login Routing** (returning users):
     - If isFirstLogin = true → skip upsell, go to analysis
     - If isFirstLogin = false → show tier-appropriate upsell
     - After upsell interaction → dashboard

  3. **Upsell Routing Logic**:
     - Free tier → /upsell/coffee
     - Coffee tier → /upsell/growth
     - Growth tier → /upsell/scale
     - Scale tier → /welcome/scale

  4. **Update useUserInitializer.js**:
     - Set isFirstLogin flag correctly
     - Handle OAuth user metadata
     - Store auth_provider (google/github/email)

  5. **Test all flows**:
     - Landing page → URL entry → signup → analysis (with URL)
     - Direct signup → analysis (no URL)
     - Login (first time) → analysis
     - Login (returning) → upsell → dashboard

  Critical: First login must skip upsell (user just signed up!).

  Update handoff-notes.md with routing implementation and test results.'
)
```

**Success Criteria**:
- [ ] Landing page URL context preserved
- [ ] Direct signup goes to analysis page
- [ ] First login skips upsell
- [ ] Returning users see upsell
- [ ] Tier-appropriate upsell shown
- [ ] All navigation flows tested

---

### Phase 9: Quality Assurance (TESTER)
**Duration**: 2 hours

**Delegation**:
```
Task(
  subagent_type='tester',
  description='Comprehensive testing',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Run complete testing checklist from spec:

  **Authentication Tests**:
  - [ ] Google OAuth signup creates account
  - [ ] GitHub OAuth signup creates account
  - [ ] Magic link sends email and auth works
  - [ ] Google login redirects correctly
  - [ ] GitHub login redirects correctly
  - [ ] Magic link login works

  **Journey Tests**:
  - [ ] Landing URL entry → signup → analysis (URL pre-populated)
  - [ ] Direct signup → analysis (no URL)
  - [ ] First login → skip upsell → analysis
  - [ ] Returning login → show upsell → dashboard

  **Stripe Tests**:
  - [ ] Coffee tier → Stripe checkout opens
  - [ ] Payment success → tier upgraded
  - [ ] Payment failure → stays free, shows retry
  - [ ] Webhook updates database

  **Upsell Tests**:
  - [ ] Free user → Coffee upsell → upgrade/maybe later
  - [ ] Coffee user → Growth upsell → waitlist
  - [ ] Growth user → Scale upsell → waitlist
  - [ ] Scale user → welcome page

  **Edge Cases**:
  - [ ] OAuth callback errors handled
  - [ ] Magic link expired handled
  - [ ] Stripe timeout handled
  - [ ] Database connection failures handled
  - [ ] localStorage cleared after use

  Document all bugs found in handoff-notes.md with steps to reproduce.

  Create bug report for any critical issues.

  Update handoff-notes.md with testing results.'
)
```

**Success Criteria**:
- [ ] All authentication methods work
- [ ] All user journeys tested
- [ ] All edge cases handled
- [ ] No critical bugs found
- [ ] Bug reports filed for any issues

---

### Phase 10: Documentation (DOCUMENTER)
**Duration**: 1 hour

**Delegation**:
```
Task(
  subagent_type='documenter',
  description='Create user documentation',
  prompt='First read AUTH_MONETIZATION_SPEC.md and handoff-notes.md.

  Create documentation:

  1. **User Guide** (/docs/auth-guide.md):
     - How to sign up (Google/GitHub/Email)
     - How to log in
     - How to upgrade tiers
     - How to cancel subscription
     - Troubleshooting (email not received, OAuth errors, etc.)

  2. **Admin Guide** (/docs/admin-auth-guide.md):
     - OAuth setup instructions
     - Stripe configuration
     - Webhook testing
     - Database schema reference
     - Monitoring and analytics

  3. **Developer Guide** (/docs/dev-auth-guide.md):
     - Architecture overview
     - Component documentation
     - API endpoints
     - Testing procedures
     - Deployment checklist

  4. **Update README.md**:
     - Add authentication section
     - Document OAuth providers
     - Environment variables required

  Update handoff-notes.md with documentation locations.'
)
```

**Success Criteria**:
- [ ] User guide complete and clear
- [ ] Admin guide has setup instructions
- [ ] Developer guide documents architecture
- [ ] README updated with auth info

---

## Execution Sequence

**Sequential Phases** (must complete in order):
1. ✅ Strategic Planning (STRATEGIST)
2. ✅ Technical Architecture (ARCHITECT)
3. ✅ OAuth Configuration (OPERATOR)
4. ✅ Database Migrations (DEVELOPER)

**Parallel Phases** (can run concurrently):
5. ✅ Authentication Components (DEVELOPER)
6. ✅ Upsell Pages (DESIGNER + DEVELOPER)

**Sequential Phases** (require Phase 5-6 complete):
7. ✅ Stripe Integration (DEVELOPER + OPERATOR)
8. ✅ Routing Logic (DEVELOPER)

**Final Phases** (sequential):
9. ✅ Quality Assurance (TESTER)
10. ✅ Documentation (DOCUMENTER)

---

## Success Metrics

**Authentication**:
- [ ] 100% of OAuth flows working (Google + GitHub)
- [ ] Magic link email delivery rate > 95%
- [ ] Zero password-related code remaining

**Monetization**:
- [ ] Stripe checkout completion rate tracked
- [ ] Payment success rate > 95%
- [ ] Graceful degradation tested (0 blocked users on payment failure)

**User Experience**:
- [ ] Context preservation rate 100% (landing page URL → analysis)
- [ ] First login skip rate 100% (no upsell shown)
- [ ] Returning user upsell display rate 100%

**Code Quality**:
- [ ] Zero console errors in production
- [ ] All components typed (TypeScript if applicable)
- [ ] Test coverage > 80%
- [ ] No security vulnerabilities (OAuth, Stripe, webhooks)

---

## Rollback Plan

**If critical issues found**:

1. **Authentication broken** → Revert to password auth temporarily
2. **Stripe broken** → Disable tier upgrades, manual processing
3. **Routing broken** → Default all to dashboard
4. **Database issues** → Rollback migration

**Rollback Command**:
```bash
git revert HEAD~10..HEAD  # Revert last 10 commits
git push origin main --force
```

**Feature Flag** (optional):
```javascript
const ENABLE_OAUTH = process.env.VITE_ENABLE_OAUTH === "true";
if (ENABLE_OAUTH) {
  return <AuthMethodSelector />;
} else {
  return <PasswordLogin />;  // Fallback
}
```

---

## Post-Implementation

**Monitoring** (first 24 hours):
- Auth success/failure rates
- Stripe payment success/failure rates
- Error logs (authentication, routing, payments)
- User feedback

**Analytics to Track**:
- Authentication method distribution (Google/GitHub/Magic Link)
- Tier selection during signup (Free vs Coffee)
- Upsell conversion rates (Free→Coffee, Coffee→Growth)
- Waitlist signup rates (Growth, Scale)
- Payment failure reasons

**Follow-up Tasks**:
- A/B test upsell messaging variations
- Implement upsell frequency capping
- Launch Growth tier from waitlist
- Add more OAuth providers (Apple, Microsoft)
- Implement "Remember this device"

---

## Critical Reminders for Coordinator

**DO NOT**:
- ❌ Modify tier benefit messaging (user-approved, conversion-optimized)
- ❌ Skip OAuth provider setup (required before testing)
- ❌ Forget to verify webhook signatures (security risk)
- ❌ Show upsell on first login (user just signed up!)
- ❌ Block users on payment failure (graceful degradation)

**MUST DO**:
- ✅ Use Task tool for ALL delegations (no @ symbols)
- ✅ Update project-plan.md before each phase
- ✅ Update progress.md when issues occur
- ✅ Verify each specialist updates handoff-notes.md
- ✅ Test OAuth on production URLs before declaring success
- ✅ Run full testing checklist before merge

**REFERENCE DOCUMENTS**:
- AUTH_MONETIZATION_SPEC.md (complete specification)
- User-provided screenshots (messaging reference)
- Existing codebase (/src/components/UnifiedRegistration.jsx)

---

**END OF EXECUTION PLAN**

*Ready for autonomous coordinator execution with specialist delegation.*
