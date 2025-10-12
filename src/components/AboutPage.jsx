import React, { useEffect } from 'react';
import NavigationButtons from './NavigationButtons';

const AboutPage = ({ onNavigate, isAuthenticated }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-8">
        <NavigationButtons 
          currentView="about" 
          onNavigate={onNavigate} 
          isAuthenticated={isAuthenticated} 
        />
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">About AImpactScanner</h1>
          <p className="text-xl text-blue-100">
            Built by a solopreneur solving a real problem
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          {/* Founder Story */}
          <section className="mb-12 bg-gradient-to-br from-blue-50 to-white p-8 rounded-lg border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Problem That Started It All</h2>
            <p className="text-gray-700 mb-4">
              I'm Jamie Watters, a solopreneur building apps and websites to solve my own real problems.
              When I started creating digital products, I faced a challenge: <strong>how do you get AI search
              engines to drive qualified, ready-to-buy traffic to your sites and apps?</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Traditional SEO tactics weren't working. ChatGPT, Claude, Perplexity, and other AI assistants
              were becoming primary information sources for millions of users, but my sites were invisible to them.
              I needed a way to understand how AI systems see content and what makes them cite certain sources.
            </p>
            <p className="text-gray-700 mb-4">
              So I built AImpactScanner. What started as a tool for my own needs became something bigger—a platform
              that helps anyone optimize their content for the new era of AI-powered search.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a
                href="https://jamiewatters.work"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Follow My Journey
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              AImpactScanner helps businesses and content creators optimize their online presence for AI-powered
              search engines. As ChatGPT, Claude, Perplexity, and other AI assistants become primary information
              sources, we ensure your content is discoverable, citable, and authoritative in AI responses.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The MASTERY-AI Framework</h2>
            <p className="text-gray-700 mb-4">
              Our proprietary MASTERY-AI Framework v3.1.1 analyzes 148 critical factors across 8 optimization 
              pillars. This comprehensive approach ensures your website meets the requirements of modern AI 
              systems while maintaining excellence in traditional search engines.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">🤖 AI Response Optimization</h3>
                <p className="text-gray-600 text-sm">Citation-worthy content structure</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">🔐 Authority & Trust Signals</h3>
                <p className="text-gray-600 text-sm">Credibility markers for AI systems</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">⚙️ Machine Readability</h3>
                <p className="text-gray-600 text-sm">Technical infrastructure optimization</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">📝 Semantic Content Quality</h3>
                <p className="text-gray-600 text-sm">Context and meaning optimization</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why AI Optimization Matters</h2>
            <p className="text-gray-700 mb-4">
              Traditional SEO is no longer enough. AI systems have different requirements for content 
              discovery, evaluation, and citation. Without proper optimization, your valuable content 
              may be invisible to the millions of users who now rely on AI assistants for information.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Over 100 million weekly active ChatGPT users</li>
              <li>AI search queries growing 300% year-over-year</li>
              <li>70% of AI responses cite optimized sources</li>
              <li>Businesses losing 40% of organic traffic to AI answers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 mb-4">
              Use AImpactScanner to analyze your website's AI optimization score for free. Discover 
              exactly how AI systems see your content and get actionable recommendations to improve 
              your visibility in AI-powered search results.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Analyze Your Site Free
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;