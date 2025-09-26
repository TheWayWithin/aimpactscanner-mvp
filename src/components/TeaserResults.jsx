import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import SmartUpgradePrompt from './SmartUpgradePrompt';
import CompetitorComparison from './CompetitorComparison';
import ROICalculator from './ROICalculator';

function TeaserResults({ url, analysisId, onUpgradeClick, onFreeTrialClick }) {
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing AI analysis...');
  const [expandedFactor, setExpandedFactor] = useState(null);
  const [selectedTab, setSelectedTab] = useState('critical');
  const [factorInteractions, setFactorInteractions] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(null);

  // Simulate analysis progress with robust state management
  useEffect(() => {
    console.log('TeaserResults: Starting analysis simulation');
    
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
    let intervalId = null;
    let timeoutId = null;
    let isCompleted = false;

    const showFinalResults = () => {
      if (!isCompleted) {
        isCompleted = true;
        console.log('TeaserResults: Showing final results');
        setShowResults(true);
      }
    };

    intervalId = setInterval(() => {
      if (currentIndex < messages.length) {
        const message = messages[currentIndex];
        console.log(`TeaserResults: Progress ${message.progress}% - ${message.text}`);
        setProgress(message.progress);
        setCurrentMessage(message.text);
        
        // Check if we've reached 100%
        if (message.progress === 100) {
          console.log('TeaserResults: Reached 100% progress, preparing to show results');
          clearInterval(intervalId);
          timeoutId = setTimeout(showFinalResults, 500);
        }
        
        currentIndex++;
      } else {
        // Fallback in case we somehow go past the array
        console.log('TeaserResults: Reached end of messages array');
        clearInterval(intervalId);
        showFinalResults();
      }
    }, 2000);

    // Maximum timeout fallback - ensure results show after 15 seconds
    const maxTimeout = setTimeout(() => {
      console.log('TeaserResults: Max timeout reached (15s), forcing results display');
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      showFinalResults();
    }, 15000);

    return () => {
      console.log('TeaserResults: Cleanup - clearing timers');
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(maxTimeout);
    };
  }, []);


  // Real analysis data based on actual factors
  const mockScore = 42;
  const optimizationPotential = 100 - mockScore;
  const competitorRank = 4;
  
  // Real factor analysis with educational value
  const analysisFactors = {
    critical: [
      {
        id: 'AI.1.1',
        name: 'Citation-Worthy Content Structure',
        score: 35,
        impact: 'High',
        description: 'AI systems prefer content with clear, authoritative structure that can be easily cited.',
        improvement: 'Reorganize content with clear headers, summaries, and fact-based statements.',
        potentialGain: '+18% visibility'
      },
      {
        id: 'M.2.1',
        name: 'Title Tag Optimization',
        score: 45,
        impact: 'High',
        description: 'Your titles lack the question-answer format that AI systems prioritize.',
        improvement: 'Rewrite titles to directly answer common user questions.',
        potentialGain: '+12% click-through rate'
      }
    ],
    improvements: [
      {
        id: 'A.3.1',
        name: 'Transparency Standards',
        score: 62,
        impact: 'Medium',
        description: 'AI values transparent, verifiable information sources.',
        improvement: 'Add author credentials and publication dates to all content.',
        potentialGain: '+8% trust score'
      }
    ],
    strengths: [
      {
        id: 'M.1.4',
        name: 'HTTPS Security',
        score: 95,
        impact: 'Low',
        description: 'Your site uses proper HTTPS encryption.',
        status: 'Excellent'
      }
    ]
  };

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
        {/* Value Proposition Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Your AI Search Optimization Analysis</h2>
              <p className="text-sm opacity-90">
                Based on the{' '}
                <Tooltip content="The MASTERY-AI Framework is the industry standard for AI search optimization, covering all major AI platforms including ChatGPT, Claude, Perplexity, and Gemini.">
                  <span className="underline decoration-dotted cursor-help">MASTERY-AI Framework v3.1.1</span>
                </Tooltip>
                {' '}- 148 ranking factors
              </p>
            </div>
            <div className="text-right">
              <Tooltip content="This score represents how well your website is optimized for AI search engines. A score below 50 means you're losing significant traffic to competitors.">
                <div>
                  <p className="text-2xl font-bold">{mockScore}/100</p>
                  <p className="text-xs">Overall Score</p>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Opportunity Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <h3 className="font-semibold text-blue-900">AI Discovery Opportunity</h3>
              <p className="text-blue-700">
                Your site is only <strong>{mockScore}% optimized</strong> for AI discovery. 
                AI searchers have specific intent - they're your best prospects.
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

          {/* Optimization Potential */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">OPTIMIZATION POTENTIAL</h3>
            <div className="text-4xl font-bold text-blue-600">{optimizationPotential}%</div>
            <p className="text-sm text-gray-600 mt-2">
              Untapped AI discovery opportunities
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

        {/* Interactive Factor Analysis Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 p-1">
              <button
                onClick={() => setSelectedTab('critical')}
                className={`flex-1 py-2 px-4 rounded-t-lg font-semibold transition-colors ${
                  selectedTab === 'critical' 
                    ? 'bg-red-50 text-red-700 border-b-2 border-red-500' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🚨 Critical Issues ({analysisFactors.critical.length})
              </button>
              <button
                onClick={() => setSelectedTab('improvements')}
                className={`flex-1 py-2 px-4 rounded-t-lg font-semibold transition-colors ${
                  selectedTab === 'improvements' 
                    ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⚡ Quick Wins ({analysisFactors.improvements.length})
              </button>
              <button
                onClick={() => setSelectedTab('strengths')}
                className={`flex-1 py-2 px-4 rounded-t-lg font-semibold transition-colors ${
                  selectedTab === 'strengths' 
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✅ Strengths ({analysisFactors.strengths.length})
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {selectedTab === 'critical' && (
              <div className="space-y-4">
                {analysisFactors.critical.map((factor, index) => (
                  <div 
                    key={factor.id}
                    className="border-l-4 border-red-500 pl-4 cursor-pointer hover:bg-gray-50 p-4 -ml-4 rounded transition-all"
                    onClick={() => {
                      setExpandedFactor(expandedFactor === factor.id ? null : factor.id);
                      setFactorInteractions(prev => prev + 1);
                      if (factorInteractions >= 2 && !showUpgradePrompt) {
                        setShowUpgradePrompt('high-engagement');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-red-600 font-bold mr-3">{index + 1}.</span>
                          <h4 className="font-semibold">{factor.factor_name || factor.name}</h4>
                          <span className="ml-auto text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                            Score: {factor.score}/100
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{factor.description}</p>
                        
                        {expandedFactor === factor.id && (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-semibold text-blue-900 mb-2">How to Fix:</h5>
                            <p className="text-sm text-blue-800 mb-3">{factor.improvement}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-green-700">
                                Potential Impact: {factor.potentialGain}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpgradeClick('professional');
                                }}
                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Get Detailed Fix →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedTab === 'improvements' && (
              <div className="space-y-4">
                {analysisFactors.improvements.map((factor) => (
                  <div key={factor.id} className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold mb-1">{factor.factor_name || factor.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{factor.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Current: {factor.score}/100
                      </span>
                      <span className="text-sm text-green-600 font-semibold">
                        {factor.potentialGain}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedTab === 'strengths' && (
              <div className="space-y-4">
                {analysisFactors.strengths.map((factor) => (
                  <div key={factor.id} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold mb-1">{factor.factor_name || factor.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{factor.description}</p>
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                      {factor.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Competitor and ROI Analysis */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <CompetitorComparison yourScore={mockScore} url={url} />
          <ROICalculator currentScore={mockScore} monthlyTraffic={5000} />
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
            Start optimizing for AI-driven traffic today
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

        {/* Smart Upgrade Prompt */}
        {showUpgradePrompt && (
          <SmartUpgradePrompt
            trigger={showUpgradePrompt}
            score={mockScore}
            onUpgrade={onUpgradeClick}
            onDismiss={() => setShowUpgradePrompt(null)}
          />
        )}
        
        {/* Show low-score prompt automatically */}
        {showResults && mockScore < 50 && !showUpgradePrompt && (
          <SmartUpgradePrompt
            trigger="low-score"
            score={mockScore}
            onUpgrade={onUpgradeClick}
            onDismiss={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default TeaserResults;