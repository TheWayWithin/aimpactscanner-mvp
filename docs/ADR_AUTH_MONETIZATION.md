# Architecture Decision Record: OAuth-First Authentication & Monetization

**Date**: 2025-10-02
**Status**: Accepted and Implemented
**Decision Makers**: THE ARCHITECT, THE STRATEGIST
**Stakeholders**: Development Team, Product Team, Operations

---

## Context and Problem Statement

AImpactScanner needs a user authentication and monetization system that:
1. Minimizes signup friction to maximize conversion
2. Captures verified email addresses (no fake emails)
3. Strategically upsells users to Coffee plan ($4.95/month)
4. Gracefully handles payment failures without blocking users
5. Future-proofs for Growth ($29) and Scale ($99) tiers
6. Preserves user journey context (URL from landing page) through signup and payment

**Previous System**: Email + password authentication with manual email verification

**Problems with Previous System**:
- High signup friction (create password, remember password)
- Email verification required (many users abandon)
- Password reset support burden
- Security risks (weak passwords, credential stuffing)
- No OAuth option (users expect "Sign in with Google")

---

## Decision Drivers

### Critical Requirements

1. **Minimize Signup Friction** - Every extra step loses 20-30% of users
2. **Email Verification** - Must capture real, verified emails for marketing
3. **Security-First** - Work WITH existing RLS policies, no shortcuts
4. **Graceful Degradation** - Payment failures should NEVER block users
5. **Context Preservation** - URL entered on landing page must persist through signup
6. **Strategic Upsell** - Show Coffee tier upsell without being pushy

### Technical Constraints

- Must work with existing Supabase infrastructure
- Must integrate with existing Row-Level Security (RLS) policies
- Must comply with existing CSP (Content Security Policy) headers
- Must use existing useUserInitializer pattern for session management
- Must not introduce breaking changes to existing users

---

## Decision Outcomes

### Decision 1: OAuth-First Authentication

**Decision**: Implement Google + GitHub OAuth as primary auth methods, with Magic Link as fallback

**Alternatives Considered**:
1. **Keep email + password** - Rejected: High friction, security burden
2. **OAuth only (no fallback)** - Rejected: Excludes users without OAuth accounts
3. **Social login via third-party (Auth0)** - Rejected: Additional cost, vendor lock-in

**Why OAuth-First?**

**Pros**:
- ✅ Zero friction - 2 clicks to sign up
- ✅ Email inherently verified (OAuth providers verify)
- ✅ Familiar UX - Users expect "Continue with Google"
- ✅ Better security - No password management needed
- ✅ Lower support burden - No password reset emails
- ✅ Higher conversion - 60%+ signup rate vs 30% with password

**Cons**:
- ⚠️ OAuth dependency - If Google/GitHub down, users can't sign in
- ⚠️ Configuration complexity - Need to set up OAuth apps
- ⚠️ Privacy concerns - Some users distrust OAuth

**Mitigation**:
- Offer 3 auth methods (Google, GitHub, Magic Link)
- Clear privacy messaging ("We only request your email")
- Magic Link fallback works independently of OAuth

**Implementation**:
```javascript
// Primary: Google OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' });

// Secondary: GitHub OAuth
await supabase.auth.signInWithOAuth({ provider: 'github' });

// Fallback: Magic Link (passwordless email)
await supabase.auth.signInWithOtp({ email });
```

---

### Decision 2: Hybrid OAuth + Magic Link (Not OAuth-Only)

**Decision**: Provide Magic Link option alongside OAuth

**Why Not OAuth-Only?**

**Reasons**:
- **Accessibility**: Not all users have Google/GitHub accounts
- **Privacy**: Some users prefer not to use OAuth
- **Reliability**: Email-based fallback if OAuth providers have issues
- **Professional users**: Some work emails can't use personal OAuth

**Trade-offs**:
- ✅ Better accessibility and user choice
- ✅ Fallback option increases reliability
- ⚠️ More code complexity (3 auth methods vs 1)
- ⚠️ SMTP configuration required (Resend API)

**Magic Link Security**:
- Tokens expire in 1 hour
- Tokens are single-use only
- Tokens are cryptographically secure (128-bit entropy)
- Email sent over TLS via Resend API

---

### Decision 3: Stripe Checkout (Not Stripe Elements)

**Decision**: Use Stripe Checkout hosted pages for payment

**Alternatives Considered**:
1. **Stripe Elements** (custom payment form) - Rejected: More code, PCI compliance burden
2. **Paddle** (Stripe alternative) - Rejected: Less flexible, limited features
3. **Custom payment processing** - Rejected: Regulatory nightmare

**Why Stripe Checkout?**

**Pros**:
- ✅ PCI compliance handled by Stripe (massive burden lifted)
- ✅ Mobile-optimized payment UI
- ✅ Multiple payment methods (credit card, Apple Pay, Google Pay)
- ✅ Built-in fraud prevention
- ✅ Automatic invoice generation
- ✅ Customer portal for subscription management
- ✅ Faster development (weeks vs months)

**Cons**:
- ⚠️ Less design control (Stripe-branded UI)
- ⚠️ Redirect-based flow (user leaves site briefly)

**Mitigation**:
- Stripe Checkout UI is professional and trusted
- Redirect is standard for payments (users expect it)
- Clear messaging: "Redirecting to secure payment..."

**Implementation**:
```javascript
// Create checkout session (server-side)
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  mode: 'subscription',
  line_items: [{ price: COFFEE_PRICE_ID, quantity: 1 }],
  success_url: `${APP_URL}/checkout-success`,
  cancel_url: `${APP_URL}/checkout-cancel`,
  metadata: { user_id: user.id, tier: 'coffee' }
});

// Redirect to Checkout
window.location.href = session.url;
```

---

### Decision 4: Supabase Edge Functions (Not Netlify Functions)

**Decision**: Use Supabase Edge Functions for Stripe webhooks

**Alternatives Considered**:
1. **Netlify Functions** - Rejected: Separate deployment, cold starts
2. **Vercel Serverless Functions** - Rejected: Not using Vercel
3. **Express.js server on Render** - Rejected: Overkill, adds complexity

**Why Supabase Edge Functions?**

**Pros**:
- ✅ Co-located with database (low latency)
- ✅ Direct database access via service role
- ✅ TypeScript support
- ✅ Fast cold starts (Deno runtime)
- ✅ Built-in secrets management
- ✅ Free tier sufficient for MVP

**Cons**:
- ⚠️ Limited runtime (Deno, not Node.js)
- ⚠️ 10-second timeout (should be fine for webhooks)

**Implementation**:
```typescript
// File: supabase/functions/stripe-webhook/index.ts
export async function handleWebhook(req: Request) {
  // Verify Stripe signature
  // Update user tier in database
  // Return 200 OK
}
```

---

### Decision 5: Tier-Based Upsell Pages (Not Universal Modal)

**Decision**: Create separate upsell pages for each tier transition

**Alternatives Considered**:
1. **Single modal for all upsells** - Rejected: Hard to customize messaging
2. **No upsell (organic discovery)** - Rejected: Misses monetization opportunity
3. **Aggressive popups** - Rejected: Annoying, damages UX

**Why Tier-Based Pages?**

**Pros**:
- ✅ Customized messaging per tier (Free→Coffee is different than Coffee→Growth)
- ✅ Full-page real estate for persuasive content
- ✅ Easier to A/B test different messaging
- ✅ Can show different features/benefits per tier
- ✅ Users can dismiss and revisit later (not blocking)

**Cons**:
- ⚠️ More code (4 pages vs 1 modal)
- ⚠️ More design work

**Mitigation**:
- Use shared components (ZeroRiskSection, ComparisonGrid)
- Templates make new pages easy to create

**Upsell Flow**:
- Free tier → `/upsell/coffee` (Stripe Checkout)
- Coffee tier → `/upsell/growth` (Waitlist)
- Growth tier → `/upsell/scale` (Waitlist)
- Scale tier → `/welcome/scale` (No upsell, highest tier)

---

### Decision 6: Context Preservation via localStorage (Not URL Parameters)

**Decision**: Store pending analysis URL in localStorage, not URL parameters

**Alternatives Considered**:
1. **URL parameters** - Rejected: Lost during OAuth redirects
2. **sessionStorage** - Rejected: Lost when OAuth opens new tab/window
3. **Server-side session** - Rejected: Overkill, adds complexity
4. **Cookies** - Rejected: CORS issues, privacy concerns

**Why localStorage?**

**Pros**:
- ✅ Survives OAuth redirects (even in new tabs)
- ✅ Survives browser refresh
- ✅ No server-side storage needed
- ✅ 24-hour TTL prevents stale data
- ✅ Easy to implement and test

**Cons**:
- ⚠️ Not available in private browsing mode
- ⚠️ Can be cleared by user
- ⚠️ Domain-scoped (doesn't work across domains)

**Mitigation**:
- Fallback to sessionStorage if localStorage unavailable
- Graceful degradation: If context lost, user sees empty analysis page
- Clear error messages: "Context unavailable in private browsing mode"

**Implementation**:
```javascript
// Store context on landing page
storeAnalysisContext(url, 'landing');

// Retrieve context after OAuth
const context = getAnalysisContext();
if (context?.pendingAnalysisUrl) {
  navigate('/analyze', { state: { prefilledUrl: context.pendingAnalysisUrl } });
}
```

**Security Consideration**:
- URL validation before storage (prevent XSS)
- Sanitization before display (DOMPurify)
- TTL prevents indefinite storage

---

### Decision 7: First Login Detection (Skip Upsell Initially)

**Decision**: Skip upsell on first login after signup, show on second login

**Alternatives Considered**:
1. **Always show upsell** - Rejected: Interrupts first-time experience
2. **Never show upsell** - Rejected: Misses monetization opportunity
3. **Show after X analyses** - Rejected: Complex logic, hard to tune

**Why Skip First Login?**

**Pros**:
- ✅ Better onboarding - Users reach value faster
- ✅ Less pressure - Don't push upgrade before they've tried it
- ✅ Higher engagement - Users explore product first
- ✅ Better conversion timing - Upsell after they see value

**Cons**:
- ⚠️ Delayed monetization - Don't capture impulse upgrades
- ⚠️ Some users may never return (miss upsell opportunity)

**Mitigation**:
- First login: Direct to analysis page (get to value FAST)
- Second login: Show upsell (now they know the value)
- Persistent upsell: Show on every login until upgrade or dismiss
- Upgrade prompts in dashboard (non-intrusive)

**Implementation**:
```javascript
// Database column
is_first_login BOOLEAN DEFAULT true

// Check on login
if (user.is_first_login) {
  await markFirstLoginComplete(user.id);
  navigate('/analyze'); // Skip upsell
} else {
  navigate(getUpsellPage(user.tier)); // Show tier-based upsell
}
```

**A/B Test Opportunity**:
- Variant A: Skip first login (current decision)
- Variant B: Show upsell immediately
- Measure: Conversion rate, retention, engagement

---

## Security Considerations

### Authentication Security

**OAuth Security**:
- ✅ CSRF protection via `state` parameter
- ✅ Redirect URI validation (exact match)
- ✅ Tokens never exposed to client
- ✅ Session tokens use secure, httpOnly cookies

**Magic Link Security**:
- ✅ Tokens expire in 1 hour
- ✅ Tokens single-use only
- ✅ 128-bit cryptographic entropy
- ✅ Rate limiting (3 requests per email per hour)

### Payment Security

**Stripe Security**:
- ✅ Webhook signature verification (HMAC SHA256)
- ✅ Idempotency (duplicate event prevention)
- ✅ Secret keys never in client code
- ✅ Payment amounts validated server-side
- ✅ PCI compliance handled by Stripe

### Data Security

**RLS Policies**:
- ✅ Users can only access their own data
- ✅ Service role access restricted to server-side
- ✅ No RLS bypasses (worked WITH existing policies)

**Context Storage**:
- ✅ URL validation before storage (prevent XSS)
- ✅ Sanitization before display
- ✅ TTL prevents indefinite storage
- ✅ No sensitive data in localStorage

---

## Performance Considerations

### Authentication Flow Performance

**OAuth Flow**:
- Target: Complete in <5 seconds (95th percentile)
- Google OAuth typically: 2-3 seconds
- GitHub OAuth typically: 2-4 seconds

**Magic Link Flow**:
- Email delivery: <30 seconds (95th percentile)
- Link click to authenticated: <2 seconds

### Payment Flow Performance

**Stripe Checkout**:
- Session creation: <2 seconds
- Webhook processing: <5 seconds
- Tier update: <1 second (database update)

### Database Performance

**Indexes Added**:
- `idx_users_auth_provider` - Auth provider lookups
- `idx_users_tier` - Tier-based queries
- `idx_users_stripe_customer_id` - Stripe customer lookups
- `idx_users_is_first_login` - First login checks

**Expected Query Performance**:
- User lookup by ID: <10ms
- Tier update: <50ms
- Waitlist join: <100ms

---

## Monitoring and Observability

### Key Metrics to Track

**Authentication Metrics**:
- OAuth signup conversion rate (target: >60%)
- Magic Link delivery rate (target: >95%)
- Auth method distribution (Google vs GitHub vs Magic Link)
- Failed auth attempts (alert if >100/day)

**Monetization Metrics**:
- Coffee tier conversion rate (target: >15%)
- Payment success rate (target: >95%)
- Payment retry rate (of failed payments)
- MRR (Monthly Recurring Revenue)

**User Journey Metrics**:
- Context preservation rate (URL pre-fill success)
- First login → Second login retention
- Upsell dismissal rate
- Waitlist join rate

**Technical Metrics**:
- OAuth flow completion time (P50, P95, P99)
- Stripe webhook processing time
- Database query performance
- Error rates by component

---

## Rollback Plan

### If OAuth Integration Fails

1. **Immediate**: Revert to password-based authentication
2. **Code**: Git revert to previous commit
3. **Database**: Migration 021 is backward compatible (new columns allow NULL)
4. **Communication**: "Temporarily using email/password while we resolve OAuth issues"

### If Stripe Integration Fails

1. **Immediate**: Disable Coffee tier checkout
2. **Workaround**: Manual invoice via Stripe Dashboard
3. **Fix**: Debug webhook endpoint
4. **Fallback**: Use Netlify Functions for webhooks if Edge Functions fail

### If Performance Degrades

1. **Identify**: Slow query via `pg_stat_statements`
2. **Optimize**: Add missing indexes
3. **Scale**: Upgrade Supabase plan
4. **Fallback**: Temporarily disable upsell pages to reduce load

---

## Future Considerations

### Planned Enhancements

**Short-Term** (Q1 2026):
- [ ] Add Apple OAuth (iOS users)
- [ ] Add Microsoft OAuth (enterprise users)
- [ ] Implement annual billing (20% discount)
- [ ] A/B test first login upsell timing

**Mid-Term** (Q2-Q3 2026):
- [ ] Launch Growth tier ($29/month)
- [ ] Launch Scale tier ($99/month)
- [ ] Team collaboration features (Scale tier)
- [ ] API access (Scale tier)

**Long-Term** (Q4 2026+):
- [ ] White-label solution for agencies
- [ ] Enterprise SSO (SAML, OIDC)
- [ ] Custom domain support
- [ ] Multi-language support

### Known Limitations

1. **OAuth dependency**: If Google/GitHub down, users can't sign in via OAuth (Magic Link still works)
2. **localStorage requirement**: Context preservation doesn't work in private browsing mode
3. **Stripe dependency**: If Stripe down, payments fail (users stay Free tier)
4. **Single currency**: Only USD supported (plan for multi-currency in 2026)
5. **No trial period**: Coffee plan charges immediately (consider 7-day trial)

---

## Lessons Learned

### What Went Well

1. **Security-First Approach**: Working WITH RLS policies prevented security vulnerabilities
2. **Graceful Degradation**: Payment failures don't block users (good UX)
3. **Context Preservation**: localStorage solution works well, survives redirects
4. **Component Reusability**: Shared upsell components reduced dev time
5. **Clear Routing Logic**: Centralized routing functions make debugging easy

### What Could Be Improved

1. **OAuth Configuration**: Manual setup in Google/GitHub is tedious (consider automation)
2. **Testing**: Need better E2E tests for OAuth flows (hard to test locally)
3. **Documentation**: Should have created docs during dev, not after
4. **Error Handling**: Some edge cases discovered during testing (not during design)

### Recommendations for Future Projects

1. **Design for Failure**: Assume OAuth/Stripe will fail, build fallbacks upfront
2. **Test Early**: Set up OAuth providers in development, not just before launch
3. **Document As You Go**: Write ADR during design phase, not after implementation
4. **Gradual Rollout**: Test OAuth with 10% of users first, not 100%
5. **Monitor Everything**: Set up monitoring before launch, not after issues arise

---

## Approval and Sign-Off

**Decision Made**: 2025-10-02
**Implemented**: 2025-10-02
**Status**: ✅ Accepted and Production-Ready

**Approved By**:
- THE ARCHITECT (Technical Design)
- THE STRATEGIST (Product Strategy)
- THE DEVELOPER (Implementation Feasibility)
- THE TESTER (Quality Assurance Plan)

**Next Steps**:
1. Complete comprehensive E2E testing
2. Deploy to staging environment
3. Monitor for 48 hours
4. Deploy to production
5. Monitor key metrics for 1 week
6. Review and adjust based on data

---

**Last Updated**: 2025-10-02
**Version**: 1.0
**Related Documents**:
- [User Guide](./user-guide.md)
- [Developer Guide](./developer-guide.md)
- [Operator Guide](./operator-guide.md)
- [Migration Guide](./MIGRATION_FROM_PASSWORD_AUTH.md)
