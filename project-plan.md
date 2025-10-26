# AImpactScanner - Project Plan

## Current Status (October 26, 2025)

**ACTIVE MISSION**: Tier & Pricing Realignment + Conversion Optimization
**Status**: Phase 5 Complete ✅ - Ready for Phase 6 (Doug Hall Messaging)
**Priority**: P1 HIGH - Revenue Impact via Conversion Optimization
**Started**: October 24, 2025
**Design Completed**: October 25, 2025
**Phase 3 Completed**: October 25, 2025
**Phase 4 Completed**: October 26, 2025
**Phase 5 Completed**: October 26, 2025

**CRITICAL TASK - DEV ENVIRONMENT AUDIT**: 🚨 P0 URGENT
- [ ] Audit all .env files (.env.local, .env, .env.example)
- [ ] Verify local dev uses STAGING database (isgzvwpjokcmtizstwru)
- [ ] Verify staging deploy uses STAGING database
- [ ] Verify production uses PRODUCTION database (pdmtvkcxnqysujnpcnyh)
- [ ] Document environment setup in CLAUDE.md
- [ ] Create checklist to verify before any testing
- [ ] **NEVER test OAuth/Stripe on production again**
**Reason**: Accidentally tested Phase 5 trial integration on production database

**Current Objective**: Implement dynamic Doug Hall messaging (OB/RRB/DD) that updates on tier/billing changes

**Implementation Approach**: 8 phased milestones with Playwright test gates between each phase

**Mission Type**: CONVERSION OPTIMIZATION (not just technical realignment)
**Key Innovation**: Dynamic persuasive copy + Annual pricing anchoring effect

**Mission Phases**:

### Phase 1: Strategic Analysis ✅ COMPLETE
- [x] Strategist: Analyze current tier structure vs PRD requirements
- [x] Strategist: Extract Doug Hall messaging (OB/RRB/DD) from PRD
- [x] Coordinator: Correct mission scope (7-Day Trial = Growth promotion, not separate tier)
- [x] Strategist: Review annual pricing strategy document

### Phase 2: Conversion UX Design ✅ COMPLETE
- [x] Designer: Create dynamic tier selector specification
- [x] Designer: Design real-time value prop updates (as user toggles tiers)
- [x] Designer: Create "missing out" messaging for lower tier selections
- [x] Designer: Specify visual hierarchy (Growth as primary/default)
- [x] Designer: Integrate annual pricing with billing frequency toggle
- [x] Designer: Create complete copy matrix (4 tiers × 2 billing frequencies)
- [x] Designer: Update visual mockups with annual pricing states

### Phase 3: Stripe Product Setup ✅ COMPLETE
**Objective**: Set up annual pricing products and trial configuration in Stripe
**Environment**: Stripe Dashboard (both test and live modes)
**Duration**: 1-2 days
**Completed**: October 25, 2025

**Tasks**:
- [x] Create annual pricing products in Stripe:
  - [x] Solo Annual: $49.50/year ($4.13/mo equivalent)
  - [x] Growth Annual: $149.50/year ($12.46/mo equivalent)
  - [x] Scale Annual: $299.50/year ($24.96/mo equivalent)
- [x] Update existing monthly products with new prices:
  - [x] Coffee → Solo Monthly: $4.95 → $5.95/month
  - [x] Growth Monthly: $14.95 → $17.95/month
  - [x] Scale Monthly: $29.95 → $34.95/month
- [x] Configure trial settings:
  - [x] Growth tier: 7-day trial, card required upfront
  - [x] Trial period: 7 days, then auto-converts to selected billing
  - [x] Test trial checkout in Stripe test mode

**Test Gate 1**: Automated Product Verification ✅ PASSED
```bash
# Verification script results:
✅ TEST MODE:  6/6 products passed
✅ LIVE MODE:  6/6 products passed
✅ TOTAL:      12/12 products verified
✅ All pricing correct ($5.95, $49.50, $17.95, $149.50, $34.95, $299.50)
✅ All metadata correct (tier=coffee/growth/scale, billing=annual)
✅ Growth Annual trial configured (7 days)
```

**Success Criteria**: ✅ ALL MET
- ✅ All 6 products created and configured in Stripe (test + live)
- ✅ Automated verification passed (12/12 products)
- ✅ Trial configuration verified (7 days, card required)
- ✅ Pricing verified correctly in Stripe API

**Deliverables**:
- `STRIPE-PRICE-IDS.md` - Test mode Price IDs
- `STRIPE-PRICE-IDS-LIVE.md` - Live mode Price IDs
- `STRIPE-ENV-VARS.txt` - Test mode environment variables
- `STRIPE-ENV-VARS-LIVE.txt` - Live mode environment variables
- `ENV-SETUP-CHECKLIST.md` - Setup guide
- `verify-stripe-products.cjs` - Automated verification script

---

### Phase 4: Tier Selector Component (Basic) ✅ COMPLETE
**Objective**: Build core tier selector with billing toggle (no Doug Hall messaging yet)
**Environment**: Local dev (http://localhost:5173) using staging database
**Duration**: 2-3 days
**Completed**: October 26, 2025

**Tasks**:
- [x] Create component structure:
  - [x] `DynamicTierSelector.jsx` - Main container
  - [x] `BillingToggle.jsx` - Annual/Monthly toggle
  - [x] `TierOptionsList.jsx` - Tier radio buttons
  - [x] `useBillingPricing.js` - Pricing hook
- [x] Implement basic functionality:
  - [x] Billing toggle (annual default, switches to monthly)
  - [x] Tier selection (Growth default, Free/Solo/Growth/Scale options)
  - [x] "coffee" → "Solo" display mapping (internal ID stays "coffee")
  - [x] Pricing display updates on billing toggle (500ms transition)
- [x] State management:
  - [x] `billingFrequency` state (default: 'annual')
  - [x] `selectedTier` state (default: 'growth')
  - [x] Save to authContext for OAuth flow

**Test Gate 2**: Playwright E2E Tests (Local Dev) ✅ PASSED
```bash
# Ran tests on http://localhost:5173
npx playwright test tests/e2e/tier-selector-basic.spec.js --headed

# Test Results:
✅ 1. Default state: Growth tier + Annual billing selected
✅ 2. Toggle to monthly: Pricing updates (Growth $17.95 → $12.46)
✅ 3. Select Solo tier: Display shows "Solo" (internal still "coffee")
✅ 4. Select Free tier: Works correctly
✅ 5. Select Scale tier: Works correctly
✅ 6. authContext stores: selectedTier + billingFrequency
```

**Success Criteria**: ✅ ALL MET
- ✅ All Playwright tests pass (6/6)
- ✅ Default state correct (Growth + Annual)
- ✅ Billing toggle works with smooth transitions
- ✅ "coffee" → "Solo" mapping works
- ✅ authContext saves tier + billing frequency

**Deliverables**:
- Core tier selector component with billing toggle
- State management for tier and billing frequency
- Component tested and working in local dev

---

### Phase 5: 7-Day Trial Integration ✅ COMPLETE
**Objective**: Add trial option to Growth tier with Stripe integration
**Environment**: Local dev using staging database + Stripe test mode
**Duration**: 2-3 days
**Completed**: October 26, 2025

**Tasks**:
- [x] Add trial UI components:
  - [x] Trial badge on Growth tier card ("🎁 7-DAY FREE TRIAL")
  - [x] Trial CTA button (primary: "Try Growth Free for 7 Days")
  - [x] Secondary CTA (skip trial option)
  - [x] Trial details expandable section
- [x] Integrate with Stripe:
  - [x] Create trial checkout session (trial_period_days: 7)
  - [x] Pass billing frequency to Stripe (annual or monthly)
  - [x] Handle trial vs paid checkout differently
- [x] OAuth flow updates:
  - [x] Pass `isTrial: true` flag in authContext
  - [x] Trial converts to selected billing frequency
  - [x] Update Supabase Edge Function for trial checkout

**Test Gate 3**: Trial Flow E2E Tests
```bash
npx playwright test tests/e2e/trial-flow.spec.js --headed

# Tests:
1. Trial badge visible on Growth tier
2. Click "Try Growth Free for 7 Days" → Redirects to Stripe
3. Stripe checkout shows: $0 for 7 days, then billing
4. Complete trial signup → Redirects to dashboard with trial=active
5. authContext contains: {tier: 'growth', isTrial: true, billingFrequency: 'annual'}
6. Trial countdown visible in dashboard
```

**Success Criteria**:
- ✅ All trial tests pass (6/6)
- ✅ Trial checkout redirects to Stripe correctly
- ✅ Trial converts to selected billing frequency
- ✅ OAuth callback handles trial flag
- ✅ Dashboard shows trial status

---

### Phase 6: Doug Hall Messaging (Dynamic Copy) [ ]
**Objective**: Implement dynamic persuasive messaging that updates on tier/billing changes
**Environment**: Local dev using staging database
**Duration**: 2-3 days

**Tasks**:
- [ ] Create messaging components:
  - [ ] `DynamicMessagingPanel.jsx` - Right panel with OB/RRB/DD
  - [ ] `TierMessagingContent.jsx` - Individual tier copy renderer
  - [ ] `ValidationMessages.jsx` - Success/warning messages
  - [ ] `BillingWarningBox.jsx` - Monthly→Annual savings prompt
- [ ] Implement copy matrix:
  - [ ] 4 tiers × 2 billing frequencies = 8 copy variations
  - [ ] Overt Benefit headlines
  - [ ] Real Reasons to Believe bullets
  - [ ] Dramatic Difference comparisons
  - [ ] Loss aversion messaging (Free tier)
  - [ ] Validation messaging (Growth tier)
- [ ] Add transitions:
  - [ ] 200ms exit animation (fade out)
  - [ ] 300ms enter animation (fade in)
  - [ ] Cross-fade between tier selections

**Test Gate 4**: Dynamic Messaging E2E Tests
```bash
npx playwright test tests/e2e/dynamic-messaging.spec.js --headed

# Tests:
1. Growth tier selected → Shows validation: "YOU MADE THE RIGHT CHOICE"
2. Toggle to Free tier → Shows loss aversion: "WHAT YOU'RE MISSING"
3. Toggle to Solo tier → Shows upgrade nudge: "Growth is only $12 more"
4. Toggle billing Annual→Monthly → Copy updates with savings warning
5. Toggle billing Monthly→Annual → Copy updates with savings celebration
6. Messaging transitions smooth (no janky content jumps)
```

**Success Criteria**:
- ✅ All messaging tests pass (6/6)
- ✅ Copy updates correctly for all tier + billing combinations
- ✅ Transitions smooth (200ms/300ms timing)
- ✅ Loss aversion messaging shows for Free tier
- ✅ Validation messaging shows for Growth tier

---

### Phase 7: Mobile Responsive + Polish [ ]
**Objective**: Optimize for mobile devices and add final polish
**Environment**: Local dev (test on multiple viewports)
**Duration**: 1-2 days

**Tasks**:
- [ ] Mobile responsive design:
  - [ ] Dropdown selector for mobile (375px-767px)
  - [ ] Sticky billing toggle on mobile
  - [ ] Condensed copy for mobile (30% reduction)
  - [ ] Touch-optimized buttons (min 48px)
- [ ] Visual polish:
  - [ ] Color system (gold/green/blue/red/purple)
  - [ ] Badges (RECOMMENDED, 7-DAY TRIAL, POWER USERS)
  - [ ] Savings badges (green, prominent)
  - [ ] Animations GPU-accelerated
- [ ] Accessibility:
  - [ ] ARIA labels for screen readers
  - [ ] Keyboard navigation (Tab, Space, Enter, Arrows)
  - [ ] Focus management
  - [ ] Color contrast 4.5:1 minimum

**Test Gate 5**: Responsive + A11y Tests
```bash
# Desktop tests
npx playwright test tests/e2e/tier-selector-desktop.spec.js --headed

# Mobile tests (iPhone viewport)
npx playwright test tests/e2e/tier-selector-mobile.spec.js --headed --device="iPhone 13"

# Accessibility tests
npx playwright test tests/e2e/tier-selector-a11y.spec.js --headed

# Tests:
1. Desktop: Side-by-side layout works (1024px+)
2. Mobile: Dropdown selector works (375px)
3. Keyboard navigation works (Tab, Enter, Space)
4. Screen reader announcements work
5. Color contrast passes WCAG 2.1 AA
6. Touch targets 48px minimum (mobile)
```

**Success Criteria**:
- ✅ All responsive tests pass (desktop + mobile)
- ✅ All accessibility tests pass
- ✅ WCAG 2.1 AA compliant
- ✅ Smooth on both desktop and mobile
- ✅ Visual design matches mockups

---

### Phase 8: Analytics + Feature Gating [ ]
**Objective**: Add analytics tracking and implement feature restrictions per tier
**Environment**: Local dev using staging database
**Duration**: 1-2 days

**Tasks**:
- [ ] Analytics events:
  - [ ] `tier_selector_viewed` - Component loads
  - [ ] `tier_selection_changed` - User changes tier
  - [ ] `billing_toggle_clicked` - User toggles annual/monthly
  - [ ] `tier_cta_clicked` - User clicks CTA (trial or paid)
  - [ ] `trial_details_expanded` - User expands trial details
- [ ] Feature gating:
  - [ ] LLMS.txt: Growth+ only (disabled button for Free/Solo)
  - [ ] CSV export: Growth+ only (PDF-only for Solo)
  - [ ] API access: Scale only
  - [ ] Show feature restrictions in UI
- [ ] Update existing features:
  - [ ] Dashboard shows tier restrictions
  - [ ] Analysis results show export options based on tier

**Test Gate 6**: Analytics + Gating Tests
```bash
npx playwright test tests/e2e/analytics-tracking.spec.js --headed
npx playwright test tests/e2e/feature-gating.spec.js --headed

# Tests:
1. Analytics events fire correctly (6 events)
2. Solo tier: LLMS.txt button disabled with tooltip
3. Solo tier: CSV export unavailable (PDF only)
4. Growth tier: LLMS.txt and CSV available
5. Scale tier: API access available
6. Upgrade prompts show for restricted features
```

**Success Criteria**:
- ✅ All analytics events tracked correctly
- ✅ Feature gating works for all tiers
- ✅ Upgrade prompts show for restricted features
- ✅ No console errors or warnings

---

### Phase 9: Staging Deployment [ ]
**Objective**: Deploy to staging environment for final testing
**Environment**: https://develop--aimpactscanner.netlify.app (staging database)
**Duration**: 1 day

**Tasks**:
- [ ] Deploy to Netlify (develop branch)
- [ ] Run full E2E test suite on staging
- [ ] Test Stripe integration (test mode)
- [ ] Test OAuth flow end-to-end
- [ ] Verify analytics tracking in production
- [ ] Run Lighthouse audit
- [ ] Test on real devices (iOS, Android)

**Test Gate 7**: Staging E2E Full Suite
```bash
# Run full test suite against staging
PLAYWRIGHT_BASE_URL=https://develop--aimpactscanner.netlify.app \
npx playwright test tests/e2e/ --headed

# Tests:
1. All previous test gates (1-6) pass on staging
2. OAuth flow works end-to-end
3. Stripe checkout works (test mode)
4. Analytics events fire correctly
5. No console errors
6. Lighthouse score >90
```

**Success Criteria**:
- ✅ All E2E tests pass on staging
- ✅ OAuth + Stripe integration works
- ✅ Analytics tracking works
- ✅ No performance regressions
- ✅ Lighthouse score >90

---

### Phase 10: Production Deployment [ ]
**Objective**: Deploy to production and monitor conversion metrics
**Environment**: https://aimpactscanner.com (production database)
**Duration**: Ongoing

**Tasks**:
- [ ] Create production Stripe products (same config as test)
- [ ] Update environment variables for production
- [ ] Deploy to production (main branch)
- [ ] Run smoke tests on production
- [ ] Monitor error rates (Sentry)
- [ ] Track conversion metrics:
  - [ ] Signup conversion rate (target: 25-35%)
  - [ ] Annual billing adoption (target: 30-40%)
  - [ ] Trial-to-paid conversion (target: 49-60%)
  - [ ] Growth tier adoption (target: 70%)

**Test Gate 8**: Production Smoke Tests
```bash
# Manual smoke tests on production
1. Visit https://aimpactscanner.com/#signup
2. Verify tier selector loads correctly
3. Test tier selection flow (don't complete signup)
4. Verify Stripe checkout loads (test with staging creds)
5. Monitor Sentry for errors
6. Check analytics dashboard for events
```

**Success Criteria**:
- ✅ Production deployment successful
- ✅ No critical errors in Sentry
- ✅ Conversion tracking working
- ✅ User feedback positive
- ✅ Conversion rate increasing

**Monitoring Period**: 2 weeks
**Success Metrics**:
- Conversion rate: 8-12% → 25-35% (2-3x improvement)
- Annual adoption: 30-40%
- Trial-to-paid: 49-60%
- Growth tier: 70% of paid customers

**Expected Impact**:
- Conversion rate increase: 8-12% → 25-35% (2-3x improvement)
- Growth tier adoption: 70% of paid customers (PRD target)
- Annual billing adoption: 30-40% of paid customers
- Trial-to-paid conversion: 49-60% (PRD target)
- Revenue per user: +11% annual revenue improvement
- Cash flow improvement: +84% in Q1
- Churn reduction: 50% lower on annual plans

**Key Requirements**:
- Default tier: Growth ($17.95/mo or $12.46/mo annual)
- Default billing: Annual (anchoring effect)
- 7-Day Trial: Promotion for Growth tier (40 analyses free for 7 days)
- Dynamic copy: OB/RRB/DD messaging changes as user toggles tiers AND billing
- Visual cues: Show what you're missing with lower tiers and monthly billing
- Annual savings: Prominent green badges ($21.90, $65.90, $119.90)

**Deliverables Created**:
- `/DYNAMIC-TIER-SELECTOR-UX-SPEC.md` (59KB) - Complete UX specification with Section 10: Annual Pricing
- `/TIER-SELECTOR-VISUAL-MOCKUP.md` (37KB+) - Visual mockups including billing toggle states
- `/handoff-notes.md` - Updated with annual pricing requirements and developer handoff

**See**:
- `/docs/Documents/foundations/prds/AImpactScanner Pricing & Value Ladder PRD (1).md` - Source PRD
- `/docs/Documents/foundations/prds/Annual Pricing Strategy Analysis.md` - Annual pricing business case
- `/handoff-notes.md` - Doug Hall messaging + annual pricing details

---

## Recently Completed: Web Infrastructure Files (Oct 24, 2025)

**COMPLETED**: Social Preview Image + security.txt + humans.txt
**Status**: ✅ COMPLETE
**Impact**: Social share CTR expected +150-300%, SEO +15 points

---

## Document History

**Version**: 3.2 (Annual Pricing Design Complete)
**Last Updated**: October 25, 2025
**Previous Version**: Git history

**Changelog**:
- **October 25, 2025**: Design phase complete - annual pricing integration finished
- **October 24, 2025**: Corrected mission scope - conversion optimization, not just technical realignment
- **October 24, 2025**: Extracted Doug Hall messaging from PRD for dynamic tier selector
- **October 24, 2025**: Started Tier & Pricing Realignment Mission

---

*Document maintained by THE COORDINATOR (AGENT-11)*
