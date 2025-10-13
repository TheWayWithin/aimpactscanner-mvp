# OAuth/Magic Link Authentication Root Cause Analysis

**Date**: 2025-10-03
**Analyst**: THE ANALYST (AGENT-11)
**Status**: CRITICAL - 3-Day Debug Cycle
**Confidence Level**: HIGH (85%)

---

## Executive Summary

After comprehensive analysis of the authentication flow, I've identified **multiple converging failure points** that explain why OAuth/magic link authentication consistently fails and routes users to the error page at `/#unified-registration`.

**PRIMARY ROOT CAUSE**: The OAuth callback flow is executing correctly through OAuthCallback.jsx, but **the component throws an error when session is missing**, and **automatic redirect is DISABLED** (line 125 in OAuthCallback.jsx), causing users to stay on the error page indefinitely.

**SECONDARY ROOT CAUSE**: TWO GDPR consent banners are mounting - one from SimpleConsentBanner.jsx and a third-party banner (Enzuzo or similar) - indicating a race condition or conflicting consent management system.

**CRITICAL FINDING**: Console logs show ONLY GDPR-related logging during failed OAuth flows, with NO routing logs, NO session detection logs, and NO auth state change logs. This suggests the application is either:
1. Crashing before authentication code executes
2. Being blocked by consent banner initialization
3. Redirecting to error page before authentication can complete

---

## 1. Objective & Requirements Analysis

### 1.1 Architecture Requirements

From `/docs/Documents/Foundations/architecture.md`:

**Expected Authentication Flow**:
1. User clicks OAuth button (Google/GitHub) or enters email for magic link
2. Supabase redirects to provider OAuth page
3. Provider authenticates user and redirects back to `${origin}/#/oauth-callback`
4. OAuthCallback.jsx processes the session
5. User is routed to appropriate destination (dashboard, tier selection, or results)

**Session Management**:
- JWT-based authentication via Supabase Auth
- Session stored in localStorage with `sb-` prefix
- Email verification required for new signups
- Dual authentication: Magic links + OAuth (Google, GitHub)

**Critical Security Requirements**:
- CSP strict-dynamic with nonce-based script execution
- Row Level Security (RLS) policies
- Email verification before account activation

### 1.2 Expected vs Actual Behavior

**EXPECTED**:
```
OAuth Click → Provider Auth → Redirect to /#oauth-callback →
Session Detection → Routing Logic → Dashboard/Results
```

**ACTUAL**:
```
OAuth Click → Provider Auth → Redirect to /#unified-registration →
NO SESSION DETECTION → Error: "No session found" →
User stuck on error page (auto-redirect DISABLED)
```

---

## 2. Current Implementation Analysis

### 2.1 Authentication Flow Components

#### **Signup.jsx** (OAuth-First Signup)
**Location**: `/src/pages/Signup.jsx`

**Key Logic**:
- Lines 19-38: `checkExistingSession()` - Detects if session exists and redirects to oauth-callback
- Line 28: If session detected → `window.location.hash = 'oauth-callback'` + reload
- **CRITICAL**: This redirect is IMMEDIATE and FORCED with page reload

**Potential Issue**: The forced reload could be:
1. Clearing the session before OAuthCallback processes it
2. Causing the consent banner to re-mount and block authentication
3. Racing with App.jsx's auth state listener

#### **OAuthCallback.jsx** (Authentication Processor)
**Location**: `/src/components/OAuthCallback.jsx`

**Key Logic**:
- Line 29: `supabase.auth.getSession()` - Retrieves session from URL/storage
- Line 36: **IF NO SESSION** → `throw new Error('No session found. Please try signing in again.')`
- Lines 114-132: Error handling with error display
- **Line 125**: `// DON'T auto-redirect - let user see the error` (COMMENTED OUT)

**CRITICAL FINDING**:
```javascript
// setTimeout(() => {
//   if (onNavigate) {
//     onNavigate('unified-registration');
//   } else {
//     window.location.hash = 'unified-registration';
//   }
// }, 3000);
```

**The auto-redirect is DISABLED for debugging**, meaning users are **intentionally stuck** on the error page to allow error visibility.

#### **App.jsx** (Main Routing Logic)
**Location**: `/src/App.jsx`

**Key Logic**:
- Lines 241-261: URL hash detection and routing
- Lines 245-250: **Detects OAuth tokens OR `/oauth-callback` path** and routes to oauth-callback view
- Lines 351-520: `onAuthStateChange` listener with extensive session handling
- **CRITICAL**: Lines 359-362 check if tab was recently hidden and skip auth processing

**Potential Race Condition**:
```javascript
// Line 241: On initial mount
const hash = window.location.hash.slice(1);
if (hash && (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('type=recovery'))) {
  console.log('🔐 ROUTING TO oauth-callback (OAuth tokens detected)');
  setCurrentViewInternal('oauth-callback');
} else if (hash && hash.startsWith('/oauth-callback')) {
  console.log('🔐 ROUTING TO oauth-callback (Magic link redirect detected)');
  setCurrentViewInternal('oauth-callback');
}
```

**BUT**: User reports show they end up at `/#unified-registration`, NOT `/#oauth-callback`.

#### **AuthMethodSelector.jsx** (OAuth Button Handler)
**Location**: `/src/components/AuthMethodSelector.jsx`

**Key Logic**:
- Line 39: `getRedirectUrl()` returns `${window.location.origin}/#/oauth-callback`
- Lines 56-71: Google OAuth configuration with metadata
- Lines 107-118: GitHub OAuth configuration
- Lines 151-161: Magic link configuration

**Potential Issue**: The redirect URL uses `/#/oauth-callback` but user ends up at `/#unified-registration`.

### 2.2 Routing Decision Tree

**App.jsx Initial Load** (Lines 241-298):
1. Check URL hash
2. If contains OAuth tokens → route to `oauth-callback`
3. If is `/oauth-callback` path → route to `oauth-callback`
4. Otherwise → route based on session state

**Auth State Change Listener** (Lines 351-520):
1. Debounce rapid changes (500ms)
2. Check if tab recently hidden → SKIP if true
3. Check email verification
4. Check for pending analysis in localStorage
5. Route to dashboard/results based on context

**CRITICAL FINDING**:
The listener has **multiple exit points** that could bypass authentication:
- Line 362: Tab visibility check
- Line 379-392: Email verification check with sign-out
- Lines 442-474: Pending analysis routing that exits early

---

## 3. Attempted Fixes Analysis

### Fix 1: Supabase Site URL Configuration
**What**: Updated Supabase redirect URL to match application URL
**Result**: No change - users still end at error page
**Analysis**: Configuration correct, not the root cause

### Fix 2: Session Detection in Signup.jsx
**What**: Added `checkExistingSession()` to detect and redirect OAuth sessions
**Result**: Partial success - detects session but reload causes issues
**Analysis**: The forced reload might be clearing the session

### Fix 3: OAuth Token Detection in App.jsx
**What**: Enhanced hash detection to catch `access_token`, `refresh_token`, `type=recovery`
**Result**: Should work but users still end at wrong page
**Analysis**: Detection logic is correct, routing must be failing later

### Fix 4: Magic Link Redirect Detection
**What**: Added detection for `/#/oauth-callback` path (no tokens in URL)
**Result**: Should handle magic links correctly
**Analysis**: Magic links store session in browser, not URL - this is correct

### Fix 5: Extensive Logging
**What**: Added comprehensive console logging throughout auth flow
**Result**: **CRITICAL - Logs show ONLY GDPR logs, NO auth logs**
**Analysis**: Either JavaScript is crashing before logs execute, or page is redirecting before auth code runs

### Fix 6: Disabled Auto-Redirect on Error
**What**: Commented out 3-second auto-redirect in OAuthCallback.jsx error handler
**Result**: Users see error but can't escape without manual action
**Analysis**: Intentional for debugging - THIS IS WHY USERS ARE STUCK

---

## 4. Failure Point Analysis

### 4.1 Evidence-Based Failure Points

#### **Failure Point 1: Missing Session After OAuth Redirect** (85% Confidence)

**Evidence**:
- User lands at `/#unified-registration` (error page)
- Error message: "No session found. Please try signing in again."
- Console shows NO session detection logs
- OAuthCallback.jsx line 36 throws error when session is null

**Analysis**:
The session is either:
1. Not being stored by Supabase after OAuth completion
2. Being cleared by page reload or navigation
3. Not accessible due to localStorage/cookie restrictions
4. Timing out before OAuthCallback can retrieve it

**Root Cause Hypothesis**:
The hash routing system (`/#oauth-callback`) is incompatible with Supabase's OAuth redirect, causing the session to be lost during the redirect.

**Supporting Evidence**:
- Supabase OAuth uses URL fragments (`#access_token=...`)
- React Router's hash mode ALSO uses URL fragments (`#/oauth-callback`)
- These could be conflicting, causing the session data to be stripped

#### **Failure Point 2: Double GDPR Banner Mounting** (75% Confidence)

**Evidence**:
- User reports TWO consent banners appearing
- Console shows ONLY GDPR logs during failed auth
- SimpleConsentBanner.jsx attempts to hide third-party banners (lines 86-94)

**Analysis**:
Two consent management systems are running:
1. SimpleConsentBanner.jsx (custom implementation)
2. Third-party system (Enzuzo based on grep results)

**Code Evidence**:
```javascript
// SimpleConsentBanner.jsx lines 86-94
const banners = document.querySelectorAll(
  '#ez-cookie-notification, .enzuzo-cookiebanner-container, .ez-consent, ' +
  '[id*="cookieyes"], [class*="cookieyes"], [id*="cookie"], [class*="cookie-banner"]'
);
banners.forEach(banner => {
  if (banner !== document.querySelector('[data-testid="consent-banner"]')) {
    banner.style.display = 'none';
    banner.style.visibility = 'hidden';
  }
});
```

**App.jsx Line 1759**:
```javascript
{/* Enzuzo GDPR Integration - Disabled during SimpleConsentBanner testing */}
{/* <EnzuzoIntegration /> */}
```

**Root Cause Hypothesis**:
Enzuzo is STILL loading despite being commented out in App.jsx, possibly through:
1. A script tag in `index.html`
2. A CDN script that's cached
3. Another component loading it
4. Browser extension injecting it

**Impact**:
- Two consent banners create z-index conflicts
- JavaScript execution may be blocked by consent requirements
- Performance degradation from duplicate initialization
- Potential localStorage conflicts

#### **Failure Point 3: Tab Visibility Race Condition** (65% Confidence)

**Evidence**:
- Lines 359-362 in App.jsx skip auth processing if tab was recently hidden
- OAuth flow opens new tab/window, then returns to original tab
- Tab visibility check might incorrectly trigger

**Code Evidence**:
```javascript
if (isTabVisible === false && wasRecentlyHidden && wasRecentlyHidden() && authStateChangeInProgress.current) {
  console.log('👁️ Tab recently hidden and auth change in progress - skipping to prevent duplicates');
  return;
}
```

**Root Cause Hypothesis**:
When OAuth redirects back, the tab might be marked as "recently hidden", causing the auth state change listener to SKIP processing the new session.

#### **Failure Point 4: Hash Routing vs OAuth URL Fragments** (90% Confidence - MOST LIKELY)

**Evidence**:
- Supabase OAuth returns: `https://example.com/#access_token=xxx&refresh_token=yyy`
- React app expects: `https://example.com/#/oauth-callback`
- User actually lands at: `https://example.com/#unified-registration`

**Analysis**:
There's a **fundamental incompatibility** between:
1. **Supabase's OAuth redirect** (uses URL fragment `#access_token=...`)
2. **React Router hash mode** (uses URL fragment `#/route-name`)

**What's Happening**:
1. User clicks Google OAuth
2. Supabase redirects to Google
3. Google authenticates and redirects to: `https://example.com/#access_token=xxx&refresh_token=yyy`
4. React sees the hash and tries to match it to a route
5. No route matches `access_token=xxx&refresh_token=yyy`
6. React defaults to error route: `unified-registration`
7. Session data is in URL but no code is parsing it because we're on wrong route

**Smoking Gun**:
App.jsx lines 245-250 should catch this:
```javascript
if (hash && (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('type=recovery'))) {
  console.log('🔐 ROUTING TO oauth-callback (OAuth tokens detected)');
  setCurrentViewInternal('oauth-callback');
}
```

**BUT user reports show they end at `/#unified-registration`**, which means:
- Either this code isn't running
- Or they're being redirected AFTER this code runs
- Or the hash doesn't contain the expected tokens

#### **Failure Point 5: Forced Page Reload in Signup.jsx** (70% Confidence)

**Evidence**:
- Signup.jsx line 28: `window.location.reload()` after detecting session
- This reload happens BEFORE OAuthCallback can process the session

**Code Evidence**:
```javascript
if (session && !error) {
  console.log('[SIGNUP] ✅ Active session detected, redirecting to oauth-callback...');
  console.log('[SIGNUP] Session user:', session.user.email);
  // Force immediate redirect
  window.location.hash = 'oauth-callback';
  window.location.reload(); // ← THIS RELOAD
}
```

**Root Cause Hypothesis**:
The reload clears the session from memory before the OAuth callback handler can process it, causing OAuthCallback.jsx to throw "No session found" error.

---

## 5. Root Cause Assessment: The Smoking Gun

### 5.1 Most Probable Root Cause (90% Confidence)

**HASH ROUTING CONFLICT WITH OAUTH URL FRAGMENTS**

The application uses hash-based routing (`/#/route`), which is **fundamentally incompatible** with Supabase's OAuth flow that returns tokens in the URL fragment (`/#access_token=xxx`).

**Here's what's happening**:

1. **OAuth Redirect Returns**: `https://aimpactscanner.com/#access_token=eyJ...&refresh_token=ey...`

2. **React Router Interprets**: The hash `access_token=eyJ...&refresh_token=ey...` as a **route path**

3. **No Route Match**: No route in App.jsx matches this path

4. **Default Error Route**: React defaults to `unified-registration` (error page)

5. **Session Lost**: The session tokens are in the URL fragment but OAuthCallback.jsx never executes because the app is on the wrong route

6. **User Stuck**: Auto-redirect disabled (debugging mode), so user sees error page indefinitely

### 5.2 Supporting Evidence Chain

1. **Architectural Evidence**: App.jsx uses hash-based routing throughout
2. **Configuration Evidence**: AuthMethodSelector.jsx returns `/#/oauth-callback` as redirect URL
3. **Behavioral Evidence**: Users land at `/#unified-registration` instead of `/#/oauth-callback`
4. **Log Evidence**: NO routing logs appear, only GDPR logs
5. **Code Evidence**: Auto-redirect disabled in error handler (line 125 OAuthCallback.jsx)

### 5.3 Why Previous Fixes Failed

**All previous fixes operated under the assumption that users were reaching OAuthCallback.jsx**. But they're NOT - they're routing to the error page BEFORE OAuthCallback can execute.

The hash routing detection code (App.jsx lines 245-250) should prevent this, but it's not working because:
- The check runs ONCE on mount
- If ANY other code redirects after mount, this check is bypassed
- The auth state listener has multiple exit points that skip processing

### 5.4 The Double GDPR Banner Mystery

**SECONDARY ROOT CAUSE**: A third-party consent script (likely Enzuzo) is loading despite being commented out in the code.

**Evidence**:
1. SimpleConsentBanner.jsx specifically attempts to hide Enzuzo banners
2. User reports TWO consent popups
3. Console shows ONLY GDPR logs, no auth logs

**Impact**: This exacerbates the OAuth failure by:
- Blocking JavaScript execution until consent is given
- Creating race conditions between consent initialization and auth processing
- Potentially clearing localStorage/cookies before auth can access them

---

## 6. Systematic Fix Strategy

### 6.1 Strategic Approach

**PRINCIPLE**: Fix the routing conflict FIRST, then handle edge cases.

The fix must:
1. **Eliminate hash routing conflict** with OAuth URL fragments
2. **Ensure OAuthCallback executes** when OAuth tokens are present
3. **Handle both OAuth tokens AND magic link redirects**
4. **Remove third-party GDPR conflicts**
5. **Be testable programmatically** without manual user intervention

### 6.2 Recommended Fix (Multi-Layered Defense)

#### **Layer 1: Use Supabase's Built-in Session Detection** (Critical Priority)

**Problem**: Trying to parse URL fragments manually is fragile.

**Solution**: Let Supabase handle it with `onAuthStateChange`:

```javascript
// In App.jsx, BEFORE any routing logic
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔐 AUTH EVENT:', event, 'Session:', !!session);

      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, processing...');

        // Clear any error routes
        if (currentView === 'unified-registration' || currentView === 'login') {
          // OAuth just completed successfully
          const authContext = getAuthContext();

          if (authContext?.pendingAnalysisUrl) {
            // Redirect to results
            setCurrentView('results');
          } else {
            // Redirect to dashboard
            setCurrentView('dashboard');
          }
        }
      }

      if (event === 'USER_UPDATED') {
        // Handle email verification completion
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Why This Works**:
- Supabase Auth SDK automatically parses URL fragments
- `onAuthStateChange` fires when OAuth completes
- No manual URL parsing needed
- Works for both OAuth AND magic links

#### **Layer 2: Remove Hash-Based Routing for OAuth** (High Priority)

**Problem**: Hash routing conflicts with OAuth URL fragments.

**Solution**: Use Supabase's `detectSessionInUrl` option:

```javascript
// In supabaseClient.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true, // Let Supabase handle URL parsing
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
    storageKey: 'aimpactscanner-auth',
  }
});
```

**Then update redirect URL to use query params instead of hash**:

```javascript
// In AuthMethodSelector.jsx
const getRedirectUrl = () => {
  return `${window.location.origin}/auth/callback`; // NO HASH
};
```

**Then add route handling in App.jsx**:

```javascript
// Check pathname, not hash
if (window.location.pathname === '/auth/callback') {
  // Let Supabase onAuthStateChange handle it
  console.log('🔐 OAuth callback detected, waiting for session...');
}
```

#### **Layer 3: Remove Third-Party GDPR Script** (High Priority)

**Problem**: Enzuzo or similar script is loading despite being commented out.

**Solution**: Find and remove all traces:

1. Check `index.html` for script tags:
```bash
grep -r "enzuzo\|cookieyes\|cookie-banner" public/
```

2. Check for CDN scripts in HTML head
3. Check browser's Network tab for external script loads
4. Add CSP rule to block if needed:
```javascript
"script-src 'self' 'strict-dynamic' 'nonce-{nonce}' https://www.googletagmanager.com; "
```

#### **Layer 4: Re-enable Auto-Redirect with Proper Error Handling** (Medium Priority)

**Problem**: Users stuck on error page because redirect is disabled.

**Solution**: Re-enable redirect but with better error messaging:

```javascript
// In OAuthCallback.jsx line 125
// RE-ENABLE the redirect
setTimeout(() => {
  console.warn('Auth failed, redirecting to signup...');
  if (onNavigate) {
    onNavigate('signup'); // Redirect to /signup (OAuth-first)
  } else {
    window.location.hash = 'signup';
  }
}, 3000); // Give user 3 seconds to see error
```

#### **Layer 5: Add Session Recovery Fallback** (Low Priority)

**Problem**: If session is truly lost, user has no recourse.

**Solution**: Check for session in Supabase storage:

```javascript
// In OAuthCallback.jsx, BEFORE throwing error
if (!session) {
  // Try to recover session from storage
  const storedSession = localStorage.getItem('supabase.auth.token');
  if (storedSession) {
    console.log('🔧 Attempting session recovery from storage...');
    try {
      const parsedSession = JSON.parse(storedSession);
      if (parsedSession.currentSession) {
        session = parsedSession.currentSession;
        console.log('✅ Session recovered!');
      }
    } catch (err) {
      console.error('Session recovery failed:', err);
    }
  }

  if (!session) {
    throw new Error('No session found. Please try signing in again.');
  }
}
```

### 6.3 Implementation Priority

1. **CRITICAL**: Layer 1 (Use Supabase's `onAuthStateChange`)
2. **CRITICAL**: Layer 3 (Remove third-party GDPR script)
3. **HIGH**: Layer 2 (Fix redirect URL to avoid hash conflicts)
4. **MEDIUM**: Layer 4 (Re-enable auto-redirect)
5. **LOW**: Layer 5 (Session recovery fallback)

---

## 7. Autonomous Test Plan

### 7.1 Test Strategy

**Objective**: Programmatically verify OAuth flow without manual user testing.

**Approach**: Use Playwright for browser automation to simulate the complete OAuth flow.

### 7.2 Test Plan Execution

#### **Test 1: OAuth Token Detection**

```javascript
// tests/e2e/oauth-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('OAuth Authentication Flow', () => {

  test('should detect OAuth tokens in URL and route correctly', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');

    // Manually inject OAuth token URL (simulating Supabase redirect)
    await page.goto('http://localhost:5173/#access_token=mock_token_12345&refresh_token=mock_refresh_67890&type=recovery');

    // Wait for routing logic to execute
    await page.waitForTimeout(2000);

    // Check current route
    const hash = await page.evaluate(() => window.location.hash);
    console.log('Current hash:', hash);

    // EXPECTED: Should route to oauth-callback
    // ACTUAL: Will route to unified-registration (failure)
    expect(hash).toContain('oauth-callback');
  });

  test('should route to oauth-callback when hash is /oauth-callback', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Simulate magic link redirect
    await page.goto('http://localhost:5173/#/oauth-callback');

    await page.waitForTimeout(2000);

    const hash = await page.evaluate(() => window.location.hash);

    expect(hash).toContain('oauth-callback');
  });

  test('should show GDPR banner on first visit', async ({ page }) => {
    // Clear storage to simulate first visit
    await page.context().clearCookies();
    await page.goto('http://localhost:5173');

    // Check for GDPR banner
    const banner = await page.locator('[data-testid="consent-banner"]');
    await expect(banner).toBeVisible();

    // Check for duplicate banners
    const allBanners = await page.locator('[class*="cookie"], [id*="cookie"]').count();
    console.log('Number of cookie banners:', allBanners);

    // EXPECTED: 1 banner
    // ACTUAL: May show 2 banners
    expect(allBanners).toBe(1);
  });

  test('should complete OAuth flow without errors', async ({ page, context }) => {
    // This test requires actual Supabase OAuth, so we'll mock it

    // 1. Start at signup page
    await page.goto('http://localhost:5173/#/signup');

    // 2. Mock Supabase session
    await context.addInitScript(() => {
      const mockSession = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString()
        }
      };

      // Override Supabase getSession
      window.mockSupabaseSession = mockSession;
    });

    // 3. Navigate to oauth-callback
    await page.goto('http://localhost:5173/#/oauth-callback');

    // 4. Wait for processing
    await page.waitForTimeout(3000);

    // 5. Check we didn't land on error page
    const hash = await page.evaluate(() => window.location.hash);

    expect(hash).not.toContain('unified-registration');
    expect(hash).toContain('dashboard');
  });
});
```

#### **Test 2: Email/Password Fallback**

```javascript
test.describe('Email Authentication Fallback', () => {

  test('should allow signup with email and password', async ({ page }) => {
    await page.goto('http://localhost:5173/#/signup');

    // Click "Continue with Email" button
    await page.click('text=Continue with Email');

    // Fill in email
    await page.fill('[id="magic-link-email"]', 'test@example.com');

    // Submit
    await page.click('text=Send Magic Link');

    // Wait for success message
    await page.waitForSelector('text=Check Your Email', { timeout: 5000 });

    // Verify no errors
    const errorText = await page.locator('text=error').count();
    expect(errorText).toBe(0);
  });
});
```

#### **Test 3: Console Log Capture**

```javascript
test('should log auth events to console', async ({ page }) => {
  const logs = [];

  // Capture console logs
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Navigate to OAuth callback
  await page.goto('http://localhost:5173/#access_token=test123&refresh_token=test456');

  await page.waitForTimeout(3000);

  // Check for expected logs
  const authLogs = logs.filter(log =>
    log.text.includes('ROUTING TO oauth-callback') ||
    log.text.includes('AUTH EVENT') ||
    log.text.includes('Session check')
  );

  console.log('Auth logs captured:', authLogs);

  // EXPECTED: Should see routing logs
  // ACTUAL: May only see GDPR logs
  expect(authLogs.length).toBeGreaterThan(0);
});
```

#### **Test 4: Network Request Capture**

```javascript
test('should make Supabase auth requests', async ({ page }) => {
  const requests = [];

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  await page.goto('http://localhost:5173/#/oauth-callback');
  await page.waitForTimeout(3000);

  // Check for auth requests
  const authRequests = requests.filter(req =>
    req.url.includes('/auth/') || req.url.includes('token')
  );

  console.log('Supabase auth requests:', authRequests);

  expect(authRequests.length).toBeGreaterThan(0);
});
```

### 7.3 Test Execution

**Run all tests**:
```bash
npx playwright test tests/e2e/oauth-flow.spec.js --headed --project=chromium
```

**Expected Results**:
- Test 1 will FAIL (proves hash routing conflict)
- Test 2 will PASS (email fallback works)
- Test 3 will show ONLY GDPR logs (proves code isn't executing)
- Test 4 will show NO auth requests (proves session isn't being processed)

### 7.4 Diagnostic Data Collection

**Strategic Console Logging** (survives minification):

```javascript
// Add to App.jsx line 1 (very first line)
window.DEBUG_OAUTH = true;

// Add to App.jsx useEffect that checks hash
useEffect(() => {
  if (window.DEBUG_OAUTH) {
    console.log('🐛 DEBUG: App mounted');
    console.log('🐛 DEBUG: Hash:', window.location.hash);
    console.log('🐛 DEBUG: Pathname:', window.location.pathname);
    console.log('🐛 DEBUG: Search:', window.location.search);
    console.log('🐛 DEBUG: Full URL:', window.location.href);
  }
}, []);

// Add to every routing decision
if (window.DEBUG_OAUTH) {
  console.log('🐛 DEBUG: Routing to:', viewName);
}
```

**localStorage Debugging**:

```javascript
// Add to OAuthCallback.jsx
useEffect(() => {
  console.log('🔍 LocalStorage keys:', Object.keys(localStorage));
  console.log('🔍 Supabase keys:', Object.keys(localStorage).filter(k => k.startsWith('sb-')));

  const authToken = localStorage.getItem('supabase.auth.token');
  console.log('🔍 Auth token exists:', !!authToken);
}, []);
```

---

## 8. Conclusion

### 8.1 Root Cause Summary

**PRIMARY ROOT CAUSE (90% Confidence)**:
Hash-based routing (`/#/route`) conflicts with Supabase OAuth URL fragments (`/#access_token=...`), causing users to land on the error route instead of the OAuth callback route.

**SECONDARY ROOT CAUSE (75% Confidence)**:
Third-party GDPR consent script (Enzuzo) is loading despite being disabled in code, creating duplicate consent banners and blocking JavaScript execution.

**TERTIARY ROOT CAUSE (65% Confidence)**:
Auto-redirect disabled in error handler (intentional for debugging), causing users to be stuck on error page indefinitely.

### 8.2 Recommended Action Plan

**IMMEDIATE (Today)**:
1. Remove hash from OAuth redirect URL
2. Use Supabase's `onAuthStateChange` exclusively for session detection
3. Find and remove third-party GDPR script

**SHORT-TERM (This Week)**:
1. Implement pathname-based routing for `/auth/callback`
2. Re-enable auto-redirect in error handler
3. Add comprehensive Playwright tests

**LONG-TERM (Next Sprint)**:
1. Consider switching to BrowserRouter (no hash routing)
2. Implement session recovery mechanisms
3. Add monitoring for OAuth success/failure rates

### 8.3 Success Criteria

**Fix is successful when**:
1. Users clicking OAuth buttons land at dashboard or results page
2. NO "No session found" errors appear in OAuthCallback
3. ONLY ONE consent banner appears
4. Console shows routing logs AND auth state change logs
5. Playwright tests pass with 100% success rate

### 8.4 Estimated Fix Time

- **Detection of GDPR script**: 30 minutes
- **Removal of GDPR script**: 15 minutes
- **Redirect URL fix**: 1 hour
- **onAuthStateChange integration**: 2 hours
- **Testing and validation**: 2 hours
- **TOTAL**: 6 hours (1 day)

**Confidence in Fix Success**: 85%

---

## Appendix A: File Reference

**Files Requiring Changes**:
1. `/src/lib/supabaseClient.js` - Add `detectSessionInUrl: true`
2. `/src/components/AuthMethodSelector.jsx` - Change redirect URL from `/#/oauth-callback` to `/auth/callback`
3. `/src/App.jsx` - Replace hash detection with pathname detection
4. `/src/components/OAuthCallback.jsx` - Re-enable auto-redirect
5. `/public/index.html` - Remove third-party GDPR scripts (if present)

**Files for Reference Only** (no changes needed):
1. `/docs/Documents/Foundations/architecture.md` - Architecture requirements
2. `/src/pages/Signup.jsx` - OAuth-first signup logic
3. `/src/components/SimpleConsentBanner.jsx` - GDPR consent implementation

---

## Appendix B: Evidence Repository

**Console Log Evidence**:
- User reports: "Console shows ONLY GDPR logs"
- Expected: Routing logs, session detection logs, auth state change logs
- Actual: Only consent banner initialization

**URL Evidence**:
- Expected after OAuth: `https://aimpactscanner.com/#/oauth-callback`
- Actual after OAuth: `https://aimpactscanner.com/#unified-registration`
- Indicates: Routing failure before OAuthCallback executes

**UI Evidence**:
- User reports: "TWO GDPR consent popups"
- Expected: One consent banner (SimpleConsentBanner)
- Actual: Two banners (custom + third-party)
- Indicates: Script conflict

**Code Evidence**:
- OAuthCallback.jsx line 125: Auto-redirect commented out
- App.jsx lines 245-250: Token detection present but not working
- SimpleConsentBanner.jsx lines 86-94: Attempts to hide Enzuzo banners

---

**END OF ANALYSIS**
