import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Urgency Banner */}
          <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-8">
            <span className="animate-pulse mr-2">🔴</span>
            <span className="font-semibold">Warning:</span>&nbsp;
            <span>AI is reshaping search - 65% of businesses losing traffic</span>
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

          {/* Social Proof */}
          <div className="flex justify-center items-center gap-8 mb-12">
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white" />
              ))}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">5,247 businesses</div>
              <div className="text-sm text-gray-600">protecting their traffic</div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">148</div>
              <div className="text-sm text-gray-600">AI Ranking Factors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">15s</div>
              <div className="text-sm text-gray-600">Analysis Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$2.5K</div>
              <div className="text-sm text-gray-600">Avg. Monthly Recovery</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">5,247</div>
              <div className="text-sm text-gray-600">Sites Analyzed</div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Discover */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What You'll Discover</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-4">📉</div>
            <h3 className="font-semibold text-lg mb-2">Traffic Loss Analysis</h3>
            <p className="text-gray-600">See exactly how much traffic AI is stealing and which queries you're losing</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-4">🎯</div>
            <h3 className="font-semibold text-lg mb-2">Competitor Comparison</h3>
            <p className="text-gray-600">Know where you rank vs competitors in AI search results</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-4">🚀</div>
            <h3 className="font-semibold text-lg mb-2">Recovery Roadmap</h3>
            <p className="text-gray-600">Get specific actions to reclaim your traffic and protect your business</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Smart Businesses</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "Found out we were losing 40% of our informational traffic to AI. 
                Fixed it in 2 weeks with their recommendations."
              </p>
              <div className="font-semibold">Sarah Chen</div>
              <div className="text-sm text-gray-500">Marketing Director</div>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "Eye-opening analysis. We're now ranking #1 in ChatGPT for our main keywords. 
                Traffic is up 67%."
              </p>
              <div className="font-semibold">Michael Torres</div>
              <div className="text-sm text-gray-500">SaaS Founder</div>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "The competitor analysis alone was worth 10x the price. 
                Incredible insights we couldn't get anywhere else."
              </p>
              <div className="font-semibold">Emma Williams</div>
              <div className="text-sm text-gray-500">E-commerce Owner</div>
            </div>
          </div>
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