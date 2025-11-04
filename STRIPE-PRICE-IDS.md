# Stripe Price IDs - AImpactScanner

**Environment**: Test Mode
**Date Created**: 2025-10-25
**Status**: ✅ COMPLETE

---

## Price IDs (Test Mode)

| Product | Price ID | Price | Billing | Trial? | Metadata |
|---------|----------|-------|---------|--------|----------|
| Solo Monthly | `price_1SMFnZIiC84gpR8HBsYj7vsE` | $5.95 | Monthly | No | `tier=coffee` |
| Solo Annual | `price_1SMFnZIiC84gpR8HD7oRJxlN` | $49.50 | Yearly | No | `tier=coffee, billing=annual` |
| Growth Monthly | `price_1SMFnaIiC84gpR8HzHaQmjYc` | $17.95 | Monthly | No | `tier=growth` |
| Growth Annual | `price_1SMFnbIiC84gpR8HB3CeS1ud` | $149.50 | Yearly | **7 days** | `tier=growth, billing=annual` |
| Scale Monthly | `price_1SMFncIiC84gpR8HbCRQwnCW` | $34.95 | Monthly | No | `tier=scale` |
| Scale Annual | `price_1SMFncIiC84gpR8HaHS0RCGe` | $299.50 | Yearly | No | `tier=scale, billing=annual` |

---

## Instructions

1. Complete Stripe product setup following `/STRIPE-PRODUCT-SETUP-GUIDE.md`
2. Replace `price_XXXXXX` with actual Price IDs from Stripe Dashboard
3. Update **Date Created** field
4. Change **Status** to `✅ COMPLETE` when all 6 IDs documented
5. Verify metadata matches exactly (important for Edge Function integration)

---

## Usage in Edge Function (Phase 6)

These Price IDs will be integrated into `/supabase/functions/create-checkout-session/index.ts`:

```typescript
// Price ID mapping (test mode)
const STRIPE_PRICE_IDS = {
  coffee: {
    monthly: 'price_1SMFnZIiC84gpR8HBsYj7vsE',
    annual: 'price_1SMFnZIiC84gpR8HD7oRJxlN'
  },
  growth: {
    monthly: 'price_1SMFnaIiC84gpR8HzHaQmjYc',
    annual: 'price_1SMFnbIiC84gpR8HB3CeS1ud'  // Has 7-day trial configured in Stripe
  },
  scale: {
    monthly: 'price_1SMFncIiC84gpR8HbCRQwnCW',
    annual: 'price_1SMFncIiC84gpR8HaHS0RCGe'
  }
};

// Trial handling
const isTrial = requestBody.isTrial || false;
const billingFrequency = requestBody.billingFrequency || 'annual';

// Select correct price
let priceId;
if (tier === 'growth' && billingFrequency === 'annual' && isTrial) {
  // Growth Annual has trial configured in Stripe
  // No need to override trial settings - Stripe handles it
  priceId = STRIPE_PRICE_IDS.growth.annual;
} else {
  priceId = STRIPE_PRICE_IDS[tier][billingFrequency];
}

// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: customer.id,
  line_items: [{
    price: priceId,
    quantity: 1
  }],
  mode: 'subscription',
  success_url: `${origin}/#dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/#signup?canceled=true`,
});
```

**Key Points**:
- Trial period is configured in Stripe price (Growth Annual)
- No need to override `subscription_data.trial_period_days` - Stripe applies it automatically
- Edge Function just selects correct price ID based on tier + billing frequency
- `isTrial` flag from frontend determines if user clicked trial CTA

---

## Verification Checklist

Before using these Price IDs in production:

- [ ] All 6 Price IDs documented above
- [ ] Metadata verified in Stripe Dashboard (tier, billing fields)
- [ ] Growth Annual trial period verified (7 days, card required)
- [ ] Test checkout sessions created and tested for all 6 products
- [ ] Growth Annual subscription shows `trialing` status (not `active`)
- [ ] Live Mode Price IDs documented in `/STRIPE-PRICE-IDS-LIVE.md`

---

## Related Files

- **Setup Guide**: `/STRIPE-PRODUCT-SETUP-GUIDE.md`
- **Live Mode IDs**: `/STRIPE-PRICE-IDS-LIVE.md` (create after Test Mode verification)
- **Edge Function**: `/supabase/functions/create-checkout-session/index.ts`
- **Project Plan**: `/project-plan.md` (Phase 3)

---

*Last updated: 2025-10-25*
*Environment: Test Mode*
*Setup method: Automated via setup-stripe-products.cjs*
