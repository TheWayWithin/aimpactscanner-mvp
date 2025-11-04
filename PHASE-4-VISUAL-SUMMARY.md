# Phase 4 Visual Summary
## Basic Tier Selector with Billing Toggle

**What was built**: Conversion-optimized tier selector component with billing frequency control

---

## Component Layout (Current - Phase 4)

```
┌─────────────────────────────────────────────────────────────┐
│ GET STARTED WITH AIMPACTSCANNER                             │
│ Make your business AI-discoverable in 60 seconds            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Billing Frequency:                                          │
│ ┌──────────┬─────────────────────────┐                      │
│ │ Monthly  │  Annual (Save 2mo) ✓    │ ← Gold when selected │
│ └──────────┴─────────────────────────┘                      │
│ 💰 Save up to $119.90/year with annual billing              │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│ ○ ⚠️ FREE (Limited)                     $0/mo               │
│   Only 3 analyses/month                                     │
│                                                              │
│ ○ 💼 Solo                              $4.13/mo             │
│   10 analyses/month, 30-day tracking   billed $49.50 annually│
│                                         Save $21.90/year     │
│                                                              │
│ ● 🚀 Growth        [⭐ RECOMMENDED]    $12.46/mo            │
│   40 analyses/month, 90-day tracking,  billed $149.50 annually│
│   CSV + LLMS.txt                       Save $65.90/year     │
│                                                              │
│ ○ 🏢 Scale                            $24.96/mo             │
│   100 analyses/month, unlimited        billed $299.50 annually│
│   history, API access                  Save $119.90/year    │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│ Selected: 🚀 Growth                                          │
│ $12.46/mo                                                    │
│ billed $149.50 annually                                      │
│ 💰 Save $65.90/year                                          │
│                                                              │
│ ┌──────────────────────────────────────────┐                │
│ │      Continue to Sign Up →               │                │
│ └──────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual States

### Annual Billing (Default)
```
Billing Toggle:  [Monthly] [Annual ✓] ← Gold background
Savings Message: 💰 Save up to $119.90/year with annual billing

Growth Tier Pricing:
  $12.46/mo
  billed $149.50 annually
  💰 Save $65.90/year
```

### Monthly Billing
```
Billing Toggle:  [Monthly ✓] [Annual] ← Blue background (monthly)
Savings Message: Switch to annual to save up to $119.90/year

Growth Tier Pricing:
  $17.95/mo
  billed monthly
```

---

## Tier-Specific Colors

### Free Tier
```
○ ⚠️ FREE (Limited)                     $0/mo
  Only 3 analyses/month

Border: Gray (#D1D5DB)
Background (selected): Gray-50 (#F9FAFB)
```

### Solo Tier (coffee internally)
```
○ 💼 Solo                              $4.13/mo
  10 analyses/month, 30-day tracking   billed $49.50 annually
                                        Save $21.90/year

Border: Blue (#60A5FA)
Background (selected): Blue-50 (#EFF6FF)
Display: "Solo" (Internal ID: "coffee")
```

### Growth Tier (Default Selected)
```
● 🚀 Growth        [⭐ RECOMMENDED]    $12.46/mo
  40 analyses/month, 90-day tracking,  billed $149.50 annually
  CSV + LLMS.txt                       Save $65.90/year

Border: Gold (#FBBF24)
Background (selected): Yellow-50 (#FEFCE8)
Badge: "⭐ RECOMMENDED" (gold, top-right)
```

### Scale Tier
```
○ 🏢 Scale                            $24.96/mo
  100 analyses/month, unlimited        billed $299.50 annually
  history, API access                  Save $119.90/year

Border: Purple (#C084FC)
Background (selected): Purple-50 (#FAF5FF)
```

---

## Pricing Comparison Table

| Tier | Monthly Price | Annual Price | Annual/mo Equivalent | Savings |
|------|---------------|--------------|---------------------|---------|
| Free | $0 | N/A | $0 | N/A |
| **Solo** | $5.95/mo | $49.50/year | **$4.13/mo** | **$21.90** (31% off) |
| **Growth** ⭐ | $17.95/mo | $149.50/year | **$12.46/mo** | **$65.90** (31% off) |
| **Scale** | $34.95/mo | $299.50/year | **$24.96/mo** | **$119.90** (29% off) |

---

## State Flow

### User Journey
```
1. Page Load
   ↓
   Growth tier selected (radio checked)
   Annual billing selected (gold toggle)
   Displays: "$12.46/mo billed $149.50 annually"

2. User Clicks "Monthly" Toggle
   ↓
   Price transitions (500ms smooth fade)
   Displays: "$17.95/mo billed monthly"
   Savings message changes

3. User Selects "Solo" Tier
   ↓
   Tier transitions (200ms)
   Displays: "💼 Solo" + "$4.13/mo"
   Border color changes to blue

4. User Clicks "Continue to Sign Up"
   ↓
   Saves to localStorage:
   {
     selectedTier: "coffee",        // Internal ID!
     billingFrequency: "annual",
     mode: "signup",
     timestamp: 1730000000000
   }

   Shows OAuth buttons with confirmation:
   "✅ Plan Selected: Solo Tier (Annual Billing)"
```

---

## Technical Implementation

### Component Hierarchy
```
DynamicTierSelector (Container)
├── BillingToggle
│   ├── Monthly button
│   ├── Annual button ✓
│   └── Savings message
│
├── TierOptionsList
│   ├── Free tier (radio)
│   ├── Solo tier (radio)
│   ├── Growth tier (radio) ● ← Default
│   └── Scale tier (radio)
│
├── Selected Tier Summary
│   ├── Tier name + icon
│   ├── Price display
│   ├── Billing text
│   └── Savings badge (if annual)
│
└── Continue Button
```

### Data Flow
```
useBillingPricing Hook
↓
Calculates pricing for (tier, billingFrequency)
↓
Returns: {
  displayPrice: "$12.46/mo",
  displayBilling: "billed $149.50 annually",
  displaySavings: "Save $65.90/year",
  monthlyPrice: 17.95,
  annualPrice: 149.50,
  annualMonthlyEquivalent: 12.46,
  savings: 65.90
}
↓
Used by TierOptionsList for each tier
```

---

## Animations

### Billing Toggle Transition (500ms)
```
TIME: 0ms
┌─────────────┐
│ $17.95/mo   │  Monthly pricing visible
│ Billed...   │  Opacity: 1.0
└─────────────┘

TIME: 200ms (Fade Out)
┌─────────────┐
│ $17.95/mo   │  Opacity: 0.5 → 0.0
│ Billed...   │  Transform: scale(0.95)
└─────────────┘

TIME: 300ms (Fade In New)
┌─────────────┐
│ $12.46/mo   │  Opacity: 0.0 → 1.0
│ Billed...   │  Transform: scale(0.95) → 1.0
│ Save $65.90 │  Badge animates in
└─────────────┘

TIME: 500ms (Complete)
┌─────────────┐
│ $12.46/mo   │  Annual pricing visible
│ Billed...   │  Opacity: 1.0
│ Save $65.90 │
└─────────────┘
```

### Tier Selection Transition (200ms)
```
User clicks Solo tier
↓
isTransitioning = true (prevents clicks)
↓
setTimeout 200ms
↓
setSelectedTier('coffee')
isTransitioning = false
↓
Visual update: border color blue, background blue-50
```

---

## Display Name Mapping (Critical)

**Internal ID** (database, authContext):
- `coffee`

**Display Name** (user sees):
- `💼 Solo`

**Why?**
- Database uses "coffee" tier ID (can't change without migration)
- Users expect "Solo" (clearer positioning)
- Mapping handled at component layer only

**Implementation**:
```jsx
const tiers = [
  {
    internalId: 'coffee',           // Store this
    displayName: '💼 Solo',         // Show this
    description: '10 analyses/month, 30-day tracking'
  }
];

// When saving:
authContext.selectedTier = 'coffee'  // ← Internal ID

// When displaying:
"✅ Plan Selected: Solo Tier"  // ← Display name
```

---

## What's Next (Phase 5/6)

### Phase 5: Stripe Integration
- Create 6 Stripe products (Solo/Growth/Scale × monthly/annual)
- Configure Growth Annual with 7-day trial
- Update Edge Function to accept billingFrequency
- Map authContext to Stripe Price IDs

### Phase 6: Doug Hall Messaging
- Add DynamicMessagingPanel component
- Implement OB/RRB/DD copy for all tiers
- Add loss aversion messaging (Free tier)
- Add validation messaging (Growth tier)
- Add BillingWarningBox (monthly → annual prompt)
- Integrate 7-Day Trial messaging

### Phase 7: Mobile Optimization
- Dropdown tier selector (saves vertical space)
- Condensed copy (30% reduction)
- Sticky billing toggle
- Touch-optimized tap targets

---

## Success Metrics

**Target**: 25-35% paid tier conversion (up from 8-12%)

**Conversion Drivers**:
1. ✅ Growth tier default (not Free) - **Implemented**
2. ✅ Annual billing default (anchoring effect) - **Implemented**
3. ❌ Loss aversion messaging (Free tier) - Phase 6
4. ❌ 7-Day Trial (Growth tier) - Phase 5
5. ❌ Real-time persuasive messaging - Phase 6

**Current Status**: 2/5 drivers implemented (Phase 4 complete)

---

**Built by**: THE DEVELOPER (Agent-11)
**Date**: October 25, 2025
**Status**: READY FOR MANUAL TESTING

