# Linked Transparency Detection Architecture
*Version: 1.0 | Date: 2025-10-08 | Architect: THE ARCHITECT*

## Executive Summary

**Mission**: Design technical architecture for awarding partial credit when homepage links to transparency pages (About, Privacy, Disclosure).

**Business Impact**: High - Resolves user frustration when transparency content exists on linked pages but not directly on homepage.

**Complexity**: Low - Single function addition using existing link parsing patterns

**Performance Impact**: <50ms additional processing time

**Backward Compatibility**: 100% - No regressions on existing scores

---

## Table of Contents
1. [Context & Requirements](#context--requirements)
2. [Architecture Design](#architecture-design)
3. [Function Specifications](#function-specifications)
4. [Integration Plan](#integration-plan)
5. [Scoring Logic](#scoring-logic)
6. [Edge Cases & Validation](#edge-cases--validation)
7. [Performance Analysis](#performance-analysis)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Context & Requirements

### Problem Statement
Users add transparency content to `/about/` pages but scan homepage. Algorithm scores homepage low because content not detected directly on page. Users report frustration: "Added content but score unchanged."

**Current Behavior**:
- freecalchub.com (homepage): 45/100 (methodology + updates only)
- freecalchub.com/about/ (about page): 100/100 (all transparency criteria met)
- User scans homepage → sees 45/100 → frustrated despite perfect about page

**Desired Behavior**:
- Detect transparency page links on homepage
- Award partial credit (e.g., 40/100) for having transparency links
- Recommend scanning linked pages for complete assessment
- Maintain full score (100/100) when content directly on page

### Business Requirements
1. Award partial credit for transparency page links (not full credit)
2. Provide clear recommendations to scan linked pages
3. Never reduce existing scores (backward compatible)
4. Support common transparency page patterns
5. Distinguish between internal and external transparency links

### Technical Requirements
1. Use EXACT same link parsing pattern as existing code (lines 1214-1230)
2. No new dependencies or libraries
3. Performance impact <50ms
4. Maintain existing TypeScript interfaces
5. Clear evidence messages for debugging

### Success Criteria
- ✅ Uses identical regex pattern as existing link detection
- ✅ No new HTML parsing approaches
- ✅ Performance <50ms additional processing
- ✅ Backward compatible (no score regressions)
- ✅ Handles all edge cases gracefully
- ✅ Clear, actionable recommendations

---

## Architecture Design

### Design Principles

#### 1. Follow Existing Patterns (MANDATORY)
The codebase already has a proven link detection pattern at lines 1214-1230. We MUST use this exact approach to maintain consistency and avoid introducing new parsing methods.

**Existing Pattern**:
```typescript
const allLinks = pageContent.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
const uniqueLinks = new Set<string>();

for (const link of allLinks) {
  const hrefMatch = link.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    const href = hrefMatch[1];
    uniqueLinks.add(href);

    // Check if external link
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const linkUrl = new URL(href);
      const pageUrl = new URL(url);
      if (linkUrl.hostname !== pageUrl.hostname) {
        // External link
      }
    }
  }
}
```

#### 2. Simple > Complex
- Single focused function with clear responsibility
- No machine learning or NLP complexity
- Pattern matching sufficient for 95% of cases
- Easy to understand, test, and maintain

#### 3. Security First
- No additional HTTP fetches (use existing HTML)
- No XSS risk (pattern matching only, no eval/exec)
- No external dependencies
- URL validation for safety

#### 4. Performance Conscious
- Regex compiled once, reused
- Single pass through link list
- Set-based deduplication
- Early exit patterns
- Target: <50ms total execution time

#### 5. Backward Compatible
- Pages with full transparency content still score 100/100
- Pages with no links never score worse
- Evidence/recommendation format unchanged
- Database schema unchanged

---

## Function Specifications

### Function 1: `detectTransparencyLinks()`

**Purpose**: Detect internal links to transparency-related pages

**Location**: Insert after line 913 (before `analyzeTransparencyDisclosure`)

**Function Signature**:
```typescript
interface TransparencyLinks {
  links: string[];           // All detected transparency links
  aboutLink: string | null;  // First about page link found
  privacyLink: string | null; // First privacy page link found
  disclosureLink: string | null; // First disclosure page link found
  transparencyLink: string | null; // First transparency page link found
  termsLink: string | null; // First terms page link found
  count: number;             // Total unique transparency links
}

function detectTransparencyLinks(content: string, baseUrl: string): TransparencyLinks {
  // Implementation details below
}
```

**Implementation**:
```typescript
function detectTransparencyLinks(content: string, baseUrl: string): TransparencyLinks {
  const startTime = Date.now();

  // Initialize return structure
  const result: TransparencyLinks = {
    links: [],
    aboutLink: null,
    privacyLink: null,
    disclosureLink: null,
    transparencyLink: null,
    termsLink: null,
    count: 0
  };

  try {
    // Parse base URL for hostname comparison
    const pageUrl = new URL(baseUrl);

    // Extract all links using EXACT same pattern as lines 1214-1230
    const allLinks = content.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    const uniqueTransparencyLinks = new Set<string>();

    // Transparency path patterns (case-insensitive)
    const transparencyPatterns = {
      about: /^\/?(about|about-us|who-we-are|our-team|mission|company)(\/|$|\?|#)/i,
      privacy: /^\/?(privacy|privacy-policy|data-protection|gdpr)(\/|$|\?|#)/i,
      disclosure: /^\/?(disclosure|disclosures|disclaimer|disclaimers)(\/|$|\?|#)/i,
      transparency: /^\/?(transparency|openness|accountability)(\/|$|\?|#)/i,
      terms: /^\/?(terms|legal|terms-of-service|terms-and-conditions)(\/|$|\?|#)/i
    };

    // Process each link
    for (const link of allLinks) {
      // Extract href using same regex as existing code
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch || !hrefMatch[1]) continue;

      const href = hrefMatch[1];

      // Skip empty, anchor-only, or javascript: links
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        continue;
      }

      let isInternalTransparencyLink = false;
      let normalizedPath = '';

      // Check if absolute URL
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkUrl = new URL(href);

          // Only internal links (same hostname)
          if (linkUrl.hostname === pageUrl.hostname) {
            normalizedPath = linkUrl.pathname;
            isInternalTransparencyLink = true;
          }
        } catch (e) {
          // Invalid URL, skip
          continue;
        }
      } else if (href.startsWith('/')) {
        // Relative URL starting with /
        normalizedPath = href.split('?')[0].split('#')[0]; // Remove query and anchor
        isInternalTransparencyLink = true;
      } else if (!href.startsWith('http')) {
        // Relative URL without leading / (e.g., "about", "../about")
        // Normalize to absolute path
        if (href.startsWith('./')) {
          normalizedPath = '/' + href.substring(2);
        } else if (href.startsWith('../')) {
          // Skip complex relative paths for simplicity
          continue;
        } else {
          normalizedPath = '/' + href;
        }
        normalizedPath = normalizedPath.split('?')[0].split('#')[0];
        isInternalTransparencyLink = true;
      }

      if (isInternalTransparencyLink && normalizedPath) {
        // Check against transparency patterns
        let matched = false;

        if (transparencyPatterns.about.test(normalizedPath)) {
          uniqueTransparencyLinks.add(normalizedPath);
          if (!result.aboutLink) result.aboutLink = normalizedPath;
          matched = true;
        }

        if (transparencyPatterns.privacy.test(normalizedPath)) {
          uniqueTransparencyLinks.add(normalizedPath);
          if (!result.privacyLink) result.privacyLink = normalizedPath;
          matched = true;
        }

        if (transparencyPatterns.disclosure.test(normalizedPath)) {
          uniqueTransparencyLinks.add(normalizedPath);
          if (!result.disclosureLink) result.disclosureLink = normalizedPath;
          matched = true;
        }

        if (transparencyPatterns.transparency.test(normalizedPath)) {
          uniqueTransparencyLinks.add(normalizedPath);
          if (!result.transparencyLink) result.transparencyLink = normalizedPath;
          matched = true;
        }

        if (transparencyPatterns.terms.test(normalizedPath)) {
          uniqueTransparencyLinks.add(normalizedPath);
          if (!result.termsLink) result.termsLink = normalizedPath;
          matched = true;
        }
      }
    }

    // Populate results
    result.links = Array.from(uniqueTransparencyLinks);
    result.count = uniqueTransparencyLinks.size;

    const processingTime = Date.now() - startTime;
    console.log(`[detectTransparencyLinks] Found ${result.count} links in ${processingTime}ms`);

  } catch (error) {
    console.error('[detectTransparencyLinks] Error:', error);
    // Return empty result on error (graceful degradation)
  }

  return result;
}
```

**Key Design Decisions**:

1. **Exact Pattern Reuse**: Uses identical regex from lines 1214-1230
2. **Internal Links Only**: Filters out external transparency pages (not site's responsibility)
3. **Path Normalization**: Handles both absolute and relative URLs consistently
4. **Pattern Matching**: Regex patterns cover common transparency page naming conventions
5. **Graceful Degradation**: Try-catch ensures errors don't break factor analysis
6. **Performance Logging**: Tracks execution time for monitoring
7. **Categorized Links**: Stores first occurrence of each type for evidence/recommendations

---

## Integration Plan

### Integration Point: `analyzeTransparencyDisclosure()` Function

**Current Location**: Lines 914-986 in `/supabase/functions/analyze-page/index.ts`

**Integration Steps**:

#### Step 1: Add Function (Before Line 914)
Insert `detectTransparencyLinks()` function at line 913 (before `analyzeTransparencyDisclosure`).

#### Step 2: Modify Function Signature
Update `analyzeTransparencyDisclosure` to accept URL parameter:
```typescript
// BEFORE (line 915):
function analyzeTransparencyDisclosure(content: string): FactorResult {

// AFTER:
function analyzeTransparencyDisclosure(content: string, url: string): FactorResult {
```

#### Step 3: Call Detection Early
Add link detection at start of function (after line 920):
```typescript
function analyzeTransparencyDisclosure(content: string, url: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];

  // NEW: Detect transparency links
  const transparencyLinks = detectTransparencyLinks(content, url);

  // Existing transparency content checks...
  const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
  // ... rest of existing logic
}
```

#### Step 4: Update Scoring Logic
Modify base score calculation (around line 966-972):
```typescript
// BEFORE:
// Base transparency score
if (score === 0) {
  score = 15;
  recommendations.push('Implement basic transparency standards');
} else if (score < 30) {
  score += 10;
}

// AFTER:
// Base transparency score with link bonus
if (score === 0) {
  // No direct transparency content found
  if (transparencyLinks.count >= 2) {
    // Multiple transparency page links found
    score = 15 + 25; // Base + link bonus = 40
    evidence.push(`Transparency page links detected: ${transparencyLinks.links.join(', ')}`);
    recommendations.push(
      `Transparency information appears to be on linked pages. ` +
      `For a complete assessment, scan these pages: ${transparencyLinks.links.map(l => baseUrl.replace(/\/$/, '') + l).join(', ')}`
    );
  } else if (transparencyLinks.count === 1) {
    // Single transparency page link found
    score = 15 + 15; // Base + smaller bonus = 30
    evidence.push(`Transparency page link detected: ${transparencyLinks.links[0]}`);
    recommendations.push(
      `Limited transparency page link found. ` +
      `Scan this page for detailed transparency information: ${baseUrl.replace(/\/$/, '') + transparencyLinks.links[0]}`
    );
  } else {
    // No transparency content or links
    score = 15;
    recommendations.push('Implement basic transparency standards');
  }
} else if (score < 30) {
  // Partial transparency content found
  score += 10;

  // Bonus for having additional transparency links
  if (transparencyLinks.count >= 1) {
    score += 5; // Small bonus for links when some content exists
    evidence.push(`Additional transparency links found: ${transparencyLinks.links.join(', ')}`);
  }
}
```

#### Step 5: Update Function Call Site
Update call to `analyzeTransparencyDisclosure` to pass URL parameter (find where function is called, likely around line 1549):
```typescript
// BEFORE:
const transparencyResult = analyzeTransparencyDisclosure(content);

// AFTER:
const transparencyResult = analyzeTransparencyDisclosure(content, url);
```

---

## Scoring Logic

### Current Scoring Breakdown
```
Disclosure statements: 30 points
Funding information: 25 points
Methodology: 25 points
Update info: 20 points
Base score (nothing): 15 points
Partial bonus: 10 points
─────────────────────────────
Maximum possible: 100 points
```

### New Scoring Logic

#### Scenario 1: NO Direct Transparency Content

**Sub-scenario 1a: 2+ Transparency Links**
```
Base score: 15 points
Link bonus: 25 points
─────────────────────────────
Total: 40 points

Evidence: "Transparency page links detected: /about/, /privacy/"
Recommendation: "Transparency information appears to be on linked pages.
                 For a complete assessment, scan these pages:
                 https://example.com/about/, https://example.com/privacy/"
```

**Sub-scenario 1b: 1 Transparency Link**
```
Base score: 15 points
Link bonus: 15 points
─────────────────────────────
Total: 30 points

Evidence: "Transparency page link detected: /about/"
Recommendation: "Limited transparency page link found.
                 Scan this page for detailed transparency information:
                 https://example.com/about/"
```

**Sub-scenario 1c: 0 Transparency Links**
```
Base score: 15 points
─────────────────────────────
Total: 15 points

Recommendation: "Implement basic transparency standards"
```

#### Scenario 2: SOME Direct Transparency Content (Score < 30)

**Sub-scenario 2a: With Transparency Links**
```
Content score: 20-29 points (partial content detected)
Partial bonus: 10 points
Link bonus: 5 points
─────────────────────────────
Total: 35-44 points

Evidence: "Additional transparency links found: /about/, /privacy/"
```

**Sub-scenario 2b: Without Transparency Links**
```
Content score: 20-29 points
Partial bonus: 10 points
─────────────────────────────
Total: 30-39 points

(No link evidence added)
```

#### Scenario 3: FULL Direct Transparency Content (Score ≥ 30)

```
Content score: 30-100 points (based on detected criteria)
─────────────────────────────
Total: 30-100 points (no link bonus - not needed)

(Behavior unchanged from current implementation)
```

### Scoring Rationale

**Why 25-point bonus for 2+ links?**
- Indicates intentional transparency structure
- Multiple specialized pages show commitment
- Gets user to ~40/100 (F+ grade) to acknowledge effort
- Still below passing (70/100) to encourage direct content

**Why 15-point bonus for 1 link?**
- Basic transparency attempt
- Single page might have everything
- Gets user to ~30/100 (F grade) to show minimal recognition
- Significantly lower than 2+ links to encourage comprehensiveness

**Why 5-point bonus for links with partial content?**
- User already has some transparency signals
- Links provide additional value
- Small bonus acknowledges extra transparency resources
- Prevents excessive points for redundant information

**Why cap at 100 points?**
- Maintains framework compliance
- Prevents gaming through link stuffing
- Ensures full transparency content still scores best
- `Math.min(score, 100)` enforcement in return statement

### Score Examples

**Example 1: freecalchub.com (Current)**
- Methodology: 25 pts
- Updates: 20 pts
- Partial bonus: 10 pts
- Links detected: /about/, /privacy/ (2 links)
- Link bonus: 5 pts (has partial content)
- **Total: 60 pts** (up from 45 pts) ✅

**Example 2: Empty Homepage with About Link**
- No direct content: 0 pts
- Base score: 15 pts
- Links detected: /about/ (1 link)
- Link bonus: 15 pts
- **Total: 30 pts** (new behavior) ✅

**Example 3: Full Transparency on Page**
- Disclosure: 30 pts
- Funding: 25 pts
- Methodology: 25 pts
- Updates: 20 pts
- **Total: 100 pts** (unchanged) ✅

**Example 4: Homepage with Multiple Links, No Content**
- No direct content: 0 pts
- Base score: 15 pts
- Links detected: /about/, /privacy/, /disclosure/ (3 links)
- Link bonus: 25 pts
- **Total: 40 pts** (new behavior) ✅

---

## Edge Cases & Validation

### Edge Case Matrix

| # | Scenario | Expected Behavior | Validation Method |
|---|----------|-------------------|-------------------|
| 1 | External transparency links only | No bonus (not site's transparency) | Hostname comparison fails |
| 2 | Broken link format (no closing quote) | Skip gracefully | Regex won't match, continue loop |
| 3 | Relative path: `/about` | Normalize to `/about` ✅ | Path normalization logic |
| 4 | Absolute internal: `https://example.com/about` | Detect as internal ✅ | URL parsing + hostname match |
| 5 | Anchor link: `/about#team` | Treat as `/about` ✅ | Split on `#` before pattern match |
| 6 | Query params: `/about?ref=footer` | Treat as `/about` ✅ | Split on `?` before pattern match |
| 7 | Duplicate links (multiple `/about` links) | Count once | Set-based deduplication |
| 8 | Case variations: `/About`, `/ABOUT` | Match (case-insensitive) ✅ | Regex `i` flag |
| 9 | JavaScript links: `javascript:void(0)` | Skip | Explicit check before processing |
| 10 | Mailto links: `mailto:info@example.com` | Skip | Explicit check before processing |
| 11 | Empty href: `href=""` | Skip | Empty string check |
| 12 | Anchor-only: `href="#"` | Skip | Explicit check |
| 13 | Mixed case hostname: `Example.COM` | Match correctly | URL parsing handles case |
| 14 | Path variations: `/about/`, `/about`, `/about-us` | All match about pattern ✅ | Regex pattern includes variations |
| 15 | Invalid URL: `href="ht!tp://bad"` | Skip gracefully | Try-catch around URL parsing |
| 16 | Subdomain: `https://blog.example.com/about` | Reject (different hostname) | Hostname comparison |
| 17 | Trailing slash differences: `/about` vs `/about/` | Treat as same | Pattern matches both |
| 18 | Unicode paths: `/关于` | Skip (pattern won't match) | English-only patterns |
| 19 | Very long URL (>2000 chars) | Process normally | Regex handles any length |
| 20 | Malformed HTML: `<a href="/about>` | Skip (regex won't match) | Regex requires closing quote |

### Validation Testing Strategy

#### Unit Tests (Function Level)
```typescript
describe('detectTransparencyLinks', () => {
  it('should detect internal about link', () => {
    const html = '<a href="/about">About Us</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.aboutLink).toBe('/about');
    expect(result.count).toBe(1);
  });

  it('should ignore external transparency links', () => {
    const html = '<a href="https://other-site.com/about">About</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.count).toBe(0);
  });

  it('should handle multiple transparency links', () => {
    const html = '<a href="/about">About</a><a href="/privacy">Privacy</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.count).toBe(2);
    expect(result.aboutLink).toBe('/about');
    expect(result.privacyLink).toBe('/privacy');
  });

  it('should deduplicate identical links', () => {
    const html = '<a href="/about">About</a><a href="/about">About Us</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.count).toBe(1);
  });

  it('should normalize query parameters and anchors', () => {
    const html = '<a href="/about?ref=footer#team">About</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.aboutLink).toBe('/about');
  });

  it('should handle invalid URLs gracefully', () => {
    const html = '<a href="ht!tp://bad">Bad Link</a>';
    const result = detectTransparencyLinks(html, 'https://example.com');
    expect(result.count).toBe(0); // Should not crash
  });
});
```

#### Integration Tests (Scoring Level)
```typescript
describe('analyzeTransparencyDisclosure with links', () => {
  it('should award 40 points for 2+ links with no content', () => {
    const html = '<a href="/about">About</a><a href="/privacy">Privacy</a>';
    const result = analyzeTransparencyDisclosure(html, 'https://example.com');
    expect(result.score).toBe(40);
    expect(result.evidence).toContain('Transparency page links detected');
  });

  it('should award 30 points for 1 link with no content', () => {
    const html = '<a href="/about">About</a>';
    const result = analyzeTransparencyDisclosure(html, 'https://example.com');
    expect(result.score).toBe(30);
  });

  it('should maintain 100 score for full transparency content', () => {
    const html = 'disclosure funded by methodology updated <a href="/about">About</a>';
    const result = analyzeTransparencyDisclosure(html, 'https://example.com');
    expect(result.score).toBe(100); // Should not exceed 100
  });

  it('should add 5-point bonus for links with partial content', () => {
    const html = 'methodology updated <a href="/about">About</a>';
    const result = analyzeTransparencyDisclosure(html, 'https://example.com');
    const expectedScore = 25 + 20 + 10 + 5; // method + updated + partial + link
    expect(result.score).toBe(60);
  });
});
```

---

## Performance Analysis

### Performance Requirements
- **Target**: <50ms additional processing time
- **Baseline**: Current transparency analysis ~5-10ms
- **Allowable**: Up to 60ms total (including link detection)

### Performance Breakdown

#### Expected Execution Times
```
Link extraction (regex match):     5-15ms  (depends on HTML size)
Link iteration and filtering:      5-10ms  (depends on link count)
URL parsing and validation:        5-10ms  (depends on internal link count)
Pattern matching:                  1-5ms   (regex on paths)
Set operations:                    <1ms    (deduplication)
─────────────────────────────────────────
Total link detection:              16-41ms ✅ Within 50ms target

Existing transparency checks:      5-10ms
─────────────────────────────────────────
Total factor analysis:             21-51ms ✅ Acceptable
```

#### Performance Optimizations

1. **Regex Compilation**
   ```typescript
   // Patterns compiled once at function definition
   const transparencyPatterns = {
     about: /^\/?(about|about-us|...)(\/|$|\?|#)/i,
     // ... other patterns
   };
   ```

2. **Single Pass Processing**
   - Extract all links once
   - Process in single loop
   - No nested iterations

3. **Early Exit Conditions**
   ```typescript
   // Skip obviously invalid links immediately
   if (!href || href === '#' || href.startsWith('javascript:')) {
     continue; // Skip without further processing
   }
   ```

4. **Set-based Deduplication**
   - O(1) insertion and lookup
   - Efficient for typical link counts (10-100)

5. **Minimal Object Creation**
   - Reuse pattern objects
   - Avoid unnecessary string copies
   - Direct Set operations

#### Performance Testing Plan

**Test Scenarios**:
1. Small page (~10KB, 10 links): Expect <20ms
2. Medium page (~50KB, 50 links): Expect <35ms
3. Large page (~200KB, 200 links): Expect <50ms
4. Huge page (~1MB, 500 links): Measure and optimize if needed

**Monitoring**:
```typescript
console.log(`[detectTransparencyLinks] Found ${result.count} links in ${processingTime}ms`);
```

**Acceptance Criteria**:
- 95th percentile: <50ms
- 99th percentile: <75ms
- Max: <100ms (graceful degradation acceptable)

### Memory Impact
- **Link Storage**: ~100 bytes per link × typical 20 links = 2KB
- **Set Overhead**: Minimal (modern JS engines optimize)
- **Result Object**: ~500 bytes
- **Total**: <5KB additional memory per analysis ✅ Negligible

---

## Testing Strategy

### Test Coverage Requirements
- Unit tests: 100% function coverage
- Integration tests: All scoring scenarios
- Edge cases: All 20 edge cases validated
- Regression tests: No score decreases on existing sites

### Test Pyramid

```
        ┌─────────────────┐
        │  E2E Tests (5)  │  Manual testing with real sites
        ├─────────────────┤
        │Integration (10) │  Scoring scenarios
        ├─────────────────┤
        │  Unit Tests (20)│  Function behavior
        └─────────────────┘
```

### Unit Test Suite

**File**: `/tests/transparency-link-detection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { detectTransparencyLinks } from '../supabase/functions/analyze-page/index.ts';

describe('detectTransparencyLinks', () => {
  describe('Basic Detection', () => {
    it('should detect single about link', () => { /* ... */ });
    it('should detect multiple transparency links', () => { /* ... */ });
    it('should return empty for no transparency links', () => { /* ... */ });
  });

  describe('Internal vs External', () => {
    it('should detect internal absolute URLs', () => { /* ... */ });
    it('should ignore external transparency links', () => { /* ... */ });
    it('should ignore subdomain links', () => { /* ... */ });
  });

  describe('Path Normalization', () => {
    it('should normalize query parameters', () => { /* ... */ });
    it('should normalize anchor links', () => { /* ... */ });
    it('should normalize trailing slashes', () => { /* ... */ });
    it('should handle relative paths', () => { /* ... */ });
  });

  describe('Edge Cases', () => {
    it('should skip javascript: links', () => { /* ... */ });
    it('should skip mailto: links', () => { /* ... */ });
    it('should skip empty href', () => { /* ... */ });
    it('should skip anchor-only links', () => { /* ... */ });
    it('should handle invalid URLs gracefully', () => { /* ... */ });
    it('should deduplicate identical links', () => { /* ... */ });
  });

  describe('Pattern Matching', () => {
    it('should match /about variations', () => { /* ... */ });
    it('should match /privacy variations', () => { /* ... */ });
    it('should match /disclosure variations', () => { /* ... */ });
    it('should match /transparency variations', () => { /* ... */ });
    it('should match /terms variations', () => { /* ... */ });
    it('should be case-insensitive', () => { /* ... */ });
  });
});
```

### Integration Test Suite

**File**: `/tests/transparency-scoring-integration.test.ts`

```typescript
describe('Transparency Scoring with Links', () => {
  describe('No Direct Content Scenarios', () => {
    it('should score 40 for 2+ transparency links', () => { /* ... */ });
    it('should score 30 for 1 transparency link', () => { /* ... */ });
    it('should score 15 for no content and no links', () => { /* ... */ });
  });

  describe('Partial Content Scenarios', () => {
    it('should add 5-point link bonus to partial content', () => { /* ... */ });
    it('should not exceed 100 points', () => { /* ... */ });
  });

  describe('Full Content Scenarios', () => {
    it('should maintain 100 score for full transparency', () => { /* ... */ });
    it('should not add link bonus when score already high', () => { /* ... */ });
  });

  describe('Evidence and Recommendations', () => {
    it('should provide link evidence for 2+ links', () => { /* ... */ });
    it('should recommend scanning linked pages', () => { /* ... */ });
    it('should include full URLs in recommendations', () => { /* ... */ });
  });
});
```

### Regression Test Suite

**Objective**: Ensure no existing scores decrease

**Test Data**: Sample of 20 known sites with existing scores

```typescript
describe('Regression Tests', () => {
  const testSites = [
    { url: 'https://example1.com', currentScore: 85, name: 'High transparency site' },
    { url: 'https://example2.com', currentScore: 45, name: 'Medium transparency site' },
    { url: 'https://example3.com', currentScore: 15, name: 'Low transparency site' },
    // ... 17 more sites
  ];

  testSites.forEach(site => {
    it(`should not decrease score for ${site.name}`, async () => {
      const newScore = await analyzeTransparencyDisclosure(fetchContent(site.url), site.url);
      expect(newScore.score).toBeGreaterThanOrEqual(site.currentScore);
    });
  });
});
```

### Manual Testing Checklist

**Pre-deployment Testing**:
- [ ] Test freecalchub.com homepage (expect ~60 score, up from 45)
- [ ] Test freecalchub.com/about/ (expect 100 score, unchanged)
- [ ] Test page with no transparency (expect 15 score, unchanged)
- [ ] Test page with full transparency (expect 100 score, unchanged)
- [ ] Test page with 1 transparency link (expect 30 score, new)
- [ ] Test page with 2+ transparency links (expect 40 score, new)
- [ ] Verify evidence messages are clear
- [ ] Verify recommendations are actionable
- [ ] Check performance <50ms on all test cases

**Post-deployment Monitoring**:
- [ ] Monitor average processing time
- [ ] Track score distribution changes
- [ ] Review user feedback on new recommendations
- [ ] Verify no crashes or errors in logs
- [ ] Confirm backward compatibility (no complaints about decreased scores)

---

## Implementation Roadmap

### Phase 1: Core Implementation (2-3 hours)

**Task 1.1: Function Development** (60 min)
- [ ] Create `detectTransparencyLinks()` function
- [ ] Implement link extraction using existing pattern
- [ ] Add internal/external filtering
- [ ] Implement path normalization
- [ ] Add pattern matching for transparency pages
- [ ] Add error handling and logging

**Task 1.2: Integration** (45 min)
- [ ] Update `analyzeTransparencyDisclosure` signature
- [ ] Add function call at start of analysis
- [ ] Update scoring logic with link bonus
- [ ] Add evidence messages
- [ ] Add recommendations
- [ ] Update function call site with URL parameter

**Task 1.3: Unit Testing** (45 min)
- [ ] Create test file
- [ ] Write 20 unit tests for all edge cases
- [ ] Verify 100% function coverage
- [ ] Test edge cases thoroughly

### Phase 2: Integration Testing (2 hours)

**Task 2.1: Integration Tests** (60 min)
- [ ] Write scoring scenario tests
- [ ] Test all score calculation paths
- [ ] Verify evidence/recommendation formatting
- [ ] Test URL parameter passing

**Task 2.2: Regression Testing** (60 min)
- [ ] Collect 20 sample sites with known scores
- [ ] Run regression test suite
- [ ] Fix any score decreases
- [ ] Document any intentional changes

### Phase 3: Performance Validation (1 hour)

**Task 3.1: Performance Testing** (30 min)
- [ ] Test with small pages (10KB, 10 links)
- [ ] Test with medium pages (50KB, 50 links)
- [ ] Test with large pages (200KB, 200 links)
- [ ] Measure 95th/99th percentile execution times
- [ ] Optimize if needed

**Task 3.2: Load Testing** (30 min)
- [ ] Run 100 analyses in parallel
- [ ] Measure average execution time
- [ ] Monitor memory usage
- [ ] Verify no performance degradation

### Phase 4: Manual Testing (1 hour)

**Task 4.1: Real Site Testing** (30 min)
- [ ] Test freecalchub.com (homepage and about)
- [ ] Test 5 other real sites
- [ ] Verify score changes make sense
- [ ] Test recommendations are actionable
- [ ] Check edge cases in production HTML

**Task 4.2: User Acceptance** (30 min)
- [ ] Review with stakeholders
- [ ] Verify scoring logic matches business requirements
- [ ] Confirm evidence messages are clear
- [ ] Validate recommendations are helpful

### Phase 5: Deployment (1 hour)

**Task 5.1: Code Review** (30 min)
- [ ] Review function implementation
- [ ] Check for security issues
- [ ] Verify error handling
- [ ] Confirm performance metrics
- [ ] Review test coverage

**Task 5.2: Deployment** (30 min)
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Monitor for errors
- [ ] Deploy to production
- [ ] Monitor production performance

### Phase 6: Monitoring (Ongoing)

**Task 6.1: Performance Monitoring**
- [ ] Track average execution time
- [ ] Monitor 95th/99th percentile
- [ ] Alert on >75ms execution time
- [ ] Review weekly performance reports

**Task 6.2: Score Monitoring**
- [ ] Track score distribution changes
- [ ] Monitor for unexpected decreases
- [ ] Review evidence message frequency
- [ ] Collect user feedback

**Task 6.3: Iteration**
- [ ] Review pattern match accuracy
- [ ] Adjust scoring weights if needed
- [ ] Refine recommendations based on feedback
- [ ] Add new transparency patterns if discovered

---

## Developer Handoff Package

### Files to Modify
1. `/supabase/functions/analyze-page/index.ts`
   - Add `detectTransparencyLinks()` function before line 914
   - Update `analyzeTransparencyDisclosure()` signature and implementation
   - Update function call site (around line 1549)

### Files to Create
1. `/tests/transparency-link-detection.test.ts` - Unit tests
2. `/tests/transparency-scoring-integration.test.ts` - Integration tests
3. `/docs/transparency-link-detection.md` - User-facing documentation

### Implementation Checklist
- [ ] Add `detectTransparencyLinks()` function at line 913
- [ ] Update `analyzeTransparencyDisclosure` signature to accept `url` parameter
- [ ] Call `detectTransparencyLinks()` at start of transparency analysis
- [ ] Update base score logic with link bonus (lines 966-972)
- [ ] Update function call site to pass URL parameter
- [ ] Create unit test file with 20 test cases
- [ ] Create integration test file with 10 test cases
- [ ] Run all tests and verify 100% pass rate
- [ ] Test with freecalchub.com and verify expected scores
- [ ] Deploy to staging and verify no errors
- [ ] Monitor performance <50ms requirement
- [ ] Deploy to production

### Expected Outcomes
- freecalchub.com homepage: 45 → ~60 points (with link bonus)
- freecalchub.com/about/: 100 points (unchanged)
- Sites with no transparency: 15 points (unchanged)
- Sites with full transparency: 100 points (unchanged)
- Evidence messages: Clear and actionable
- Performance: <50ms additional processing time
- Test coverage: 100% for new function

### Success Criteria
- ✅ All tests pass
- ✅ No score regressions on existing sites
- ✅ Performance <50ms on 95% of analyses
- ✅ Clear evidence and recommendations
- ✅ User reports increased satisfaction
- ✅ freecalchub.com case resolved

---

## Appendix

### A. Pattern Matching Rationale

**About Pages**: `/about|about-us|who-we-are|our-team|mission|company`
- Most common: /about, /about-us
- Professional: /who-we-are, /our-team
- Organizational: /mission, /company

**Privacy Pages**: `/privacy|privacy-policy|data-protection|gdpr`
- Standard: /privacy, /privacy-policy
- Regulatory: /data-protection, /gdpr

**Disclosure Pages**: `/disclosure|disclosures|disclaimer|disclaimers`
- Formal: /disclosure, /disclosures
- Legal: /disclaimer, /disclaimers

**Transparency Pages**: `/transparency|openness|accountability`
- Direct: /transparency
- Synonyms: /openness, /accountability

**Terms Pages**: `/terms|legal|terms-of-service|terms-and-conditions`
- Common: /terms, /legal
- Formal: /terms-of-service, /terms-and-conditions

### B. Link Bonus Justification

**Why not full credit for links?**
- Links indicate *potential* transparency, not actual transparency
- User could have poor/incomplete content on linked pages
- Encourages putting transparency directly on homepage for best UX
- Maintains incentive to improve

**Why any credit at all?**
- Acknowledges intentional transparency structure
- Reduces user frustration from "I added content but score unchanged"
- Provides actionable recommendation (scan linked pages)
- Reflects real-world site architecture (homepage + dedicated pages)

**Point allocation philosophy**:
- 2+ links = 25 points = "Organized transparency structure"
- 1 link = 15 points = "Basic transparency page"
- 0 links = 0 bonus = "No transparency signals"

### C. Alternative Approaches Considered

**Approach 1: Automatic Link Scanning**
- Automatically fetch and analyze linked pages
- Pros: More accurate scoring
- Cons: Expensive (time, API calls), timeout risk, complex error handling
- **Decision**: Rejected - violates performance requirements

**Approach 2: NLP/ML Pattern Matching**
- Use AI to detect semantic transparency indicators
- Pros: More flexible, catches variations
- Cons: Complex, slow, unpredictable, requires training data
- **Decision**: Rejected - over-engineered for problem scope

**Approach 3: Full Credit for Links**
- Award same points as having actual content
- Pros: Simpler logic
- Cons: Easily gamed, removes incentive to put content on homepage
- **Decision**: Rejected - doesn't align with business goals

**Approach 4: No Link Detection**
- Keep current behavior
- Pros: Simplest
- Cons: Doesn't solve user problem, frustration continues
- **Decision**: Rejected - fails to address root cause

**Selected Approach: Partial Credit for Links**
- Balanced approach
- Addresses user frustration
- Maintains scoring integrity
- Provides actionable recommendations
- Simple implementation
- **Decision**: Accepted ✅

---

*End of Architecture Document*

**Prepared by**: THE ARCHITECT
**Date**: 2025-10-08
**Version**: 1.0
**Status**: Ready for Developer Implementation
