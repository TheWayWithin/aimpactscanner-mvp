# AImpactScanner MVP PRD v7.0 - Context-Rich Implementation Guide
## Enhanced with Detailed Implementation Context and Validation Loops

**Version**: 7.0.0 - Context-Rich Implementation Edition  
**Date**: June 26th, 2025  
**Target Completion**: July 17th, 2025 (3-week timeline)  
**Current Progress**: Phase 1 - 40% Complete  
**Framework Version**: MASTERY-AI Framework v3.1.1  
**Developer**: AIS-Dev Agent  

---

## Goal

Build a production-ready AImpactScanner MVP that analyzes websites using 25 factors from MASTERY-AI Framework v3.1.1, delivers results in 35-50 seconds, supports 20+ concurrent users, and includes revolutionary LLMs.txt content accessibility features that position us as the industry innovation leader.

## Why

**Business Value:**
- Validate $150K+ ARR business model through freemium SaaS
- Establish AI Search Mastery as definitive authority in AI optimization
- Capture first-mover advantage in LLMs.txt content accessibility standard
- Generate immediate revenue while building technical foundation for full platform

**User Impact:**
- Provides actionable AI optimization insights unavailable elsewhere
- Saves 40+ hours of manual analysis per website
- Delivers specific implementation guidance for each optimization factor
- Positions users as innovation leaders through LLMs.txt implementation

**Integration with Existing Features:**
- Builds on established Supabase authentication and database foundation
- Leverages existing React frontend with AI Search Mastery brand integration
- Extends current real-time progress tracking for enhanced user experience

## What

**User-Visible Behavior:**
1. User enters website URL and clicks "Analyze"
2. Real-time progress updates show analysis stages with educational content
3. Results dashboard displays 25-factor analysis with visual scoring
4. Interactive recommendations provide specific implementation guidance
5. LLMs.txt implementation guidance positions user as innovation leader

**Technical Requirements:**
- 25-factor analysis engine using MASTERY-AI Framework v3.1.1
- Supabase Edge Function for web scraping and analysis
- Real-time progress updates via Supabase subscriptions
- Brand-compliant React frontend with interactive results
- Automated LLMs.txt generation and validation

## Success Criteria

✅ **Performance**: Analysis completes in 35-50 seconds for 95% of websites  
✅ **Accuracy**: 95%+ accuracy rate for all 25 factor assessments  
✅ **Scalability**: Supports 20+ concurrent analyses without degradation  
✅ **User Experience**: Real-time progress updates with educational content  
✅ **Innovation**: First AI optimization tool with LLMs.txt capability  
✅ **Business**: 15%+ conversion rate from free to Pro tier  

---

## All Needed Context

### Documentation & References

**MUST READ - Include these in your context window:**

- **url**: https://supabase.com/docs/guides/functions/edge-functions
  **why**: Edge Function implementation patterns, Puppeteer integration, error handling
  **critical**: Edge Functions have 60-second timeout limit, must optimize for this

- **file**: `/src/lib/supabaseClient.js`
  **why**: Existing Supabase connection pattern, environment variable usage
  **critical**: Already configured with RLS policies, don't recreate connection

- **file**: `/src/components/Auth.jsx`
  **why**: Existing component structure, brand styling patterns, error handling
  **critical**: Uses CSS variables from App.css, maintain consistency

- **doc**: https://pptr.dev/guides/getting-started
  **section**: Page evaluation and content extraction
  **critical**: Must run in headless mode, handle timeouts gracefully

- **docfile**: `/database_schema.sql`
  **why**: Existing table structure, RLS policies, relationship patterns
  **critical**: Don't modify existing tables, only add new ones

- **url**: https://tailwindcss.com/docs/configuration
  **why**: Current CDN implementation, custom CSS variable integration
  **critical**: Using CDN version, not build process - style with CSS variables

### Current Codebase Tree

```
aimpactscanner-mvp/
├── src/
│   ├── components/
│   │   └── Auth.jsx                 # Existing auth component with brand styling
│   ├── lib/
│   │   └── supabaseClient.js        # Configured Supabase client
│   ├── App.jsx                      # Main app with session management
│   ├── App.css                      # Brand CSS variables and styling
│   └── main.jsx                     # React entry point
├── supabase/
│   ├── functions/
│   │   └── (empty - need to create)
│   └── migrations/
│       └── 001_initial_schema.sql   # Existing database schema
├── public/
├── index.html                       # Tailwind CDN integration
├── package.json                     # React + Vite dependencies
└── README.md
```

### Desired Codebase Tree with New Files

```
aimpactscanner-mvp/
├── src/
│   ├── components/
│   │   ├── Auth.jsx                 # [EXISTING]
│   │   ├── AnalysisForm.jsx         # [NEW] URL input and analysis trigger
│   │   ├── ProgressTracker.jsx      # [NEW] Real-time progress display
│   │   ├── ResultsDashboard.jsx     # [NEW] Analysis results visualization
│   │   └── FactorCard.jsx           # [NEW] Individual factor display
│   ├── lib/
│   │   ├── supabaseClient.js        # [EXISTING]
│   │   ├── analysisFactors.js       # [NEW] 25-factor definitions
│   │   └── utils.js                 # [NEW] Helper functions
│   ├── hooks/
│   │   └── useRealTimeProgress.js   # [NEW] Supabase subscription hook
│   ├── App.jsx                      # [MODIFY] Add analysis flow
│   ├── App.css                      # [MODIFY] Add new component styles
│   └── main.jsx                     # [EXISTING]
├── supabase/
│   ├── functions/
│   │   └── analyze-page/
│   │       ├── index.ts             # [NEW] Main analysis Edge Function
│   │       ├── factors/             # [NEW] Individual factor analyzers
│   │       │   ├── llmsTxt.ts       # [NEW] LLMs.txt analysis
│   │       │   ├── citation.ts      # [NEW] Citation optimization
│   │       │   └── authenticity.ts  # [NEW] Content authenticity
│   │       └── utils/
│   │           ├── scraper.ts       # [NEW] Puppeteer web scraping
│   │           └── scorer.ts        # [NEW] Scoring algorithms
│   └── migrations/
│       ├── 001_initial_schema.sql   # [EXISTING]
│       └── 002_analysis_tables.sql  # [NEW] Analysis-specific tables
```

### Known Gotchas & Library Quirks

**CRITICAL: Supabase Edge Functions**
- 60-second timeout limit - must optimize analysis for this constraint
- Puppeteer requires specific Deno import: `import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"`
- Must use `--allow-net --allow-read --allow-env --allow-run` permissions

**CRITICAL: React + Supabase Real-time**
- Subscriptions must be cleaned up in useEffect return function
- RLS policies already configured - don't bypass, work within them
- Use existing supabaseClient.js, don't create new connections

**CRITICAL: Tailwind CSS Integration**
- Using CDN version, not build process
- Custom brand colors via CSS variables in App.css
- Hover states require custom CSS rules, not Tailwind classes

**CRITICAL: Analysis Performance**
- Target 35-50 seconds total analysis time
- Puppeteer page load timeout: 30 seconds max
- Use Promise.allSettled for parallel factor analysis
- Implement progress updates every 2-3 seconds

---

## Implementation Blueprint

### Data Models and Structure

**Core Analysis Models:**

```typescript
// Analysis result structure
interface AnalysisResult {
  id: string;
  url: string;
  overall_score: number;
  ai_score: number;
  authority_score: number;
  machine_readability_score: number;
  semantic_quality_score: number;
  engagement_score: number;
  topical_expertise_score: number;
  reference_networks_score: number;
  yield_optimization_score: number;
  factors: FactorResult[];
  recommendations: Recommendation[];
  framework_version: "3.1.1";
  created_at: string;
}

interface FactorResult {
  id: string; // e.g., "M.5.1"
  name: string;
  pillar: string;
  score: number; // 0-100
  confidence: number; // 0-100
  weight: number;
  description: string;
  recommendations: string[];
  evidence: string[];
}
```

**Database Schema Updates:**

```sql
-- New analysis tables
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  overall_score INTEGER,
  ai_score INTEGER,
  authority_score INTEGER,
  machine_readability_score INTEGER,
  semantic_quality_score INTEGER,
  engagement_score INTEGER,
  topical_expertise_score INTEGER,
  reference_networks_score INTEGER,
  yield_optimization_score INTEGER,
  framework_version TEXT DEFAULT '3.1.1',
  analysis_duration INTEGER, -- seconds
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE analysis_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  factor_id TEXT NOT NULL, -- e.g., "M.5.1"
  factor_name TEXT NOT NULL,
  pillar TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  weight DECIMAL(4,2) NOT NULL,
  evidence JSONB,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
  message TEXT,
  educational_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Task Implementation Order

### Task 1: Database Schema and Edge Function Foundation
**MODIFY** `supabase/migrations/002_analysis_tables.sql`:
- CREATE new analysis tables with proper RLS policies
- PRESERVE existing table structure and relationships
- ADD indexes for performance optimization

**CREATE** `supabase/functions/analyze-page/index.ts`:
- MIRROR pattern from Supabase Edge Function examples
- IMPLEMENT basic request handling and response structure
- KEEP error handling comprehensive and informative

```typescript
// Task 1 Pseudocode
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // PATTERN: Always validate request method and headers
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  // CRITICAL: Extract user context from JWT
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(url, key, { 
    global: { headers: { Authorization: authHeader } }
  })
  
  try {
    const { url: targetUrl } = await req.json()
    
    // PATTERN: Create analysis record first
    const { data: analysis } = await supabase
      .from('analyses')
      .insert({ url: targetUrl, status: 'analyzing' })
      .select()
      .single()
    
    // GOTCHA: Start analysis in background, return immediately
    analyzeWebsiteAsync(analysis.id, targetUrl, supabase)
    
    return new Response(JSON.stringify({ analysis_id: analysis.id }))
  } catch (error) {
    // PATTERN: Log error and return user-friendly message
    console.error('Analysis start error:', error)
    return new Response('Analysis failed to start', { status: 500 })
  }
})
```

### Task 2: Web Scraping and Content Extraction
**CREATE** `supabase/functions/analyze-page/utils/scraper.ts`:
- IMPLEMENT Puppeteer-based content extraction
- HANDLE timeouts and errors gracefully
- EXTRACT content needed for all 25 factors

```typescript
// Task 2 Pseudocode
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

export async function scrapeWebsite(url: string): Promise<WebsiteData> {
  // CRITICAL: Set timeout to prevent Edge Function timeout
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // GOTCHA: Set timeout shorter than Edge Function limit
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    })
    
    // PATTERN: Extract all needed data in single page evaluation
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content,
        headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.trim()
        })),
        // ... extract all factor-relevant data
      }
    })
    
    return data
  } finally {
    // CRITICAL: Always close browser to prevent memory leaks
    await browser.close()
  }
}
```

### Task 3: Factor Analysis Implementation
**CREATE** `supabase/functions/analyze-page/factors/` directory with individual analyzers:
- IMPLEMENT each factor as separate module
- FOLLOW consistent scoring pattern (0-100)
- PROVIDE specific recommendations for each factor

```typescript
// Task 3 Pseudocode - LLMs.txt analyzer
export async function analyzeLLMsTxt(url: string, websiteData: WebsiteData): Promise<FactorResult> {
  // PATTERN: Check for file existence first
  const llmsTxtUrl = new URL('/llms.txt', url).toString()
  
  try {
    const response = await fetch(llmsTxtUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) 
    })
    
    let score = 0
    const recommendations = []
    
    if (response.ok) {
      score += 40 // File exists
      
      // PATTERN: Validate file content if exists
      const content = await fetch(llmsTxtUrl).then(r => r.text())
      
      if (content.length > 100) score += 25 // Has content
      if (content.includes('# ')) score += 25 // Proper markdown
      if (content.length > 1000) score += 10 // Comprehensive
    } else {
      recommendations.push("Implement /llms.txt file for AI content accessibility")
      recommendations.push("Include key page summaries in Markdown format")
    }
    
    return {
      id: 'M.5.1',
      name: 'LLMs.txt Basic Implementation',
      pillar: 'Machine Readability',
      score,
      confidence: 95,
      weight: 1.2,
      recommendations,
      evidence: [`File check: ${response.status}`]
    }
  } catch (error) {
    // PATTERN: Handle errors gracefully with partial scoring
    return createErrorResult('M.5.1', error.message)
  }
}
```

### Task 4: Real-time Progress System
**CREATE** `src/hooks/useRealTimeProgress.js`:
- IMPLEMENT Supabase subscription for progress updates
- HANDLE connection errors and reconnection
- CLEAN UP subscriptions properly

```javascript
// Task 4 Pseudocode
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealTimeProgress(analysisId) {
  const [progress, setProgress] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    if (!analysisId) return
    
    // PATTERN: Subscribe to real-time updates
    const subscription = supabase
      .channel(`analysis_${analysisId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'analysis_progress',
        filter: `analysis_id=eq.${analysisId}`
      }, (payload) => {
        setProgress(prev => [...prev, payload.new])
        
        // GOTCHA: Check for completion status
        if (payload.new.progress_percent === 100) {
          setIsComplete(true)
        }
      })
      .subscribe()
    
    // CRITICAL: Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [analysisId])
  
  return { progress, isComplete }
}
```

### Task 5: Results Dashboard UI
**CREATE** `src/components/ResultsDashboard.jsx`:
- DISPLAY analysis results with brand styling
- IMPLEMENT interactive factor cards
- SHOW specific recommendations

```javascript
// Task 5 Pseudocode
export function ResultsDashboard({ analysisId }) {
  const [analysis, setAnalysis] = useState(null)
  const [factors, setFactors] = useState([])
  
  // PATTERN: Fetch analysis data on mount
  useEffect(() => {
    async function fetchResults() {
      const { data: analysisData } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      
      const { data: factorData } = await supabase
        .from('analysis_factors')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('pillar', { ascending: true })
      
      setAnalysis(analysisData)
      setFactors(factorData)
    }
    
    fetchResults()
  }, [analysisId])
  
  // PATTERN: Group factors by pillar for display
  const factorsByPillar = factors.reduce((acc, factor) => {
    if (!acc[factor.pillar]) acc[factor.pillar] = []
    acc[factor.pillar].push(factor)
    return acc
  }, {})
  
  return (
    <div className="results-dashboard" style={{ 
      backgroundColor: 'var(--authority-white)',
      color: 'var(--framework-black)'
    }}>
      {/* PATTERN: Overall score display */}
      <div className="overall-score">
        <h2 style={{ color: 'var(--mastery-blue)' }}>
          Overall AI Optimization Score: {analysis?.overall_score}/100
        </h2>
      </div>
      
      {/* PATTERN: Pillar breakdown */}
      {Object.entries(factorsByPillar).map(([pillar, pillarFactors]) => (
        <PillarSection key={pillar} pillar={pillar} factors={pillarFactors} />
      ))}
    </div>
  )
}
```

---

## Integration Points

### DATABASE:
- **migration**: `002_analysis_tables.sql` - Add analysis, factors, and progress tables
- **indexes**: 
  ```sql
  CREATE INDEX idx_analyses_user_id ON analyses(user_id);
  CREATE INDEX idx_analysis_factors_analysis_id ON analysis_factors(analysis_id);
  CREATE INDEX idx_analysis_progress_analysis_id ON analysis_progress(analysis_id);
  ```

### CONFIG:
- **add to**: `supabase/functions/analyze-page/index.ts`
- **pattern**: 
  ```typescript
  const ANALYSIS_TIMEOUT = parseInt(Deno.env.get('ANALYSIS_TIMEOUT') || '45000')
  const MAX_CONCURRENT_ANALYSES = parseInt(Deno.env.get('MAX_CONCURRENT') || '20')
  ```

### ROUTES:
- **add to**: `src/App.jsx`
- **pattern**: 
  ```javascript
  const [currentView, setCurrentView] = useState('analysis') // 'analysis' | 'results'
  const [analysisId, setAnalysisId] = useState(null)
  ```

---

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # ESLint checking
npm run type-check                   # TypeScript validation (if using TS)
supabase functions deploy analyze-page --no-verify-jwt  # Deploy and test

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests

```javascript
// CREATE test files for each component
// test/components/ResultsDashboard.test.jsx
import { render, screen } from '@testing-library/react'
import { ResultsDashboard } from '../src/components/ResultsDashboard'

describe('ResultsDashboard', () => {
  test('displays overall score correctly', () => {
    const mockAnalysis = { overall_score: 85 }
    render(<ResultsDashboard analysis={mockAnalysis} />)
    expect(screen.getByText(/Overall AI Optimization Score: 85/)).toBeInTheDocument()
  })
  
  test('handles loading state', () => {
    render(<ResultsDashboard analysisId="test-id" />)
    expect(screen.getByText(/Loading analysis/)).toBeInTheDocument()
  })
})

# Run and iterate until passing:
npm test
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test

```bash
# Start the development server
npm run dev

# Test the analysis flow
curl -X POST 'http://localhost:54321/functions/v1/analyze-page' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'

# Expected: {"analysis_id": "uuid-here"}
# If error: Check Supabase logs for stack trace
```

---

## Final Validation Checklist

✅ **All tests pass**: `npm test`  
✅ **No linting errors**: `npm run lint`  
✅ **Edge Function deploys**: `supabase functions deploy analyze-page`  
✅ **Manual analysis works**: Test with real website URL  
✅ **Real-time updates work**: Progress shows during analysis  
✅ **Results display correctly**: All 25 factors show with scores  
✅ **Error cases handled**: Invalid URLs, timeouts, network errors  
✅ **Performance target met**: Analysis completes in 35-50 seconds  
✅ **Brand compliance**: All UI matches AI Search Mastery guidelines  

---

## Anti-Patterns to Avoid

❌ **Don't create new Supabase clients** - use existing `supabaseClient.js`  
❌ **Don't bypass RLS policies** - work within existing security model  
❌ **Don't ignore Edge Function timeout** - optimize for 60-second limit  
❌ **Don't use sync operations in async context** - everything must be async  
❌ **Don't hardcode factor definitions** - use configurable factor system  
❌ **Don't skip progress updates** - users need real-time feedback  
❌ **Don't catch all exceptions** - be specific about error handling  
❌ **Don't ignore browser cleanup** - always close Puppeteer instances  
❌ **Don't skip validation** - validate all inputs and outputs  
❌ **Don't break brand consistency** - maintain AI Search Mastery styling  

---

## Performance Optimization Requirements

### Critical Performance Targets:
- **Analysis completion**: 35-50 seconds for 95% of websites
- **Concurrent users**: 20+ without performance degradation  
- **Memory usage**: <512MB per analysis (Edge Function limit)
- **Database queries**: <50 queries per analysis
- **Real-time updates**: Progress updates every 2-3 seconds

### Optimization Strategies:
- **Parallel factor analysis**: Use `Promise.allSettled` for independent factors
- **Efficient web scraping**: Single page evaluation for all data extraction
- **Database batching**: Insert all factors in single transaction
- **Progress throttling**: Limit progress updates to prevent spam
- **Error recovery**: Graceful degradation for failed factors

This context-rich PRD provides the comprehensive implementation guidance needed for successful development while maintaining the aggressive timeline through detailed technical specifications and validation loops.

