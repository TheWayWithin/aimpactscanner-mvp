# Technical Design: OAuth-First Authentication & Monetization System

**Project**: AImpactScanner MVP
**Architect**: THE ARCHITECT
**Date**: 2025-10-02
**Status**: Ready for Implementation
**Priority**: CRITICAL - User Acquisition & Revenue System

---

## Executive Summary

This document provides comprehensive technical architecture for implementing OAuth-first authentication with tier-based monetization. The design follows security-first principles, works WITH existing infrastructure (RLS, CSP, useUserInitializer patterns), and implements graceful degradation at every level.

### Critical Design Principles Applied

✅ **Security-First**: Work WITH RLS policies, never bypass
✅ **Root Cause Analysis**: Understand existing patterns before modifying
✅ **Strategic Solutions**: Maintain system integrity throughout
✅ **Graceful Degradation**: Never block users due to payment/auth failures
✅ **Context Preservation**: Maintain user journey context through all redirects

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Component Architecture](#component-architecture)
3. [Authentication Flow Diagrams](#authentication-flow-diagrams)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [State Management](#state-management)
7. [Routing Logic](#routing-logic)
8. [Stripe Integration Architecture](#stripe-integration-architecture)
9. [Security Architecture](#security-architecture)
10. [Performance Optimization](#performance-optimization)
11. [Error Handling & Resilience](#error-handling--resilience)
12. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Decisions

### 1. Component Structure Decision

**Question**: Single signup component vs separate OAuth/Magic Link components?

**Decision**: **Hybrid approach with composable subcomponents**

**Rationale**:
- Modify existing `UnifiedRegistration.jsx` to be the container
- Extract auth methods into `<AuthMethodSelector>` reusable component
- Maintain tier selection UI in main component
- Allows code reuse between signup/login flows
- Easier testing and maintenance

**Implementation**:
```
/src/components/
  ├── UnifiedRegistration.jsx         (Container - modify existing)
  ├── AuthMethodSelector.jsx          (NEW - OAuth + Magic Link buttons)
  ├── TierSelector.jsx                (Extract from UnifiedRegistration)
  └── auth/
      ├── OAuthButton.jsx             (NEW - Reusable Google/GitHub)
      └── MagicLinkForm.jsx           (NEW - Email input + send)
```

**Key Changes to UnifiedRegistration.jsx**:
```javascript
// REMOVE:
- Password input fields (lines 390-466)
- Password validation logic (lines 69-106)
- confirmPassword state and validation

// REPLACE WITH:
<AuthMethodSelector
  selectedTier={selectedTier}
  onAuthComplete={(user) => handleAuthComplete(user)}
  onError={(error) => handleAuthError(error)}
/>

// KEEP:
- Tier selection UI (lines 292-369)
- Dynamic benefits display (lines 513-637)
- Message display logic
- Loading states
```

**Security Consideration**: Component isolation ensures OAuth tokens never exposed to parent components. Each auth method handles its own security boundary.

---

### 2. OAuth Callback Handling

**Question**: Where to inject custom routing logic after OAuth callback?

**Decision**: **Post-auth React component with useEffect hook**

**Rationale**:
- Supabase handles OAuth callback automatically at `/auth/v1/callback`
- Supabase redirects to `window.location.origin` after OAuth success
- We intercept at React Router level with `<OAuthCallback>` component
- Allows checking `session` state and routing based on user metadata

**Implementation**:
```
OAuth Flow:
1. User clicks "Google" → supabase.auth.signInWithOAuth({provider: 'google'})
2. Redirected to Google consent screen
3. Google redirects to: https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
4. Supabase processes OAuth → Creates session
5. Supabase redirects to: https://aimpactscanner.com/#/oauth-callback
6. React Router renders <OAuthCallback> component
7. Component useEffect:
   - Checks session.user.user_metadata.selected_tier
   - Retrieves localStorage.pendingAnalysisUrl
   - Calls getPostSignupDestination(user, context)
   - Redirects to appropriate page
```

**Code Structure**:
```javascript
// /src/pages/OAuthCallback.jsx
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const destination = getPostSignupDestination(
          session.user,
          getAnalysisContext()
        );

        // Route based on tier and context
        if (destination.requiresPayment) {
          // Stripe checkout needed
          navigate('/checkout', { state: destination });
        } else {
          // Go to analysis page
          navigate(destination.path, { state: destination.state });
        }
      } else {
        // No session - OAuth failed
        navigate('/register', { state: { error: 'OAuth failed' } });
      }
    });
  }, []);

  return <ComponentLoader message="Completing authentication..." />;
}
```

**Security Consideration**: Session validation happens server-side via Supabase. Component only routes based on validated session data.

---

### 3. Context Preservation Implementation

**Question**: localStorage vs sessionStorage for pendingAnalysisUrl?

**Decision**: **localStorage with 24-hour TTL**

**Rationale**:
- OAuth redirects may open in new tabs/windows → sessionStorage would lose data
- Users may close tab and return later → want context preserved
- 24-hour TTL prevents stale data accumulation
- More forgiving UX than sessionStorage

**Implementation**:
```javascript
// /src/lib/authHelpers.js

export function storeAnalysisContext(url, source = 'landing') {
  const context = {
    pendingAnalysisUrl: url,
    timestamp: Date.now(),
    journeySource: source, // 'landing' | 'direct'
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  try {
    localStorage.setItem('analysisContext', JSON.stringify(context));
    console.log('✅ Analysis context stored:', context);
  } catch (error) {
    console.warn('⚠️ localStorage unavailable, context will not persist');
    // Fallback: Store in sessionStorage
    sessionStorage.setItem('analysisContext', JSON.stringify(context));
  }
}

export function getAnalysisContext() {
  try {
    const stored = localStorage.getItem('analysisContext') ||
                   sessionStorage.getItem('analysisContext');

    if (!stored) return null;

    const context = JSON.parse(stored);

    // Check if expired (24 hour TTL)
    if (Date.now() > context.expiresAt) {
      console.log('⏰ Context expired, clearing...');
      clearAnalysisContext();
      return null;
    }

    // Validate URL format (prevent XSS)
    if (!isValidURL(context.pendingAnalysisUrl)) {
      console.warn('⚠️ Invalid URL in context, clearing...');
      clearAnalysisContext();
      return null;
    }

    return context;
  } catch (error) {
    console.error('❌ Error retrieving context:', error);
    return null;
  }
}

export function clearAnalysisContext() {
  localStorage.removeItem('analysisContext');
  sessionStorage.removeItem('analysisContext');
  console.log('🧹 Analysis context cleared');
}

function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
```

**Usage in Components**:
```javascript
// Landing.jsx - Store context on "Analyze" click
const handleAnalyzeClick = (url) => {
  storeAnalysisContext(url, 'landing');
  navigate('/register');
};

// OAuthCallback.jsx - Retrieve and use context
const context = getAnalysisContext();
if (context?.pendingAnalysisUrl) {
  navigate('/analyze', {
    state: { prefilledUrl: context.pendingAnalysisUrl }
  });
  clearAnalysisContext(); // Clear after use
}
```

**Security Consideration**: URL validation prevents XSS via stored context. Sanitize before displaying in input field using `DOMPurify` or similar.

---

### 4. Database Migration Strategy

**Question**: Single migration vs phased incremental changes?

**Decision**: **Two-migration approach for safety**

**Rationale**:
- Migration 020: Core auth/tier columns (safe, backward compatible)
- Migration 021: Waitlist table (separate concern, can deploy later)
- Allows testing auth changes without waitlist dependency
- Rollback is simpler with smaller migrations
- Follows existing migration pattern (incremental)

**Migration 020: Auth & Tier Columns**
```sql
-- File: /supabase/migrations/020_auth_monetization_columns.sql
-- Purpose: Add authentication and tier management columns
-- Status: REQUIRED before OAuth deployment

-- ============================================
-- STEP 1: Add new columns to users table
-- ============================================

-- Authentication tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
COMMENT ON COLUMN users.auth_provider IS 'OAuth provider: google, github, or email for magic link';

-- Tier management
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
COMMENT ON COLUMN users.selected_tier IS 'Tier selected during signup (may differ from current tier during payment)';

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
COMMENT ON COLUMN users.subscription_status IS 'active, pending_payment, canceled, past_due';

-- Stripe integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment tracking';

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';

-- Journey tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
COMMENT ON COLUMN users.is_first_login IS 'Skip upsell on first login after signup';

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
COMMENT ON COLUMN users.signup_source IS 'landing_url_entry, direct_signup, etc.';

-- Waitlist flags (separate table created in migration 021)
ALTER TABLE users ADD COLUMN IF NOT EXISTS growth_waitlist BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scale_waitlist BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlist_joined_at TIMESTAMPTZ;

-- Analytics
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_upsell_shown TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upsell_dismissed_count INTEGER DEFAULT 0;

-- ============================================
-- STEP 2: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_is_first_login ON users(is_first_login) WHERE is_first_login = true;

-- ============================================
-- STEP 3: Backfill existing users
-- ============================================

-- Set auth_provider for existing users (assume email-based)
UPDATE users
SET auth_provider = 'email'
WHERE auth_provider IS NULL;

-- Ensure subscription_status is set
UPDATE users
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

-- Ensure selected_tier matches tier for existing users
UPDATE users
SET selected_tier = COALESCE(tier, 'free')
WHERE selected_tier IS NULL OR selected_tier = '';

-- ============================================
-- STEP 4: Verification
-- ============================================

DO $$
BEGIN
    -- Verify all new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'auth_provider'
    ) THEN
        RAISE EXCEPTION 'Migration failed: auth_provider column not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_first_login'
    ) THEN
        RAISE EXCEPTION 'Migration failed: is_first_login column not created';
    END IF;

    -- Verify indexes created
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'users' AND indexname = 'idx_users_auth_provider'
    ) THEN
        RAISE EXCEPTION 'Migration failed: auth_provider index not created';
    END IF;

    RAISE NOTICE '✅ Migration 020 completed successfully';
    RAISE NOTICE '✅ All auth/tier columns created';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Existing users backfilled';
END $$;
```

**Migration 021: Waitlist Table**
```sql
-- File: /supabase/migrations/021_waitlist_table.sql
-- Purpose: Track Growth/Scale tier waitlist interest
-- Status: Can deploy independently after Migration 020

-- ============================================
-- STEP 1: Create waitlist table
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  current_tier TEXT NOT NULL,
  interested_tier TEXT NOT NULL CHECK (interested_tier IN ('growth', 'scale')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, interested_tier)
);

COMMENT ON TABLE waitlist IS 'Track user interest in upcoming Growth and Scale tiers';
COMMENT ON COLUMN waitlist.metadata IS 'Additional data: utm_source, referrer, etc.';

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own waitlist entries
CREATE POLICY "Users can insert own waitlist entries"
  ON waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access for admin/notification purposes
CREATE POLICY "Service role full access to waitlist"
  ON waitlist FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- STEP 3: Add indexes
-- ============================================

CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_interested_tier ON waitlist(interested_tier);
CREATE INDEX idx_waitlist_notified ON waitlist(notified) WHERE notified = false;
CREATE INDEX idx_waitlist_joined_at ON waitlist(joined_at DESC);

-- ============================================
-- STEP 4: Create helper function
-- ============================================

CREATE OR REPLACE FUNCTION join_waitlist(
  p_interested_tier TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  waitlist_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_current_tier TEXT;
  v_waitlist_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated', NULL::UUID;
    RETURN;
  END IF;

  -- Get user details
  SELECT email, tier INTO v_email, v_current_tier
  FROM users
  WHERE id = v_user_id;

  -- Validate tier
  IF p_interested_tier NOT IN ('growth', 'scale') THEN
    RETURN QUERY SELECT false, 'Invalid tier', NULL::UUID;
    RETURN;
  END IF;

  -- Insert or ignore if already exists
  INSERT INTO waitlist (user_id, email, current_tier, interested_tier)
  VALUES (v_user_id, v_email, v_current_tier, p_interested_tier)
  ON CONFLICT (user_id, interested_tier) DO NOTHING
  RETURNING id INTO v_waitlist_id;

  IF v_waitlist_id IS NULL THEN
    -- Already on waitlist
    RETURN QUERY SELECT true, 'Already on waitlist', NULL::UUID;
  ELSE
    -- Successfully added
    UPDATE users
    SET
      growth_waitlist = (p_interested_tier = 'growth') OR growth_waitlist,
      scale_waitlist = (p_interested_tier = 'scale') OR scale_waitlist,
      waitlist_joined_at = COALESCE(waitlist_joined_at, NOW())
    WHERE id = v_user_id;

    RETURN QUERY SELECT true, 'Added to waitlist', v_waitlist_id;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION join_waitlist TO authenticated;

-- ============================================
-- STEP 5: Verification
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'waitlist'
    ) THEN
        RAISE EXCEPTION 'Migration failed: waitlist table not created';
    END IF;

    IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'waitlist') < 3 THEN
        RAISE EXCEPTION 'Migration failed: RLS policies not created';
    END IF;

    RAISE NOTICE '✅ Migration 021 completed successfully';
    RAISE NOTICE '✅ Waitlist table created';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Helper function created';
END $$;
```

**Rollback Plan**:
```sql
-- Rollback Migration 021 (if needed)
DROP FUNCTION IF EXISTS join_waitlist;
DROP TABLE IF EXISTS waitlist;

-- Rollback Migration 020 (if needed - CAUTION)
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
ALTER TABLE users DROP COLUMN IF EXISTS growth_waitlist;
ALTER TABLE users DROP COLUMN IF EXISTS scale_waitlist;
ALTER TABLE users DROP COLUMN IF EXISTS waitlist_joined_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_upsell_shown;
ALTER TABLE users DROP COLUMN IF EXISTS upsell_dismissed_count;
```

---

### 5. Stripe Webhook Architecture

**Question**: Supabase Edge Function vs Netlify Function vs Separate API?

**Decision**: **Netlify Serverless Function** (recommended for this stack)

**Rationale**:
- Already using Netlify for frontend hosting
- Simpler deployment (same repo, same CI/CD)
- Environment variables managed in Netlify dashboard
- Auto-scaling included
- Cold starts acceptable for webhooks (not time-critical)
- Supabase Edge Functions would require separate deployment pipeline

**Alternative**: Supabase Edge Function (if preferred)
- Advantage: Closer to database (lower latency)
- Disadvantage: Separate deployment, harder local testing

**Implementation** (Netlify Functions):

```javascript
// File: /netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for writes
);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature (CRITICAL for security)
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' })
    };
  }

  console.log('✅ Webhook received:', stripeEvent.type);

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;

  console.log('💳 Payment successful:', { userId, tier });

  // Update user in database
  const { data, error } = await supabase
    .from('users')
    .update({
      tier: tier,
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('❌ Database update failed:', error);
    throw error;
  }

  console.log('✅ User upgraded to', tier, ':', data);

  // TODO: Send confirmation email
  // TODO: Trigger analytics event
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  // Find user by stripe_customer_id
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !users) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  // Determine subscription status
  let status = 'active';
  if (subscription.status === 'canceled') status = 'canceled';
  if (subscription.status === 'past_due') status = 'past_due';
  if (subscription.status === 'unpaid') status = 'past_due';

  await supabase
    .from('users')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', users.id);

  console.log('✅ Subscription updated:', { userId: users.id, status });
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const { data: users } = await supabase
    .from('users')
    .select('id, tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!users) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', users.id);

  console.log('✅ Subscription canceled, downgraded to free:', users.id);

  // TODO: Send cancellation confirmation email
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!users) return;

  // Mark subscription as past_due (don't downgrade immediately)
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', users.id);

  console.log('⚠️ Payment failed, marked as past_due:', users.id);

  // TODO: Send payment failure email with retry link
}
```

**Deployment**:
```bash
# Netlify automatically deploys functions in /netlify/functions/
# No build step required for webhook handler

# Environment Variables (set in Netlify dashboard):
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service role, not anon)
```

**Webhook URL**: `https://aimpactscanner.com/.netlify/functions/stripe-webhook`

**Testing Locally**:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local Netlify function
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

**Security Consideration**: Webhook signature verification is CRITICAL. Never trust webhook data without verifying the Stripe signature. Use service role key for database writes (RLS bypass required for webhook writes).

---

### 6. First Login Detection Mechanism

**Question**: When to update `is_first_login` flag?

**Decision**: **Update flag immediately after session established, before routing**

**Rationale**:
- Update in `OAuthCallback.jsx` and `useUserInitializer.js`
- Happens before routing decision is made
- Atomic operation - flag checked and updated in same flow
- Prevents race conditions with tab refreshes
- Simple, deterministic behavior

**Implementation**:

```javascript
// /src/lib/authHelpers.js

export async function getPostLoginDestination(user) {
  // Check first login flag
  const { data: userData, error } = await supabase
    .from('users')
    .select('is_first_login, tier, subscription_status')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('❌ Error checking first login:', error);
    // Fallback to dashboard on error
    return { path: '/dashboard', state: {} };
  }

  // FIRST LOGIN: Skip upsell, go directly to destination
  if (userData.is_first_login) {
    console.log('🎉 First login detected - skipping upsell');

    // Update flag IMMEDIATELY (async, don't wait)
    updateFirstLoginFlag(user.id);

    // Route based on signup context
    return getPostSignupDestination(user, getAnalysisContext());
  }

  // RETURNING USER: Show tier-based upsell
  console.log('👋 Returning user - showing upsell');
  return getUpsellPage(userData);
}

export async function updateFirstLoginFlag(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_first_login: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to update first login flag:', error);
    } else {
      console.log('✅ First login flag updated for user:', userId);
    }
  } catch (err) {
    console.error('❌ Exception updating first login flag:', err);
  }
}

export function getUpsellPage(userData) {
  const tier = userData.tier;

  if (tier === 'free') return { path: '/upsell/coffee', state: {} };
  if (tier === 'coffee') return { path: '/upsell/growth', state: {} };
  if (tier === 'growth') return { path: '/upsell/scale', state: {} };
  if (tier === 'scale') return { path: '/welcome/scale', state: {} };

  // Fallback
  return { path: '/dashboard', state: {} };
}

export function getPostSignupDestination(user, context) {
  // Has pending analysis from landing page
  if (context?.pendingAnalysisUrl) {
    clearAnalysisContext(); // Clear immediately to prevent reuse
    return {
      path: '/analyze',
      state: {
        prefilledUrl: context.pendingAnalysisUrl,
        fromSignup: true
      }
    };
  }

  // Direct signup, no context - empty analysis page
  return {
    path: '/analyze',
    state: {
      prefilledUrl: null,
      fromSignup: true
    }
  };
}
```

**Usage in OAuthCallback**:
```javascript
// /src/pages/OAuthCallback.jsx
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      // Determine destination based on first login status
      getPostLoginDestination(session.user).then(destination => {
        if (destination.requiresPayment) {
          navigate('/checkout', { state: destination });
        } else {
          navigate(destination.path, { state: destination.state });
        }
      });
    }
  });
}, []);
```

**Edge Cases Handled**:
1. **User refreshes during first login**: Flag already set to false, treated as second login (acceptable)
2. **Database update fails**: User still gets correct routing, flag update retried on next login
3. **Multiple tabs**: First tab to complete sets flag, other tabs see already-set flag (acceptable)
4. **User logs out and back in immediately**: Flag is false, upsell shown (correct behavior)

**Security Consideration**: Flag stored server-side, cannot be manipulated by client. RLS ensures users can only read their own flag value.

---

## Component Architecture

### Component Hierarchy

```
App.jsx
├── <PerformanceOptimizer>
├── <SimpleConsentBanner>
├── <AuthenticatedHeader> (if session)
├── <NavigationButtons>
│
├── Router
│   ├── / (Landing)
│   │   └── <Landing>
│   │
│   ├── /register
│   │   └── <UnifiedRegistration>
│   │       ├── <TierSelector>
│   │       └── <AuthMethodSelector>
│   │           ├── <OAuthButton provider="google">
│   │           ├── <OAuthButton provider="github">
│   │           └── <MagicLinkForm>
│   │
│   ├── /login
│   │   └── <Login>
│   │       └── <AuthMethodSelector>
│   │
│   ├── /oauth-callback (NEW)
│   │   └── <OAuthCallback>
│   │
│   ├── /analyze
│   │   └── <URLInput>
│   │       └── <SimpleAnalysisProgress>
│   │           └── <SimpleResultsDashboard>
│   │
│   ├── /upsell/coffee (NEW)
│   │   └── <UpsellCoffee>
│   │
│   ├── /upsell/growth (NEW)
│   │   └── <UpsellGrowth>
│   │
│   ├── /upsell/scale (NEW)
│   │   └── <UpsellScale>
│   │
│   ├── /welcome/scale (NEW)
│   │   └── <WelcomeScale>
│   │
│   ├── /checkout (NEW)
│   │   └── <StripeCheckout>
│   │
│   ├── /payment-success (NEW)
│   │   └── <PaymentSuccess>
│   │
│   ├── /payment-cancelled (NEW)
│   │   └── <PaymentCancelled>
│   │
│   └── /dashboard
│       └── <SimpleAccountDashboard>
│
└── <Footer>
```

### New Components to Create

#### 1. AuthMethodSelector.jsx
```javascript
// /src/components/AuthMethodSelector.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import OAuthButton from './auth/OAuthButton';
import MagicLinkForm from './auth/MagicLinkForm';

export default function AuthMethodSelector({
  selectedTier,
  onAuthComplete,
  onError,
  mode = 'signup' // 'signup' | 'login'
}) {
  const [loading, setLoading] = useState(false);

  const handleOAuthClick = async (provider) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/#/oauth-callback`,
          scopes: provider === 'github' ? 'user:email' : 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          data: {
            tier: selectedTier,
            selected_tier: selectedTier,
            signup_source: mode === 'signup' ? 'oauth-signup' : 'oauth-login'
          }
        }
      });

      if (error) throw error;

      // OAuth redirect happens automatically
      // Component will unmount before completion
    } catch (error) {
      console.error(`❌ ${provider} OAuth error:`, error);
      onError(`${provider} authentication failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handleMagicLinkSent = () => {
    onAuthComplete({ provider: 'email', emailSent: true });
  };

  return (
    <div className="auth-method-selector space-y-4">
      {/* Google OAuth - Primary */}
      <OAuthButton
        provider="google"
        onClick={() => handleOAuthClick('google')}
        disabled={loading}
        variant="primary"
      />

      {/* GitHub OAuth - Secondary */}
      <OAuthButton
        provider="github"
        onClick={() => handleOAuthClick('github')}
        disabled={loading}
        variant="secondary"
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Magic Link - Fallback */}
      <MagicLinkForm
        selectedTier={selectedTier}
        onSent={handleMagicLinkSent}
        onError={onError}
        mode={mode}
      />
    </div>
  );
}
```

#### 2. OAuthButton.jsx
```javascript
// /src/components/auth/OAuthButton.jsx
import React from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';

export default function OAuthButton({
  provider,
  onClick,
  disabled,
  variant = 'primary' // 'primary' | 'secondary'
}) {
  const config = {
    google: {
      icon: FaGoogle,
      text: 'Continue with Google',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-white'
    },
    github: {
      icon: FaGithub,
      text: 'Continue with GitHub',
      bgColor: 'bg-gray-800',
      hoverColor: 'hover:bg-gray-900',
      textColor: 'text-white'
    }
  };

  const { icon: Icon, text, bgColor, hoverColor, textColor } = config[provider];

  const sizeClass = variant === 'primary' ? 'py-4 text-lg' : 'py-3 text-base';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${sizeClass} px-6 rounded-lg font-semibold flex items-center justify-center space-x-3 transition-all ${bgColor} ${hoverColor} ${textColor} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="text-xl" />
      <span>{text}</span>
    </button>
  );
}
```

#### 3. MagicLinkForm.jsx
```javascript
// /src/components/auth/MagicLinkForm.jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function MagicLinkForm({ selectedTier, onSent, onError, mode }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/#/oauth-callback`,
          data: {
            tier: selectedTier,
            selected_tier: selectedTier,
            signup_source: mode === 'signup' ? 'magic-link-signup' : 'magic-link-login'
          }
        }
      });

      if (error) throw error;

      setEmailSent(true);
      onSent();
    } catch (error) {
      console.error('❌ Magic link error:', error);
      onError(`Failed to send magic link: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          ✅ Check your email! We sent a magic link to <strong>{email}</strong>
        </p>
        <button
          onClick={() => setEmailSent(false)}
          className="text-blue-600 text-xs hover:underline mt-2"
        >
          Resend or use different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Continue with Email'}
      </button>
    </form>
  );
}
```

#### 4. OAuthCallback.jsx
```javascript
// /src/pages/OAuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getPostLoginDestination, getAnalysisContext } from '../lib/authHelpers';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get session from URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error('No session found after OAuth');
      }

      console.log('✅ OAuth session established:', session.user.id);

      // Determine routing destination
      const destination = await getPostLoginDestination(session.user);

      console.log('🎯 Routing to:', destination);

      // Check if payment required
      const selectedTier = session.user.user_metadata.selected_tier;
      if (selectedTier === 'coffee' && destination.path !== '/upsell/coffee') {
        // Coffee tier selected, route to Stripe checkout
        navigate('/checkout', {
          state: {
            tier: 'coffee',
            userId: session.user.id,
            ...destination.state
          }
        });
      } else {
        // Navigate to determined destination
        navigate(destination.path, { state: destination.state });
      }
    } catch (err) {
      console.error('❌ OAuth callback error:', err);
      setError(err.message);

      // Redirect to register with error after 3 seconds
      setTimeout(() => {
        navigate('/register', {
          state: { error: `Authentication failed: ${err.message}` }
        });
      }, 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-4">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to signup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-600 text-lg">Completing authentication...</span>
      </div>
    </div>
  );
}
```

#### 5. UpsellCoffee.jsx
```javascript
// /src/pages/UpsellCoffee.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { TIER_BENEFITS, ZERO_RISK_SECTION, CREDIBILITY_SIGNALS } from '../constants/messaging';

export default function UpsellCoffee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    // Route to Stripe checkout
    const { data: { user } } = await supabase.auth.getUser();

    navigate('/checkout', {
      state: {
        tier: 'coffee',
        userId: user.id
      }
    });
  };

  const handleMaybeLater = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Headline */}
          <h1 className="text-4xl font-bold mb-4 text-center">
            ☕ Unlock Unlimited Analysis
          </h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Less than your daily coffee - infinite value for your business
          </p>

          {/* Coffee Plan Benefits - EXACT COPY from AUTH_MONETIZATION_SPEC.md */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">☕ COFFEE Plan Benefits</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span className="font-semibold">Unlimited AI-powered analyses per month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span className="font-semibold">10 MASTERY-AI Framework factors (Phase A)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span>Professional PDF reports (no watermarks)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span>Clean, exportable results dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span>Educational content & recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span>Email support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <span className="font-semibold">30-day money-back guarantee</span>
              </li>
            </ul>
          </div>

          {/* FREE Plan Limitations - EXACT COPY */}
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-bold mb-4">🆓 FREE Plan Limitations</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-orange-600 mr-3">⚠️</span>
                <span className="text-orange-600 font-semibold">Only 3 analyses per month</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3">❌</span>
                <span className="text-gray-400 line-through">Basic recommendations only</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3">❌</span>
                <span className="text-gray-400 line-through">Phase A factors only</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3">❌</span>
                <span className="text-gray-400 line-through">Web-only results (no PDF export)</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3">❌</span>
                <span className="text-gray-400 line-through">Community support only</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-3">❌</span>
                <span className="text-gray-400 line-through">No advanced AI insights</span>
              </li>
            </ul>
          </div>

          {/* ZERO RISK Section - EXACT COPY */}
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">🛡️ ZERO RISK - We Remove ALL Your Fears</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-green-800 mb-1">💰 30-Day Money Back Guarantee</h3>
                <p className="text-green-700">Don't like the results? Get every penny back. No questions asked. No hoops to jump through.</p>
              </div>

              <div>
                <h3 className="font-bold text-green-800 mb-1">⚡ Cancel Instantly Anytime</h3>
                <p className="text-green-700">One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.</p>
              </div>

              <div>
                <h3 className="font-bold text-green-800 mb-1">🏆 Results in 24 Hours or Refund</h3>
                <p className="text-green-700">See dramatic improvements within 24 hours or get a full refund immediately.</p>
              </div>

              <div>
                <h3 className="font-bold text-green-800 mb-1">🚀 Outperform Competitors or Refund</h3>
                <p className="text-green-700">We find 3x more pages than competitors or you get your money back. Guaranteed.</p>
              </div>
            </div>
          </div>

          {/* Credibility Signals - EXACT COPY */}
          <div className="mb-8 flex justify-center space-x-6 text-sm">
            <span className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Built by Expert Solopreneur</span>
            </span>
            <span className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Not VC-Funded BS</span>
            </span>
            <span className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Real Results for Real Businesses</span>
            </span>
          </div>

          {/* Security & Privacy - EXACT COPY */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2 text-xl">🔒</span>
              <div>
                <div className="font-semibold text-blue-800">Secure & Private</div>
                <div className="text-sm text-blue-700">Your data is encrypted and never shared. We only analyze public content and generate files you control.</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-yellow-600 mb-2">$4.95</div>
            <div className="text-xl text-gray-600">/month</div>
          </div>

          {/* CTAs */}
          <div className="space-y-4">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 px-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold text-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upgrade to Coffee Plan →'}
            </button>

            <button
              onClick={handleMaybeLater}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Note**: `UpsellGrowth.jsx`, `UpsellScale.jsx`, and `WelcomeScale.jsx` follow similar patterns with different messaging per AUTH_MONETIZATION_SPEC.md.

---

## Authentication Flow Diagrams

### OAuth Flow (Google/GitHub)

```
┌─────────────────────────────────────────────────────────────────────┐
│ OAUTH SIGNUP/LOGIN FLOW (Google or GitHub)                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User clicks  │
│ "Google" or  │
│ "GitHub"     │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ AuthMethodSelector.jsx                  │
│ ─────────────────────────────────────   │
│ supabase.auth.signInWithOAuth({         │
│   provider: 'google' | 'github',        │
│   options: {                             │
│     redirectTo: '/oauth-callback',      │
│     data: {                              │
│       tier: selectedTier,               │
│       selected_tier: selectedTier,      │
│       signup_source: 'oauth-signup'     │
│     }                                    │
│   }                                      │
│ })                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Redirect to OAuth Provider             │
│ (Google/GitHub consent screen)          │
└──────┬──────────────────────────────────┘
       │
       │ User authorizes
       ▼
┌─────────────────────────────────────────┐
│ OAuth Provider redirects to:            │
│ /auth/v1/callback (Supabase)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Supabase processes OAuth:               │
│ ─────────────────────────────────────   │
│ 1. Validate OAuth token                 │
│ 2. Create/update auth.users record      │
│ 3. Fire trigger: handle_user_creation() │
│ 4. Create public.users record           │
│    - tier: 'free'                       │
│    - auth_provider: 'google'|'github'   │
│    - is_first_login: true               │
│    - selected_tier: from metadata       │
│ 5. Establish session                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Supabase redirects to:                  │
│ https://aimpactscanner.com/#/oauth-     │
│ callback                                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ OAuthCallback.jsx                       │
│ ─────────────────────────────────────   │
│ 1. getSession()                          │
│ 2. Check session.user.user_metadata     │
│ 3. Call getPostLoginDestination(user)   │
│    ├─ IF is_first_login = true:        │
│    │  └─ getPostSignupDestination()    │
│    │     ├─ Check localStorage context │
│    │     ├─ IF pendingAnalysisUrl:     │
│    │     │  └─ Route: /analyze (URL)   │
│    │     └─ ELSE:                       │
│    │        └─ Route: /analyze (empty) │
│    └─ ELSE (returning user):            │
│       └─ getUpsellPage(tier)            │
│          ├─ free → /upsell/coffee       │
│          ├─ coffee → /upsell/growth     │
│          ├─ growth → /upsell/scale      │
│          └─ scale → /welcome/scale      │
│ 4. navigate(destination)                │
└──────┬──────────────────────────────────┘
       │
       ├─── IF selectedTier = 'coffee' ────┐
       │                                    │
       ▼                                    ▼
┌─────────────────────────┐       ┌────────────────────┐
│ Route: /checkout         │       │ Route: /analyze or │
│ (Stripe Checkout)        │       │ /upsell/*          │
└─────────────────────────┘       └────────────────────┘
```

### Magic Link Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ MAGIC LINK SIGNUP/LOGIN FLOW                                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User clicks  │
│ "Continue    │
│ with Email"  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ MagicLinkForm.jsx                       │
│ ─────────────────────────────────────   │
│ User enters email                        │
│ Clicks "Send Magic Link"                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ supabase.auth.signInWithOtp({           │
│   email: userEmail,                      │
│   options: {                             │
│     emailRedirectTo: '/oauth-callback', │
│     data: {                              │
│       tier: selectedTier,               │
│       selected_tier: selectedTier       │
│     }                                    │
│   }                                      │
│ })                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Supabase + Resend SMTP:                 │
│ ─────────────────────────────────────   │
│ 1. Generate secure magic link token     │
│ 2. Send email via Resend                │
│    Subject: "Sign in to AImpactScanner" │
│    Link: https://...auth/v1/verify?     │
│          token=...&type=magiclink       │
│ 3. Email delivered (< 30 seconds)       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ User receives email, clicks link        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Supabase processes magic link:          │
│ ─────────────────────────────────────   │
│ 1. Validate token (1-hour expiry)       │
│ 2. Mark token as used (single-use)      │
│ 3. Create/update auth.users             │
│ 4. Fire trigger: handle_user_creation() │
│ 5. Create public.users record           │
│    - auth_provider: 'email'             │
│    - is_first_login: true               │
│ 6. Establish session                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Redirect to /oauth-callback             │
│ (Same flow as OAuth from here)          │
└─────────────────────────────────────────┘
```

### Stripe Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STRIPE CHECKOUT FLOW (Coffee Tier)                                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User selects │
│ Coffee tier  │
│ + completes  │
│ auth         │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ OAuthCallback or UpgradeCoffee.jsx      │
│ ─────────────────────────────────────   │
│ navigate('/checkout', {                 │
│   state: {                               │
│     tier: 'coffee',                     │
│     userId: user.id,                    │
│     analysisContext: getContext()       │
│   }                                      │
│ })                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ StripeCheckout.jsx                      │
│ ─────────────────────────────────────   │
│ 1. Create Stripe Checkout Session:      │
│    POST /api/create-checkout-session    │
│    Body: {                               │
│      userId, tier, email,               │
│      successUrl, cancelUrl,             │
│      metadata: { user_id, tier }        │
│    }                                     │
│ 2. Receive sessionId                    │
│ 3. stripe.redirectToCheckout({          │
│      sessionId                           │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Stripe Hosted Checkout Page             │
│ ─────────────────────────────────────   │
│ User enters payment details              │
│ - Card number                           │
│ - Expiry, CVC                           │
│ - Billing address                       │
└──────┬──────────────────────────────────┘
       │
       ├─ PAYMENT SUCCESS ──────────┐
       │                             │
       ▼                             │
┌───────────────────────┐            │
│ Stripe fires webhook: │            │
│ checkout.session.     │            │
│ completed             │            │
└──────┬────────────────┘            │
       │                             │
       ▼                             │
┌─────────────────────────────────┐  │
│ Netlify Function:               │  │
│ /stripe-webhook                 │  │
│ ─────────────────────────────── │  │
│ 1. Verify webhook signature     │  │
│ 2. Extract metadata:            │  │
│    - user_id                    │  │
│    - tier                       │  │
│ 3. Update database:             │  │
│    UPDATE users SET             │  │
│      tier = 'coffee',           │  │
│      subscription_status =      │  │
│        'active',                │  │
│      stripe_customer_id = ...,  │  │
│      stripe_subscription_id =   │  │
│        ...                      │  │
│    WHERE id = user_id           │  │
│ 4. Send confirmation email      │  │
└──────┬──────────────────────────┘  │
       │                             │
       │  ┌──────────────────────────┘
       │  │
       ▼  ▼
┌───────────────────────┐  ┌────────────────────┐
│ Redirect to:          │  │ Redirect to:       │
│ /payment-success      │  │ /payment-cancelled │
│                       │  │                    │
│ - Show success msg    │  │ - Show retry msg   │
│ - Route to /analyze   │  │ - Stay Free tier   │
│   with URL prefilled  │  │ - Show banner      │
└───────────────────────┘  └────────────────────┘
```

### First Login Detection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ FIRST LOGIN vs RETURNING USER ROUTING                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User         │
│ authenticates│
│ (OAuth or    │
│ Magic Link)  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ OAuthCallback.jsx                       │
│ ─────────────────────────────────────   │
│ session = await getSession()            │
│ destination = await                     │
│   getPostLoginDestination(user)         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ authHelpers.js                          │
│ getPostLoginDestination(user)           │
│ ─────────────────────────────────────   │
│ 1. Query database:                      │
│    SELECT is_first_login, tier          │
│    FROM users                           │
│    WHERE id = user.id                   │
└──────┬──────────────────────────────────┘
       │
       ├─ is_first_login = TRUE ────┐
       │                             │
       ▼                             ▼
┌─────────────────────┐     ┌──────────────────────┐
│ FIRST LOGIN         │     │ RETURNING USER       │
│                     │     │                      │
│ 1. Update flag:     │     │ 1. Flag already      │
│    UPDATE users SET │     │    false, no update  │
│    is_first_login = │     │                      │
│      false          │     │ 2. Route to upsell:  │
│    WHERE id = ...   │     │    getUpsellPage()   │
│                     │     │    ├─ free → /upsell/│
│ 2. Route to signup  │     │    │   coffee        │
│    destination:     │     │    ├─ coffee →       │
│    getPostSignup    │     │    │   /upsell/growth│
│    Destination()    │     │    ├─ growth →       │
│    ├─ Check         │     │    │   /upsell/scale │
│    │  localStorage  │     │    └─ scale →        │
│    │  context       │     │       /welcome/scale │
│    ├─ IF URL:       │     │                      │
│    │  └─ /analyze   │     │ 3. Show upsell page  │
│    │     (prefilled)│     │                      │
│    └─ ELSE:         │     │ 4. User dismisses    │
│       └─ /analyze   │     │    → /dashboard      │
│          (empty)    │     │                      │
└─────────────────────┘     └──────────────────────┘
```

---

## Database Schema

### Users Table - Updated Schema

```sql
-- COMPLETE users table schema after Migration 020

CREATE TABLE users (
  -- Existing columns (from earlier migrations)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'coffee', 'growth', 'scale')),
  monthly_analyses_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT false,

  -- NEW: Authentication tracking
  auth_provider TEXT, -- 'google', 'github', 'email'

  -- NEW: Tier management
  selected_tier TEXT DEFAULT 'free' CHECK (selected_tier IN ('free', 'coffee', 'growth', 'scale')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending_payment', 'canceled', 'past_due')),

  -- NEW: Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,

  -- NEW: Journey tracking
  is_first_login BOOLEAN DEFAULT true,
  signup_source TEXT, -- 'landing_url_entry', 'direct_signup', 'oauth-signup', etc.

  -- NEW: Waitlist flags
  growth_waitlist BOOLEAN DEFAULT false,
  scale_waitlist BOOLEAN DEFAULT false,
  waitlist_joined_at TIMESTAMPTZ,

  -- NEW: Analytics
  last_upsell_shown TIMESTAMPTZ,
  upsell_dismissed_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_is_first_login ON users(is_first_login) WHERE is_first_login = true;
CREATE INDEX idx_users_email ON users(email);

-- RLS Policies (existing, unchanged)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_service_role_all" ON users
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Waitlist Table - Complete Schema

```sql
-- Waitlist table (Migration 021)

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  current_tier TEXT NOT NULL CHECK (current_tier IN ('free', 'coffee', 'growth')),
  interested_tier TEXT NOT NULL CHECK (interested_tier IN ('growth', 'scale')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- utm_source, referrer, etc.
  UNIQUE(user_id, interested_tier)
);

-- Indexes
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_interested_tier ON waitlist(interested_tier);
CREATE INDEX idx_waitlist_notified ON waitlist(notified) WHERE notified = false;
CREATE INDEX idx_waitlist_joined_at ON waitlist(joined_at DESC);

-- RLS Policies
CREATE POLICY "Users can view own waitlist entries"
  ON waitlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entries"
  ON waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to waitlist"
  ON waitlist FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
```

### Database Trigger - User Creation (Existing, Update for OAuth)

```sql
-- Update handle_user_creation trigger to support OAuth providers
-- (Migration 018 exists, modify to handle auth_provider)

CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Determine auth provider
    DECLARE
        provider TEXT;
    BEGIN
        -- Extract provider from raw_app_meta_data or raw_user_meta_data
        provider := COALESCE(
            NEW.raw_app_meta_data->>'provider',
            NEW.raw_user_meta_data->>'auth_provider',
            'email' -- Default to email if not specified
        );
    END;

    -- Insert or update user profile
    INSERT INTO public.users (
        id,
        email,
        full_name,
        tier,
        selected_tier,
        auth_provider,
        signup_source,
        monthly_analyses_used,
        subscription_status,
        email_verified,
        is_first_login,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        'free', -- Always start with free tier
        COALESCE(NEW.raw_user_meta_data->>'selected_tier', 'free'),
        provider,
        COALESCE(NEW.raw_user_meta_data->>'signup_source', 'unknown'),
        0,
        CASE
            WHEN COALESCE(NEW.raw_user_meta_data->>'selected_tier', 'free') = 'free' THEN 'active'
            ELSE 'pending_payment'
        END,
        (NEW.email_confirmed_at IS NOT NULL),
        true, -- is_first_login always true on creation
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = (NEW.email_confirmed_at IS NOT NULL),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'User profile creation failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS handle_user_creation_trigger ON auth.users;
CREATE TRIGGER handle_user_creation_trigger
    AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_creation();
```

---

## API Design

### Stripe Checkout Session Creation

**Endpoint**: `POST /.netlify/functions/create-checkout-session`

**Request**:
```typescript
interface CheckoutSessionRequest {
  userId: string;
  email: string;
  tier: 'coffee' | 'growth' | 'scale';
  successUrl: string;
  cancelUrl: string;
}
```

**Response**:
```typescript
interface CheckoutSessionResponse {
  sessionId: string;
  url: string; // Stripe checkout URL
}
```

**Implementation**:
```javascript
// /netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, email, tier, successUrl, cancelUrl } = JSON.parse(event.body);

    // Validate tier
    const tierPrices = {
      coffee: process.env.STRIPE_COFFEE_PRICE_ID, // price_...
      growth: process.env.STRIPE_GROWTH_PRICE_ID,
      scale: process.env.STRIPE_SCALE_PRICE_ID
    };

    if (!tierPrices[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid tier' })
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: tierPrices[tier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        tier: tier
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          tier: tier
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Waitlist Join Function (Database RPC)

**Function**: `join_waitlist(interested_tier TEXT)`
**Type**: Supabase Database Function (already defined in Migration 021)

**Usage**:
```javascript
// Client-side usage
const { data, error } = await supabase.rpc('join_waitlist', {
  p_interested_tier: 'growth' // or 'scale'
});

if (error) {
  console.error('❌ Failed to join waitlist:', error);
  // Show error message
} else {
  const { success, message, waitlist_id } = data[0];
  if (success) {
    console.log('✅ Joined waitlist:', message);
    // Show success confirmation
  }
}
```

---

## State Management

### localStorage Schema

```typescript
interface AnalysisContext {
  pendingAnalysisUrl: string;
  timestamp: number;
  journeySource: 'landing' | 'direct';
  expiresAt: number; // timestamp + 24 hours
}

// Stored as:
localStorage.setItem('analysisContext', JSON.stringify(context));
```

### React State Management

**No global state library needed** (Redux/Zustand not required)

**Approach**: Component-level state + React Router state + Supabase auth state

**State Locations**:
```javascript
// 1. Auth state - Managed by Supabase
const [session, setSession] = useState(null);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
    }
  );

  return () => subscription.unsubscribe();
}, []);

// 2. User data - Fetched from database, cached in component
const [userData, setUserData] = useState(null);

useEffect(() => {
  if (session) {
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setUserData(data));
  }
}, [session]);

// 3. Analysis context - localStorage (as designed above)
const context = getAnalysisContext();

// 4. Tier selection - Local component state
const [selectedTier, setSelectedTier] = useState('coffee');

// 5. Loading states - Local component state
const [loading, setLoading] = useState(false);
```

**State Flow**:
```
┌────────────────┐
│ Supabase Auth  │ ← Session state (global)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ users table    │ ← User data (fetched per component)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Component      │ ← Local state (tier selection, loading, etc.)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ localStorage   │ ← Analysis context (persistent)
└────────────────┘
```

---

## Routing Logic

### App.jsx - Router Configuration

```javascript
// /src/App.jsx - Add new routes

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy load new components
const OAuthCallback = React.lazy(() => import('./pages/OAuthCallback'));
const UpsellCoffee = React.lazy(() => import('./pages/UpsellCoffee'));
const UpsellGrowth = React.lazy(() => import('./pages/UpsellGrowth'));
const UpsellScale = React.lazy(() => import('./pages/UpsellScale'));
const WelcomeScale = React.lazy(() => import('./pages/WelcomeScale'));
const StripeCheckout = React.lazy(() => import('./pages/StripeCheckout'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancelled = React.lazy(() => import('./pages/PaymentCancelled'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={
          <Suspense fallback={<ComponentLoader />}>
            <UnifiedRegistration />
          </Suspense>
        } />
        <Route path="/login" element={<Login />} />

        {/* NEW: OAuth callback route */}
        <Route path="/oauth-callback" element={
          <Suspense fallback={<ComponentLoader message="Completing authentication..." />}>
            <OAuthCallback />
          </Suspense>
        } />

        {/* NEW: Upsell pages */}
        <Route path="/upsell/coffee" element={
          <Suspense fallback={<ComponentLoader />}>
            <UpsellCoffee />
          </Suspense>
        } />
        <Route path="/upsell/growth" element={
          <Suspense fallback={<ComponentLoader />}>
            <UpsellGrowth />
          </Suspense>
        } />
        <Route path="/upsell/scale" element={
          <Suspense fallback={<ComponentLoader />}>
            <UpsellScale />
          </Suspense>
        } />
        <Route path="/welcome/scale" element={
          <Suspense fallback={<ComponentLoader />}>
            <WelcomeScale />
          </Suspense>
        } />

        {/* NEW: Stripe checkout pages */}
        <Route path="/checkout" element={
          <Suspense fallback={<ComponentLoader />}>
            <StripeCheckout />
          </Suspense>
        } />
        <Route path="/payment-success" element={
          <Suspense fallback={<ComponentLoader />}>
            <PaymentSuccess />
          </Suspense>
        } />
        <Route path="/payment-cancelled" element={
          <Suspense fallback={<ComponentLoader />}>
            <PaymentCancelled />
          </Suspense>
        } />

        {/* Existing routes */}
        <Route path="/analyze" element={<URLInput />} />
        <Route path="/dashboard" element={<SimpleAccountDashboard />} />
        {/* ... other existing routes */}
      </Routes>
    </Router>
  );
}
```

### Post-Signup Routing Decision Tree

```javascript
// /src/lib/authHelpers.js

export async function getPostLoginDestination(user) {
  // Fetch user data from database
  const { data: userData, error } = await supabase
    .from('users')
    .select('is_first_login, tier, subscription_status, selected_tier')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('❌ Error fetching user data:', error);
    return { path: '/dashboard', state: {} };
  }

  // FIRST LOGIN: Skip upsell
  if (userData.is_first_login) {
    console.log('🎉 First login - routing to signup destination');

    // Update flag async (don't wait)
    updateFirstLoginFlag(user.id);

    // Check if payment required
    if (userData.selected_tier === 'coffee' && userData.tier === 'free') {
      // Coffee selected but not paid yet
      return {
        path: '/checkout',
        requiresPayment: true,
        state: {
          tier: 'coffee',
          userId: user.id
        }
      };
    }

    // Route based on signup context
    return getPostSignupDestination(user, getAnalysisContext());
  }

  // RETURNING USER: Show upsell
  console.log('👋 Returning user - showing upsell');

  // Check if payment pending
  if (userData.subscription_status === 'pending_payment' && userData.selected_tier === 'coffee') {
    return {
      path: '/checkout',
      requiresPayment: true,
      state: {
        tier: 'coffee',
        userId: user.id
      }
    };
  }

  return getUpsellPage(userData);
}

export function getPostSignupDestination(user, context) {
  // Check for analysis context from landing page
  if (context?.pendingAnalysisUrl) {
    clearAnalysisContext();
    return {
      path: '/analyze',
      state: {
        prefilledUrl: context.pendingAnalysisUrl,
        fromSignup: true
      }
    };
  }

  // Direct signup, no context
  return {
    path: '/analyze',
    state: {
      prefilledUrl: null,
      fromSignup: true
    }
  };
}

export function getUpsellPage(userData) {
  const { tier } = userData;

  switch (tier) {
    case 'free':
      return { path: '/upsell/coffee', state: {} };
    case 'coffee':
      return { path: '/upsell/growth', state: {} };
    case 'growth':
      return { path: '/upsell/scale', state: {} };
    case 'scale':
      return { path: '/welcome/scale', state: {} };
    default:
      return { path: '/dashboard', state: {} };
  }
}
```

---

## Stripe Integration Architecture

### Checkout Session Component

```javascript
// /src/pages/StripeCheckout.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function StripeCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initiateCheckout();
  }, []);

  const initiateCheckout = async () => {
    try {
      const { tier, userId } = location.state;

      if (!tier || !userId) {
        throw new Error('Missing checkout parameters');
      }

      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create checkout session
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          email: user.email,
          tier: tier,
          successUrl: `${window.location.origin}/#/payment-success`,
          cancelUrl: `${window.location.origin}/#/payment-cancelled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('❌ Checkout error:', err);
      setError(err.message);
      setLoading(false);

      // Redirect to cancelled page after 3 seconds
      setTimeout(() => {
        navigate('/payment-cancelled', {
          state: { error: err.message }
        });
      }, 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-4">Checkout Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-600 text-lg">Redirecting to secure checkout...</span>
      </div>
    </div>
  );
}
```

### Payment Success Page

```javascript
// /src/pages/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalysisContext, clearAnalysisContext } from '../lib/authHelpers';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait 3 seconds, then route to analysis page
    const timer = setTimeout(() => {
      const context = getAnalysisContext();

      if (context?.pendingAnalysisUrl) {
        clearAnalysisContext();
        navigate('/analyze', {
          state: { prefilledUrl: context.pendingAnalysisUrl }
        });
      } else {
        navigate('/analyze');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold mb-4">Payment Successful!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Welcome to the Coffee Plan! You now have unlimited AI analyses.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ☕ <strong>Your subscription is now active</strong><br />
              Unlimited analyses, professional PDF reports, and priority support.
            </p>
          </div>
          <p className="text-sm text-gray-500">Redirecting to analysis page...</p>
        </div>
      </div>
    </div>
  );
}
```

### Payment Cancelled Page

```javascript
// /src/pages/PaymentCancelled.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  const handleRetryPayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    navigate('/checkout', {
      state: {
        tier: 'coffee',
        userId: user.id
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Payment Not Completed</h2>
          <p className="text-gray-600 mb-6">
            Your payment was not processed. You still have a working <strong>Free tier account</strong> with 3 analyses per month.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 <strong>No worries!</strong><br />
              Your account is active and ready to use. You can upgrade to Coffee Plan anytime.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="w-full py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold transition-all"
            >
              Retry Payment ($4.95/month)
            </button>

            <button
              onClick={() => navigate('/analyze')}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
            >
              Continue with Free Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Security Architecture

### OAuth Security Checklist

✅ **CSRF Protection**:
- Supabase automatically handles OAuth state parameter
- State validated on callback to prevent CSRF attacks

✅ **Redirect URI Whitelist**:
- Configured in Supabase Dashboard → Authentication → URL Configuration
- Production: `https://aimpactscanner.com/#/oauth-callback`
- Local dev: `http://localhost:5173/#/oauth-callback`
- Exact match required (no wildcards)

✅ **Secure Token Storage**:
- Session tokens stored in httpOnly cookies (Supabase default)
- Never expose tokens to client-side JavaScript
- Automatic token refresh handled by Supabase

✅ **Scope Minimization**:
- Google: `email profile` (minimum required)
- GitHub: `user:email` (only email access)
- Never request unnecessary permissions

✅ **RLS Policy Enforcement**:
- All database queries enforce Row Level Security
- Users can only access their own data
- Service role used only for webhooks (server-side)

### Stripe Webhook Security

✅ **Signature Verification**:
```javascript
// CRITICAL: Always verify webhook signature
const sig = event.headers['stripe-signature'];
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

try {
  stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    sig,
    webhookSecret
  );
} catch (err) {
  // Reject invalid webhooks
  return { statusCode: 400, body: 'Invalid signature' };
}
```

✅ **Idempotency**:
- Webhook handlers check if update already applied
- Prevents duplicate tier upgrades from retry events

✅ **API Key Security**:
- Secret keys in environment variables only
- Never in client-side code
- Netlify environment variables encrypted at rest

### XSS Prevention

✅ **Context Sanitization**:
```javascript
// Sanitize stored URL before displaying
import DOMPurify from 'dompurify';

const safeUrl = DOMPurify.sanitize(context.pendingAnalysisUrl);
```

✅ **Input Validation**:
```javascript
function isValidURL(string) {
  try {
    const url = new URL(string);
    // Only allow http/https
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
```

### Rate Limiting

✅ **Auth Endpoint Protection**:
- Supabase built-in rate limiting for auth endpoints
- Magic link: Max 3 requests per hour per email
- OAuth: Standard provider rate limits apply

✅ **Webhook Rate Limiting**:
- Netlify Functions: 1000 invocations/second (auto-scaling)
- Stripe webhook retries: Exponential backoff

---

## Performance Optimization

### Code Splitting Strategy

**Lazy Load Components**:
```javascript
// Heavy components lazy loaded
const UpsellCoffee = React.lazy(() => import('./pages/UpsellCoffee'));
const StripeCheckout = React.lazy(() => import('./pages/StripeCheckout'));

// Frequently used components regular import
import Landing from './components/Landing';
import Login from './components/Login';
```

**Route-Based Splitting**:
- Each upsell page is separate chunk
- Stripe checkout separate chunk
- Only loaded when user navigates to that route

### OAuth Library Loading

```javascript
// Don't block initial render with Stripe.js
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Only load when checkout component mounts
useEffect(() => {
  stripePromise.then(stripe => {
    // Stripe SDK ready
  });
}, []);
```

### Database Query Optimization

**Indexes**:
- `idx_users_is_first_login WHERE is_first_login = true` - Partial index for fast first login checks
- `idx_users_stripe_customer_id` - Fast webhook lookups
- `idx_waitlist_interested_tier` - Fast waitlist queries

**Query Patterns**:
```javascript
// Efficient: Select only needed columns
supabase
  .from('users')
  .select('is_first_login, tier, subscription_status')
  .eq('id', userId)
  .single();

// Avoid: SELECT *
// Loads unnecessary columns, slower queries
```

### Cache Strategy

**User Data Caching**:
```javascript
// Cache tier in localStorage for quick fallback
localStorage.setItem(`user_tier_${userId}`, userData.tier);

// Use cached data while fetching latest
const cachedTier = localStorage.getItem(`user_tier_${userId}`);
if (cachedTier) {
  setUserData({ tier: cachedTier }); // Quick render
}

// Then fetch latest from database
fetchUserData().then(data => setUserData(data));
```

---

## Error Handling & Resilience

### Graceful Degradation Patterns

**Payment Failure**:
```javascript
// User stays Free tier if payment fails
// Never block account creation
if (paymentFailed) {
  userData.tier = 'free';
  userData.subscription_status = 'active';
  showBanner('Payment failed. Retry anytime.');
}
```

**OAuth Failure**:
```javascript
// Fallback to Magic Link
if (oauthError) {
  setMessage('OAuth failed. Try Magic Link instead.');
  setShowOAuthButtons(false);
  setShowMagicLinkForm(true);
}
```

**Database Timeout**:
```javascript
// Use fallback data from localStorage
if (databaseTimeout) {
  const fallbackData = getUserFallbackData(userId, email);
  setUserData(fallbackData);
  showBanner('Using cached data. Retry later.');
}
```

### Retry Logic

**Network Failures**:
```javascript
async function retryFetch(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**Webhook Retries**:
- Stripe automatically retries failed webhooks
- Exponential backoff: 1 hour → 4 hours → 16 hours
- Fallback: Daily cron job syncs with Stripe API

### User Feedback Mechanisms

**Error Messages**:
```javascript
// User-friendly, actionable errors
const errorMessages = {
  'oauth_failed': 'Authentication failed. Please try again or use Magic Link.',
  'payment_declined': 'Payment declined. Please check your card details and retry.',
  'email_not_sent': 'Email delivery failed. Check your address or try OAuth.',
  'session_expired': 'Your session expired. Please sign in again.'
};
```

**Loading States**:
```javascript
// Clear loading indicators
{loading && <Spinner message="Completing authentication..." />}
{processingPayment && <Spinner message="Processing payment..." />}
{sendingEmail && <Spinner message="Sending magic link..." />}
```

---

## Implementation Roadmap

### Phase 1: Core Authentication (Days 1-3)

**Day 1: OAuth Setup**
- [ ] Configure Google OAuth in Google Cloud Console
- [ ] Configure GitHub OAuth App
- [ ] Update Supabase OAuth providers
- [ ] Test OAuth callback URLs (localhost + production)

**Day 2: Component Development**
- [ ] Create `AuthMethodSelector.jsx`
- [ ] Create `OAuthButton.jsx`
- [ ] Create `MagicLinkForm.jsx`
- [ ] Update `UnifiedRegistration.jsx` (remove passwords)
- [ ] Create `OAuthCallback.jsx`

**Day 3: Testing & Debugging**
- [ ] Test Google OAuth signup flow
- [ ] Test GitHub OAuth signup flow
- [ ] Test Magic Link signup flow
- [ ] Test OAuth login flow
- [ ] Verify context preservation through redirects

### Phase 2: Database & Routing (Days 4-5)

**Day 4: Database Migrations**
- [ ] Deploy Migration 020 (auth/tier columns)
- [ ] Verify migration success in production
- [ ] Test user creation with OAuth providers
- [ ] Verify RLS policies work correctly

**Day 5: Routing Logic**
- [ ] Implement `authHelpers.js` (all routing functions)
- [ ] Implement first login detection
- [ ] Test post-signup routing (with/without context)
- [ ] Test post-login routing (first vs returning)
- [ ] Update `App.jsx` with new routes

### Phase 3: Upsell Pages (Days 6-7)

**Day 6: Upsell Components**
- [ ] Create `UpsellCoffee.jsx` (exact messaging)
- [ ] Create `UpsellGrowth.jsx` (waitlist)
- [ ] Create `UpsellScale.jsx` (waitlist)
- [ ] Create `WelcomeScale.jsx` (thank you page)

**Day 7: Waitlist Integration**
- [ ] Deploy Migration 021 (waitlist table)
- [ ] Implement waitlist join function
- [ ] Test Growth waitlist capture
- [ ] Test Scale waitlist capture
- [ ] Verify database entries created

### Phase 4: Stripe Integration (Days 8-10)

**Day 8: Stripe Setup**
- [ ] Create Stripe products (Coffee, Growth, Scale)
- [ ] Configure Stripe pricing ($4.95/month recurring)
- [ ] Set up Stripe webhook endpoint in dashboard
- [ ] Configure environment variables

**Day 9: Checkout Flow**
- [ ] Create `create-checkout-session` Netlify Function
- [ ] Create `StripeCheckout.jsx` component
- [ ] Create `PaymentSuccess.jsx` component
- [ ] Create `PaymentCancelled.jsx` component
- [ ] Test checkout flow locally (Stripe CLI)

**Day 10: Webhook Handler**
- [ ] Create `stripe-webhook` Netlify Function
- [ ] Implement `checkout.session.completed` handler
- [ ] Implement `customer.subscription.deleted` handler
- [ ] Test webhooks with Stripe CLI
- [ ] Deploy and test in production

### Phase 5: Testing & Polish (Days 11-12)

**Day 11: Comprehensive Testing**
- [ ] Test all user journeys (A, B, C)
- [ ] Test all auth methods (Google, GitHub, Magic Link)
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Test first login routing
- [ ] Test returning user upsell
- [ ] Cross-browser testing

**Day 12: Production Deploy**
- [ ] Deploy to production
- [ ] Smoke test all flows
- [ ] Monitor error logs for 2 hours
- [ ] Verify OAuth redirect URIs working
- [ ] Verify Stripe webhooks firing
- [ ] Create rollback plan document

---

## Deployment Checklist

### Pre-Deployment

- [ ] All migrations tested locally
- [ ] OAuth providers configured in Supabase Dashboard
- [ ] Stripe products and prices created
- [ ] Environment variables set (local and production)
- [ ] Code reviewed and tested
- [ ] Rollback plan documented

### Environment Variables Required

**Supabase** (existing):
```
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Supabase Service Role** (server-side only):
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (for webhook writes)
```

**Stripe**:
```
VITE_STRIPE_PUBLIC_KEY=pk_live_... (client-side)
STRIPE_SECRET_KEY=sk_live_... (server-side)
STRIPE_WEBHOOK_SECRET=whsec_... (webhook verification)
STRIPE_COFFEE_PRICE_ID=price_... (Coffee plan price ID)
STRIPE_GROWTH_PRICE_ID=price_... (Growth plan price ID)
STRIPE_SCALE_PRICE_ID=price_... (Scale plan price ID)
```

### Deployment Steps

1. **Deploy Database Migrations**:
```bash
# Migration 020
supabase db push --linked

# Verify migration success
# Check Supabase Dashboard → Database → Migrations
```

2. **Configure OAuth Providers**:
- Supabase Dashboard → Authentication → Providers
- Enable Google + GitHub
- Add Client ID/Secret
- Set redirect URIs

3. **Deploy Frontend Code**:
```bash
# Commit changes
git add .
git commit -m "feat: OAuth-first authentication with tier monetization"
git push origin main

# Netlify auto-deploys from main branch
```

4. **Configure Stripe Webhook**:
- Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://aimpactscanner.com/.netlify/functions/stripe-webhook`
- Select events: `checkout.session.completed`, `customer.subscription.*`
- Copy webhook secret → Add to Netlify env vars

5. **Test Production**:
- Test Google OAuth signup
- Test GitHub OAuth signup
- Test Magic Link signup
- Test Coffee tier payment
- Verify webhook updates database
- Test waitlist capture

### Post-Deployment Monitoring

**First 24 Hours**:
- [ ] Monitor Netlify function logs
- [ ] Monitor Supabase database logs
- [ ] Monitor Stripe webhook delivery
- [ ] Check error rate in Sentry
- [ ] Verify user signups working
- [ ] Verify payments processing

**First Week**:
- [ ] Track OAuth conversion rates
- [ ] Track Coffee tier upgrade rate
- [ ] Monitor payment failure rate
- [ ] Check waitlist signup rate
- [ ] Gather user feedback

---

## Summary: Answers to 6 Design Questions

### 1. Component Structure
**Decision**: Hybrid approach with `<AuthMethodSelector>` composable subcomponent inside modified `UnifiedRegistration.jsx`. Allows code reuse and clean separation of concerns.

### 2. OAuth Callback Handling
**Decision**: `<OAuthCallback>` React component at route `/oauth-callback` using `useEffect` to call `getPostLoginDestination()`. Supabase handles OAuth, we handle routing logic.

### 3. Context Preservation
**Decision**: **localStorage** with 24-hour TTL. More forgiving than sessionStorage for OAuth redirects and tab closures. Includes validation and sanitization.

### 4. Database Migration Strategy
**Decision**: **Two-migration approach**. Migration 020 for auth/tier columns (required), Migration 021 for waitlist table (optional, can deploy later). Safer, easier rollback.

### 5. Stripe Webhook Architecture
**Decision**: **Netlify Serverless Function** at `/.netlify/functions/stripe-webhook`. Simpler deployment, same repo, auto-scaling. Uses service role key for database writes.

### 6. First Login Detection
**Decision**: **Update flag immediately after session established, before routing**. Implemented in `getPostLoginDestination()` with async flag update. Simple, deterministic, handles edge cases gracefully.

---

## Next Steps

1. **Review this document** with user for approval
2. **Update handoff-notes.md** with architecture decisions for @developer
3. **Create implementation tasks** in project-plan.md
4. **Begin Phase 1** implementation (OAuth setup)

---

**Document Status**: READY FOR REVIEW
**Architect Confidence**: 100% - Comprehensive design with security-first principles
**Implementation Estimate**: 12 days (96 hours) for full implementation

**Critical Success Factors**:
✅ All security requirements maintained
✅ Graceful degradation at every level
✅ Context preservation robust
✅ First login detection reliable
✅ Messaging constraints respected
✅ Works WITH existing RLS/CSP policies
