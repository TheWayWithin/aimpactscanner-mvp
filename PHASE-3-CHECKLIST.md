# Phase 3: Stripe Product Setup - Quick Checklist

**Status**: ⏳ IN PROGRESS
**Timeline**: 1-2 days
**Environment**: Stripe Dashboard

---

## Quick Start

1. **Open Stripe Dashboard**: https://dashboard.stripe.com
2. **Enable Test Mode**: Toggle in top-left corner (should show "Test Mode")
3. **Open Guide**: `/STRIPE-PRODUCT-SETUP-GUIDE.md` (detailed instructions)
4. **Keep notepad ready**: You'll copy 6 Price IDs as you create products

---

## Test Mode Setup (Do This First)

### Products to Create

- [ ] **Solo Monthly**: $5.95/month
  - Product name: `AImpactScanner - Solo`
  - Metadata: `tier=coffee`
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

- [ ] **Solo Annual**: $49.50/year
  - Add to existing Solo product as second price
  - Metadata: `tier=coffee, billing=annual`
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

- [ ] **Growth Monthly**: $17.95/month
  - Product name: `AImpactScanner - Growth`
  - Metadata: `tier=growth`
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

- [ ] **Growth Annual**: $149.50/year **WITH 7-DAY TRIAL**
  - Add to existing Growth product as second price
  - Metadata: `tier=growth, billing=annual`
  - **TRIAL**: 7 days, card required, no charge
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

- [ ] **Scale Monthly**: $34.95/month
  - Product name: `AImpactScanner - Scale`
  - Metadata: `tier=scale`
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

- [ ] **Scale Annual**: $299.50/year
  - Add to existing Scale product as second price
  - Metadata: `tier=scale, billing=annual`
  - Price ID copied to `/STRIPE-PRICE-IDS.md`

---

## Test Mode Verification

- [ ] All 6 products visible in Products list
- [ ] All 6 prices have correct metadata
- [ ] Growth Annual shows trial settings (7 days)
- [ ] Create test payment links for all 6 products
- [ ] Test checkout with card `4242 4242 4242 4242`
- [ ] Verify Growth Annual subscription shows `trialing` (not `active`)
- [ ] All 6 Price IDs documented in `/STRIPE-PRICE-IDS.md`

---

## Live Mode Setup (After Test Verification)

- [ ] Toggle to **Live Mode** in Stripe Dashboard
- [ ] Create same 6 products (identical to Test Mode)
- [ ] Test checkout with REAL payment card
- [ ] Immediately cancel test subscriptions
- [ ] All 6 Live Price IDs documented in `/STRIPE-PRICE-IDS-LIVE.md`

---

## Final Handoff

- [ ] Update `/handoff-notes.md` with Price IDs (replace `price_XXXXXX`)
- [ ] Mark Phase 3 complete in `/project-plan.md`
- [ ] Notify developer to start Phase 4

---

## Key Files

- **Detailed Guide**: `/STRIPE-PRODUCT-SETUP-GUIDE.md`
- **Test Price IDs**: `/STRIPE-PRICE-IDS.md`
- **Live Price IDs**: `/STRIPE-PRICE-IDS-LIVE.md`
- **Project Plan**: `/project-plan.md`
- **Handoff Notes**: `/handoff-notes.md`

---

## Troubleshooting

### Can't find trial settings?

1. Click product → Click price
2. Scroll to **Trial settings** section
3. If missing: Edit price → Add trial settings
4. Set 7 days + "Require payment method"

### Metadata not saving?

1. Click **Save** after adding metadata
2. Refresh page to verify it persists
3. Re-add if missing

### Subscription immediately active (not trialing)?

1. Trial settings not configured on price
2. Go back and add trial to Growth Annual price
3. Delete test subscription and re-test

---

**Estimated Time**: 2-3 hours for Test Mode, 1 hour for Live Mode verification

**Good luck!** Follow the detailed guide in `/STRIPE-PRODUCT-SETUP-GUIDE.md` for step-by-step instructions.
