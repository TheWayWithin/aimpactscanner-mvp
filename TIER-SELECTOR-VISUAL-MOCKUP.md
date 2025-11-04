# Dynamic Tier Selector Visual Mockup
## ASCII Wireframes for Developer Reference (WITH ANNUAL PRICING)

**Purpose**: Visual reference to complement `/DYNAMIC-TIER-SELECTOR-UX-SPEC.md`
**Created**: October 24, 2025
**Updated**: October 25, 2025 (Annual Pricing Integration)
**Designer**: THE DESIGNER (Agent-11)

**New Feature**: Monthly/Annual billing toggle with Option B pricing (monthly increase + annual discount)

---

## Billing Frequency Toggle (NEW)

### Annual Selected (DEFAULT STATE)

```
┌────────────────────────────────────────────────────────────────┐
│  BILLING FREQUENCY:                                            │
│  ┌──────────────┬─────────────────────────────┐                │
│  │   Monthly    │  Annual (Save 2 months) ✓   │ ← SELECTED     │
│  └──────────────┴─────────────────────────────┘                │
│  ↑ Inactive       ↑ Active (gold background)                   │
│                                                                 │
│  💰 Save up to $119.90/year with annual billing                │
└────────────────────────────────────────────────────────────────┘
```

**Visual States**:
- **Annual button**: Gold background (`#FBBF24`), dark text (`#111827`), checkmark visible
- **Monthly button**: Light gray background (`#F3F4F6`), gray text (`#6B7280`)
- **Savings message**: Green text (`#16A34A`), centered below toggle

### Monthly Selected

```
┌────────────────────────────────────────────────────────────────┐
│  BILLING FREQUENCY:                                            │
│  ┌─────────────────────┬────────────────────┐                  │
│  │  Monthly ✓          │  Annual (Save 2mo) │                  │
│  └─────────────────────┴────────────────────┘                  │
│  ↑ Active (blue bg)    ↑ Inactive                              │
│                                                                 │
│  ⚠️ Switch to annual billing to save up to $119.90/year        │
└────────────────────────────────────────────────────────────────┘
```

**Visual States**:
- **Monthly button**: Blue background (`#3B82F6`), white text
- **Annual button**: Light gray background (`#F3F4F6`), gray text (`#6B7280`)
- **Warning message**: Orange/yellow text (`#D97706`), centered below toggle

---

## Desktop Layout (1024px+) - WITH ANNUAL BILLING TOGGLE

### Growth Tier Selected + Annual Billing (DEFAULT STATE)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         GET STARTED WITH AIMPACTSCANNER                             │
│                  Make your business AI-discoverable in 60 seconds                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ BILLING FREQUENCY:  ┌──────────┐  ┌─────────────────────────┐                │  │
│  │                     │ Monthly  │  │ Annual (Save 2mo) ✓     │ ← SELECTED     │  │
│  │                     └──────────┘  └─────────────────────────┘                │  │
│  │ 💰 Save up to $119.90/year with annual billing                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────────────────────────┐
│ SELECT YOUR PLAN             │  🚀 GROWTH TIER - SMART CHOICE                       │
│                              │  Less than two coffees per month                      │
│ ┌──────────────────────────┐ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │ ○ ⚠️ FREE (Limited)       │ │                                                      │
│ │   $0/month               │ │  📢 OVERT BENEFIT                                    │
│ │   Only 3 analyses/month  │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  Analyze 40 pages per month with the research-based │
│                              │  framework, track improvements for 90 days, and help │
│ ┌──────────────────────────┐ │  ChatGPT find your content - for just $12.46/mo    │
│ │ ○ 💼 SOLO                 │ │  when you pay annually (save $65.90/year)           │
│ │   $5.95/month            │ │                                                      │
│ │   or $4.13/mo annual     │ │  ✅ REAL REASONS TO BELIEVE                         │
│ │   10 analyses/month      │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  • 40 analyses/month ($0.31/analysis annually)      │
│                              │  • 90-day improvement tracking                       │
│ ┌──────────────────────────┐ │  • CSV export (analyze your data your way)          │
│ │    🎁 7-DAY FREE TRIAL    │ │  • One-click LLMS.txt generation (help ChatGPT     │
│ │    💰 SAVE $65.90         │ │    find your content)                               │
│ │                          │ │  • Priority support (24-hour response)               │
│ │ ● 🚀 GROWTH ⭐            │ │  • Lock in $12.46/mo - save $65.90/year (2 months  │
│ │   $12.46/mo annual       │ │    free!)                                            │
│ │   Billed $149.50/year    │ │  • Protect against future price increases           │
│ │   or $17.95/mo monthly   │ │  • 7-Day Free Trial (converts to annual)            │
│ │   40 analyses/month      │ │                                                      │
│ │                          │ │  🎯 DRAMATIC DIFFERENCE                             │
│ │   [RECOMMENDED]          │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  Solo tier tells you what's wrong with 10 pages.    │
│        ↑ SELECTED            │  Growth tier gives you 40 analyses to optimize your │
│                              │  entire site, track improvements for 90 days,       │
│ ┌──────────────────────────┐ │  export your data, AND make sure ChatGPT can find   │
│ │ ○ 🏢 SCALE                │ │  your content. Pay annually and save 2 months -    │
│ │   $24.96/mo annual       │ │  that's the complete optimization system for the   │
│ │   Billed $299.50/year    │ │  price of 10 months.                                │
│ │   or $34.95/mo monthly   │ │                                                      │
│ │   100 analyses/month     │ │  ┌────────────────────────────────────────────────┐ │
│ │   [POWER USERS]          │ │  │ ✨ YOU MADE THE RIGHT CHOICE!                  │ │
│ └──────────────────────────┘ │  │                                                │ │
│                              │  │ This is our most popular tier and billing      │ │
│ ┌──────────────────────────┐ │  │ option. You're joining hundreds of businesses  │ │
│ │  Continue to Sign Up  →  │ │  │ who save money with annual billing while       │ │
│ └──────────────────────────┘ │  │ optimizing their content.                      │ │
│                              │  └────────────────────────────────────────────────┘ │
│                              │                                                      │
│                              │  ┌────────────────────────────────────────────────┐ │
│                              │  │ 🎁 Try Growth Free for 7 Days                  │ │
│                              │  │    Then $149.50/year (or switch to monthly)    │ │
│                              │  │                                                │ │
│                              │  │ [Start 7-Day Free Trial 🎁]                    │ │
│                              │  │                                                │ │
│                              │  │ or                                             │ │
│                              │  │                                                │ │
│                              │  │ [Skip trial, pay $149.50 now]                  │ │
│                              │  │                                                │ │
│                              │  │ ───────────────────────────────────            │ │
│                              │  │ Prefer monthly billing?                        │ │
│                              │  │ Switch to $17.95/mo (billed monthly)           │ │
│                              │  └────────────────────────────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────────────────────────┐
│ SELECT YOUR PLAN             │  🚀 GROWTH TIER - SMART CHOICE                       │
│                              │  Less than two coffees per month                      │
│ ┌──────────────────────────┐ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │ ○ ⚠️ FREE (Limited)       │ │                                                      │
│ │   $0/month               │ │  📢 OVERT BENEFIT                                    │
│ │   Only 3 analyses/month  │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  Analyze 40 pages per month with the research-based │
│                              │  framework, track improvements for 90 days, and help │
│ ┌──────────────────────────┐ │  ChatGPT find your content - all for less than      │
│ │ ○ 💼 SOLO                 │ │  two coffees                                         │
│ │   $4.95/month            │ │                                                      │
│ │   10 analyses/month      │ │  ✅ REAL REASONS TO BELIEVE                         │
│ └──────────────────────────┘ │  ────────────────────────────────                    │
│                              │  • 40 analyses per month ($0.37 per analysis - 1/3   │
│ ┌──────────────────────────┐ │    cheaper than Solo)                                │
│ │    🎁 7-DAY FREE TRIAL    │ │  • 90-day improvement tracking (see long-term       │
│ │                          │ │    results, measure real progress)                   │
│ │ ● 🚀 GROWTH ⭐            │ │  • CSV export (analyze your data your way - trend   │
│ │   $14.95/month           │ │    analysis, portfolio tracking)                     │
│ │   40 analyses/month      │ │  • One-click LLMS.txt generation (help ChatGPT and  │
│ │                          │ │    AI search engines find your content)              │
│ │   [RECOMMENDED]          │ │  • Priority support (24-hour response vs community) │
│ └──────────────────────────┘ │  • 7-Day Free Trial (test all Growth features with  │
│        ↑ SELECTED            │    40 analyses before paying)                        │
│                              │                                                      │
│ ┌──────────────────────────┐ │  🎯 DRAMATIC DIFFERENCE                             │
│ │ ○ 🏢 SCALE                │ │  ────────────────────────────────                    │
│ │   $29.95/month           │ │  Solo tier tells you what's wrong with 10 pages.    │
│ │   100 analyses/month     │ │  Growth tier gives you 40 analyses to optimize your │
│ │   [POWER USERS]          │ │  entire site, track improvements for 90 days,       │
│ └──────────────────────────┘ │  export your data, AND make sure ChatGPT can find   │
│                              │  your content. That's the complete optimization      │
│                              │  system, not just spot checks.                       │
│ ┌──────────────────────────┐ │                                                      │
│ │  Continue to Sign Up  →  │ │  ┌────────────────────────────────────────────────┐ │
│ └──────────────────────────┘ │  │ ✨ YOU MADE THE RIGHT CHOICE!                  │ │
│                              │  │                                                │ │
│                              │  │ This is our most popular tier for serious      │ │
│                              │  │ content optimization. You're joining hundreds  │ │
│                              │  │ of businesses who use Growth tier to:          │ │
│                              │  │                                                │ │
│                              │  │ • Optimize entire portfolios (not just         │ │
│                              │  │   homepage)                                    │ │
│                              │  │ • Track long-term improvements (90 days)       │ │
│                              │  │ • Get found by AI search (LLMS.txt)            │ │
│                              │  │ • Analyze trends over time (CSV export)        │ │
│                              │  └────────────────────────────────────────────────┘ │
│                              │                                                      │
│                              │  ┌────────────────────────────────────────────────┐ │
│                              │  │ 🎁 Try Growth Free for 7 Days                  │ │
│                              │  │                                                │ │
│                              │  │ • 40 analyses to test all features            │ │
│                              │  │ • Card required, no charge for 7 days         │ │
│                              │  │ • Cancel anytime, keep your data              │ │
│                              │  │ • Then $14.95/month if you love it            │ │
│                              │  │                                                │ │
│                              │  │ [Start 7-Day Free Trial 🎁]                    │ │
│                              │  │                                                │ │
│                              │  │ or                                             │ │
│                              │  │                                                │ │
│                              │  │ [Skip trial, pay now ($14.95/month)]           │ │
│                              │  └────────────────────────────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ ZERO RISK - We Remove ALL Your Fears                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 💰 30-Day Money Back Guarantee | ⚡ Cancel Instantly Anytime                        │
│ 🏆 Results in 24 Hours or Refund | 🚀 Outperform Competitors or Refund             │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Free Tier Selected (Loss Aversion State)

```
┌──────────────────────────────┬──────────────────────────────────────────────────────┐
│ SELECT YOUR PLAN             │  ⚠️ FREE TIER (LIMITED)                              │
│                              │  Only for testing before committing                   │
│ ┌──────────────────────────┐ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │ ● ⚠️ FREE (Limited)       │ │                                                      │
│ │   $0/month               │ │  📢 OVERT BENEFIT                                    │
│ │   Only 3 analyses/month  │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  Access 3 comprehensive analyses per month - test   │
│        ↑ SELECTED            │  the research-based framework before committing to   │
│                              │  Growth                                               │
│ ┌──────────────────────────┐ │                                                      │
│ │ ○ 💼 SOLO                 │ │  ✅ REAL REASONS TO BELIEVE                         │
│ │   $4.95/month            │ │  ────────────────────────────────                    │
│ │   10 analyses/month      │ │  • 3 complete analyses per month (full 18-factor    │
│ └──────────────────────────┘ │    framework)                                        │
│                              │  • Professional-quality reports (same quality as     │
│ ┌──────────────────────────┐ │    paid tiers)                                       │
│ │    🎁 7-DAY FREE TRIAL    │ │  • See your current optimization score (baseline)  │
│ │                          │ │  • Understand what you're missing vs Growth tier    │
│ │ ○ 🚀 GROWTH ⭐            │ │                                                      │
│ │   $14.95/month           │ │  🎯 DRAMATIC DIFFERENCE                             │
│ │   40 analyses/month      │ │  ────────────────────────────────                    │
│ │                          │ │  The Free tier gives you a taste of the MASTERY-AI  │
│ │   [RECOMMENDED]          │ │  Framework with 3 analyses to see how it works. But │
│ └──────────────────────────┘ │  you're leaving serious optimization on the table:  │
│                              │                                                      │
│ ┌──────────────────────────┐ │  ┌────────────────────────────────────────────────┐ │
│ │ ○ 🏢 SCALE                │ │  │ WITHOUT GROWTH TIER, YOU WON'T BE ABLE TO:     │ │
│ │   $29.95/month           │ │  │                                                │ │
│ │   100 analyses/month     │ │  │ ❌ Generate LLMS.txt                           │ │
│ │   [POWER USERS]          │ │  │    → ChatGPT and AI search can't find your    │ │
│ └──────────────────────────┘ │  │      content                                   │ │
│                              │  │                                                │ │
│ ┌──────────────────────────┐ │  │ ❌ Export to CSV                               │ │
│ │  Continue to Sign Up  →  │ │  │    → Stuck with manual tracking, can't        │ │
│ └──────────────────────────┘ │  │      analyze trends                            │ │
│                              │  │                                                │ │
│                              │  │ ❌ Track 90 days of improvements               │ │
│                              │  │    → Only 30 days, then results disappear     │ │
│                              │  │                                                │ │
│                              │  │ ❌ Analyze 40 pages/month                      │ │
│                              │  │    → Only 3 analyses, then locked out for     │ │
│                              │  │      30 days                                   │ │
│                              │  │                                                │ │
│                              │  │ THE REALITY: Competitors using Growth will    │ │
│                              │  │ optimize faster, rank higher, and get found   │ │
│                              │  │ by AI search while you're limited to 3        │ │
│                              │  │ analyses.                                      │ │
│                              │  └────────────────────────────────────────────────┘ │
│                              │                                                      │
│                              │  ┌────────────────────────────────────────────────┐ │
│                              │  │ ⚠️ IMPORTANT: You'll be locked out after 3     │ │
│                              │  │    analyses for 30 days                        │ │
│                              │  │                                                │ │
│                              │  │ Growth tier is only $14.95/month (less than   │ │
│                              │  │ two coffees) and gives you:                   │ │
│                              │  │ • 40 analyses/month (13x more)                │ │
│                              │  │ • 90-day tracking (see long-term results)     │ │
│                              │  │ • CSV export (analyze your data)              │ │
│                              │  │ • LLMS.txt generation (get found by AI)       │ │
│                              │  │                                                │ │
│                              │  │ [Upgrade to Growth for 7-Day Free Trial]       │ │
│                              │  └────────────────────────────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────────────────────────────┘
```

### Solo Tier Selected (Validation + Upsell State)

```
┌──────────────────────────────┬──────────────────────────────────────────────────────┐
│ SELECT YOUR PLAN             │  💼 SOLO TIER                                         │
│                              │  Less than one coffee per month                       │
│ ┌──────────────────────────┐ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ │ ○ ⚠️ FREE (Limited)       │ │                                                      │
│ │   $0/month               │ │  📢 OVERT BENEFIT                                    │
│ │   Only 3 analyses/month  │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  Stop guessing what matters - analyze your 10 most  │
│                              │  important pages with a research-based framework for │
│ ┌──────────────────────────┐ │  less than a coffee                                  │
│ │ ● 💼 SOLO                 │ │                                                      │
│ │   $4.95/month            │ │  ✅ REAL REASONS TO BELIEVE                         │
│ │   10 analyses/month      │ │  ────────────────────────────────                    │
│ └──────────────────────────┘ │  • 10 analyses per month = complete core coverage   │
│        ↑ SELECTED            │    ($0.50 per analysis vs $5-10 manual cost)         │
│                              │  • 30-day history: Track your improvements          │
│ ┌──────────────────────────┐ │  • Professional PDF reports: Share with team        │
│ │    🎁 7-DAY FREE TRIAL    │ │  • Research-based framework: Same 18 factors used   │
│ │                          │ │    by AI search engines                              │
│ │ ○ 🚀 GROWTH ⭐            │ │                                                      │
│ │   $14.95/month           │ │  🎯 DRAMATIC DIFFERENCE                             │
│ │   40 analyses/month      │ │  ────────────────────────────────                    │
│ │                          │ │  Manual ChatGPT analysis: 5 minutes per page,       │
│ │   [RECOMMENDED]          │ │  different results every time, hallucinated         │
│ └──────────────────────────┘ │  problems, no factor weighting, no historical       │
│                              │  tracking, inconsistent recommendations.             │
│ ┌──────────────────────────┐ │                                                      │
│ │ ○ 🏢 SCALE                │ │  AImpactScanner Solo: 12 seconds per analysis, same │
│ │   $29.95/month           │ │  research-based framework every time, correctly     │
│ │   100 analyses/month     │ │  weighted factors, see your improvements for 30     │
│ │   [POWER USERS]          │ │  days, professional PDF reports.                    │
│ └──────────────────────────┘ │                                                      │
│                              │  That's the difference between guessing and knowing. │
│ ┌──────────────────────────┐ │                                                      │
│ │  Continue to Sign Up  →  │ │  ┌────────────────────────────────────────────────┐ │
│ └──────────────────────────┘ │  │ 💡 SMART UPGRADE: Growth tier is only $10 more │ │
│                              │  │    per month                                   │ │
│                              │  │                                                │ │
│                              │  │ For just $14.95/month (vs $4.95 Solo), you get:│ │
│                              │  │ • 4x more analyses (40 vs 10 per month)        │ │
│                              │  │ • 3x longer tracking (90 days vs 30 days)      │ │
│                              │  │ • CSV export (analyze trends, track portfolio) │ │
│                              │  │ • LLMS.txt generation (help ChatGPT find your  │ │
│                              │  │   content)                                     │ │
│                              │  │ • 7-Day Free Trial (test Growth features with  │ │
│                              │  │   40 analyses)                                 │ │
│                              │  │                                                │ │
│                              │  │ That's $0.37 per analysis vs $0.50 - better   │ │
│                              │  │ value AND more features.                       │ │
│                              │  │                                                │ │
│                              │  │ [Upgrade to Growth for 7-Day Free Trial]       │ │
│                              │  └────────────────────────────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────────────────────────────┘
```

---

## Mobile Layout (375px - 767px)

### Growth Tier Selected (Default State)

```
┌─────────────────────────────────┐
│   GET STARTED                   │
│   Make your business            │
│   AI-discoverable in 60 seconds │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ SELECT YOUR PLAN                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ▼ Growth Tier - $14.95/mo ⭐ │ │
│ └─────────────────────────────┘ │
│        ↑ DROPDOWN               │
│                                 │
│ [When expanded shows:]          │
│ ○ Free - $0/mo (Limited)        │
│ ○ Solo - $4.95/mo               │
│ ● Growth - $14.95/mo ⭐ 🎁       │
│ ○ Scale - $29.95/mo (Power)     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🚀 GROWTH TIER                  │
│ SMART CHOICE                    │
├─────────────────────────────────┤
│                                 │
│ 📢 OVERT BENEFIT                │
│ ────────────────────            │
│ Analyze 40 pages/month, track   │
│ 90 days, help ChatGPT find you  │
│ - less than two coffees         │
│                                 │
│ ✅ WHAT YOU GET:                │
│ ────────────────────            │
│ • 40 analyses/month             │
│ • 90-day tracking               │
│ • CSV export + LLMS.txt         │
│ • Priority support              │
│ • 7-Day Free Trial              │
│                                 │
│ [Show all features ▼]           │
│ ↑ Expandable accordion          │
│                                 │
│ 🎯 VS SOLO TIER:                │
│ ────────────────────            │
│ Complete optimization system,   │
│ not just spot checks (40 vs 10  │
│ analyses). Track 90 days vs 30. │
│ Export data + get found by AI.  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✨ YOU MADE THE RIGHT CHOICE!│ │
│ │                             │ │
│ │ Most popular tier for       │ │
│ │ serious optimization.       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Try Growth Free for 7 Days  │ │
│ │ 🎁                           │ │
│ │                             │ │
│ │ • 40 analyses to test       │ │
│ │ • No charge for 7 days      │ │
│ │ • Cancel anytime            │ │
│ │                             │ │
│ │ [Start 7-Day Free Trial 🎁] │ │
│ │                             │ │
│ │ or                          │ │
│ │                             │ │
│ │ [Pay now ($14.95/month)]    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
     ↓ USER SCROLLS DOWN
┌─────────────────────────────────┐
│ 🛡️ ZERO RISK                   │
├─────────────────────────────────┤
│ 💰 30-Day Money Back            │
│ ⚡ Cancel Instantly             │
│ 🏆 Results in 24 Hours          │
│ 🚀 Outperform Competitors       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│ [Continue to Sign Up →]         │
│ ↑ STICKY BOTTOM CTA             │
└─────────────────────────────────┘
```

### Free Tier Selected (Loss Aversion on Mobile)

```
┌─────────────────────────────────┐
│ ▼ Free Tier - $0/mo ⚠️           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️ FREE TIER (LIMITED)          │
├─────────────────────────────────┤
│                                 │
│ 📢 OVERT BENEFIT                │
│ ────────────────────            │
│ Access 3 analyses/month - test  │
│ the framework before committing │
│                                 │
│ ✅ WHAT YOU GET:                │
│ ────────────────────            │
│ • 3 complete analyses/month     │
│ • Professional-quality reports  │
│ • See your baseline score       │
│ • Understand what you're missing│
│                                 │
│ ❌ WHAT YOU'RE MISSING:         │
│ ────────────────────            │
│ Without Growth tier, you WON'T  │
│ be able to:                     │
│                                 │
│ ❌ Generate LLMS.txt             │
│    (ChatGPT can't find you)     │
│                                 │
│ ❌ Export to CSV                 │
│    (stuck with manual tracking) │
│                                 │
│ ❌ Track 90 days                 │
│    (only 30 days, then gone)    │
│                                 │
│ ❌ Analyze 40 pages/month        │
│    (only 3, then locked out)    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ IMPORTANT                 │ │
│ │                             │ │
│ │ You'll be locked out after  │ │
│ │ 3 analyses for 30 days.     │ │
│ │                             │ │
│ │ Growth is only $14.95/month │ │
│ │ and gives you:              │ │
│ │ • 40 analyses/month (13x)   │ │
│ │ • 90-day tracking           │ │
│ │ • CSV export                │ │
│ │ • LLMS.txt generation       │ │
│ │                             │ │
│ │ [Upgrade to Growth - Try    │ │
│ │  7 Days Free]               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Color Swatches

### Growth Tier (Primary)
```
Border:     #FBBF24 (yellow-400)  ████████
Background: #FEFCE8 (yellow-50)   ░░░░░░░░
Badge:      #FBBF24 on #111827    ████████ (yellow-400 on gray-900)
Text:       #16A34A (green-600)   ████████ (success messaging)
```

### Free Tier (Warning)
```
Border:     #D1D5DB (gray-300)    ████████
Background: #F9FAFB (gray-50)     ░░░░░░░░
Warning:    #DC2626 (red-600)     ████████
Bg:         #FEF2F2 (red-50)      ░░░░░░░░
```

### Solo Tier (Neutral)
```
Border:     #60A5FA (blue-400)    ████████
Background: #EFF6FF (blue-50)     ░░░░░░░░
Info:       #1E40AF (blue-800)    ████████
Bg:         #DBEAFE (blue-100)    ░░░░░░░░
```

### Scale Tier (Premium)
```
Border:     #C084FC (purple-400)  ████████
Background: #FAF5FF (purple-50)   ░░░░░░░░
Badge:      #C084FC on #FFFFFF    ████████ (purple-400 on white)
Text:       #7C3AED (purple-600)  ████████
```

---

## Badge Positioning Examples

### Growth Tier Card with Dual Badges

```
┌─────────────────────────────────────────┐
│  🎁 7-DAY FREE TRIAL    [RECOMMENDED] ⭐ │
│                                         │
│  ● 🚀 GROWTH                             │
│    $14.95/month                         │
│    40 analyses/month                    │
│                                         │
└─────────────────────────────────────────┘
     ↑ Top-left badge      ↑ Top-right badge
```

### Hover State (Desktop)

```
BEFORE HOVER:
┌─────────────────────────────────────────┐
│ ○ 🚀 GROWTH ⭐                            │
│   $14.95/month                          │
│   border-2 border-gray-200              │
└─────────────────────────────────────────┘

DURING HOVER:
┌═════════════════════════════════════════┐
│ ○ 🚀 GROWTH ⭐                            │
│   $14.95/month                          │
│   border-2 border-yellow-400            │
│   bg-yellow-50                          │
│   ↑ Thicker border, background tint     │
└═════════════════════════════════════════┘

SELECTED:
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ● 🚀 GROWTH ⭐                            ┃
┃   $14.95/month                          ┃
┃   border-2 border-yellow-400            ┃
┃   bg-yellow-50                          ┃
┃   box-shadow glow                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Transition Animation Visualization

```
USER CLICKS SOLO TIER:

TIME: 0ms
┌──────────────────┐
│ GROWTH TIER      │  ← Opacity 1.0
│ (current)        │  ← TranslateY: 0
└──────────────────┘

TIME: 100ms
┌──────────────────┐
│ GROWTH TIER      │  ← Opacity 0.5
│ (fading out)     │  ← TranslateY: -5px
└──────────────────┘

TIME: 200ms
┌──────────────────┐
│ (empty)          │  ← Opacity 0
│                  │  ← TranslateY: -10px
└──────────────────┘

TIME: 300ms
┌──────────────────┐
│ SOLO TIER        │  ← Opacity 0.7
│ (fading in)      │  ← TranslateY: -5px
└──────────────────┘

TIME: 400ms
┌──────────────────┐
│ SOLO TIER        │  ← Opacity 1.0
│ (fully visible)  │  ← TranslateY: 0
└──────────────────┘
```

---

## Responsive Breakpoint Behavior

```
MOBILE (< 768px):
┌───────────────────┐
│ Dropdown selector │
│ Stacked messaging │
│ Condensed copy    │
│ Sticky CTA        │
└───────────────────┘

TABLET (768px - 1023px):
┌─────────────────────────┐
│ Radio button selector   │
│ Stacked below tiers     │
│ Full messaging panel    │
│ Bottom CTA              │
└─────────────────────────┘

DESKTOP (≥ 1024px):
┌──────────┬────────────┐
│ Radio    │ Dynamic    │
│ buttons  │ messaging  │
│ (40%)    │ panel (60%)│
│          │            │
│          │ [Sticky]   │
└──────────┴────────────┘
```

---

**END OF VISUAL MOCKUP**

For complete specifications, see: `/DYNAMIC-TIER-SELECTOR-UX-SPEC.md`
