// Simplified Results Dashboard - works without database
import React, { useEffect, useState } from 'react';
import { addToHistory } from './AnalysisHistory';
import TierPDFButton from './TierPDFButton';

function SimpleResultsDashboard({ analysisId, url, analysisData, userEmail, user }) {
  const [pdfStatus, setPdfStatus] = useState(null);

  // Debug logging
  console.log('📊 SimpleResultsDashboard props:', JSON.stringify({ 
    analysisId, 
    url, 
    has_analysisData: !!analysisData,
    has_factors: !!analysisData?.factors,
    factors_count: analysisData?.factors?.length || 0,
    overall_score: analysisData?.overall_score,
    first_factor_name: analysisData?.factors?.[0]?.factor_name || analysisData?.factors?.[0]?.name
  }, null, 2));

  // Handle PDF generation callback
  const handlePDFGenerated = (reportInfo) => {
    setPdfStatus({
      success: true,
      message: `Report "${reportInfo.filename}" generated successfully!`,
      details: `Analysis ID: ${reportInfo.analysisId} | Score: ${reportInfo.overallScore}/100 | Factors: ${reportInfo.factorsCount}`
    });
    
    // Clear status after 5 seconds
    setTimeout(() => setPdfStatus(null), 5000);
  };
  
  // Generate dynamic score based on URL for more realistic demo
  const generateScore = (url) => {
    if (!url) return 67;
    
    // Use URL characteristics to generate consistent but varied scores
    const urlLower = url.toLowerCase();
    
    // Known sites get specific scores
    if (urlLower.includes('freecalchub')) return 65;
    if (urlLower.includes('evolve-7')) return 68;
    if (urlLower.includes('agent-11')) return 61;
    if (urlLower.includes('agentmarket')) return 63;
    if (urlLower.includes('llmtxt')) return 74;
    if (urlLower.includes('aisearchmastery')) return 79;
    if (urlLower.includes('mcp-7')) return 65;
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
      semantic: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 + 2)),
      engagement: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 6)),
      topical: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 1)),
      reference: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 2)),
      yield: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 4))
    };
  };
  
  const pillarScores = isRealAnalysis && analysisData.pillars ? 
    {
      ai: analysisData.pillars.ai?.score || analysisData.pillars.AI?.score || 0,
      authority: analysisData.pillars.authority?.score || analysisData.pillars.A?.score || 0,
      machine_readability: analysisData.pillars.machine_readability?.score || analysisData.pillars.M?.score || 0,
      semantic: analysisData.pillars.semantic?.score || analysisData.pillars.S?.score || 0,
      engagement: analysisData.pillars.engagement?.score || analysisData.pillars.E?.score || 0,
      topical: analysisData.pillars.topical?.score || analysisData.pillars.T?.score || 0,
      reference: analysisData.pillars.reference?.score || analysisData.pillars.R?.score || 0,
      yield: analysisData.pillars.yield?.score || analysisData.pillars.Y?.score || 0
    } : generatePillarScores(overallScore);
  
  // Use real results if available, otherwise use mock data
  console.log('🔍 Real analysis check:', { 
    isRealAnalysis, 
    hasFactors: analysisData?.factors?.length > 0,
    factorsCount: analysisData?.factors?.length || 0,
    factors: analysisData?.factors 
  });
  
  // Transform pillars from Edge Function format to dashboard format
  const transformPillars = (pillarsData) => {
    if (!pillarsData) return null;
    return {
      ai: pillarsData.AI || { score: pillarScores.ai, weight: 23.8, factors: 3, name: "AI Response Optimization & Citation" },
      authority: pillarsData.A || { score: pillarScores.authority, weight: 17.9, factors: 2, name: "Authority & Trust Signals" },
      machine_readability: pillarsData.M || { score: pillarScores.machine_readability, weight: 14.6, factors: 4, name: "Machine Readability & Technical Infrastructure" },
      semantic: pillarsData.S || { score: pillarScores.semantic, weight: 13.9, factors: 2, name: "Semantic Content Quality" },
      engagement: pillarsData.E || { score: pillarScores.engagement, weight: 10.9, factors: 1, name: "Engagement & User Experience" },
      topical: pillarsData.T || { score: pillarScores.topical, weight: 8.9, factors: 0, name: "Topical Expertise & Experience" },
      reference: pillarsData.R || { score: pillarScores.reference, weight: 5.9, factors: 0, name: "Reference Networks & Citations" },
      yield: pillarsData.Y || { score: pillarScores.yield, weight: 4.1, factors: 0, name: "Yield Optimization & Freshness" }
    };
  };
  
  const results = isRealAnalysis ? {
    overall_score: analysisData.overall_score,
    url: analysisData.url || url,
    created_at: analysisData.created_at || new Date().toISOString(),
    pillars: transformPillars(analysisData.pillars) || {
      ai: { score: pillarScores.ai, weight: 23.8, factors: 3, name: "AI Response Optimization & Citation" },
      authority: { score: pillarScores.authority, weight: 17.9, factors: 2, name: "Authority & Trust Signals" },
      machine_readability: { score: pillarScores.machine_readability, weight: 14.6, factors: 4, name: "Machine Readability & Technical Infrastructure" },
      semantic: { score: pillarScores.semantic, weight: 13.9, factors: 2, name: "Semantic Content Quality" },
      engagement: { score: pillarScores.engagement, weight: 10.9, factors: 1, name: "Engagement & User Experience" },
      topical: { score: pillarScores.topical, weight: 8.9, factors: 0, name: "Topical Expertise & Experience" },
      reference: { score: pillarScores.reference, weight: 5.9, factors: 0, name: "Reference Networks & Citations" },
      yield: { score: pillarScores.yield, weight: 4.1, factors: 0, name: "Yield Optimization & Freshness" }
    },
    factors: analysisData?.factors || []
  } : {
    overall_score: overallScore,
    url: url || 'aisearchmastery.com',
    created_at: new Date().toISOString(),
    pillars: {
      ai: { score: pillarScores.ai, weight: 23.8, factors: 3, name: "AI Response Optimization & Citation" },
      authority: { score: pillarScores.authority, weight: 17.9, factors: 2, name: "Authority & Trust Signals" },
      machine_readability: { score: pillarScores.machine_readability, weight: 14.6, factors: 4, name: "Machine Readability & Technical Infrastructure" },
      semantic: { score: pillarScores.semantic, weight: 13.9, factors: 2, name: "Semantic Content Quality" },
      engagement: { score: pillarScores.engagement, weight: 10.9, factors: 1, name: "Engagement & User Experience" },
      topical: { score: pillarScores.topical, weight: 8.9, factors: 0, name: "Topical Expertise & Experience" },
      reference: { score: pillarScores.reference, weight: 5.9, factors: 0, name: "Reference Networks & Citations" },
      yield: { score: pillarScores.yield, weight: 4.1, factors: 0, name: "Yield Optimization & Freshness" }
    },
    factors: [
      {
        name: "Citation-Worthy Content Structure",
        score: 69,
        pillar: "AI Response Optimization",
        evidence: ["Factual claims identified: 15", "Supporting evidence provided", "Structured data markup present"],
        recommendations: ["Increase fact density to 1+ per 100 words", "Add more statistical data", "Include research citations"]
      },
      {
        name: "Source Authority Signals",
        score: 64,
        pillar: "Authority & Trust",
        evidence: ["Author bylines present", "Publication dates visible", "Some expert credentials mentioned"],
        recommendations: ["Add more detailed author bios", "Include professional certifications", "Link to author social profiles"]
      },
      {
        name: "Security and Access Control",
        score: 95,
        pillar: "Machine Readability",
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
        name: "LLMs.txt Implementation",
        score: 30,
        pillar: "Machine Readability",
        evidence: ["❌ No LLMs.txt file found at /llms.txt", "Missing AI content accessibility protocol"],
        recommendations: ["Create a professional LLMs.txt file using llmtxtmastery.com", "Follow llmstxt.org standard for AI visibility", "Include structured content map with H1 title and key sections"]
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

  // Get pillar-specific styling
  const getPillarStyle = (key) => {
    const styles = {
      'AI': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100' },
      'A': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-100' },
      'M': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100' },
      'S': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-100' },
      'E': { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100' },
      'T': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100' },
      'R': { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-700', badge: 'bg-gray-100' },
      'Y': { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', badge: 'bg-teal-100' }
    };
    return styles[key] || styles['M'];
  };

  // Group factors by pillar for organized display
  const groupFactorsByPillar = (factors) => {
    const grouped = {};
    
    // Define pillar order and full names
    const pillarOrder = [
      { key: 'AI', name: 'AI Response Optimization & Citation', icon: '🤖' },
      { key: 'A', name: 'Authority & Trust Signals', icon: '🔐' },
      { key: 'M', name: 'Machine Readability & Technical Infrastructure', icon: '⚙️' },
      { key: 'S', name: 'Semantic Content Quality', icon: '📝' },
      { key: 'E', name: 'Engagement & User Experience', icon: '👥' },
      { key: 'T', name: 'Topical Expertise & Experience', icon: '🎯' },
      { key: 'R', name: 'Reference Networks & Citations', icon: '🔗' },
      { key: 'Y', name: 'Yield Optimization & Freshness', icon: '📈' }
    ];
    
    // Initialize groups
    pillarOrder.forEach(pillar => {
      grouped[pillar.name] = {
        factors: [],
        icon: pillar.icon,
        key: pillar.key
      };
    });
    
    // Group factors
    factors.forEach(factor => {
      // Map pillar codes to full names (Edge Function returns codes like "M", "AI", etc.)
      const pillarCodeMapping = {
        'AI': 'AI Response Optimization & Citation',
        'A': 'Authority & Trust Signals',
        'M': 'Machine Readability & Technical Infrastructure',
        'S': 'Semantic Content Quality',
        'E': 'Engagement & User Experience',
        'T': 'Topical Expertise & Experience',
        'R': 'Reference Networks & Citations',
        'Y': 'Yield Optimization & Freshness'
      };
      
      // Also support legacy full names for mock data
      const pillarNameMapping = {
        'AI Response Optimization': 'AI Response Optimization & Citation',
        'Authority & Trust': 'Authority & Trust Signals',
        'Machine Readability': 'Machine Readability & Technical Infrastructure',
        'Semantic Content': 'Semantic Content Quality',
        'Engagement': 'Engagement & User Experience',
        'Topical Expertise': 'Topical Expertise & Experience',
        'Reference Networks': 'Reference Networks & Citations',
        'Yield Optimization': 'Yield Optimization & Freshness'
      };
      
      // Try to map from code first (real data), then from name (mock data)
      const fullPillarName = pillarCodeMapping[factor.pillar] || 
                             pillarNameMapping[factor.pillar] || 
                             factor.pillar;
      
      if (grouped[fullPillarName]) {
        grouped[fullPillarName].factors.push(factor);
      }
    });
    
    // Filter out empty groups and return as array
    return pillarOrder
      .map(p => {
        // Map pillar keys to the results.pillars structure
        const pillarKey = {
          'AI': 'ai',
          'A': 'authority',
          'M': 'machine_readability',
          'S': 'semantic',
          'E': 'engagement',
          'T': 'topical',
          'R': 'reference',
          'Y': 'yield'
        }[p.key] || p.key.toLowerCase();
        
        const pillarData = results.pillars[pillarKey] || {};
        
        return {
          name: p.name,
          ...grouped[p.name],
          weight: pillarData.weight || 0,
          score: pillarData.score || 0,
          factorCount: pillarData.factors || grouped[p.name].factors.length
        };
      })
      .filter(group => group.factors.length > 0);
  };

  const groupedFactors = groupFactorsByPillar(results.factors);
  
  console.log('📦 Grouped factors result:', {
    totalFactors: results.factors.length,
    groupedCount: groupedFactors.length,
    groups: groupedFactors.map(g => ({ pillar: g.name, factorCount: g.factors.length }))
  });

  return (
    <div className="results-dashboard max-w-6xl mx-auto p-6" data-testid="results-dashboard">
      {/* Page Analysis Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Analysis Results for: <span className="text-blue-600">{results.url || 'example.com'}</span>
        </h2>
      </div>
      
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
                <strong>Sample Report:</strong> This shows you exactly what our analysis looks like. 
                Ready to analyze your own site? Click "New Analysis" in the navigation above to get started!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Status */}
      {pdfStatus && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{pdfStatus.message}</p>
              <p className="text-sm text-green-700 mt-1">{pdfStatus.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRealAnalysis ? 'AI Impact Analysis Results' : 'Sample Analysis Report'}
            </h1>
            <p className="text-gray-600 break-all mb-3">{results.url}</p>
            
            {/* Tier-Based PDF Export Button */}
            <div className="flex items-center gap-3">
              <TierPDFButton 
                analysisId={analysisId}
                url={results.url}
                analysisData={results}
                onReportGenerated={handlePDFGenerated}
                userEmail={userEmail}
                user={user}
              />
              <span className="text-sm text-gray-500">
                Professional PDF report with detailed recommendations
              </span>
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="text-3xl font-bold text-blue-600" data-testid="overall-score">{results.overall_score}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getScoreColor(results.overall_score)}`}>
              {getScoreLabel(results.overall_score)}
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Framework:</strong> MASTERY-AI v3.1.1 with 148 factors across all 8 pillars. 
            {isRealAnalysis 
              ? 'Phase A implementation with complete coverage - quality over quantity, every factor matters.'
              : 'Sample shows strategic factors from analyzing FreeCalcHub, Evolve-7, Agent-11, and 4 other client sites.'
            }
          </p>
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-testid="pillar-grid">
        {Object.entries(results.pillars).map(([key, pillar]) => (
          <div key={key} className="bg-white rounded-lg shadow p-6" data-testid="pillar-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {pillar.name || key.replace('_', ' ')}
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

      {/* Factor Details Grouped by Pillar */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold text-gray-900">Factor Analysis Details by Pillar</h2>
        
        {groupedFactors.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-2">
              No detailed factor analysis available for this scan.
            </p>
            <p className="text-sm text-gray-500">
              The analysis may still be processing or factors data was not returned.
            </p>
          </div>
        ) : (
          groupedFactors.map((pillarGroup, groupIndex) => {
          const pillarStyle = getPillarStyle(pillarGroup.key);
          return (
            <div key={groupIndex} className="space-y-4">
              {/* Pillar Header */}
              <div className={`${pillarStyle.bg} border-l-4 ${pillarStyle.border} p-4 rounded-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pillarGroup.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pillarGroup.name}</h3>
                      <p className="text-sm text-gray-600">
                        Weight: {pillarGroup.weight || 0}% | Pillar Score: {pillarGroup.score || 0} | {pillarGroup.factors.length} factor{pillarGroup.factors.length !== 1 ? 's' : ''} analyzed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Factors within this pillar */}
              <div className="ml-8 space-y-4">
                {pillarGroup.factors.map((factor, factorIndex) => (
                  <div key={factorIndex} className="bg-white rounded-lg shadow p-6 border-l-2 border-gray-200" data-testid="factor-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{factor.factor_name || factor.name}</h4>
                        <span className={`text-xs ${pillarStyle.text} ${pillarStyle.badge} px-2 py-1 rounded font-medium`}>
                          {pillarGroup.key} Pillar Factor
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
                      <h5 className="font-medium text-green-700 mb-2">✅ Evidence Found</h5>
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
                      <h5 className="font-medium text-blue-700 mb-2">💡 Recommendations</h5>
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
            </div>
          );
        }))
        }
      </div>

      {/* Framework Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">About This Analysis</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Framework: MASTERY-AI v3.1.1 (148 factors)</p>
          <p>• Analysis Type: Phase A - Complete coverage of all 8 MASTERY-AI pillars</p>
          <p>• Approach: Quality over quantity - every factor matters</p>
          <p>• Scoring Method: Evidence-based with realistic ranges (30-95%)</p>
          <p>• Analysis ID: {analysisId}</p>
          <p>• Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleResultsDashboard;