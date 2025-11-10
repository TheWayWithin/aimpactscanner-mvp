# Tier & Pricing Implementation Roadmap

## Executive Summary

This document outlines ALL code changes needed to implement the new tier structure with annual pricing and 7-day trial.

**Goal**: Transform from single Coffee tier ($4.95/mo) → 4-tier system with annual billing and Growth trial

**Timeline**: 10-12 days (8 phases with test gates)

---

## Current State Analysis

### What We Have Now:

1. **TierSelector.jsx** (src/components/TierSelector.jsx:1-250)
   - Coffee tier: $4.95/month
   - Growth/Scale: "COMING SOON" (disabled)
   - No billing toggle
   - No annual pricing
   - Doug Hall copy only for Coffee tier

2. **tierUtils.js** (src/lib/tierUtils.js:1-224)
   - `coffee` hardcoded in feature matrix (lines 100, 201-207)
   - Display name mapping: coffee → "☕ Coffee" (line 147-154)
   - No annual pricing logic

3. **create-checkout-session** (supabase/functions/create-checkout-session/index.ts:1-196)
   - Only handles Coffee tier
   - Single price ID (price_1RnSa4IiC84gpR8HXmbDgaNy)
   - No trial logic
   - No annual billing support

4. **Database**:
   - Users table: `tier` column (values: 'free', 'coffee', 'growth', 'scale')
   - No `billing_frequency` column yet
   - No `trial_ends_at` column yet

---

## What Needs to Change

### Phase 1: Database Schema Updates (1 day)

**Files to Modify**: `supabase/migrations/`

**Changes**:
```sql
-- Add billing frequency tracking
ALTER TABLE users
  ADD COLUMN billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'annual'));

-- Add trial tracking
ALTER TABLE users
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN is_trial BOOLEAN DEFAULT FALSE;

-- Add subscription metadata
ALTER TABLE subscriptions
  ADD COLUMN billing_frequency TEXT DEFAULT 'monthly',
  ADD COLUMN trial_period_days INTEGER;
```

**Test Gate**: Run migration on staging database, verify columns exist

---

### Phase 2: Tier Configuration Updates (1 day)

**Files to Modify**:
1. `src/lib/tierUtils.js` - Update tier definitions
2. `src/config/tiers.js` - NEW FILE for centralized tier config

**Changes**:

**Create NEW FILE**: `src/config/tiers.js`
```javascript
// Centralized tier configuration
export const TIER_CONFIG = {
  free: {
    id: 'free',
    displayName: 'Free',
    internalName: 'free',
    icon: '🆓',
    pricing: {
      monthly: 0,
      annual: 0
    },
    features: {
      analyses_per_month: 3,
      pdf_export: false,
      llms_txt: false,
      csv_export: false,
      api_access: false
    }
  },
  coffee: {
    id: 'coffee',
    displayName: 'Solo',  // ← DISPLAY name changes!
    internalName: 'coffee', // ← INTERNAL ID stays coffee
    icon: '☕',
    pricing: {
      monthly: 5.95,  // ← NEW price (was 4.95)
      annual: 49.50   // ← NEW annual pricing ($4.13/mo equivalent)
    },
    stripePriceIds: {
      monthly: 'price_COFFEE_MONTHLY',  // ← To be created
      annual: 'price_COFFEE_ANNUAL'     // ← To be created
    },
    features: {
      analyses_per_month: null, // unlimited
      pdf_export: true,
      llms_txt: false,  // ← Growth+ only
      csv_export: false, // ← PDF only for Solo
      api_access: false
    }
  },
  growth: {
    id: 'growth',
    displayName: 'Growth',
    internalName: 'growth',
    icon: '🚀',
    pricing: {
      monthly: 17.95,
      annual: 149.50  // $12.46/mo equivalent
    },
    stripePriceIds: {
      monthly: 'price_GROWTH_MONTHLY',
      annual: 'price_GROWTH_ANNUAL'
    },
    trial: {
      enabled: true,
      days: 7,
      card_required: true
    },
    features: {
      analyses_per_month: null, // unlimited
      pdf_export: true,
      llms_txt: true,  // ← Growth+ feature
      csv_export: true,
      api_access: false
    }
  },
  scale: {
    id: 'scale',
    displayName: 'Scale',
    internalName: 'scale',
    icon: '📈',
    pricing: {
      monthly: 34.95,
      annual: 299.50  // $24.96/mo equivalent
    },
    stripePriceIds: {
      monthly: 'price_SCALE_MONTHLY',
      annual: 'price_SCALE_ANNUAL'
    },
    features: {
      analyses_per_month: null,
      pdf_export: true,
      llms_txt: true,
      csv_export: true,
      api_access: true  // ← Scale only
    }
  }
};

export function getTierConfig(tierId) {
  return TIER_CONFIG[tierId] || TIER_CONFIG.free;
}

export function getTierPrice(tierId, billingFrequency = 'monthly') {
  const config = getTierConfig(tierId);
  return config.pricing[billingFrequency];
}

export function getTierDisplayName(tierId) {
  const config = getTierConfig(tierId);
  return config.displayName;
}
```

**Update**: `src/lib/tierUtils.js`
```javascript
// CHANGE line 147-154 from:
'coffee': {
  name: 'Coffee',
  displayName: '☕ Coffee',
  ...
}

// TO:
'coffee': {
  name: 'Solo',           // ← CHANGED
  displayName: '☕ Solo',  // ← CHANGED
  ...
}
```

**Test Gate**: Unit tests verify tier names, pricing, feature access

---

### Phase 3: Build Billing Toggle Component (2 days)

**NEW FILES**:
1. `src/components/BillingToggle.jsx`
2. `src/components/PricingDisplay.jsx`
3. `src/hooks/useBillingPricing.js`

**BillingToggle.jsx**:
```jsx
import React from 'react';

const BillingToggle = ({ billingFrequency, onChange }) => {
  return (
    <div className="billing-toggle mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Billing Frequency
      </label>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => onChange('annual')}
          className={`px-6 py-3 rounded-l-lg border-2 transition-all ${
            billingFrequency === 'annual'
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
          }`}
        >
          <div className="font-semibold">Annual</div>
          <div className="text-xs mt-1">Save 2 months 💰</div>
        </button>

        <button
          onClick={() => onChange('monthly')}
          className={`px-6 py-3 rounded-r-lg border-2 transition-all ${
            billingFrequency === 'monthly'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="font-semibold">Monthly</div>
          <div className="text-xs mt-1">Pay as you go</div>
        </button>
      </div>

      {billingFrequency === 'annual' && (
        <div className="mt-3 text-center text-sm text-green-700 bg-green-50 py-2 px-4 rounded-lg">
          💰 Save up to $119.90/year with annual billing
        </div>
      )}
    </div>
  );
};

export default BillingToggle;
```

**useBillingPricing.js**:
```javascript
import { useState, useMemo } from 'react';
import { getTierPrice, TIER_CONFIG } from '../config/tiers';

export function useBillingPricing(initialFrequency = 'annual') {
  const [billingFrequency, setBillingFrequency] = useState(initialFrequency);

  const getPriceForTier = (tierId) => {
    return getTierPrice(tierId, billingFrequency);
  };

  const getAnnualSavings = (tierId) => {
    const monthly = getTierPrice(tierId, 'monthly');
    const annual = getTierPrice(tierId, 'annual');
    const monthlyAnnual = monthly * 12;
    return monthlyAnnual - annual;
  };

  return {
    billingFrequency,
    setBillingFrequency,
    getPriceForTier,
    getAnnualSavings
  };
}
```

**Test Gate**: Playwright test verifies toggle works, pricing updates

---

### Phase 4: Rebuild TierSelector Component (3 days)

**Files to Modify**:
1. `src/components/TierSelector.jsx` - Complete rebuild

**Changes**:
- Remove "COMING SOON" from Growth/Scale
- Add billing toggle integration
- Update Coffee → Solo display name
- Update all pricing
- Add annual pricing display

**NEW TierSelector.jsx** (partial):
```jsx
import BillingToggle from './BillingToggle';
import { useBillingPricing } from '../hooks/useBillingPricing';
import { TIER_CONFIG, getTierDisplayName } from '../config/tiers';

const TierSelector = ({ selectedTier, onTierChange, onBillingChange }) => {
  const { billingFrequency, setBillingFrequency, getPriceForTier, getAnnualSavings } = useBillingPricing();

  const handleBillingChange = (frequency) => {
    setBillingFrequency(frequency);
    onBillingChange(frequency);  // Pass to parent (for OAuth context)
  };

  const tiers = [
    {
      id: 'free',
      name: '🆓 FREE',
      price: '$0',
      // ... free tier config
    },
    {
      id: 'coffee',
      name: `☕ ${getTierDisplayName('coffee')}`,  // ← Shows "Solo"
      price: billingFrequency === 'monthly'
        ? `$${getPriceForTier('coffee')}/mo`
        : `$${(getPriceForTier('coffee') / 12).toFixed(2)}/mo`,
      billingLabel: billingFrequency === 'annual' ? 'billed annually' : 'billed monthly',
      savings: billingFrequency === 'annual' ? getAnnualSavings('coffee') : null,
      // ... solo tier config
    },
    {
      id: 'growth',
      name: '🚀 GROWTH',
      price: billingFrequency === 'monthly'
        ? `$${getPriceForTier('growth')}/mo`
        : `$${(getPriceForTier('growth') / 12).toFixed(2)}/mo`,
      hasTrial: true,
      trialDays: 7,
      recommended: true,  // ← Growth is now recommended
      // ... growth tier config
    },
    {
      id: 'scale',
      name: '📈 SCALE',
      // ... scale tier config
    }
  ];

  return (
    <div>
      <BillingToggle
        billingFrequency={billingFrequency}
        onChange={handleBillingChange}
      />

      <div className="tier-cards">
        {tiers.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            selected={selectedTier === tier.id}
            onSelect={() => onTierChange(tier.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

**Test Gate**: Playwright E2E test verifies:
- ✅ Default: Growth + Annual selected
- ✅ Toggle billing: Prices update
- ✅ Coffee displays as "Solo"
- ✅ All 4 tiers selectable

---

### Phase 5: Stripe Product Setup (Manual - 1 day)

**Where**: Stripe Dashboard (test + live mode)

**Products to Create**:

1. **Solo Monthly**: $5.95/month
   - Price ID: `price_COFFEE_MONTHLY`
   - Metadata: `tier=coffee`

2. **Solo Annual**: $49.50/year
   - Price ID: `price_COFFEE_ANNUAL`
   - Metadata: `tier=coffee, billing=annual`

3. **Growth Monthly**: $17.95/month
   - Price ID: `price_GROWTH_MONTHLY`
   - Metadata: `tier=growth`

4. **Growth Annual**: $149.50/year
   - Price ID: `price_GROWTH_ANNUAL`
   - Metadata: `tier=growth, billing=annual`

5. **Scale Monthly**: $34.95/month
   - Price ID: `price_SCALE_MONTHLY`

6. **Scale Annual**: $299.50/year
   - Price ID: `price_SCALE_ANNUAL`

**Trial Configuration**:
- Growth tier ONLY
- 7-day trial
- Card required upfront
- $0 charge for 7 days
- Auto-converts to selected billing after trial

**Test Gate**: Manual Stripe testing
- Create test checkout for each product
- Verify pricing displays correctly
- Test trial flow (Growth tier only)

---

### Phase 6: Update Stripe Edge Functions (2 days)

**Files to Modify**:
1. `supabase/functions/create-checkout-session/index.ts`
2. `supabase/functions/stripe-webhook/index.ts`

**create-checkout-session Changes**:

```typescript
// BEFORE (line 22):
let { priceId, userId, tier, successUrl, cancelUrl, mode } = requestBody;

// AFTER:
let { priceId, userId, tier, billingFrequency, isTrial, successUrl, cancelUrl, mode } = requestBody;

// ADD new logic:
if (!priceId) {
  // Dynamically select price based on tier + billing frequency
  const PRICE_IDS = {
    coffee_monthly: 'price_COFFEE_MONTHLY',
    coffee_annual: 'price_COFFEE_ANNUAL',
    growth_monthly: 'price_GROWTH_MONTHLY',
    growth_annual: 'price_GROWTH_ANNUAL',
    scale_monthly: 'price_SCALE_MONTHLY',
    scale_annual: 'price_SCALE_ANNUAL'
  };

  const priceKey = `${tier}_${billingFrequency || 'monthly'}`;
  priceId = PRICE_IDS[priceKey];
}

// ADD trial logic (line 135+):
if (isTrial && tier === 'growth') {
  sessionParams.append('subscription_data[trial_period_days]', '7');
  sessionParams.append('payment_method_collection', 'always'); // Card required
}

// ADD metadata:
sessionParams.append('metadata[billing_frequency]', billingFrequency || 'monthly');
sessionParams.append('subscription_data[metadata][billing_frequency]', billingFrequency || 'monthly');
if (isTrial) {
  sessionParams.append('metadata[is_trial]', 'true');
}
```

**stripe-webhook Changes**:
- Parse `billing_frequency` from metadata
- Handle trial period tracking
- Update users table with trial_ends_at

**Test Gate**: Playwright test creates checkout sessions for all 6 products

---

### Phase 7: Feature Gating (2 days)

**Files to Modify**:
1. `src/lib/tierUtils.js` - Update hasFeatureAccess()
2. `src/components/AnalysisResults.jsx` - Add export restrictions
3. `src/components/Dashboard.jsx` - Show tier limits

**tierUtils.js Changes**:

```javascript
// UPDATE hasFeatureAccess function (line 196-211):
export function hasFeatureAccess(tier, feature) {
  const mappedTier = tier === 'professional' ? 'growth' : tier === 'enterprise' ? 'scale' : tier;

  const featureMatrix = {
    'pdf_export': ['coffee', 'growth', 'scale'],
    'unlimited_analyses': ['coffee', 'growth', 'scale'],
    'llms_txt': ['growth', 'scale'],        // ← Growth+ only
    'csv_export': ['growth', 'scale'],      // ← Growth+ only
    'api_access': ['scale'],                // ← Scale only
    'priority_support': ['growth', 'scale'],
    'team_management': ['scale']
  };

  return featureMatrix[feature]?.includes(mappedTier) || false;
}
```

**AnalysisResults.jsx** - Add upgrade prompts:
```jsx
// Add to export section:
{!hasFeatureAccess(userTier, 'csv_export') && (
  <div className="upgrade-prompt">
    <p>CSV export available on Growth tier</p>
    <button onClick={handleUpgrade}>Upgrade to Growth</button>
  </div>
)}

{!hasFeatureAccess(userTier, 'llms_txt') && (
  <div className="upgrade-prompt">
    <p>LLMS.txt generation available on Growth tier</p>
    <button onClick={handleUpgrade}>Upgrade to Growth</button>
  </div>
)}
```

**Test Gate**: E2E tests verify:
- ✅ Free tier: No exports
- ✅ Solo tier: PDF only (no CSV/LLMS.txt)
- ✅ Growth tier: All exports enabled
- ✅ Scale tier: API access enabled

---

### Phase 8: Doug Hall Dynamic Messaging (3 days)

**NEW FILES**:
1. `src/components/DynamicMessagingPanel.jsx`
2. `src/config/tierMessaging.js`

**tierMessaging.js**:
```javascript
// 4 tiers × 2 billing = 8 copy variations
export const TIER_MESSAGING = {
  free_monthly: {
    headline: "WHAT YOU'RE MISSING OUT ON",
    overt_benefit: "3 analyses/month won't find what competitors WILL discover",
    reasons_to_believe: [
      "❌ Only 3 analyses (competitors run unlimited)",
      "❌ Results expire (no historical tracking)",
      "❌ No exports (can't share insights)"
    ],
    dramatic_difference: "Solo users find 10x more insights for less than a coffee",
    cta: "Upgrade to Solo for $4.13/month (annual)"
  },
  coffee_annual: {
    headline: "SMART CHOICE - You're Saving $21.90/Year",
    overt_benefit: "Unlimited insights for $4.13/month",
    // ... etc
  },
  growth_annual: {
    headline: "YOU MADE THE RIGHT CHOICE ✅",
    overt_benefit: "Most customers choose Growth - here's why",
    // ... validation messaging
  },
  // ... 5 more variations
};
```

**DynamicMessagingPanel.jsx**:
```jsx
const DynamicMessagingPanel = ({ selectedTier, billingFrequency }) => {
  const messagingKey = `${selectedTier}_${billingFrequency}`;
  const copy = TIER_MESSAGING[messagingKey];

  return (
    <div className="messaging-panel fade-transition">
      <h3 className="headline">{copy.headline}</h3>
      <p className="overt-benefit">{copy.overt_benefit}</p>
      <ul>
        {copy.reasons_to_believe.map(reason => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="dramatic-difference">{copy.dramatic_difference}</div>
    </div>
  );
};
```

**Test Gate**: E2E tests verify copy changes on tier + billing toggles

---

## Testing Strategy

### Test Gate Checklist:

**Phase 1**: Database migration
- [ ] Run migration on staging
- [ ] Verify new columns exist
- [ ] Test rollback works

**Phase 2**: Tier config
- [ ] Unit tests pass
- [ ] getTierPrice() returns correct amounts
- [ ] getTierDisplayName('coffee') returns 'Solo'

**Phase 3**: Billing toggle
```bash
npx playwright test tests/e2e/billing-toggle.spec.js --headed
```
- [ ] Toggle switches between annual/monthly
- [ ] Prices update on toggle
- [ ] Annual shows savings badge

**Phase 4**: Tier selector
```bash
npx playwright test tests/e2e/tier-selector-rebuild.spec.js --headed
```
- [ ] All 4 tiers selectable
- [ ] Coffee displays as "Solo"
- [ ] Growth shows trial badge
- [ ] Default: Growth + Annual selected

**Phase 5**: Stripe products
- [ ] All 6 products created
- [ ] Test checkout for each
- [ ] Trial configured (Growth only)

**Phase 6**: Stripe integration
```bash
npx playwright test tests/e2e/stripe-integration.spec.js --headed
```
- [ ] Creates checkout for annual pricing
- [ ] Trial flow works (Growth only)
- [ ] Webhook updates billing_frequency

**Phase 7**: Feature gating
```bash
npx playwright test tests/e2e/feature-gating.spec.js --headed
```
- [ ] Solo: PDF only
- [ ] Growth: CSV + LLMS.txt enabled
- [ ] Upgrade prompts show correctly

**Phase 8**: Dynamic messaging
```bash
npx playwright test tests/e2e/dynamic-messaging.spec.js --headed
```
- [ ] Copy changes on tier selection
- [ ] Copy changes on billing toggle
- [ ] Transitions smooth (no jank)

---

## Success Criteria

### Technical:
- ✅ All Playwright tests pass
- ✅ No console errors
- ✅ Lighthouse score >90
- ✅ Works on Chrome, Safari, Firefox
- ✅ Mobile responsive

### Business:
- ✅ Conversion rate: 8-12% → 25-35%
- ✅ Annual adoption: 30-40%
- ✅ Growth tier: 70% of paid users
- ✅ Trial-to-paid: 49-60%

---

## File Changes Summary

### NEW FILES (8):
1. `src/config/tiers.js` - Centralized tier config
2. `src/config/tierMessaging.js` - Doug Hall copy matrix
3. `src/components/BillingToggle.jsx` - Annual/Monthly toggle
4. `src/components/PricingDisplay.jsx` - Price renderer
5. `src/components/DynamicMessagingPanel.jsx` - Dynamic copy panel
6. `src/hooks/useBillingPricing.js` - Pricing logic hook
7. `supabase/migrations/YYYYMMDD_add_billing_fields.sql` - DB schema
8. `tests/e2e/tier-realignment-suite.spec.js` - E2E test suite

### MODIFIED FILES (12):
1. `src/components/TierSelector.jsx` - Complete rebuild
2. `src/lib/tierUtils.js` - Update tier names, feature matrix
3. `src/components/Signup.jsx` - Add billing frequency to state
4. `src/components/OAuthCallback.jsx` - Pass billingFrequency
5. `src/pages/Dashboard.jsx` - Show tier restrictions
6. `src/components/AnalysisResults.jsx` - Export restrictions
7. `supabase/functions/create-checkout-session/index.ts` - Annual + trial
8. `supabase/functions/stripe-webhook/index.ts` - Track billing frequency
9. `supabase/functions/analyze-page/lib/TierManager.ts` - Feature checks
10. `.env.local` - Add new Stripe price IDs
11. `src/App.jsx` - Pass billing frequency through routes
12. `src/contexts/AuthContext.jsx` - Store billingFrequency

### DELETED FILES (0):
- None - all changes are additive or modifications

---

## Timeline Estimate

| Phase | Duration | Critical Path |
|-------|----------|---------------|
| Phase 1: Database | 1 day | Yes |
| Phase 2: Tier Config | 1 day | Yes |
| Phase 3: Billing Toggle | 2 days | Yes |
| Phase 4: TierSelector Rebuild | 3 days | Yes |
| Phase 5: Stripe Setup | 1 day | Parallel |
| Phase 6: Stripe Functions | 2 days | Yes |
| Phase 7: Feature Gating | 2 days | Parallel |
| Phase 8: Dynamic Messaging | 3 days | Parallel |
| **TOTAL** | **10-12 days** | |

**Phases 5, 7, 8 can run in parallel with others**

---

## Risk Mitigation

### High Risk:
1. **Stripe price ID changes** → Test extensively in Stripe test mode first
2. **Database migration** → Test on staging, have rollback ready
3. **OAuth flow breaks** → Keep billingFrequency optional for backward compatibility

### Medium Risk:
1. **Tier display name confusion** → Clear documentation: "coffee" (internal) vs "Solo" (display)
2. **Feature gating edge cases** → Comprehensive E2E test coverage

### Low Risk:
1. **Copy changes** → Easy to update tierMessaging.js
2. **Visual polish** → Iterative improvements post-launch

---

**Last Updated**: October 25, 2025
**Document Owner**: Development Team
**Status**: Ready for Implementation
