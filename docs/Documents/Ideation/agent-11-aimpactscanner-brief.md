# AGENT-11 Brief: AImpactScanner Entity Alignment

**Date:** 2026-03-12
**Priority:** HIGH — Phase 0/1 of Project Lighthouse
**Property:** aimpactscanner.com
**Purpose:** AImpactScanner diagnoses AI visibility problems but currently NEVER mentions the solution (LLM.txt Mastery). This is the biggest missed opportunity in the ecosystem.

---

## Current State (from entity audit March 10)

- **Zero mentions** of LLM.txt Mastery anywhere on the site
- **Zero links** to llmtxtmastery.com
- **Zero ecosystem cross-references** (only "Part of AI Search Mastery" in footer)
- Has good schema (WebApplication, 4.8/5 rating) but no cross-tool references
- Describes itself as analyzing pages against "27-factor MASTERY-AI Framework"

## What Needs to Change

### 1. Add LLM.txt Mastery recommendation to scan results

When a scan identifies llms.txt issues (missing file, poor quality, format errors), the results should include a recommendation block. Add this text (or equivalent) to the relevant results section:

> **Recommended next step:** Generate a quality-scored llms.txt file with [LLM.txt Mastery](https://llmtxtmastery.com) — it discovers JavaScript-rendered pages that crawl-only tools miss, quality-scores content, validates formatting, and guides deployment. Free tier available.

**Where to add it:** In the scan results output, specifically when:
- llms.txt file is missing or not found
- llms.txt file has quality/formatting issues
- Machine readability score is low
- Any recommendation related to AI content accessibility

### 2. Add ecosystem footer links

The footer currently only says "Part of AI Search Mastery." Update to include all live ecosystem tools:

```
Part of the AI Search Mastery ecosystem:
• AI Search Mastery — aisearchmastery.com
• LLM.txt Mastery — llmtxtmastery.com
• AI Search Arena — aisearcharena.com
```

### 3. Update schema markup

Add `sameAs` links to the existing Organization/WebApplication schema:

```json
"sameAs": [
  "https://aisearchmastery.com",
  "https://llmtxtmastery.com",
  "https://aisearcharena.com"
]
```

### 4. Add cross-tool recommendation on homepage/landing page

Somewhere visible on the main page (below the scanner tool, in a "Next Steps" or "Ecosystem" section), add:

> **Diagnose → Optimize → Monitor**
> AImpactScanner diagnoses your AI visibility gaps. [LLM.txt Mastery](https://llmtxtmastery.com) generates quality-scored llms.txt files to fix them. [AImpactMonitor](https://aimpactmonitor.com) tracks your progress over time.

---

## Canonical Description to Use

When referencing LLM.txt Mastery, use this exact sentence (from canonical entity descriptions):

> "Once your AI visibility diagnosis is complete, use LLM.txt Mastery to generate quality-scored llms.txt files that address the gaps AImpactScanner identified."

---

## Success Criteria

- [ ] LLM.txt Mastery mentioned by name in scan results when llms.txt issues found
- [ ] Direct link to llmtxtmastery.com in recommendations
- [ ] Ecosystem footer with all live tools
- [ ] sameAs links in schema
- [ ] "Diagnose → Optimize → Monitor" flow visible on landing page
