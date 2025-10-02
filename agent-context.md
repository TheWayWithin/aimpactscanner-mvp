# Mission Context: Authentication & Monetization System Build

## Mission Objectives
**PRIMARY**: Build OAuth-first authentication system with tier-based monetization
**TIMELINE**: 8-12 hours autonomous execution
**PRIORITY**: CRITICAL - User acquisition and revenue system

## Business Requirements
1. ✅ Minimize signup friction (OAuth-first, no passwords)
2. ✅ Capture valid email addresses (OAuth/Magic Link inherent verification)
3. ✅ Strategic upsell to Coffee plan ($4.95/month)
4. ✅ Seamless Stripe payment integration with graceful degradation
5. ✅ Future-proof tier system (Growth $29, Scale $99 with waitlist)

## Technical Requirements
1. ✅ Remove password-based authentication entirely
2. ✅ Implement Google + GitHub OAuth
3. ✅ Implement passwordless magic link (fix SMTP)
4. ✅ Context-aware post-signup routing (preserve landing page URL)
5. ✅ 4 tier-specific upsell pages with waitlist capture

## Critical Constraints
⚠️ **DO NOT modify tier benefit messaging** - User-approved, conversion-optimized (Doug Hall framework)
⚠️ **MUST preserve localStorage context** through signup redirects
⚠️ **MUST implement graceful degradation** for Stripe payment failures
⚠️ **MUST skip upsell on first login** - Only show for returning users

## User Journeys

### Journey A: Landing Page → URL Entry → Signup
1. User enters URL on landing page → Store in `localStorage.pendingAnalysisUrl`
2. Clicks "Analyze" → Redirect to signup
3. Select tier + auth method → Complete authentication
4. If Coffee tier → Stripe checkout
5. After payment/signup → Analysis page with URL **PRE-POPULATED**

### Journey B: Direct Signup
1. User clicks "Sign Up" (no URL context)
2. Select tier + auth method → Complete authentication
3. If Coffee tier → Stripe checkout
4. After payment/signup → Analysis page **WITHOUT** pre-populated URL

### Journey C: Returning User Login
1. Authenticate via OAuth/Magic Link
2. If first login → Skip upsell, go to analysis page
3. If returning user → Show tier-appropriate upsell → Dashboard

## Authentication Methods (Priority Order)
- 🔵 **PRIMARY**: Google OAuth (most prominent)
- ⚫ **SECONDARY**: GitHub OAuth
- ✉️ **FALLBACK**: Magic Link (passwordless)
- ❌ **REMOVED**: Email/Password

## Tier System
- 🆓 **FREE**: 3 analyses/month, limited features
- ☕ **COFFEE**: $4.95/month, unlimited analyses (PRIMARY MONETIZATION)
- 🚀 **GROWTH**: $29/month (Coming Soon + Waitlist)
- 🏢 **SCALE**: $99/month (Coming Soon + Waitlist)

## Upsell Pages Required
1. `/upsell/coffee` - Free → Coffee upgrade
2. `/upsell/growth` - Coffee → Growth (waitlist)
3. `/upsell/scale` - Growth → Scale (waitlist)
4. `/welcome/scale` - Scale tier welcome

## Stripe Integration
- Create checkout session for Coffee tier
- Payment SUCCESS → Upgrade tier via webhook
- Payment FAILURE → Stay Free tier, show retry banner
- Graceful degradation (no blocked users)

## Database Schema Updates
Add to users table:
- auth_provider, selected_tier, subscription_status
- stripe_customer_id, stripe_subscription_id
- is_first_login, signup_source
- growth_waitlist, scale_waitlist, waitlist_joined_at

Create waitlist table for Growth/Scale interest tracking

## Reference Documents
- **AUTH_MONETIZATION_SPEC.md** - Complete specification (messaging, flows, requirements)
- **AUTH_MONETIZATION_PLAN.md** - 10-phase execution plan with delegation instructions

## Accumulated Findings
[To be updated by specialists as work progresses]
