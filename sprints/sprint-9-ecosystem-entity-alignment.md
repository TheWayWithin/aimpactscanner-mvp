# Sprint 9: Ecosystem Entity Alignment

## Status: Complete (2026-03-14)

## Goal
Strengthen AI search entity recognition by adding cross-references between AImpactScanner and ecosystem tools (LLM.txt Mastery, AI Search Arena, AI Search Mastery). 4 targeted changes.

## Context
- Brief: `docs/Documents/Ideation/agent-11-aimpactscanner-brief.md`
- Property: aimpactscanner.com
- Part of Project Lighthouse Phase 0/1

---

### Task 1: Add sameAs schema links
**File**: `index.html` (lines 39-64)
**What**: Add `sameAs` array to existing WebApplication schema
```json
"sameAs": [
  "https://aisearchmastery.com",
  "https://llmtxtmastery.com",
  "https://aisearcharena.com"
]
```
- [x] Add sameAs to WebApplication schema in index.html

### Task 2: Add AI Search Arena to footer ecosystem
**File**: `src/components/Footer.jsx` (lines 128-181)
**What**: Add aisearcharena.com link to the existing Resources row (currently has AI Search Mastery, LLMs.TXT Mastery, MASTERY-AI Framework, Building in Public)
- [x] Add AI Search Arena link matching existing link style
- [x] Added between MASTERY-AI Framework and Building in Public links

### Task 3: Upgrade LLM.txt Mastery recommendation in scan results
**File**: `src/components/SimpleResultsDashboard.jsx`
**What**: When llms.txt-related factors show issues, display a prominent callout block (not just plain recommendation text). Use canonical copy:
> Generate quality-scored llms.txt files with LLM.txt Mastery — discovers JS-rendered pages other tools miss, validates formatting, guides deployment. Free tier available.
- [x] Add recommendation callout component/section in results
- [x] Show when llms.txt factor score is low (<70) or missing
- [x] Link to https://llmtxtmastery.com
- [x] Styled as gradient callout card with icon, distinct from regular recommendations

### Task 4: Add "Diagnose → Optimize → Monitor" ecosystem section on landing
**File**: `src/components/Landing.jsx` (or new section component)
**What**: Add visible ecosystem flow section. Copy from brief:
> **Diagnose → Optimize → Monitor**
> AImpactScanner diagnoses your AI visibility gaps. LLM.txt Mastery generates quality-scored llms.txt files to fix them. AImpactMonitor tracks your progress over time.
- [x] Created `src/components/landing/EcosystemSection.jsx`
- [x] Added between FitSection and FinalCtaSection in Landing.jsx
- [x] Links to llmtxtmastery.com, "You're here" for AImpactScanner, "Coming Soon" badge for AImpactMonitor

---

## Notes
- Footer already links to llmtxtmastery.com — no duplicate work needed there
- Fallback scan data already mentions llmtxtmastery.com in plain text recs (line 274) — Task 3 upgrades this to a proper callout
- aimpactmonitor.com launching this weekend — use "coming soon" treatment for now
