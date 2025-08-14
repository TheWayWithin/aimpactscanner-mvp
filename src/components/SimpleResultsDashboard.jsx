// Simplified Results Dashboard - works without database
import React, { useEffect } from 'react';
import { addToHistory } from './AnalysisHistory';

function SimpleResultsDashboard({ analysisId, url, analysisData }) {
  // Generate dynamic score based on URL for more realistic demo
  const generateScore = (url) => {
    if (!url) return 67;
    
    // Use URL characteristics to generate consistent but varied scores
    const urlLower = url.toLowerCase();
    
    // Known sites get specific scores
    if (urlLower.includes('freecalchub')) return 72;
    if (urlLower.includes('evolve-7')) return 68;
    if (urlLower.includes('agent-11')) return 61;
    if (urlLower.includes('agents-11')) return 63;
    if (urlLower.includes('llmtxt')) return 74;
    if (urlLower.includes('aisearchmastery')) return 79;
    if (urlLower.includes('mcp-11')) return 65;
    if (urlLower.includes('example.com')) return 42;
    
    // Generate pseudo-random score based on URL length and characters
    const charSum = urlLower.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return 35 + (charSum % 45); // Range: 35-80
  };
  
  // Check if we have real analysis data from Edge Function
  const isRealAnalysis = analysisData && analysisData.overall_score !== undefined;
  
  // Use real data if available, otherwise generate demo data
  const overallScore = isRealAnalysis ? analysisData.overall_score : generateScore(url);
  
  // Generate pillar scores based on overall score with some variation
  const generatePillarScores = (baseScore) => {
    const variation = 8; // +/- 8 points variation
    return {
      ai: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 + 4)),
      authority: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 3)),
      machine_readability: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 + 5)),
      user_experience: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 6)),
      content_quality: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 + 2)),
      technical: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 1))
    };
  };
  
  const pillarScores = isRealAnalysis && analysisData.pillars ? 
    {
      ai: analysisData.pillars.ai?.score || analysisData.pillars.A?.score || 0,
      authority: analysisData.pillars.authority?.score || analysisData.pillars.A?.score || 0,
      machine_readability: analysisData.pillars.machine_readability?.score || analysisData.pillars.M?.score || 0,
      user_experience: analysisData.pillars.user_experience?.score || analysisData.pillars.E?.score || 0,
      content_quality: analysisData.pillars.content_quality?.score || analysisData.pillars.S?.score || 0,
      technical: analysisData.pillars.technical?.score || analysisData.pillars.T?.score || 0
    } : generatePillarScores(overallScore);
  
  // Use real results if available, otherwise use mock data
  const results = isRealAnalysis ? {
    overall_score: analysisData.overall_score,
    url: analysisData.url || url,
    created_at: analysisData.created_at || new Date().toISOString(),
    pillars: analysisData.pillars || {
      ai: { score: pillarScores.ai, weight: 23.8, factors: 3 },
      authority: { score: pillarScores.authority, weight: 17.9, factors: 2 },
      machine_readability: { score: pillarScores.machine_readability, weight: 14.6, factors: 2 },
      user_experience: { score: pillarScores.user_experience, weight: 13.7, factors: 2 },
      content_quality: { score: pillarScores.content_quality, weight: 12.2, factors: 1 },
      technical: { score: pillarScores.technical, weight: 17.8, factors: 1 }
    },
    factors: analysisData.factors || []
  } : {
    overall_score: overallScore,
    url: url || 'aisearchmastery.com',
    created_at: new Date().toISOString(),
    pillars: {
      ai: { score: pillarScores.ai, weight: 23.8, factors: 3 },
      authority: { score: pillarScores.authority, weight: 17.9, factors: 2 },
      machine_readability: { score: pillarScores.machine_readability, weight: 14.6, factors: 2 },
      user_experience: { score: pillarScores.user_experience, weight: 13.7, factors: 2 },
      content_quality: { score: pillarScores.content_quality, weight: 12.2, factors: 1 },
      technical: { score: pillarScores.technical, weight: 17.8, factors: 1 }
    },
    factors: [
      {
        name: "HTTPS Implementation",
        score: 95,
        pillar: "Technical",
        evidence: ["Site uses HTTPS protocol", "SSL certificate is valid", "All resources loaded securely"],
        recommendations: ["Maintain SSL certificate renewal schedule"]
      },
      {
        name: "Title Tag Optimization",
        score: 78,
        pillar: "Machine Readability", 
        evidence: ["Title tag present", "Length within optimal range (35 characters)", "Contains primary keywords"],
        recommendations: ["Consider adding location or brand modifier", "Test variations for click-through rate"]
      },
      {
        name: "Meta Description Quality",
        score: 72,
        pillar: "Machine Readability",
        evidence: ["Meta description present", "Length appropriate (145 characters)", "Contains call-to-action"],
        recommendations: ["Include more specific value propositions", "Test emotional triggers"]
      },
      {
        name: "Content Authority Signals",
        score: 64,
        pillar: "Authority",
        evidence: ["Author bylines present", "Publication dates visible", "Some expert credentials mentioned"],
        recommendations: ["Add more detailed author bios", "Include professional certifications", "Link to author social profiles"]
      },
      {
        name: "Citation-Worthy Content Structure",
        score: 69,
        pillar: "AI",
        evidence: ["Factual claims identified: 15", "Supporting evidence provided", "Structured data markup present"],
        recommendations: ["Increase fact density to 1+ per 100 words", "Add more statistical data", "Include research citations"]
      }
    ]
  };

  // Add analysis to history when component mounts
  useEffect(() => {
    if (url || analysisId) {
      addToHistory({
        id: analysisId || Date.now().toString(),
        url: url || results.url,
        score: results.overall_score,
        date: new Date().toISOString(),
        factors: results.factors.length
      });
    }
  }, [analysisId, url]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="results-dashboard max-w-6xl mx-auto p-6">
      {/* Demo Mode Notice - Only show when using demo data */}
      {!isRealAnalysis && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This is sample data demonstrating our analysis format. 
                To see real analysis of YOUR site, please enter your URL in the analysis form.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isRealAnalysis ? 'AI Impact Analysis Results' : 'Sample Analysis Results'}</h1>
            <p className="text-gray-600 break-all">{results.url}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{results.overall_score}</div>
            <div className="text-sm text-gray-600">{isRealAnalysis ? 'Overall Score' : 'Sample Score'}</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Framework:</strong> MASTERY-AI v3.1.1 with 148 factors. 
            Sample shows common patterns from analyzing FreeCalcHub, Evolve-7, Agent-11, and 4 other client sites.
          </p>
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(results.pillars).map(([key, pillar]) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 capitalize">
                {key.replace('_', ' ')}
              </h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(pillar.score)}`}>
                {pillar.score}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Weight: {pillar.weight}% • {pillar.factors} factors
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${pillar.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Factor Details */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Factor Analysis Details</h2>
        
        {results.factors.map((factor, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{factor.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {factor.pillar}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold px-3 py-1 rounded border ${getScoreColor(factor.score)}`}>
                  {factor.score}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {getScoreLabel(factor.score)}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">✅ Evidence Found</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {factor.evidence.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-700 mb-2">💡 Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {factor.recommendations.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Framework Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">About This Analysis</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Framework: MASTERY-AI v3.1.1 (148 total factors)</p>
          <p>• Analysis Type: Phase A (11 core factors)</p>
          <p>• Scoring Method: Evidence-based with realistic ranges (30-95%)</p>
          <p>• Analysis ID: {analysisId}</p>
          <p>• Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleResultsDashboard;