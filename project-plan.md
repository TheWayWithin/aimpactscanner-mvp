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

**Status**: ✅ COMPLETE - Smoke tests passed
**Priority**: P1 HIGH - Feature Differentiation
**Started**: November 29, 2025
**Completed**: December 5, 2025

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

### Phase 5: Deployment & Testing ✅
**Completed**: December 5, 2025

- [x] Add `LLMTXT_MASTERY_API_KEY` to Supabase Edge Function secrets (both environments)
- [x] Deploy database migration to staging
- [x] Deploy database migration to production
- [x] Deploy Edge Function to staging
- [x] Deploy Edge Function to production
- [x] Push frontend code to trigger Netlify deploy
- [x] Fix: App.jsx not passing userTier prop to SimpleResultsDashboard (`fa298f8`)
- [x] Fix: Edge Function - pass action in body instead of query params (`e35ba76`)
- [x] Fix: Edge Function - use getUser(jwt) for proper auth verification (`aaa7cfe`)
- [x] Fix: Staging API key was invalid - updated to production key
- [x] Fix: Frontend response parsing - API returns nested `analysis.id` (`5e330d4`)
- [x] Test tier restriction enforcement (Growth vs Scale) - code verified
- [x] Conduct smoke tests - Growth tier tested successfully

**Commits**:
- `5e92590` - feat: add LLMs.txt generation integration (Sprint 1)
- `fa298f8` - fix: pass userTier to SimpleResultsDashboard for LLMs.txt panel
- `e35ba76` - fix: pass action in body instead of query params for Edge Function
- `aaa7cfe` - fix: use getUser(jwt) for Edge Function auth verification
- `5e330d4` - fix: handle nested analysis.id in LLMs.txt API response

**Smoke Test Results** (December 5, 2025):
- Usage stats display: ✅ Working (10/25)
- Analysis start: ✅ Working
- Progress polling: ✅ Working (22% → 63%)
- Tier restrictions: ✅ Verified (Growth/Scale only)

### Phase 6: Monitoring & Documentation ✅
**Completed**: December 5, 2025

- [x] Monitor error rates and API usage (Edge Function logs checked - no errors)
- [x] Update product documentation (product-description.md v2.2)
- [x] Update architecture documentation (architecture.md v2.2, ADR-015 Accepted)

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

---

## Sprint 2: Traditional SEO Foundation Integration

**Status**: ✅ COMPLETE - Deployed to Staging
**Priority**: P1 HIGH - Addresses 88% coverage gap identified in SEO analysis
**Target Duration**: 3 weeks (15 implementation days @ 2-4 hours/day)
**Started**: December 5, 2025
**Completed**: December 7, 2025

### Sprint Overview

Implement Phase 1 of the Incremental Hybrid Approach by adding foundational traditional SEO checks that AI SEO depends upon. This sprint addresses the critical insight that "AI SEO is fundamentally limited by basic SEO" - without indexability, mobile-friendliness, and core technical health, AI optimization delivers minimal results. The sprint introduces 5 new assessment factors that establish the technical foundation required for effective AI SEO.

**Positioning Change**: From "AI SEO Scanner" to "AI-Ready SEO Scanner"
**Coverage Impact**: Increases traditional SEO coverage from 12% to 50%
**Value Proposition**: Validates that sites meet baseline requirements before AI optimization

**Success Metrics**:
- [ ] All 5 traditional SEO factors assess successfully on test sites
- [ ] Tier restrictions enforce correctly (Free: 1 factor, Solo: all 5)
- [ ] Results integrate with existing dashboard UI patterns
- [ ] External API calls (PageSpeed) handle rate limits gracefully
- [ ] Assessment completion time remains <30 seconds for Solo tier

### Phase 1: Database & Factor Schema Design ✅
**Completed**: December 5, 2025

- [x] Create migration for traditional SEO factor results (`20251205000001_traditional_seo_factors.sql`)
- [x] Define 5 new SEO factors in `supabase/functions/analyze-page/lib/traditionalSeoFactors.ts`
  - `indexability-status` (Factor T.1.1, Tier: Free)
  - `mobile-friendly` (Factor T.1.2, Tier: Solo)
  - `page-speed-mobile` (Factor P.1.1, Tier: Solo)
  - `broken-links` (Factor T.1.3, Tier: Solo)
  - `sitemap-presence` (Factor T.1.4, Tier: Solo)
- [x] FactorResult interface already exists in analyze-page/index.ts
- [x] Update tier restrictions in `src/lib/tierUtils.js`

**Deliverable**: `/supabase/migrations/20251205000001_traditional_seo_factors.sql`

### Phase 2: Core Assessment Functions ✅
**Completed**: December 5, 2025

- [x] Indexability checker (`analyzeIndexability` function)
- [x] Mobile-friendliness checker (`analyzeMobileFriendly` function)
- [x] Page speed analyzer stub (`analyzePageSpeedStub` - estimates, real API in Phase 3)
- [x] Broken links checker (`analyzeBrokenLinksBasic` - URL pattern analysis)
- [x] Sitemap detector (`analyzeSitemapPresence` function)
- [x] Integration into main Edge Function (`analyze-page/index.ts` - 23 total factors)

**Deliverable**: `/supabase/functions/analyze-page/lib/traditionalSeoFactors.ts` (719 lines)

### Phase 3: Edge Function Integration ✅
**Completed**: December 7, 2025

- [x] Integrated 5 new factors into main analyze-page Edge Function
- [x] Created caching infrastructure (seo_external_cache table with 24h TTL)
- [x] Deployed Edge Function with 23 total factors
- [x] Deployed migration to staging database

**Deliverable**: Updated `/supabase/functions/analyze-page/index.ts` (23 factors)

### Phase 4: Frontend Integration ✅
**Completed**: December 7, 2025

- [x] Updated tierUtils.js with feature gating for new SEO factors
- [x] SimpleResultsDashboard shows all 23 factors
- [x] PreviewResults component displays 9 pillars including P (Performance)
- [x] Tier gating: Indexability (Free+), other factors (Coffee+)

**Deliverable**: Updated `/src/lib/tierUtils.js`, `/src/components/SimpleResultsDashboard.jsx`

### Phase 5: Testing & Edge Cases ✅
**Completed**: December 7, 2025

- [x] Created Playwright test suite (`tests/playwright/sprint2-traditional-seo.spec.js`)
- [x] Manual browser testing verified 23 factors, 9 pillars, score calculations
- [x] tierUtils feature gating test passed
- [x] API tests available (skipped in CI due to rate limiting)

**Deliverable**: Test suite in `/tests/playwright/sprint2-traditional-seo.spec.js`

### Phase 6: Documentation & Launch Prep ✅
**Completed**: December 7, 2025

- [x] Update architecture docs (v2.3 - Sprint 2 Complete)
- [x] Update product documentation (v2.3 - 23 factors, 9 pillars)
- [x] Create changelog entry in progress.md
- [ ] Update marketing copy (about page) - OPTIONAL for production deploy
- [ ] Prepare launch announcement - OPTIONAL for production deploy

**Deliverable**: Updated `docs/Documents/Foundations/architecture.md`, `product-description.md`

### Technical Requirements

**New Dependencies**:
- Google PageSpeed Insights API (free tier: 25 req/day)

**Database Changes**:
- New table: `seo_traditional_results` with JSONB result data and caching columns

**Edge Functions**:
- New: `assess-traditional-seo` (heavy operations: PageSpeed, broken links)

**Frontend Components**:
- New directory: `src/components/assessment/traditional/` (5 result components)

### Tier Restrictions

| Factor | Free | Solo | Growth | Scale |
|--------|------|------|--------|-------|
| **Indexability Status** | ✅ | ✅ | ✅ | ✅ |
| **Mobile-Friendliness** | ❌ | ✅ | ✅ | ✅ |
| **Page Speed (Mobile)** | ❌ | ✅ | ✅ | ✅ |
| **Broken Links Check** | ❌ | ✅ | ✅ | ✅ |
| **Sitemap Presence** | ❌ | ✅ | ✅ | ✅ |

### Risk Mitigation

1. **PageSpeed API rate limits**: Aggressive caching (24h TTL), exponential backoff
2. **Broken links checker timeouts**: Limit to homepage links only (max 50)
3. **Scope creep**: De-scope to 3 factors if timeline at risk

### Success Criteria

- [ ] All 5 factors assess successfully on 10 diverse test sites
- [ ] Cache reduces redundant API calls by 80%+
- [ ] Assessment completion time <30 seconds for Solo tier
- [ ] Free → Solo conversion rate increases by 10%
- [ ] Positioning change reflected across marketing materials

---

## Sprint 3: High-Priority Traditional SEO Factors

**Status**: ✅ COMPLETE
**Priority**: P2 MEDIUM - Completes traditional SEO foundation
**Target Duration**: 4-5 weeks (after Sprint 2)
**Started**: December 8, 2025
**Completed**: December 8, 2025

### Sprint Overview

Implement Phase 2 of the Incremental Hybrid Approach by adding high-priority traditional SEO factors that significantly impact site authority and crawl efficiency. These factors address issues that limit AI SEO performance even after critical blockers are resolved. Sprint 3 completes the traditional SEO foundation, achieving ~75% coverage.

**Coverage Impact**: Increases traditional SEO coverage from 50% to 75%
**Value Proposition**: Comprehensive technical health for AI-ready sites

**Success Metrics**:
- [x] All 4 high-priority factors assess successfully
- [x] Integration with Sprint 2 assessment flow is seamless
- [ ] Users understand relationship between factors (educational content)
- [ ] Pricing increase justified ($29 → $39/month for comprehensive coverage)

### Phase 1: Canonical Tags Assessment ✅
**Completed**: December 8, 2025

- [x] Create canonical tag checker (`supabase/functions/analyze-page/lib/traditionalSeoFactors.ts`)
  - Detect `<link rel="canonical">` presence
  - Validate self-referencing canonicals
  - Detect cross-domain canonical issues
  - Check for conflicting canonical signals
- [x] Add to Edge Function assessment flow (Factor 24: TS.2.1)
- [x] Create result component with recommendations
- [x] Add to tier restrictions (Solo+)

**Deliverable**: `analyzeCanonicalTags()` function with actionable recommendations

### Phase 2: Internal Linking Analysis ✅
**Completed**: December 8, 2025

- [x] Create internal linking analyzer (`supabase/functions/analyze-page/lib/traditionalSeoFactors.ts`)
  - Count internal links on page
  - Analyze anchor text distribution
  - Detect orphan pages (pages with no internal links)
  - Identify link depth issues (pages >3 clicks from homepage)
- [x] Add to Edge Function assessment flow (Factor 25: TS.2.2)
- [x] Create result component with link analysis
- [x] Add educational content explaining link equity

**Deliverable**: `analyzeInternalLinking()` function with structure analysis

### Phase 3: Duplicate Site Versions ✅
**Completed**: December 8, 2025

- [x] Create duplicate version checker (`supabase/functions/analyze-page/lib/traditionalSeoFactors.ts`)
  - Test HTTP vs HTTPS versions
  - Test www vs non-www versions
  - Verify proper redirects (301, not 302)
  - Check for mixed content issues
- [x] Add to Edge Function assessment flow (Factor 26: TS.2.3)
- [x] Create result component showing canonical version status
- [x] Provide redirect configuration guidance

**Deliverable**: `analyzeDuplicateVersions()` function with redirect guidance

### Phase 4: Enhanced Robots.txt Analysis ✅
**Completed**: December 8, 2025

- [x] Create robots.txt checker (`supabase/functions/analyze-page/lib/traditionalSeoFactors.ts`)
  - Parse full robots.txt file
  - Check for overly restrictive rules (blocking CSS/JS)
  - Detect wildcard issues
  - Verify Sitemap directive present
  - Check crawl-delay settings
  - Validate against common SEO crawler user-agents (Googlebot, Bingbot)
- [x] Add to Edge Function assessment flow (Factor 27: TS.2.4)
- [x] Create detailed result component with rule explanations

**Deliverable**: `analyzeRobotsTxt()` function with comprehensive analysis

### Phase 5: Integration & Testing ✅
**Completed**: December 8, 2025

- [x] Integrate all 4 factors into assessment flow (27 total factors)
- [x] All factors added to Edge Function index.ts
- [x] E2E tests for new factors (`tests/playwright/sprint3-traditional-seo.spec.js`)
- [x] Performance validation (instant phase - no external HTTP requests)
- [ ] Update tier comparison table (documentation task)

**Deliverable**: Fully integrated Sprint 3 factors with test coverage

### Technical Requirements

**Database Changes**:
- Extend `seo_traditional_results` table for new factor types

**Edge Function Updates**:
- Extend `assess-traditional-seo` with new factor handlers

**Frontend Components**:
- 4 new result components in `/src/components/assessment/traditional/`
- Internal linking visualization component

### Tier Restrictions

| Factor | Free | Solo | Growth | Scale |
|--------|------|------|--------|-------|
| **Canonical Tags** | ❌ | ✅ | ✅ | ✅ |
| **Internal Linking** | ❌ | ✅ | ✅ | ✅ |
| **Duplicate Versions** | ❌ | ✅ | ✅ | ✅ |
| **Enhanced Robots.txt** | ❌ | ✅ | ✅ | ✅ |

### Success Criteria

- [x] All 4 factors assess successfully on test sites
- [x] Total assessment time <45 seconds (instant phase analysis)
- [ ] User documentation complete for all new factors
- [ ] Pricing increase to $39/month justified and implemented

---

## Sprint 4: Continuous SEO Improvement (Phase 3+)

**Status**: 🔵 BACKLOG (User Feedback Driven)
**Priority**: P3 LOW - Based on user requests and analytics
**Target Duration**: Ongoing (1-2 factors per month)
**Started**: TBD

### Sprint Overview

Continuous improvement of traditional SEO coverage based on user feedback, analytics on common issues, and competitive analysis. This sprint is intentionally open-ended and prioritized based on real user needs rather than speculative feature development.

**Coverage Target**: 75% → 85%+ traditional SEO
**Strategy**: Add 1-2 factors per month, guided by data

### Candidate Factors (Prioritize Based on Feedback)

**Technical Health:**
- [ ] Server errors (5xx) monitoring
- [ ] Redirect chains/loops detection
- [ ] URL structure quality analysis
- [ ] Site architecture assessment
- [ ] JavaScript SEO (render testing)

**Content & Trust:**
- [ ] About/Privacy/Terms page presence
- [ ] Content freshness tracking
- [ ] Readability scores (Flesch-Kincaid)

**Media Optimization:**
- [ ] Image file optimization (size, format, WebP)
- [ ] Image lazy loading detection

### Selection Criteria

Before adding any factor, validate:
1. **User Demand**: >10% of users request it OR top 3 in feedback
2. **Impact**: Directly affects AI SEO or search visibility
3. **Feasibility**: Can implement in <1 week with existing architecture
4. **API Cost**: Free or <$50/month additional cost

### Explicitly Deferred (Low ROI for Target Market)

These factors are unlikely to be added based on target market analysis:

| Factor | Reason for Deferral |
|--------|---------------------|
| Anchor text distribution | Too advanced for solopreneurs |
| Link velocity tracking | Enterprise-level concern |
| Pagination handling | Edge case, low demand |
| International SEO (hreflang) | Niche requirement |
| Social proof detection | Not SEO-critical |

### Cost-Prohibitive (Revenue Milestone Required)

These factors require paid APIs and will only be considered after reaching revenue milestones:

| Factor | API Cost | Revenue Milestone |
|--------|----------|-------------------|
| Backlink profile analysis | $100-500/month (Moz, Ahrefs) | $5K MRR |
| Domain authority metrics | $100-300/month | $5K MRR |
| Referring domains quality | $200-500/month | $10K MRR |

### Success Criteria

- [ ] User satisfaction >4.5/5 for traditional SEO coverage
- [ ] Feature requests addressed within 4-6 weeks
- [ ] No factor added without validation against selection criteria
- [ ] Monthly review of analytics to identify gaps

---

## Traditional SEO Roadmap Summary

| Sprint | Phase | Factors | Coverage | Timeline |
|--------|-------|---------|----------|----------|
| **Sprint 2** | Phase 1: Critical Blockers | 5 factors | 12% → 50% | 3 weeks |
| **Sprint 3** | Phase 2: High-Priority | 4 factors | 50% → 75% | 4-5 weeks |
| **Sprint 4** | Phase 3: Continuous | 1-2/month | 75% → 85%+ | Ongoing |

**Total Traditional SEO Journey**: ~8-10 weeks to 75% coverage, then continuous improvement

---

## Sprint 5: Signup Value Ladder Optimization

**Status**: ✅ COMPLETE - Deployed to Local Dev
**Priority**: P1 HIGH - Conversion Rate Optimization
**Started**: December 10, 2025
**Value Ladder Defined**: December 13, 2025
**Completed**: December 13, 2025
**Target Duration**: 1 week

### Sprint Overview

Transform signup page into clear value ladder that drives higher-tier conversions using Doug Hall's Marketing Physics framework. Based on LLMtxtMastery pattern + "So What?" test.

**Key Insight**: Customers don't care about AI - they care about losing customers and revenue. All messaging reframed around real customer outcomes.

**Success Metrics**:
- [ ] Solo → Growth upgrade conversion: Target 30%+
- [ ] Growth tier selection: Maintain 70%+ default selection rate
- [ ] Signup completion rate: Maintain or improve current rate

---

### Phase 1: Layout Fixes ✅

#### [x] Task 1.1: Force single-column layout always
**File**: `src/components/DynamicTierSelector/DynamicTierSelector.jsx` (Line 140)
**Issue**: `grid-cols-1 lg:grid-cols-[40%_60%]` causes two-column on wide screens
**Fix**: Removed `lg:grid-cols-[40%_60%]`, kept `grid-cols-1` only
**Priority**: High
**Completed**: December 13, 2025

#### [x] Task 1.2: Fix text width on Solo tier messaging
**File**: `src/components/DynamicTierSelector/TierMessagingSection.jsx`
**Issue**: Text doesn't expand to full container width in narrow column
**Fix**: Complete rewrite with new messaging structure handles this
**Priority**: High
**Completed**: December 13, 2025

#### [~] Task 1.3: Improve mobile/narrow screen padding
**File**: `src/pages/Signup.jsx` (Line 99)
**Issue**: Padding inconsistent (`p-3 sm:p-4 lg:p-8`)
**Status**: Deferred - single-column layout resolves main issue
**Priority**: Medium

---

### Phase 2: Value Ladder Messaging ✅

**Full spec**: See `sprint5-handover-notes.md` for complete messaging details.

#### Finalized Value Ladder

| Tier | OB Tagline | OB Headline |
|------|-----------|-------------|
| **Free** | "Am I losing customers?" | "Discover where you're losing customers to AI" |
| **Solo** | "Stop losing customers" | "Fix the problems that are costing you customers" |
| **Growth** | "Never lose a customer to AI" | "The complete system: scan, plan, track, get found" |
| **Scale** | "Never say no to a client" | "100 scans, unlimited LLMS.txt, unlimited history - take on any project" |

#### FOMO Structure (Each tier → Next tier)

| Tier | FOMO Headline | Key Message |
|------|---------------|-------------|
| **Free → Solo** | "What you're missing:" | "Free finds the problem - but then you're stuck. Fix something? That's scan 2. Verify it worked? Scan 3. You're done." |
| **Solo → Growth** | "More than a side project?" | "You'll need to work across pages and sites, track your progress, and keep AI finding you after every change." |
| **Growth → Scale** | "Working with clients?" | "40 scans won't cover their sites plus yours. Scale gives you 100 scans, unlimited LLMS.txt, and unlimited history - never say no to a project." |
| **Scale** | "No limits" | "Take on any project. Cover any site. Never run out of scans or history." |

#### [x] Task 2.1: Implement tier messaging in TierMessagingSection.jsx
**Completed**: December 13, 2025

#### [x] Task 2.2: Update dropdown descriptions in DynamicTierSelector.jsx
**Completed**: December 13, 2025

---

### Phase 3: Implementation Tasks ✅

#### [x] Task 3.1: Update TierMessagingSection.jsx
- Implemented new TIER_MESSAGING structure with OB, FOMO, and benefits
- Added FOMO boxes with next-tier-up comparison
- Styled FOMO boxes (yellow/amber for upgrades, green for Scale confirmation)
**Completed**: December 13, 2025

#### [x] Task 3.2: Update DynamicTierSelector.jsx dropdown options
- Updated dropdown text with OB taglines
- Updated volume lines per tier
- Added tagline display in dropdown trigger and menu options
**Completed**: December 13, 2025

#### [x] Task 3.3: Update "What You Get" benefits sections
- Implemented highlighted first benefit per tier (★ icon with yellow background)
- Added tier-specific benefit bullets with checkmarks
**Completed**: December 13, 2025

---

### Phase 4: Testing & Validation ✅

#### [x] Task 4.1: Visual review at all screen widths
- Tested via Playwright browser automation
- Verified: Single column layout working
- Full-width text confirmed
**Completed**: December 13, 2025

#### [x] Task 4.2: Test tier switching behavior
- ✅ Messaging updates immediately on tier change
- ✅ FOMO callouts appear correctly per tier (Free→Solo, Solo→Growth, Growth→Scale, Scale=confirmation)
- ✅ Next-tier comparison is correct (not skipping)
- ✅ All 4 tiers display correct OB headlines, bullets, FOMO boxes, and "What You Get" sections
**Completed**: December 13, 2025

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/DynamicTierSelector/TierMessagingSection.jsx` | Complete messaging overhaul with new value ladder |
| `src/components/DynamicTierSelector/DynamicTierSelector.jsx` | Update dropdown text and layout |

---

### Success Criteria ✅

- [x] Single-column layout at ALL screen widths
- [x] Each tier shows correct OB headline and bullets
- [x] Each tier compares to NEXT tier only (not skip)
- [x] FOMO messaging creates urgency to upgrade
- [x] "What You Get" sections show tier-specific benefits
- [x] Scale tier shows confirmation message (not upgrade prompt)

---

## Sprint 6: Backend Migration & Dynamic Site Analysis

**Status**: ⏳ IN PROGRESS (Phases 1-4 Complete, Phase 5 Ready)
**Priority**: P0 CRITICAL - Unblocks CSR website analysis (core feature gap)
**Target Duration**: 6-8 weeks
**Started**: December 14, 2025
**Requirements Doc**: `/docs/Ideation/AImpactScanner_ Backend Migration Strategy.md`

### Sprint Progress Summary

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1: Railway Infrastructure | ✅ COMPLETE | Dec 14, 2025 |
| Phase 2: Lift & Shift Analysis | ✅ COMPLETE | Dec 14, 2025 |
| Phase 3: Async Job Processing | ✅ COMPLETE | Dec 15, 2025 |
| Phase 4: Headless Browser (Puppeteer) | ✅ COMPLETE | Dec 15, 2025 |
| Phase 5: Production Migration | ⏳ READY | Pending |
| Phase 6: LLMs.txt Migration | ❌ Not Started | - |

**Key Commits**:
- `eab3cad` - feat: add Railway backend with async job processing (Phase 3)
- `3385f28` - feat: add Puppeteer support for CSR website analysis (Phase 4)
- `de30874` - feat: add Railway backend integration with feature flag
- `67416c0` - fix: Railway backend job_id and trust proxy issues

### Sprint Overview

Migrate the analysis backend from Supabase Edge Functions to Railway Node.js to eliminate the 60-second timeout constraint and enable dynamic (CSR/JavaScript-rendered) website analysis. This migration unlocks the ability to analyze modern SaaS websites, React SPAs, and other JavaScript-heavy sites that currently return empty or incomplete results.

**Business Impact**:
- Removes #1 technical blocker for target market (SaaS builders, modern web apps)
- Enables analysis of CSR websites (React, Vue, Next.js client-side apps)
- Supports long-running analysis jobs (minutes instead of 60-second max)
- Future-proofs architecture for advanced features (competitor analysis, batch processing)

**Migration Strategy**: Phased approach maintaining backwards compatibility
- Phase 1: Lift & Shift (existing logic to Railway)
- Phase 2: Async Job Processing (job queue for better UX)
- Phase 3: Headless Browser Integration (Puppeteer for CSR)

### Architecture Changes

**Current Architecture**:
```
┌─────────────────┐      HTTPS      ┌──────────────────┐
│ React Frontend  │───────────────▶│ Supabase Edge    │
│   (Netlify)     │◀───────────────│ Functions (Deno) │
└─────────────────┘                └────────┬─────────┘
                                            │
                                   ┌────────▼────────┐
                                   │   PostgreSQL    │
                                   │   (Supabase)    │
                                   └─────────────────┘
```

**Target Architecture**:
```
┌─────────────────┐      HTTPS      ┌──────────────────┐
│ React Frontend  │───────────────▶│  Railway Service │
│   (Netlify)     │◀───────────────│ (Node.js/Express)│
└─────────────────┘      (API)     └─────────┬────────┘
                                             │
                                   ┌─────────▼────────┐
                                   │  Analysis Worker │
                                   │   (Puppeteer)    │
                                   └─────────┬────────┘
                                             │
                                   ┌─────────▼────────┐
                                   │   PostgreSQL     │
                                   │   (Supabase)     │
                                   └──────────────────┘
```

**What Stays on Supabase**:
- PostgreSQL database (users, analyses, factors, progress)
- Authentication (OAuth, Magic Links)
- Real-time subscriptions (WebSocket for progress updates)
- Non-analysis Edge Functions (create-checkout-session, create-portal-session, stripe-webhook)

**What Moves to Railway**:
- analyze-page Edge Function → Railway API endpoint
- generate-llmstxt Edge Function → Railway API endpoint
- Analysis engine logic (AnalysisEngine.ts, traditionalSeoFactors.ts)

### Environment Strategy

| Environment | Frontend | Backend (Railway) | Database (Supabase) |
|-------------|----------|-------------------|---------------------|
| **Development** | localhost:5173 | Railway Dev instance | Staging (isgzvwpjokcmtizstwru) |
| **Staging** | develop--aimpactscanner.netlify.app | Railway Staging instance | Staging (isgzvwpjokcmtizstwru) |
| **Production** | aimpactscanner.com | Railway Production instance | Production (pdmtvkcxnqysujnpcnyh) |

**CRITICAL**: Railway environments MUST connect to the correct Supabase database:
- Dev/Staging Railway → Staging Supabase (NEVER production)
- Production Railway → Production Supabase (ONLY after full validation)

---

### Phase 1: Railway Infrastructure Setup ✅
**Target Duration**: 1 week
**Status**: ✅ COMPLETE (December 14, 2025)

**Objective**: Set up Railway project with Node.js/Express API that can connect to Supabase.

#### Tasks

- [x] **1.1 Railway Project Setup**
  - Created Railway project `aimpactscanner-backend`
  - Configured GitHub repository integration for auto-deploys
  - Set up environment variables structure
  - Created staging environment

- [x] **1.2 Node.js/Express Boilerplate**
  - Initialized Node.js project with TypeScript
  - Set up Express server with health check endpoint
  - Configured CORS for Netlify origins
  - Implemented request logging and error handling middleware

- [x] **1.3 Supabase Client Integration**
  - Installed `@supabase/supabase-js` package
  - Configured Supabase client with environment variables
  - Tested database read/write operations
  - Implemented service role authentication

- [x] **1.4 Environment Configuration**
  - Set up `.env.example` with all required variables
  - Configured Railway environment variables for staging
  - Documented environment variable requirements
  - Verified staging database connectivity

**Deliverables** (All Complete):
- `/backend/` directory with Node.js/Express project ✅
- `/backend/src/index.ts` - Express server entry point ✅
- `/backend/src/lib/supabase.ts` - Supabase client configuration ✅
- `/backend/.env.example` - Environment variable template ✅
- Railway staging environment deployed and accessible ✅

**Success Criteria** (All Met):
- [x] Railway staging service responds to health check
- [x] Service can read/write to staging Supabase database
- [x] CORS allows requests from staging Netlify frontend
- [x] Environment variables properly configured

---

### Phase 2: Lift & Shift Analysis Engine ✅
**Target Duration**: 2 weeks
**Status**: ✅ COMPLETE (December 14, 2025)

**Objective**: Port existing analysis logic from Deno Edge Functions to Node.js, achieving feature parity.

#### Tasks

- [x] **2.1 Port Core Analysis Engine**
  - Converted analysis engine from Deno to Node.js
  - Adapted imports (Deno → Node.js module system)
  - Maintained all 27 factor analysis functions
  - Preserved scoring algorithms and weighting

- [x] **2.2 Port Traditional SEO Factors**
  - Converted `traditionalSeoFactors.ts` to Node.js
  - Updated regex patterns for Node.js compatibility
  - Maintained safety limits (MAX_LINKS, etc.)
  - Preserved factor result interfaces

- [x] **2.3 Create API Endpoints**
  - `POST /api/analyze` - Start website analysis
  - `GET /api/analysis/:id` - Get analysis status/results
  - Implemented request validation (URL format, tier limits)

- [x] **2.4 Progress Tracking Integration**
  - Implemented progress updates to Supabase `analysis_progress` table
  - Maintained WebSocket compatibility (Supabase real-time)
  - Ported educational content during analysis stages
  - Added configurable timeout handling

- [x] **2.5 Tier Management Integration**
  - Ported tier management to Node.js
  - Validated user tier before analysis
  - Enforced monthly limits per tier
  - Returned appropriate error codes for limit exceeded

- [x] **2.6 Staging Integration Testing**
  - Updated frontend API calls to use Railway staging URL
  - Created feature flag for Railway vs Edge Function (`VITE_USE_RAILWAY_BACKEND`)
  - Tested all 27 factors
  - Verified progress tracking works end-to-end

**Deliverables** (All Complete):
- `/backend/src/services/analyzer/index.ts` - Ported analysis engine ✅
- `/backend/src/services/analyzer/factors/traditionalSeoFactors.ts` - Ported SEO factors ✅
- `/backend/src/services/analyzer/factors/coreFactors.ts` - Core AI factors ✅
- `/backend/src/routes/analyze.ts` - Analysis API routes ✅
- `/backend/src/middleware/auth.ts` - JWT/Supabase auth middleware ✅

**Success Criteria** (All Met):
- [x] All 27 factors working on Railway
- [x] Progress tracking works via Supabase real-time
- [x] Tier restrictions enforced correctly
- [x] Feature flag enables Railway/Edge Function switching

---

### Phase 3: Async Job Processing ✅
**Target Duration**: 1.5 weeks
**Status**: ✅ COMPLETE (December 15, 2025)

**Objective**: Implement job queue for analysis tasks, enabling long-running operations and better UX.

#### Tasks

- [x] **3.1 Jobs Database Schema**
  - Created `analysis_jobs` table in Supabase
  - Added RLS policies for job visibility
  - Created index on status for efficient polling
  - Migration: `supabase/migrations/20251215000001_add_analysis_jobs_table.sql`

- [x] **3.2 Job Queue Implementation**
  - Implemented job producer (API creates job record)
  - Implemented job consumer (worker polls for pending jobs)
  - Added job status transitions with timestamps
  - Implemented retry logic with exponential backoff

- [x] **3.3 Worker Process**
  - Created background worker that processes jobs
  - Implemented graceful shutdown handling (SIGTERM/SIGINT)
  - Implemented job timeout handling
  - Added `claim_next_job()` RPC with FOR UPDATE SKIP LOCKED

- [x] **3.4 API Changes**
  - `POST /api/analyze/async` - Returns jobId immediately
  - `GET /api/analyze/jobs/:jobId` - Job status with results
  - `GET /api/analyze/jobs` - User's job history

- [x] **3.5 Frontend Updates**
  - Created `src/lib/railwayApi.js` for Railway API calls
  - Updated analysis flow to poll job status
  - Handle job failures gracefully

**Deliverables** (All Complete):
- `/backend/src/services/jobQueue.ts` - Job queue logic ✅
- `/backend/src/worker.ts` - Background worker ✅
- `/supabase/migrations/20251215000001_add_analysis_jobs_table.sql` ✅
- `/src/lib/railwayApi.js` - Frontend API integration ✅

**Success Criteria** (All Met):
- [x] Analysis requests return immediately with jobId
- [x] Failed jobs retry automatically (up to 3 times)
- [x] Frontend shows accurate job status
- [x] Queue processes jobs correctly

---

### Phase 4: Headless Browser Integration ✅
**Target Duration**: 2 weeks
**Status**: ✅ COMPLETE (December 15, 2025)

**Objective**: Add Puppeteer for CSR website analysis, detecting and rendering JavaScript-heavy sites.

#### Tasks

- [x] **4.1 Puppeteer Setup**
  - Installed `puppeteer` package
  - Configured Railway for headless browser support
  - Set up browser instance management
  - Implemented browser crash recovery

- [x] **4.2 CSR Detection Logic**
  - Fetch initial HTML with standard `fetch()`
  - Detect CSR indicators:
    - Empty/minimal `<body>` content
    - React/Vue/Angular root elements
    - Large JavaScript bundles
    - `<noscript>` fallback content
  - Score content "richness" with confidence percentage

- [x] **4.3 Hybrid Analysis Strategy**
  - If content is rich (SSR/SSG): Use fast direct parsing
  - If content is sparse (CSR): Launch Puppeteer render
  - Implement timeout for Puppeteer (90 seconds max)
  - Cache rendered content for factor analysis

- [x] **4.4 Puppeteer Analysis Integration**
  - Wait for page fully loaded (`networkidle0`)
  - Extract rendered HTML after JavaScript execution
  - Pass rendered content to existing analysis engine
  - Handle SPAs with client-side routing

- [x] **4.5 Performance Optimization**
  - Implemented browser instance reuse
  - Added request interception (block ads, tracking, large media)
  - Configured viewport and user agent for consistency
  - Added resource limits (memory, timeout)

- [x] **4.6 Testing & Validation**
  - Tested against CSR websites
  - Compared results: Puppeteer vs direct fetch
  - Verified hybrid strategy works

**Deliverables** (All Complete):
- `/backend/src/services/browserRenderer.ts` - Puppeteer rendering service ✅
- `/backend/src/services/csrDetector.ts` - CSR detection logic ✅
- `/backend/src/services/pageFetcher.ts` - Hybrid fetch strategy ✅
- Updated analysis engine with hybrid rendering strategy ✅

**Success Criteria** (All Met):
- [x] CSR detection implemented with confidence scoring
- [x] Puppeteer rendering integrated
- [x] Direct fetch used for SSR sites (no regression)
- [x] Hybrid strategy working on staging

---

### Phase 5: Production Migration ⏳
**Target Duration**: 1 week
**Status**: ⏳ READY TO DEPLOY

**Objective**: Migrate production traffic from Edge Functions to Railway backend.

**Current State**:
- Railway backend fully functional on staging
- Feature flag (`VITE_USE_RAILWAY_BACKEND`) controls routing
- Production currently uses Edge Functions (stable)
- Ready to enable Railway on production

#### Tasks

- [x] **5.1 Production Railway Environment**
  - Railway production environment exists
  - Production Supabase credentials configured
  - SSL/TLS configured via Railway

- [ ] **5.2 Enable Production Traffic**
  - Set `VITE_USE_RAILWAY_BACKEND=true` in Netlify production env vars
  - Monitor error rates during migration
  - Keep Edge Function as instant fallback (set flag back to false)

- [ ] **5.3 Production Validation**
  - Run production smoke tests
  - Monitor analysis success rates
  - Track response times
  - Verify tier limits working correctly

- [ ] **5.4 Edge Function Deprecation** (After 30 days stable)
  - Document Edge Function deprecation plan
  - Update CLAUDE.md with new architecture
  - Archive Edge Function code (don't delete)
  - Update architecture.md documentation

- [ ] **5.5 Monitoring & Alerting**
  - Set up Railway monitoring dashboard
  - Add performance monitoring
  - Create runbook for common issues

**Deliverables**:
- Production Railway service deployed ✅ (exists)
- Feature flag for instant rollback ✅
- Updated frontend API configuration ✅
- Migration runbook documentation (pending)
- Updated architecture documentation (pending)

**Success Criteria**:
- [ ] 100% traffic on Railway (Edge Functions as backup)
- [ ] Analysis success rate >95%
- [ ] Error rate <1%
- [ ] Zero data loss during migration

**Risk Mitigation**:
- Feature flag allows instant rollback to Edge Functions
- Keep Edge Functions deployable for 30 days post-migration
- Railway staging validated - production uses same code

---

### Phase 6: LLMs.txt Migration & Cleanup
**Target Duration**: 0.5 weeks
**Status**: [ ] Not Started

**Objective**: Migrate generate-llmstxt to Railway and clean up.

#### Tasks

- [ ] **6.1 Port generate-llmstxt to Railway**
  - Create `/api/generate-llmstxt` endpoint
  - Port LLMtxtMastery API integration
  - Maintain tier restrictions (Growth: 25/mo, Scale: unlimited)
  - Update frontend API calls

- [ ] **6.2 Final Documentation**
  - Update architecture.md to v3.0
  - Create ADR-016 for Railway migration
  - Update CLAUDE.md with new backend structure
  - Archive Edge Function documentation

- [ ] **6.3 Cleanup**
  - Remove unused Edge Function code (after 30-day grace period)
  - Clean up environment variables
  - Update CI/CD documentation
  - Close related GitHub issues

**Deliverables**:
- LLMs.txt generation working on Railway
- Updated architecture documentation (v3.0)
- ADR-016: Railway Backend Migration
- Clean repository with archived Edge Functions

**Success Criteria**:
- [ ] LLMs.txt generation works identically on Railway
- [ ] Documentation fully updated
- [ ] No orphaned code or configuration
- [ ] Clean audit of environment variables

---

### Technical Requirements

**Railway Configuration**:
- Node.js 20.x LTS
- TypeScript 5.x
- Express 4.x
- Puppeteer (latest stable)
- Memory: 512MB minimum, 2GB recommended for Puppeteer
- Auto-sleep: Disabled for production

**Dependencies (New)**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.38.0",
    "puppeteer": "^21.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.15",
    "tsx": "^4.0.0"
  }
}
```

**Environment Variables (Railway)**:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=service_role_key
SUPABASE_ANON_KEY=anon_key
LLMTXT_MASTERY_API_KEY=api_key
PORT=3000
NODE_ENV=production|staging
ALLOWED_ORIGINS=https://aimpactscanner.com,https://develop--aimpactscanner.netlify.app
```

### Tier Restrictions

No tier restriction changes. All existing tier limits maintained:

| Feature | Free | Solo | Growth | Scale |
|---------|------|------|--------|-------|
| Analyses/month | 5 lifetime | 10 | 40 | 100 |
| LLMs.txt/month | 0 | 0 | 25 | Unlimited |
| CSR Analysis | ❌ | ✅ | ✅ | ✅ |

**New**: CSR (Puppeteer) analysis requires paid tier (Solo+).

### Success Criteria (Sprint Level)

- [ ] Railway backend deployed to production
- [ ] All 27 factors working on Railway
- [ ] CSR websites analyze correctly (React, Vue, Angular SPAs)
- [ ] Analysis time <90 seconds for CSR, <30 seconds for SSR
- [ ] Job queue handles concurrent requests
- [ ] Edge Functions deprecated (kept as archive)
- [ ] Zero data loss or service interruption during migration
- [ ] Architecture documentation updated to v3.0

### Risk Mitigation (Sprint Level)

1. **Service Continuity**: Run Railway parallel to Edge Functions until validated
2. **Rollback Ready**: Keep Edge Functions deployable for 30 days post-migration
3. **Gradual Migration**: Traffic split (10% → 50% → 100%) with monitoring
4. **Database Safety**: Never point staging Railway at production Supabase
5. **Cost Monitoring**: Track Railway usage and Puppeteer resource consumption
6. **Performance Baseline**: Compare response times before/after migration

### Dependencies & Blockers

**Dependencies**:
- Railway account with appropriate plan (Starter or higher)
- LLMtxtMastery API key (already have)
- Supabase service role keys for both environments

**Potential Blockers**:
- Railway Puppeteer support (verify during Phase 1)
- CORS configuration for Netlify → Railway
- Supabase connection limits with persistent server

---

## Sprint 7: Tier Factor Messaging Clarity

**Status**: ✅ COMPLETE
**Priority**: P1 HIGH - Conversion Accuracy & FOMO Optimization
**Started**: December 15, 2025
**Completed**: December 15, 2025

### Sprint Overview

Update signup and pricing page messaging to accurately reflect tier-based factor differences. Free tier gets 19 AI factors (no SEO), Solo+ gets all 27 factors including SEO visibility. Creates FOMO by making Free users aware of what they're missing.

**Key Insight**: Free tier was incorrectly claiming "27-factor scan" when it only provides 19 factors. The 8 Traditional SEO factors (mobile-friendly, page speed, broken links, sitemap, canonical tags, internal linking, duplicate versions, robots.txt) are gated behind paid tiers.

### Changes Made

#### Signup Page (TierMessagingSection.jsx)

**Free Tier OB Box**:
- [x] Changed "27-factor scan across 9 AI visibility pillars" → "19-factor AI visibility scan"

**Free Tier FOMO Box**:
- [x] Updated message to: "Free scans 19 AI factors - but skips the 8 SEO factors blocking Google (and the AIs scraping it) from finding you. Fix something? That's scan 2. Verify it worked? Scan 3. You're done. Solo unlocks all 27 factors plus 10 scans to actually move forward."

**Solo Tier OB Box**:
- [x] Changed first bullet from "Scan → Fix → Verify → Move to next page" to "All 27 factors including SEO visibility"
- [x] Removed "Keep your results for 30 days" (covered in What You Get section)

#### Pricing Page (PricingTiers.jsx)

**Free Tier Features**:
- [x] Changed "See your actual AI readiness score" → "See your AI readiness score (SEO not included)"
- [x] Changed "3 analyses per month to track progress" → "3 analyses per month to try it out"

**Solo Tier Features**:
- [x] Added "✨ All 27 factors including SEO visibility" as first feature
- [x] Removed "Educational content" (weak value prop)

### Files Modified

| File | Changes |
|------|---------|
| `src/components/DynamicTierSelector/TierMessagingSection.jsx` | Free OB bullets, Free FOMO message, Solo OB bullets |
| `src/components/PricingTiers.jsx` | Free features, Solo features |

### Success Criteria

- [x] Free tier accurately shows 19 factors (not 27)
- [x] FOMO messaging highlights missing SEO factors
- [x] Solo tier emphasizes "All 27 factors including SEO"
- [x] Pricing page creates clear tier differentiation
- [x] No broken functionality

---

## Next Mission Planning

**Sprint 6 Status**: Phases 1-4 COMPLETE, Phase 5 READY, Phase 6 pending

**Immediate Next Steps**:
1. **Phase 5: Enable Railway on Production** - Flip feature flag, validate, monitor
2. **Phase 6: LLMs.txt Migration** - Port to Railway after Phase 5 stable

**After Sprint 6 Complete**:
1. **Growth Marketing** - Content, SEO, social proof
2. **Feature Development** - AI Remediation Planner, Progress Tracking
3. **Technical Debt** - Code cleanup, performance optimization

*Sprint 6 unlocks CSR website analysis via Puppeteer on Railway backend.*

---

**Document Version**: 7.1 (Sprint 6 Progress Update)
**Last Updated**: December 17, 2025
**Previous Version**: See git history

*Document maintained by THE COORDINATOR (AGENT-11)*
