// Simplified Results Dashboard - works without database
import React from 'react';

function SimpleResultsDashboard({ analysisId, url }) {
  // Mock results data for demonstration
  const mockResults = {
    overall_score: 67,
    url: url || 'aisearchmastery.com',
    created_at: new Date().toISOString(),
    pillars: {
      ai: { score: 71, weight: 23.8, factors: 3 },
      authority: { score: 64, weight: 17.9, factors: 2 },
      machine_readability: { score: 72, weight: 14.6, factors: 2 },
      user_experience: { score: 58, weight: 13.7, factors: 2 },
      content_quality: { score: 69, weight: 12.2, factors: 1 },
      technical: { score: 63, weight: 17.8, factors: 1 }
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Search Analysis Results</h1>
            <p className="text-gray-600 break-all">{mockResults.url}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{mockResults.overall_score}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This is a demonstration using the MASTERY-AI Framework v3.1.1. 
            Analysis shows Phase A results (11 core factors) with evidence-based scoring.
          </p>
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(mockResults.pillars).map(([key, pillar]) => (
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
        
        {mockResults.factors.map((factor, index) => (
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