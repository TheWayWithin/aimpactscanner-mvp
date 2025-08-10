import React, { useState, useEffect } from 'react';

function TeaserResults({ url, analysisId, onUpgradeClick, onFreeTrialClick }) {
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing AI analysis...');

  // Simulate analysis progress
  useEffect(() => {
    const messages = [
      { progress: 10, text: 'Fetching your website content...' },
      { progress: 25, text: 'Analyzing against ChatGPT ranking factors...' },
      { progress: 40, text: 'Checking Claude and Perplexity visibility...' },
      { progress: 55, text: 'Comparing with top 3 competitors...' },
      { progress: 70, text: 'Calculating traffic loss estimates...' },
      { progress: 85, text: 'Generating recovery recommendations...' },
      { progress: 100, text: 'Analysis complete!' }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        setProgress(messages[currentIndex].progress);
        setCurrentMessage(messages[currentIndex].text);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowResults(true), 500);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Mock data for demonstration
  const mockScore = 42;
  const trafficLoss = '$3,750';
  const visitorsLost = '1,250';
  const competitorRank = 4;

  if (!showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Analyzing Your AI Search Visibility
            </h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{currentMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Analysis Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Analyzing:</strong> {url}
              </p>
              <p className="text-xs text-blue-700">
                Checking 148 AI ranking factors across ChatGPT, Claude, Perplexity, and Gemini
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Alert Banner */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Critical: You're Losing Traffic to AI</h3>
              <p className="text-red-700">
                Your website is losing an estimated <strong>{visitorsLost} visitors/month</strong> worth 
                <strong> {trafficLoss}</strong> to AI-powered search engines.
              </p>
            </div>
          </div>
        </div>

        {/* Main Results Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">AI VISIBILITY SCORE</h3>
            <div className="relative pt-1">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-4xl font-bold text-red-600">{mockScore}</span>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <span className="text-sm text-red-600 font-semibold">POOR</span>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${mockScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Traffic Loss */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">MONTHLY TRAFFIC LOSS</h3>
            <div className="text-4xl font-bold text-red-600">{trafficLoss}</div>
            <p className="text-sm text-gray-600 mt-2">
              {visitorsLost} potential customers going to competitors
            </p>
          </div>

          {/* Competitor Rank */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">YOUR RANK VS COMPETITORS</h3>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-orange-600">#{competitorRank}</span>
              <span className="text-lg text-gray-400 ml-2">of 4</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              3 competitors rank higher in AI results
            </p>
          </div>
        </div>

        {/* Top 3 Critical Issues */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Top 3 Critical Issues Found:</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-red-500 font-bold mr-3">1.</span>
              <div>
                <strong>No AI-Optimized Content Structure</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Your content isn't formatted for AI comprehension. Missing schema markup and citation signals.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 font-bold mr-3">2.</span>
              <div>
                <strong>Weak Authority Signals</strong>
                <p className="text-gray-600 text-sm mt-1">
                  AI models can't verify your expertise. No author credentials or trust indicators found.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 font-bold mr-3">3.</span>
              <div>
                <strong>Poor Answer Optimization</strong>
                <p className="text-gray-600 text-sm mt-1">
                  Content doesn't directly answer user queries. AI prefers competitors' clearer responses.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blurred Additional Insights */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-2">Unlock Full Analysis</h3>
              <p className="text-gray-600 mb-6">
                See all 148 factors, competitor analysis, and your recovery roadmap
              </p>
            </div>
          </div>
          
          {/* Blurred Content */}
          <div className="filter blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Detailed Factor Analysis:</h3>
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-gray-100 h-20 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-2">
            Get Your Complete AI Optimization Roadmap
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Join 5,247 businesses already protecting their traffic from AI
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Professional Tier - Featured */}
            <div className="relative border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>All 148 AI ranking factors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Competitor tracking & alerts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Weekly monitoring & reports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Custom recovery roadmap</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => onUpgradeClick('professional')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Start Professional →
              </button>
              <p className="text-xs text-center mt-2 text-gray-600">
                50% off first month - Limited time
              </p>
            </div>

            {/* Starter Tier */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$5</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Core 10 AI factors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Unlimited analyses</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Basic recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Competitor tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Weekly monitoring</span>
                </li>
              </ul>
              <button
                onClick={() => onUpgradeClick('starter')}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Start Starter →
              </button>
            </div>

            {/* Free Trial */}
            <div className="border border-gray-200 rounded-lg p-6 opacity-75">
              <h3 className="text-xl font-bold mb-2">Free Trial</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>3 analyses total</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Full factor analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Competitor data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Recovery roadmap</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Support</span>
                </li>
              </ul>
              <button
                onClick={onFreeTrialClick}
                className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Continue with Limited Free
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center items-center gap-8 mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <span>🔒</span>
              <span className="text-sm">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>💳</span>
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>↩️</span>
              <span className="text-sm">30-Day Guarantee</span>
            </div>
          </div>
        </div>

        {/* Urgency Footer */}
        <div className="text-center mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-900">
            <strong>⏰ Limited Time:</strong> Prices increase to $39/month (Professional) and $9/month (Starter) 
            in <span className="font-bold">48 hours</span>. Lock in founding member pricing now.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeaserResults;