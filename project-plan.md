# AImpactScanner - Project Plan

## Current Status (November 15, 2025)

**MISSION**: Tier & Pricing Realignment + Conversion Optimization
**Status**: ✅ COMPLETE - Monitoring Phase (2-week conversion tracking)
**Priority**: P1 HIGH - Revenue Impact via Conversion Optimization
**Duration**: October 24 - November 15, 2025 (22 days)

### Mission Summary

All 11 phases completed. Production deployed with full feature set:
- ✅ Dynamic tier selector with Growth default
- ✅ Billing frequency toggle (Monthly/Annual)
- ✅ 7-day trial for Growth tier
- ✅ Doug Hall persuasive messaging (OB/RRB/DD)
- ✅ Mobile responsive + WCAG AA accessibility
- ✅ Analytics tracking (7 events)
- ✅ Feature gating per tier
- ✅ Pricing page billing toggle

**Latest Deployment**: Commit 76557e1 (November 15, 2025)

---

## ACTIVE PRIORITIES

### Priority 1: Monitor Conversion Metrics (2 weeks)
**Status**: ⏳ IN PROGRESS
**Objective**: Track conversion lift and validate business impact
**Timeline**: November 15-29, 2025

**Metrics to Track**:
- [ ] Signup conversion rate (baseline: 8-12%, target: 25-35%)
- [ ] Annual billing adoption (target: 30-40%)
- [ ] Growth tier adoption (target: 70% of paid)
- [ ] Trial-to-paid conversion (target: 49-60%)
- [ ] Revenue per user increase (+11% target)

**Tools**:
- Stripe Dashboard (revenue, subscriptions)
- Analytics events (tier_selector_viewed, billing_toggle_clicked, etc.)
- Sentry (error monitoring)

### Priority 2: Remaining Technical Items
**Status**: ⏳ OPTIONAL

- [ ] Verify production Netlify Dashboard environment variables
- [ ] Audit production database for test data contamination
- [ ] Test on real devices (iOS, Android) - optional post-production

---

## COMPLETED PHASES (Archive)

### Phase 1: Strategic Analysis ✅
**Completed**: October 24, 2025
- Analyzed tier structure vs PRD requirements
- Extracted Doug Hall messaging framework
- Defined annual pricing strategy

### Phase 2: Conversion UX Design ✅
**Completed**: October 25, 2025
- Dynamic tier selector specification
- Copy matrix (4 tiers × 2 billing frequencies)
- Visual mockups with annual pricing states

### Phase 3: Stripe Product Setup ✅
**Completed**: October 25, 2025
- Created 6 products (Solo/Growth/Scale × Monthly/Annual)
- Configured 7-day trial for Growth tier
- Test Gate 1: 12/12 products verified

### Phase 4: Tier Selector Component ✅
**Completed**: October 26, 2025
- DynamicTierSelector with billing toggle
- Growth tier default, annual billing default
- Test Gate 2: 6/6 tests passed

### Phase 5: 7-Day Trial Integration ✅
**Completed**: October 27, 2025
- Trial UI with "$0.00 due today" display
- Stripe webhook integration
- Fixed JWT verification issues

### Phase 6: Doug Hall Messaging ✅
**Completed**: November 3, 2025
- OB/RRB/DD messaging for all tiers
- Dynamic copy updates on tier/billing changes
- Test Gate 4: 5/5 tests passed (100%)

### Phase 6.5: Dropdown UX Redesign ✅
**Completed**: November 4, 2025
- Replaced radio buttons with dropdown
- Responsive layout (40/60 desktop, stacked mobile)
- Keyboard navigation support

### Phase 7: Mobile Responsive + Accessibility ✅
**Completed**: November 6, 2025
- 54/54 E2E tests passing (100%)
- WCAG AA color contrast compliant
- Full keyboard navigation (Home/End/PageUp/PageDown)
- Test Gate 5: 100% pass rate

### Phase 8: Analytics + Feature Gating ✅
**Completed**: November 9, 2025
- 7 analytics events tracked
- Feature restrictions per tier (LLMS.txt, CSV, API)
- Test Gate 6: 7/7 tests passed (100%)

### Phase 9: Staging Deployment ✅
**Completed**: November 9, 2025
- 96.9% E2E test pass rate
- OAuth + Stripe integration verified
- Performance fix: LCP 24s → 160ms (favicon optimization)

### Phase 10: Production Deployment ✅
**Completed**: November 15, 2025
- LIVE MODE Stripe price IDs configured
- Billing frequency bug fixes
- Production smoke tests passed

### Phase 11: Pricing Page Billing Toggle ✅
**Completed**: November 15, 2025
- Monthly/Annual toggle with "Save 30%" badge
- Per-month equivalent display for annual billing
- Yearly savings badges ($21.90-$119.90)
- Commit: 76557e1

---

## Expected Business Impact

**Conversion Optimization Targets**:
- Conversion rate: 8-12% → 25-35% (2-3x improvement)
- Growth tier adoption: 70% of paid customers
- Annual billing adoption: 30-40% of paid customers
- Trial-to-paid conversion: 49-60%

**Revenue Impact**:
- Revenue per user: +11% annual revenue improvement
- Cash flow improvement: +84% in Q1 (annual upfront payments)
- Churn reduction: 50% lower on annual plans

**Key Features Deployed**:
- Default tier: Growth ($17.95/mo or $12.46/mo annual)
- Default billing: Annual (anchoring effect + savings display)
- 7-Day Trial: Card-required trial for Growth tier
- Dynamic copy: Persuasive messaging updates as user toggles
- Visual cues: Loss aversion messaging for lower tiers
- Annual savings: Prominent green badges with dollar amounts

---

## Key Documentation

- **Mission Spec**: `/DYNAMIC-TIER-SELECTOR-UX-SPEC.md`
- **Visual Mockups**: `/TIER-SELECTOR-VISUAL-MOCKUP.md`
- **Pricing Page Spec**: `/docs/PRICING-PAGE-REDESIGN-SPEC.md`
- **Test Suites**: `/tests/e2e/` (tier-selector-desktop/mobile/a11y, analytics-tracking)
- **Progress Log**: `/progress.md`

---

## Sprint 1: LLMs.txt Integration (LLMtxtMastery API)

**Status**: 🚀 IN PROGRESS - Phase 5
**Priority**: P1 HIGH - Feature Differentiation
**Started**: November 29, 2025
**Target**: December 13, 2025 (2 weeks)

### Sprint Overview

Integrate LLMtxtMastery API to enable llms.txt file generation within AImpactScanner. This feature will be available for Growth and Scale tier users, providing a key AI optimization deliverable.

**Tier Restrictions**:
- **Growth**: 25 llms.txt generations per month
- **Scale**: Unlimited llms.txt generations

### Phase 1: Backend Integration ✅
**Completed**: November 29, 2025

- [x] Create LLMtxtMastery service module for API calls
- [x] Store LLMtxtMastery API key securely in Supabase secrets
- [x] Create Edge Function for llms.txt generation (`generate-llmstxt`)
- [x] Implement usage tracking for llms.txt generation limits
- [x] Create rate limiting per tier (Growth: 25/month, Scale: unlimited)

**Deliverable**: `/supabase/functions/generate-llmstxt/index.ts`

### Phase 2: Database Schema Updates ✅
**Completed**: November 29, 2025

- [x] Create `llmstxt_generations` table for tracking history
- [x] Add RLS policies for llmstxt tracking
- [x] Create migration script
- [x] Add `get_llmstxt_monthly_usage()` helper function

**Deliverable**: `/supabase/migrations/20251129000001_add_llmstxt_generations_table.sql`

### Phase 3: Frontend Integration ✅
**Completed**: November 29, 2025

- [x] Create LLMsTxtPanel component for analysis results page
- [x] Add "Generate LLMs.txt" button with tier gating
- [x] Implement generation progress tracking UI
- [x] Add download functionality for generated files
- [x] Create usage limit display and upgrade prompts
- [x] Style component to match existing design system

**Deliverable**: `/src/components/LLMsTxtPanel.jsx`

### Phase 4: Dashboard Integration ✅
**Completed**: November 29, 2025

- [x] Integrate LLMsTxtPanel into SimpleResultsDashboard
- [x] Remove old LLMS.txt stub button
- [x] Connect to tier-based upgrade flow

**Deliverable**: Updated `/src/components/SimpleResultsDashboard.jsx`

### Phase 5: Deployment & Testing [ ]
**Target**: 1-2 days

- [ ] Add `LLMTXT_MASTERY_API_KEY` to Supabase Edge Function secrets
- [ ] Deploy database migration to staging
- [ ] Deploy Edge Function to staging
- [ ] Test tier restriction enforcement (Growth vs Scale)
- [ ] Test usage limit tracking and reset
- [ ] Conduct staging smoke tests
- [ ] Deploy to production

### Phase 6: Monitoring & Documentation [ ]
**Target**: 1 day

- [ ] Monitor error rates and API usage
- [ ] Update product documentation
- [ ] Update architecture documentation

### Technical Requirements

**API Integration**:
- Base URL: `https://llm-txt-mastery-production.up.railway.app`
- Authentication: X-API-Key header
- Endpoints:
  - `POST /api/v1/analyze` - Start website analysis
  - `GET /api/v1/analysis/:id` - Get analysis status
  - `POST /api/v1/generate` - Generate llms.txt file
  - `GET /api/v1/download/:id` - Download generated file

**Security Requirements**:
- API key stored in Supabase secrets (not in code)
- Never expose API key to frontend
- All API calls through Edge Function proxy
- Validate user tier before allowing generation

**Usage Limits**:
| Tier | Monthly Limit |
|------|---------------|
| Free | 0 (feature not available) |
| Solo | 0 (feature not available) |
| Growth | 25 generations/month |
| Scale | Unlimited |

### Success Criteria

- [ ] Growth tier users can generate up to 25 llms.txt files/month
- [ ] Scale tier users can generate unlimited llms.txt files
- [ ] Free/Solo tier users see upgrade prompt when accessing feature
- [ ] Generated files download correctly
- [ ] Usage tracking resets monthly
- [ ] API errors handled gracefully with user-friendly messages
- [ ] Feature integrates seamlessly with existing analysis flow

### Risk Mitigation

1. **API Availability**: Implement retry logic and fallback messaging
2. **Rate Limits**: Cache API responses to reduce calls
3. **Cost Management**: Track usage per user for billing optimization
4. **Security**: Never log API keys, use secure storage

---

## Next Mission Planning

With the Tier & Pricing Realignment mission complete and Sprint 1 in planning, potential future priorities:

1. **Growth Marketing** - Content, SEO, social proof
2. **Feature Development** - AI Remediation Planner, Progress Tracking
3. **Technical Debt** - Code cleanup, performance optimization
4. **User Research** - Feedback collection, usability testing

*Sprint 1 takes priority.*

---

**Document Version**: 4.0 (Mission Complete)
**Last Updated**: November 15, 2025
**Previous Version**: See git history

*Document maintained by THE COORDINATOR (AGENT-11)*
