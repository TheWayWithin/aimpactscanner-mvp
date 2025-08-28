# AImpactScanner Tier System Project Plan
**Last Updated**: August 28, 2025
**Status**: In Development
**Priority**: HIGH - Foundation for Revenue Generation

## Executive Summary
Complete implementation plan for all four subscription tiers (Free, Coffee, Growth, Scale) with proper authentication, payment processing, and feature gating. This plan ensures consistent behavior across all tiers and prevents future issues by implementing the logic now rather than retrofitting later.

## Current State (August 28, 2025)

### ✅ Completed
- **Free Tier**: Sign-up flow with email verification requirement
- **Coffee Tier**: Stripe integration with immediate payment redirect
- **Email Verification**: Proper enforcement preventing unverified access
- **UI Components**: CoffeeTierSignup, EmailVerificationPending, tier selection
- **Database Schema**: Users table with tier fields
- **Usage Tracking**: Client-side tracking for Free tier limits

### 🚧 In Progress
- **Growth Tier**: UI shows "Coming Soon" but needs backend logic
- **Scale Tier**: UI shows "Coming Soon" but needs backend logic
- **Stripe Products**: Only Coffee tier price ID configured

### ❌ Not Started
- **Growth/Scale Stripe Products**: Need price IDs and products in Stripe
- **Feature Gating**: Advanced features for higher tiers
- **API Access**: Scale tier API endpoints
- **Team Features**: Scale tier multi-user support

## Architecture Overview

### Sign-Up Flow (All Tiers)
```
1. User selects tier → CoffeeTierSignup component
2. Creates Supabase Auth account with tier metadata
3. Tier-specific routing:
   - Free: Sign out → Email verification page → Login
   - Coffee: Stripe checkout redirect → Payment → Welcome
   - Growth: [Future] Stripe checkout redirect → Payment → Welcome  
   - Scale: [Future] Stripe checkout redirect → Payment → Welcome
4. Email verification (all tiers)
5. UserInitializer creates database record after verification
```

### Tier Detection Hierarchy
```
Priority Order:
1. Stripe subscription status (active subscription)
2. Database tier field (users table)
3. Auth metadata (selected_tier)
4. LocalStorage fallback
5. Default to 'free'
```

## Implementation Plan

### Phase 1: Foundation (Completed ✅)
- [x] Free tier with email verification
- [x] Coffee tier with Stripe integration
- [x] Email verification enforcement
- [x] Basic tier detection logic
- [x] Usage tracking for Free tier

### Phase 2: Growth & Scale Backend (Current Sprint)

#### 2.1 Stripe Product Setup
```javascript
// Required Stripe products and prices
const STRIPE_PRODUCTS = {
  coffee: {
    priceId: 'price_coffee_tier_monthly', // ✅ Exists
    amount: 495, // $4.95
    features: ['unlimited_analyses', 'pdf_export', 'email_support']
  },
  growth: {
    priceId: 'price_growth_tier_monthly', // TODO: Create in Stripe
    amount: 2900, // $29.00
    features: ['all_coffee_features', '22_factors', 'priority_support', 'ai_remediation']
  },
  scale: {
    priceId: 'price_scale_tier_monthly', // TODO: Create in Stripe
    amount: 9900, // $99.00
    features: ['all_growth_features', 'api_access', 'white_label', 'team_collaboration']
  }
};
```

#### 2.2 Update CoffeeTierSignup Component
```javascript
// Enable Growth and Scale tiers when ready
const handleSignUp = async (e) => {
  // ... existing code ...
  
  if (selectedTier === 'growth' || selectedTier === 'scale') {
    // Remove "coming soon" logic
    // Implement same flow as Coffee tier
    const priceId = selectedTier === 'growth' 
      ? import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID 
      : import.meta.env.VITE_STRIPE_SCALE_PRICE_ID;
    
    // Redirect to Stripe checkout
    // ... similar to Coffee tier logic
  }
};
```

#### 2.3 Update UserInitializer
```javascript
// Handle all paid tiers consistently
if (selectedTier === 'coffee' || selectedTier === 'growth' || selectedTier === 'scale') {
  console.log(`💎 User selected ${selectedTier} tier - waiting for payment`);
  // Don't create database record - wait for Stripe webhook
  setStatus('ready');
  onUserReady?.({ tier: 'pending_payment', monthly_analyses_used: 0 });
  return;
}
```

### Phase 3: Feature Gating Implementation

#### 3.1 Feature Configuration
```javascript
// lib/featureFlags.js
export const TIER_FEATURES = {
  free: {
    monthlyAnalyses: 3,
    factors: 10,
    pdfExport: false,
    apiAccess: false,
    teamMembers: 1,
    support: 'community',
    whiteLabel: false,
    aiRemediation: false
  },
  coffee: {
    monthlyAnalyses: Infinity,
    factors: 10,
    pdfExport: true,
    apiAccess: false,
    teamMembers: 1,
    support: 'email',
    whiteLabel: false,
    aiRemediation: false
  },
  growth: {
    monthlyAnalyses: Infinity,
    factors: 22,
    pdfExport: true,
    apiAccess: false,
    teamMembers: 1,
    support: 'priority',
    whiteLabel: false,
    aiRemediation: true
  },
  scale: {
    monthlyAnalyses: Infinity,
    factors: 22,
    pdfExport: true,
    apiAccess: true,
    teamMembers: 10,
    support: 'dedicated',
    whiteLabel: true,
    aiRemediation: true
  }
};

export const canAccessFeature = (userTier, feature) => {
  return TIER_FEATURES[userTier]?.[feature] || false;
};
```

#### 3.2 Component Guards
```javascript
// components/FeatureGuard.jsx
const FeatureGuard = ({ tier, requiredTier, children, fallback }) => {
  const tierHierarchy = ['free', 'coffee', 'growth', 'scale'];
  const userTierIndex = tierHierarchy.indexOf(tier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  if (userTierIndex >= requiredTierIndex) {
    return children;
  }
  
  return fallback || <UpgradePrompt requiredTier={requiredTier} />;
};
```

### Phase 4: Stripe Webhook Enhancement

#### 4.1 Handle All Tier Subscriptions
```javascript
// supabase/functions/stripe-webhook/index.ts
const handleSubscriptionCreated = async (subscription) => {
  const tier = getTierFromPriceId(subscription.items.data[0].price.id);
  
  await supabase.from('users').update({
    tier,
    subscription_tier: tier,
    subscription_status: 'active',
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    tier_expires_at: new Date(subscription.current_period_end * 1000)
  }).eq('email', subscription.customer_email);
};

const getTierFromPriceId = (priceId) => {
  const priceToTier = {
    [process.env.STRIPE_COFFEE_PRICE_ID]: 'coffee',
    [process.env.STRIPE_GROWTH_PRICE_ID]: 'growth',
    [process.env.STRIPE_SCALE_PRICE_ID]: 'scale'
  };
  return priceToTier[priceId] || 'free';
};
```

### Phase 5: Testing & Validation

#### 5.1 Test Matrix
| Scenario | Free | Coffee | Growth | Scale |
|----------|------|--------|--------|-------|
| Sign-up flow | ✅ | ✅ | 🚧 | 🚧 |
| Email verification | ✅ | ✅ | 🚧 | 🚧 |
| Stripe payment | N/A | ✅ | 🚧 | 🚧 |
| Feature access | ✅ | ✅ | 🚧 | 🚧 |
| Usage limits | ✅ | ✅ | 🚧 | 🚧 |
| PDF export | ✅ | ✅ | 🚧 | 🚧 |
| Support type | ✅ | ✅ | 🚧 | 🚧 |

#### 5.2 Automated Tests
```javascript
// tests/tiers/tier-signup.spec.js
describe('Tier Sign-up Flows', () => {
  test('Free tier requires email verification', async () => {
    // Test implementation
  });
  
  test('Coffee tier redirects to Stripe', async () => {
    // Test implementation
  });
  
  test('Growth tier redirects to Stripe', async () => {
    // Test implementation
  });
  
  test('Scale tier redirects to Stripe', async () => {
    // Test implementation
  });
});
```

## Migration Strategy

### When Activating Growth/Scale Tiers

1. **Pre-Launch Checklist**
   - [ ] Create Stripe products and prices
   - [ ] Add price IDs to environment variables
   - [ ] Update Edge Functions with new price mappings
   - [ ] Test payment flows in test mode
   - [ ] Update feature flags configuration
   - [ ] Create tier-specific email templates

2. **Launch Steps**
   ```bash
   # 1. Update environment variables
   VITE_STRIPE_GROWTH_PRICE_ID=price_xxx
   VITE_STRIPE_SCALE_PRICE_ID=price_yyy
   
   # 2. Deploy Edge Function updates
   supabase functions deploy stripe-webhook
   supabase functions deploy create-checkout-session
   
   # 3. Enable tiers in UI
   # Remove "coming soon" logic from CoffeeTierSignup
   
   # 4. Test complete flow
   npm run test:tiers
   ```

3. **Post-Launch Monitoring**
   - Monitor Stripe webhook events
   - Check user tier assignments
   - Verify feature access
   - Track conversion rates

## Risk Mitigation

### Common Issues and Prevention

1. **Email Verification Bypass**
   - **Risk**: Users accessing app without verification
   - **Mitigation**: ✅ Implemented auth state checks
   - **Testing**: Regular auth flow testing

2. **Tier Mismatch**
   - **Risk**: UI shows different tier than backend
   - **Mitigation**: Single source of truth (Stripe → DB → UI)
   - **Testing**: Tier consistency checks

3. **Payment Failure Handling**
   - **Risk**: Users stuck in pending state
   - **Mitigation**: Timeout and retry logic
   - **Testing**: Stripe webhook failure scenarios

4. **Feature Access Bugs**
   - **Risk**: Free users accessing paid features
   - **Mitigation**: Server-side feature validation
   - **Testing**: Feature guard testing

## Success Metrics

### Key Performance Indicators
- Sign-up completion rate: >80%
- Email verification rate: >95%
- Payment success rate: >90%
- Tier upgrade rate: >5%
- Feature adoption by tier: Track usage

### Monitoring Dashboard
```javascript
// Track these events in GTM/Analytics
const TIER_EVENTS = {
  'tier_selected': { tier, timestamp },
  'email_verified': { tier, time_to_verify },
  'payment_initiated': { tier, amount },
  'payment_completed': { tier, amount },
  'feature_accessed': { tier, feature },
  'tier_upgraded': { from_tier, to_tier },
  'tier_downgraded': { from_tier, to_tier }
};
```

## Timeline

### Sprint 1 (Current - August 28-30, 2025)
- [x] Fix Free tier email verification
- [x] Document tier system architecture
- [ ] Create Growth/Scale Stripe products
- [ ] Update environment variables

### Sprint 2 (September 2-6, 2025)
- [ ] Implement Growth tier flow
- [ ] Implement Scale tier flow
- [ ] Update UserInitializer for all tiers
- [ ] Test payment flows

### Sprint 3 (September 9-13, 2025)
- [ ] Implement feature gating
- [ ] Create tier-specific UI elements
- [ ] Add API access for Scale tier
- [ ] Complete testing matrix

### Sprint 4 (September 16-20, 2025)
- [ ] Production testing
- [ ] Documentation updates
- [ ] Launch preparation
- [ ] Monitoring setup

## Conclusion

This comprehensive plan ensures all four tiers work consistently and securely. By implementing the logic for Growth and Scale tiers now (even if marked as "coming soon"), we avoid technical debt and ensure a smooth launch when these tiers become available. The architecture supports easy activation of new tiers without major code changes.

### Next Immediate Steps
1. Create Stripe products for Growth and Scale tiers
2. Update environment variables with price IDs
3. Implement tier logic in CoffeeTierSignup component
4. Test complete flow for all tiers
5. Deploy to production with tiers disabled in UI

### Contact
For questions or updates to this plan, consult the development team or review the latest progress in `/progress.md`.