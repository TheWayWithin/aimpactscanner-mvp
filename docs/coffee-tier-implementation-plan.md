# Coffee Tier Technical Implementation Plan
## $5/Month Strategic Tier for Immediate Revenue Generation

**Version**: 1.0.0  
**Date**: July 21st, 2025  
**Priority**: High - Immediate Implementation  
**Target**: Live within 1-2 days  
**Revenue Impact**: $500-1,500 MRR Month 1  

---

## 🎯 Coffee Tier Strategy Overview

### **Business Rationale**
- **$5 "Buy Me a Coffee" messaging** removes psychological barriers
- **Unlimited Phase A access** provides immediate value
- **25-35% conversion rate** expected vs industry 15%
- **Immediate monetization** of proven MVP capabilities
- **Natural upgrade path** to Professional ($29) tier

### **Value Proposition**
✅ **Unlimited analyses** with Phase A factors (10 factors)  
✅ **Sub-15 second results** with professional recommendations  
✅ **Clean, exportable results** without watermarks  
✅ **Educational content** during analysis  
✅ **Professional-grade accuracy** with 500%+ improvement  

---

## 🏗️ Technical Architecture Requirements

### **1. Database Schema Enhancements**

#### **Users Table Modifications**
```sql
-- Add tier management to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_analyses_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';

-- Create index for efficient tier queries
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
```

#### **Subscription Tracking Table**
```sql
-- Create subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### **Usage Analytics Table**
```sql
-- Create usage tracking for analytics
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(20) DEFAULT 'phase_a',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_usage_analytics_user_tier ON usage_analytics(user_id, tier);
CREATE INDEX idx_usage_analytics_date ON usage_analytics(created_at);
```

### **2. Edge Function Enhancements**

#### **Tier Validation Middleware**
```typescript
// supabase/functions/analyze-page/lib/TierManager.ts
export class TierManager {
  static async validateAnalysisAccess(userId: string, supabase: any): Promise<{
    allowed: boolean;
    tier: string;
    remainingAnalyses?: number;
    upgradeRequired?: boolean;
    message?: string;
  }> {
    // Get user tier and usage
    const { data: user } = await supabase
      .from('users')
      .select('tier, monthly_analyses_used, monthly_reset_date, tier_expires_at')
      .eq('id', userId)
      .single();

    if (!user) {
      return { allowed: false, tier: 'unknown', message: 'User not found' };
    }

    // Check if monthly reset needed
    const today = new Date().toISOString().split('T')[0];
    if (user.monthly_reset_date !== today) {
      await supabase
        .from('users')
        .update({
          monthly_analyses_used: 0,
          monthly_reset_date: today
        })
        .eq('id', userId);
      user.monthly_analyses_used = 0;
    }

    // Tier-specific validation
    switch (user.tier) {
      case 'free':
        if (user.monthly_analyses_used >= 3) {
          return {
            allowed: false,
            tier: 'free',
            remainingAnalyses: 0,
            upgradeRequired: true,
            message: 'Free tier limit reached. Upgrade to Coffee tier for unlimited access!'
          };
        }
        return {
          allowed: true,
          tier: 'free',
          remainingAnalyses: 3 - user.monthly_analyses_used
        };

      case 'coffee':
        // Check subscription status and expiry
        if (user.tier_expires_at && new Date(user.tier_expires_at) < new Date()) {
          await this.downgradeTier(userId, supabase);
          return {
            allowed: false,
            tier: 'expired',
            upgradeRequired: true,
            message: 'Coffee tier subscription expired. Please renew for unlimited access!'
          };
        }
        return { allowed: true, tier: 'coffee' };

      case 'professional':
      case 'enterprise':
        // Full access for premium tiers
        return { allowed: true, tier: user.tier };

      default:
        return { allowed: false, tier: 'unknown', message: 'Invalid tier' };
    }
  }

  static async incrementUsage(userId: string, tier: string, analysisId: string, supabase: any) {
    // Increment usage for free tier
    if (tier === 'free') {
      await supabase
        .from('users')
        .update({ monthly_analyses_used: supabase.rpc('increment_analyses') })
        .eq('id', userId);
    }

    // Record usage analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        analysis_id: analysisId,
        tier: tier,
        analysis_type: 'phase_a'
      });
  }

  static async downgradeTier(userId: string, supabase: any) {
    await supabase
      .from('users')
      .update({
        tier: 'free',
        tier_expires_at: null,
        subscription_status: 'inactive'
      })
      .eq('id', userId);
  }
}
```

#### **Enhanced Edge Function**
```typescript
// supabase/functions/analyze-page/index.ts - Enhanced with tier validation
import { TierManager } from './lib/TierManager.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, userId, analysisId } = await req.json();

    // Validate tier access BEFORE analysis
    const accessCheck = await TierManager.validateAnalysisAccess(userId, supabase);
    
    if (!accessCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: accessCheck.message,
          tier: accessCheck.tier,
          upgradeRequired: accessCheck.upgradeRequired,
          remainingAnalyses: accessCheck.remainingAnalyses
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Proceed with analysis
    const analysisEngine = new AnalysisEngine(supabase, analysisId, userId);
    const result = await analysisEngine.analyze(url);

    // Increment usage tracking
    await TierManager.incrementUsage(userId, accessCheck.tier, analysisId, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        result,
        tier: accessCheck.tier,
        remainingAnalyses: accessCheck.remainingAnalyses
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### **3. Frontend UI Enhancements**

#### **Tier Selection Component**
```jsx
// src/components/TierSelection.jsx
import React, { useState } from 'react';

const TierSelection = ({ currentTier, onUpgrade }) => {
  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      analyses: '3 per month',
      features: ['Basic recommendations', 'Phase A factors', 'Watermarked results'],
      cta: 'Current Plan',
      highlight: false
    },
    {
      id: 'coffee',
      name: '☕ Coffee',
      price: 5,
      analyses: 'Unlimited',
      features: ['Professional recommendations', 'Phase A factors', 'Clean results', 'Export capabilities'],
      cta: 'Buy Me a Coffee',
      highlight: true,
      popular: true
    },
    {
      id: 'professional',
      name: '💼 Professional',
      price: 29,
      analyses: 'Unlimited',
      features: ['Everything in Coffee', 'Phase B factors (22 total)', 'Advanced analysis', 'Priority support'],
      cta: 'Go Professional',
      highlight: false,
      comingSoon: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {tiers.map(tier => (
        <div
          key={tier.id}
          className={`relative rounded-lg border-2 p-6 ${
            tier.highlight ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          } ${tier.comingSoon ? 'opacity-75' : ''}`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
          )}
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900">${tier.price}</span>
              {tier.price > 0 && <span className="text-gray-500">/month</span>}
            </div>
            <p className="mt-2 text-sm text-gray-600">{tier.analyses} analyses</p>
          </div>

          <ul className="mt-6 space-y-3">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            {tier.comingSoon ? (
              <button
                disabled
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : currentTier === tier.id ? (
              <button
                disabled
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-500 bg-gray-100"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => onUpgrade(tier.id)}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  tier.highlight
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {tier.cta}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TierSelection;
```

#### **Usage Dashboard Component**
```jsx
// src/components/UsageDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const UsageDashboard = ({ user }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const fetchUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tier, monthly_analyses_used, tier_expires_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading usage...</div>;

  const getRemainingAnalyses = () => {
    if (usage.tier === 'free') {
      return Math.max(0, 3 - usage.monthly_analyses_used);
    }
    return 'Unlimited';
  };

  const getUsageColor = () => {
    if (usage.tier !== 'free') return 'text-green-600';
    const remaining = getRemainingAnalyses();
    if (remaining === 0) return 'text-red-600';
    if (remaining === 1) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Plan</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Tier</span>
          <span className="font-medium capitalize">{usage.tier}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Analyses Remaining</span>
          <span className={`font-medium ${getUsageColor()}`}>
            {getRemainingAnalyses()}
          </span>
        </div>

        {usage.tier === 'free' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Upgrade to Coffee tier for unlimited analyses at just $5/month!
            </p>
          </div>
        )}

        {usage.tier_expires_at && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expires</span>
            <span className="font-medium">
              {new Date(usage.tier_expires_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageDashboard;
```

### **4. Stripe Integration**

#### **Stripe Configuration**
```javascript
// src/lib/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const COFFEE_TIER_PRICE_ID = 'price_coffee_tier_monthly'; // Set in Stripe Dashboard

export const createCheckoutSession = async (priceId, userId) => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId,
      userId,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/pricing`
    }
  });

  if (error) throw error;

  const stripe = await stripePromise;
  const { error: stripeError } = await stripe.redirectToCheckout({
    sessionId: data.sessionId
  });

  if (stripeError) throw stripeError;
};

export default stripePromise;
```

#### **Stripe Webhook Handler**
```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, supabase);
        break;
    }

    return new Response('Webhook handled', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, supabase: any) {
  const { customer, subscription, metadata } = session;
  const userId = metadata.userId;

  // Update user tier
  await supabase
    .from('users')
    .update({
      tier: 'coffee',
      stripe_customer_id: customer,
      subscription_status: 'active',
      tier_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
    .eq('id', userId);

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: 'coffee',
      stripe_subscription_id: subscription,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
}
```

---

## 🚀 Implementation Timeline

### **Day 1: Core Infrastructure**
- [ ] Database schema updates and migrations
- [ ] TierManager class implementation
- [ ] Edge Function tier validation integration
- [ ] Basic tier selection UI component

### **Day 2: Payment Integration**
- [ ] Stripe product and price configuration
- [ ] Checkout session creation endpoint
- [ ] Webhook handler implementation
- [ ] Payment flow UI integration

### **Day 3: Testing & Launch**
- [ ] End-to-end payment flow testing
- [ ] Tier enforcement validation
- [ ] Analytics tracking verification
- [ ] Production deployment and monitoring

---

## 📊 Success Metrics

### **Technical KPIs**
- **Tier validation accuracy**: 100% (no unauthorized access)
- **Payment flow conversion**: 95%+ completion rate
- **Performance impact**: <100ms additional latency for tier checks
- **Error rate**: <1% for payment processing

### **Business KPIs**
- **Free to Coffee conversion**: 25-35% target
- **Revenue growth**: $500-1,500 MRR Month 1
- **User retention**: 80%+ Coffee tier monthly retention
- **Upgrade pathway**: 15-20% Coffee to Professional conversion

---

## 🔄 Future Enhancements

### **Phase 2 (Weeks 3-4)**
- **Usage analytics dashboard** for users
- **Tier comparison optimization** based on conversion data
- **Automated email campaigns** for upgrade prompts
- **Referral program** integration

### **Phase 3 (Month 2)**
- **Professional tier implementation** with Phase B factors
- **API access** for Enterprise tier
- **Team collaboration** features
- **Advanced analytics** and reporting

This implementation plan provides immediate revenue generation while building the foundation for comprehensive tier expansion and feature development.