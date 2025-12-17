import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TrustBadges from './TrustBadges';
import AILogo from './AILogo';
import NavigationButtons from './NavigationButtons';

function Landing({ onAnalysisComplete, onNavigate, isAuthenticated }) {
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
    
    try {
      // Generate analysis ID and temporary user ID for anonymous analysis
      const analysisId = crypto.randomUUID();
      const tempUserId = 'temp_' + crypto.randomUUID();
      
      // Store analysis data in localStorage for later access
      const analysisData = {
        analysisId,
        url: validatedUrl,
        tempUserId,
        timestamp: new Date().toISOString(),
        status: 'in_progress'
      };
      
      localStorage.setItem('landingAnalysisData', JSON.stringify(analysisData));
      localStorage.setItem('pendingAnalysisUrl', validatedUrl);
      localStorage.setItem('pendingAnalysisId', analysisId);
      
      // Start real Edge Function analysis
      console.log('🚀 Starting real analysis from landing page:', { analysisId, url: validatedUrl, tempUserId });
      
      // Call Edge Function for real analysis
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-page', {
        body: {
          url: validatedUrl,
          analysisId: analysisId,
          userId: tempUserId
        }
      });
      
      if (invokeError) {
        console.error('❌ Edge Function error:', invokeError);
        setError(`Analysis error: ${invokeError.message}`);
        setIsAnalyzing(false);
        return;
      }
      
      console.log('✅ Analysis initiated successfully:', data);
      console.log('📊 Edge Function response details:', JSON.stringify({
        success: data?.success,
        overall_score: data?.overall_score,
        factors_count: data?.factors_count,
        has_factors: !!data?.factors,
        factors_length: data?.factors?.length || 0,
        first_factor: data?.factors?.[0]
      }, null, 2));
      
      // Update stored analysis data with results
      if (data && data.success) {
        analysisData.status = 'completed';
        analysisData.results = {
          overall_score: data.overall_score,
          factors: data.factors || [],
          factors_count: data.factors_count || 0,
          pillars: data.pillars || null
        };
        console.log('💾 Storing analysis data with factors:', JSON.stringify({
          factors_stored: analysisData.results.factors.length,
          overall_score: analysisData.results.overall_score,
          first_factor_name: analysisData.results.factors[0]?.name
        }, null, 2));
        localStorage.setItem('landingAnalysisData', JSON.stringify(analysisData));
      } else {
        console.warn('⚠️ Edge Function did not return success or data:', data);
      }
      
      // Trigger analysis complete callback to show results
      onAnalysisComplete(validatedUrl, analysisId);
      
    } catch (error) {
      console.error('❌ Error starting analysis:', error);
      setError(`Error starting analysis: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AILogo className="h-12 md:h-16" />
              <div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  AImpactScanner
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  AI Search Optimization Platform
                </div>
              </div>
            </div>
            {/* Sign In / Sign Up buttons - only show if not authenticated */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate ? onNavigate('login') : window.location.href = '/#login'}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate ? onNavigate('signup') : window.location.href = '/#signup'}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Navigation Buttons */}
      <NavigationButtons 
        currentView="landing" 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated}
      />
      
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Is AI Stealing Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Traffic?</span>
            <br className="hidden sm:block" />
            <span className="text-3xl md:text-4xl lg:text-5xl">Or Is Your Website Invisible to Everyone?</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The only scanner that checks <strong>both</strong> AI visibility AND your SEO foundation in 15 seconds.
            Because you can't win with AI if Google can't even find you.
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
                'SoloMarket',
                'LLMtxt Mastery',
                'AI Search Mastery',
                'ISOTracker'
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
                placeholder="Enter a page URL to analyze..."
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
            <p className="text-sm text-gray-600 mt-2">
              Analyze one page at a time - start with your homepage or most important page
            </p>
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

      {/* What We Check - 2-in-1 Value */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">One Scan. Two Critical Audits.</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Most tools check one thing. We check 27 factors across AI readiness AND traditional SEO -
          because both determine your visibility.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* AI Readiness */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-purple-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-purple-900">AI Readiness Check</h3>
                <p className="text-purple-700 text-sm">18 factors for ChatGPT, Claude & Perplexity</p>
              </div>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Structured data AI engines can understand</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Content clarity for LLM comprehension</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Authority signals AI uses for citations</span>
              </li>
            </ul>
          </div>

          {/* SEO Foundation */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-green-900">SEO Foundation Audit</h3>
                <p className="text-green-700 text-sm">9 factors for Google & traditional search</p>
              </div>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Meta tags, titles & descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Internal linking & URL structure</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Mobile-friendliness & HTTPS security</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom value prop */}
        <div className="bg-blue-600 text-white rounded-xl p-6 text-center">
          <p className="text-lg font-medium">
            Why pay for two separate tools? Get both audits in one free scan.
          </p>
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