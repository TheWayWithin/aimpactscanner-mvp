import React, { useState, useEffect } from 'react';
import { Bot, Shield, Settings, FileText, Users, Wrench, Link, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AILogo from './AILogo';

const pillars = [
  {
    key: 'AI',
    icon: <Bot className="w-6 h-6" />,
    name: 'AI Response Optimization & Citation',
    weight: '23.8%',
    factors: [
      { name: 'Citation-Worthy Content Structure', description: 'Measures factual density, supporting evidence, and data that AI models can reference.' },
      { name: 'Query-Intent Alignment', description: 'How well content matches the types of questions users ask AI.' },
      { name: 'AI-Friendly Content Formatting', description: 'Structured data, clear headings, and parseable content layout.' },
    ],
  },
  {
    key: 'A',
    icon: <Shield className="w-6 h-6" />,
    name: 'Authority & Trust Signals',
    weight: '17.9%',
    factors: [
      { name: 'Source Authority Signals', description: 'Author bylines, credentials, publication dates, and expert indicators.' },
      { name: 'Trust Infrastructure', description: 'HTTPS, privacy policy, contact information, and trust seals.' },
      { name: 'External Validation', description: 'Backlinks, mentions, reviews, and third-party endorsements.' },
    ],
  },
  {
    key: 'M',
    icon: <Settings className="w-6 h-6" />,
    name: 'Machine Readability & Technical Infrastructure',
    weight: '14.6%',
    factors: [
      { name: 'Title Tag Optimization', description: 'Presence, length, keyword inclusion, and uniqueness.' },
      { name: 'Meta Description Quality', description: 'Length, call-to-action, value proposition clarity.' },
      { name: 'LLMs.txt Implementation', description: 'Presence and quality of /llms.txt file for AI content accessibility.' },
      { name: 'Structured Data Markup', description: 'Schema.org implementation, JSON-LD, rich snippets eligibility.' },
    ],
  },
  {
    key: 'S',
    icon: <FileText className="w-6 h-6" />,
    name: 'Semantic Content Quality',
    weight: '13.9%',
    factors: [
      { name: 'Heading Hierarchy', description: 'Logical H1-H6 structure that creates a clear content outline.' },
      { name: 'Content Depth & Comprehensiveness', description: 'Topic coverage, word count, and content completeness.' },
      { name: 'Semantic HTML Usage', description: 'Proper use of article, section, nav, aside, and other semantic elements.' },
    ],
  },
  {
    key: 'E',
    icon: <Users className="w-6 h-6" />,
    name: 'Engagement & User Experience',
    weight: '10.9%',
    factors: [
      { name: 'Content Readability', description: 'Reading level, sentence length, paragraph structure, and scannability.' },
      { name: 'Interactive Elements', description: 'CTAs, forms, tools, and engagement mechanisms.' },
      { name: 'Visual Content Integration', description: 'Images, videos, infographics with proper alt text and captions.' },
    ],
  },
  {
    key: 'T',
    icon: <Wrench className="w-6 h-6" />,
    name: 'Technical SEO & Foundation',
    weight: '8.9%',
    factors: [
      { name: 'Security and Access Control', description: 'HTTPS protocol, SSL certificate validity, secure resource loading.' },
      { name: 'Mobile Responsiveness', description: 'Viewport configuration, responsive design, touch-friendly elements.' },
      { name: 'URL Structure', description: 'Clean URLs, logical hierarchy, keyword inclusion.' },
      { name: 'Internal Linking', description: 'Navigation structure, contextual links, orphan page prevention.' },
    ],
  },
  {
    key: 'R',
    icon: <Link className="w-6 h-6" />,
    name: 'Reference Networks & Citations',
    weight: '5.9%',
    factors: [
      { name: 'Outbound Citation Quality', description: 'Links to authoritative sources that validate claims.' },
      { name: 'Inbound Reference Potential', description: 'Content that other sites and AI models are likely to cite.' },
      { name: 'Cross-Platform Presence', description: 'Consistent presence across platforms AI models train on.' },
    ],
  },
  {
    key: 'Y',
    icon: <TrendingUp className="w-6 h-6" />,
    name: 'Yield Optimization & Freshness',
    weight: '4.1%',
    factors: [
      { name: 'Content Freshness', description: 'Last updated dates, content currency, and regular updates.' },
      { name: 'Conversion Path Clarity', description: 'Clear next steps, CTAs, and value proposition.' },
      { name: 'Content Uniqueness', description: 'Original insights, proprietary data, and unique perspectives.' },
    ],
  },
];

const MethodologyPage = ({ onNavigate, isAuthenticated }) => {
  const [expandedPillar, setExpandedPillar] = useState(null);

  useEffect(() => {
    document.title = 'MASTERY-AI Framework Methodology | AImpactScanner';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-mastery border-b border-mastery/80" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-3">
              <AILogo className="h-10 md:h-12" />
              <div>
                <div className="text-lg font-bold text-white">AImpactScanner</div>
                <div className="text-xs text-white/70">Part of AI Search Mastery</div>
              </div>
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="text-white/80 hover:text-white text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-mastery to-clarity py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The MASTERY-AI Framework
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            27 factors across 8 pillars. Every factor is published. Every score is reproducible.
            Transparency is the foundation of trust.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-4">
          {pillars.map((pillar) => (
            <div key={pillar.key} className="border border-mist rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedPillar(expandedPillar === pillar.key ? null : pillar.key)}
                aria-expanded={expandedPillar === pillar.key}
                aria-controls={`pillar-${pillar.key}`}
                className="w-full flex items-center justify-between p-5 bg-cloud hover:bg-mist/50 transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                <div className="flex items-center gap-4">
                  <div className="text-signal">{pillar.icon}</div>
                  <div className="text-left">
                    <div className="font-semibold text-ink">{pillar.name}</div>
                    <div className="text-xs text-stone">
                      Weight: {pillar.weight} | {pillar.factors.length} factors
                    </div>
                  </div>
                </div>
                {expandedPillar === pillar.key ? (
                  <ChevronUp className="w-5 h-5 text-stone" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone" aria-hidden="true" />
                )}
              </button>

              {expandedPillar === pillar.key && (
                <div id={`pillar-${pillar.key}`} className="border-t border-mist p-5 space-y-4">
                  {pillar.factors.map((factor) => (
                    <div key={factor.name} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-signal rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-ink text-sm">{factor.name}</div>
                        <div className="text-sm text-slate">{factor.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scoring explanation */}
        <div className="mt-12 bg-cloud rounded-xl border border-mist p-8">
          <h2 className="text-xl font-bold text-ink mb-4">How Scoring Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold text-red-500 mb-1">0-59</div>
              <div className="text-sm font-medium text-ink">Needs Improvement</div>
              <p className="text-xs text-slate mt-1">Significant gaps that reduce AI visibility.</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber mb-1">60-79</div>
              <div className="text-sm font-medium text-ink">Good</div>
              <p className="text-xs text-slate mt-1">Solid foundation with room for optimization.</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-clarity mb-1">80-100</div>
              <div className="text-sm font-medium text-ink">Excellent</div>
              <p className="text-xs text-slate mt-1">Well-optimized for AI discovery and citation.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-slate mb-4">Ready to see how your site scores?</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-8 py-3 bg-signal text-white font-semibold rounded-lg hover:bg-signal/90 transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
          >
            Scan My Page Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default MethodologyPage;
