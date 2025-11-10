# AImpactScanner Tier Specification

**Product Name:** AImpactScanner
**Document Type:** Tier Feature Specification
**Date:** October 18, 2025
**Version:** 1.0
**Owner:** Product Leadership
**Status:** Draft

---

## Document Purpose

This document defines the complete feature set, access controls, business rules, and technical requirements for all four AImpactScanner pricing tiers: **Starter** (Free), **Solo** ($4.95/month), **Growth** ($14.95/month), and **Scale** ($29.95/month).

**Strategic Context:**
- Primary revenue driver: **Growth tier** (70% of paid customers)
- Customer segment: Solopreneurs and bootstrap founders ($50K-$250K annual revenue)
- Product positioning: Page-level AI search optimization analysis platform
- Differentiation: MASTERY-AI Framework (18 factors across 8 pillars)

**Related Documents:**
- `/documents/foundation/Vision and Mission.md` - Strategic vision and financial projections
- `/documents/foundation/positioning-statement.md` - Market positioning and competitive context
- `/documents/foundation/Client Success Blueprint.md` - Customer profiles and success criteria

---

## Section 1: Tier Overview and Strategic Rationale

### Tier Structure Philosophy

**Design Principles:**
1. **Free Tier Validation** - Starter tier validates framework value before asking for money
2. **Good-Better-Best Ladder** - Clear upgrade path from Solo → Growth → Scale
3. **Growth Tier Optimization** - Features designed to make Growth tier irresistible
4. **No Feature Hostage** - Core analysis quality identical across all tiers (only volume differs)

**Strategic Positioning:**
- **Starter (FREE):** "Try before you buy" - validate MASTERY-AI Framework delivers value
- **Solo ($4.95/month):** "Key pages optimization" - optimize homepage + core landing pages
- **Growth ($14.95/month):** "PRIMARY TIER" - full content portfolio optimization (4-20 strategic pages)
- **Scale ($29.95/month):** "Portfolio management" - manage larger content portfolios with advanced tracking

### Tier Comparison Matrix

| Feature Category | Starter (FREE) | Solo ($4.95) | Growth ($14.95) | Scale ($29.95) |
|-----------------|----------------|--------------|-----------------|----------------|
| **Analysis Volume** | 1/month | 10/month | 40/month | 100/month |
| **MASTERY-AI Framework** | 18 factors | 18 factors | 18 factors | 18 factors |
| **Analysis Speed** | 8-12 seconds | 8-12 seconds | 8-12 seconds | 8-12 seconds |
| **Historical Tracking** | ❌ None | ✅ 30 days | ✅ 90 days | ✅ Unlimited |
| **Comparison Reports** | ❌ | ❌ | ✅ Side-by-side | ✅ Multi-page |
| **Export Formats** | ❌ | PDF only | PDF + CSV | PDF + CSV + API |
| **Priority Support** | ❌ | ❌ | ✅ Email (24hr) | ✅ Email (12hr) |
| **API Access** | ❌ | ❌ | ❌ | ✅ Read-only |
| **Custom Reports** | ❌ | ❌ | ❌ | ✅ Available |

**Phase 2 Features** (Future - AImpact Assistant):
- All tiers: Access to AImpact Assistant (conversational follow-up)
- Growth/Scale: Extended "Investigate" deep-dives with implementation guidance

---

## Section 2: Tier-by-Tier Detailed Specifications

### TIER 1: Starter (FREE)

**Strategic Purpose:** Validate framework value with zero friction, drive conversion to Solo/Growth

**Pricing:**
- Cost: **$0/month**
- Billing: No payment method required
- Commitment: None

**Analysis Quota:**
- **1 analysis per month**
- Resets on monthly anniversary of account creation
- No rollover of unused analyses
- Hard limit enforced (graceful upgrade prompt when exceeded)

**Core Features:**

**✅ MASTERY-AI Framework Analysis (Full Quality)**
- Complete 18-factor evaluation across 8 pillars
- Identical analysis quality to paid tiers
- Same 8-12 second analysis speed
- Same prioritized recommendations
- Same actionable insights

**Included Analysis Components:**
1. **Overall AI-Readiness Score** (0-100)
2. **8 Pillar Scores:**
   - Meaning & Clarity
   - Authority & Trust
   - Substance & Depth
   - Technical Excellence
   - Engagement Hooks
   - Response Optimization
   - Yes-Saying Amplification
   - Insights Generation
3. **18 Factor Detailed Breakdown:**
   - Individual factor scores with explanations
   - Pass/Warning/Fail status indicators
   - Specific improvement recommendations
4. **Prioritized Action List:**
   - Top 3 highest-impact fixes ranked by impact
   - Estimated effort level (Quick/Moderate/Significant)
   - Expected impact (Low/Medium/High)

**❌ Limited Features:**
- **No Historical Tracking** - Analysis results expire after viewing session
- **No Comparison Reports** - Cannot compare multiple analyses
- **No Export** - Cannot download PDF or CSV reports
- **No Support** - Community documentation only
- **No API Access** - Web interface only

**User Experience:**

**Onboarding Flow:**
1. Land on homepage
2. Click "Try Free Analysis" (no signup required initially)
3. Paste URL, click "Analyze"
4. View complete analysis results
5. See upgrade CTA: "Want to track improvements? Upgrade to Solo for $4.95/month"

**Upgrade Triggers:**
- **After First Analysis:** "Save this analysis and track improvements over time - Solo $4.95/month"
- **When Monthly Limit Reached:** "You've used your free analysis. Analyze 10 pages/month with Solo for $4.95"
- **Exit Intent:** "Before you go - save your analysis results with Solo ($4.95/month)"

**Conversion Optimization:**
- Highlight **value received** in free analysis ($50+ value if done manually)
- Show **time saved** (3-5 minutes vs manual ChatGPT analysis)
- Emphasize **next-page optimization** ("Optimize 9 more pages this month with Solo")

**Technical Implementation:**

**Account Requirements:**
- Email address only (no payment method)
- Email verification required to prevent abuse
- IP-based rate limiting (max 2 free accounts per IP per month)

**Quota Enforcement:**
```javascript
// Monthly quota reset logic
if (user.tier === 'starter') {
  const monthsSinceCreation = daysSince(user.created_at) / 30;
  const analysesAllowed = Math.floor(monthsSinceCreation) + 1; // 1 per month
  const analysesUsed = user.analyses.count();

  if (analysesUsed >= analysesAllowed) {
    return showUpgradePrompt('starter-limit-reached');
  }
}
```

**Data Retention:**
- Analysis results stored for **7 days only**
- Deleted automatically after 7 days
- No historical tracking available
- User warned: "Free analysis results expire in 7 days"

---

### TIER 2: Solo ($4.95/month)

**Strategic Purpose:** Entry-tier for solopreneurs optimizing key pages (homepage + core landing pages)

**Pricing:**
- Cost: **$4.95/month**
- Billing: Monthly subscription (Stripe)
- Free trial: **7 days** (includes 3 analyses during trial)
- Commitment: Cancel anytime

**Analysis Quota:**
- **10 analyses per month**
- Resets on monthly billing anniversary
- No rollover of unused analyses
- Soft limit with overage option: $0.50 per additional analysis (max 5 overages)

**Core Features:**

**✅ Everything in Starter, Plus:**

**Historical Tracking (30 Days)**
- All analyses stored for 30 days
- View analysis history in dashboard
- Re-access past analyses
- Automatic deletion after 30 days

**Dashboard Access**
- Simple analysis history table
- Sort by date, score, URL
- Quick re-run analysis on saved URLs
- Basic filtering (by score range, date)

**PDF Export**
- Download individual analysis as branded PDF report
- Includes all analysis components (scores, factors, recommendations)
- Shareable with clients or team members
- Professional formatting with AImpactScanner branding

**Email Support (48-Hour Response)**
- Support via email: support@aimpactscanner.com
- 48-hour response time commitment
- Help with analysis interpretation, technical issues
- Community documentation access

**❌ Not Included:**
- No comparison reports (single analysis view only)
- No CSV export
- No API access
- No priority support

**User Experience:**

**Onboarding Flow:**
1. Sign up with email + password
2. Enter payment method (7-day free trial, no charge until day 8)
3. Welcome tour: "You have 10 analyses per month - optimize your key pages"
4. Suggested first URLs: Homepage, About, Services, Contact, Product pages
5. First analysis: Same experience as Starter + save/track prompt

**Value Messaging:**
- **Headline:** "Optimize Your Key Pages - $4.95/Month"
- **Subheadline:** "10 analyses per month. Track improvements. Export reports."
- **Use Case:** "Perfect for optimizing your homepage and core landing pages"

**Upgrade Triggers (Solo → Growth):**
- **After 8th Analysis:** "Running low on analyses. Growth tier gives you 40/month for just $10 more"
- **When Limit Reached:** "You've used all 10 analyses. Upgrade to Growth for 40/month ($14.95)"
- **Comparison Feature Tease:** "Want to compare your pages side-by-side? Upgrade to Growth"

**Technical Implementation:**

**Quota Enforcement:**
```javascript
// Monthly quota with soft overage limit
if (user.tier === 'solo') {
  const currentPeriodAnalyses = user.analyses.where('created_at >= ?', user.billing_period_start).count();

  if (currentPeriodAnalyses >= 10 && currentPeriodAnalyses < 15) {
    // Soft limit: offer overage at $0.50/analysis
    return showOveragePrompt('solo', 0.50, 15 - currentPeriodAnalyses);
  } else if (currentPeriodAnalyses >= 15) {
    // Hard limit: must upgrade
    return showUpgradePrompt('solo-hard-limit');
  }
}
```

**Data Retention:**
- Analysis results stored for **30 days**
- Deleted automatically after 30 days
- User warned at 25 days: "Analyses from [date] will be deleted in 5 days. Upgrade to Growth for 90-day history"

**Billing:**
- Monthly subscription via Stripe
- Automatic renewal
- Prorated refunds if canceled within 14 days
- Grace period: 3 days past due before service suspension

---

### TIER 3: Growth ($14.95/month) ⭐ PRIMARY TIER

**Strategic Purpose:** Full content portfolio optimization for solopreneurs (4-20 strategic pages) - 70% revenue target

**Pricing:**
- Cost: **$14.95/month**
- Billing: Monthly or Annual ($149/year - save $30)
- Free trial: **14 days** (includes 10 analyses during trial)
- Commitment: Cancel anytime

**Target Customer:**
- Solopreneurs with $50K-$250K annual revenue
- 4-20 strategic pages to optimize (not hundreds)
- Currently using manual ChatGPT analysis
- Budget: $50-$500/month for ALL tools

**Analysis Quota:**
- **40 analyses per month**
- Resets on monthly billing anniversary
- No rollover of unused analyses
- Soft limit with overage option: $0.40 per additional analysis (max 10 overages)

**Core Features:**

**✅ Everything in Solo, Plus:**

**Extended Historical Tracking (90 Days)**
- All analyses stored for 90 days
- View full analysis history in enhanced dashboard
- Track improvements over time
- Automatic deletion after 90 days

**Comparison Reports (Side-by-Side)**
- Compare up to 2 analyses side-by-side
- Visual diff showing score changes across all 18 factors
- Improvement/regression highlighting
- Export comparison as PDF

**CSV Export**
- Download analysis data in CSV format
- Bulk export multiple analyses
- Import into spreadsheet tools (Excel, Google Sheets)
- Custom reporting and analysis

**Priority Email Support (24-Hour Response)**
- Priority support queue
- 24-hour response time commitment
- Dedicated support specialist
- Analysis interpretation guidance

**Advanced Dashboard Features**
- **Trend Visualization:** Line charts showing score improvements over time
- **Portfolio Overview:** Average scores across all analyzed pages
- **Quick Actions:** One-click re-analyze, duplicate, compare
- **Bulk Operations:** Select multiple analyses for export or deletion

**❌ Not Included:**
- No unlimited historical tracking (90-day limit)
- No API access
- No custom reports
- No multi-page comparison (only 2 at a time)

**User Experience:**

**Onboarding Flow:**
1. Sign up with email + password
2. Enter payment method (14-day free trial, no charge until day 15)
3. Welcome tour: "You have 40 analyses per month - optimize your entire content portfolio"
4. Portfolio setup wizard:
   - "How many strategic pages do you have?" (4-10 / 11-20 / 21-40)
   - "What types of pages?" (Homepage, Product, Service, Blog, About, etc.)
   - "Import from sitemap?" (optional)
5. First analysis: Same experience as Solo + comparison feature tour

**Value Messaging:**
- **Headline:** "Optimize Your Entire Portfolio - $14.95/Month"
- **Subheadline:** "40 analyses per month. Compare pages. Track trends. Priority support."
- **Use Case:** "Perfect for solopreneurs managing 4-20 strategic pages"
- **Proof:** "Most popular tier - 70% of customers choose Growth"

**Upgrade Triggers (Growth → Scale):**
- **After 35th Analysis:** "Running low on analyses. Scale tier gives you 100/month for just $15 more"
- **When Limit Reached:** "You've used all 40 analyses. Upgrade to Scale for 100/month ($29.95)"
- **API Feature Tease:** "Need programmatic access? Upgrade to Scale for API access"

**Retention Features (Critical for 70% Retention Target):**

**Monthly Value Reminders:**
- Email at day 15: "You've saved 2+ hours this month vs manual analysis - here's what you've optimized"
- Email at day 25: "5 days left in your billing period - use your remaining analyses"

**Progress Tracking:**
- Dashboard widget: "Your portfolio average score: 78/100 (+12 since last month)"
- Celebration moments: "🎉 Your homepage score improved from 65 to 82!"

**Educational Content:**
- Weekly tip: "Focus on these 3 factors to boost your score by 10+ points"
- Monthly webinar: "Office hours with AImpactScanner team"

**Churn Prevention:**
- Exit survey when canceling: "What would make you stay?"
- Pause option: "Pause for 1 month instead of canceling?"
- Downgrade offer: "Switch to Solo ($4.95) to keep your data?"

**Technical Implementation:**

**Quota Enforcement:**
```javascript
// Monthly quota with soft overage limit
if (user.tier === 'growth') {
  const currentPeriodAnalyses = user.analyses.where('created_at >= ?', user.billing_period_start).count();

  if (currentPeriodAnalyses >= 40 && currentPeriodAnalyses < 50) {
    // Soft limit: offer overage at $0.40/analysis
    return showOveragePrompt('growth', 0.40, 50 - currentPeriodAnalyses);
  } else if (currentPeriodAnalyses >= 50) {
    // Hard limit: must upgrade
    return showUpgradePrompt('growth-hard-limit');
  }
}
```

**Data Retention:**
- Analysis results stored for **90 days**
- Deleted automatically after 90 days
- User warned at 80 days: "Analyses from [date] will be deleted in 10 days. Upgrade to Scale for unlimited history"

**Billing:**
- Monthly subscription via Stripe ($14.95/month)
- Annual option: $149/year (save $30 = 2 months free)
- Automatic renewal
- Prorated refunds if canceled within 14 days
- Grace period: 3 days past due before service suspension

**Success Metrics (Tier 1 - Hedgehog Validation):**
- **Primary:** 12-month retention >70%
- **Secondary:** Activation rate >15%, "Aha moment" >60%, Actionability >70%

---

### TIER 4: Scale ($29.95/month)

**Strategic Purpose:** Advanced portfolio management for power users with larger content portfolios

**Pricing:**
- Cost: **$29.95/month**
- Billing: Monthly or Annual ($299/year - save $60)
- Free trial: **14 days** (includes 20 analyses during trial)
- Commitment: Cancel anytime

**Target Customer:**
- Solopreneurs/founders with 20-50+ pages to manage
- Power users who need API access for automation
- Teams managing multiple client portfolios
- Budget: $500-$2,000/month for tools

**Analysis Quota:**
- **100 analyses per month**
- Resets on monthly billing anniversary
- No rollover of unused analyses
- Overage option: $0.30 per additional analysis (no hard limit)

**Core Features:**

**✅ Everything in Growth, Plus:**

**Unlimited Historical Tracking**
- All analyses stored permanently (no deletion)
- Full historical archive
- Unlimited trend analysis
- Data export at any time

**Multi-Page Comparison (Up to 5 Pages)**
- Compare up to 5 analyses simultaneously
- Visual matrix showing all factor scores
- Identify best/worst performers across portfolio
- Export comparison as PDF or CSV

**Read-Only API Access**
- RESTful API for programmatic access
- Retrieve analysis results via API
- Integrate with custom dashboards
- Webhook notifications for completed analyses
- API documentation and code examples

**Custom Reports**
- Build custom report templates
- Filter and group analyses by tag, category, date
- Scheduled email reports (weekly/monthly)
- White-label PDF reports (remove AImpactScanner branding)

**Priority Support (12-Hour Response)**
- Highest priority support queue
- 12-hour response time commitment
- Dedicated account specialist
- Quarterly strategy calls (30 minutes)

**Advanced Features:**
- **Tagging System:** Organize analyses by project, client, category
- **Team Collaboration:** Share analyses with team members (up to 3 seats)
- **Bulk Re-Analysis:** Re-run multiple analyses with one click
- **Custom Notifications:** Email alerts when scores drop below threshold

**❌ Not Included:**
- No write API access (read-only only)
- No unlimited team seats (3 seat limit)
- No dedicated account manager
- No SLA guarantees

**User Experience:**

**Onboarding Flow:**
1. Sign up with email + password
2. Enter payment method (14-day free trial, no charge until day 15)
3. Welcome tour: "You have 100 analyses per month - manage your entire portfolio at scale"
4. Advanced setup wizard:
   - "Import from sitemap?" (bulk import)
   - "Set up team members?" (invite up to 3 seats)
   - "Configure API access?" (generate API keys)
   - "Create custom tags?" (organize analyses)
5. First analysis: Same experience as Growth + API tour

**Value Messaging:**
- **Headline:** "Scale Your Optimization - $29.95/Month"
- **Subheadline:** "100 analyses per month. API access. Unlimited history. Team collaboration."
- **Use Case:** "Perfect for managing large portfolios or multiple client sites"

**Retention Features:**
- Monthly portfolio health report: "Your 47 pages averaged 81/100 this month (+5 from last month)"
- Quarterly strategy calls with AImpactScanner team
- Early access to new features (Beta program)

**Technical Implementation:**

**Quota Enforcement:**
```javascript
// Monthly quota with unlimited overage
if (user.tier === 'scale') {
  const currentPeriodAnalyses = user.analyses.where('created_at >= ?', user.billing_period_start).count();

  if (currentPeriodAnalyses >= 100) {
    // No hard limit, just charge overage
    return showOverageNotice('scale', 0.30, currentPeriodAnalyses - 100);
  }
}
```

**Data Retention:**
- Analysis results stored **permanently**
- No automatic deletion
- User can manually delete if desired
- Full export available at any time

**API Implementation:**
- RESTful API with JSON responses
- Rate limiting: 100 requests/hour
- Authentication: API key + secret
- Endpoints:
  - `GET /api/v1/analyses` - List all analyses
  - `GET /api/v1/analyses/:id` - Get analysis details
  - `GET /api/v1/analyses/:id/export` - Export analysis (PDF/CSV)
  - `POST /api/v1/webhooks` - Register webhook for analysis completion

**Billing:**
- Monthly subscription via Stripe ($29.95/month)
- Annual option: $299/year (save $60 = 2 months free)
- Overage charges billed at end of period
- Automatic renewal
- Prorated refunds if canceled within 14 days
- Grace period: 3 days past due before service suspension

---

## Section 3: Cross-Tier Business Rules

### Upgrade and Downgrade Logic

**Upgrade Path (Immediate Effect):**
- User upgrades mid-month from Solo → Growth
- **Quota:** Immediately receives full Growth quota (40 analyses)
- **Billing:** Prorated charge for remaining days in period
- **Data:** Solo historical data (30 days) preserved and extended to Growth retention (90 days)
- **Features:** All Growth features activated immediately

**Example:**
- User on Solo ($4.95/month), 15 days into billing period
- Upgrades to Growth ($14.95/month)
- Charge: $14.95 - ($4.95 × 15/30) = $12.48 prorated
- New period start: Immediate (resets on same day next month)
- Quota: 40 analyses available immediately (used: 6/10 Solo → 6/40 Growth)

**Downgrade Path (End of Period Effect):**
- User downgrades mid-month from Growth → Solo
- **Quota:** Continues with Growth quota until period ends
- **Billing:** Solo rate ($4.95) applies starting next period
- **Data:** Growth historical data (90 days) truncated to Solo retention (30 days) at period end
- **Features:** Growth features remain active until period ends

**Example:**
- User on Growth ($14.95/month), 20 days into billing period
- Downgrades to Solo ($4.95/month)
- Effect: Continues Growth benefits for 10 more days
- Period end: Data older than 30 days deleted, features downgraded to Solo
- Next charge: $4.95 (Solo rate)

**Cancellation (Immediate Effect):**
- User cancels subscription
- **Access:** Continues until period end
- **Data:** Deleted 30 days after period end
- **Reactivation:** Can reactivate within 30 days to restore data

### Trial Period Rules

**Trial Eligibility:**
- One trial per email address
- One trial per payment method (credit card)
- IP-based fraud detection (max 3 trials per IP)

**Trial Experience:**
- **Starter:** No trial (always free)
- **Solo:** 7-day trial, 3 analyses included
- **Growth:** 14-day trial, 10 analyses included
- **Scale:** 14-day trial, 20 analyses included

**Trial Conversion:**
- No charge until trial period ends
- Automatic conversion to paid on trial end date
- Email reminders at day 3, day 1, and trial end
- Cancel anytime during trial with no charge

**Trial Cancellation:**
- User can cancel during trial
- Access continues until trial end date
- Data deleted 7 days after trial end
- Can start new paid subscription later (no trial)

### Overage Rules

**Overage Availability:**
- **Starter:** No overage (hard limit at 1/month)
- **Solo:** Soft limit at 10, hard limit at 15 (max 5 overages @ $0.50 each)
- **Growth:** Soft limit at 40, hard limit at 50 (max 10 overages @ $0.40 each)
- **Scale:** Soft limit at 100, no hard limit (unlimited overages @ $0.30 each)

**Overage Billing:**
- Charged at end of billing period
- Itemized on invoice: "5 overage analyses @ $0.50 = $2.50"
- No prorated refunds for overages

**Overage UX:**
- Warning at 80% quota: "You've used 8/10 analyses. 2 remaining this month."
- Overage prompt at quota: "You've used all 10 analyses. Continue with overage ($0.50/analysis) or upgrade to Growth?"
- User confirms overage: "I understand I'll be charged $0.50 for this analysis"

### Data Retention and Deletion

**Retention Periods:**
- **Starter:** 7 days (expires after viewing session)
- **Solo:** 30 days
- **Growth:** 90 days
- **Scale:** Unlimited (permanent)

**Deletion Warnings:**
- Email at 80% of retention period: "Analyses from [date] will be deleted in [X] days"
- Dashboard banner: "25 analyses will be deleted in 5 days. Upgrade to extend retention."

**Manual Deletion:**
- Users can manually delete analyses at any time
- Confirmation required: "Are you sure? This cannot be undone."
- Bulk deletion available for Growth/Scale tiers

**Account Deletion:**
- User can delete account at any time
- All data permanently deleted within 30 days
- Email confirmation required
- No data recovery after deletion

### Feature Access Matrix

| Feature | Starter | Solo | Growth | Scale |
|---------|---------|------|--------|-------|
| **Core Analysis** |
| MASTERY-AI Framework (18 factors) | ✅ | ✅ | ✅ | ✅ |
| 8-12 second analysis speed | ✅ | ✅ | ✅ | ✅ |
| Prioritized recommendations | ✅ | ✅ | ✅ | ✅ |
| **Data & History** |
| Analysis storage | 7 days | 30 days | 90 days | Unlimited |
| Historical tracking | ❌ | ✅ | ✅ | ✅ |
| Trend visualization | ❌ | ❌ | ✅ | ✅ |
| **Comparison & Export** |
| Comparison reports | ❌ | ❌ | 2 pages | 5 pages |
| PDF export | ❌ | ✅ | ✅ | ✅ |
| CSV export | ❌ | ❌ | ✅ | ✅ |
| Custom reports | ❌ | ❌ | ❌ | ✅ |
| White-label reports | ❌ | ❌ | ❌ | ✅ |
| **Collaboration** |
| Team seats | ❌ | ❌ | ❌ | 3 seats |
| Shared analyses | ❌ | ❌ | ❌ | ✅ |
| **Automation** |
| API access (read-only) | ❌ | ❌ | ❌ | ✅ |
| Webhook notifications | ❌ | ❌ | ❌ | ✅ |
| Bulk re-analysis | ❌ | ❌ | ❌ | ✅ |
| **Support** |
| Documentation | ✅ | ✅ | ✅ | ✅ |
| Email support | ❌ | 48hr | 24hr | 12hr |
| Strategy calls | ❌ | ❌ | ❌ | Quarterly |

---

## Section 4: Technical Implementation Requirements

### Authentication and Account Management

**Account Creation:**
- Email + password (minimum 8 characters)
- Email verification required (link expires in 24 hours)
- Social login: Google, GitHub (optional)
- No phone number required

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- No special characters required (optional)
- Password strength indicator shown during signup

**Session Management:**
- Session timeout: 7 days (remember me) or 24 hours (default)
- Automatic logout on password change
- Concurrent session limit: 3 devices

**Account Security:**
- Password reset via email (link expires in 1 hour)
- Email change requires verification of both old and new email
- Account deletion requires password confirmation

### Billing and Payment Processing

**Payment Gateway:**
- Primary: Stripe
- Accepted methods: Credit card (Visa, Mastercard, Amex, Discover)
- No PayPal (keep it simple)

**Subscription Management:**
- Automatic renewal on billing anniversary
- Prorated upgrades (charge difference immediately)
- End-of-period downgrades (no immediate charge)
- Grace period: 3 days past due before suspension

**Invoicing:**
- Automatic invoice generation via Stripe
- Email invoice on each charge
- Invoice includes: Plan, period, overage charges (if any)
- PDF invoice downloadable from account settings

**Refund Policy:**
- Full refund within 14 days of charge (no questions asked)
- Prorated refunds not available after 14 days
- Overage charges non-refundable
- Refund processed within 5-7 business days

**Failed Payment Handling:**
1. Day 0: Payment fails, retry in 3 days
2. Day 3: Retry fails, email user with update payment link
3. Day 5: Final retry fails, suspend account (read-only access)
4. Day 10: Delete account if payment not updated

### Quota Management System

**Quota Tracking:**
- Real-time quota tracking per user
- Quota resets on billing anniversary (not calendar month)
- Usage dashboard: "You've used 12/40 analyses (30%) - 28 remaining"

**Quota Reset Logic:**
```javascript
// Reset quota on billing anniversary
function resetQuotaIfNeeded(user) {
  const today = new Date();
  const billingDay = user.billing_period_start.getDate();
  const currentDay = today.getDate();

  if (currentDay === billingDay) {
    user.analyses_used_this_period = 0;
    user.billing_period_start = today;
    user.save();
  }
}
```

**Quota Enforcement:**
```javascript
// Check quota before allowing analysis
function canAnalyze(user) {
  const quota = TIER_QUOTAS[user.tier]; // {starter: 1, solo: 10, growth: 40, scale: 100}
  const used = user.analyses_used_this_period;

  if (used < quota) {
    return { allowed: true };
  }

  // Check overage rules
  if (user.tier === 'starter') {
    return { allowed: false, reason: 'quota_exceeded', upgrade_prompt: true };
  }

  const overageLimit = OVERAGE_LIMITS[user.tier]; // {solo: 5, growth: 10, scale: Infinity}
  const overageUsed = used - quota;

  if (overageUsed < overageLimit) {
    const overagePrice = OVERAGE_PRICES[user.tier]; // {solo: 0.50, growth: 0.40, scale: 0.30}
    return { allowed: true, overage: true, price: overagePrice };
  }

  return { allowed: false, reason: 'hard_limit_reached', upgrade_prompt: true };
}
```

### Analysis Processing Pipeline

**Analysis Request Flow:**
1. User submits URL
2. Validate URL format and accessibility
3. Check user quota
4. Queue analysis job (background processing)
5. Fetch page content
6. Run MASTERY-AI Framework analysis (18 factors)
7. Generate scores and recommendations
8. Store results in database
9. Notify user (real-time UI update + optional email)

**Processing Infrastructure:**
- Job queue: Redis + Bull (background job processing)
- Analysis engine: Node.js microservice
- AI/ML: OpenAI API for content analysis
- Timeout: 30 seconds max per analysis
- Retry: 2 retries on failure, then report error

**Error Handling:**
- **URL not accessible:** "We couldn't access this URL. Please check the URL and try again."
- **Timeout:** "Analysis took too long. Please try again or contact support."
- **Rate limit hit:** "We're experiencing high demand. Your analysis will complete in 2-3 minutes."
- **Unknown error:** "Something went wrong. We've been notified and will investigate."

### Data Storage and Retention

**Database Schema (Simplified):**

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier VARCHAR(20) DEFAULT 'starter', -- starter, solo, growth, scale
  billing_period_start TIMESTAMP,
  analyses_used_this_period INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyses table
CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  url VARCHAR(2048) NOT NULL,
  overall_score INTEGER, -- 0-100
  pillar_scores JSONB, -- {meaning: 75, authority: 82, ...}
  factor_scores JSONB, -- {clear_purpose: 80, value_proposition: 75, ...}
  recommendations TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP -- Calculated based on tier retention
);

-- Overage tracking table
CREATE TABLE overages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  billing_period_start TIMESTAMP,
  overage_count INTEGER,
  overage_price DECIMAL(10,2),
  total_charge DECIMAL(10,2),
  charged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Retention Enforcement (Cron Job):**
```javascript
// Run daily at 2am
async function deleteExpiredAnalyses() {
  const now = new Date();

  // Delete analyses past their tier retention period
  await db.query(`
    DELETE FROM analyses
    WHERE expires_at < $1
  `, [now]);

  console.log(`Deleted expired analyses at ${now}`);
}
```

**Expiration Calculation:**
```javascript
// Set expiration when analysis is created
function setExpiration(analysis, user) {
  const retentionDays = RETENTION_DAYS[user.tier]; // {starter: 7, solo: 30, growth: 90, scale: null}

  if (retentionDays === null) {
    analysis.expires_at = null; // Unlimited (Scale tier)
  } else {
    analysis.expires_at = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  }

  analysis.save();
}
```

### API Implementation (Scale Tier Only)

**API Endpoint Specifications:**

**Authentication:**
- API Key + Secret (generated in account settings)
- Header: `Authorization: Bearer {api_key}:{api_secret}`
- Rate limiting: 100 requests/hour

**Endpoints:**

**1. List Analyses**
```
GET /api/v1/analyses
Query params:
  - page (default: 1)
  - per_page (default: 20, max: 100)
  - sort (created_at, score)
  - order (asc, desc)
  - filter[url] (optional: filter by URL)
  - filter[score_min] (optional: minimum score)
  - filter[score_max] (optional: maximum score)

Response:
{
  "data": [
    {
      "id": 12345,
      "url": "https://example.com",
      "overall_score": 78,
      "created_at": "2025-10-18T10:30:00Z",
      "status": "completed"
    },
    ...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 147
  }
}
```

**2. Get Analysis Details**
```
GET /api/v1/analyses/:id

Response:
{
  "id": 12345,
  "url": "https://example.com",
  "overall_score": 78,
  "pillar_scores": {
    "meaning": 82,
    "authority": 75,
    "substance": 80,
    "technical": 85,
    "engagement": 70,
    "response": 78,
    "yes_saying": 72,
    "insights": 76
  },
  "factor_scores": {
    "clear_purpose": 85,
    "value_proposition": 80,
    ...
  },
  "recommendations": [
    {
      "factor": "clear_purpose",
      "current_score": 85,
      "recommendation": "Add a clear value proposition above the fold",
      "impact": "high",
      "effort": "moderate"
    },
    ...
  ],
  "created_at": "2025-10-18T10:30:00Z",
  "completed_at": "2025-10-18T10:30:12Z"
}
```

**3. Export Analysis**
```
GET /api/v1/analyses/:id/export
Query params:
  - format (pdf, csv)

Response:
{
  "download_url": "https://s3.amazonaws.com/aimpactscanner/exports/12345.pdf",
  "expires_at": "2025-10-18T11:30:00Z"
}
```

**4. Webhook Registration**
```
POST /api/v1/webhooks
Body:
{
  "url": "https://your-server.com/webhook",
  "events": ["analysis.completed", "analysis.failed"]
}

Response:
{
  "id": 789,
  "url": "https://your-server.com/webhook",
  "events": ["analysis.completed", "analysis.failed"],
  "secret": "whsec_abc123..." // Use to verify webhook signatures
}
```

**Webhook Payload Example:**
```json
{
  "event": "analysis.completed",
  "timestamp": "2025-10-18T10:30:12Z",
  "data": {
    "analysis_id": 12345,
    "url": "https://example.com",
    "overall_score": 78,
    "completed_at": "2025-10-18T10:30:12Z"
  }
}
```

### Dashboard and Reporting

**Dashboard Components:**

**1. Usage Overview (All Tiers)**
- Quota usage: "12/40 analyses used (30%)"
- Days remaining in period: "18 days until quota resets"
- Recent analyses: Last 5 analyses with scores

**2. Analysis History (Solo+)**
- Table view: URL, Score, Date, Actions (View, Re-run, Delete)
- Sorting: By score, date
- Filtering: By score range, date range
- Pagination: 20 per page

**3. Trend Visualization (Growth+)**
- Line chart: Average score over time (last 90 days)
- Sparklines: Individual page score trends
- Portfolio health: "Your average score is 78/100 (+5 from last month)"

**4. Comparison Reports (Growth+)**
- Side-by-side comparison UI
- Select up to 2 pages (Growth) or 5 pages (Scale)
- Visual diff showing score changes
- Export as PDF

**5. Custom Reports (Scale Only)**
- Report builder: Select pages, date range, metrics
- Save report templates
- Schedule email delivery (weekly/monthly)
- White-label option (remove AImpactScanner branding)

---

## Section 5: Marketing and Conversion Optimization

### Tier Positioning and Messaging

**Starter (FREE):**
- **Positioning:** "Try before you buy"
- **Primary CTA:** "Get Your Free Analysis"
- **Secondary CTA:** "No credit card required"
- **Value Prop:** "See how AI-ready your content is in under 15 seconds"

**Solo ($4.95/month):**
- **Positioning:** "Optimize your key pages"
- **Primary CTA:** "Start 7-Day Free Trial"
- **Secondary CTA:** "Only $4.95/month - cancel anytime"
- **Value Prop:** "Track improvements on 10 pages per month"
- **Use Case:** "Perfect for optimizing your homepage and core landing pages"

**Growth ($14.95/month) ⭐ PRIMARY TIER:**
- **Positioning:** "Most Popular - Full portfolio optimization"
- **Primary CTA:** "Start 14-Day Free Trial"
- **Secondary CTA:** "$14.95/month - 40 analyses + comparisons"
- **Value Prop:** "Everything solopreneurs need to optimize their entire content portfolio"
- **Use Case:** "70% of customers choose Growth - optimize 4-20 strategic pages"
- **Social Proof:** "Most popular tier"

**Scale ($29.95/month):**
- **Positioning:** "Advanced portfolio management"
- **Primary CTA:** "Start 14-Day Free Trial"
- **Secondary CTA:** "$29.95/month - 100 analyses + API access"
- **Value Prop:** "API access, unlimited history, team collaboration"
- **Use Case:** "For power users managing 20-50+ pages or multiple client sites"

### Upgrade Path Optimization

**Starter → Solo Conversion Triggers:**
1. **After First Free Analysis:** "Want to track improvements over time? Solo gives you 10 analyses/month for $4.95"
2. **Monthly Limit Reached:** "You've used your free analysis. Analyze 10 pages/month with Solo"
3. **Exit Intent:** "Before you go - save your results with Solo ($4.95/month)"

**Solo → Growth Conversion Triggers:**
1. **After 8th Analysis (80% quota):** "Running low on analyses. Growth gives you 40/month for just $10 more"
2. **Monthly Limit Reached:** "You've used all 10 analyses. Upgrade to Growth for 40/month ($14.95)"
3. **Comparison Feature Tease:** "Want to compare your pages side-by-side? Upgrade to Growth"
4. **Annual Savings:** "Save $30/year with Growth annual plan ($149/year)"

**Growth → Scale Conversion Triggers:**
1. **After 35th Analysis (88% quota):** "Running low on analyses. Scale gives you 100/month for just $15 more"
2. **API Feature Tease:** "Need programmatic access? Upgrade to Scale for API access"
3. **Team Feature Tease:** "Want to collaborate with your team? Scale includes 3 team seats"

### Pricing Page Design

**Tier Comparison Table:**
- Visual highlighting of Growth tier as "Most Popular"
- Feature comparison matrix (see Section 1)
- Annual savings badge: "Save $30/year with annual plan"

**Pricing Psychology:**
- **Anchor:** Show Scale tier first to make Growth seem affordable
- **Decoy Effect:** Solo tier makes Growth seem like better value
- **Urgency:** "14-day free trial - no credit card required"

**Testimonials:**
- Starter: "I validated the framework in 30 seconds - worth it!"
- Solo: "Optimized my homepage and saw traffic increase in 2 weeks"
- Growth: "Managing my 15-page portfolio is so much easier now"
- Scale: "API access lets me integrate with my custom dashboard"

### Trial Optimization

**Trial Length Strategy:**
- Solo: 7 days (fast decision cycle for low-commitment tier)
- Growth: 14 days (longer evaluation for primary revenue tier)
- Scale: 14 days (longer evaluation for high-commitment tier)

**Trial Onboarding Sequence:**

**Day 0 (Signup):**
- Welcome email: "Your 14-day trial starts now - here's how to get started"
- Onboarding tour in app: "Analyze your first page in 3 steps"

**Day 3:**
- Progress email: "You've analyzed 3 pages - here's what we found"
- Tip: "Focus on these 3 factors to boost your scores"

**Day 7 (Halfway):**
- Midpoint email: "7 days left in your trial - use your remaining analyses"
- Feature spotlight: "Did you know you can compare pages side-by-side?"

**Day 12 (2 days before trial ends):**
- Reminder email: "Your trial ends in 2 days - continue with Growth for $14.95/month"
- Conversion incentive: "Save $30/year with annual plan"

**Day 14 (Trial ends):**
- Conversion email: "Your trial has ended - continue optimizing for $14.95/month"
- Alternative: "Not ready? Downgrade to Solo for $4.95/month"

### Churn Prevention Strategy

**Growth Tier Retention (Critical for 70% Target):**

**Month 1-3 (Onboarding Period):**
- Weekly tips: "How to improve your score by 10+ points"
- Monthly progress report: "Your portfolio improved by 15 points this month"
- Celebration moments: "🎉 Your homepage score hit 85/100!"

**Month 4-6 (Engagement Period):**
- Monthly webinars: "Office hours with AImpactScanner team"
- Feature spotlights: "Did you know you can export to CSV?"
- Use case examples: "How Sarah optimized her service pages"

**Month 7-12 (Retention Period):**
- Annual savings offer: "Save $30 by switching to annual billing"
- Advanced features: Early access to new features
- Community: Join AImpactScanner user community (Slack/Discord)

**Cancellation Flow:**
- Exit survey: "What would make you stay?"
- Retention offers:
  - "Pause for 1 month instead of canceling?"
  - "Switch to Solo ($4.95) to keep your data?"
  - "Get 50% off for 3 months if you stay"
- Final confirmation: "You'll lose access to 90-day history and comparisons"

**Win-Back Campaign (Post-Cancellation):**
- Day 7: "We miss you - here's what's new since you left"
- Day 30: "Come back and get 1 month free"
- Day 90: "Your data will be deleted in 30 days - reactivate to save it"

---

## Section 6: Phase 2 Tier Enhancements (Future)

### AImpact Assistant Integration

**Context:** Phase 2 introduces conversational AI assistant for follow-up questions and implementation guidance.

**Tier Access:**

**All Tiers:**
- Basic conversational interface
- Ask follow-up questions about analysis results
- Get clarification on recommendations

**Growth + Scale Tiers:**
- **Extended "Investigate" Deep-Dives:**
  - "How do I implement this recommendation?"
  - "Show me examples of high-performing pages"
  - "What's the fastest way to improve my Authority score?"
- **Implementation Guidance:**
  - Step-by-step instructions for each recommendation
  - Code snippets and examples
  - Before/after comparisons

**Scale Tier Only:**
- **Custom Analysis Workflows:**
  - "Analyze all my product pages and compare them"
  - "Which page needs the most attention this week?"
- **Proactive Insights:**
  - "Your homepage score dropped by 10 points - here's why"
  - "3 of your pages have similar issues - here's a bulk fix"

### Framework Expansion (18 → 148 Factors)

**Phased Rollout:**
- **Phase 1 (Current):** 18 factors across 8 pillars (MVP)
- **Phase 2:** 48 factors (add 30 advanced factors)
- **Phase 3:** 148 factors (full framework)

**Tier Access to Advanced Factors:**
- **Starter/Solo:** 18 factors (MVP only)
- **Growth:** 48 factors (MVP + advanced)
- **Scale:** 148 factors (full framework)

**Rationale:** Growth tier remains accessible while Scale tier justifies premium pricing with advanced analysis.

### Competitive Monitoring (Future Feature)

**Feature:** Track how your pages compare to competitors over time.

**Tier Access:**
- **Growth:** Monitor 3 competitor pages
- **Scale:** Monitor 10 competitor pages

**Use Case:** "See how your homepage scores vs your top 3 competitors"

### White-Label and Agency Features (Future)

**Scale Tier Enhancements:**
- **White-label reports:** Remove AImpactScanner branding, add custom logo
- **Client management:** Organize analyses by client
- **Team seats:** Increase from 3 to 10 seats
- **Dedicated account manager:** Quarterly strategy calls → monthly calls

**Potential "Agency" Tier ($99/month):**
- 500 analyses/month
- Unlimited team seats
- Unlimited white-label reports
- Dedicated account manager
- SLA guarantees (99.9% uptime)

---

## Section 7: Success Metrics and Validation

### Tier Performance Metrics

**Tier Distribution Targets:**
- Starter (Free): 60% of all users (top of funnel)
- Solo ($4.95): 15% of paid customers (entry tier)
- **Growth ($14.95): 70% of paid customers** ⭐ PRIMARY TARGET
- Scale ($29.95): 15% of paid customers (power users)

**Tier Conversion Metrics:**

**Starter → Paid Conversion:**
- Target: >8% (industry benchmark for freemium SaaS)
- Measurement: % of Starter users who upgrade to any paid tier within 30 days
- Failure threshold: <5% (Overt Benefit not resonating)

**Solo → Growth Upgrade:**
- Target: >30% within 6 months
- Measurement: % of Solo users who upgrade to Growth
- Failure threshold: <20% (Growth tier not compelling enough)

**Trial → Paid Conversion:**
- Target: >25% (industry benchmark for 14-day trials)
- Measurement: % of trial users who convert to paid at trial end
- Failure threshold: <15% (Product not delivering value during trial)

### Retention Metrics (Critical - Tier 1 Hedgehog Validation)

**Growth Tier 12-Month Retention:**
- **Target: >70%** (Hedgehog Concept validation)
- Measurement: % of Growth tier customers active after 12 months
- **Failure threshold: <70%** → Hedgehog pivot required

**Churn Rate by Tier:**
- Solo: <15% monthly churn (higher churn acceptable for low-commitment tier)
- Growth: <6% monthly churn (critical retention tier)
- Scale: <4% monthly churn (power users have high switching costs)

**Churn Reasons (Exit Survey):**
- "Too expensive" → Pricing problem
- "Not using enough" → Engagement problem
- "Missing features" → Product problem
- "Found better alternative" → Competitive problem

### Usage Metrics

**Quota Utilization:**
- Target: >60% average quota usage (indicates right-sizing)
- Measurement: Average % of monthly quota used per tier
- Low utilization (<40%) → Quota too high, consider reducing
- High utilization (>80%) → Quota too low, push upgrades

**Feature Adoption:**
- Comparison reports (Growth+): >40% of users use monthly
- CSV export (Growth+): >20% of users use monthly
- API access (Scale): >80% of users set up within 30 days

**Analysis Frequency:**
- Solo: Average 6-8 analyses/month (60-80% quota usage)
- Growth: Average 24-32 analyses/month (60-80% quota usage)
- Scale: Average 60-80 analyses/month (60-80% quota usage)

### Revenue Metrics

**Monthly Recurring Revenue (MRR) Targets:**
- Month 3: $1,500 (100 Growth customers)
- Month 6: $7,500 (500 Growth customers)
- Month 12: $15,000 (1,000 Growth customers)

**Average Revenue Per User (ARPU):**
- Target: $12-14 (driven by 70% Growth tier mix)
- Calculation: Total MRR / Total paid customers

**Lifetime Value (LTV) by Tier:**
- Solo: $50-60 (12-month retention @ $4.95/month)
- **Growth: $358** (24-month retention @ $14.95/month) ⭐ TARGET
- Scale: $720 (24-month retention @ $29.95/month)

**Customer Acquisition Cost (CAC):**
- Target: <$100 (all tiers blended)
- Growth tier: <$100 (primary acquisition target)
- LTV:CAC ratio: >3.5:1 (Growth tier)

---

## Section 8: Implementation Roadmap

### Phase 1: MVP Launch (Months 1-3)

**Core Features to Build:**

**Week 1-2: Pre-Launch Validation (Marketing Physics Testing)**
- ✅ Free tier only (no payment infrastructure)
- ✅ Manual outreach to 50 solopreneurs
- ✅ Basic analysis engine (18 factors)
- ✅ Results page with embedded survey
- ✅ Success metrics: Activation >12%, "Aha moment" >55%, Actionability >65%
- ✅ **DECISION GATE:** Pass → proceed to paid tiers; Fail → pivot promise

**Week 3-4: Paid Tier Infrastructure (If Validation Passes)**
- Payment processing (Stripe integration)
- Subscription management (plans, billing, invoices)
- User authentication (email/password, social login)
- Tier-based access control

**Week 5-6: Solo Tier**
- Historical tracking (30 days)
- Dashboard (analysis history)
- PDF export
- Email support system

**Week 7-8: Growth Tier**
- Extended historical tracking (90 days)
- Comparison reports (2 pages)
- CSV export
- Priority support queue
- Trend visualization

**Week 9-10: Scale Tier**
- Unlimited historical tracking
- Multi-page comparison (5 pages)
- API endpoints (read-only)
- Custom reports builder
- Team collaboration (3 seats)

**Week 11-12: Polish and Launch**
- Bug fixes and performance optimization
- Marketing site and pricing page
- Onboarding flows and email sequences
- Launch communications

### Phase 2: Growth and Optimization (Months 4-6)

**Focus: Drive to 500 Growth Tier Customers**

**New Features:**
- Advanced dashboard analytics
- Automated email sequences for trial conversion
- Churn prevention workflows
- Referral program (refer a friend, get 1 month free)

**Optimizations:**
- A/B test pricing page messaging
- Optimize trial onboarding flow
- Improve analysis speed (<8 seconds)
- Expand MASTERY-AI Framework (18 → 48 factors for Growth/Scale)

**Marketing:**
- Content marketing (SEO blog posts, case studies)
- Social proof (testimonials, success stories)
- Partnerships (WordPress, Shopify integrations)

### Phase 3: Scale and AImpact Assistant (Months 7-12)

**Focus: Reach 1,000 Growth Tier Customers + Launch Phase 2 Product**

**New Features:**
- **AImpact Assistant (conversational AI)**
  - All tiers: Basic follow-up questions
  - Growth/Scale: Extended "Investigate" deep-dives
  - Scale: Custom analysis workflows
- **Framework Expansion:**
  - Growth: 48 factors
  - Scale: 148 factors (full framework)

**Tier Enhancements:**
- Growth: Increase historical tracking to 120 days
- Scale: Increase team seats to 5, add white-label reports

**Enterprise Exploration:**
- Test "Agency" tier at $99/month (500 analyses, unlimited seats)
- Evaluate enterprise market demand

---

## Section 9: Risk Mitigation and Contingency Plans

### Risk 1: Growth Tier Retention <70% (Hedgehog Failure)

**Scenario:** Growth tier 12-month retention below 70% target

**Diagnosis:**
- If <50% retention → Fundamental Hedgehog problem (pivot required)
- If 50-70% retention → Hedgehog might work, needs refinement

**Mitigation Actions:**
1. **Deep customer interviews** (20+ churned customers)
2. **Root cause analysis:** Pricing? Features? Competition? Value delivery?
3. **Rapid iteration:** Fix top 3 churn reasons within 30 days
4. **Month 6 pivot decision:** Continue, refine, or sunset (Vision & Mission criteria)

### Risk 2: Free → Paid Conversion <5%

**Scenario:** Starter users not converting to paid tiers

**Diagnosis:**
- Overt Benefit not resonating (Marketing Physics failure)
- Free tier provides enough value (no upgrade motivation)

**Mitigation Actions:**
1. **Reframe Overt Benefit:** Test new messaging angles
2. **Limit free tier:** Reduce to 1 analysis every 2 months (instead of monthly)
3. **Add conversion features:** Require email to see results, add upgrade CTAs
4. **Test pricing:** Try $3.95 Solo tier (lower barrier)

### Risk 3: Solo → Growth Upgrade <20%

**Scenario:** Solo users not upgrading to Growth tier

**Diagnosis:**
- Solo quota (10/month) is sufficient for most users
- Growth features (comparisons, trends) not compelling
- Price gap ($10/month) too steep

**Mitigation Actions:**
1. **Reduce Solo quota to 5/month** (push upgrades)
2. **Add Growth-exclusive features:** AI assistant access, advanced insights
3. **Test pricing:** Try $12.95 Growth tier (smaller price gap)
4. **Promotion:** "Upgrade to Growth and get 2 months free"

### Risk 4: Analysis Quality/Speed Issues

**Scenario:** Analysis takes >12 seconds or provides inaccurate recommendations

**Diagnosis:**
- Infrastructure scaling issues
- AI/ML model quality problems
- Third-party API rate limits

**Mitigation Actions:**
1. **Performance monitoring:** Real-time alerts for slow analyses
2. **Caching:** Cache common pages/factors for faster retrieval
3. **Queue management:** Prioritize paid tier analyses over free
4. **Model refinement:** Continuously improve AI/ML model accuracy

### Risk 5: Competitive Pressure (Ayzeo, New Entrants)

**Scenario:** Competitors launch similar features or undercut pricing

**Diagnosis:**
- Ayzeo adds MASTERY-AI-like framework
- New entrant offers free analysis with no limits
- Enterprise tools (Profound, AthenaHQ) drop prices

**Mitigation Actions:**
1. **Framework differentiation:** Accelerate to 148 factors (hard to replicate)
2. **AImpact Assistant:** Launch Phase 2 early (conversational AI is differentiator)
3. **Portfolio strategy:** Bundle with llmtxtmastery (ecosystem lock-in)
4. **Price leadership:** Maintain $14.95 Growth tier (don't race to bottom)

---

## Document Control

**Version History:**
- v1.0 (2025-10-18): Initial tier specification document

**Next Review:** January 18, 2026 (Quarterly)

**Related Documents:**
- `/documents/foundation/Vision and Mission.md` - Strategic foundation and financial targets
- `/documents/foundation/positioning-statement.md` - Market positioning and competitive analysis
- `/documents/foundation/Client Success Blueprint.md` - Customer profiles and success criteria
- `/documents/foundation/AImpactScanner Comprehensive Market Research Report (Revised).md` - Market validation

**Approval Required From:**
- Product Leadership: Feature specifications and tier structure
- Engineering Leadership: Technical feasibility and implementation estimates
- Finance: Pricing, billing logic, revenue targets
- Marketing: Positioning, messaging, conversion optimization

---

**Owner:** Product Leadership
**Last Updated:** October 18, 2025
**Distribution:** Product, Engineering, Marketing, Finance, Customer Success teams

---

**END OF TIER SPECIFICATION**
