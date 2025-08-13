import React, { useState } from 'react';
import Logo from './Logo';

function LandingEnhanced({ onAnalysisComplete }) {
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
    
    const tempAnalysisId = crypto.randomUUID();
    
    sessionStorage.setItem('pendingAnalysisUrl', validatedUrl);
    sessionStorage.setItem('pendingAnalysisId', tempAnalysisId);
    
    onAnalysisComplete(validatedUrl, tempAnalysisId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo className="h-10" />
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm shadow-lg px-5 py-2 rounded-full mb-8 border border-blue-100">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Trusted by 5,247+ businesses worldwide</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Optimize Your Site for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              AI-Powered Search
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover how ChatGPT, Claude, and Perplexity see your website. 
            Get actionable insights to improve your AI visibility and reclaim lost traffic.
          </p>

          {/* Analysis Form */}
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative flex flex-col sm:flex-row gap-4 p-2 bg-white rounded-lg shadow-xl">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your website URL..."
                  className="flex-1 px-6 py-4 text-lg rounded-lg focus:outline-none"
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || !url.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-lg hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze My Site'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-4 text-red-600 text-sm">{error}</p>
            )}
          </form>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {[
              '10-Factor Analysis',
              'MASTERY-AI Framework',
              'Instant Results',
              'Actionable Insights'
            ].map((feature, index) => (
              <div key={index} className="flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-md">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Social Proof Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { metric: '5,247+', label: 'Sites Analyzed', icon: '🌐' },
              { metric: '89%', label: 'Traffic Recovery', icon: '📈' },
              { metric: '< 15s', label: 'Analysis Time', icon: '⚡' }
            ].map((stat, index) => (
              <div key={index} className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/60">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.metric}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="relative z-10">
        <svg className="w-full h-24 fill-white" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1300,40 L1440,40 L1440,100 L0,100 Z"></path>
        </svg>
      </div>
    </div>
  );
}

export default LandingEnhanced;