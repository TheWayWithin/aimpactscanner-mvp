# Handoff Notes - Testing & Validation Required

## For: USER (Test Plan)

## Issue Identified & Fixed ✅
The root cause was **session detection** - magic links and OAuth create sessions but the signup page wasn't checking for them before showing the signup form.

## Fix Deployed
- Added session detection to Signup.jsx
- If session exists → redirect to oauth-callback
- oauth-callback processes session and routes user appropriately

## Test Plan for User

### Test 1: Magic Link Flow
1. **Navigate** to https://aimpactscanner.com/#/signup
2. **Click** "Continue with Email"
3. **Enter** your email address
4. **Click** "Send Magic Link"
5. **Check email** and click the magic link
6. **Expected Result**:
   - Console shows: "✅ Active session detected on signup page, redirecting to oauth-callback..."
   - Redirects to tier selection page (upsell-coffee)
   - No "Authentication failed" error

### Test 2: Google OAuth Flow
1. **Navigate** to https://aimpactscanner.com/#/signup (fresh incognito)
2. **Click** "Continue with Google"
3. **Complete** Google authentication
4. **Expected Result**:
   - After OAuth: URL should contain access_token in hash
   - App detects OAuth tokens → routes to oauth-callback
   - New users → tier selection page
   - No "Authentication failed" error

### Test 3: GitHub OAuth Flow
1. **Navigate** to https://aimpactscanner.com/#/signup (fresh incognito)
2. **Click** "Continue with GitHub"
3. **Complete** GitHub authentication
4. **Expected Result**:
   - Same as Google OAuth test

## Console Logs to Look For

**On Signup Page Load**:
```
🚀 Signup component mounted
🔍 Current URL: https://aimpactscanner.com/#/signup
```

**If Session Detected (Magic Link Case)**:
```
✅ Active session detected on signup page, redirecting to oauth-callback...
Session user: your@email.com
```

**OAuth Callback Processing**:
```
🔄 OAuthCallback component mounted - Processing OAuth callback...
✅ Session retrieved: [user-id]
🆕 New user detected...
⚠️ No tier selected, redirecting to tier selection...
```

## Success Criteria
- ✅ Magic link works end-to-end
- ✅ Google OAuth works end-to-end
- ✅ GitHub OAuth works end-to-end
- ✅ All flows redirect to tier selection for new users
- ✅ No "Authentication failed" errors
- ✅ Console logs confirm session detection

## If Tests Fail
Document:
1. Which test failed (magic link, Google, GitHub)
2. Complete console output
3. Final URL after failure
4. Error message shown to user
5. Network tab errors (if any)
