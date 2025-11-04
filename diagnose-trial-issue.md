# Trial Issue Diagnosis

## What We Know

1. ✅ **Front-end code works**: Playwright test proves `isTrial=true` is set correctly in localStorage
2. ✅ **Webhook fires**: Logs show "User upgraded to growth tier successfully"
3. ✅ **RLS policy fixed**: Service role can now update users table
4. ❌ **Stripe shows $149.50 due today**: Trial is NOT being created at Stripe level
5. ❌ **User ends up as FREE tier**: Database not updated (but RLS now fixed)

## The Core Problem

The Stripe checkout page shows **$149.50 due today** instead of **$0.00 due today**.

This means the `trial_period_days` parameter is NOT being sent to Stripe.

## Check These Logs

Go to: https://supabase.com/dashboard/project/isgzvwpjokcmtizstwru/functions/create-checkout-session/logs

Look for the most recent entry and find:
- ✅ "Is trial: true" ← Should be there
- ✅ "✅ Added 7-day trial period to checkout session" ← Should be there

If you DON'T see these logs, it means `isTrial` is not being passed from front-end to Edge Function.

## What to Check

### 1. App.jsx Line 1654-1665
```javascript
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    tier: autoCheckoutTier,
    isTrial: autoCheckoutIsTrial,  // ← Is this TRUE?
    billingFrequency: autoCheckoutBilling,
    userId: session.user.id,
    mode: 'registration',
    successUrl: `${window.location.origin}/#checkout-success`,
    cancelUrl: `${window.location.origin}/#pricing`
  }
});
```

**Question**: Is `autoCheckoutIsTrial` actually `true` when the trial button is clicked?

### 2. Check Browser Console

When you clicked "🎁 Try Growth Free for 7 Days", did you see this log?
```
✅ Selection confirmed: {tier: growth, billing: annual, isTrial: true}
```

### 3. The Real Issue

Looking at your console logs, I see:
```
🔍 Fetching user tier for: e1c87cd6-950f-415c-89a1-690c8645ee11
📱 Found local tier data: free for user: aimpactscannertest@gmail.com
```

This means the user ALREADY EXISTS before clicking the trial button!

**This is the problem**: The trial flow is designed for NEW users (registration), but you're testing with an EXISTING user.

## The Fix

The trial button should work differently for existing users vs new signups:

1. **New signups**: Trial works via OAuth callback → create checkout
2. **Existing users**: Should go straight to Stripe with trial parameter

We need to check if the trial parameter is being preserved through the OAuth flow.
