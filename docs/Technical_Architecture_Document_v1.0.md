# Technical Architecture Document (TAD) v1.0
## AImpactScanner MVP - Detailed Implementation Blueprint

**Version**: 1.0.0 - Implementation Ready Edition  
**Date**: July 11th, 2025  
**Status**: Ready for Development  
**Related**: PRD v8.0, MASTERY-AI Framework v3.1.1  

---

## Executive Summary

This Technical Architecture Document provides the complete implementation blueprint for AImpactScanner MVP's two-phase analysis system. The architecture addresses Edge Function timeout constraints through intelligent factor distribution, comprehensive error handling, and progressive value delivery while maintaining a natural evolution path to enterprise-scale infrastructure.

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   React SPA     │───▶│  Edge Function   │───▶│    Supabase DB      │
│                 │    │                  │    │                     │
│ - URL Input     │    │ Phase A (Instant)│    │ - analyses          │
│ - Progress UI   │    │ - 10 factors     │    │ - analysis_factors  │
│ - Results View  │    │ - 15s timeout    │    │ - analysis_progress │
│ - Real-time Sub │    │                  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                        │
         │              ┌──────────────────┐              │
         │              │  Queue System    │              │
         └──────────────│  (Future Phase)  │──────────────┘
                        │                  │
                        │ Phase B (Queue)  │
                        │ - 12 factors     │
                        │ - 45s processing │
                        └──────────────────┘
```

### Data Flow Architecture

```
1. User Input
   └─▶ Frontend Validation
       └─▶ Edge Function Trigger
           ├─▶ Phase A: Instant Analysis (15s)
           │   ├─▶ Puppeteer Launch
           │   ├─▶ Page Load & Extract
           │   ├─▶ Factor Processing (10 factors)
           │   └─▶ Immediate Results Return
           │
           └─▶ Phase B: Queue Trigger (Background)
               ├─▶ Background Worker Launch
               ├─▶ Complex Factor Analysis (12 factors)
               ├─▶ Progress Updates
               └─▶ Final Results Update
```

---

## Component Architecture

### 1. Frontend Components

#### Core Components Structure
```typescript
src/
├── components/
│   ├── AnalysisForm.tsx          // URL input and validation
│   ├── ProgressTracker.tsx       // Real-time progress display
│   ├── InstantResults.tsx        // Phase A results (10 factors)
│   ├── CompleteResults.tsx       // Phase A + B results (22 factors)
│   ├── FactorCard.tsx           // Individual factor display
│   └── EducationalContent.tsx    // Tips during processing
├── hooks/
│   ├── useRealTimeProgress.ts    // Supabase subscription
│   ├── useAnalysisState.ts       // State management
│   └── useFactorResults.ts       // Results fetching
└── utils/
    ├── analysisApi.ts            // Edge Function calls
    ├── progressCalculator.ts     // Progress percentage logic
    └── factorFormatters.ts       // Display formatting
```

#### Real-Time Progress Hook
```typescript
// src/hooks/useRealTimeProgress.ts
export function useRealTimeProgress(analysisId: string) {
  const [progress, setProgress] = useState<ProgressUpdate[]>([]);
  const [phase, setPhase] = useState<'instant' | 'background' | 'complete'>('instant');
  
  useEffect(() => {
    if (!analysisId) return;
    
    const subscription = supabase
      .channel(`analysis_${analysisId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'analysis_progress',
        filter: `analysis_id=eq.${analysisId}`
      }, (payload) => {
        const update = payload.new as ProgressUpdate;
        setProgress(prev => [...prev, update]);
        
        // Determine phase based on progress
        if (update.progress_percent === 100) {
          setPhase('complete');
        } else if (update.progress_percent >= 50) {
          setPhase('background');
        }
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [analysisId]);
  
  return { progress, phase, isComplete: phase === 'complete' };
}
```

### 2. Edge Function Architecture

#### Main Edge Function Structure
```typescript
// supabase/functions/analyze-page/index.ts
import { AnalysisEngine } from './lib/AnalysisEngine.ts';
import { ProgressTracker } from './lib/ProgressTracker.ts';
import { CircuitBreaker } from './lib/CircuitBreaker.ts';

export default serve(async (req) => {
  const { url, userId, analysisId } = await req.json();
  
  try {
    // Initialize components
    const engine = new AnalysisEngine();
    const progress = new ProgressTracker(supabase, analysisId);
    const breaker = new CircuitBreaker();
    
    // Phase A: Instant Analysis (15s max)
    await progress.update('initialization', 5, 'Starting analysis...');
    
    const instantResults = await Promise.race([
      engine.analyzeInstantFactors(url, breaker),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Phase A timeout')), 15000)
      )
    ]);
    
    await progress.update('instant_complete', 45, 'Instant analysis complete');
    
    // Queue Phase B: Background Analysis
    await queueBackgroundAnalysis(analysisId, url);
    
    return new Response(JSON.stringify({
      success: true,
      analysisId,
      instantResults,
      status: 'processing_background'
    }));
    
  } catch (error) {
    console.error('Analysis failed:', error);
    await handleAnalysisError(analysisId, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

#### Analysis Engine Implementation
```typescript
// supabase/functions/analyze-page/lib/AnalysisEngine.ts
export class AnalysisEngine {
  private cache = new FactorCache();
  
  async analyzeInstantFactors(url: string, breaker: CircuitBreaker) {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    try {
      // Single page load for all data extraction
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 8000 
      });
      
      // Extract all data in one evaluation
      const pageData = await page.evaluate(() => ({
        title: document.title,
        meta: this.extractMetaTags(),
        headings: this.extractHeadings(),
        content: this.extractContent(),
        links: this.extractLinks(),
        images: this.extractImages(),
        structured: this.extractStructuredData()
      }));
      
      // Process factors in parallel with circuit breakers
      const results = await Promise.allSettled([
        breaker.execute('https', () => this.checkHTTPS(url), { score: 0, confidence: 0 }),
        breaker.execute('title', () => this.analyzeTitle(pageData.title), { score: 0, confidence: 0 }),
        breaker.execute('meta', () => this.analyzeMetaDescription(pageData.meta), { score: 0, confidence: 0 }),
        breaker.execute('headings', () => this.analyzeHeadings(pageData.headings), { score: 0, confidence: 0 }),
        breaker.execute('structured', () => this.analyzeStructuredData(pageData.structured), { score: 0, confidence: 0 }),
        breaker.execute('author', () => this.findAuthor(pageData.content), { score: 0, confidence: 0 }),
        breaker.execute('contact', () => this.findContact(url, pageData.links), { score: 0, confidence: 0 }),
        breaker.execute('images', () => this.analyzeImages(pageData.images), { score: 0, confidence: 0 }),
        breaker.execute('faq', () => this.findFAQ(pageData.structured), { score: 0, confidence: 0 }),
        breaker.execute('wordcount', () => this.countWords(pageData.content), { score: 0, confidence: 0 })
      ]);
      
      return this.formatInstantResults(results);
      
    } finally {
      await browser.close();
    }
  }
  
  private async launchBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--single-process'
      ]
    });
  }
}
```

#### Circuit Breaker Implementation
```typescript
// supabase/functions/analyze-page/lib/CircuitBreaker.ts
export class CircuitBreaker {
  private failures = new Map<string, number>();
  private lastFailTime = new Map<string, number>();
  private readonly threshold = 3;
  private readonly resetTimeout = 60000; // 1 minute
  
  async execute<T>(
    factorId: string,
    operation: () => Promise<T>,
    fallback: T,
    timeout: number = 2000
  ): Promise<T> {
    // Check circuit state
    if (this.isCircuitOpen(factorId)) {
      console.log(`Circuit open for ${factorId}, using fallback`);
      return fallback;
    }
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: ${factorId}`)), timeout)
        )
      ]);
      
      // Success - reset circuit
      this.onSuccess(factorId);
      return result;
      
    } catch (error) {
      // Failure - record and potentially open circuit
      this.onFailure(factorId);
      console.error(`Factor ${factorId} failed:`, error.message);
      return fallback;
    }
  }
  
  private isCircuitOpen(factorId: string): boolean {
    const failures = this.failures.get(factorId) || 0;
    const lastFail = this.lastFailTime.get(factorId) || 0;
    
    return failures >= this.threshold && 
           Date.now() - lastFail < this.resetTimeout;
  }
  
  private onSuccess(factorId: string): void {
    this.failures.delete(factorId);
    this.lastFailTime.delete(factorId);
  }
  
  private onFailure(factorId: string): void {
    const failures = (this.failures.get(factorId) || 0) + 1;
    this.failures.set(factorId, failures);
    this.lastFailTime.set(factorId, Date.now());
  }
}
```

### 3. Progress Tracking System

#### Progress Tracker Implementation
```typescript
// supabase/functions/analyze-page/lib/ProgressTracker.ts
export class ProgressTracker {
  private updates: ProgressUpdate[] = [];
  private batchSize = 3;
  private flushTimeout: number | null = null;
  
  constructor(
    private supabase: SupabaseClient,
    private analysisId: string
  ) {}
  
  async update(
    stage: string,
    percent: number,
    message: string,
    educationalContent?: string
  ): Promise<void> {
    const update: ProgressUpdate = {
      analysis_id: this.analysisId,
      stage,
      progress_percent: percent,
      message,
      educational_content: educationalContent || this.getEducationalContent(stage),
      created_at: new Date().toISOString()
    };
    
    this.updates.push(update);
    
    // Immediate flush conditions
    if (percent === 100 || this.updates.length >= this.batchSize) {
      await this.flush();
    } else {
      // Batched flush with timeout
      this.scheduleFlush();
    }
  }
  
  private scheduleFlush(): void {
    if (this.flushTimeout) return;
    
    this.flushTimeout = setTimeout(async () => {
      await this.flush();
      this.flushTimeout = null;
    }, 2000); // 2s batch window
  }
  
  private async flush(): Promise<void> {
    if (this.updates.length === 0) return;
    
    try {
      const { error } = await this.supabase
        .from('analysis_progress')
        .insert(this.updates);
      
      if (error) {
        console.error('Progress update failed:', error);
      } else {
        console.log(`Flushed ${this.updates.length} progress updates`);
      }
      
      this.updates = [];
      
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }
      
    } catch (error) {
      console.error('Progress flush error:', error);
    }
  }
  
  private getEducationalContent(stage: string): string {
    const content: Record<string, string> = {
      'initialization': 'Launching secure browser environment for analysis...',
      'page_load': 'Loading and rendering page content to analyze structure...',
      'instant_analysis': 'Processing critical AI optimization factors...',
      'instant_complete': 'Instant analysis complete! Processing detailed factors...',
      'background_start': 'Analyzing advanced factors for comprehensive scoring...',
      'performance_check': 'Measuring page speed and Core Web Vitals...',
      'content_analysis': 'Evaluating content quality and readability...',
      'final_scoring': 'Calculating final scores and generating recommendations...',
      'complete': 'Analysis complete! Generating your detailed report...'
    };
    
    return content[stage] || 'Processing AI optimization factors...';
  }
}
```

### 4. Caching Strategy

#### Factor Cache Implementation
```typescript
// supabase/functions/analyze-page/lib/FactorCache.ts
interface CacheEntry {
  value: any;
  timestamp: number;
  pattern?: string;
  factorId: string;
}

export class FactorCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 1000;
  private readonly defaultTTL = 3600000; // 1 hour
  
  set(key: string, value: any, factorId: string, pattern?: string, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      pattern,
      factorId
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  getByPattern(pattern: string, factorId: string): any | null {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.pattern === pattern && 
          entry.factorId === factorId && 
          !this.isExpired(entry)) {
        return entry.value;
      }
    }
    return null;
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.defaultTTL;
  }
  
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
```

---

## Performance Optimization Strategies

### 1. Puppeteer Optimization

```typescript
// Optimized browser configuration
const browserConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--single-process',
    '--memory-pressure-off',
    '--max_old_space_size=512'
  ],
  timeout: 8000
};

// Page optimization
const pageConfig = {
  waitUntil: 'networkidle2' as const,
  timeout: 8000
};

// Resource blocking for performance
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort(); // Block non-essential resources for speed
  } else {
    req.continue();
  }
});
```

### 2. Parallel Processing

```typescript
// Process factors in optimized batches
const processFactorsBatched = async (pageData: PageData) => {
  // Batch 1: Trivial factors (immediate)
  const trivialBatch = await Promise.allSettled([
    analyzeHTTPS(url),
    analyzeTitle(pageData.title),
    analyzeMetaDescription(pageData.meta),
    analyzeAuthor(pageData.content)
  ]);
  
  // Batch 2: Low complexity (parallel)
  const lowComplexityBatch = await Promise.allSettled([
    analyzeHeadings(pageData.headings),
    analyzeStructuredData(pageData.structured),
    analyzeFAQ(pageData.structured),
    analyzeImages(pageData.images),
    analyzeWordCount(pageData.content)
  ]);
  
  return [...trivialBatch, ...lowComplexityBatch];
};
```

### 3. Memory Management

```typescript
// Cleanup strategy
class ResourceManager {
  private resources: Array<() => Promise<void>> = [];
  
  addCleanup(cleanup: () => Promise<void>): void {
    this.resources.push(cleanup);
  }
  
  async cleanup(): Promise<void> {
    await Promise.allSettled(
      this.resources.map(cleanup => cleanup())
    );
    this.resources = [];
  }
}

// Usage in analysis
const resourceManager = new ResourceManager();
const browser = await puppeteer.launch(browserConfig);
resourceManager.addCleanup(() => browser.close());

try {
  // Analysis logic
} finally {
  await resourceManager.cleanup();
}
```

---

## Database Schema & Migrations

### Analysis Progress Tracking
```sql
-- Enhanced progress tracking with educational content
CREATE TABLE analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
  message TEXT,
  educational_content TEXT,
  phase TEXT CHECK (phase IN ('instant', 'background')),
  factor_id TEXT, -- Track which factor this update relates to
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for real-time queries
CREATE INDEX idx_analysis_progress_realtime ON analysis_progress(analysis_id, created_at DESC);
```

### Factor Results Storage
```sql
-- Enhanced factor results with phase tracking
CREATE TABLE analysis_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  factor_id TEXT NOT NULL, -- e.g., "AI.1.1"
  factor_name TEXT NOT NULL,
  pillar TEXT NOT NULL,
  phase TEXT CHECK (phase IN ('instant', 'background')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  weight DECIMAL(4,2) NOT NULL,
  evidence JSONB,
  recommendations JSONB,
  processing_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling & Recovery

### Graceful Degradation Strategy

```typescript
// Error handling hierarchy
class AnalysisErrorHandler {
  async handleFactorError(
    factorId: string,
    error: Error,
    fallbackValue: FactorResult
  ): Promise<FactorResult> {
    console.error(`Factor ${factorId} failed:`, error.message);
    
    // Log error for monitoring
    await this.logError(factorId, error);
    
    // Return fallback with reduced confidence
    return {
      ...fallbackValue,
      confidence: 25, // Low confidence for fallback
      evidence: [`Error: ${error.message}`, 'Using fallback analysis'],
      recommendations: ['Unable to analyze this factor - please check manually']
    };
  }
  
  async handlePhaseFailure(
    phase: 'instant' | 'background',
    error: Error,
    analysisId: string
  ): Promise<void> {
    if (phase === 'instant') {
      // Critical failure - return error to user
      await this.markAnalysisError(analysisId, error);
      throw error;
    } else {
      // Background failure - log and continue with partial results
      await this.logBackgroundError(analysisId, error);
      await this.markPartialCompletion(analysisId);
    }
  }
}
```

### Monitoring & Alerting

```typescript
// Performance monitoring
interface PerformanceMetrics {
  phase: 'instant' | 'background';
  totalTime: number;
  factorTimes: Record<string, number>;
  errors: string[];
  cacheHits: number;
  concurrentUsers: number;
}

class PerformanceMonitor {
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    // Log to Supabase for analysis
    await supabase.from('performance_metrics').insert({
      ...metrics,
      timestamp: new Date().toISOString()
    });
    
    // Alert on performance issues
    if (metrics.totalTime > 20000) { // 20s threshold
      await this.sendAlert('Performance degradation detected');
    }
    
    if (metrics.errors.length > 2) {
      await this.sendAlert('High error rate detected');
    }
  }
}
```

---

## Deployment Architecture

### Environment Configuration

```typescript
// Environment validation
const config = {
  supabaseUrl: Deno.env.get('SUPABASE_URL'),
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  environment: Deno.env.get('ENVIRONMENT') || 'development',
  maxConcurrentAnalyses: parseInt(Deno.env.get('MAX_CONCURRENT') || '20'),
  cacheSize: parseInt(Deno.env.get('CACHE_SIZE') || '1000'),
  timeoutMs: parseInt(Deno.env.get('TIMEOUT_MS') || '15000')
};

// Validate required environment variables
if (!config.supabaseUrl || !config.supabaseKey) {
  throw new Error('Missing required environment variables');
}
```

### Production Considerations

```typescript
// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 10; // per minute per user
  
  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// Factor testing example
describe('TitleAnalyzer', () => {
  it('should score optimal title correctly', () => {
    const title = 'Complete Guide to AI Optimization - 2025 Edition';
    const result = analyzeTitleOptimization(title);
    
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidence).toBeGreaterThan(90);
    expect(result.recommendations).toHaveLength(0);
  });
  
  it('should handle missing title gracefully', () => {
    const result = analyzeTitleOptimization('');
    
    expect(result.score).toBe(0);
    expect(result.confidence).toBe(100);
    expect(result.recommendations).toContain('Add a descriptive page title');
  });
});
```

### Integration Tests
```typescript
// End-to-end analysis testing
describe('AnalysisEngine Integration', () => {
  it('should complete instant analysis within timeout', async () => {
    const startTime = Date.now();
    const result = await engine.analyzeInstantFactors('https://example.com');
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(15000); // 15s timeout
    expect(result.factors).toHaveLength(10);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});
```

---

## Performance Benchmarks

### Target Metrics
- **Phase A Completion**: 95% success rate < 15 seconds
- **Phase B Completion**: 80% success rate < 45 seconds
- **Concurrent Users**: 20+ without degradation
- **Memory Usage**: < 256MB per analysis
- **Cache Hit Rate**: > 30% for common domains
- **Error Rate**: < 2% Phase A, < 5% overall

### Monitoring Queries
```sql
-- Performance monitoring queries
SELECT 
  AVG(processing_time_ms) as avg_time,
  COUNT(*) as total_analyses,
  COUNT(*) FILTER (WHERE processing_time_ms < 15000) as under_15s,
  COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits
FROM analysis_factors 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND phase = 'instant';
```

---

## Future Evolution Path

### Phase 2: Queue Architecture
- Replace direct background processing with proper queue
- Add Redis for job management
- Implement horizontal scaling

### Phase 3: Microservices
- Split factors into specialized services
- Add GraphQL API layer
- Implement service mesh

### Phase 4: AI-Powered Analysis
- Add machine learning models for complex factors
- Implement predictive scoring
- Add real-time competitive analysis

This Technical Architecture Document provides the complete implementation blueprint for building a scalable, reliable AI optimization analysis system within the constraints of Edge Function architecture while maintaining clear evolution paths for future growth.