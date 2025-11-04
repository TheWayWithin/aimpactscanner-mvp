# Stripe Price IDs - AImpactScanner (LIVE MODE)

**Environment**: LIVE MODE (Production)
**Date Created**: 2025-10-25
**Status**: ✅ COMPLETE

⚠️ **WARNING**: These are LIVE MODE Price IDs - they will charge real money!

---

## Price IDs (Live Mode - Production)

| Product | Price ID | Price | Billing | Trial? | Metadata |
|---------|----------|-------|---------|--------|----------|
| Solo Monthly | `price_1SMGZ2IiC84gpR8H0dShUU0z` | $5.95 | Monthly | No | `tier=coffee` |
| Solo Annual | `price_1SMGZ2IiC84gpR8HQtENjbRm` | $49.50 | Yearly | No | `tier=coffee, billing=annual` |
| Growth Monthly | `price_1SMGZ3IiC84gpR8HQvEjhBv5` | $17.95 | Monthly | No | `tier=growth` |
| Growth Annual | `price_1SMGZ3IiC84gpR8Hk0aMTjB2` | $149.50 | Yearly | **7 days** | `tier=growth, billing=annual` |
| Scale Monthly | `price_1SMGZ4IiC84gpR8H30pVuKqm` | $34.95 | Monthly | No | `tier=scale` |
| Scale Annual | `price_1SMGZ5IiC84gpR8HTP46tTjj` | $299.50 | Yearly | No | `tier=scale, billing=annual` |

---

## Production Environment Variables

These Price IDs will be used in **production** Supabase Edge Function:

```bash
# Netlify environment variables (production)
STRIPE_PRICE_SOLO_MONTHLY=price_XXXXXX
STRIPE_PRICE_SOLO_ANNUAL=price_XXXXXX
STRIPE_PRICE_GROWTH_MONTHLY=price_XXXXXX
STRIPE_PRICE_GROWTH_ANNUAL=price_XXXXXX
STRIPE_PRICE_SCALE_MONTHLY=price_XXXXXX
STRIPE_PRICE_SCALE_ANNUAL=price_XXXXXX
```

**Deployment Steps** (Phase 10):

1. Add these environment variables to Netlify production environment
2. Trigger production deployment
3. Verify Stripe integration works end-to-end
4. Monitor error rates in Sentry
5. Track conversion metrics

---

## Live Mode Verification Checklist

Before deploying to production:

- [ ] All 6 Test Mode products verified working
- [ ] All 6 Live Mode products created (identical config to Test Mode)
- [ ] Live Mode Price IDs documented above
- [ ] Live Mode checkout sessions tested with real payment card
- [ ] Growth Annual trial works in Live Mode (subscription shows `trialing`)
- [ ] All metadata verified (`tier`, `billing` fields)
- [ ] Environment variables configured in Netlify production
- [ ] Production deployment plan ready (Phase 10)

---

## Production Deployment Protocol

⚠️ **CRITICAL**: Do NOT deploy to production without:

1. ✅ Complete Test Mode verification (Phase 3 Test Gate 1)
2. ✅ Component development complete (Phases 4-7)
3. ✅ Staging environment tested (Phase 9)
4. ✅ Live Mode Price IDs documented in this file
5. ✅ User approval for production deployment

**Production deployment** = Phase 10 (final phase)

---

## Test Purchases (Live Mode)

When testing Live Mode products:

1. Use **REAL payment card** (not test card 4242...)
2. Immediately **cancel subscription** after verifying checkout works
3. Document test customer IDs for cleanup
4. Verify refund policy applies if needed

**Test customers to clean up**:
- [ ] Solo Monthly: Customer ID `cus_XXXXXX` (canceled: [date])
- [ ] Solo Annual: Customer ID `cus_XXXXXX` (canceled: [date])
- [ ] Growth Monthly: Customer ID `cus_XXXXXX` (canceled: [date])
- [ ] Growth Annual (trial): Customer ID `cus_XXXXXX` (canceled: [date])
- [ ] Scale Monthly: Customer ID `cus_XXXXXX` (canceled: [date])
- [ ] Scale Annual: Customer ID `cus_XXXXXX` (canceled: [date])

---

## Related Files

- **Test Mode IDs**: `/STRIPE-PRICE-IDS.md`
- **Setup Guide**: `/STRIPE-PRODUCT-SETUP-GUIDE.md`
- **Edge Function**: `/supabase/functions/create-checkout-session/index.ts`
- **Project Plan**: `/project-plan.md` (Phase 10 - Production Deployment)

---

*Last updated: [FILL IN AFTER SETUP]*
*Environment: LIVE MODE (Production)*
*Status: DO NOT USE UNTIL TEST MODE VERIFIED*
