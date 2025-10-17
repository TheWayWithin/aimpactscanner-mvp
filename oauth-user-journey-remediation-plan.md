# OAuth User Journey Remediation Plan

**Date**: 2025-10-15
**Issue**: OAuth flow creates duplicate accounts for existing users and bypasses tier selection
**Priority**: 🔴 CRITICAL - Breaks core business logic
**Status**: Investigation Complete, Ready for Implementation

---

## Executive Summary

The OAuth authentication flow has **LOST critical business logic** that differentiates between:
1. **New users** (should select tier, create account)
2. **Existing users** (should recognize account, redirect to appropriate dashboard/upsell)

### Current Broken Behavior
- ✅ OAuth authentication works (Google, GitHub)
- ❌ Always treats users as "new" → creates duplicate accounts
- ❌ Never enforces tier selection during signup
- ❌ Redirects to #landing instead of proper destinations
- ❌ `is_first_login` flag not being used correctly

### Expected Correct Behavior
- ✅ Recognize existing users → redirect to tier-based upsell
- ✅ New users without tier → force tier selection before account creation
- ✅ New users with tier → create account, route to appropriate destination
- ✅ Proper post-authentication routing based on user state

---

## Root Cause Analysis

### The Problem Chain

**STEP 1: Signup.jsx** (Line 65)
```javascript
selectedTier={null} // No tier selected yet - OAuth first!
```
- **Design Intent**: OAuth-first flow without upfront tier selection
- **Reality**: This creates users WITHOUT tier selection

**STEP 2: OAuthCallback.jsx** (Lines 80-106)
```javascript
const userData = await getUserData(session.user.id);

if (!userData) {
  // New user - check if they selected a tier
  const selectedTier = authContext?.selectedTier || session.user.user_metadata?.selected_tier || null;

  if (!selectedTier) {
    // Redirects to upsell-coffee
    window.location.hash = 'dashboard'; // ⚠️ FALLBACK
  }
}
```
- **Problem**: `getUserData()` returns `null` for EXISTING users who don't have database records yet
- **Why**: Database trigger creates users async, but OAuth callback checks immediately
- **Result**: Existing users treated as "new" → creates duplicate accounts

**STEP 3: useUserInitializer.js** (Lines 144-191)
```javascript
if (selectedTier === 'free') {
  // Create user in database
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .upsert({ id: userId, email: userEmail, tier: 'free', ... })
}
```
- **Problem**: Auto-creates "free" accounts when no tier selected
- **Expected**: Should REQUIRE tier selection before account creation
- **Result**: Business logic bypassed, users get free tier without choosing

**STEP 4: Database Trigger** (Migration 018_consolidate_user_creation.sql, Line 57)
```sql
tier: COALESCE(NEW.raw_user_meta_data->>'tier', 'free')
```
- **Problem**: Defaults to 'free' tier if no tier in user_metadata
- **Expected**: Should NOT create account without explicit tier selection
- **Result**: Every OAuth signup becomes a free account

---

## The Lost Business Logic

### INTENDED User Journey (from architecture docs)

#### New User Signup Flow
```
1. Landing page → "Get Started" button
2. User clicks "Sign up with Google/GitHub"
3. ⚠️ BEFORE OAuth: TierSelector component appears
4. User MUST select tier (Free, Coffee, Growth, Scale)
5. Store selectedTier in authContext localStorage
6. THEN proceed with OAuth authentication
7. OAuth callback reads selectedTier from authContext
8. If tier = 'coffee': redirect to Stripe checkout
9. If tier = 'free': create account, redirect to /analyze
10. Clear authContext after use
```

#### Existing User Login Flow
```
1. User clicks "Sign in with Google/GitHub"
2. OAuth authentication completes
3. Check if user exists in database (getUserData)
4. If exists AND is_first_login = false:
   → Redirect to tier-based upsell (getPostLoginDestination)
   → Free tier: /upsell/coffee
   → Coffee tier: /upsell/growth
   → etc.
5. If exists AND is_first_login = true:
   → Treat as signup (getPostSignupDestination)
   → Check for pending analysis
   → Route accordingly
```

### ACTUAL Implementation (what's broken)

#### Current Signup Flow
```
1. Landing page → "Get Started" button
2. User clicks "Sign up with Google/GitHub"
3. ❌ NO TierSelector - goes straight to OAuth
4. ❌ selectedTier = null (never stored)
5. OAuth authentication completes
6. OAuthCallback checks getUserData → returns null (async trigger)
7. ❌ Creates user with tier = 'free' (default fallback)
8. ❌ Redirects to #landing (wrong)
9. ❌ Business logic completely bypassed
```

#### Current Login Flow
```
1. User clicks "Sign in with Google/GitHub"
2. OAuth authentication completes
3. OAuthCallback checks getUserData
4. ❌ Returns null for existing users (timing issue)
5. ❌ Treats existing user as "new"
6. ❌ Creates DUPLICATE account with tier = 'free'
7. ❌ Redirects to #landing
8. ❌ Original account ignored
```

---

## Specific Issues Identified

### Issue 1: Missing Tier Selection Component
**Location**: Signup.jsx (Line 64-69)
**Current Code**:
```javascript
<AuthMethodSelector
  selectedTier={null} // No tier selected yet - OAuth first!
  mode="signup"
/>
```

**Problem**:
- Users never see TierSelector
- No tier selection before OAuth
- Default 'free' tier always applied

**Solution**: Add TierSelector BEFORE AuthMethodSelector

---

### Issue 2: getUserData() Timing Issue
**Location**: OAuthCallback.jsx (Line 80)
**Current Code**:
```javascript
const userData = await getUserData(session.user.id);

if (!userData) {
  // Treats as new user ❌
}
```

**Problem**:
- Database trigger creates user async
- OAuth callback checks immediately
- Returns null for existing users
- Creates duplicate accounts

**Solution**: Add retry logic with timeout, check auth.users table directly

---

### Issue 3: Automatic Free Tier Creation
**Location**: useUserInitializer.js (Lines 144-191)
**Current Code**:
```javascript
if (selectedTier === 'free') {
  // Create user in database
  const { data: newUser } = await supabase
    .from('users')
    .upsert({ tier: 'free', ... })
}
```

**Problem**:
- Creates free accounts without user consent
- Bypasses tier selection requirement
- Business logic violation

**Solution**: Require explicit tier selection, don't auto-create

---

### Issue 4: Wrong Redirect Destinations
**Location**: OAuthCallback.jsx (Lines 103, 146)
**Current Code**:
```javascript
// Line 103: Fallback for new users without tier
window.location.hash = 'dashboard'; // ❌ Should be tier selection

// Line 146: Existing user login
window.location.hash = 'dashboard'; // ❌ Should be tier-based upsell
```

**Problem**:
- All users go to #landing (set by App.jsx)
- Tier-based routing functions exist but not used
- is_first_login flag ignored

**Solution**: Use getPostLoginDestination and getPostSignupDestination properly

---

### Issue 5: is_first_login Flag Not Used
**Location**: OAuthCallback.jsx (entire component)
**Current Code**: No reference to is_first_login

**Problem**:
- Flag exists in database but never checked
- Can't differentiate first login from subsequent logins
- Routing logic incomplete

**Solution**: Check is_first_login to determine if signup or login flow

---

## Strategic Remediation Plan

### Phase 1: Add Tier Selection to Signup Flow ⚡ CRITICAL

**Objective**: Force tier selection BEFORE OAuth authentication

**Steps**:
1. **Modify Signup.jsx**:
   - Add state: `const [selectedTier, setSelectedTier] = useState(null)`
   - Add TierSelector component ABOVE AuthMethodSelector
   - Only show AuthMethodSelector AFTER tier selected
   - Store selectedTier in authContext before OAuth

2. **Update authRouting.js**:
   - Modify `storeAuthContext` to include tier
   - Add validation to prevent OAuth without tier

3. **Test**:
   - User should see TierSelector first
   - OAuth buttons disabled until tier selected
   - selectedTier stored in localStorage before OAuth redirect

**Files to Modify**:
- `src/pages/Signup.jsx` (add TierSelector logic)
- `src/utils/authRouting.js` (validate authContext has tier)

**Success Criteria**:
- ✅ New users cannot proceed to OAuth without selecting tier
- ✅ selectedTier stored in authContext before OAuth redirect
- ✅ Free tier requires explicit user selection

---

### Phase 2: Fix getUserData() Timing Issue ⚡ CRITICAL

**Objective**: Reliably detect existing users vs new users

**Steps**:
1. **Add Direct Auth Check in OAuthCallback.jsx**:
   ```javascript
   // Check auth.users table directly for user creation timestamp
   const { data: authUser } = await supabase.auth.getUser();
   const isNewUser = (Date.now() - new Date(authUser.created_at)) < 60000; // < 1 min
   ```

2. **Add Retry Logic for getUserData**:
   ```javascript
   let userData = await getUserData(session.user.id);

   if (!userData && !isNewUser) {
     // Existing user but userData not found - retry 3 times
     for (let i = 0; i < 3; i++) {
       await new Promise(resolve => setTimeout(resolve, 500));
       userData = await getUserData(session.user.id);
       if (userData) break;
   }
   ```

3. **Update Logic**:
   ```javascript
   if (!userData && !isNewUser) {
     // Existing user, database record not ready - wait for trigger
     showLoading("Setting up your account...");
     // Retry logic
   } else if (!userData && isNewUser) {
     // Truly new user - proceed with signup flow
   } else {
     // Existing user with data - proceed with login flow
   }
   ```

**Files to Modify**:
- `src/components/OAuthCallback.jsx` (add auth timestamp check + retry)

**Success Criteria**:
- ✅ Existing users recognized correctly
- ✅ No duplicate accounts created
- ✅ Retry logic handles async database trigger

---

### Phase 3: Respect Tier Selection & Stop Auto-Free ⚡ CRITICAL

**Objective**: Only create accounts when user explicitly selects tier

**Steps**:
1. **Modify useUserInitializer.js** (Lines 144-191):
   ```javascript
   // REMOVE automatic free tier creation
   if (selectedTier === 'free') {
     // OLD: Auto-create free account
     // NEW: Only create if selectedTier explicitly set by user
   } else {
     // NO tier selected - don't create, redirect to tier selection
     return { tier: 'pending_registration' };
   }
   ```

2. **Update Database Trigger** (Migration 018):
   ```sql
   -- REMOVE default 'free' tier
   -- tier: COALESCE(NEW.raw_user_meta_data->>'tier', 'free')
   -- REPLACE WITH: Only create if tier explicitly set
   tier: NEW.raw_user_meta_data->>'tier'
   ```

3. **Add Validation**:
   - Prevent account creation without tier
   - Redirect to tier selection if missing

**Files to Modify**:
- `src/hooks/useUserInitializer.js` (remove auto-free logic)
- `supabase/migrations/022_fix_tier_defaults.sql` (new migration)

**Success Criteria**:
- ✅ No accounts created without explicit tier selection
- ✅ Free tier requires user consent
- ✅ Database trigger respects null tiers

---

### Phase 4: Fix Post-Authentication Routing 🎯 HIGH

**Objective**: Use existing routing functions correctly

**Steps**:
1. **Update OAuthCallback.jsx** (Lines 144-147):
   ```javascript
   // EXISTING user login
   } else {
     console.log('🔄 Existing user login detected');

     // Use getPostLoginDestination (already exists!)
     const destination = await getPostLoginDestination(userData, session);

     // Navigate using destination.path
     if (destination.path.startsWith('/')) {
       window.location.hash = destination.path.substring(1);
     } else {
       window.location.hash = destination.path;
     }
   }
   ```

2. **Update New User Routing** (Lines 82-106):
   ```javascript
   if (!userData) {
     // New user - use getPostSignupDestination
     const authContext = getAuthContext();
     const destination = getPostSignupDestination(session.user, authContext);

     // Navigate using destination
     window.location.hash = destination.path.substring(1);
     clearAuthContext();
   }
   ```

3. **Use is_first_login Flag**:
   ```javascript
   if (userData?.is_first_login === true) {
     // First login - treat as signup
     await markFirstLoginComplete(userData.id);
     const destination = getPostSignupDestination(session.user, authContext);
   } else {
     // Returning user - show upsell
     const destination = getUpsellPage(userData);
   }
   ```

**Files to Modify**:
- `src/components/OAuthCallback.jsx` (use routing functions)
- `src/utils/authRouting.js` (ensure functions called correctly)

**Success Criteria**:
- ✅ New users route to correct destination (tier-based)
- ✅ Existing users route to tier-based upsell
- ✅ is_first_login flag used correctly
- ✅ No more #landing redirects for authenticated users

---

### Phase 5: Testing & Validation 🧪 CRITICAL

**Objective**: Validate all user journeys work correctly

**Test Cases**:

#### Test 1: New User, Free Tier
```
1. Navigate to /#/signup
2. Select "Free" tier
3. Click "Sign up with Google"
4. Complete OAuth
5. ✅ Account created with tier = 'free'
6. ✅ Redirected to /analyze
7. ✅ No duplicate accounts
```

#### Test 2: New User, Coffee Tier
```
1. Navigate to /#/signup
2. Select "Coffee" tier
3. Click "Sign up with Google"
4. Complete OAuth
5. ✅ Redirected to /checkout (Stripe)
6. ✅ No account created yet (pending payment)
```

#### Test 3: Existing User, First Login
```
1. Already have account in database
2. is_first_login = true
3. Click "Sign in with Google"
4. Complete OAuth
5. ✅ Recognized as existing user
6. ✅ is_first_login set to false
7. ✅ Routed to post-signup destination
```

#### Test 4: Existing User, Returning
```
1. Already have account in database
2. is_first_login = false
3. tier = 'free'
4. Click "Sign in with Google"
5. Complete OAuth
6. ✅ Recognized as existing user
7. ✅ Redirected to /upsell/coffee
8. ✅ NO duplicate account created
```

#### Test 5: Existing User, Different Email
```
1. User A exists with email A
2. User tries OAuth with email B (same provider)
3. ✅ Creates NEW account for email B
4. ✅ Does NOT modify account A
5. ✅ Proper tier selection required
```

**Files to Create**:
- `tests/oauth-user-journey.spec.js` (Playwright E2E tests)

**Success Criteria**:
- ✅ All 5 test cases pass
- ✅ No duplicate accounts created
- ✅ Tier selection enforced
- ✅ Routing correct for all scenarios

---

## Implementation Order

### Priority 1: IMMEDIATE (Breaking Production)
1. **Phase 2**: Fix getUserData() timing → stops duplicate accounts
2. **Phase 3**: Stop auto-free tier → enforces business logic

### Priority 2: HIGH (Core Functionality)
3. **Phase 1**: Add tier selection → restores intended flow
4. **Phase 4**: Fix routing → proper user experience

### Priority 3: VALIDATION
5. **Phase 5**: Testing → ensure everything works

---

## Deployment Strategy

### Step 1: Hotfix for Production (Phases 2 + 3)
**Goal**: Stop creating duplicate accounts immediately

**Changes**:
1. OAuthCallback.jsx: Add auth timestamp check
2. OAuthCallback.jsx: Add getUserData retry logic
3. useUserInitializer.js: Remove auto-free tier creation
4. Deploy to production ASAP

**Timeline**: 2-4 hours

---

### Step 2: Complete Fix (Phases 1 + 4)
**Goal**: Restore full business logic

**Changes**:
1. Signup.jsx: Add TierSelector component
2. OAuthCallback.jsx: Use routing functions
3. Database migration: Remove tier defaults
4. Deploy to staging, test, then production

**Timeline**: 1-2 days

---

### Step 3: Validation (Phase 5)
**Goal**: Comprehensive testing

**Changes**:
1. Create Playwright tests
2. Run on staging
3. Validate all user journeys
4. Sign off for production

**Timeline**: 1 day

---

## Rollback Plan

### If Issues Occur After Deployment

**Immediate Rollback**:
1. Revert OAuthCallback.jsx changes
2. Revert useUserInitializer.js changes
3. Re-deploy previous version

**Database Rollback**:
1. Run `down` migration for 022_fix_tier_defaults.sql
2. Restores tier defaults to 'free'

**Monitoring**:
- Watch for duplicate user creation errors
- Monitor Supabase logs for RLS violations
- Check Sentry for OAuth callback errors

---

## Success Metrics

### Before Fix (Current State)
- ❌ 100% of OAuth users get free tier (wrong)
- ❌ 0% tier selection enforcement
- ❌ Unknown duplicate account rate
- ❌ 100% redirect to #landing (wrong)

### After Fix (Expected State)
- ✅ 100% tier selection before account creation
- ✅ 0% duplicate accounts
- ✅ 100% correct routing (tier-based)
- ✅ 100% is_first_login flag usage

---

## Long-Term Improvements

### Consider for Future
1. **Add "Sign in" vs "Sign up" differentiation**:
   - Separate buttons on landing page
   - Set intent in authContext
   - Use intent for better routing

2. **Add loading states**:
   - Show "Checking your account..." during getUserData retry
   - Better UX during database trigger wait

3. **Add analytics**:
   - Track tier selection rates
   - Monitor signup abandonment
   - Measure duplicate account prevention

4. **Improve error handling**:
   - User-friendly error messages
   - Retry UI for failed signups
   - Support contact if issues persist

---

## Questions for User

Before implementing, please confirm:

1. **Should we deploy Phase 2+3 immediately as hotfix?**
   - This stops duplicate accounts but users still get auto-free tier
   - Full fix requires Phase 1 (tier selection UI)

2. **What should happen if user closes browser during tier selection?**
   - Store in authContext with expiry?
   - Start over next visit?

3. **Should existing duplicate accounts be merged?**
   - Or leave as-is and just prevent future duplicates?

4. **What tier should test accounts use?**
   - Free tier for basic testing?
   - Coffee tier to test payment flows?

---

**Next Step**: Await user confirmation to proceed with implementation.
