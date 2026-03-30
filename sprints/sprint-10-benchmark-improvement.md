# Sprint 10: Benchmark Improvement — Rank #6 to Top 3

## Status: Planning

## Goal

Move AI Search Mastery ecosystem from Rank #6 (Score 6.8) to Top 3 (Score 7.5+) on AI Search Arena by systematically improving the 9 weakest benchmark dimensions across all products. Multi-phase initiative spanning ~22 weeks across AImpactScanner, LLM.txt Mastery, AImpactMonitor (new), and shared API infrastructure.

## Context

- Brief: `docs/Documents/Ideation/benchmark-improvement-brief.md`
- Current rank: #6 (composite score 6.8)
- Target: Top 3 (score 7.5+)
- Products: AImpactScanner, LLM.txt Mastery, AImpactMonitor (new)

## Benchmark Dimension Targets

| Dimension | Current | Target | Primary Tasks |
|-----------|---------|--------|---------------|
| ROI Attribution | 4.3 | 7.5 | AM-1, AM-2 |
| API Quality | 4.4 | 7.5 | API-1, API-2 |
| Integration Ecosystem | 5.2 | 7.5 | API-3 |
| Multimodal Content Support | 5.2 | 7.5 | AS-1, AS-2 |
| Readability Optimization | 5.9 | 7.5 | AS-1, AS-3 |
| AI Search Analytics Depth | 6.4 | 8.0 | AM-1, LT-3 |
| Schema Markup Support | 6.5 | 8.0 | AS-2 |
| Structured Data Validation | 6.5 | 8.0 | AS-2 |
| llms.txt Generation | 3.1 | 8.0 | LT-1, LT-2, LT-2B |

## Expected Score Progression

| Phase | Timeline | Composite Score | Rank | Key Unlock |
|-------|----------|----------------|------|------------|
| Baseline | Now | 6.8 | #6 | — |
| Phase 1 | Weeks 1–3 | 7.1 | #5 | Schema + llms.txt quick wins |
| Phase 2 | Weeks 4–8 | 7.35 | #4 | Prescriptive scanner + llms.txt moat |
| Phase 3 | Weeks 9–14 | 7.55 | #3 | Platform (API) |
| Phase 4 | Weeks 15–22 | 7.8+ | #2 | ROI attribution + integrations |

---

## Phase 1: Housekeeping Quick Wins (Weeks 1–3)

> Score: 6.8 → 7.1. Low-effort, high-signal improvements to domain hygiene and llms.txt presence.

### AS-5: AImpactScanner Domain-Level Housekeeping
**Priority**: HIGH (quick win)
**Dimensions**: llms.txt Generation (indirect), Integration Ecosystem (indirect)

- [x] Create `/llms.txt` for aimpactscanner.com — describe scanner, 27 factors, 8 pillars, methodology, pricing, API endpoints — ✅ 2026-03-28
- [x] Create `/llms-full.txt` — full markdown documentation version (7.9KB) — ✅ 2026-03-28
- [x] Update `robots.txt` — add `Llms-Txt: /llms.txt` directive — ✅ 2026-03-28
- [x] Add `<link rel="alternate" type="text/plain" href="/llms.txt">` to HTML `<head>` on all pages — ✅ 2026-03-28
- [x] Verify pricing displays $19.95/mo correctly across all plan references — ✅ 2026-03-28 (confirmed in PriceSection.jsx)
- [x] Add footer link to aisearchmastery.com — ✅ Already existed (Footer.jsx line 131)

**Acceptance**: Both files accessible at root URLs, robots.txt updated, link tag in page source, pricing consistent, footer link functional.

---

### LT-4: LLM.txt Mastery Domain-Level Housekeeping
**Priority**: HIGH (quick win)
**Dimensions**: llms.txt Generation (indirect)

- [x] Create `/llms.txt` for llmtxtmastery.com — ✅ Done separately
- [x] Create `/llms-full.txt` — ✅ Done separately
- [x] Update `robots.txt` — ✅ Done separately
- [x] Add `<link>` tag to HTML `<head>` — ✅ Done separately
- [x] Add footer link to aisearchmastery.com — ✅ Done separately

**Note**: LT-4 completed in separate repo (`/Users/jamiewatters/DevProjects/llm-txt-mastery`).

---

## Phase 2: Core Product Improvements (Weeks 4–8)

> Score: 7.1 → 7.35. Major feature additions driving the largest score jumps across multiple dimensions.

### AS-1: "Fix This" Action Lists
**Priority**: HIGH — single highest-leverage product change
**Dimensions**: Multimodal Content Support (5.2→7.0), Readability Optimization (5.9→7.5)
**Weighted Impact**: 0.178

- [x] Generate prioritised action list per scan finding with: what to fix, why it matters, expected impact (High/Medium/Low), implementation guidance — ✅ 2026-03-29
- [x] Implement action types:
  - [x] Missing alt text → suggested alt text based on page context
  - [x] Poor readability → rewritten sentence/paragraph suggestions
  - [x] Missing schema markup → ready-to-paste JSON-LD (see AS-2)
  - [x] No llms.txt → link to LLM.txt Mastery with pre-filled URL
  - [x] Missing meta descriptions → suggested meta description text
  - [x] Poor heading structure → recommended heading hierarchy
  - [x] Missing FAQ markup → extracted Q&A pairs as FAQ schema
  - [x] No structured data → applicable schema types with generated code
- [x] Make all fixes page-specific (not generic templates) — ✅ 2026-03-29
- [x] Add sortable-by-impact ordering (High → Low) — ✅ 2026-03-29
- [x] Add copy button on all code snippets (schema, meta tags, alt text) — ✅ 2026-03-29

**Acceptance**: Every scan finding has at least one actionable fix. Fixes specific to scanned page. Action list sortable by impact. Copy buttons on all code output.

---

### AS-2: Schema Generation & Validation Engine
**Priority**: HIGH
**Depends on**: AS-1 (action list framework)
**Dimensions**: Schema Markup Support (6.5→8.0), Structured Data Validation (6.5→8.0)
**Weighted Impact**: 0.175

- [x] **Schema detection** — identify existing schema types on page during scan (JSON-LD, Microdata, RDFa) — ✅ 2026-03-29
- [x] **Schema generation** — produce ready-to-paste JSON-LD for 7+ types:
  - [x] `FAQPage` — extract Q&A patterns from content
  - [x] `HowTo` — extract step-by-step instructions
  - [x] `Article` — pull title, author, dates, description
  - [x] `Product` — extract name, description, price, availability
  - [x] `Organization` — company name, logo, social links
  - [x] `BreadcrumbList` — generate from URL structure
  - [x] `WebSite` with `SearchAction` — for homepages
- [x] **Schema validation** — validate against Google Rich Results requirements:
  - [x] Missing required fields
  - [x] Invalid values
  - [x] Deprecated types
  - [x] Recommended but optional fields (opportunities)
- [x] **Schema completeness score** — percentage of applicable schema types implemented — ✅ 2026-03-29
- [x] Surface schema issues in AS-1 action lists with copy-paste fixes — ✅ 2026-03-29

**Acceptance**: Generated schema validates against Google Rich Results Test. 7+ schema types supported. Validation goes beyond syntax. Completeness score shown in scan results.

---

### LT-1: Deep Spec Compliance Validation
**Note**: Separate repo (`/Users/jamiewatters/DevProjects/llm-txt-mastery`). Not tracked here.

---

### LT-2: Multi-Format Generation
**Note**: Separate repo (`/Users/jamiewatters/DevProjects/llm-txt-mastery`). Not tracked here.

---

### LT-2B: Deployment Guidance & Discovery Mechanisms
**Note**: Separate repo (`/Users/jamiewatters/DevProjects/llm-txt-mastery`). Not tracked here.

---

## Phase 3: Readability + Drift + API Platform (Weeks 9–14)

> Score: 7.35 → 7.55. Add readability scoring, drift monitoring, and launch the public API.

### AS-3: AI-Focused Readability Scoring
**Priority**: MEDIUM
**Dimensions**: Readability Optimization (5.9→7.5)
**Weighted Impact**: 0.044 (incremental on AS-1)

- [x] Implement 7-factor AI readability analysis:
  - [x] Sentence clarity — avg sentence length, passive voice %, jargon density
  - [x] Term consistency — same concept referenced by different names
  - [x] Logical flow — heading hierarchy follows content structure
  - [x] Chunking quality — scannable sections with clear topics
  - [x] Definition coverage — technical terms defined on first use
  - [x] Claim-evidence pairing — claims followed by supporting data
  - [x] Answer-engine formatting — content structured as direct answers
- [x] Calculate composite AI readability score (0-100) — ✅ 2026-03-29
- [x] Display per-factor breakdown with individual scores — ✅ 2026-03-29
- [x] Generate top 3 improvement suggestions with concrete rewrite examples — ✅ 2026-03-29
- [x] Build before/after preview for suggested rewrites — ✅ 2026-03-29
- [x] Integrate into scan results dashboard — ✅ 2026-03-29

**Acceptance**: Score correlates with AI model comprehension. Rewrites maintain original meaning. Scoring methodology documented and transparent.

---

### LT-3: Drift Monitoring
**Note**: Separate repo (`/Users/jamiewatters/DevProjects/llm-txt-mastery`). Not tracked here.

---

### API-1: REST API v1
**Priority**: HIGH
**Dimensions**: API Quality (4.4→7.0), Integration Ecosystem (5.2→7.5)
**Weighted Impact**: 0.208

- [x] Implement API endpoints:
  - [x] `POST /api/v1/scan` — submit URL for scanning, returns full results — ✅ 2026-03-29
  - [x] `GET /api/v1/scan/{id}` — retrieve scan results (factors, scores) — ✅ 2026-03-29
  - [x] `GET /api/v1/scan/{id}/actions` — get prioritised action list — ✅ 2026-03-29
  - [ ] `POST /api/v1/llmstxt/validate` — validate llms.txt content (deferred — LT product)
  - [ ] `POST /api/v1/llmstxt/generate` — generate llms.txt from URL (deferred — LT product)
  - [ ] `GET /api/v1/llmstxt/generate/{id}` — retrieve generated files (deferred — LT product)
  - [x] `POST /api/v1/schema/generate` — generate schema markup for URL — ✅ 2026-03-29
  - [x] `GET /api/v1/monitor/citations` — returns 501 placeholder — ✅ 2026-03-29
  - [x] `GET /api/v1/monitor/roi` — returns 501 placeholder — ✅ 2026-03-29
- [x] API key authentication — generate, revoke, rotate per user (Sprint 8) — ✅ Pre-existing
- [x] Tier-based rate limiting:
  - [x] Free: 10 calls/day
  - [x] Growth ($19.95/mo): 1,000 calls/day
  - [x] Enterprise (future): 10,000 calls/day
- [x] Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` — ✅ 2026-03-29
- [x] OpenAPI 3.0 specification published — ✅ `public/docs/openapi.yaml`
- [x] Interactive API documentation (Swagger UI) at `/docs/swagger.html` — ✅ 2026-03-29
- [x] Code examples in Python, JavaScript, cURL — ✅ In OpenAPI spec
- [x] Versioned URLs (`/api/v1/`) — ✅ 2026-03-29

**Acceptance**: All endpoints functional (monitor endpoints return 501 until Phase 4). API keys work. Rate limits enforced. OpenAPI spec valid. Swagger UI accessible. Code examples execute correctly.

---

### API-2: Webhooks
**Priority**: HIGH
**Depends on**: API-1
**Dimensions**: API Quality, Integration Ecosystem

- [x] Implement webhook event types:
  - [x] `scan.complete` — scan ID, scores, summary
  - [x] `llmstxt.drift_detected` — domain, drift details, suggested changes
  - [x] `monitor.citation_found` — platform, query, context, sentiment (Phase 4)
  - [x] `monitor.citation_lost` — platform, query (Phase 4)
- [x] HMAC-SHA256 signature verification on all payloads — ✅ 2026-03-29
- [x] Retry with exponential backoff (3 attempts, 1min/5min/30min) — ✅ 2026-03-29
- [x] Webhook management API — CRUD, test endpoint, delivery history — ✅ 2026-03-29
- [ ] Webhook management UI — frontend component (deferred to separate sprint)
- [x] Delivery logging with status codes and response times — ✅ 2026-03-29

**Acceptance**: Events fire on triggers. HMAC signatures validate. Failed deliveries retry. Management UI supports full CRUD. Monitor events activate in Phase 4.

---

## Phase 4: AImpactMonitor + Integrations (Weeks 15–22)

> Score: 7.55 → 7.8+. Launch AImpactMonitor and build integration ecosystem.

### AM-1: Citation Tracking Across AI Platforms
**Priority**: HIGH (largest weighted impact: 0.222)
**Product**: AImpactMonitor (new)
**Dimensions**: ROI Attribution (4.3→6.5), AI Search Analytics Depth (6.4→8.0)

- [x] Build citation tracking engine for 5 AI platforms:
  - [x] ChatGPT — periodic query sampling for target keywords
  - [x] Perplexity — query sampling + citation link extraction
  - [x] Claude — periodic query sampling
  - [x] Gemini — periodic query sampling
  - [x] Microsoft Copilot — periodic query sampling
- [x] Citation data captured per result: citation yes/no, position, context quote, sentiment — ✅ 2026-03-29
- [x] Dashboard API:
  - [x] Citation volume — total per day/week/month
  - [x] Platform breakdown — which AI platforms cite most
  - [x] Trend line — volume over time
  - [x] Query map — queries that trigger citations, grouped by topic
  - [x] Sentiment — positive/neutral/negative breakdown
  - [x] Accuracy — flag incorrect citations for review
- [x] Alert system — citation change detection (new/lost) — ✅ 2026-03-29
- [x] Activate API-1 monitor endpoints and API-2 monitor webhooks — ✅ 2026-03-29

**Note**: Uses SimulatedAdapter for MVP — real platform API adapters to be swapped in when available. Monitor dashboard frontend deferred.

**Acceptance**: Tracking operational on minimum 3 platforms at launch. Dashboard updates daily. Historical data retained 90+ days. Alerts configurable. Export to CSV/PDF.

---

### AM-2: ROI Attribution Framework
**Priority**: HIGH
**Depends on**: AM-1 (citation data)
**Dimensions**: ROI Attribution (6.5→7.5)
**Weighted Impact**: 0.074

- [x] Attribution pipeline:
  - [x] Citations → Traffic — estimate AI-referred visits (configurable multiplier)
  - [x] Traffic → Conversions — conversion rate estimation (configurable)
  - [x] Conversions → Revenue — avg deal value × conversions
- [x] ROI Dashboard API:
  - [x] Monthly AI Search ROI summary with trend data
  - [x] 6-month trend chart data
  - [x] ROI calculator: subscription cost vs AI-attributed revenue
  - [x] Monthly report data (JSON, PDF generation client-side)
- [x] Analytics provider config (GA4, Plausible, manual) — ✅ 2026-03-29
- [x] Transparent methodology with confidence levels (high/estimated/directional) — ✅ 2026-03-29
- [x] Activate API-1 ROI endpoint — ✅ 2026-03-29

**Note**: GA4/Plausible integration stores config but uses estimation model for MVP. Real analytics data import to follow.

**Acceptance**: ROI figure calculated and displayed. Methodology documented and transparent. Monthly PDF exportable. Works with GA4 and Plausible. Even approximate/estimated model is valuable — be clear about confidence levels.

---

### AM-3: Competitive Citation Intelligence
**Priority**: LOW (premium feature)
**Depends on**: AM-1
**Dimensions**: AI Search Analytics Depth (8.0→8.5)
**Weighted Impact**: 0.015

- [x] Track competitor domain citations alongside user's own (up to 5 competitors) — ✅ 2026-03-29
- [x] Share of voice — % of AI responses citing user vs competitors per keyword group — ✅ 2026-03-29
- [x] Gap analysis — queries where competitors cited but user is not — ✅ 2026-03-29
- [x] Opportunity report — scored gaps with summary — ✅ 2026-03-29
- [ ] Weekly competitive intelligence email digest (deferred — needs email infrastructure)

**Acceptance**: Track up to 5 competitors. Share of voice per keyword group. Weekly digest actionable.

---

### AS-4: Competitive Benchmarking
**Priority**: LOW
**Tier**: Growth only
**Dimensions**: AI Search Analytics Depth (6.4→7.5)
**Weighted Impact**: 0.028

- [x] Accept competitor URL alongside user's URL during scan — ✅ 2026-03-29
- [x] Run same 27-factor analysis on both URLs (parallel) — ✅ 2026-03-29
- [x] Side-by-side comparison with visual indicators (green = ahead, red = behind) — ✅ 2026-03-29
- [x] Score delta per factor with "close the gap" recommendations — ✅ 2026-03-29
- [x] Historical tracking — comparison history stored for 30+ days — ✅ 2026-03-29
- [x] Growth tier only — free users see teaser with upgrade CTA — ✅ 2026-03-29

**Acceptance**: Comparison renders clearly. History shows 30+ days of trends. Growth tier gated with free tier teaser.

---

### API-3: Integrations
**Priority**: MEDIUM
**Depends on**: API-1, API-2
**Dimensions**: Integration Ecosystem (5.2→7.5)

Build in priority order:

- [x] **Zapier** — trigger polling endpoints (scan-complete, citation-found) + scan action — ✅ 2026-03-29
- [x] **Slack** — webhook configuration, Block Kit formatted notifications, test endpoint — ✅ 2026-03-29
- [ ] **WordPress plugin** — one-click scan, schema insertion, llms.txt deployment (deferred — separate project)
- [ ] **Google Search Console** — import organic search data (deferred — needs OAuth flow)
- [ ] **Google Analytics** — real GA4 data import (deferred — estimation model in place via AM-2)
- [x] **GitHub Action** — CI/CD validate endpoint with pass/fail and min_score threshold — ✅ 2026-03-29

**Acceptance**: Each integration functional with documented setup. Zapier published to marketplace. WordPress plugin installable from WP admin.

---

## Dependencies Graph

```
Phase 1 (no dependencies):
  AS-5, LT-4

Phase 2 (internal):
  AS-1 → AS-2 (action lists before schema engine)
  LT-1 → LT-2 → LT-2B (validation → generation → deployment)

Phase 3 (cross-phase):
  API-1 → API-2 (API before webhooks)
  AS-3, LT-3 (independent)

Phase 4 (cross-phase):
  AM-1 → AM-2 (citations before ROI)
  AM-1 → AM-3 (citations before competitive intel)
  API-1 + API-2 → API-3 (platform before integrations)
  AM-1 activates API-1 monitor endpoints + API-2 monitor webhooks
```

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| AM-1 citation tracking blocked by AI platform ToS | HIGH | Abstract platform adapters, monitor ToS, fallback strategies |
| Phase 4 scope too large for timeline | MEDIUM | AM-3 and AS-4 are LOW priority — defer if behind |
| API rate limiting complexity across products | MEDIUM | Shared rate limit middleware, unified API key system |
| llms.txt spec evolves during implementation | LOW | LT-1 validation modular, spec changes absorbed in rules |
| GA4/Plausible integration auth complexity | MEDIUM | Start with Plausible (simpler API), GA4 as stretch |

## Strategic Notes

1. **llms.txt is our moat** — nobody scores above 3.1. Pushing to 8.0 creates 5+ point lead. Prioritise LT-1 and LT-2.
2. **"Fix This" is highest-leverage scanner change** — transforms diagnostic to prescriptive, moves two dimensions.
3. **ROI Attribution is hardest but highest ceiling** (0.222 weighted impact). Even approximate model beats competitors.
4. **API unlocks everything** — integrations, webhooks, competitive intel all depend on API-1.

## Files Created/Modified

### Phase 1 (2026-03-28)
| File | Type | Description |
|------|------|-------------|
| `public/llms.txt` | Modified | Updated with accurate pricing, 8 pillars, ecosystem links |
| `public/llms-full.txt` | Created | Full product documentation (7.9KB) |
| `public/robots.txt` | Modified | Added `Llms-Txt:` directive |
| `index.html` | Modified | Added `<link>` discovery tag for llms.txt |

### Phase 2 (2026-03-29)
| File | Type | Description |
|------|------|-------------|
| `backend/src/services/analyzer/actionItems.ts` | Created | Action items generator — 16 factor types, structured fixes (27KB) |
| `backend/src/services/analyzer/schemaGenerator.ts` | Created | Schema detection, generation (7 types), validation engine (25KB) |
| `backend/src/routes/analyze.ts` | Modified | Integrated action items + schema analysis into response |
| `src/components/ActionItemsPanel.jsx` | Created | Fix This UI — sortable, filterable, copy buttons (14KB) |
| `src/components/SimpleResultsDashboard.jsx` | Modified | Integrated ActionItemsPanel component |

### Phase 3 (2026-03-29)
| File | Type | Description |
|------|------|-------------|
| `backend/src/services/analyzer/readabilityScorer.ts` | Created | 7-factor AI readability scoring engine (25KB) |
| `backend/src/routes/apiV1.ts` | Created | REST API v1 — 6 endpoints with rate limiting (19KB) |
| `backend/src/services/webhooks.ts` | Created | Webhook service — HMAC signing, delivery, retry (15KB) |
| `backend/src/routes/webhooks.ts` | Created | Webhook management API — 7 CRUD endpoints (9.4KB) |
| `backend/src/index.ts` | Modified | Registered API v1 and webhook routes |
| `backend/src/routes/analyze.ts` | Modified | Added readability scoring to response |
| `supabase/migrations/20260329000001_create_webhooks.sql` | Created | Webhooks + deliveries tables with RLS (2.4KB) |
| `public/docs/openapi.yaml` | Created | OpenAPI 3.0.3 specification — 13 endpoints |
| `public/docs/swagger.html` | Created | Interactive Swagger UI documentation page |
| `src/components/ReadabilityPanel.jsx` | Created | AI readability score display with before/after previews |
| `src/components/SimpleResultsDashboard.jsx` | Modified | Integrated ReadabilityPanel component |

### Phase 4 (2026-03-29)
| File | Type | Description |
|------|------|-------------|
| `backend/src/services/citationTracker.ts` | Created | Citation tracking engine — 5 platforms, adapter pattern, sentiment analysis |
| `backend/src/routes/monitor.ts` | Created | Monitor API — 7 endpoints for citation config/summary/history |
| `backend/src/services/roiAttribution.ts` | Created | ROI attribution — citations→traffic→conversions→revenue pipeline |
| `backend/src/routes/roi.ts` | Created | ROI API — 5 endpoints for config/summary/attribution/report |
| `backend/src/services/competitiveCitations.ts` | Created | Competitive citations — share of voice, gap analysis, opportunities |
| `backend/src/routes/competitive.ts` | Created | Competitive API — 6 endpoints for competitors/SOV/gaps/report |
| `backend/src/routes/compare.ts` | Created | Comparison API — side-by-side 27-factor analysis with deltas |
| `backend/src/routes/integrations.ts` | Created | Integrations API — Zapier triggers/actions, Slack webhooks, GitHub CI |
| `src/components/CompetitorComparisonPanel.jsx` | Created | Competitive benchmarking UI with teaser for free users |
| `backend/src/routes/apiV1.ts` | Modified | Activated monitor/citations and monitor/roi endpoints |
| `backend/src/index.ts` | Modified | Registered monitor, compare, roi, competitive, integrations routes |
| `supabase/migrations/20260329000002_create_monitor.sql` | Created | Monitor configs + citations tables with RLS |
| `supabase/migrations/20260329000003_create_comparisons.sql` | Created | Comparisons table with RLS |
| `supabase/migrations/20260329000004_create_roi.sql` | Created | ROI configs + attribution data tables with RLS |
| `supabase/migrations/20260329000005_create_competitive_integrations.sql` | Created | Competitor configs, competitor citations, Slack configs with RLS |
