# Stripe Product Setup Guide - Phase 3

**Mission**: Configure 6 products in Stripe (3 monthly + 3 annual) with Growth tier 7-day trial

**Timeline**: 1-2 days (manual work in Stripe Dashboard)

**Environment**: Stripe Dashboard (TEST MODE first, then LIVE MODE)

---

## Pre-Flight Checklist

Before starting, ensure:

- [ ] Stripe account access (https://dashboard.stripe.com)
- [ ] Test mode enabled (toggle in top-left corner)
- [ ] Access to this guide for reference
- [ ] Notepad ready to document Price IDs (you'll need these for Phase 6)

---

## Product Configuration Reference

| Product | Monthly Price | Annual Price | Trial? | Metadata |
|---------|--------------|--------------|--------|----------|
| Solo Monthly | $5.95/month | - | No | `tier=coffee` |
| Solo Annual | - | $49.50/year | No | `tier=coffee, billing=annual` |
| Growth Monthly | $17.95/month | - | No | `tier=growth` |
| Growth Annual | - | $149.50/year | **YES (7 days)** | `tier=growth, billing=annual` |
| Scale Monthly | $34.95/month | - | No | `tier=scale` |
| Scale Annual | - | $299.50/year | No | `tier=scale, billing=annual` |

**CRITICAL**: Growth Annual is the ONLY product with a trial period configured (7 days, card required, no charge).

---

## Part 1: Create Products in TEST MODE

### Product 1: Solo Monthly

**Step-by-step**:

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**
3. Fill in details:
   - **Name**: `AImpactScanner - Solo`
   - **Description**: `Solo tier - 10 analyses per month with 30-day history`
   - **Image**: (optional - skip for now)
4. Click **Add pricing**
5. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `5.95` USD
   - **Billing period**: Monthly
   - **Usage type**: Licensed (not metered)
6. Click **Add price**
7. **IMPORTANT**: Click on the newly created price
8. Scroll to **Metadata** section, click **+ Add metadata**
   - **Key**: `tier`
   - **Value**: `coffee`

   *(NOTE: Internal tier ID stays "coffee" for backward compatibility)*
9. Click **Save**
10. **COPY PRICE ID** (starts with `price_...`) → Save to notepad as `price_SOLO_MONTHLY`

---

### Product 2: Solo Annual

**Step-by-step**:

1. Click on the **AImpactScanner - Solo** product you just created
2. Scroll to **Pricing** section
3. Click **+ Add another price**
4. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `49.50` USD
   - **Billing period**: Yearly
   - **Usage type**: Licensed
5. Click **Add price**
6. Click on the newly created annual price
7. Scroll to **Metadata** section, click **+ Add metadata**
   - **Key**: `tier`
   - **Value**: `coffee`
8. Click **+ Add metadata** again (second metadata entry):
   - **Key**: `billing`
   - **Value**: `annual`
9. Click **Save**
10. **COPY PRICE ID** (starts with `price_...`) → Save to notepad as `price_SOLO_ANNUAL`

**Savings verification**: $5.95 × 12 = $71.40/year → Annual saves $21.90 (31% discount) ✅

---

### Product 3: Growth Monthly

**Step-by-step**:

1. Go to **Products**, click **+ Add product**
2. Fill in details:
   - **Name**: `AImpactScanner - Growth`
   - **Description**: `Growth tier - 40 analyses per month with 90-day history, CSV export, LLMS.txt`
3. Click **Add pricing**
4. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `17.95` USD
   - **Billing period**: Monthly
   - **Usage type**: Licensed
5. Click **Add price**
6. Click on the newly created price
7. Add metadata:
   - **Key**: `tier`
   - **Value**: `growth`
8. Click **Save**
9. **COPY PRICE ID** → Save as `price_GROWTH_MONTHLY`

---

### Product 4: Growth Annual (WITH 7-DAY TRIAL)

**Step-by-step**:

1. Click on the **AImpactScanner - Growth** product
2. Click **+ Add another price**
3. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `149.50` USD
   - **Billing period**: Yearly
   - **Usage type**: Licensed
4. Click **Add price**
5. Click on the newly created annual price
6. Add metadata:
   - **Key**: `tier`
   - **Value**: `growth`
7. Add second metadata:
   - **Key**: `billing`
   - **Value**: `annual`
8. **CRITICAL - Configure Trial Period**:
   - Scroll to **Trial settings**
   - **Trial period**: `7 days`
   - **Trial behavior**: `Require payment method` (card required upfront)
   - **Charge behavior**: `No charge for trial period, then charge full amount`
9. Click **Save**
10. **COPY PRICE ID** → Save as `price_GROWTH_ANNUAL`

**Savings verification**: $17.95 × 12 = $215.40/year → Annual saves $65.90 (31% discount) ✅

**Trial verification**:
- Trial period: 7 days ✅
- Card required: YES ✅
- No charge during trial: YES ✅
- Auto-converts after 7 days: YES ✅

---

### Product 5: Scale Monthly

**Step-by-step**:

1. Go to **Products**, click **+ Add product**
2. Fill in details:
   - **Name**: `AImpactScanner - Scale`
   - **Description**: `Scale tier - 100 analyses per month with unlimited history, API access, 3 seats`
3. Click **Add pricing**
4. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `34.95` USD
   - **Billing period**: Monthly
   - **Usage type**: Licensed
5. Click **Add price**
6. Click on the newly created price
7. Add metadata:
   - **Key**: `tier`
   - **Value**: `scale`
8. Click **Save**
9. **COPY PRICE ID** → Save as `price_SCALE_MONTHLY`

---

### Product 6: Scale Annual

**Step-by-step**:

1. Click on the **AImpactScanner - Scale** product
2. Click **+ Add another price**
3. Configure pricing:
   - **Pricing model**: Standard pricing
   - **Price**: `299.50` USD
   - **Billing period**: Yearly
   - **Usage type**: Licensed
4. Click **Add price**
5. Click on the newly created annual price
6. Add metadata:
   - **Key**: `tier`
   - **Value**: `scale`
7. Add second metadata:
   - **Key**: `billing`
   - **Value**: `annual`
8. Click **Save**
9. **COPY PRICE ID** → Save as `price_SCALE_ANNUAL`

**Savings verification**: $34.95 × 12 = $419.40/year → Annual saves $119.90 (29% discount) ✅

---

## Part 2: Test Checkout Sessions (Test Mode)

Now verify each product works correctly in Stripe Checkout.

### Test Gate 1: Manual Checkout Testing

For EACH of the 6 products, create a test checkout session:

1. Go to **Products** in Stripe Dashboard
2. Click on the product name
3. Click on the price you want to test
4. Click **Create payment link** button (top right)
5. Configure payment link:
   - **Description**: `Test checkout for [Product Name]`
   - **Allow quantity adjustment**: OFF
   - **Payment method types**: Card
6. Click **Create link**
7. **Copy the payment link URL**
8. Open in private/incognito browser window
9. **VERIFY CHECKOUT DISPLAY**:
   - Product name correct
   - Price correct
   - Billing frequency correct (monthly or yearly)
   - **For Growth Annual**: Trial notice visible ("7-day free trial")
10. Enter test card: `4242 4242 4242 4242`
11. Expiry: Any future date (e.g., `12/26`)
12. CVC: Any 3 digits (e.g., `123`)
13. Click **Subscribe**
14. **VERIFY SUCCESS**:
    - Redirects to success page
    - Subscription created in Stripe Dashboard → Subscriptions

**Repeat for all 6 products**:

- [ ] Solo Monthly ($5.95/month) - Checkout works ✅
- [ ] Solo Annual ($49.50/year) - Checkout works ✅
- [ ] Growth Monthly ($17.95/month) - Checkout works ✅
- [ ] **Growth Annual ($149.50/year)** - Checkout shows **7-day trial**, card captured, no charge ✅
- [ ] Scale Monthly ($34.95/month) - Checkout works ✅
- [ ] Scale Annual ($299.50/year) - Checkout works ✅

**CRITICAL: Growth Annual Trial Verification**:

1. Go to **Customers** in Stripe Dashboard
2. Find the test customer who subscribed to Growth Annual
3. Click on customer → View **Subscriptions**
4. Verify subscription details:
   - Status: `trialing` (not `active`)
   - Trial end date: 7 days from now
   - Amount: $149.50/year
   - Next payment: 7 days from now
   - Payment method: Card ending in 4242 (captured but not charged)

If status shows `trialing` → Trial configuration is correct ✅

---

## Part 3: Document Price IDs

Create a file to store all Price IDs for Phase 6 (developer handoff):

**File**: `/STRIPE-PRICE-IDS.md`

```markdown
# Stripe Price IDs - AImpactScanner

**Environment**: Test Mode
**Date Created**: [Today's date]

## Price IDs

| Product | Price ID | Price | Billing | Trial? |
|---------|----------|-------|---------|--------|
| Solo Monthly | price_XXXXXX | $5.95 | Monthly | No |
| Solo Annual | price_XXXXXX | $49.50 | Yearly | No |
| Growth Monthly | price_XXXXXX | $17.95 | Monthly | No |
| Growth Annual | price_XXXXXX | $149.50 | Yearly | **7 days** |
| Scale Monthly | price_XXXXXX | $34.95 | Monthly | No |
| Scale Annual | price_XXXXXX | $299.50 | Yearly | No |

## Usage in Edge Function

These Price IDs will be used in `/supabase/functions/create-checkout-session/index.ts`:

```typescript
const priceIds = {
  coffee: {
    monthly: 'price_SOLO_MONTHLY_HERE',
    annual: 'price_SOLO_ANNUAL_HERE'
  },
  growth: {
    monthly: 'price_GROWTH_MONTHLY_HERE',
    annual: 'price_GROWTH_ANNUAL_HERE' // Has 7-day trial
  },
  scale: {
    monthly: 'price_SCALE_MONTHLY_HERE',
    annual: 'price_SCALE_ANNUAL_HERE'
  }
};
```

**IMPORTANT**: The Edge Function will check for `isTrial` flag and use `price_GROWTH_ANNUAL_HERE` when trial is requested.
```

**Replace** `price_XXXXXX` with actual Price IDs from your notepad.

---

## Part 4: Repeat in LIVE MODE

**ONLY after Test Mode verification passes**, repeat Parts 1-3 in **LIVE MODE**:

1. Toggle to **Live mode** (top-left corner of Stripe Dashboard)
2. Create the same 6 products with identical configuration
3. Test checkout with REAL payment card (you can immediately cancel subscriptions)
4. Document LIVE MODE Price IDs in separate file: `/STRIPE-PRICE-IDS-LIVE.md`

**WARNING**: Do NOT deploy to production until LIVE MODE products are tested and verified.

---

## Part 5: Verification Checklist

Before marking Phase 3 complete, verify:

### Test Mode Verification

- [ ] All 6 products created in Test Mode
- [ ] All 6 prices have correct metadata (`tier=coffee/growth/scale`, `billing=annual` for annual)
- [ ] Growth Annual has trial period configured (7 days, card required)
- [ ] All 6 checkout sessions tested successfully
- [ ] Growth Annual subscription shows `trialing` status (not `active`)
- [ ] All 6 Price IDs documented in `/STRIPE-PRICE-IDS.md`

### Live Mode Verification

- [ ] All 6 products created in Live Mode (identical to Test Mode)
- [ ] All 6 checkout sessions tested successfully
- [ ] Growth Annual trial works in Live Mode
- [ ] All 6 LIVE Price IDs documented in `/STRIPE-PRICE-IDS-LIVE.md`

### Documentation Handoff

- [ ] Price IDs documented for developer handoff
- [ ] Trial configuration documented
- [ ] Screenshots saved (optional but recommended)
- [ ] `/handoff-notes.md` updated with Price IDs

---

## Expected Outcomes

After completing this phase:

✅ **6 products configured** (Solo, Growth, Scale × monthly/annual)
✅ **Trial period works** (Growth Annual: 7 days, card required, no charge)
✅ **Price IDs documented** (ready for Phase 6 Edge Function integration)
✅ **Pricing verified** (all amounts match PRD v5.0 specification)
✅ **Savings calculations correct** (31%, 31%, 29% discounts)

---

## Troubleshooting

### Issue: Trial period not showing in checkout

**Solution**:
1. Go to **Products** → Click product → Click price
2. Verify **Trial settings** section exists
3. Trial period: `7 days`
4. Trial behavior: `Require payment method`
5. If missing, edit price and add trial settings

### Issue: Metadata not saving

**Solution**:
1. Click price → Scroll to **Metadata**
2. Ensure you clicked **Save** after adding metadata
3. Refresh page and verify metadata persists
4. If still missing, re-add and save again

### Issue: Checkout shows wrong price

**Solution**:
1. Verify you're testing the correct Price ID (not Product ID)
2. Check payment link configuration (should reference specific price)
3. Create new payment link if incorrect

### Issue: Subscription immediately active (not trialing)

**Solution**:
1. Price trial settings not configured correctly
2. Go to price → Trial settings → Set 7 days + require payment method
3. Delete test subscription and re-test with updated price

---

## Next Steps

After completing Phase 3:

1. **Update handoff-notes.md** with all 6 Price IDs
2. **Mark Phase 3 complete** in project-plan.md
3. **Proceed to Phase 4**: Tier Selector Component (Basic)
4. **Developer handoff**: Price IDs will be integrated in Phase 6

---

## Support Resources

- **Stripe Trial Periods Guide**: https://stripe.com/docs/billing/subscriptions/trials
- **Stripe Metadata Guide**: https://stripe.com/docs/api/metadata
- **Stripe Test Cards**: https://stripe.com/docs/testing

---

**Good luck!** Take your time with Test Mode verification - it's safer to catch issues now than in production.

*Created: October 25, 2025*
*Mission: Phase 3 - Stripe Product Setup*
*Agent: THE OPERATOR*
