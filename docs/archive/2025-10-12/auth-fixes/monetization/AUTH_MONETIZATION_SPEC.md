# Authentication & Monetization System Specification

**Project**: AImpactScanner MVP
**Mission**: Complete redesign of authentication and tier monetization system
**Priority**: HIGH - Critical for user acquisition and revenue
**Estimated Effort**: 8-12 hours implementation + 2 hours testing

---

## Executive Summary

Replace current password-based authentication with frictionless OAuth-first + magic link system. Implement strategic upsell flow for free tier users and complete Stripe payment integration with graceful degradation. Build all 4 tier pages (Free, Coffee, Growth, Scale) even though Growth/Scale are "Coming Soon".

**Business Objectives**:
1. ✅ Minimize signup friction (maximize conversions)
2. ✅ Capture valid email addresses (OAuth/Magic Link verification)
3. ✅ Strategic upsell to Coffee plan ($4.95/month)
4. ✅ Seamless Stripe payment integration
5. ✅ Future-proof tier system (Growth/Scale ready)

**Technical Objectives**:
1. ✅ Remove password-based authentication entirely
2. ✅ Implement Google + GitHub OAuth
3. ✅ Implement passwordless magic link (fix SMTP)
4. ✅ Context-aware post-signup routing
5. ✅ Tier-specific upsell pages with waitlist

---

## Design Decisions (User Approved)

### 1. Authentication Methods (Priority Order)

**PRIMARY**:
- 🔵 **Google OAuth** (most prominent button)
- ⚫ **GitHub OAuth** (secondary button)

**FALLBACK**:
- ✉️ **Magic Link** (passwordless email)

**REMOVED**:
- ❌ Email/Password authentication (too much friction)

**VERIFICATION**:
- ✅ No additional verification needed
- OAuth providers verify email
- Magic link click proves email receipt
- Stripe payment verifies email

---

### 2. User Journeys

#### Journey A: Landing Page → URL Entry → Signup
```
1. User enters URL on landing page
2. Clicks "Analyze" button
3. Store URL in localStorage: `pendingAnalysisUrl`
4. Redirect to signup page
5. User selects tier (Free/Coffee)
6. User selects auth method (Google/GitHub/Magic Link)
7. Complete authentication
8. If Coffee tier → Stripe checkout
9. After payment/signup → Analysis page with URL PRE-POPULATED
```

#### Journey B: Direct Signup (No URL Context)
```
1. User clicks "Sign Up" from navbar/CTA
2. No URL stored in context
3. User selects tier (Free/Coffee)
4. User selects auth method
5. Complete authentication
6. If Coffee tier → Stripe checkout
7. After payment/signup → Analysis page WITHOUT pre-populated URL
```

#### Journey C: Returning User Login
```
1. User clicks "Login"
2. Authenticate via OAuth/Magic Link
3. Check tier:
   - Free tier → Upsell page (unless first login)
   - Coffee tier → Upsell to Growth (unless first login)
   - Growth tier → Upsell to Scale (unless first login)
   - Scale tier → Welcome page
4. After upsell interaction → Dashboard
```

---

### 3. Stripe Payment Flow (Coffee Plan)

**Trigger**: User selects Coffee plan during signup

**Flow**:
```
1. User completes OAuth/Magic Link authentication
2. Account created with:
   - tier: 'free'
   - selected_tier: 'coffee'
   - subscription_status: 'pending_payment'
3. IMMEDIATELY redirect to Stripe Checkout
4. Store journey context in session

PAYMENT SUCCESS ✅:
5a. Stripe webhook updates:
    - tier: 'coffee'
    - subscription_status: 'active'
6a. Redirect to Analysis page
7a. If pendingAnalysisUrl exists → pre-populate URL
8a. If not → empty analysis page

PAYMENT FAILED ❌:
5b. Account stays tier: 'free'
6b. Redirect to Dashboard
7b. Show banner: "Complete your Coffee plan upgrade" + retry button
```

**Graceful Degradation Philosophy**:
- Email captured even if payment fails
- User has working free account
- Can retry payment anytime
- No blocking or locked accounts

---

### 4. Upsell Pages (All Tiers)

**Trigger**: Every login for non-Scale tier users (EXCEPT first login after signup)

**Logic**:
```javascript
function getUpsellPage(user) {
  // Skip upsell on first login
  if (user.isFirstLogin) return getPostSignupDestination(user);

  // Tier-based upsell routing
  if (user.tier === 'free') return '/upsell/coffee';
  if (user.tier === 'coffee') return '/upsell/growth';
  if (user.tier === 'growth') return '/upsell/scale';
  if (user.tier === 'scale') return '/welcome/scale';

  // Fallback
  return '/dashboard';
}
```

**Upsell Pages Required**:
1. `/upsell/coffee` - Free → Coffee ($4.95/month)
2. `/upsell/growth` - Coffee → Growth ($29/month, Coming Soon + Waitlist)
3. `/upsell/scale` - Growth → Scale ($99/month, Coming Soon + Waitlist)
4. `/welcome/scale` - Scale tier thank you page

---

## Messaging Requirements (CRITICAL - DO NOT CHANGE)

**Framework**: Doug Hall's Marketing Physics
- **Overt Benefits**: Clear, tangible value propositions
- **Dramatic Difference**: vs competitors and lower tiers
- **Real Reasons to Believe**: Proof, guarantees, risk removal

### Coffee Plan Benefits (Exact Wording)
```
☕ COFFEE Plan Benefits

✅ Unlimited AI-powered analyses per month
✅ 10 MASTERY-AI Framework factors (Phase A)
✅ Professional PDF reports (no watermarks)
✅ Clean, exportable results dashboard
✅ Educational content & recommendations
✅ Email support
✅ 30-day money-back guarantee
```

### Free Plan Limitations (Exact Wording)
```
🆓 FREE Plan Limitations

⚠️ Only 3 analyses per month
❌ Basic recommendations only
❌ Phase A factors only
❌ Web-only results (no PDF export)
❌ Community support only
❌ No advanced AI insights
```

### Growth Plan Benefits (Exact Wording)
```
🚀 GROWTH Plan Benefits

✅ Everything in Coffee Plan
✅ 22 total factors (Phase A + Phase B)
✅ Advanced PDF reports with deeper insights
✅ AI Remediation Planner
✅ Progress tracking dashboard
✅ Priority support
🔧 Coming soon!
```

### Scale Plan Benefits (Exact Wording)
```
🏢 SCALE Plan Benefits

✅ Everything in Growth Plan
✅ API access for automation
✅ White-label PDF reports
✅ Team collaboration features
✅ Custom reporting
✅ Webhook integrations
✅ Dedicated support
🔧 Coming soon!
```

### ZERO RISK Section (Use on ALL Upsell Pages)
```
🛡️ ZERO RISK - We Remove ALL Your Fears

💰 30-Day Money Back Guarantee
Don't like the results? Get every penny back. No questions asked. No hoops to jump through.

⚡ Cancel Instantly Anytime
One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.

🏆 Results in 24 Hours or Refund
See dramatic improvements within 24 hours or get a full refund immediately.

🚀 Outperform Competitors or Refund
We find 3x more pages than competitors or you get your money back. Guaranteed.
```

### Credibility Signals (Use on ALL Pages)
```
✅ Built by Expert Solopreneur
✅ Not VC-Funded BS
✅ Real Results for Real Businesses
```

### Security & Privacy (Use on ALL Pages)
```
🔒 Secure & Private
Your data is encrypted and never shared. We only analyze public content and generate files you control.
```

---

## Technical Implementation Requirements

### Files to CREATE

1. **`/src/pages/UpsellCoffee.jsx`**
   - Free → Coffee upsell page
   - Uses exact messaging from spec
   - "Upgrade Now" → Stripe checkout
   - "Maybe Later" → Dashboard

2. **`/src/pages/UpsellGrowth.jsx`**
   - Coffee → Growth upsell page
   - Uses exact messaging from spec
   - "Join Waitlist" → Capture interest + email notification
   - "Stay on Coffee" → Dashboard

3. **`/src/pages/UpsellScale.jsx`**
   - Growth → Scale upsell page
   - Uses exact messaging from spec
   - "Join Waitlist" → Capture interest
   - "Stay on Growth" → Dashboard

4. **`/src/pages/WelcomeScale.jsx`**
   - Scale tier welcome/thank you page
   - Enterprise support contact info
   - "Continue to Dashboard" button

5. **`/src/components/AuthMethodSelector.jsx`**
   - Google OAuth button (primary)
   - GitHub OAuth button (secondary)
   - Magic Link button (fallback)
   - Visual hierarchy per spec

6. **`/src/lib/authHelpers.js`**
   - `getPostSignupDestination(user, context)` - Context-aware routing
   - `getUpsellPage(user)` - Tier-based upsell routing
   - `storeAnalysisContext(url, id)` - localStorage helper
   - `getAnalysisContext()` - Retrieve stored context

7. **`/src/hooks/useAuthRedirect.js`**
   - Hook for post-login routing logic
   - Handles first login vs returning user
   - Manages tier-based upsell display

8. **`/supabase/migrations/021_waitlist_table.sql`**
   - Create waitlist table for Growth/Scale interest
   - Schema: user_id, current_tier, interested_tier, joined_at, notified

### Files to MODIFY

1. **`/src/components/UnifiedRegistration.jsx`**
   - **REMOVE**: All password fields
   - **REMOVE**: Password validation logic
   - **REMOVE**: `supabase.auth.signUp()` with password
   - **REPLACE WITH**: AuthMethodSelector component
   - **ADD**: Tier selection UI (Free/Coffee/Growth/Scale dropdowns)
   - **ADD**: Journey context capture (pendingAnalysisUrl)

2. **`/src/components/Auth.jsx`** or **`/src/components/AuthWithPassword.jsx`**
   - **REMOVE**: Password-based login
   - **REPLACE WITH**: AuthMethodSelector component
   - **ADD**: OAuth callback handling

3. **`/src/App.jsx`**
   - **ADD**: Routes for upsell pages
   - **ADD**: Routes for welcome pages
   - **ADD**: Auth redirect logic on mount

4. **`/src/hooks/useUserInitializer.js`**
   - **UPDATE**: Handle OAuth user metadata
   - **ADD**: Store `isFirstLogin` flag
   - **FIX**: 406/401 error handling (already partially done)

5. **`/supabase/config.toml`**
   - **VERIFY**: `enable_confirmations = false` (already done)
   - **ADD**: OAuth provider configurations (Google, GitHub)

### Files to DELETE

1. **Password-related utilities** (if any standalone files exist)
2. **Old email confirmation flows** (if separate components)

---

## OAuth Configuration Requirements

### Google OAuth Setup

**Supabase Dashboard**:
1. Navigate to Authentication → Providers
2. Enable Google provider
3. Configure OAuth credentials:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
   - Authorized redirect URI: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`

**Google Cloud Console**:
1. Create OAuth 2.0 Client ID
2. Authorized redirect URIs:
   - `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (for local dev)
3. Scopes: email, profile

### GitHub OAuth Setup

**Supabase Dashboard**:
1. Navigate to Authentication → Providers
2. Enable GitHub provider
3. Configure OAuth credentials:
   - Client ID: (from GitHub OAuth App)
   - Client Secret: (from GitHub OAuth App)

**GitHub**:
1. Settings → Developer settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
3. Also add: `http://localhost:54321/auth/v1/callback` (for local dev)

---

## Magic Link (SMTP) Configuration

**Current Status**: SMTP configured in Supabase dashboard but emails not sending

**Fix Required**:
1. Verify Resend API key is active
2. Test SMTP connection from Supabase
3. Check email templates are configured
4. Verify sender domain (support@aimpactscanner.com) is verified in Resend
5. Test magic link delivery end-to-end

**Implementation**:
```javascript
// Magic link signup
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      tier: selectedTier,
      pendingAnalysisUrl: localStorage.getItem('pendingAnalysisUrl')
    }
  }
});
```

---

## Stripe Integration Requirements

### Checkout Session Creation

```javascript
// Create Stripe checkout session
async function createCheckoutSession(user, tier) {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      tier: tier, // 'coffee', 'growth', or 'scale'
      successUrl: `${window.location.origin}/auth/payment-success`,
      cancelUrl: `${window.location.origin}/auth/payment-cancelled`
    })
  });

  const { sessionId } = await response.json();

  // Redirect to Stripe
  const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
  await stripe.redirectToCheckout({ sessionId });
}
```

### Webhook Handler (Edge Function or API Route)

**Required Webhook Events**:
- `checkout.session.completed` - Payment successful
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.updated` - Subscription changed

**Payment Success Handler**:
```javascript
// Stripe webhook: checkout.session.completed
async function handlePaymentSuccess(session) {
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;

  // Update user in database
  await supabase
    .from('users')
    .update({
      tier: tier,
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription
    })
    .eq('id', userId);
}
```

---

## State Management

### User Metadata Schema

```typescript
interface UserMetadata {
  // Authentication
  auth_provider: 'google' | 'github' | 'email'; // How they signed up

  // Tier management
  tier: 'free' | 'coffee' | 'growth' | 'scale';
  selected_tier: 'free' | 'coffee' | 'growth' | 'scale'; // Originally selected
  subscription_status: 'active' | 'pending_payment' | 'canceled' | 'past_due';

  // Stripe
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;

  // Journey tracking
  isFirstLogin: boolean;
  signup_source: 'landing_url_entry' | 'direct_signup' | 'oauth';

  // Waitlist
  growth_waitlist: boolean;
  scale_waitlist: boolean;
  waitlist_joined_at: timestamp | null;

  // Analytics
  last_upsell_shown: timestamp | null;
  upsell_dismissed_count: number;
}
```

### LocalStorage Schema

```typescript
interface AnalysisContext {
  pendingAnalysisUrl: string | null;      // URL entered on landing page
  pendingAnalysisId: string | null;        // Generated analysis ID
  journeySource: 'landing' | 'direct';     // Where they started
  timestamp: number;                        // When context was stored
}
```

---

## Routing Logic

### Post-Signup Routing

```javascript
function getPostSignupDestination(user, context) {
  const analysisContext = getAnalysisContext();

  // Has pending analysis from landing page
  if (analysisContext?.pendingAnalysisUrl) {
    return {
      path: '/analyze',
      state: {
        prefilledUrl: analysisContext.pendingAnalysisUrl,
        analysisId: analysisContext.pendingAnalysisId
      }
    };
  }

  // Direct signup, no context
  return {
    path: '/analyze',
    state: { prefilledUrl: null }
  };
}
```

### Post-Login Routing

```javascript
function getPostLoginDestination(user) {
  // First login after signup - go to analysis page
  if (user.isFirstLogin) {
    return getPostSignupDestination(user);
  }

  // Returning users - show tier-based upsell
  return getUpsellPage(user);
}
```

### Upsell Routing

```javascript
function getUpsellPage(user) {
  if (user.tier === 'free') return '/upsell/coffee';
  if (user.tier === 'coffee') return '/upsell/growth';
  if (user.tier === 'growth') return '/upsell/scale';
  if (user.tier === 'scale') return '/welcome/scale';
  return '/dashboard'; // Fallback
}
```

---

## Database Schema Requirements

### Users Table Updates

```sql
-- Add new columns if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS growth_waitlist BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scale_waitlist BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlist_joined_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_upsell_shown TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upsell_dismissed_count INTEGER DEFAULT 0;
```

### Waitlist Table (New)

```sql
-- Create waitlist tracking table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  current_tier TEXT NOT NULL,
  interested_tier TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  UNIQUE(user_id, interested_tier)
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own waitlist entries"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entries"
  ON waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for queries
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_interested_tier ON waitlist(interested_tier);
```

---

## UI/UX Component Specifications

### AuthMethodSelector Component

**Visual Hierarchy** (Top to Bottom):
```jsx
<div className="auth-method-selector">
  {/* Google - Primary */}
  <button className="oauth-button oauth-google primary">
    <GoogleIcon />
    Continue with Google
  </button>

  {/* GitHub - Secondary */}
  <button className="oauth-button oauth-github secondary">
    <GitHubIcon />
    Continue with GitHub
  </button>

  {/* Divider */}
  <div className="auth-divider">
    <span>or</span>
  </div>

  {/* Magic Link - Subtle */}
  <button className="auth-button magic-link subtle">
    <EmailIcon />
    Continue with Email
  </button>
</div>
```

**Styling Guidelines**:
- Google button: Large, blue (#4285F4), prominent
- GitHub button: Medium, dark (#24292e), secondary
- Magic link: Smaller, gray, minimal
- Clear visual hierarchy
- Mobile-responsive (stack on mobile)

### Tier Selector Component

**Layout**:
```jsx
<div className="tier-selector">
  <label>Select Your Plan</label>

  <select name="tier" value={selectedTier} onChange={handleTierChange}>
    <option value="free">
      🆓 FREE - 3 analyses/month ($0/month)
    </option>

    <option value="coffee" selected>
      ☕ COFFEE - Unlimited analyses ($4.95/month) ✅ SMART CHOICE!
    </option>

    <option value="growth">
      🚀 GROWTH - Advanced features ($29/month) 🔧 COMING SOON
    </option>

    <option value="scale">
      🏢 SCALE - Enterprise features ($99/month) 🔧 COMING SOON
    </option>
  </select>

  {selectedTier === 'coffee' && (
    <div className="tier-notice success">
      ✅ Unlimited analyses + 30-day guarantee + cancel instantly
      <br/>After signup, secure Stripe payment ($4.95/month)
    </div>
  )}

  {(selectedTier === 'growth' || selectedTier === 'scale') && (
    <div className="tier-notice info">
      🔧 COMING SOON: Advanced features in development
      <br/>Start with Coffee tier, upgrade when available
    </div>
  )}
</div>
```

---

## Testing Requirements

### Manual Testing Checklist

**Authentication Flows**:
- [ ] Google OAuth signup → creates account → redirects correctly
- [ ] GitHub OAuth signup → creates account → redirects correctly
- [ ] Magic link signup → email sent → click link → signed in
- [ ] Google OAuth login (returning user) → shows upsell → then dashboard
- [ ] GitHub OAuth login (returning user) → shows upsell → then dashboard
- [ ] Magic link login (returning user) → shows upsell → then dashboard

**Journey A (Landing Page URL Entry)**:
- [ ] Enter URL on landing page
- [ ] Click "Analyze" button
- [ ] Redirected to signup
- [ ] Complete signup (Google/GitHub/Magic Link)
- [ ] Select Coffee tier → Stripe checkout → payment success
- [ ] Land on analysis page with URL PRE-POPULATED
- [ ] Can run analysis immediately

**Journey B (Direct Signup)**:
- [ ] Click "Sign Up" from navbar
- [ ] Complete signup (any method)
- [ ] Select Coffee tier → Stripe checkout → payment success
- [ ] Land on analysis page WITHOUT pre-populated URL
- [ ] Can enter URL and run analysis

**Stripe Integration**:
- [ ] Coffee tier selected → Stripe checkout opens
- [ ] Payment succeeds → user upgraded to Coffee tier
- [ ] Payment fails → user stays Free tier with upgrade banner
- [ ] Can retry payment from banner
- [ ] Webhook updates database correctly

**Upsell Pages**:
- [ ] Free user logs in → sees Coffee upsell → clicks "Upgrade" → Stripe
- [ ] Free user logs in → sees Coffee upsell → clicks "Maybe Later" → Dashboard
- [ ] Coffee user logs in → sees Growth upsell → clicks "Join Waitlist" → waitlist captured
- [ ] Growth user logs in → sees Scale upsell → clicks "Join Waitlist" → waitlist captured
- [ ] Scale user logs in → sees welcome page → clicks "Continue" → Dashboard

**Waitlist Functionality**:
- [ ] Join Growth waitlist → database entry created
- [ ] Join Scale waitlist → database entry created
- [ ] Confirmation message shown
- [ ] Email sent (future: "we'll notify you")

**First Login Flag**:
- [ ] First signup → isFirstLogin = true → skip upsell → go to analysis
- [ ] Second login → isFirstLogin = false → show upsell
- [ ] Flag persists correctly

**Context Preservation**:
- [ ] URL entered on landing page → stored in localStorage
- [ ] After signup → URL retrieved and pre-populated
- [ ] localStorage cleared after use
- [ ] Works across page refreshes

---

## Success Criteria

**Authentication**:
- ✅ Google OAuth fully functional
- ✅ GitHub OAuth fully functional
- ✅ Magic link sending emails and working
- ✅ No password fields anywhere in app
- ✅ All auth methods create accounts correctly

**Routing**:
- ✅ Landing page URL context preserved through signup
- ✅ Direct signup goes to empty analysis page
- ✅ Returning users see tier-appropriate upsell
- ✅ First login skips upsell

**Stripe**:
- ✅ Coffee tier payment flow works end-to-end
- ✅ Payment success upgrades tier
- ✅ Payment failure keeps free tier with retry option
- ✅ Webhooks update database correctly

**Upsell**:
- ✅ All 4 tier pages built and functional
- ✅ Messaging matches spec exactly (Doug Hall framework)
- ✅ Waitlist capture works for Growth/Scale
- ✅ Navigation works correctly (upgrade vs maybe later)

**User Experience**:
- ✅ Zero password friction
- ✅ Email addresses verified via OAuth/Magic Link
- ✅ Smooth Stripe checkout integration
- ✅ Professional "coming soon" handling
- ✅ Clear value proposition at every tier

---

## Rollback Plan

**If issues arise**:

1. **Authentication broken**:
   - Temporarily re-enable password auth
   - File: `/src/components/UnifiedRegistration.jsx` (keep backup)

2. **Stripe integration broken**:
   - Disable tier selection, everyone gets Free
   - Manual upgrade via support email

3. **Routing broken**:
   - Default all users to dashboard
   - Disable upsell pages temporarily

**Backup Strategy**:
- Create feature branch: `feat/oauth-monetization`
- Keep `main` branch deployable
- Test thoroughly on staging before production merge

---

## Implementation Order (Recommended)

**Phase 1: Authentication (4 hours)**
1. Set up Google OAuth in Supabase
2. Set up GitHub OAuth in Supabase
3. Create AuthMethodSelector component
4. Update UnifiedRegistration.jsx (remove passwords)
5. Fix magic link SMTP
6. Test all auth methods

**Phase 2: Routing & Context (2 hours)**
7. Create auth helper functions
8. Implement localStorage context preservation
9. Build post-signup routing logic
10. Build post-login routing logic
11. Test journey flows

**Phase 3: Upsell Pages (3 hours)**
12. Create UpsellCoffee component
13. Create UpsellGrowth component
14. Create UpsellScale component
15. Create WelcomeScale component
16. Add routes to App.jsx
17. Test upsell display logic

**Phase 4: Stripe Integration (2 hours)**
18. Create checkout session API
19. Set up webhook handler
20. Test payment success flow
21. Test payment failure flow
22. Verify database updates

**Phase 5: Waitlist (1 hour)**
23. Create waitlist database table
24. Build waitlist capture logic
25. Test waitlist functionality

**Phase 6: Testing & Polish (2 hours)**
26. Run full testing checklist
27. Fix any bugs found
28. Update documentation
29. Deploy to production

---

## Environment Variables Required

```bash
# Supabase
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>

# Stripe
VITE_STRIPE_PUBLIC_KEY=<your_stripe_public_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

# OAuth (set in Supabase Dashboard, not env vars)
# Google: Client ID + Secret
# GitHub: Client ID + Secret

# SMTP (set in Supabase Dashboard)
# Resend API Key already configured
```

---

## Reference Documents

**Existing Implementation**:
- `/src/components/UnifiedRegistration.jsx` - Current signup (has passwords - REMOVE)
- `/src/components/Auth.jsx` - Current login logic
- `/src/hooks/useUserInitializer.js` - User initialization (partially fixed for 406/401)

**Design Assets** (Screenshots provided by user):
- Coffee plan benefits messaging
- Growth plan benefits messaging
- Scale plan benefits messaging
- Free plan limitations messaging
- ZERO RISK section content
- Tier selector dropdown designs

**Configuration Files**:
- `/supabase/config.toml` - Auth settings (email confirmations = false)
- Supabase Dashboard → Authentication → Providers (OAuth setup)
- Supabase Dashboard → Authentication → Email (SMTP settings)

**Business Context**:
- Doug Hall's Marketing Physics framework (Overt/Dramatic/Real)
- Frictionless signup as primary goal
- Coffee tier ($4.95/month) as primary monetization
- Growth/Scale as future upsell path
- Free tier strategic (3 analyses/month limit)

---

## Notes for Implementation Team

**Critical Success Factors**:
1. ⚠️ **DO NOT change messaging** - User has conversion-optimized copy
2. ⚠️ **Preserve localStorage context** - Critical for landing page flow
3. ⚠️ **First login flag** - Must work correctly to skip upsell
4. ⚠️ **Graceful degradation** - Payment failures must not break app

**Common Pitfalls to Avoid**:
- Don't skip OAuth callback setup (both Supabase + OAuth provider)
- Don't forget to clear localStorage after context is used
- Don't show upsell on first login (user just signed up!)
- Don't block users if Stripe payment fails (graceful degradation)
- Don't modify tier benefit messaging (it's conversion-optimized)

**Testing Focus Areas**:
- OAuth redirect URIs (localhost + production)
- Magic link email delivery (SMTP must work)
- Stripe webhooks (use Stripe CLI for local testing)
- Context preservation across redirects
- First login vs returning user logic

**Performance Considerations**:
- Lazy load OAuth libraries (don't block initial page load)
- Minimize re-renders on tier selection changes
- Cache Stripe checkout sessions (don't create duplicates)
- Optimize upsell page images/assets

---

## Post-Implementation Checklist

**Before Merging to Main**:
- [ ] All manual tests passing
- [ ] OAuth works on production URLs
- [ ] Magic link emails delivering
- [ ] Stripe webhooks receiving events
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] No console errors in production
- [ ] Analytics tracking signup method
- [ ] Rollback plan documented
- [ ] User-facing documentation updated

**Deployment Steps**:
1. Merge feature branch to main
2. Run database migrations on production
3. Verify OAuth redirect URIs in providers
4. Test one full signup flow in production
5. Monitor error logs for 24 hours
6. Announce new authentication options to users

---

## Support & Maintenance

**Monitoring**:
- Track authentication method distribution (Google/GitHub/Magic Link)
- Monitor Stripe payment success/failure rates
- Track waitlist signups for Growth/Scale tiers
- Watch for OAuth callback errors

**Future Enhancements**:
- Add more OAuth providers (Apple, Microsoft, etc.)
- Implement "Remember this device" for returning users
- Add upsell frequency capping (not every single login)
- A/B test upsell page variations
- Launch Growth tier (from waitlist)
- Launch Scale tier (from waitlist)

---

**END OF SPECIFICATION**

*This document is comprehensive and ready for autonomous implementation by a coordinator + specialist team.*
