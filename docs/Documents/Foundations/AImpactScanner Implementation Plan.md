# AImpactScanner Implementation Plan

**Product Name:** AImpactScanner
**Document Type:** Development Implementation Roadmap
**Date:** October 18, 2025
**Version:** 1.0
**Owner:** Engineering Leadership
**Status:** Draft

---

## Document Purpose

This document provides a **detailed, actionable implementation plan** for building AImpactScanner across three development phases: **Pre-Launch Validation** (Weeks 1-2), **MVP Launch** (Weeks 3-12), and **Growth Optimization** (Months 4-12).

**Strategic Context:**
- **Month 6 Pivot Decision:** If Hedgehog Concept not validated (Growth tier retention <70%), pivot or sunset per Vision & Mission
- **Pre-Launch Validation:** Doug Hall's "Marketing Physics" - test customer promise BEFORE building paid infrastructure
- **Bootstrap Constraints:** Solo developer or small team, minimal budget, must reach profitability fast

**Related Documents:**
- `/documents/foundation/AImpactScanner Tier Specification.md` - Complete feature specifications and business rules
- `/documents/foundation/Vision and Mission.md` - Strategic vision, success metrics, and pivot criteria
- `/documents/foundation/positioning-statement.md` - Market positioning and competitive differentiation

---

## Implementation Philosophy

### Build vs. Buy Principles

**Always Prefer:**
- ✅ **Managed services** over custom infrastructure (Vercel, Supabase, Stripe)
- ✅ **Open-source libraries** over custom code (Next.js, Tailwind, shadcn/ui)
- ✅ **Serverless** over dedicated servers (reduce operational complexity)
- ✅ **SaaS tools** for non-core functions (Stripe for billing, Resend for email)

**Custom Build Only When:**
- Core differentiator (MASTERY-AI Framework analysis engine)
- No suitable existing solution
- Cost-prohibitive to use third-party service at scale

### Technology Stack Decisions

**Frontend:**
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + Server Components (minimize client-side state)
- **Deployment:** Vercel (zero-config, edge functions, automatic scaling)

**Rationale:** Modern, fast, developer-friendly, minimal configuration, scales automatically.

**Backend:**
- **Framework:** Next.js API Routes (collocated with frontend)
- **Database:** Supabase (PostgreSQL + Auth + Real-time + Storage)
- **Authentication:** Supabase Auth (email/password, social login, session management)
- **Background Jobs:** Vercel Cron + Upstash QStash (serverless job queue)

**Rationale:** Fully managed, generous free tier, scales automatically, built-in auth and real-time.

**Third-Party Services:**
- **Payments:** Stripe (subscriptions, invoices, customer portal)
- **Email:** Resend (transactional emails, marketing sequences)
- **AI/ML:** OpenAI API (GPT-4 for content analysis)
- **Analytics:** Vercel Analytics + PostHog (product analytics + feature flags)
- **Monitoring:** Sentry (error tracking) + Vercel Logs (performance monitoring)

**Estimated Monthly Costs (at scale):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Stripe: 2.9% + $0.30 per transaction (~$150/month at $15K MRR)
- Resend: $20/month (50K emails)
- OpenAI API: $200-500/month (depending on analysis volume)
- **Total:** ~$415-715/month operational costs at $15K MRR (96-97% gross margin)

---

## Phase 1: Pre-Launch Validation (Weeks 1-2)

### Strategic Objective

**Validate Marketing Physics BEFORE building paid infrastructure:**
- Test Overt Benefit: "See exactly how AI-ready your content is—with specific fixes—in under 15 seconds"
- Success Metrics (Section 9, Tier 2 - Tier Spec):
  - Free tier activation rate >12%
  - "Aha moment" survey >55%
  - Actionability rating >65%
- **DECISION GATE:** PASS → proceed to paid tiers; FAIL → pivot promise

**Budget:** $0 (manual outreach, free tools)
**Timeline:** 2 weeks
**Team:** 1 developer (60-80 hours total)

---

### Week 1: Minimum Validation Infrastructure

#### Day 1-2: Project Setup and Foundation

**Development Tasks:**

**1. Initialize Next.js Project**
```bash
npx create-next-app@latest aimpactscanner --typescript --tailwind --app
cd aimpactscanner
```

**Configuration:**
- TypeScript: Strict mode enabled
- ESLint: Airbnb style guide
- Prettier: Auto-formatting on save
- Git: Initialize repo, `.gitignore` for secrets

**2. Set Up Supabase Project**
- Create Supabase account (free tier)
- Create new project: `aimpactscanner-validation`
- Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- Add to `.env.local` (never commit)

**3. Install Core Dependencies**
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install openai
npm install zod # Schema validation
npm install react-hook-form # Forms
npm install @hookform/resolvers
```

**4. Basic Database Schema (Supabase SQL Editor)**

```sql
-- Users table (Supabase Auth provides this, extend with custom fields)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyses table (minimal for validation phase)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  url VARCHAR(2048) NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  pillar_scores JSONB,
  factor_scores JSONB,
  recommendations TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Validation surveys (embed post-analysis)
CREATE TABLE validation_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id),
  aha_moment BOOLEAN, -- "Did this reveal gaps you didn't know existed?"
  actionable BOOLEAN, -- "Could you implement at least 1 recommendation in next 24 hours?"
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_surveys_analysis_id ON validation_surveys(analysis_id);
```

**5. Environment Variables Setup**

`.env.local` (NEVER commit):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Deliverables (Day 1-2):**
- ✅ Next.js project initialized with TypeScript + Tailwind
- ✅ Supabase project created with basic schema
- ✅ Environment variables configured
- ✅ Git repo initialized (`.gitignore` configured)

---

#### Day 3-4: Analysis Engine (MASTERY-AI Framework - MVP)

**Core Differentiator - Build Custom (No Suitable Alternative)**

**Development Tasks:**

**1. Create Analysis Service (`lib/analysis-engine.ts`)**

```typescript
// lib/analysis-engine.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisResult {
  overall_score: number; // 0-100
  pillar_scores: {
    meaning: number;
    authority: number;
    substance: number;
    technical: number;
    engagement: number;
    response: number;
    yes_saying: number;
    insights: number;
  };
  factor_scores: {
    [key: string]: number; // 18 factors
  };
  recommendations: Recommendation[];
}

export interface Recommendation {
  factor: string;
  current_score: number;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'quick' | 'moderate' | 'significant';
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // Step 1: Fetch page content
  const html = await fetchPageContent(url);

  // Step 2: Extract relevant content (title, headings, body text)
  const content = extractContent(html);

  // Step 3: Run MASTERY-AI Framework analysis (18 factors)
  const analysis = await runMasteryAIAnalysis(content);

  // Step 4: Generate prioritized recommendations
  const recommendations = generateRecommendations(analysis);

  return {
    overall_score: analysis.overall_score,
    pillar_scores: analysis.pillar_scores,
    factor_scores: analysis.factor_scores,
    recommendations,
  };
}

async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (AImpactScanner/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  return response.text();
}

function extractContent(html: string): string {
  // Use cheerio or similar to parse HTML and extract:
  // - <title>
  // - <meta name="description">
  // - <h1>, <h2>, <h3> headings
  // - <p> body text
  // - <a> links (for authority analysis)

  // For MVP validation: Just extract visible text and headings
  // Phase 2: More sophisticated parsing

  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  return {
    title: $('title').text(),
    description: $('meta[name="description"]').attr('content') || '',
    headings: $('h1, h2, h3').map((i, el) => $(el).text()).get(),
    bodyText: $('p').map((i, el) => $(el).text()).get().join('\n'),
  };
}

async function runMasteryAIAnalysis(content: any): Promise<AnalysisResult> {
  // This is the CORE IP - MASTERY-AI Framework prompt

  const prompt = `
You are an AI search optimization expert. Analyze the following web page content using the MASTERY-AI Framework (18 factors across 8 pillars).

**Page Content:**
Title: ${content.title}
Description: ${content.description}
Headings: ${content.headings.join(', ')}
Body: ${content.bodyText.substring(0, 2000)}... (truncated)

**Evaluate these 18 factors (0-100 score each):**

**Pillar 1: Meaning & Clarity**
1. Clear Purpose: Does the page immediately communicate its purpose?
2. Value Proposition: Is the unique value clearly stated?

**Pillar 2: Authority & Trust**
3. Credentials: Does the page demonstrate expertise/authority?
4. Trust Signals: Are there trust indicators (testimonials, certifications, etc.)?

**Pillar 3: Substance & Depth**
5. Content Depth: Is there sufficient, detailed information?
6. Comprehensive Coverage: Does it cover the topic thoroughly?

**Pillar 4: Technical Excellence**
7. Structure: Is the content well-organized with clear hierarchy?
8. Readability: Is the text easy to read and understand?

**Pillar 5: Engagement Hooks**
9. Opening Hook: Does the intro grab attention?
10. Scannable Format: Is the content easy to scan (headings, bullets)?

**Pillar 6: Response Optimization**
11. Answer Quality: Does it directly answer likely questions?
12. Actionable Content: Are there clear next steps?

**Pillar 7: Yes-Saying Amplification**
13. Benefit Focus: Does it focus on benefits vs features?
14. Objection Handling: Does it address common objections?

**Pillar 8: Insights Generation**
15. Unique Insights: Does it provide unique/non-obvious insights?
16. Context Richness: Is there helpful context and examples?

**Additional Factors:**
17. Entity Recognition: Are key entities (people, places, products) clearly mentioned?
18. Source Citability: Would an AI cite this as a credible source?

**Return JSON format:**
{
  "overall_score": <0-100>,
  "pillar_scores": {
    "meaning": <average of factors 1-2>,
    "authority": <average of factors 3-4>,
    ...
  },
  "factor_scores": {
    "clear_purpose": <0-100>,
    "value_proposition": <0-100>,
    ...
  },
  "top_issues": [
    { "factor": "clear_purpose", "issue": "Purpose not stated above the fold", "impact": "high" },
    ...
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Fast, cheap, good quality
    messages: [
      { role: 'system', content: 'You are an AI search optimization expert using the MASTERY-AI Framework.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3, // Low temperature for consistency
  });

  const result = JSON.parse(response.choices[0].message.content);

  return result;
}

function generateRecommendations(analysis: any): Recommendation[] {
  // Sort factors by score (lowest first = highest priority)
  const sortedFactors = Object.entries(analysis.factor_scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 5); // Top 5 issues

  return sortedFactors.map(([factor, score]) => {
    const issue = analysis.top_issues.find((i: any) => i.factor === factor);

    return {
      factor,
      current_score: score,
      recommendation: issue?.issue || 'Improve this factor',
      impact: issue?.impact || 'medium',
      effort: estimateEffort(factor),
    };
  });
}

function estimateEffort(factor: string): 'quick' | 'moderate' | 'significant' {
  // Simple heuristic - refine based on user feedback
  const quickFixes = ['clear_purpose', 'value_proposition', 'opening_hook'];
  const significantFixes = ['content_depth', 'comprehensive_coverage', 'unique_insights'];

  if (quickFixes.includes(factor)) return 'quick';
  if (significantFixes.includes(factor)) return 'significant';
  return 'moderate';
}
```

**2. API Route for Analysis (`app/api/analyze/route.ts`)**

```typescript
// app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/analysis-engine';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const analyzeSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = analyzeSchema.parse(body);

    // Get user (optional for free tier - allow anonymous)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    // Create analysis record (status: processing)
    const { data: analysis, error } = await supabase
      .from('analyses')
      .insert({
        user_id: user?.id || null,
        url,
        status: 'processing',
      })
      .select()
      .single();

    if (error) throw error;

    // Run analysis (8-12 seconds target)
    const result = await analyzeUrl(url);

    // Update analysis record (status: completed)
    await supabase
      .from('analyses')
      .update({
        overall_score: result.overall_score,
        pillar_scores: result.pillar_scores,
        factor_scores: result.factor_scores,
        recommendations: JSON.stringify(result.recommendations),
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysis.id);

    return NextResponse.json({
      analysis_id: analysis.id,
      ...result,
    });

  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

**Deliverables (Day 3-4):**
- ✅ MASTERY-AI Framework analysis engine (18 factors)
- ✅ API route for analysis requests
- ✅ Error handling and validation
- ✅ Analysis speed: 8-12 seconds target

---

#### Day 5-7: Landing Page and Results UI

**Development Tasks:**

**1. Landing Page (`app/page.tsx`)**

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

export default function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(urlSchema),
  });

  const onSubmit = async (data: { url: string }) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url }),
      });

      const result = await response.json();
      setAnalysisResult(result);

    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (analysisResult) {
    return <AnalysisResults result={analysisResult} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AImpactScanner
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            See exactly how AI-ready your content is—with specific fixes—in under 15 seconds
          </p>
          <p className="text-sm text-gray-500">
            Free analysis • No credit card required
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('url')}
              type="text"
              placeholder="https://yourwebsite.com/page"
              className="text-lg py-6"
              disabled={isAnalyzing}
            />
            {errors.url && (
              <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-lg py-6"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Get Your Free Analysis'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✓ 18-factor MASTERY-AI Framework</p>
          <p>✓ Prioritized recommendations</p>
          <p>✓ Results in 8-12 seconds</p>
        </div>
      </div>
    </div>
  );
}
```

**2. Results Page Component (`components/AnalysisResults.tsx`)**

```typescript
// components/AnalysisResults.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalysisResults({ result }: { result: any }) {
  const [showSurvey, setShowSurvey] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Overall Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              AI-Readiness Score: {result.overall_score}/100
            </CardTitle>
            <p className="text-gray-600">
              Your page scores {getScoreLabel(result.overall_score)} for AI search optimization
            </p>
          </CardHeader>
        </Card>

        {/* 8 Pillar Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(result.pillar_scores).map(([pillar, score]) => (
            <Card key={pillar}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{score}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {pillar.replace('_', ' & ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top 5 Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 5 Priority Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold capitalize">
                      {rec.factor.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      Impact: {rec.impact} • Effort: {rec.effort}
                    </span>
                  </div>
                  <p className="text-gray-700">{rec.recommendation}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current score: {rec.current_score}/100
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation Survey (CRITICAL FOR MARKETING PHYSICS) */}
        {showSurvey && (
          <Card className="mb-8 border-2 border-blue-500">
            <CardHeader>
              <CardTitle>Help us improve (2 quick questions)</CardTitle>
            </CardHeader>
            <CardContent>
              <SurveyForm
                analysisId={result.analysis_id}
                onComplete={() => setShowSurvey(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-bold mb-2">
              Want to track improvements over time?
            </h3>
            <p className="mb-4">
              Save this analysis and optimize 10 pages/month with Solo for just $4.95
            </p>
            <Button variant="secondary" size="lg">
              Start 7-Day Free Trial
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}
```

**3. Validation Survey Component (`components/SurveyForm.tsx`)**

```typescript
// components/SurveyForm.tsx - CRITICAL FOR MARKETING PHYSICS VALIDATION
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function SurveyForm({ analysisId, onComplete }: { analysisId: string; onComplete: () => void }) {
  const [ahaMoment, setAhaMoment] = useState<boolean | null>(null);
  const [actionable, setActionable] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClientComponentClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    await supabase.from('validation_surveys').insert({
      analysis_id: analysisId,
      aha_moment: ahaMoment,
      actionable,
      comments,
    });

    setIsSubmitting(false);
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Question 1: Aha Moment */}
      <div>
        <p className="font-semibold mb-2">
          Did this analysis reveal gaps you didn't know existed?
        </p>
        <div className="flex gap-4">
          <Button
            variant={ahaMoment === true ? 'default' : 'outline'}
            onClick={() => setAhaMoment(true)}
          >
            Yes, I learned something valuable
          </Button>
          <Button
            variant={ahaMoment === false ? 'default' : 'outline'}
            onClick={() => setAhaMoment(false)}
          >
            No, nothing new
          </Button>
        </div>
      </div>

      {/* Question 2: Actionability */}
      <div>
        <p className="font-semibold mb-2">
          Could you implement at least 1 recommendation in the next 24 hours?
        </p>
        <div className="flex gap-4">
          <Button
            variant={actionable === true ? 'default' : 'outline'}
            onClick={() => setActionable(true)}
          >
            Yes, I know exactly what to do
          </Button>
          <Button
            variant={actionable === false ? 'default' : 'outline'}
            onClick={() => setActionable(false)}
          >
            No, recommendations unclear
          </Button>
        </div>
      </div>

      {/* Optional Comments */}
      <div>
        <p className="font-semibold mb-2">
          Anything else? (optional)
        </p>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Your feedback helps us improve..."
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={ahaMoment === null || actionable === null || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  );
}
```

**Deliverables (Day 5-7):**
- ✅ Landing page with URL input
- ✅ Analysis results display (score, pillars, recommendations)
- ✅ Validation survey (aha moment, actionability)
- ✅ Upgrade CTA (Solo tier)
- ✅ Responsive design (mobile-friendly)

---

### Week 2: Manual Outreach and Validation Testing

#### Day 8-10: Manual Outreach Campaign

**Marketing Physics Testing - 50 Target Users**

**Outreach Strategy:**

**1. Identify 50 Solopreneurs from Network**
- LinkedIn connections (solopreneurs, coaches, consultants)
- Twitter/X followers (indie hackers, content creators)
- Personal network (friends, former colleagues)
- **Criteria:** Must have a website with strategic pages (not ecommerce/blog aggregators)

**2. Personalized Email Template**

```
Subject: Quick favor? Test my new AI search tool (30 seconds)

Hi [Name],

I'm building a free tool that analyzes web pages for AI search engines (ChatGPT, Perplexity, Claude).

Would you help me test it? Takes 30 seconds:
1. Go to: [validation site URL]
2. Paste your homepage URL
3. Answer 2 quick questions

You'll get a free analysis showing exactly how AI-ready your page is (normally $50+ value if done manually).

Thanks!
[Your Name]

P.S. No signup required - just paste and go.
```

**3. Tracking Spreadsheet (Google Sheets)**

| Name | Email | Date Sent | Visited? | Analyzed? | Survey? | Aha Moment | Actionable | Comments |
|------|-------|-----------|----------|-----------|---------|------------|------------|----------|
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**4. Send 10 Emails Per Day (Day 8-12)**
- Day 8: 10 emails
- Day 9: 10 emails
- Day 10: 10 emails
- Day 11: 10 emails
- Day 12: 10 emails
- **Total: 50 outreach emails**

**Deliverables (Day 8-10):**
- ✅ 50 target contacts identified
- ✅ 30+ emails sent (60% send rate)
- ✅ Tracking spreadsheet created

---

#### Day 11-14: Results Collection and Analysis

**Collect Validation Data**

**1. Monitor Analytics (Vercel Analytics + Supabase Queries)**
- Total visitors (from outreach)
- Total analyses run
- **Activation rate = Analyses / Visitors**

**2. Survey Results (Supabase Query)**
```sql
SELECT
  COUNT(*) as total_surveys,
  SUM(CASE WHEN aha_moment = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as aha_percentage,
  SUM(CASE WHEN actionable = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as actionable_percentage
FROM validation_surveys;
```

**3. Qualitative Feedback**
- Read all survey comments
- Conduct 5-10 follow-up calls with users who completed survey
- **Questions:**
  - "What did you find most valuable?"
  - "What was confusing or unclear?"
  - "Would you pay $4.95/month to track improvements?"

**DECISION GATE Evaluation (Day 14):**

**Success Criteria (Hall's Marketing Physics):**
- ✅ **Activation rate >12%** (visitors who ran analysis)
- ✅ **"Aha moment" >55%** (revealed non-obvious gaps)
- ✅ **Actionability >65%** (can implement recommendations in 24 hours)

**Outcomes:**

**PASS (All 3 criteria met):**
→ Overt Benefit validated
→ Proceed to Phase 2: Build paid tier infrastructure (Week 3-4)

**MARGINAL (2/3 criteria met OR close misses):**
→ Reframe Overt Benefit messaging
→ Test with 50 more people (extend validation 1-2 weeks)
→ Examples:
  - Low activation (8-12%) → Headline not compelling, test new angles
  - Low "aha moment" (45-55%) → Framework not revealing enough, add more factors
  - Low actionability (55-65%) → Recommendations too generic, make more specific

**FAIL (<2 criteria met):**
→ Marketing Physics problem - fundamental promise not resonating
→ **Options:**
  1. Pivot Overt Benefit: Test completely different angle (e.g., "Beat competitors in AI search" instead of "See how AI-ready you are")
  2. Pivot Target Customer: Test with different audience (e.g., agencies, not solopreneurs)
  3. Pivot Product Concept: Abandon page analysis, explore different solution (e.g., AI optimization implementation service)
→ **Do NOT proceed to paid infrastructure until promise validates**

**Deliverables (Day 11-14):**
- ✅ Validation metrics calculated (activation, aha, actionability)
- ✅ Qualitative feedback summarized
- ✅ DECISION GATE evaluation documented
- ✅ Go/No-Go decision for Phase 2

---

## Phase 2: MVP Launch (Weeks 3-12) - IF VALIDATION PASSES

### Strategic Objective

**Build and launch all 4 tiers (Starter/Solo/Growth/Scale) with complete payment infrastructure.**

**Timeline:** 10 weeks (Weeks 3-12)
**Team:** 1-2 developers (300-400 hours total)
**Budget:** $500-1,000 (Stripe, Supabase, Vercel, OpenAI API)

---

### Week 3-4: Payment Infrastructure and Tier System

#### Day 15-18: Stripe Integration

**Development Tasks:**

**1. Set Up Stripe Account**
- Create Stripe account (or use existing)
- Create products and prices:
  - Solo: $4.95/month (price_solo_monthly)
  - Solo Annual: $49.50/year (price_solo_annual)
  - Growth: $14.95/month (price_growth_monthly)
  - Growth Annual: $149/year (price_growth_annual)
  - Scale: $29.95/month (price_scale_monthly)
  - Scale Annual: $299/year (price_scale_annual)
- Note: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Configure webhook endpoint: `https://yourapp.com/api/webhooks/stripe`

**2. Install Stripe Dependencies**
```bash
npm install stripe
npm install @stripe/stripe-js
```

**3. Subscription Creation API (`app/api/checkout/route.ts`)**

```typescript
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  const { priceId } = await request.json();

  // Get authenticated user
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      trial_period_days: priceId.includes('solo') ? 7 : 14,
      metadata: {
        user_id: user.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
```

**4. Stripe Webhook Handler (`app/api/webhooks/stripe/route.ts`)**

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for admin access
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const userId = subscription.metadata.user_id;

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  // Update user profile with subscription info
  await supabase.from('user_profiles').update({
    tier,
    stripe_customer_id: session.customer,
    stripe_subscription_id: subscription.id,
    billing_period_start: new Date(),
    updated_at: new Date(),
  }).eq('id', userId);
}

function getTierFromPriceId(priceId: string): 'solo' | 'growth' | 'scale' {
  if (priceId.includes('solo')) return 'solo';
  if (priceId.includes('growth')) return 'growth';
  if (priceId.includes('scale')) return 'scale';
  return 'solo'; // Default fallback
}

// Implement other webhook handlers similarly...
```

**Deliverables (Day 15-18):**
- ✅ Stripe account configured with all products/prices
- ✅ Checkout session creation API
- ✅ Webhook handler for subscription events
- ✅ Database schema updated with subscription fields

---

#### Day 19-21: Authentication and User Management

**Development Tasks:**

**1. Supabase Auth Setup**
- Enable email/password auth (already default)
- Configure email templates (welcome, password reset)
- Set up Google OAuth (optional - nice-to-have)

**2. Sign Up Page (`app/signup/page.tsx`)**

```typescript
// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Create user profile
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email: data.user.email,
        tier: 'starter',
      });

      router.push('/verify-email');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters, 1 uppercase, 1 number
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
```

**3. Login Page (`app/login/page.tsx`)**
- Similar structure to signup page
- Use `supabase.auth.signInWithPassword()`

**4. Password Reset Flow**
- Reset request page: Email input → send reset link
- Reset confirmation page: New password input → update password

**5. Auth Callback Route (`app/auth/callback/route.ts`)**
```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**Deliverables (Day 19-21):**
- ✅ Sign up page with email verification
- ✅ Login page
- ✅ Password reset flow
- ✅ Auth callback handling
- ✅ User profile creation on signup

---

### Week 5-6: Dashboard and Analysis History

#### Day 22-25: Basic Dashboard (All Tiers)

**Development Tasks:**

**1. Dashboard Layout (`app/dashboard/page.tsx`)**

```typescript
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { QuotaUsage } from '@/components/QuotaUsage';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { AnalyzeUrlForm } from '@/components/AnalyzeUrlForm';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch analyses for current billing period
  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', profile.billing_period_start)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            {profile.tier === 'starter' ? 'Free Plan' : `${capitalize(profile.tier)} Plan`}
          </p>
        </div>

        {/* Quota Usage Widget */}
        <QuotaUsage tier={profile.tier} usedCount={analyses?.length || 0} />

        {/* Analyze URL Form */}
        <AnalyzeUrlForm />

        {/* Analysis History */}
        <AnalysisHistory analyses={analyses || []} tier={profile.tier} />
      </div>
    </div>
  );
}
```

**2. Quota Usage Component (`components/QuotaUsage.tsx`)**

```typescript
// components/QuotaUsage.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const TIER_QUOTAS = {
  starter: 1,
  solo: 10,
  growth: 40,
  scale: 100,
};

export function QuotaUsage({ tier, usedCount }: { tier: string; usedCount: number }) {
  const quota = TIER_QUOTAS[tier as keyof typeof TIER_QUOTAS] || 1;
  const percentUsed = Math.min((usedCount / quota) * 100, 100);
  const remaining = Math.max(quota - usedCount, 0);

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Usage This Month</h3>
          <span className="text-sm text-gray-600">
            {usedCount}/{quota} analyses ({percentUsed.toFixed(0)}%)
          </span>
        </div>

        <Progress value={percentUsed} className="mb-2" />

        <p className="text-sm text-gray-600">
          {remaining} analyses remaining this month
        </p>

        {percentUsed >= 80 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">
              Running low on analyses
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {tier === 'solo' && 'Upgrade to Growth for 40 analyses/month ($14.95)'}
              {tier === 'growth' && 'Upgrade to Scale for 100 analyses/month ($29.95)'}
              {tier === 'starter' && 'Upgrade to Solo for 10 analyses/month ($4.95)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**3. Analysis History Component (`components/AnalysisHistory.tsx`)**

```typescript
// components/AnalysisHistory.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AnalysisHistory({ analyses, tier }: { analyses: any[]; tier: string }) {
  // Filter analyses based on tier retention
  const retentionDays = tier === 'starter' ? 7 : tier === 'solo' ? 30 : tier === 'growth' ? 90 : null;
  const cutoffDate = retentionDays ? new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000) : null;

  const visibleAnalyses = cutoffDate
    ? analyses.filter(a => new Date(a.created_at) > cutoffDate)
    : analyses;

  if (visibleAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No analyses yet. Run your first analysis above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
        <p className="text-sm text-gray-600">
          {tier === 'starter' && 'Last 7 days only (upgrade for longer history)'}
          {tier === 'solo' && 'Last 30 days'}
          {tier === 'growth' && 'Last 90 days'}
          {tier === 'scale' && 'All analyses (unlimited history)'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleAnalyses.map((analysis) => (
            <div key={analysis.id} className="flex items-center justify-between border-b pb-4">
              <div className="flex-1">
                <p className="font-medium truncate">{analysis.url}</p>
                <p className="text-sm text-gray-600">
                  {new Date(analysis.created_at).toLocaleDateString()} • Score: {analysis.overall_score}/100
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/analysis/${analysis.id}`}>View</a>
                </Button>
                {tier !== 'starter' && (
                  <Button variant="outline" size="sm">
                    Re-run
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Deliverables (Day 22-25):**
- ✅ Dashboard layout with quota usage
- ✅ Analysis history table
- ✅ Tier-based retention filtering
- ✅ Upgrade CTAs based on usage

---

#### Day 26-28: PDF Export (Solo+) and CSV Export (Growth+)

**Development Tasks:**

**1. Install PDF Generation Library**
```bash
npm install @react-pdf/renderer
```

**2. PDF Export API Route (`app/api/export/pdf/[id]/route.ts`)**

```typescript
// app/api/export/pdf/[id]/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { renderToStream } from '@react-pdf/renderer';
import { AnalysisReportPDF } from '@/components/AnalysisReportPDF';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user tier (Solo+)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (profile.tier === 'starter') {
    return NextResponse.json({ error: 'Upgrade to Solo for PDF export' }, { status: 403 });
  }

  // Fetch analysis
  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  // Generate PDF
  const stream = await renderToStream(<AnalysisReportPDF analysis={analysis} />);

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="aimpactscanner-${analysis.id}.pdf"`,
    },
  });
}
```

**3. CSV Export API Route (`app/api/export/csv/[id]/route.ts`)**
- Similar to PDF export, but generate CSV format
- Tier check: Growth+

**Deliverables (Day 26-28):**
- ✅ PDF export for Solo+ tiers
- ✅ CSV export for Growth+ tiers
- ✅ Tier-based access control
- ✅ Download buttons in dashboard

---

### Week 7-8: Growth Tier Features (Comparison Reports, Trends)

#### Day 29-32: Comparison Reports (Growth+)

**Development Tasks:**

**1. Comparison Page (`app/compare/page.tsx`)**

```typescript
// app/compare/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ComparisonChart } from '@/components/ComparisonChart';
import { Button } from '@/components/ui/button';

export default function ComparePage() {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState(null);
  const supabase = createClientComponentClient();

  const handleCompare = async () => {
    const { data } = await supabase
      .from('analyses')
      .select('*')
      .in('id', selectedAnalyses);

    setComparisonData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Compare Analyses</h1>

        {/* Analysis Selector */}
        <AnalysisSelector
          selected={selectedAnalyses}
          onSelect={setSelectedAnalyses}
          maxSelect={tier === 'growth' ? 2 : 5} // Growth: 2, Scale: 5
        />

        <Button
          onClick={handleCompare}
          disabled={selectedAnalyses.length < 2}
          className="mt-4"
        >
          Compare Selected ({selectedAnalyses.length})
        </Button>

        {/* Comparison Results */}
        {comparisonData && (
          <ComparisonChart data={comparisonData} />
        )}
      </div>
    </div>
  );
}
```

**2. Comparison Chart Component**
- Use Recharts or Chart.js for visualizations
- Side-by-side pillar score comparison
- Factor-level diff highlighting

**Deliverables (Day 29-32):**
- ✅ Comparison page (select up to 2 analyses for Growth, 5 for Scale)
- ✅ Visual comparison charts
- ✅ Export comparison as PDF

---

#### Day 33-35: Trend Visualization (Growth+)

**Development Tasks:**

**1. Add Trend Charts to Dashboard**
- Line chart showing average score over time
- Sparklines for individual page trends
- Portfolio health widget

**2. Database Query for Trends**
```typescript
// Fetch analyses grouped by week/month
const { data: trends } = await supabase
  .from('analyses')
  .select('created_at, overall_score, url')
  .eq('user_id', user.id)
  .gte('created_at', ninetyDaysAgo)
  .order('created_at', { ascending: true });

// Group by week and calculate average
const weeklyAverages = groupByWeek(trends);
```

**Deliverables (Day 33-35):**
- ✅ Trend visualization in dashboard
- ✅ Historical score tracking
- ✅ Portfolio average score widget

---

### Week 9-10: Scale Tier Features (API, Custom Reports, Team Collaboration)

#### Day 36-39: Read-Only API (Scale Only)

**Development Tasks:**

**1. API Key Management**
- Generate API key + secret on Scale tier signup
- Store in `user_profiles` table
- API key rotation endpoint

**2. API Endpoints (`app/api/v1/...`)**
- `GET /api/v1/analyses` - List analyses
- `GET /api/v1/analyses/:id` - Get analysis details
- `GET /api/v1/analyses/:id/export` - Export analysis
- `POST /api/v1/webhooks` - Register webhook

**3. API Authentication Middleware**
```typescript
// lib/api-auth.ts
export async function authenticateAPI(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const [apiKey, apiSecret] = authHeader.slice(7).split(':');

  // Validate API key + secret
  const { data: user } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('api_key', apiKey)
    .eq('api_secret', apiSecret)
    .single();

  if (!user || user.tier !== 'scale') {
    throw new Error('Invalid API credentials or insufficient tier');
  }

  return user;
}
```

**Deliverables (Day 36-39):**
- ✅ API key generation and management
- ✅ 4 core API endpoints (list, get, export, webhooks)
- ✅ API authentication middleware
- ✅ Rate limiting (100 requests/hour)
- ✅ API documentation page

---

#### Day 40-42: Custom Reports and Team Collaboration (Scale Only)

**Development Tasks:**

**1. Custom Report Builder**
- Select pages, date range, metrics
- Save report templates
- Schedule email delivery (weekly/monthly)

**2. Team Collaboration**
- Invite team members (up to 3 seats)
- Share analyses with team
- Role-based permissions (Admin, Member)

**3. White-Label PDF Export**
- Option to remove AImpactScanner branding
- Add custom logo
- Customize report colors/fonts

**Deliverables (Day 40-42):**
- ✅ Custom report builder
- ✅ Team invitation system (3 seats max)
- ✅ White-label PDF option

---

### Week 11-12: Launch Preparation and Polish

#### Day 43-48: Final Testing and Bug Fixes

**Development Tasks:**

**1. End-to-End Testing**
- Test all 4 tier flows (Starter, Solo, Growth, Scale)
- Test upgrade/downgrade paths
- Test payment failures and retries
- Test quota enforcement
- Test data retention and deletion

**2. Performance Optimization**
- Optimize analysis speed (<8 seconds target)
- Database query optimization (indexes, caching)
- Image optimization (Vercel Image Optimization)
- Code splitting and lazy loading

**3. Security Audit**
- Review all API routes for auth checks
- Test SQL injection vulnerabilities (Supabase parameterized queries)
- Review environment variable exposure
- Set up Sentry error tracking

**Deliverables (Day 43-48):**
- ✅ All critical bugs fixed
- ✅ Performance targets met (<8 second analysis)
- ✅ Security audit passed

---

#### Day 49-56: Marketing Site and Launch Communications

**Development Tasks:**

**1. Marketing Site Pages**
- Homepage: Headline, benefits, social proof, CTA
- Pricing Page: Tier comparison table, FAQs
- Features Page: MASTERY-AI Framework explanation
- About Page: Mission, team, contact

**2. Email Sequences (Resend)**
- Welcome email (signup)
- Trial start email (Solo/Growth/Scale)
- Trial midpoint email (Day 7 for 14-day trial)
- Trial ending email (2 days before trial ends)
- Conversion email (trial ends)
- Monthly usage email (Day 15 of billing period)

**3. Documentation**
- Getting Started guide
- MASTERY-AI Framework explanation
- How to interpret scores
- API documentation (Scale tier)

**4. Launch Checklist**
- [x] All features tested and working
- [x] Payment processing functional
- [x] Email sequences configured
- [x] Documentation complete
- [x] Marketing site live
- [x] Analytics and monitoring set up
- [x] Support email (support@aimpactscanner.com) configured
- [x] Social media accounts created
- [x] Launch announcement drafted

**Deliverables (Day 49-56):**
- ✅ Marketing site launched
- ✅ Email sequences configured
- ✅ Documentation published
- ✅ Launch communications ready

---

## Phase 3: Growth and Optimization (Months 4-12)

### Strategic Objective

**Drive to 1,000 Growth tier customers ($15K MRR) and validate Hedgehog Concept (70% retention).**

**Timeline:** 9 months (Months 4-12)
**Team:** 1-2 developers + marketing support
**Focus:** Customer acquisition, retention, product iteration

---

### Month 4-6: Growth Acceleration

**Key Initiatives:**

**1. Content Marketing (SEO)**
- Publish 2-3 blog posts per week
- Topics: AI search optimization, ChatGPT SEO, Perplexity ranking factors
- Target keywords: "AI search optimization," "ChatGPT SEO," "optimize for AI"

**2. Partnerships**
- WordPress plugin integration
- Shopify app integration
- Webflow integration

**3. Referral Program**
- Refer a friend, get 1 month free
- Referred friend gets 1 month free
- Track referrals in dashboard

**4. Product Improvements**
- A/B test pricing page messaging
- Optimize trial onboarding flow
- Improve analysis speed (<6 seconds stretch goal)
- Add more factors (18 → 30 factors)

**Success Metrics:**
- Reach 500 Growth tier customers ($7.5K MRR)
- Month 3-6 retention: >65% (approaching 70% target)
- Free → Paid conversion: >8%
- Trial → Paid conversion: >25%

---

### Month 7-12: Scale and AImpact Assistant Launch

**Key Initiatives:**

**1. AImpact Assistant (Phase 2 Product)**
- Conversational AI for follow-up questions
- "Investigate" deep-dives (Growth/Scale tiers)
- Implementation guidance

**2. Framework Expansion**
- Growth tier: 48 factors (18 → 48)
- Scale tier: 148 factors (full framework)

**3. Tier Enhancements**
- Growth: Increase historical tracking to 120 days
- Scale: Increase team seats to 5, add white-label reports

**4. Enterprise Exploration**
- Test "Agency" tier at $99/month
- Features: 500 analyses/month, unlimited seats, SLA guarantees

**Success Metrics:**
- Reach 1,000 Growth tier customers ($15K MRR)
- **Growth tier 12-month retention: >70%** ⭐ HEDGEHOG VALIDATION
- LTV:CAC ratio: >3.5:1
- Net Promoter Score (NPS): >50

**Month 6 Pivot Decision:**
- If retention <70% → Root cause analysis, rapid iteration, pivot/sunset decision per Vision & Mission

---

## Appendix: Development Resources

### Recommended Tech Stack

**Core Infrastructure:**
- **Framework:** Next.js 14+ (App Router, Server Components)
- **Hosting:** Vercel (Edge Functions, automatic scaling)
- **Database:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Payments:** Stripe (Checkout, Subscriptions, Customer Portal)
- **Email:** Resend (transactional + marketing emails)
- **AI/ML:** OpenAI API (GPT-4o for content analysis)

**Developer Tools:**
- **Version Control:** Git + GitHub
- **Package Manager:** npm or pnpm
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint (Airbnb style guide)
- **Formatting:** Prettier
- **Testing:** Vitest (unit tests) + Playwright (E2E tests)
- **CI/CD:** GitHub Actions (automated testing + deployment)

**Monitoring and Analytics:**
- **Error Tracking:** Sentry
- **Performance:** Vercel Analytics
- **Product Analytics:** PostHog (feature flags, A/B testing)
- **User Feedback:** Tally or Typeform (surveys)

### Estimated Costs

**Development Phase (Weeks 1-12):**
- **Labor:** 300-400 hours @ $50-100/hr = $15K-40K (or $0 if solo founder)
- **Tools/Services:** $500-1,000 (Stripe, Supabase, Vercel, OpenAI API)
- **Total:** $15.5K-41K (or $500-1K if solo founder)

**Operational Costs (Monthly at $15K MRR):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Stripe fees: ~$150/month (2.9% + $0.30 per transaction)
- Resend: $20/month (50K emails)
- OpenAI API: $200-500/month (analysis volume)
- Sentry: $26/month (team plan)
- PostHog: $0 (generous free tier)
- **Total:** $441-741/month (96-97% gross margin)

### Code Repositories

**GitHub Repository Structure:**
```
aimpactscanner/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard
│   ├── pricing/           # Pricing page
│   ├── api/               # API routes
│   └── ...
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── ...
├── lib/                   # Utility functions
│   ├── analysis-engine.ts # MASTERY-AI Framework
│   ├── supabase.ts        # Supabase client
│   └── ...
├── public/                # Static assets
├── .env.local             # Environment variables (NOT committed)
├── package.json
├── tsconfig.json
└── README.md
```

### Key Third-Party Documentation

- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Stripe:** https://stripe.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **OpenAI API:** https://platform.openai.com/docs
- **Resend:** https://resend.com/docs

---

## Document Control

**Version History:**
- v1.0 (2025-10-18): Initial implementation plan

**Next Review:** Weekly during development, monthly post-launch

**Related Documents:**
- `/documents/foundation/AImpactScanner Tier Specification.md` - Complete feature specifications
- `/documents/foundation/Vision and Mission.md` - Strategic vision and success metrics
- `/documents/foundation/positioning-statement.md` - Market positioning

**Approval Required From:**
- Engineering Leadership: Technical feasibility and timeline estimates
- Product Leadership: Feature prioritization and roadmap
- Finance: Budget allocation and revenue targets

---

**Owner:** Engineering Leadership
**Last Updated:** October 18, 2025
**Distribution:** Engineering, Product, Finance teams

---

**END OF IMPLEMENTATION PLAN**
