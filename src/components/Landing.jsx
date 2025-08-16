import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TrustBadges from './TrustBadges';

function Landing({ onAnalysisComplete }) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (inputUrl) => {
    try {
      let urlToValidate = inputUrl.trim();
      if (!urlToValidate) return null;
      
      if (!urlToValidate.match(/^https?:\/\//)) {
        urlToValidate = 'https://' + urlToValidate;
      }
      
      const urlObj = new URL(urlToValidate);
      return urlObj.href;
    } catch {
      return null;
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    
    // Generate a temporary analysis ID
    const tempAnalysisId = crypto.randomUUID();
    
    // Store URL and ID for later use
    sessionStorage.setItem('pendingAnalysisUrl', validatedUrl);
    sessionStorage.setItem('pendingAnalysisId', tempAnalysisId);
    
    // Trigger analysis complete callback with URL
    onAnalysisComplete(validatedUrl, tempAnalysisId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img 
              src="/images/logos/logo-primary-240x60-transparent.png" 
              alt="AImpactScanner" 
              className="h-16 md:h-24"
            />
            <div className="text-sm text-gray-600">
              AI Search Optimization Platform
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="text-center">
          {/* Urgency Banner */}
          <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-8">
            <span className="animate-pulse mr-2">🔴</span>
            <span className="font-semibold">Warning:</span>&nbsp;
            <span>AI is reshaping search - protect your traffic now</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Is AI Stealing Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Traffic?</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ChatGPT, Claude, and Perplexity are answering questions about your business 
            without sending visitors to your site. See exactly what you're losing and how to fix it.
          </p>

          {/* Social Proof - Real Clients */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <div className="font-semibold text-gray-900 text-lg">Trusted by 7 pioneering sites</div>
              <div className="text-sm text-gray-600">Real clients using our AI optimization analysis</div>
            </div>
            
            {/* Client Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-5xl mx-auto">
              {[
                'FreeCalcHub',
                'Evolve-7',
                'Agent-11', 
                'Agents-11',
                'LLMtxt Mastery',
                'AI Search Mastery',
                'MCP-11'
              ].map((client, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow">
                  <div className="text-sm font-medium text-gray-900">{client}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Form */}
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL..."
                className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !url.trim()}
                className="px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAnalyzing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze My Site Free'
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-600">{error}</p>
            )}
          </form>

          <p className="mt-4 text-sm text-gray-500">
            No email required • See results in 15 seconds • 100% free analysis
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <TrustBadges />
        </div>
      </div>

      {/* What You'll Discover */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What You'll Discover</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/images/features/feature-ai-analysis-600x400.png" alt="AI Analysis" className="w-full h-32 object-contain mb-4" />
            <h3 className="font-semibold text-lg mb-2">Traffic Loss Analysis</h3>
            <p className="text-gray-600">See exactly how much traffic AI is stealing and which queries you're losing</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/images/features/feature-competitor-comparison-600x400.png" alt="Competitor Comparison" className="w-full h-32 object-contain mb-4" />
            <h3 className="font-semibold text-lg mb-2">Competitor Comparison</h3>
            <p className="text-gray-600">Know where you rank vs competitors in AI search results</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img src="/images/features/feature-recovery-roadmap-600x400.png" alt="Recovery Roadmap" className="w-full h-32 object-contain mb-4" />
            <h3 className="font-semibold text-lg mb-2">Recovery Roadmap</h3>
            <p className="text-gray-600">Get specific actions to reclaim your traffic and protect your business</p>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Growing Community</h2>
          <p className="text-lg text-gray-600 mb-8">
            Thousands of businesses are already using AI analysis to optimize their websites and protect their traffic.
          </p>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-sm text-gray-600">Businesses Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.4x</div>
              <div className="text-sm text-gray-600">Average Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">15s</div>
              <div className="text-sm text-gray-600">Analysis Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Solopreneur Story Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-200 mb-6">
            <span className="text-blue-600 font-semibold">Built by a solopreneur, for solopreneurs</span>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            No team, no overhead, just automated excellence. I built this tool because I needed it myself.
          </p>
          <p className="text-gray-600">
            When AI started changing search, I couldn't afford expensive consultants or enterprise tools. 
            So I created the analysis I wished existed - comprehensive, affordable, and actually actionable.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Don't Let AI Steal Another Visitor
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Every day you wait, competitors get stronger in AI search results.
          See what you're losing right now - completely free.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-all"
        >
          Analyze My Site Now →
        </button>
      </div>
    </div>
  );
}

export default Landing;