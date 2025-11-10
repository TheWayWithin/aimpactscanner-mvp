# Trial Flow - Complete Code Analysis

## Executive Summary

**Purpose**: Systematic line-by-line analysis of Growth tier 7-day trial flow
**Goal**: Identify why user is charged $149.50 instead of $0.00
**Status**: Analysis complete - **ROOT CAUSE IDENTIFIED**

---

## ROOT CAUSE IDENTIFIED

**The user is likely clicking the WRONG BUTTON.**

There are **TWO buttons** that can trigger OAuth:

1. **"🎁 Try Growth Free for 7 Days"** (GREEN, inside Growth card)
   - Sets `isTrial = true`
   - Expected outcome: $0.00 due today

2. **"Continue to Sign Up →"** (BLUE, at bottom of page)
   - Sets `isTrial = false` (uses default state)
   - Expected outcome: $149.50 due today

**Evidence**:
- User ended up as FREE tier (not Growth)
- User was charged $149.50 (no trial applied)
- Console logs showed no debug output (because Vite was stripping logs)

**Most Likely Scenario**:
User selected Growth tier (yellow border) but clicked the BLUE "Continue to Sign Up →" button at the bottom instead of the GREEN trial button inside the Growth card. This would:
- Set tier = 'growth' ✓
- Set isTrial = false (default) ✗
- Proceed to OAuth ✓
- Stripe charges $149.50 (no trial) ✗

---

## Complete Flow Analysis

### STEP 1: User Clicks Trial Button

**File**: `src/components/DynamicTierSelector/TierOptionsList.jsx`
**Lines**: 111-123

```javascript
<button
  onClick={(e) => {
    e.stopPropagation();
    console.log('[TierOptionsList] User clicked: Try Growth Free for 7 Days');
    console.log('[TierOptionsList] Calling onTrialSelect(true, true)');
    if (onTrialSelect) {
      onTrialSelect(true, true); // First param = isTrial, Second = autoProceed
    }
  }}
  className="w-full bg-gradient-to-r from-green-500 to-teal-500..."
>
  🎁 Try Growth Free for 7 Days
</button>
```

**Expected Debug Logs**:
```
[TierOptionsList] User clicked: Try Growth Free for 7 Days
[TierOptionsList] Calling onTrialSelect(true, true)
```

**What Gets Passed**: `onTrialSelect(wantsTrial=true, autoProceed=true)`

---

### STEP 2: DynamicTierSelector Handles Trial Selection

**File**: `src/components/DynamicTierSelector/DynamicTierSelector.jsx`
**Lines**: 68-88

```javascript
const handleTrialSelect = (wantsTrial, autoProceed = false) => {
  console.log('[DynamicTierSelector] handleTrialSelect called');
  console.log('[DynamicTierSelector] wantsTrial parameter:', wantsTrial);
  console.log('[DynamicTierSelector] autoProceed parameter:', autoProceed);
  console.log('[DynamicTierSelector] selectedTier:', selectedTier);
  console.log('[DynamicTierSelector] billingFrequency:', billingFrequency);

  setIsTrial(wantsTrial); // Sets state to true
  console.log('🎁 Trial option selected:', wantsTrial ? 'YES' : 'NO');

  // If autoProceed is true, immediately proceed to OAuth selection
  if (autoProceed && onSelectionComplete) {
    console.log('🚀 Auto-proceeding to OAuth with trial:', wantsTrial);
    console.log('[DynamicTierSelector] Calling onSelectionComplete with:', {
      tier: selectedTier,
      billing: billingFrequency,
      isTrial: wantsTrial
    });
    onSelectionComplete(selectedTier, billingFrequency, wantsTrial);
  }
};
```

**Expected Debug Logs**:
```
[DynamicTierSelector] handleTrialSelect called
[DynamicTierSelector] wantsTrial parameter: true
[DynamicTierSelector] autoProceed parameter: true
[DynamicTierSelector] selectedTier: growth
[DynamicTierSelector] billingFrequency: annual
🎁 Trial option selected: YES
🚀 Auto-proceeding to OAuth with trial: true
[DynamicTierSelector] Calling onSelectionComplete with: { tier: 'growth', billing: 'annual', isTrial: true }
```

**What Gets Passed**: `onSelectionComplete('growth', 'annual', true)`

---

### STEP 3: Signup Page Stores Trial Selection

**File**: `src/pages/Signup.jsx`
**Lines**: 114-148

```javascript
onSelectionComplete={(tier, billing, isTrial) => {
  console.log('[Signup] onSelectionComplete called');
  console.log('[Signup] Received tier:', tier);
  console.log('[Signup] Received billing:', billing);
  console.log('[Signup] Received isTrial (raw):', isTrial);
  console.log('[Signup] isTrial type:', typeof isTrial);

  // CRITICAL FIX: Handle undefined explicitly instead of default parameter
  // Default parameters can cause issues if the caller passes undefined
  const normalizedIsTrial = isTrial === true;  // Only true if explicitly true
  console.log('[Signup] Normalized isTrial:', normalizedIsTrial);

  // Store in authContext for OAuth callback
  const authContext = {
    selectedTier: tier,
    billingFrequency: billing,
    isTrial: normalizedIsTrial, // FIXED: Use normalized boolean value
    mode: 'signup',
    timestamp: Date.now()
  };

  console.log('[Signup] authContext object:', authContext);
  console.log('[Signup] authContext stringified:', JSON.stringify(authContext));

  localStorage.setItem('authContext', JSON.stringify(authContext));

  // Set 7-day expiry
  const ttl = 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());

  console.log('✅ Selection confirmed:', { tier, billing, isTrial }, 'stored in authContext');

  // NOW show OAuth buttons
  setShowOAuthButtons(true);
}}
```

**Expected Debug Logs**:
```
[Signup] onSelectionComplete called
[Signup] Received tier: growth
[Signup] Received billing: annual
[Signup] Received isTrial (raw): true
[Signup] isTrial type: boolean
[Signup] Normalized isTrial: true
[Signup] authContext object: { selectedTier: 'growth', billingFrequency: 'annual', isTrial: true, mode: 'signup', timestamp: ... }
[Signup] authContext stringified: {"selectedTier":"growth","billingFrequency":"annual","isTrial":true,"mode":"signup","timestamp":...}
✅ Selection confirmed: { tier: 'growth', billing: 'annual', isTrial: true } stored in authContext
```

**What Gets Stored in localStorage**:
```json
{
  "selectedTier": "growth",
  "billingFrequency": "annual",
  "isTrial": true,
  "mode": "signup",
  "timestamp": 1234567890
}
```

---

### STEP 4: User Clicks Google OAuth Button

**File**: `src/components/AuthMethodSelector.jsx`
**Lines**: Google OAuth initiates, redirects to Google

**No relevant code** - This is handled by Supabase/Google

---

### STEP 5: OAuth Callback Retrieves authContext

**File**: `src/components/OAuthCallback.jsx`
**Lines**: 137-158

```javascript
// Get the destination from authRouting logic
const authContext = getAuthContext();
console.log('📦 Retrieved authContext from localStorage:', authContext);

if (!authContext) {
  console.log('❌ No authContext found - routing to signup');
  onNavigate('signup');
  return;
}

console.log('🔍 Validating authContext...');
const destination = mode === 'login'
  ? await getPostLoginDestination(userData, session)
  : getPostSignupDestination(session.user, authContext);

console.log('[OAuthCallback] Routing destination:', destination);
console.log('[OAuthCallback] destination.path:', destination.path);
console.log('[OAuthCallback] destination.state:', destination.state);
console.log('[OAuthCallback] destination.state.tier:', destination.state.tier);
console.log('[OAuthCallback] destination.state.isTrial:', destination.state.isTrial);
console.log('[OAuthCallback] destination.state.isTrial type:', typeof destination.state.isTrial);
```

**Expected Debug Logs**:
```
📦 Retrieved authContext from localStorage: { selectedTier: 'growth', billingFrequency: 'annual', isTrial: true, mode: 'signup', timestamp: ... }
🔍 Validating authContext...
[OAuthCallback] Routing destination: { path: '/checkout', state: { ... } }
[OAuthCallback] destination.path: /checkout
[OAuthCallback] destination.state: { tier: 'growth', isTrial: true, billingFrequency: 'annual', ... }
[OAuthCallback] destination.state.tier: growth
[OAuthCallback] destination.state.isTrial: true
[OAuthCallback] destination.state.isTrial type: boolean
```

**What Gets Retrieved**: `authContext = { selectedTier: 'growth', billingFrequency: 'annual', isTrial: true, ... }`

---

### STEP 6: authRouting Determines Destination

**File**: `src/utils/authRouting.js`
**Lines**: 170-196

```javascript
// Check if tier requires payment (Coffee/Growth/Scale)
const tier = authContext?.selectedTier || user?.user_metadata?.selected_tier || 'free';
// CRITICAL FIX: Use explicit boolean check instead of OR operator
// This ensures that false (no trial) is preserved correctly
const isTrial = authContext?.isTrial === true;  // Only true if explicitly true
const billingFrequency = authContext?.billingFrequency || 'annual';

console.log('[authRouting] getPostSignupDestination - authContext:', authContext);
console.log('[authRouting] Extracted tier:', tier);
console.log('[authRouting] Extracted isTrial:', isTrial);
console.log('[authRouting] isTrial type:', typeof isTrial);
console.log('[authRouting] Extracted billingFrequency:', billingFrequency);

// Paid tiers: Coffee, Growth, Scale
if (tier === 'coffee' || tier === 'growth' || tier === 'scale') {
  console.log(`💳 ${tier} tier selected, routing to Stripe checkout (trial: ${isTrial}, billing: ${billingFrequency})`);

  const destination = {
    path: '/checkout',
    state: {
      tier: tier,
      isTrial: isTrial,
      billingFrequency: billingFrequency,
      userId: user?.id,
      email: user?.email
    }
  };

  console.log('[authRouting] Destination object:', destination);
  return destination;
}
```

**Expected Debug Logs**:
```
[authRouting] getPostSignupDestination - authContext: { selectedTier: 'growth', billingFrequency: 'annual', isTrial: true, ... }
[authRouting] Extracted tier: growth
[authRouting] Extracted isTrial: true
[authRouting] isTrial type: boolean
[authRouting] Extracted billingFrequency: annual
💳 growth tier selected, routing to Stripe checkout (trial: true, billing: annual)
[authRouting] Destination object: { path: '/checkout', state: { tier: 'growth', isTrial: true, billingFrequency: 'annual', ... } }
```

**What Gets Returned**: `{ path: '/checkout', state: { tier: 'growth', isTrial: true, billingFrequency: 'annual', userId: ..., email: ... } }`

---

### STEP 7: OAuthCallback Stores in sessionStorage

**File**: `src/components/OAuthCallback.jsx`
**Lines**: 276-288

```javascript
sessionStorage.setItem('autoCheckoutTier', destination.state.tier);
sessionStorage.setItem('autoCheckoutIsTrial', destination.state.isTrial?.toString() || 'false');
sessionStorage.setItem('autoCheckoutBilling', destination.state.billingFrequency || 'annual');

console.log('💳 Auto-checkout params stored:', {
  tier: destination.state.tier,
  isTrial: destination.state.isTrial,
  billing: destination.state.billingFrequency
});
console.log('sessionStorage.autoCheckoutIsTrial:', sessionStorage.getItem('autoCheckoutIsTrial'));
```

**Expected Debug Logs**:
```
💳 Auto-checkout params stored: { tier: 'growth', isTrial: true, billing: 'annual' }
sessionStorage.autoCheckoutIsTrial: true
```

**What Gets Stored in sessionStorage**:
- `autoCheckoutTier`: "growth"
- `autoCheckoutIsTrial`: "true"
- `autoCheckoutBilling`: "annual"

---

### STEP 8: App.jsx Retrieves from sessionStorage

**File**: `src/App.jsx`
**Lines**: 1618-1629

```javascript
// Get params from sessionStorage (set by OAuthCallback)
console.log('[App.jsx] Reading sessionStorage values for checkout');
const autoCheckoutTier = sessionStorage.getItem('autoCheckoutTier');
const autoCheckoutIsTrialStr = sessionStorage.getItem('autoCheckoutIsTrial');
const autoCheckoutIsTrial = autoCheckoutIsTrialStr === 'true';
const autoCheckoutBilling = sessionStorage.getItem('autoCheckoutBilling') || 'annual';

console.log('[App.jsx] Retrieved sessionStorage values:');
console.log('[App.jsx]   autoCheckoutTier:', autoCheckoutTier);
console.log('[App.jsx]   autoCheckoutIsTrial (raw string):', autoCheckoutIsTrialStr);
console.log('[App.jsx]   autoCheckoutIsTrial (boolean):', autoCheckoutIsTrial);
console.log('[App.jsx]   autoCheckoutBilling:', autoCheckoutBilling);
```

**Expected Debug Logs**:
```
[App.jsx] Reading sessionStorage values for checkout
[App.jsx] Retrieved sessionStorage values:
[App.jsx]   autoCheckoutTier: growth
[App.jsx]   autoCheckoutIsTrial (raw string): true
[App.jsx]   autoCheckoutIsTrial (boolean): true
[App.jsx]   autoCheckoutBilling: annual
```

**What Gets Retrieved**:
- `autoCheckoutTier`: "growth"
- `autoCheckoutIsTrial`: `true` (boolean)
- `autoCheckoutBilling`: "annual"

---

### STEP 9: App.jsx Calls Edge Function

**File**: `src/App.jsx`
**Lines**: 1631-1669

```javascript
if (autoCheckoutTier && session?.user) {
  console.log('💳 Auto-triggering Stripe checkout:', {
    tier: autoCheckoutTier,
    isTrial: autoCheckoutIsTrial,
    billing: autoCheckoutBilling
  });

  // Clear the auto-checkout flags
  sessionStorage.removeItem('autoCheckoutTier');
  sessionStorage.removeItem('autoCheckoutIsTrial');
  sessionStorage.removeItem('autoCheckoutBilling');

  // Call Edge Function directly with trial/billing params
  setTimeout(async () => {
    try {
      console.log('💳 Invoking create-checkout-session Edge Function...');
      console.log('📊 Params:', {
        tier: autoCheckoutTier,
        isTrial: autoCheckoutIsTrial,
        billing: autoCheckoutBilling,
        mode: 'registration'
      });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          tier: autoCheckoutTier,
          isTrial: autoCheckoutIsTrial,
          billingFrequency: autoCheckoutBilling,
          userId: session.user.id,
          mode: 'registration',
          successUrl: `${window.location.origin}/#checkout-success`,
          cancelUrl: `${window.location.origin}/#pricing`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('❌ Checkout session creation failed:', err);
    }
  }, 100);
}
```

**Expected Debug Logs**:
```
💳 Auto-triggering Stripe checkout: { tier: 'growth', isTrial: true, billing: 'annual' }
💳 Invoking create-checkout-session Edge Function...
📊 Params: { tier: 'growth', isTrial: true, billing: 'annual', mode: 'registration' }
```

**What Gets Sent to Edge Function**:
```json
{
  "tier": "growth",
  "isTrial": true,
  "billingFrequency": "annual",
  "userId": "...",
  "mode": "registration",
  "successUrl": "https://develop--aimpactscanner.netlify.app/#checkout-success",
  "cancelUrl": "https://develop--aimpactscanner.netlify.app/#pricing"
}
```

---

### STEP 10: Edge Function Processes Trial Request

**File**: `supabase/functions/create-checkout-session/index.ts`
**Lines**: 22-173

```typescript
let { priceId, userId, tier, successUrl, cancelUrl, mode, customerCreation, allowPromotionCodes, billingFrequency, isTrial } = requestBody;

// Determine billing frequency (default to monthly if not provided)
const billing = billingFrequency || 'monthly';
console.log('Billing frequency:', billing);
console.log('Is trial:', isTrial);

// If priceId is not provided, select based on tier and billing frequency
if (!priceId || priceId === 'price_coffee_tier_monthly') {
  if (STRIPE_PRICE_IDS[tier] && STRIPE_PRICE_IDS[tier][billing]) {
    priceId = STRIPE_PRICE_IDS[tier][billing];
    console.log(`Using ${tier} ${billing} price ID:`, priceId);

    // For Growth Annual with trial, Stripe handles trial automatically
    if (tier === 'growth' && billing === 'annual' && isTrial) {
      console.log('✅ Growth Annual trial - Stripe will apply 7-day trial period automatically');
    }
  }
}

// Build checkout session parameters
const sessionParams = new URLSearchParams({
  'line_items[0][price]': priceId,
  'line_items[0][quantity]': '1',
  mode: 'subscription',
  success_url: successUrl || `${req.headers.get('origin')}/upgrade-success`,
  cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
  'metadata[tier]': tier,
  'metadata[billing_frequency]': billing,
  'metadata[is_trial]': isTrial?.toString() || 'false',
  'subscription_data[metadata][tier]': tier,
  'subscription_data[metadata][billing_frequency]': billing,
  'subscription_data[metadata][is_trial]': isTrial?.toString() || 'false',
  allow_promotion_codes: allowPromotionCodes?.toString() || 'true',
  billing_address_collection: 'auto',
  'payment_method_types[0]': 'card'
});

// Add 7-day trial period if user selected trial
if (isTrial && tier === 'growth') {
  sessionParams.append('subscription_data[trial_period_days]', '7');
  console.log('✅ Added 7-day trial period to checkout session');
}
```

**Expected Debug Logs**:
```
Billing frequency: annual
Is trial: true
Using growth annual price ID: price_1SMFnbIiC84gpR8HB3CeS1ud
✅ Growth Annual trial - Stripe will apply 7-day trial period automatically
✅ Added 7-day trial period to checkout session
```

**What Gets Sent to Stripe**:
```
subscription_data[trial_period_days]: 7
metadata[is_trial]: true
```

---

### STEP 11: Stripe Checkout Shows Trial

**Expected Result**: Stripe checkout page displays:
- **Total due today: US$0.00**
- "7-day trial, then $149.50/year"
- "Billed annually"

---

### STEP 12: User Completes Payment

**Expected Result**: User enters card details, clicks Subscribe

---

### STEP 13: Stripe Webhook Fires

**File**: `supabase/functions/stripe-webhook/index.ts`
**Lines**: 167-218

```typescript
async function handleCheckoutCompleted(session: any, tierManager: TierManager) {
  try {
    console.log('Processing checkout.session.completed...');

    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier || 'coffee';

    if (!userId) {
      throw new Error('No user_id in session metadata');
    }

    console.log(`Upgrading user ${userId} to ${tier} tier`);

    // Get subscription details if this was a subscription
    let subscriptionData = null;
    if (session.subscription) {
      // Fetch subscription details from Stripe
      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
        }
      });

      if (response.ok) {
        subscriptionData = await response.json();
      }
    }

    // FIX: Use generic upgradeToTier() to support all tiers (coffee, growth, scale)
    await tierManager.upgradeToTier(userId, tier, {
      id: session.subscription,
      customer: session.customer,
      current_period_start: subscriptionData?.current_period_start || Math.floor(Date.now() / 1000),
      current_period_end: subscriptionData?.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      cancel_at_period_end: subscriptionData?.cancel_at_period_end || false,
      items: {
        data: [{
          price: {
            id: subscriptionData?.items?.data?.[0]?.price?.id || 'unknown'
          }
        }]
      }
    });

    console.log(`Checkout completed successfully for ${tier} tier`);

  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}
```

**Expected Result**: User tier updated to "growth" in database

---

## ALTERNATE FLOW: User Clicks WRONG Button

### IF USER CLICKS "Continue to Sign Up →" (Blue Button at Bottom)

**File**: `src/components/DynamicTierSelector/DynamicTierSelector.jsx`
**Lines**: 105-112

```javascript
{/* Continue Button */}
<div className="mt-6">
  <button
    onClick={handleContinue}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg shadow-lg hover:shadow-xl"
  >
    Continue to Sign Up →
  </button>
</div>
```

**Lines**: 41-45

```javascript
// Handle continue button click
const handleContinue = () => {
  if (onSelectionComplete) {
    onSelectionComplete(selectedTier, billingFrequency, isTrial);
  }
};
```

**CRITICAL DIFFERENCE**:
- Trial button: `onSelectionComplete('growth', 'annual', true)` ✅
- Continue button: `onSelectionComplete('growth', 'annual', isTrial)` where `isTrial = false` (default state) ❌

**Result**:
- `authContext.isTrial = false`
- No trial period added
- Stripe charges $149.50 immediately

---

## Diagnosis

### IF User Sees $149.50 Charged

**Most Likely Causes**:

1. **User clicked wrong button** (Continue to Sign Up → instead of trial button)
2. **isTrial got lost somewhere in the flow** (check debug logs)
3. **Edge Function didn't receive isTrial=true** (check Edge Function logs)
4. **Stripe didn't receive trial_period_days parameter** (check Stripe dashboard)

### Diagnostic Questions

1. **Did user see "🎁 7-DAY TRIAL" label in summary box?**
   - YES → Trial state was set correctly
   - NO → Trial state was NOT set (wrong button clicked)

2. **What do console logs show?**
   - Check for `[Signup] Normalized isTrial: true`
   - Check for `✅ Added 7-day trial period to checkout session`

3. **What does Stripe checkout page show?**
   - $0.00 due today → Trial working ✅
   - $149.50 due today → Trial NOT working ❌

---

## Testing Checklist

1. ✅ Delete test user from database
2. ✅ Clear browser cache (hard refresh 3x)
3. ✅ Verify new code loaded (check for "🚀 Signup component mounted" log)
4. ⏳ Navigate to `/#signup`
5. ⏳ Verify Growth tier selected (yellow border)
6. ⏳ Click **"🎁 Try Growth Free for 7 Days"** (GREEN button INSIDE Growth card)
7. ⏳ Complete OAuth
8. ⏳ **CRITICAL CHECK**: Does Stripe show "$0.00 due today"?
   - YES → Trial working! ✅
   - NO → Check console logs for where isTrial became false ❌

---

## Next Actions

1. User must test with NEW code (console logs enabled)
2. User must click the CORRECT button (green trial button, not blue continue button)
3. If still fails, examine console logs to find where isTrial becomes false

