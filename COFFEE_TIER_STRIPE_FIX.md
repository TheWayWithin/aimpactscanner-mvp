# Coffee Tier Stripe Redirect Fix
Date: January 28, 2025

## Problem
Users selecting Coffee tier during sign-up were NOT being redirected to Stripe for payment. The system was correctly detecting Coffee tier selection but failing to initiate the payment flow.

## Root Cause Analysis

### The Silent Failure
1. `CoffeeTierSignup.jsx` was using `const { handleUpgrade } = useUpgrade();` without passing a user object
2. When `handleUpgrade('coffee')` was called after sign-up, the function checked:
   ```javascript
   if (!user?.id) return; // Silent early return - no error!
   ```
3. Since no user was passed to the hook, the function would return without doing anything
4. No error was thrown, so the issue was invisible in logs

### Why It Appeared to Work
- System correctly detected Coffee tier selection in metadata
- Logs showed "waiting for payment" messages
- But the actual Stripe redirect never happened

## Solution Implemented

### CoffeeTierSignup.jsx Changes
Removed the `useUpgrade` hook and created Stripe checkout session directly:

```javascript
// OLD - Silent failure
const { handleUpgrade } = useUpgrade(); // No user passed
// ...
await handleUpgrade('coffee'); // Returns early, no redirect

// NEW - Works properly
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId,
    userId: authData.user.id, // Use the newly created user ID
    tier: 'coffee',
    successUrl: `${window.location.origin}/upgrade-success?tier=coffee`,
    cancelUrl: `${window.location.origin}/pricing`
  }
});

if (data?.url) {
  window.location.href = data.url; // Redirect to Stripe
}
```

## Testing Instructions

### Test Coffee Tier Sign-up → Stripe Redirect
1. Clear browser storage/use incognito mode
2. Go to sign-up page
3. Select Coffee tier ($4.95/month)
4. Enter email and password
5. Submit form
6. **EXPECTED**: After "Account created!" message, should redirect to Stripe checkout
7. **VERIFY**: Browser URL changes to checkout.stripe.com
8. Complete or cancel payment
9. Verify redirect back to application

### Test Free Tier Sign-up (No Stripe)
1. Clear browser storage/use incognito mode
2. Go to sign-up page
3. Select Free tier
4. Enter email and password
5. Submit form
6. **EXPECTED**: Account created, NO Stripe redirect
7. **VERIFY**: User lands on dashboard with free tier

### Console Logs to Watch For
Successful Coffee tier with Stripe redirect:
```
☕ User selected Coffee tier in signup - waiting for Stripe payment
Initiating Stripe checkout for Coffee tier...
Redirecting to Stripe: https://checkout.stripe.com/...
```

Failed redirect (should not happen now):
```
Failed to create checkout session: [error]
Payment redirect failed. Please try upgrading from your dashboard.
```

## Common Issues and Solutions

### Issue: "No session ID returned"
- Check that VITE_STRIPE_COFFEE_PRICE_ID is set in .env
- Verify create-checkout-session Edge Function is deployed
- Check Supabase Edge Function logs for errors

### Issue: Redirect happens but payment fails
- Verify Stripe price ID is valid
- Check Stripe dashboard for webhook configuration
- Ensure success/cancel URLs are properly configured

### Issue: User stuck on "waiting for payment"
- This is expected until Stripe webhook confirms payment
- Database record won't be created until payment succeeds
- User can cancel and try again from dashboard

## Related Files
- `src/components/CoffeeTierSignup.jsx` - Main sign-up component
- `src/components/UpgradeHandler.jsx` - Upgrade utility (not used for initial sign-up anymore)
- `supabase/functions/create-checkout-session` - Edge Function for Stripe
- `src/App.jsx` - Auth state management
- `src/components/UserInitializer.jsx` - User database initialization

## Prevention
- Always test payment flows end-to-end, not just detection
- Watch for silent failures (functions that return early without errors)
- Add console.error() before early returns in critical functions
- Test with actual data entry and button clicks, not just code review