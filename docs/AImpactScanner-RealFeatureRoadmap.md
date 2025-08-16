---
title: "AImpactScanner Real Feature & Infrastructure Roadmap"
author: Jamie Watters
version: 1.0.0
date: 2025-08-15
document_type: "technical_roadmap"
status: "active"
project: "aimpactscanner"
description: "Actual technical roadmap with specific features, infrastructure migrations, and business integrations that deliver real value."
---

# AImpactScanner Real Feature & Infrastructure Roadmap

## Current Technical Debt & Infrastructure Issues (August 2025)

### Critical Infrastructure Problems
- **Supabase Edge Functions timing out** on complex scans
- **No proper backend** - everything running on Edge Functions
- **No caching layer** - rescanning same sites wastes resources
- **No admin visibility** - can't see what users are doing
- **No CRM integration** - manual user tracking
- **Only 10 of 148 factors** implemented
- **Single page analysis only** - missing site-wide insights
- **No benchmark data** - can't compare to industry standards
- **No baseline tracking** - users can't measure improvement

---

## Phase 1: Infrastructure Foundation (August 15 - September 30, 2025)

### Railway Migration & Proper Backend
```
Week 1-2: Setup Railway Infrastructure
- Migrate from Supabase Edge Functions to Railway
- Set up Node.js/Express backend
- Implement proper job queue (Bull/BullMQ)
- Set up Redis for caching
- Configure environment variables
- Set up monitoring (Sentry, LogTail)

Benefits:
- No more timeouts
- Can run long-processing jobs
- Proper error handling
- Cost predictability
```

### Admin Panel Development
```
Week 3-4: Basic Admin Dashboard
- User management table (see all users, status, plan)
- Scan history and analytics
- System health monitoring
- Feature flags for gradual rollout
- Manual user upgrade/downgrade
- Export user data to CSV

Tech Stack:
- React admin panel
- Authenticated route (/admin)
- Read-only initially, then add controls
```

### Zoho CRM & Campaigns Integration
```
Week 5-6: Marketing Automation Setup
- Zoho CRM API integration
- Sync users to CRM on signup
- Track user events (scans, upgrades, churn)
- Zoho Campaigns for email automation
- Welcome series automation
- Churn prevention campaigns

Specific Integrations:
- New user → Create CRM contact
- Scan complete → Update contact record
- Upgrade → Move to customer segment
- No activity 30 days → Re-engagement campaign
```

### Baseline & Progress Tracking System
```
Week 6: Historical Tracking Implementation
- Store all scan results with timestamps
- Create baseline on first scan
- Track changes between scans
- Calculate improvement/decline percentages
- Generate progress reports
- Email alerts for significant changes

Database Schema:
- scan_baselines table (site_id, initial_scores, date)
- scan_history table (all scans with timestamps)
- score_changes table (factor, before, after, change%)
```

---

## Phase 2: Core Feature Expansion (October - November 2025)

### Industry Benchmarking Database
```
Week 1 October: Build Knowledge Base
- Categorize all scanned sites by industry
- Calculate average scores per industry
- Build percentile rankings
- Create benchmark reports
- Anonymous competitive positioning

Industry Categories:
- Professional Services (lawyers, accountants, consultants)
- Retail SME (online stores, local shops)
- SaaS/Software Companies
- Healthcare Providers
- Real Estate
- Directories & Marketplaces
- Educational Institutions
- Non-profits
- Local Services (plumbers, electricians, etc.)
- Content Publishers/Blogs

Benchmark Metrics:
- Average overall score by industry
- Factor-by-factor industry averages
- Top 10%, 25%, 50% percentiles
- "You rank #X out of Y in your industry"
- Industry-specific weak points
- Best practices from top performers
```

### Deep Site Scanning
```
Week 2-3 October: Multi-Page Analysis
- Crawl entire site (up to 100 pages)
- Identify page types (home, product, blog, about, etc.)
- Prioritize pages by importance
- Cross-page issue detection
- Site-wide recommendations

Page Prioritization Algorithm:
1. Homepage (always first)
2. High-traffic pages (if analytics connected)
3. Money pages (product, pricing, contact)
4. Recent content (blog posts, news)
5. Deep architecture pages

Site-Wide Analysis Features:
- Consistent issues across all pages
- Template-level problems
- Site architecture issues
- Internal linking problems
- Duplicate content detection
- Missing critical pages

Remediation Priority Scoring:
- Impact: How many pages affected
- Effort: Easy/Medium/Hard to fix
- Value: Traffic/conversion potential
- Quick wins vs. long-term projects
```

### Systematic Factor Implementation
```
Current: 10 factors implemented
Target: 50 factors by end of November

October (20 new factors):
AI Pillar (High Impact):
- AI.1.1: Citation-Worthy Content Structure
- AI.1.2: Source Authority Signals  
- AI.1.3: Factual Accuracy Indicators
- AI.1.4: Update Freshness Markers
- AI.1.5: Evidence Chunking for RAG

Authority Pillar:
- A.1.1: Author Expertise Signals
- A.1.2: Creator Credentials
- A.2.1: Institutional Authority
- A.3.1: Transparency Standards
- A.3.2: Contact Information

November (20 more factors):
Mastery Pillar:
- M.1.1-M.1.5: Technical optimization factors
- M.2.1-M.2.5: Content optimization factors

Structure Pillar:
- S.1.1-S.1.5: Information architecture
- S.2.1-S.2.5: Navigation and hierarchy
```

### PDF Report Generation
```
Week 4 November:
- HTML to PDF conversion (Puppeteer)
- Custom report templates
- Executive summary page
- Detailed factor breakdown
- Recommendations with priority
- Before/after comparison
- White-label option (remove branding)

Report Sections:
1. Cover page with score
2. Executive summary
3. Industry benchmark comparison
4. Progress since baseline
5. Factor-by-factor analysis
6. Page-by-page priorities (for deep scans)
7. Top 10 recommendations
8. Implementation checklist
9. Competitor comparison (anonymous)
10. Next steps roadmap
```

### A/B Testing Framework
```
Week 3-4 October:
- Split testing for onboarding flows
- Pricing page variations
- Report format testing
- Email subject lines
- CTA button tests

Implementation:
- PostHog or Mixpanel integration
- Feature flags for variants
- Statistical significance calculator
- Automatic winner selection
```

---

## Phase 3: Intelligence & Knowledge Base (December 2025 - January 2026)

### Building the Knowledge Base
```
December: Aggregate Intelligence
- Analyze patterns from 1000+ scans
- Identify common issues by industry
- Build "fix libraries" for common problems
- Create success pattern recognition
- Develop predictive scoring models

Data Collection:
- Anonymous aggregation of scan data
- Industry classification algorithm
- Geographic segmentation
- Size-based grouping (SME vs Enterprise)
- Technology stack detection

Intelligence Products:
- Industry reports (quarterly)
- "State of AI Optimization" dashboard
- Common mistakes database
- Best practices library
- Success story repository
```

### Advanced Comparison Features
```
January: Competitive Intelligence
- Compare against industry leaders
- Track competitor improvements
- Market positioning maps
- Gap analysis reports
- Opportunity identification

Comparison Types:
1. Historical: You vs. your past performance
2. Industry: You vs. industry average
3. Aspirational: You vs. top 10% in your industry
4. Competitive: You vs. specific competitors
5. Regional: You vs. local market

Privacy & Ethics:
- All comparisons anonymous
- Aggregate data only
- Opt-in for inclusion
- GDPR compliant
- Clear data usage policy
```

## Phase 4: Strategic Integrations (February 2026)

### LLMTXTMastery.com Integration
```
Direct Integration Features:
- "Generate LLMs.txt" button in recommendations
- API call to LLMTXTMastery for file generation
- Embedded wizard for LLMs.txt creation
- Cross-product authentication (SSO)
- Bundle pricing for both products
- Shared user dashboard

Revenue Share Model:
- 30% commission on referrals
- Cross-promotion in both products
- Joint marketing campaigns
```

### Tool Recommendations Engine
```
For Each Problem, Recommend Solutions:
- Schema markup issues → Schema.org generator
- Meta descriptions → AI writing tools
- Image optimization → TinyPNG, Cloudinary
- SSL issues → Let's Encrypt, Cloudflare
- Performance → GTmetrix, Lighthouse

Affiliate Integration:
- Affiliate links where appropriate
- Track conversion attribution
- Commission tracking dashboard
- Transparent disclosure
```

### Site-Wide Remediation Planning
```
Remediation Intelligence:
- Template-level fixes (fix once, apply everywhere)
- Cross-page dependencies
- Implementation order optimization
- Resource estimation (hours, difficulty)
- ROI predictions per fix

Remediation Categories:
1. Quick Wins (< 1 hour, high impact)
2. Template Fixes (affects many pages)
3. Content Updates (per-page improvements)
4. Technical Fixes (site-wide infrastructure)
5. Strategic Changes (long-term projects)

Bulk Remediation Tools:
- Export all issues to CSV
- Generate implementation tickets (Jira, Trello)
- Track fix completion
- Re-scan to verify fixes
- Progress dashboard
```

### WordPress Plugin Development
```
Basic Plugin Features:
- One-click scan from WP Admin
- Automatic weekly scans
- Show score in dashboard widget
- Quick fixes directly in WordPress
- Bulk optimization tools
- Yoast/RankMath integration

Distribution:
- WordPress.org repository
- Premium version with advanced features
- Freemium model matching main product
```

---

## Phase 4: Advanced Analysis (February - March 2026)

### Implement Next 50 Factors (Total: 100/148)
```
February (25 factors):
Experience Pillar:
- E.1.1-E.1.5: User experience signals
- E.2.1-E.2.5: Performance metrics
- E.3.1-E.3.5: Accessibility factors

Reach Pillar:
- R.1.1-R.1.5: Distribution signals
- R.2.1-R.2.5: Cross-platform presence

March (25 factors):
Yield Pillar:
- Y.1.1-Y.1.5: Conversion optimization
- Y.2.1-Y.2.5: Business outcomes
- Y.3.1-Y.3.5: ROI indicators

Trust Pillar:
- T.1.1-T.1.5: Security signals
- T.2.1-T.2.5: Privacy compliance
```

### Competitor Tracking System
```
Features:
- Add up to 5 competitors
- Weekly automated scans
- Side-by-side comparison
- Gap analysis report
- Trend tracking over time
- Alert when competitors improve

Implementation:
- Scheduled cron jobs
- Comparison dashboard
- Email alerts for changes
- Competitive intelligence reports
```

### Custom Scoring Profiles
```
Industry-Specific Weightings:
- E-commerce: Focus on product schema, trust signals
- SaaS: Emphasize feature pages, documentation
- Local Business: Local SEO factors, NAP consistency
- Publishers: Content depth, authorship, citations
- B2B: Thought leadership, case studies

User Controls:
- Toggle factors on/off
- Adjust weight multipliers
- Save custom profiles
- Share profiles with team
```

---

## Phase 5: Scale & Performance (April - May 2026)

### Multi-Site Management
```
Features:
- Bulk CSV upload of sites
- Folder organization
- Tag system for grouping
- Bulk actions (scan all, export all)
- Portfolio dashboard
- Cross-site insights

Technical Requirements:
- Database schema update
- Bulk processing queue
- Pagination for large lists
- Filtering and search
```

### API Development
```
REST API Endpoints:
POST /api/scan - Initiate scan
GET /api/scan/{id} - Get results
GET /api/factors - List all factors
GET /api/recommendations - Get recommendations
POST /api/sites - Add site
GET /api/reports - Generate report

Features:
- API key management
- Rate limiting (100 requests/hour)
- Webhook notifications
- SDKs for popular languages
- Zapier integration
```

### Performance Optimization
```
Caching Strategy:
- Redis cache for scan results (24 hours)
- CDN for static assets (Cloudflare)
- Database query optimization
- Lazy loading for reports
- Image optimization

Scaling Preparation:
- Horizontal scaling ready
- Database replication
- Queue distribution
- Load balancer setup
```

---

## Phase 6: Complete Framework (June - August 2026)

### Final 48 Factors Implementation
```
June (24 factors):
- Advanced AI signals
- Semantic analysis
- Entity recognition
- Knowledge graph optimization

July-August (24 factors):
- Multimodal optimization
- Video/audio factors
- Interactive content
- Future-proofing factors
```

### White-Label Platform
```
Agency Features:
- Custom domain (scan.agencyname.com)
- Custom branding throughout
- Client management portal
- Sub-accounts for clients
- Agency dashboard
- Margin controls

Pricing Model:
- $497/month for white-label
- Revenue share option
- Volume discounts
```

### Enterprise Features
```
Security & Compliance:
- SSO integration (SAML, OAuth)
- SOC 2 compliance
- GDPR compliance tools
- Data retention policies
- Audit logs
- Role-based access control

SLA & Support:
- 99.9% uptime guarantee
- Priority support queue
- Dedicated account manager
- Custom training materials
```

---

## Knowledge Base Value Delivery

### How We Use the Data
```
For Individual Users:
- "Your score is 67, industry average is 54"
- "You rank #127 out of 523 professional services sites"
- "Sites that improved from your level typically focused on X"
- "Top performers in your industry do these 5 things"

For Product Development:
- Identify most common issues to prioritize features
- Understand which factors actually correlate with success
- Adjust scoring weights based on real impact
- Create industry-specific recommendations

For Business Development:
- Industry reports to attract new users
- Case studies from anonymous success stories
- Content marketing based on real patterns
- Partnership opportunities with underperforming industries
```

### Baseline & Progress Tracking Features
```
User Dashboard Showing:
- Initial baseline score (locked in on first scan)
- Current score
- Improvement percentage
- Time since baseline
- Progress chart over time
- Milestone achievements

Automated Alerts:
- "Your score improved by 10 points!"
- "You've declined below your baseline"
- "You're now in the top 25% of your industry"
- "3 competitors just passed you"

Progress Reports:
- Monthly progress email
- Quarterly deep dive analysis
- Annual optimization review
- Share-worthy achievement badges
```

## Ongoing Business Operations

### Weekly Recurring Tasks
```
Monday: 
- Review user signups from Zoho CRM
- Check system performance metrics
- Review support tickets

Wednesday:
- Send progress email to active users
- Update feature flags for A/B tests
- Review scan completion rates

Friday:
- Generate weekly metrics report
- Plan next week's development
- Update roadmap based on feedback
```

### Monthly Business Tasks
```
- Zoho Campaigns performance review
- Churn analysis and outreach
- Competitor analysis update
- Infrastructure cost review
- User feedback synthesis
- Roadmap prioritization
```

### Metrics That Actually Matter
```
Technical:
- Scan completion rate (target: >95%)
- Average scan time (target: <45 seconds)
- API uptime (target: 99.9%)
- Support ticket resolution (target: <24 hours)

Business:
- Free to paid conversion (track weekly)
- Churn rate by cohort
- Feature adoption rates
- NPS score from actual users
- Cost per scan (infrastructure)
```

---

## Resource Reality Check

### What This Actually Requires
```
Immediate (Solo):
- 40 hours/week development
- 10 hours/week support & operations
- $500/month infrastructure (Railway, Redis, etc.)

3 Months (Need Help):
- Part-time developer for integrations
- VA for support tickets
- Designer for report templates

6 Months (Small Team):
- Full-time developer
- Part-time customer success
- Marketing contractor
```

### Infrastructure Costs (Monthly)
```
Current:
- Supabase: $25
- Netlify: $19
- Domain: $15
Total: ~$60/month

After Railway Migration:
- Railway: $20-100 (scales with usage)
- Supabase (database only): $25
- Redis: $10
- Cloudflare: $20
- Zoho: $50
- Monitoring: $20
Total: ~$150-250/month

At Scale (1000+ users):
- Infrastructure: $500-1000
- Third-party APIs: $200
- Support tools: $100
Total: ~$800-1300/month
```

---

## What We're NOT Building (And Why)

- **AI Content Generator**: Focus on optimization, not creation
- **Keyword Research**: That's traditional SEO
- **Backlink Analysis**: Not relevant for AI optimization
- **Social Media Scheduler**: Different product entirely
- **Website Builder**: Stay focused on analysis

---

## Next 30 Days: Specific Deliverables

### Week 1 (Aug 15-22): Railway Migration
- [ ] Set up Railway account
- [ ] Deploy backend application
- [ ] Migrate scan logic from Edge Functions
- [ ] Test with 10 real scans

### Week 2 (Aug 23-29): Admin Panel
- [ ] Build basic admin dashboard
- [ ] User table with key metrics
- [ ] Manual user management
- [ ] Export functionality

### Week 3 (Aug 30 - Sep 5): Zoho Integration
- [ ] Connect Zoho CRM API
- [ ] Set up user sync
- [ ] Create email automation
- [ ] Test full flow

### Week 4 (Sep 6-15): Factor Expansion
- [ ] Implement 10 new factors
- [ ] Update scoring algorithm
- [ ] Test accuracy
- [ ] Deploy to production

This is the real roadmap. Specific features, actual infrastructure work, real business value.