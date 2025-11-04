# Phase 1 Signup Flow - Complete Journey Map Analysis

**Date**: 2025-01-19
**Analyst**: THE ANALYST
**Purpose**: Validate all 8 user paths before UAT testing
**Status**: ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

**CRITICAL FINDINGS**:
1. ❌ **MAJOR ROUTING CONFLICT**: New users auto-routed to dashboard BEFORE tier-based actions (Stripe checkout)
2. ❌ **MISSING TIER STORAGE**: Tier selection doesn't persist through OAuth callback
3. ⚠️ **DUPLICATE USER CREATION**: Magic link flow creates user BEFORE tier selection
4. ⚠️ **EDGE CASE**: Existing users selecting different tier not properly handled
5. ✅ **PARTIAL WIN**: Login mode bypasses tier selection (correct)

**RECOMMENDATION**: **DO NOT PROCEED TO UAT** until critical routing and state management issues are resolved.

---

## Complete Journey Map: All 8 Paths

### **JOURNEY 1: New User → Paid (Coffee) → OAuth (Google/GitHub)**

**Entry Point**: `/#signup`

**User Actions**:
1. User lands on `/pages/Signup.jsx`
2. Sees `TierDropdownSelector` with Coffee pre-selected (line 11 in `Signup.jsx`)
3. Clicks "Continue to Sign Up" button (line 112-134 in `Signup.jsx`)
4. Tier stored in `authContext` localStorage with 24hr TTL (line 115-124)
5. Clicks "Continue with Google" or "Continue with GitHub" (line 213-273 in `AuthMethodSelector.jsx`)
6. OAuth provider redirect initiated
7. User authenticates with Google/GitHub
8. **REDIRECT**: Returns to `/#oauth-callback`

**System State Changes**:
```javascript
// STORED BEFORE OAUTH:
localStorage: {
  authContext: {
    selectedTier: 'coffee',
    mode: 'signup',
    timestamp: Date.now()
  },
  authContextExpiry: Date.now() + 24hr
}

// AFTER OAUTH (in OAuthCallback.jsx):
1. Session established (line 39-59)
2. authContext retrieved (line 84)
3. Account age checked: < 60s = new user (line 65-68)
4. ❌ ISSUE: User created with tier BUT routing happens first
```

**Database Operations**:
```javascript
// Line 144-158 in OAuthCallback.jsx
supabase.from('users').insert({
  id: session.user.id,
  email: session.user.email,
  tier: selectedTier, // ✅ CORRECT
  selected_tier: selectedTier,
  auth_provider: authProvider,
  is_first_login: true,
  signup_source: 'oauth',
  monthly_analyses_used: 0,
  subscription_status: 'pending_payment' // ✅ CORRECT
})
```

**Expected Routing** (line 225-227 in `OAuthCallback.jsx`):
```javascript
// getPostSignupDestination() called
// Should return:
{
  path: '/checkout',
  state: { tier: 'coffee', userId, email }
}
```

**❌ ACTUAL ROUTING ISSUE**:
```javascript
// Line 244 in OAuthCallback.jsx - pathToView mapping
'/checkout': 'checkout', // ✅ Maps correctly
// BUT...
// Line 246: '/upsell/coffee': 'dashboard' - WRONG!
// If logic somehow routes to upsell, it bypasses checkout!

// Line 276-287: Uses onNavigate callback
onNavigate(viewName); // Passes 'checkout' to App.jsx setCurrentView
```

**🚨 CRITICAL ISSUE #1**:
```javascript
// App.jsx line 92-116 - setCurrentView wrapper
// PROBLEM: Protected route check happens BEFORE navigation
// BUT session check might not be complete yet!

if (isProtectedRoute(view)) {
  const isAuthenticated = !!(session?.user?.id);
  // ⚠️ If session isn't updated yet, this could redirect to landing!
}
```

**🚨 CRITICAL ISSUE #2**:
```javascript
// App.jsx line 489-756 - onAuthStateChange listener
// Line 541-564: SIGNED_IN event
if (event === 'SIGNED_IN' && session) {
  if (currentView !== 'oauth-callback') {
    setCurrentViewInternal('oauth-callback'); // ❌ RACE CONDITION!
    // If OAuthCallback already called onNavigate('checkout'),
    // this OVERRIDES it and redirects to oauth-callback again!
  }
}
```

**Final Destination**:
- **EXPECTED**: `/checkout` → Stripe payment page
- **ACTUAL**: ❌ Likely `/dashboard` or stuck in `/oauth-callback` loop

**Edge Cases**:
1. ❌ Tier not in authContext (expired or cleared) → Redirected to tier selection AFTER user created
2. ❌ OAuth session fails to establish within 3 attempts → Error screen
3. ⚠️ User closes browser mid-flow → authContext expires in 24hr (recovered if returned)
4. ❌ SIGNED_IN event fires AFTER onNavigate → Overrides checkout routing

---

### **JOURNEY 2: New User → Paid (Coffee) → Magic Link**

**Entry Point**: `/#signup`

**User Actions**:
1. User lands on `/pages/Signup.jsx`
2. Sees `TierDropdownSelector` with Coffee pre-selected
3. Clicks "Continue to Sign Up" button
4. Tier stored in `authContext` localStorage (line 115-124 in `Signup.jsx`)
5. Clicks "or" → "Continue with Email" (line 286-344 in `AuthMethodSelector.jsx`)
6. Enters email address
7. Clicks "Send Magic Link" (line 138-179 in `AuthMethodSelector.jsx`)
8. **Email sent**, user sees "Check Your Email" screen (line 182-207)
9. User clicks link in email
10. **REDIRECT**: Returns to `/#oauth-callback`

**System State Changes**:
```javascript
// BEFORE MAGIC LINK:
localStorage: {
  authContext: {
    selectedTier: 'coffee',
    mode: 'signup',
    timestamp: Date.now()
  }
}

// AFTER EMAIL CLICK:
// ⚠️ Same as OAuth flow - routes to OAuthCallback.jsx
```

**🚨 CRITICAL ISSUE #3**:
```javascript
// Magic link flow IDENTICAL to OAuth after email click
// BUT email click might happen HOURS later!
// authContext might be EXPIRED (24hr TTL)

// OAuthCallback.jsx line 119-137
if (!selectedTier) {
  console.log('⚠️ No tier selected, redirecting to tier selection...');
  // ❌ User already created in Supabase Auth!
  // ❌ Now they're orphaned - auth exists but no database record
  sessionStorage.setItem('newUserEmail', session.user.email);
  sessionStorage.setItem('newUserId', session.user.id);
  onNavigate('upsell-coffee'); // ❌ WRONG! Should be tier selection
}
```

**Database Operations**:
Same as Journey 1, BUT only if `authContext` hasn't expired.

**Expected Routing**: Same as Journey 1
**Actual Routing**: ❌ High chance of routing to `upsell-coffee` if user clicks link >24hr later

**Edge Cases**:
1. ❌ **MAJOR**: User clicks magic link after 24hr → authContext expired → Tier selection bypassed
2. ❌ User clicks magic link twice → Duplicate session handling unclear
3. ⚠️ Email never received → User stuck at "Check Your Email" (no resend implemented in `AuthMethodSelector.jsx`)

---

### **JOURNEY 3: New User → Free Tier → OAuth**

**Entry Point**: `/#signup`

**User Actions**:
1. User lands on `/pages/Signup.jsx`
2. Coffee pre-selected (line 11 in `Signup.jsx`)
3. User changes dropdown to "FREE" (line 78-90 in `TierDropdownSelector.jsx`)
4. Clicks "Continue to Sign Up"
5. Tier `'free'` stored in `authContext`
6. Clicks "Continue with Google/GitHub"
7. OAuth provider redirect
8. User authenticates
9. **REDIRECT**: Returns to `/#oauth-callback`

**System State Changes**:
```javascript
localStorage: {
  authContext: {
    selectedTier: 'free', // ✅ Changed from coffee
    mode: 'signup',
    timestamp: Date.now()
  }
}
```

**Database Operations**:
```javascript
// OAuthCallback.jsx line 144-158
supabase.from('users').insert({
  tier: 'free', // ✅ CORRECT
  subscription_status: 'active' // ✅ NOT pending_payment
})
```

**Expected Routing** (from `authRouting.js` line 152-194):
```javascript
// getPostSignupDestination()
// Coffee tier check (line 173-183):
if (tier === 'coffee') { // ❌ FALSE for free tier
  return { path: '/checkout', state: {...} };
}

// Default (line 185-193):
return {
  path: '/analyze', // ✅ CORRECT for free tier
  state: { prefilledUrl: null, source: 'direct_signup' }
};
```

**Final Destination**:
- **EXPECTED**: `/analyze` (dashboard)
- **ACTUAL**: ✅ Likely correct (no Stripe checkout for free)

**Edge Cases**:
1. ✅ Free tier users skip payment → Correct
2. ⚠️ Same SIGNED_IN race condition as Journey 1

---

### **JOURNEY 4: New User → Free Tier → Magic Link**

**Entry Point**: `/#signup`

**User Actions**: Same as Journey 2, but with `selectedTier: 'free'`

**System State Changes**: Same as Journey 3

**Database Operations**: Same as Journey 3

**Expected Routing**: `/analyze` (dashboard)
**Actual Routing**: ✅ Likely correct if authContext valid, ❌ Wrong if expired

**Edge Cases**: Same as Journey 2 (authContext expiry issue)

---

### **JOURNEY 5: Existing Paid User → Log Back In → OAuth**

**Entry Point**: `/#login`

**User Actions**:
1. User lands on `/pages/Signup.jsx` with `mode="login"` (line 8 in `Signup.jsx`)
2. ✅ **SKIP TIER SELECTION** - `showOAuthButtons` set to `true` immediately (line 14)
3. Login mode `authContext` stored (line 36-47 in `Signup.jsx`)
4. Clicks "Sign in with Google/GitHub"
5. OAuth provider redirect
6. User authenticates
7. **REDIRECT**: Returns to `/#oauth-callback`

**System State Changes**:
```javascript
// BEFORE OAUTH (Signup.jsx line 36-47):
localStorage: {
  authContext: {
    mode: 'login', // ✅ NO TIER SELECTION
    timestamp: Date.now()
  }
}
```

**Database Operations**:
```javascript
// OAuthCallback.jsx line 65-68
const accountAge = Date.now() - new Date(authUser.created_at).getTime();
const isNewUser = accountAge < 60000; // ✅ FALSE for existing user

// Line 87-189: getUserData() called
const userData = await getUserData(session.user.id);

// Line 184-189: Existing user detected
if (!userData && !isNewUser) {
  // ❌ CRITICAL: Existing user but no database record
  throw new Error('Account verification failed...');
} else {
  // ✅ Existing user with userData found
  await routeUser(userData, session, authContext);
}
```

**Expected Routing** (from `authRouting.js` line 202-268):
```javascript
// getPostLoginDestination() called (line 202)

// Check for signup flow with tier selection (line 207-244)
if (authContext?.mode === 'signup' && authContext?.selectedTier) {
  // ❌ FALSE for login mode (no selectedTier)
}

// Check first_login flag (line 246-257)
if (user?.is_first_login === true) {
  // ❌ FALSE for returning user
}

// Returning users: Show tier-based upsell (line 260-261)
return getUpsellPage(user);
```

**🚨 CRITICAL ISSUE #4**:
```javascript
// authRouting.js line 296-333 - getUpsellPage()
switch (tier) {
  case 'free':
    return { path: '/upsell/coffee', state: {...} };
  case 'coffee':
    return { path: '/upsell/growth', state: {...} };
  case 'growth':
    return { path: '/upsell/scale', state: {...} };
  case 'scale':
    return { path: '/welcome/scale', state: {...} };
}

// OAuthCallback.jsx line 242-250 - pathToView mapping
'/upsell/coffee': 'dashboard', // ❌ WRONG!
'/upsell/growth': 'dashboard', // ❌ WRONG!
'/upsell/scale': 'dashboard', // ❌ WRONG!
'/welcome/scale': 'dashboard' // ❌ WRONG!
```

**Final Destination**:
- **EXPECTED**: `/upsell/growth` (show upgrade options for Coffee tier users)
- **ACTUAL**: ❌ `/dashboard` (upsell bypassed entirely!)

**Edge Cases**:
1. ❌ **MAJOR**: All existing users bypass upsell and go straight to dashboard
2. ❌ Tier-based onboarding completely broken
3. ✅ User not blocked from accessing app (acceptable fallback)

---

### **JOURNEY 6: Existing Paid User → Log Back In → Magic Link**

**Entry Point**: `/#login`

**User Actions**: Same as Journey 5, but with magic link authentication

**System State Changes**: Same as Journey 5 (no tier selection in login mode)

**Database Operations**: Same as Journey 5

**Expected Routing**: `/upsell/growth` (for Coffee tier user)
**Actual Routing**: ❌ `/dashboard` (upsell bypassed)

**Edge Cases**: Same as Journey 5

---

### **JOURNEY 7: Existing Free User → Log Back In → OAuth**

**Entry Point**: `/#login`

**User Actions**: Same as Journey 5

**System State Changes**: Same as Journey 5

**Database Operations**: Same as Journey 5

**Expected Routing**:
```javascript
// getUpsellPage() for free tier user
return { path: '/upsell/coffee', state: { currentTier: 'free' } };
```

**Final Destination**:
- **EXPECTED**: `/upsell/coffee` (upgrade to Coffee tier)
- **ACTUAL**: ❌ `/dashboard` (upsell bypassed)

**Edge Cases**: Same as Journey 5 (upsell broken for all tiers)

---

### **JOURNEY 8: Existing Free User → Log Back In → Magic Link**

**Entry Point**: `/#login`

**User Actions**: Same as Journey 5, but with magic link

**System State Changes**: Same as Journey 5

**Database Operations**: Same as Journey 5

**Expected Routing**: `/upsell/coffee`
**Actual Routing**: ❌ `/dashboard`

**Edge Cases**: Same as Journey 5

---

## State Transition Diagrams

### **New User Signup Flow (Journeys 1-4)**

```
┌─────────────┐
│  /#signup   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Signup.jsx loads    │
│ Coffee pre-selected │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ User clicks dropdown?       │
│ - Keep Coffee (Journeys 1-2)│
│ - Change to Free (Journeys 3-4) │
└──────┬──────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Clicks "Continue to      │
│ Sign Up" button          │
│ → authContext stored     │
└──────┬───────────────────┘
       │
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Google OAuth │    │ GitHub OAuth │    │  Magic Link  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └─────────┬─────────┴───────────────────┘
                 │
                 ▼
         ┌────────────────┐
         │ OAuth Provider │
         │ Authentication │
         └────────┬───────┘
                  │
                  ▼
         ┌─────────────────┐
         │ /#oauth-callback│
         └────────┬────────┘
                  │
                  ▼
    ┌──────────────────────────┐
    │ OAuthCallback.jsx        │
    │ - getSession() (3 tries) │
    │ - Check account age      │
    │ - Retrieve authContext   │
    └────────┬─────────────────┘
             │
        ┌────┴────┐
        │ New vs  │
        │Existing?│
        └────┬────┘
             │
    ┌────────┴─────────┐
    │                  │
    ▼                  ▼
┌────────┐      ┌──────────────┐
│  NEW   │      │   EXISTING   │
│ USER   │      │    USER      │
└───┬────┘      └──────┬───────┘
    │                  │
    ▼                  ▼
┌───────────────┐  ┌──────────────────┐
│ Has tier in   │  │ Fetch userData   │
│ authContext?  │  │ from database    │
└───┬───────────┘  └──────┬───────────┘
    │                     │
    ├─── YES ────┐        ▼
    │            │   ┌──────────────┐
    │            │   │ Route to     │
    │            │   │ upsell page  │
    │            │   │ (BROKEN!)    │
    │            │   └──────────────┘
    ▼            │
┌──────────────┐ │
│ Create user  │ │
│ with tier    │ │
└──────┬───────┘ │
       │         │
       └────┬────┘
            │
            ▼
    ┌───────────────┐
    │ getPostSignup │
    │ Destination() │
    └───────┬───────┘
            │
       ┌────┴────┐
       │  Tier?  │
       └────┬────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌──────────┐ ┌─────────┐
│  COFFEE  │ │  FREE   │
│ /checkout│ │/analyze │
└──────────┘ └─────────┘
      │           │
      ▼           ▼
┌──────────┐ ┌──────────┐
│  Stripe  │ │Dashboard │
│ Payment  │ │         │
└──────────┘ └──────────┘
      │
      ▼
┌──────────┐
│Dashboard │
└──────────┘

❌ ISSUES:
- SIGNED_IN event race condition
- pathToView maps upsells → dashboard
- authContext expiry not handled
```

### **Existing User Login Flow (Journeys 5-8)**

```
┌─────────────┐
│  /#login    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Signup.jsx loads    │
│ mode="login"        │
│ ✅ SKIP tier select │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────┐
│ OAuth buttons shown      │
│ immediately (no tier)    │
│ → authContext: {         │
│     mode: 'login'        │
│   }                      │
└──────┬───────────────────┘
       │
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Google OAuth │    │ GitHub OAuth │    │  Magic Link  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └─────────┬─────────┴───────────────────┘
                 │
                 ▼
         ┌────────────────┐
         │ OAuth Provider │
         │ Authentication │
         └────────┬───────┘
                  │
                  ▼
         ┌─────────────────┐
         │ /#oauth-callback│
         └────────┬────────┘
                  │
                  ▼
    ┌──────────────────────────┐
    │ OAuthCallback.jsx        │
    │ - getSession()           │
    │ - Check account age      │
    │   (> 60s = existing)     │
    └────────┬─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ getUserData()   │
    │ Fetch from DB   │
    └────────┬────────┘
             │
        ┌────┴────┐
        │ Found?  │
        └────┬────┘
             │
       ┌─────┴─────┐
       │           │
      YES          NO
       │           │
       ▼           ▼
┌──────────────┐ ┌──────────────┐
│ routeUser()  │ │ Error thrown │
│ → getPost    │ │ (DB issue)   │
│   LoginDest()│ └──────────────┘
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ is_first_login?    │
│ (should be false   │
│  for existing user)│
└────────┬───────────┘
         │
    ┌────┴────┐
    │  FALSE  │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ getUpsellPage() │
│ Based on tier:  │
│ - free → coffee │
│ - coffee → growth│
│ - growth → scale│
│ - scale → welcome│
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ pathToView mapping  │
│ ALL MAP TO:         │
│ → 'dashboard' ❌    │
└────────┬────────────┘
         │
         ▼
┌──────────────────┐
│ onNavigate()     │
│ → setCurrentView │
│   ('dashboard')  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /#dashboard      │
│ ❌ Upsell skipped│
└──────────────────┘

❌ ISSUES:
- All upsells route to dashboard
- No upgrade prompts shown
- Revenue opportunity lost
```

---

## Identified Edge Cases

### **Critical Edge Cases (Must Fix)**

1. **authContext Expiry (24hr TTL)**
   - **Scenario**: User clicks magic link >24hr after signup initiation
   - **Current Behavior**: authContext expired → No tier selection → User redirected to `upsell-coffee`
   - **Problem**: User already authenticated in Supabase, but no database record created
   - **Impact**: Orphaned auth accounts, broken user experience
   - **Fix**: Extend TTL to 7 days OR store tier in sessionStorage + localStorage backup

2. **SIGNED_IN Event Race Condition**
   - **Scenario**: OAuthCallback completes, calls `onNavigate('checkout')`, but SIGNED_IN event fires 100ms later
   - **Current Behavior**: SIGNED_IN event redirects to `oauth-callback` AGAIN (App.jsx line 552)
   - **Problem**: Overrides checkout routing, user stuck in callback loop
   - **Impact**: Payment flow broken, revenue lost
   - **Fix**: Add state flag `oauthCallbackProcessed` to prevent re-routing

3. **Upsell Routing Broken**
   - **Scenario**: Any existing user logs in
   - **Current Behavior**: `pathToView` maps ALL upsell paths to `'dashboard'` (OAuthCallback.jsx line 246-250)
   - **Problem**: All returning users bypass upgrade prompts
   - **Impact**: Zero upsell conversion, revenue loss
   - **Fix**: Map upsell paths to actual upsell views, NOT dashboard

4. **Session Check Not Complete Before Routing**
   - **Scenario**: User navigates to protected route before session restore completes
   - **Current Behavior**: `setCurrentView` checks `session?.user?.id` but session might be null during restore
   - **Problem**: Premature redirect to landing page, then redirect BACK to intended route
   - **Impact**: Flickering UI, poor UX
   - **Fix**: Queue navigation until `sessionChecked === true`

### **Medium Priority Edge Cases**

5. **Duplicate OAuth Clicks**
   - **Scenario**: User double-clicks OAuth button
   - **Current Behavior**: Two OAuth flows initiated
   - **Problem**: Undefined behavior, possible duplicate user creation attempts
   - **Impact**: Edge case errors
   - **Fix**: Disable button after first click (loading state already exists but might not prevent double-submit)

6. **Browser Back Button Mid-Flow**
   - **Scenario**: User clicks back during OAuth redirect
   - **Current Behavior**: Returns to tier selection, authContext still valid
   - **Problem**: User can change tier AFTER OAuth started, causing mismatch
   - **Impact**: Tier stored != tier authenticated with
   - **Fix**: Clear authContext on browser back OR lock tier selection after OAuth initiated

7. **Network Failure During getUserData()**
   - **Scenario**: Database query times out during OAuth callback
   - **Current Behavior**: Throws error, routes to signup (OAuthCallback.jsx line 198-207)
   - **Problem**: User created but routing failed, might create duplicate
   - **Impact**: User stuck, broken flow
   - **Fix**: Retry getUserData() with exponential backoff

### **Low Priority Edge Cases**

8. **Multiple Browser Tabs**
   - **Scenario**: User opens signup in two tabs, completes OAuth in one
   - **Current Behavior**: First tab completes, second tab still waiting
   - **Problem**: Second tab might show stale state
   - **Impact**: Minor UX issue
   - **Fix**: Listen for localStorage changes, sync state across tabs

9. **Magic Link Resend**
   - **Scenario**: User doesn't receive email, wants resend
   - **Current Behavior**: No resend button implemented in `AuthMethodSelector.jsx`
   - **Problem**: User stuck at "Check Your Email" screen
   - **Impact**: Signup abandonment
   - **Fix**: Add resend button with rate limiting

10. **Coming Soon Tiers (Growth/Scale)**
    - **Scenario**: User selects Growth or Scale tier (disabled in dropdown)
    - **Current Behavior**: Dropdown prevents selection (`disabled` in `TierDropdownSelector.jsx` line 18-19)
    - **Problem**: None currently, but no handling if user bypasses client-side validation
    - **Impact**: Backend might accept invalid tier
    - **Fix**: Server-side validation in Edge Functions

---

## Gaps and Unclear Logic

### **Gap 1: Tier Persistence Strategy**

**Current State**:
- Tier stored in `authContext` with 24hr TTL
- Retrieved in OAuthCallback, used to create user
- Cleared after user creation

**Unclear**:
- ❓ What happens if user abandons flow, returns AFTER 24hr?
- ❓ Should tier be stored in URL params for email links?
- ❓ Should tier be stored in Supabase user_metadata during OAuth?

**Recommendation**:
```javascript
// OPTION A: Store in user_metadata during OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: getRedirectUrl(),
    data: {
      selected_tier: selectedTier, // ✅ ALREADY DONE (line 70 in AuthMethodSelector.jsx)
      signup_source: 'oauth_google',
      auth_provider: 'google'
    }
  }
});

// OPTION B: Extend authContext TTL to 7 days
const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days

// OPTION C: Fallback chain
selectedTier = authContext?.selectedTier ||
               session.user.user_metadata?.selected_tier ||
               'free'; // ❌ This creates unwanted free users!
```

**Preferred**: **OPTION A + OPTION B** - Store in both places for redundancy

---

### **Gap 2: First Login Flag Management**

**Current State**:
- `is_first_login: true` set during user creation (OAuthCallback.jsx line 152)
- Checked in `getPostLoginDestination()` (authRouting.js line 246)
- Never cleared to `false`

**Unclear**:
- ❓ When should `is_first_login` be set to `false`?
- ❓ Is this flag reliable for differentiating new vs returning users?

**Issue**:
```javascript
// authRouting.js line 274-289 - markFirstLoginComplete()
// Function exists but is ONLY called in getPostLoginDestination()
// NOT called in getPostSignupDestination()!

if (user?.is_first_login === true) {
  await markFirstLoginComplete(user.id); // ✅ Called here
  return getPostSignupDestination(...); // ✅ Routes correctly
}

// BUT if user lands in getPostSignupDestination() first (new signup flow)
// is_first_login is NEVER cleared!
```

**Recommendation**:
Call `markFirstLoginComplete()` in OAuthCallback AFTER successful routing:
```javascript
// OAuthCallback.jsx line 211-293 - routeUser()
// Add after successful navigation:
if (userData.is_first_login) {
  await markFirstLoginComplete(userData.id);
}
```

---

### **Gap 3: Payment Confirmation Flow**

**Current State**:
- Coffee tier users routed to `/checkout` (maps to `'checkout'` view)
- `App.jsx` line 1538-1574 handles checkout view
- Auto-triggers `handleUpgrade()` which redirects to Stripe
- Stripe redirects back to `/checkout-success` or `/checkout-cancel`

**Unclear**:
- ❓ How does user get from Stripe back to app? (Webhook? Redirect?)
- ❓ Is `subscription_status` updated from `'pending_payment'` to `'active'`?
- ❓ What happens if user closes browser during Stripe checkout?

**Investigation Needed**:
- Check for Stripe webhook handler
- Check for `/checkout-success` logic to update user tier
- Check for `/checkout-cancel` logic to handle abandoned payments

**Recommendation**: Map complete payment confirmation flow in separate doc

---

### **Gap 4: Error Recovery Paths**

**Current State**:
- Errors caught in try/catch blocks
- Error messages logged to console
- Some errors show user-facing error screens (OAuthCallback.jsx line 312-340)

**Unclear**:
- ❓ What's the recovery path if OAuth fails mid-flow?
- ❓ Can user retry without restarting from scratch?
- ❓ Is there a "Contact Support" fallback for critical errors?

**Recommendation**: Add retry buttons to error screens:
```javascript
// OAuthCallback.jsx line 324-337 - Error screen
<button
  onClick={() => {
    clearAuthContext();
    if (onNavigate) {
      onNavigate('signup'); // ✅ Retry from beginning
    }
  }}
  className="..."
>
  Try Again
</button>
```

---

## Questions That Need Answering

### **Immediate (Blockers for UAT)**

1. **Q1**: Should SIGNED_IN event override onNavigate routing?
   - **Current**: Yes (causes checkout bypass)
   - **Expected**: No (respect OAuthCallback routing)
   - **Decision Needed**: Add state flag to prevent re-routing?

2. **Q2**: What's the intended behavior for expired authContext?
   - **Current**: Redirect to `upsell-coffee` (creates orphaned auth)
   - **Expected**: Re-prompt for tier selection? Use user_metadata fallback?
   - **Decision Needed**: Extend TTL? Add fallback chain?

3. **Q3**: Why are upsell pages mapped to `'dashboard'` in pathToView?
   - **Current**: ALL upsells bypass upsell screens
   - **Expected**: Show tier-specific upsell pages
   - **Decision Needed**: Is this intentional (Phase 2)? Or bug?

4. **Q4**: How should magic link >24hr after signup be handled?
   - **Current**: authContext expired → broken flow
   - **Expected**: Still complete signup with tier from user_metadata
   - **Decision Needed**: Add fallback, extend TTL, or both?

### **Important (Fix before launch)**

5. **Q5**: Should `is_first_login` be cleared immediately or after first action?
   - **Current**: Cleared in getPostLoginDestination, NOT in getPostSignupDestination
   - **Decision Needed**: Ensure consistency

6. **Q6**: What happens if Stripe checkout is abandoned?
   - **Current**: User created with `subscription_status: 'pending_payment'`
   - **Decision Needed**: Timeout? Reminder emails? Allow re-attempt?

7. **Q7**: Should browser back button be allowed during OAuth flow?
   - **Current**: Allowed, but can cause tier mismatch
   - **Decision Needed**: Block back button? Reset authContext?

### **Nice to Have (Post-launch)**

8. **Q8**: Should we implement magic link resend?
   - **Current**: No resend button
   - **Decision Needed**: Add to roadmap?

9. **Q9**: Should we sync state across browser tabs?
   - **Current**: No cross-tab sync
   - **Decision Needed**: Worth the complexity?

10. **Q10**: Should Coming Soon tiers be completely hidden or shown as disabled?
    - **Current**: Shown as disabled in dropdown
    - **Decision Needed**: UX preference

---

## Recommendations

### **CRITICAL - Must Fix Before UAT**

1. **Fix Upsell Routing** (OAuthCallback.jsx line 242-250)
   ```javascript
   // BEFORE:
   const pathToView = {
     '/upsell/coffee': 'dashboard', // ❌ WRONG
     '/upsell/growth': 'dashboard', // ❌ WRONG
   };

   // AFTER:
   const pathToView = {
     '/upsell/coffee': 'upsell-coffee', // ✅ CORRECT
     '/upsell/growth': 'upsell-growth', // ✅ CORRECT
     '/upsell/scale': 'upsell-scale', // ✅ CORRECT
     '/welcome/scale': 'welcome-scale', // ✅ CORRECT
   };
   ```

2. **Fix SIGNED_IN Race Condition** (App.jsx line 541-564)
   ```javascript
   // ADD state flag at top of AppContent:
   const oauthCallbackProcessed = useRef(false);

   // IN SIGNED_IN handler:
   if (event === 'SIGNED_IN' && session) {
     if (currentView !== 'oauth-callback' && !oauthCallbackProcessed.current) {
       setCurrentViewInternal('oauth-callback');
       window.location.hash = 'oauth-callback';
       return;
     }
     // If oauth-callback already processed, don't redirect
   }

   // IN OAuthCallback routeUser():
   oauthCallbackProcessed.current = true; // ✅ Set flag before routing
   onNavigate(viewName);
   ```

3. **Fix authContext Expiry Handling** (OAuthCallback.jsx line 119-137)
   ```javascript
   // ADD fallback chain:
   const selectedTier = authContext?.selectedTier ||
                        session.user.user_metadata?.selected_tier ||
                        null; // ✅ Don't default to 'free'!

   if (!selectedTier) {
     // Instead of routing to upsell-coffee (which assumes free tier):
     console.log('⚠️ No tier selected, routing to tier selection...');
     onNavigate('signup'); // ✅ Start tier selection from scratch
     return;
   }
   ```

4. **Extend authContext TTL** (Signup.jsx line 123, AuthMethodSelector.jsx line 30-32)
   ```javascript
   // CHANGE from 24hr to 7 days:
   const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
   localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());
   ```

### **HIGH PRIORITY - Fix Before Launch**

5. **Add Retry Logic for getUserData()** (OAuthCallback.jsx line 87-109)
   ```javascript
   // ALREADY IMPLEMENTED for existing users (line 89-109)
   // ADD same retry logic for NEW users:
   if (!userData && isNewUser) {
     // Try 3 times with 500ms delay
     for (let retry = 1; retry <= 3; retry++) {
       await new Promise(resolve => setTimeout(resolve, 500));
       userData = await getUserData(session.user.id);
       if (userData) break;
     }
   }
   ```

6. **Clear is_first_login After First Use** (OAuthCallback.jsx line 211-293)
   ```javascript
   // ADD at end of routeUser():
   if (userData.is_first_login) {
     await markFirstLoginComplete(userData.id);
   }
   ```

7. **Add Error Recovery Button** (OAuthCallback.jsx line 324-337)
   ```javascript
   <button
     onClick={() => {
       clearAuthContext();
       if (onNavigate) {
         onNavigate('signup');
       } else {
         window.location.hash = 'signup';
       }
     }}
     className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
   >
     Start Over
   </button>
   ```

### **MEDIUM PRIORITY - Post-Launch**

8. **Add Magic Link Resend** (AuthMethodSelector.jsx line 182-207)
9. **Implement Browser Back Button Guard** (Signup.jsx)
10. **Add Cross-Tab State Sync** (App.jsx)

---

## Testing Checklist

Before proceeding to UAT, verify each journey manually:

### **New User Journeys (1-4)**

- [ ] Journey 1: New → Coffee → Google OAuth
  - [ ] Tier stored in authContext
  - [ ] User created with `tier: 'coffee'`, `subscription_status: 'pending_payment'`
  - [ ] Routed to `/checkout` (NOT dashboard)
  - [ ] Stripe checkout shown
  - [ ] After payment, routed to dashboard with Coffee tier

- [ ] Journey 2: New → Coffee → Magic Link
  - [ ] authContext persists for >24hr (or fallback to user_metadata works)
  - [ ] User created after email click
  - [ ] Routed to `/checkout`

- [ ] Journey 3: New → Free → Google OAuth
  - [ ] User created with `tier: 'free'`, `subscription_status: 'active'`
  - [ ] Routed to dashboard (NOT checkout)
  - [ ] No Stripe redirect

- [ ] Journey 4: New → Free → Magic Link
  - [ ] Same as Journey 3

### **Existing User Journeys (5-8)**

- [ ] Journey 5: Existing Coffee → Google OAuth
  - [ ] Tier selection SKIPPED (mode=login)
  - [ ] userData fetched from database
  - [ ] Routed to `/upsell/growth` (NOT dashboard) ← **CRITICAL TEST**
  - [ ] Upsell page displays correctly

- [ ] Journey 6: Existing Coffee → Magic Link
  - [ ] Same as Journey 5

- [ ] Journey 7: Existing Free → Google OAuth
  - [ ] Routed to `/upsell/coffee` (NOT dashboard) ← **CRITICAL TEST**
  - [ ] Coffee tier upsell shown

- [ ] Journey 8: Existing Free → Magic Link
  - [ ] Same as Journey 7

### **Edge Case Testing**

- [ ] authContext expires after 24hr (magic link flow)
- [ ] Browser back button during OAuth
- [ ] Double-click OAuth button
- [ ] Network failure during getUserData()
- [ ] Multiple browser tabs
- [ ] Stripe checkout abandoned

---

## Summary of Critical Issues

| Issue | Severity | Impact | Files Affected | Fix Complexity |
|-------|----------|--------|---------------|----------------|
| Upsell routing to dashboard | 🔴 CRITICAL | Revenue loss (all upsells bypassed) | OAuthCallback.jsx:246-250 | LOW (1 line change) |
| SIGNED_IN race condition | 🔴 CRITICAL | Payment flow broken | App.jsx:541-564, OAuthCallback.jsx | MEDIUM (add state flag) |
| authContext expiry (24hr) | 🔴 CRITICAL | Broken magic link flow | Signup.jsx:123, AuthMethodSelector.jsx:30 | LOW (change TTL) |
| Missing user_metadata fallback | 🟠 HIGH | Failed tier assignment | OAuthCallback.jsx:116 | LOW (add fallback) |
| is_first_login never cleared | 🟡 MEDIUM | Incorrect routing logic | OAuthCallback.jsx:211-293 | LOW (add function call) |

**TOTAL CRITICAL ISSUES**: 3
**TOTAL HIGH PRIORITY ISSUES**: 1
**TOTAL MEDIUM PRIORITY ISSUES**: 1

---

## Final Recommendation

**DO NOT PROCEED TO UAT** until the 3 critical issues are resolved:

1. ✅ Fix upsell routing (5 minutes)
2. ✅ Fix SIGNED_IN race condition (30 minutes)
3. ✅ Extend authContext TTL to 7 days (5 minutes)

**Estimated Time to Fix**: **1 hour**

After fixes are deployed, perform manual testing of all 8 journeys using the checklist above.

**Expected Outcome After Fixes**:
- ✅ Coffee tier signups route to Stripe checkout
- ✅ Free tier signups route to dashboard
- ✅ Existing users see tier-appropriate upsells
- ✅ Magic links work for up to 7 days
- ✅ No OAuth callback loops

---

**Analyst**: THE ANALYST
**Date**: 2025-01-19
**Next Review**: After critical fixes deployed
**Confidence Level**: HIGH (95%) - Code paths traced completely, issues reproducible
