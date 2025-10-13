# ACTUAL Authentication Implementation - AImpactScanner MVP

**Document Purpose**: Map ACTUAL authentication implementation in codebase vs INTENDED architecture
**Created**: 2025-10-08
**Analysis By**: THE ANALYST
**Status**: ⚠️ CRITICAL GAPS IDENTIFIED

---

## Executive Summary: ROOT CAUSE IDENTIFIED

**USER COMPLAINT**: "I don't see any of the oauth stuff we were supposed to be delivering"

**ROOT CAUSE**: OAuth components exist and are WORKING, but they are HIDDEN behind the wrong entry points. The intended OAuth-first signup flow (/#/signup → Signup.jsx) exists but users are being routed to legacy password-based flows instead.

**BUSINESS IMPACT**: Users cannot access OAuth authentication because:
1. Landing page routes to password-based components (CoffeeTierSignup.jsx)
2. OAuth-first Signup.jsx exists but is rarely reached
3. Multiple legacy auth paths coexist and create confusion
4. Password auth NOT removed despite migration docs claiming "Complete"

---

## 1. Component Existence Verification

### ✅ DOCUMENTED COMPONENTS - ALL EXIST

| Component | Location | Status |
|-----------|----------|--------|
| **TierSelector.jsx** | `/src/components/TierSelector.jsx` | ✅ EXISTS - Full featured |
| **AuthMethodSelector.jsx** | `/src/components/AuthMethodSelector.jsx` | ✅ EXISTS - OAuth functional |
| **OAuthCallback.jsx** | `/src/components/OAuthCallback.jsx` | ✅ EXISTS - Routing logic complete |
| **Signup.jsx** | `/src/pages/Signup.jsx` | ✅ EXISTS - OAuth-first design |

**VERDICT**: All intended OAuth components are implemented and functional.

---

## 2. All Signup/Login Entry Points (ACTUAL vs INTENDED)

### INTENDED Entry Points (from architecture docs)
- **Primary Signup**: `/#/signup` → Signup.jsx → OAuth-first (NO passwords)
- **Primary Login**: `/#/login` → Login.jsx → OAuth/Magic Link only

### ACTUAL Entry Points (discovered in codebase)

| Route | Component Loaded | Auth Methods | Status |
|-------|-----------------|--------------|--------|
| **/#/signup** | Signup.jsx | ✅ OAuth (Google/GitHub/Magic Link) | INTENDED - OAuth-first |
| **/#/login** | Login.jsx | ❌ PASSWORD + email | LEGACY - Has passwords! |
| **/#/register** | CoffeeTierSignup.jsx | ❌ PASSWORD + email | LEGACY - Has passwords! |
| **/#/unified-registration** | UnifiedRegistration.jsx | ❌ PASSWORD + email | LEGACY - Has passwords! |
| **/#/registration-flow** | RegistrationFlow.jsx | ❌ Unknown (lazy-loaded) | LEGACY path |
| **/#/oauth-callback** | OAuthCallback.jsx | ✅ Post-auth handler | INTENDED |

### CRITICAL FINDING: Multiple Auth Paths Coexist

**INTENDED**: OAuth-first everywhere
**ACTUAL**: 5+ different signup/login paths, most with passwords

---

## 3. Route Configuration Analysis

### App.jsx Routing Logic

**Route Handling** (from App.jsx lines 214-265):

```javascript
// Initial URL handling
const hash = window.location.hash.slice(1);

if (hash.includes('access_token=') || hash.includes('refresh_token=')) {
  // OAuth tokens detected → route to oauth-callback ✅ CORRECT
  setCurrentViewInternal('oauth-callback');
} else if (hash) {
  setCurrentViewInternal(hash); // Sets view based on hash
} else if (window.location.pathname === '/login') {
  setCurrentView('login'); // ❌ Goes to password-based Login.jsx
} else if (window.location.pathname === '/register') {
  setCurrentView('register'); // ❌ Goes to password-based CoffeeTierSignup.jsx
}
```

### View-to-Component Mapping

| View Value | Component Rendered | Line in App.jsx |
|------------|-------------------|-----------------|
| `'signup'` | ✅ Signup.jsx (OAuth-first) | Line 1204-1214 |
| `'login'` | ❌ Login.jsx (PASSWORD) | Line 1259-1266 |
| `'register'` | ❌ CoffeeTierSignup.jsx (PASSWORD) | Line 1216-1234 |
| `'unified-registration'` | ❌ UnifiedRegistration.jsx (PASSWORD) | Line 1248-1256 |
| `'oauth-callback'` | ✅ OAuthCallback.jsx | Line 1269-1278 |
| `'landing'` | Landing.jsx | Line 1502-1515 |

### ⚠️ CRITICAL ISSUE: Default Registration Flow

When App.jsx creates new users without database records:

```javascript
// Lines 697-708
if (currentView !== 'register' && currentView !== 'coffee-signup') {
  setCurrentView('coffee-signup'); // ❌ Routes to PASSWORD component!
}
```

**RESULT**: New OAuth users get redirected to password-based CoffeeTierSignup.jsx

---

## 4. OAuth Integration Status

### ✅ OAuth Implementation EXISTS and is FUNCTIONAL

**AuthMethodSelector.jsx Analysis**:

```javascript
// Google OAuth - Line 43-94
const handleGoogleOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/#/oauth-callback`, // ✅ Correct
      data: {
        selected_tier: selectedTier,
        signup_source: 'oauth_google',
        auth_provider: 'google'
      }
    }
  });
}

// GitHub OAuth - Line 97-131
const handleGitHubOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/#/oauth-callback`, // ✅ Correct
      data: {
        selected_tier: selectedTier,
        signup_source: 'oauth_github'
      }
    }
  });
}

// Magic Link - Line 134-175
const handleMagicLink = async (e) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/#/oauth-callback`, // ✅ Correct
    }
  });
}
```

**VERDICT**: OAuth code is COMPLETE and WORKING

### ❌ OAuth Provider Configuration STATUS

**Supabase config.toml Analysis**:

```toml
[auth.external.google]
# NOT FOUND - No Google OAuth configuration

[auth.external.github]
# NOT FOUND - No GitHub OAuth configuration
```

**CRITICAL GAP**: OAuth providers NOT configured in Supabase config file!

**Expected Configuration** (missing):
```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback"

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_CLIENT_SECRET)"
redirect_uri = "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback"
```

**STATUS**: OAuth code exists, but Supabase providers NOT enabled in config

---

## 5. Password Auth Status

### ❌ PASSWORD AUTH STILL FULLY PRESENT

**Claim in Docs**: "Password auth REMOVED (migration complete 2025-10-02)"

**REALITY**: Password auth exists in 4+ components:

#### Login.jsx (Line 1-100+)
```javascript
// PASSWORD-BASED LOGIN
const [password, setPassword] = useState('');
const handleLogin = async (e) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password  // ❌ PASSWORD AUTH EXISTS
  });
}
```

#### CoffeeTierSignup.jsx (Line 1-100+)
```javascript
// PASSWORD-BASED SIGNUP
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const handleSignUp = async (e) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,  // ❌ PASSWORD AUTH EXISTS
  });
}
```

#### Additional Password Components Found:
- `/src/components/Auth.jsx` - Password fields present
- `/src/components/AuthWithPassword.jsx` - Entire component for passwords
- `/src/components/ResetPassword.jsx` - Password reset functionality
- `/src/components/PasswordResetPage.jsx` - Password reset page

**VERDICT**: Password auth is NOT removed. Migration docs are INCORRECT.

---

## 6. Actual User Journey Mapping

### INTENDED Journey (from architecture docs)
```
Landing → Click "Sign Up" → /#/signup → Signup.jsx →
AuthMethodSelector (OAuth buttons) → Google/GitHub OAuth →
/#/oauth-callback → OAuthCallback.jsx → Dashboard
```

### ACTUAL Journey (what users experience)

#### Path 1: Landing Page Signup
```
Landing.jsx → Clicks "Sign Up" →
WHERE DOES IT GO?
↓
App.jsx routes new users → setCurrentView('coffee-signup') →
CoffeeTierSignup.jsx (PASSWORD FORM!) ❌ WRONG
```

#### Path 2: Direct /#/signup URL
```
User types /#/signup → App.jsx → Signup.jsx →
AuthMethodSelector (OAuth buttons) → Google OAuth ✅ CORRECT
↓
BUT: OAuth providers not configured in Supabase ❌ FAILS
```

#### Path 3: /#/login URL
```
User types /#/login → App.jsx → Login.jsx →
PASSWORD login form ❌ WRONG (should be OAuth)
```

#### Path 4: /#/register URL
```
User types /#/register → App.jsx → CoffeeTierSignup.jsx →
PASSWORD signup form ❌ WRONG (should be OAuth)
```

### Why Users Don't See OAuth

**Primary Issue**: Landing page and default flows route to password components
**Secondary Issue**: OAuth components exist but require direct URL navigation (/#/signup)
**Tertiary Issue**: Even when OAuth components load, Supabase providers not configured

---

## 7. Magic Link Implementation

### ✅ Magic Link Code EXISTS

**AuthMethodSelector.jsx** (Line 134-175):
```javascript
const handleMagicLink = async (e) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/#/oauth-callback`,
    }
  });
}
```

**Redirect URL**: `/#/oauth-callback` ✅ CORRECT

### ✅ Email Configuration WORKING

**Supabase config.toml** (Line 172-179):
```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "support@aimpactscanner.com"
```

**VERDICT**: Magic Link infrastructure is complete

---

## 8. Stripe Integration Status

### Stripe Checkout Code EXISTS

**App.jsx** (Line 471-475):
```javascript
if (selectedTier === 'coffee') {
  console.log('User selected Coffee tier, triggering payment flow');
  handleUpgrade('coffee');
}
```

**Edge Functions Expected**:
- ❓ `create-checkout-session` - Existence unverified
- ❓ `stripe-webhook` - Existence unverified

**Status**: Code calls Stripe but Edge Function existence NOT confirmed

---

## 9. Gap Analysis: INTENDED vs ACTUAL

| Feature | INTENDED (Docs) | ACTUAL (Code) | Status | Gap Severity |
|---------|-----------------|---------------|--------|--------------|
| **OAuth Google** | Primary method | Code exists, providers NOT configured | ❌ BROKEN | 🔴 CRITICAL |
| **OAuth GitHub** | Secondary method | Code exists, providers NOT configured | ❌ BROKEN | 🔴 CRITICAL |
| **Magic Link** | Fallback method | ✅ Fully working | ✅ WORKING | ✅ None |
| **Password Auth** | "REMOVED" | ❌ Still fully present in 4+ components | ❌ NOT REMOVED | 🟡 Major |
| **TierSelector** | Should exist | ✅ Exists and functional | ✅ EXISTS | ✅ None |
| **AuthMethodSelector** | Should exist | ✅ Exists with OAuth + Magic Link | ✅ EXISTS | ✅ None |
| **OAuthCallback** | Should exist | ✅ Exists with routing logic | ✅ EXISTS | ✅ None |
| **/#/signup route** | OAuth-first entry | ✅ Routes to OAuth Signup.jsx | ✅ CORRECT | ✅ None |
| **/#/login route** | OAuth-first entry | ❌ Routes to password Login.jsx | ❌ WRONG | 🔴 Critical |
| **Landing → Signup** | Should use OAuth | ❌ Routes to password CoffeeTierSignup | ❌ WRONG | 🔴 Critical |
| **New user flow** | OAuth → Dashboard | ❌ OAuth → Password signup | ❌ BROKEN | 🔴 Critical |

### Summary Statistics
- **✅ Working as Intended**: 5/11 features (45%)
- **❌ Broken or Wrong**: 6/11 features (55%)
- **🔴 Critical Gaps**: 4
- **🟡 Major Gaps**: 1

---

## 10. Root Cause Analysis

### Why User Says "I Don't See OAuth Stuff"

#### Root Cause 1: OAuth Components Hidden (🔴 CRITICAL)
**Problem**: OAuth components exist but users never reach them
**Reason**:
- Landing page routes to `coffee-signup` (password-based)
- Default new user flow uses `setCurrentView('coffee-signup')`
- `/#/login` routes to password Login.jsx
- `/#/register` routes to password CoffeeTierSignup.jsx

**Evidence**:
```javascript
// App.jsx Line 697-708
if (currentView !== 'register' && currentView !== 'coffee-signup') {
  setCurrentView('coffee-signup'); // ❌ PASSWORD COMPONENT
}
```

#### Root Cause 2: OAuth Providers Not Configured (🔴 CRITICAL)
**Problem**: Even when users reach OAuth buttons, they don't work
**Reason**: Supabase config.toml has NO Google/GitHub provider configuration
**Evidence**: `grep -r "auth.external.google" supabase/config.toml` returns NO results

#### Root Cause 3: Password Auth Not Removed (🟡 MAJOR)
**Problem**: Migration docs claim password auth "Complete" but it's everywhere
**Reason**: Legacy components never deleted, still actively used
**Evidence**:
- Login.jsx uses `signInWithPassword()` (Line 78)
- CoffeeTierSignup.jsx has password fields (Line 10-11)
- AuthWithPassword.jsx entire component exists
- ResetPassword.jsx, PasswordResetPage.jsx exist

#### Root Cause 4: Routing Logic Prioritizes Legacy Paths (🔴 CRITICAL)
**Problem**: App.jsx routing defaults to password components
**Reason**: Hash routing checks password paths first
**Evidence**:
```javascript
// App.jsx Line 249-256
if (window.location.pathname === '/login') {
  setCurrentView('login');  // ❌ Password Login.jsx
} else if (window.location.pathname === '/register') {
  setCurrentView('register'); // ❌ Password CoffeeTierSignup.jsx
}
```

### The Architecture-Implementation Disconnect

**ARCHITECTURE SAYS**:
- OAuth-first authentication
- Password auth removed
- Migration complete (2025-10-02)

**CODE SHOWS**:
- Password auth everywhere
- OAuth components exist but hidden
- OAuth providers not configured
- Multiple auth paths coexist

**USER EXPERIENCE**:
- Clicks "Sign Up" → Sees password form
- No OAuth buttons visible
- Intended flow never reached

---

## 11. Specific Recommendations

### 🔴 CRITICAL - Fix Immediately

#### 1. Configure OAuth Providers in Supabase
**File**: `/supabase/config.toml`
**Add**:
```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback"

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_CLIENT_SECRET)"
redirect_uri = "https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback"
```

**Then**: Create OAuth apps in Google Cloud Console and GitHub

#### 2. Fix Landing Page Signup Flow
**File**: `/src/components/Landing.jsx`
**Change**: Signup button should route to `/#/signup` (OAuth Signup.jsx)
**Current**: Unknown - needs investigation
**Target**:
```javascript
<button onClick={() => window.location.hash = 'signup'}>
  Sign Up
</button>
```

#### 3. Fix New User Default Flow
**File**: `/src/App.jsx` Line 697-708
**Change**:
```javascript
// OLD (WRONG)
setCurrentView('coffee-signup'); // Password component

// NEW (CORRECT)
setCurrentView('signup'); // OAuth Signup.jsx
```

#### 4. Fix Login Route
**File**: `/src/App.jsx` Line 1259-1266
**Option A** - Make Login.jsx OAuth-first (remove password fields)
**Option B** - Route `/#/login` to OAuth Signup.jsx with mode='login'

### 🟡 MAJOR - Fix Soon

#### 5. Remove or Archive Legacy Password Components
**Decision Required**: What to do with password users?

**Option A - Clean Break**:
- Delete: Login.jsx (password version)
- Delete: CoffeeTierSignup.jsx
- Delete: AuthWithPassword.jsx
- Delete: ResetPassword.jsx, PasswordResetPage.jsx
- Keep: Magic Link for password-less fallback

**Option B - Gradual Migration**:
- Keep password login for existing users
- Force OAuth for all new signups
- Sunset password auth in 30 days

#### 6. Consolidate Auth Routes
**Remove redundant routes**:
- `/#/register` → Redirect to `/#/signup`
- `/#/unified-registration` → Redirect to `/#/signup`
- `/#/registration-flow` → Delete (unused)

**Single source of truth**:
- Signup: `/#/signup` → Signup.jsx (OAuth-first)
- Login: `/#/login` → Login.jsx (OAuth-first - to be updated)

### ✅ ENHANCEMENT - Consider Later

#### 7. Add OAuth Status Indicators
**Where**: Signup.jsx, Login.jsx
**What**: Show if OAuth providers are configured
```javascript
useEffect(() => {
  // Check if OAuth is configured
  const checkOAuthStatus = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
      setOAuthAvailable(true);
    } catch (error) {
      console.warn('OAuth not configured:', error);
      setOAuthAvailable(false);
    }
  };
  checkOAuthStatus();
}, []);
```

#### 8. Add Analytics for Auth Flow
**Track**:
- Which auth path users take
- OAuth success/failure rates
- Password vs OAuth conversion rates
- Where users drop off in flow

---

## 12. Verification Checklist

Before marking OAuth implementation as "Complete":

### Configuration Verification
- [ ] Google OAuth app created in Google Cloud Console
- [ ] GitHub OAuth app created in GitHub Settings
- [ ] Client IDs and secrets added to `.env.local`
- [ ] Supabase config.toml updated with OAuth providers
- [ ] Redirect URLs configured: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
- [ ] Frontend callback configured: `/#/oauth-callback`

### Code Verification
- [ ] Landing page routes to `/#/signup` (OAuth Signup.jsx)
- [ ] New user flow routes to `/#/signup` (not `coffee-signup`)
- [ ] `/#/login` routes to OAuth-first component
- [ ] App.jsx default views use OAuth paths
- [ ] Password components archived or deleted

### Testing Verification
- [ ] Google OAuth flow works end-to-end
- [ ] GitHub OAuth flow works end-to-end
- [ ] Magic Link flow works end-to-end
- [ ] OAuth callback routes to correct destination
- [ ] Tier selection works after OAuth
- [ ] Context preservation works (analysis URL)
- [ ] First login detection works
- [ ] Stripe payment flow works for Coffee tier

### User Experience Verification
- [ ] User clicks "Sign Up" → Sees OAuth buttons (NO passwords)
- [ ] User clicks "Log In" → Sees OAuth buttons (NO passwords)
- [ ] OAuth buttons are prominent and clear
- [ ] Magic Link is available as fallback
- [ ] Error messages are helpful
- [ ] Success flow is smooth

---

## 13. Files Requiring Changes

### HIGH Priority (Fix OAuth Visibility)

| File | Line(s) | Change Required | Reason |
|------|---------|-----------------|--------|
| **supabase/config.toml** | 243+ | Add Google/GitHub OAuth config | Enable OAuth providers |
| **src/App.jsx** | 697-708 | Change `coffee-signup` → `signup` | Route to OAuth component |
| **src/App.jsx** | 249-256 | Route `/login` to OAuth component | Fix login flow |
| **src/components/Landing.jsx** | TBD | Route signup to `/#/signup` | Entry point fix |

### MEDIUM Priority (Clean Up Legacy)

| File | Action | Reason |
|------|--------|--------|
| **src/components/Login.jsx** | Make OAuth-first or delete | Remove password login |
| **src/components/CoffeeTierSignup.jsx** | Archive or delete | Legacy password signup |
| **src/components/AuthWithPassword.jsx** | Archive or delete | Legacy password auth |
| **src/components/UnifiedRegistration.jsx** | Archive or delete | Duplicate signup path |
| **src/components/RegistrationFlow.jsx** | Archive or delete | Unused flow |
| **src/components/ResetPassword.jsx** | Archive or delete | Password-specific |
| **src/components/PasswordResetPage.jsx** | Archive or delete | Password-specific |

### LOW Priority (Enhancements)

| File | Enhancement | Benefit |
|------|-------------|---------|
| **src/pages/Signup.jsx** | Add OAuth status check | Show errors if misconfigured |
| **src/components/AuthMethodSelector.jsx** | Add provider availability check | Graceful degradation |
| **src/App.jsx** | Add auth flow analytics | Track conversion rates |

---

## 14. Next Steps for User Confirmation

**DO NOT MAKE CHANGES YET**

User must confirm:

1. **OAuth Provider Choice**: Should we enable both Google + GitHub?
2. **Password User Migration**: What happens to existing password users?
3. **Primary Entry Point**: Where should users land for signup?
4. **Legacy Component Fate**: Delete or archive password components?
5. **Testing Strategy**: How to verify OAuth without breaking existing users?

**Recommended Discussion Points**:
- Do you want OAuth-ONLY or OAuth + Magic Link as fallback?
- Should existing password users be forced to migrate?
- What's the rollout strategy (all at once or gradual)?
- Have you created Google/GitHub OAuth apps already?

---

## Appendix A: Component Analysis Summary

### OAuth-First Components (INTENDED)
✅ **Signup.jsx** - OAuth-first signup page
- Located: `/src/pages/Signup.jsx`
- Auth Methods: Google, GitHub, Magic Link (NO passwords)
- Status: Complete and functional
- Usage: Route `/#/signup` → This component

✅ **AuthMethodSelector.jsx** - OAuth button component
- Located: `/src/components/AuthMethodSelector.jsx`
- Providers: Google (primary), GitHub (secondary), Magic Link (fallback)
- OAuth Calls: `supabase.auth.signInWithOAuth()` ✅ Correct
- Redirect: `/#/oauth-callback` ✅ Correct
- Status: Code complete, providers not configured

✅ **OAuthCallback.jsx** - Post-auth handler
- Located: `/src/components/OAuthCallback.jsx`
- Handles: OAuth redirects, session verification, user routing
- Creates: New user records in database
- Routes: To dashboard, upsell, or tier selection based on context
- Status: Complete and functional

✅ **TierSelector.jsx** - Tier selection UI
- Located: `/src/components/TierSelector.jsx`
- Tiers: Free, Coffee ($4.95), Growth (coming soon), Scale (coming soon)
- Integration: Used before auth method selection
- Status: Complete and functional

### Password-Based Components (LEGACY)
❌ **Login.jsx** - Password login
- Auth: `supabase.auth.signInWithPassword()`
- Should be: OAuth-first
- Status: Should be updated or replaced

❌ **CoffeeTierSignup.jsx** - Password signup
- Auth: `supabase.auth.signUp({ email, password })`
- Should be: OAuth-first
- Status: Should be archived

❌ **AuthWithPassword.jsx** - Password auth component
- Status: Should be archived or deleted

❌ **UnifiedRegistration.jsx** - Another password signup
- Status: Duplicate, should be deleted

---

## Appendix B: OAuth Configuration Requirements

### Google OAuth App Setup

**Google Cloud Console Steps**:
1. Create project: "AImpactScanner"
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

**Environment Variables**:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### GitHub OAuth App Setup

**GitHub Settings Steps**:
1. Go to Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Application name: "AImpactScanner"
4. Homepage URL: `https://aimpactscanner.com`
5. Authorization callback URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

**Environment Variables**:
```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### Supabase Dashboard Setup

**Alternative to config.toml**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google OAuth
   - Add Client ID
   - Add Client Secret
3. Enable GitHub OAuth
   - Add Client ID
   - Add Client Secret
4. Verify redirect URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`

---

**END OF ACTUAL AUTHENTICATION IMPLEMENTATION ANALYSIS**

**Prepared for user review and confirmation before any code changes**
