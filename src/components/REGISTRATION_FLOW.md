# Registration Flow Implementation

## Overview
Differentiated registration flows for paid vs free users, optimizing conversions by routing paid users through Stripe payment first.

## Components

### RegistrationFlow.jsx
Main orchestrator component handling:
- Tier selection from pricing/teaser pages
- Payment-first flow for paid tiers
- Registration-first flow for free tier
- Session management and recovery
- Integration with Stripe checkout

### AuthWithPassword.jsx (Enhanced)
Enhanced authentication component supporting:
- Pre-filled email from Stripe payment
- Tier information display during registration
- Skip email verification for paid users (payment validates email)
- Registration flow mode

### TierSelection.jsx (Enhanced)
Pricing component with registration flow support:
- Different CTAs for registration vs upgrade flows
- Support for "coming soon" tiers in registration

## Flow Diagrams

### Paid Tier Flow
1. User selects Professional/Coffee tier
2. Redirect to Stripe checkout FIRST
3. After successful payment, show registration form
4. Auto-fill email from Stripe customer data
5. Create account with paid tier already active
6. Skip email verification (trusted via payment)

### Free Tier Flow
1. User selects free trial
2. Show registration form immediately
3. Require email verification
4. Show limitations clearly (3 analyses/month)
5. Prompt upgrade after registration

## Session Management
- Stores `selectedTier` in sessionStorage
- Handles browser back button properly
- Recovers from interrupted flows
- Clears pending data after completion

## Integration Points

### AppNew.jsx
- Routes to 'registration-flow' view
- Handles completion callbacks
- Maintains backward compatibility

### Edge Functions
- `create-checkout-session`: Enhanced for registration mode
- `get-checkout-session`: Retrieves payment details for account linking

## URL Patterns

### Payment Success
```
/register?payment=success&session_id={CHECKOUT_SESSION_ID}
```

### Payment Cancelled
```
/register?payment=cancelled&tier={TIER_NAME}
```

## Environment Variables
- `VITE_STRIPE_COFFEE_PRICE_ID`: Coffee tier price ID
- `VITE_STRIPE_PROFESSIONAL_PRICE_ID`: Professional tier price ID
- `STRIPE_SECRET_KEY`: Stripe secret key (Edge Functions)

## Testing Scenarios

### Paid User Registration
1. Start at pricing page
2. Select Coffee tier
3. Complete Stripe checkout
4. Return to registration form
5. Verify email is pre-filled
6. Complete account creation
7. Verify tier is active immediately

### Free User Registration
1. Start at pricing page  
2. Select free trial
3. Fill registration form
4. Verify email confirmation required
5. Complete verification
6. Check 3-analysis limit

### Interrupted Flow Recovery
1. Start paid registration
2. Complete payment
3. Close browser before registration
4. Return to site
5. Verify registration completes with payment data

### Session Storage Management
- Check `selectedTier` storage/cleanup
- Verify `pendingAccountAfterPayment` handling
- Test browser back button behavior

## Known Limitations

1. Professional/Enterprise tiers marked as "coming soon"
2. Email verification still required for free tier
3. Customer ID display may show "Not set" initially
4. Stripe webhook integration not implemented (manual account linking)

## Future Enhancements

1. Webhook-based account activation
2. Real-time tier updates
3. Enhanced error recovery
4. A/B testing for conversion optimization
5. Social login integration