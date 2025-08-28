# Sign-up Tier Selection Bypass Fix
Date: January 28, 2025

## Problem
When new users signed up, the system was immediately creating them as free tier users without going through proper tier selection or Stripe payment flow for Coffee tier.

## Root Cause
1. The `fetchUserTier` function in App.jsx wasn't properly detecting new sign-ups
2. CoffeeTierSignup was creating database records immediately for free tier users
3. User metadata wasn't being properly set during sign-up to indicate tier selection

## Solution Implemented

### 1. Enhanced New User Detection (App.jsx)
- Improved logic to check user metadata for tier selection
- Added proper handling for different tier selections:
  - Coffee tier: Sets status to 'pending_payment', waits for Stripe
  - Free tier: Creates database record with free tier
  - No selection: Redirects to tier selection page

### 2. Fixed CoffeeTierSignup Component
- Added both `tier` and `selected_tier` to user metadata for compatibility
- Removed immediate database record creation for free tier
- Let App.jsx handle database record creation based on metadata

### 3. Fixed UnifiedRegistration Component  
- Added proper metadata fields during sign-up
- Includes `tier`, `selected_tier`, and `signup_source`

## Code Changes

### App.jsx - Enhanced tier detection logic
```javascript
// Check metadata for tier selection
const metadataTier = session?.user?.user_metadata?.selected_tier || 
                    session?.user?.user_metadata?.tier;

if (metadataTier === 'coffee') {
  // Wait for Stripe payment
  setUserTier('pending_payment');
} else if (metadataTier === 'free') {
  // Create free account
  await createDefaultUser(userId, userEmail);
} else {
  // Redirect to tier selection
  setCurrentView('coffee-signup');
}
```

### CoffeeTierSignup.jsx - Updated metadata
```javascript
data: {
  selected_tier: selectedTier,
  tier: selectedTier,  // Both fields for compatibility
  signup_source: 'coffee-tier-signup'
}
```

### UnifiedRegistration.jsx - Updated metadata
```javascript
data: {
  tier: selectedTier,
  selected_tier: selectedTier,
  signup_source: 'unified-registration',
  full_name: email.split('@')[0]
}
```

## Testing Instructions

1. **Test Coffee Tier Sign-up**
   - Clear browser storage/incognito
   - Sign up with Coffee tier selected
   - Verify NO database record created immediately
   - Verify redirect to Stripe checkout
   - Complete payment and verify database record created

2. **Test Free Tier Sign-up**
   - Clear browser storage/incognito
   - Sign up with Free tier selected
   - Verify database record created automatically
   - Verify user can access dashboard with free tier

3. **Test Direct Sign-up (No Pre-selection)**
   - Clear browser storage/incognito
   - Go directly to sign-up page
   - Verify redirected to tier selection
   - Select tier and complete flow

## Expected Behavior
- Coffee tier: Sign-up → Stripe checkout → Database record after payment
- Free tier: Sign-up → Database record created automatically
- No selection: Sign-up → Redirect to tier selection page

## Prevention
- User metadata now properly indicates tier selection
- Database records only created after tier is confirmed
- Clear separation between pending payment and active accounts