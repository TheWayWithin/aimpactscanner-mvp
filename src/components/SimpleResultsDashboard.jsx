// Simplified Results Dashboard - works without database
import React, { useEffect, useState } from 'react';
import { Bot, Lock, Settings, FileText, Users, Wrench, Link, TrendingUp, Zap, CheckCircle, Lightbulb, ExternalLink } from 'lucide-react';
import { addToHistory } from '../utils/analysisHistory';
import LazyTierPDFButton from './LazyTierPDFButton';
import LLMsTxtPanel from './LLMsTxtPanel';
import CriticalIssuesBanner from './CriticalIssuesBanner';
import ActionItemsPanel from './ActionItemsPanel';
import ReadabilityPanel from './ReadabilityPanel';
import { hasFeatureAccess, getMinimumTierForFeature } from '../lib/tierUtils';

function SimpleResultsDashboard({ analysisId, url, analysisData, userEmail, user, onNavigate }) {
  const [pdfStatus, setPdfStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);

  // Get user tier for feature gating
  const userTier = user?.tier || 'free';
  const canExportCSV = hasFeatureAccess(userTier, 'csv_export');
  const canUseLLMSTxt = hasFeatureAccess(userTier, 'llms_txt');

  // Debug logging
  console.log('📊 SimpleResultsDashboard props:', JSON.stringify({
    analysisId,
    url,
    has_analysisData: !!analysisData,
    has_factors: !!analysisData?.factors,
    factors_count: analysisData?.factors?.length || 0,
    overall_score: analysisData?.overall_score,
    first_factor_name: analysisData?.factors?.[0]?.factor_name || analysisData?.factors?.[0]?.name,
    userTier,
    canExportCSV,
    canUseLLMSTxt
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

  // Handle CSV Export
  const handleCSVExport = () => {
    if (!canExportCSV) {
      setExportStatus({
        success: false,
        message: `CSV export requires ${getMinimumTierForFeature('csv_export')} tier or higher`
      });
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    try {
      // CSV headers
      const headers = ['Factor Name', 'Pillar', 'Score', 'Evidence Count', 'Recommendations Count'];

      // Convert factors to CSV rows
      const rows = results.factors.map(factor => [
        factor.factor_name || factor.name,
        factor.pillar,
        factor.score,
        factor.evidence?.length || 0,
        factor.recommendations?.length || 0
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analysis-${analysisId || Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExportStatus({
        success: true,
        message: 'CSV exported successfully!'
      });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('CSV export error:', error);
      setExportStatus({
        success: false,
        message: 'CSV export failed. Please try again.'
      });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // LLMS.txt Generation is now handled by LLMsTxtPanel component
  
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
      technical: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 1)),
      reference: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 2)),
      yield: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 - 4)),
      performance: Math.min(95, Math.max(30, baseScore + Math.floor(Math.random() * variation) - variation/2 + 3))
    };
  };
  
  const pillarScores = isRealAnalysis && analysisData.pillars ?
    {
      ai: analysisData.pillars.ai?.score || analysisData.pillars.AI?.score || 0,
      authority: analysisData.pillars.authority?.score || analysisData.pillars.A?.score || 0,
      machine_readability: analysisData.pillars.machine_readability?.score || analysisData.pillars.M?.score || 0,
      semantic: analysisData.pillars.semantic?.score || analysisData.pillars.S?.score || 0,
      engagement: analysisData.pillars.engagement?.score || analysisData.pillars.E?.score || 0,
      technical: analysisData.pillars.technical?.score || analysisData.pillars.T?.score || 0,
      reference: analysisData.pillars.reference?.score || analysisData.pillars.R?.score || 0,
      yield: analysisData.pillars.yield?.score || analysisData.pillars.Y?.score || 0,
      performance: analysisData.pillars.performance?.score || analysisData.pillars.P?.score || 0
    } : generatePillarScores(overallScore);
  
  // Use real results if available, otherwise use mock data
  console.log('🔍 Real analysis check:', { 
    isRealAnalysis, 
    hasFactors: analysisData?.factors?.length > 0,
    factorsCount: analysisData?.factors?.length || 0,
    factors: analysisData?.factors 
  });
  
  // Transform pillars from Edge Function format to dashboard format
  // Known pillar weights (must match backend PILLAR_WEIGHTS)
  const PILLAR_WEIGHTS = {
    AI: 23.8, A: 17.9, M: 14.6, S: 13.9, E: 10.9, T: 8.9, R: 5.9, Y: 4.1, P: 7.5
  };

  const transformPillars = (pillarsData) => {
    if (!pillarsData) return null;
    
    // Backend returns { score, name } without weight — merge with known weights
    const merge = (key, fallbackScore, fallbackName, fallbackFactors) => {
      const data = pillarsData[key];
      if (data) {
        return { 
          score: data.score, 
          weight: data.weight || PILLAR_WEIGHTS[key] || 0,
          factors: data.factorCount || data.factors || fallbackFactors,
          name: data.name || fallbackName
        };
      }
      return { score: fallbackScore, weight: PILLAR_WEIGHTS[key] || 0, factors: fallbackFactors, name: fallbackName };
    };

    return {
      ai: merge('AI', pillarScores.ai, "AI Response Optimization & Citation", 3),
      authority: merge('A', pillarScores.authority, "Authority & Trust Signals", 2),
      machine_readability: merge('M', pillarScores.machine_readability, "Machine Readability & Technical Infrastructure", 4),
      semantic: merge('S', pillarScores.semantic, "Semantic Content Quality", 2),
      engagement: merge('E', pillarScores.engagement, "Engagement & User Experience", 1),
      technical: merge('T', pillarScores.technical, "Technical SEO & Foundation", 4),
      reference: merge('R', pillarScores.reference, "Reference Networks & Citations", 0),
      yield: merge('Y', pillarScores.yield, "Yield Optimization & Freshness", 0),
      performance: merge('P', pillarScores.performance, "Performance & Speed", 1)
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
      technical: { score: pillarScores.technical, weight: 8.9, factors: 4, name: "Technical SEO & Foundation" },
      reference: { score: pillarScores.reference, weight: 5.9, factors: 0, name: "Reference Networks & Citations" },
      yield: { score: pillarScores.yield, weight: 4.1, factors: 0, name: "Yield Optimization & Freshness" },
      performance: { score: pillarScores.performance, weight: 5.0, factors: 1, name: "Performance & Speed" }
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
      technical: { score: pillarScores.technical, weight: 8.9, factors: 4, name: "Technical SEO & Foundation" },
      reference: { score: pillarScores.reference, weight: 5.9, factors: 0, name: "Reference Networks & Citations" },
      yield: { score: pillarScores.yield, weight: 4.1, factors: 0, name: "Yield Optimization & Freshness" },
      performance: { score: pillarScores.performance, weight: 5.0, factors: 1, name: "Performance & Speed" }
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
        evidence: ["No LLMs.txt file found at /llms.txt", "Missing AI content accessibility protocol"],
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
      'A': { bg: 'bg-cloud', border: 'border-signal', text: 'text-mastery', badge: 'bg-cloud' },
      'M': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100' },
      'S': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-100' },
      'E': { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100' },
      'T': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100' },
      'TS': { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100' }, // Same as T
      'R': { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-700', badge: 'bg-gray-100' },
      'Y': { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', badge: 'bg-teal-100' },
      'P': { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', badge: 'bg-rose-100' }
    };
    return styles[key] || styles['M'];
  };

  // Group factors by pillar for organized display
  const groupFactorsByPillar = (factors) => {
    const grouped = {};
    
    // Define pillar order and full names
    const pillarOrder = [
      { key: 'AI', name: 'AI Response Optimization & Citation', icon: <Bot className="w-5 h-5" /> },
      { key: 'A', name: 'Authority & Trust Signals', icon: <Lock className="w-5 h-5" /> },
      { key: 'M', name: 'Machine Readability & Technical Infrastructure', icon: <Settings className="w-5 h-5" /> },
      { key: 'S', name: 'Semantic Content Quality', icon: <FileText className="w-5 h-5" /> },
      { key: 'E', name: 'Engagement & User Experience', icon: <Users className="w-5 h-5" /> },
      { key: 'T', name: 'Technical SEO & Foundation', icon: <Wrench className="w-5 h-5" /> },
      { key: 'R', name: 'Reference Networks & Citations', icon: <Link className="w-5 h-5" /> },
      { key: 'Y', name: 'Yield Optimization & Freshness', icon: <TrendingUp className="w-5 h-5" /> },
      { key: 'P', name: 'Performance & Speed', icon: <Zap className="w-5 h-5" /> }
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
        'T': 'Technical SEO & Foundation',
        'TS': 'Technical SEO & Foundation', // Traditional SEO factors
        'R': 'Reference Networks & Citations',
        'Y': 'Yield Optimization & Freshness',
        'P': 'Performance & Speed'
      };
      
      // Also support legacy full names for mock data
      const pillarNameMapping = {
        'AI Response Optimization': 'AI Response Optimization & Citation',
        'Authority & Trust': 'Authority & Trust Signals',
        'Machine Readability': 'Machine Readability & Technical Infrastructure',
        'Semantic Content': 'Semantic Content Quality',
        'Engagement': 'Engagement & User Experience',
        'Topical Expertise': 'Technical SEO & Foundation',
        'Topical Expertise & Experience': 'Technical SEO & Foundation',
        'Technical SEO': 'Technical SEO & Foundation',
        'Reference Networks': 'Reference Networks & Citations',
        'Yield Optimization': 'Yield Optimization & Freshness',
        'Performance': 'Performance & Speed'
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
        const pillarKeyLower = {
          'AI': 'ai',
          'A': 'authority',
          'M': 'machine_readability',
          'S': 'semantic',
          'E': 'engagement',
          'T': 'technical',
          'R': 'reference',
          'Y': 'yield',
          'P': 'performance'
        }[p.key] || p.key.toLowerCase();
        
        // Backend returns uppercase keys (AI, A, M, etc.), frontend may use lowercase
        const pillarData = results.pillars[pillarKeyLower] || results.pillars[p.key] || {};
        
        return {
          name: p.name,
          ...grouped[p.name],
          weight: pillarData.weight || PILLAR_WEIGHTS[p.key] || 0,
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

  // Compute top 3 gaps (lowest-scoring pillars)
  const topGaps = Object.entries(results.pillars)
    .map(([key, pillar]) => ({ key, ...pillar }))
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 3);

  return (
    <div className="results-dashboard max-w-6xl mx-auto p-6" data-testid="results-dashboard">
      {/* AI Visibility Score - Above the Fold Hero */}
      <div className="bg-gradient-to-br from-mastery to-mastery/90 rounded-2xl p-8 mb-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {isRealAnalysis ? 'AI Visibility Score' : 'Sample AI Visibility Report'}
            </h1>
            <p className="text-white/70 break-all text-sm mb-3">{results.url || 'example.com'}</p>
            {!isRealAnalysis && (
              <p className="text-white/60 text-sm">
                This shows you exactly what our analysis looks like.
              </p>
            )}
          </div>
          <div className="text-center">
            <div
              className={`text-6xl md:text-7xl font-bold ${
                results.overall_score >= 80 ? 'text-green-300' :
                results.overall_score >= 60 ? 'text-amber-300' :
                'text-red-300'
              }`}
              data-testid="overall-score"
            >
              {results.overall_score}
            </div>
            <div className="text-white/60 text-sm mt-1">out of 100</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              results.overall_score >= 80 ? 'bg-green-500/20 text-green-200' :
              results.overall_score >= 60 ? 'bg-amber-500/20 text-amber-200' :
              'bg-red-500/20 text-red-200'
            }`}>
              {getScoreLabel(results.overall_score)}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Gaps to Fix First */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-ink mb-4">Top 3 Gaps to Fix First</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {topGaps.map((gap, index) => (
            <div key={gap.key} className="bg-white rounded-xl border border-mist p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-stone uppercase tracking-wider">
                  Gap #{index + 1}
                </span>
                <span className={`text-lg font-bold px-2 py-0.5 rounded ${getScoreColor(gap.score)}`}>
                  {gap.score || 0}
                </span>
              </div>
              <h3 className="font-semibold text-ink text-sm mb-2">
                {gap.name || gap.key.replace(/_/g, ' ')}
              </h3>
              <div className="w-full bg-mist rounded-full h-2 mb-3">
                <div
                  className={`h-full rounded-full ${
                    (gap.score || 0) >= 80 ? 'bg-green-500' :
                    (gap.score || 0) >= 60 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${gap.score || 0}%` }}
                />
              </div>
              <p className="text-xs text-slate">
                Weight: {gap.weight || 0}% of total score
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual Upgrade Prompt */}
      {userTier === 'free' && (
        <div className="bg-signal/5 border border-signal/20 rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">Want the full picture?</h3>
              <p className="text-sm text-slate mt-1">
                Upgrade to Solo ($9.95/mo) to unlock full 27-factor breakdown, PDF exports, and historical tracking.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('pricing')}
              className="px-5 py-2.5 bg-signal text-white rounded-lg font-medium hover:bg-signal/90 transition-colors whitespace-nowrap text-sm"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
      {userTier === 'solo' && (
        <div className="bg-clarity/5 border border-clarity/20 rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">Ready for the full loop?</h3>
              <p className="text-sm text-slate mt-1">
                Upgrade to Growth ($19.95/mo) to get LLM.txt Mastery integration and the complete Diagnose-Optimize-Test-Repeat cycle.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('pricing')}
              className="px-5 py-2.5 bg-clarity text-white rounded-lg font-medium hover:bg-clarity/90 transition-colors whitespace-nowrap text-sm"
            >
              Upgrade to Growth
            </button>
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

      {/* Export Status Messages */}
      {exportStatus && (
        <div className={`${exportStatus.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4 mb-6`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {exportStatus.success ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${exportStatus.success ? 'text-green-800' : 'text-yellow-800'}`}>
                {exportStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export & Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-mist p-5 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Export Buttons Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* PDF Export Button (Solo+) */}
            <LazyTierPDFButton
              analysisId={analysisId}
              url={results.url}
              analysisData={results}
              onReportGenerated={handlePDFGenerated}
              userEmail={userEmail}
              user={user}
            />

              {/* CSV Export Button (Growth+) */}
              <div className="flex items-center gap-3">
                {canExportCSV ? (
                  <button
                    onClick={handleCSVExport}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to CSV
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate && onNavigate('pricing')}
                    className="inline-flex items-center px-4 py-2 bg-signal text-white rounded-lg hover:bg-signal transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Export to CSV - Upgrade
                  </button>
                )}
                <span className="text-sm text-gray-500">
                  {canExportCSV ? 'Export analysis data to CSV spreadsheet' : `Requires ${getMinimumTierForFeature('csv_export')} tier`}
                </span>
              </div>

          </div>
          <div className="text-xs text-slate">
            Framework: MASTERY-AI v3.1.1 | 27 factors | {results.factors.length} analyzed
          </div>
        </div>
      </div>

      {/* LLMs.txt Generation Panel */}
      <div className="mb-6">
        <LLMsTxtPanel
          analysisUrl={results.url}
          userTier={userTier}
          onUpgrade={() => {
            // Navigate to pricing page
            if (onNavigate) {
              onNavigate('pricing');
            }
          }}
        />
      </div>

      {/* LLM.txt Mastery Recommendation Callout */}
      {(() => {
        const llmsFactor = results.factors.find(f =>
          (f.factor_name || f.name || '').toLowerCase().includes('llms.txt') ||
          (f.factor_name || f.name || '').toLowerCase().includes('llm.txt')
        );
        const hasLlmsIssue = !llmsFactor || llmsFactor.score < 70;
        if (!hasLlmsIssue) return null;

        const isGrowthOrScale = userTier === 'growth' || userTier === 'scale';

        if (isGrowthOrScale) {
          // Growth/Scale users already have built-in generation — just remind them
          return (
            <div className="mb-6 bg-gradient-to-r from-clarity/5 to-clarity/10 border border-clarity/20 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-clarity/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-clarity" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink mb-1">Your llms.txt needs attention</h4>
                  <p className="text-sm text-slate">
                    Your plan includes LLMs.txt generation above. Use it to create a quality-scored file, then validate
                    it with <a href="https://llmtxtmastery.com" target="_blank" rel="noopener noreferrer" className="text-signal hover:text-signal/80 font-medium">LLM.txt Mastery</a> to
                    check formatting and discoverability.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // Free/Coffee users — recommend the standalone tool
        return (
          <div className="mb-6 bg-gradient-to-r from-signal/5 to-mastery/5 border border-signal/20 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-signal/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-signal" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-ink mb-1">Recommended Next Step: Fix Your llms.txt</h4>
                <p className="text-sm text-slate mb-3">
                  Generate quality-scored llms.txt files with <strong>LLM.txt Mastery</strong> — a standalone tool that
                  discovers JS-rendered pages other tools miss, validates formatting, and guides deployment. Free tier available.
                </p>
                <a
                  href="https://llmtxtmastery.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:text-signal/80 transition-colors"
                >
                  Try LLM.txt Mastery free
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Critical Issues Banner - Show blockers/warnings prominently */}
      <CriticalIssuesBanner factors={results.factors} />

      {/* Fix This — Action Items Panel (AS-1 + AS-2) */}
      {isRealAnalysis && (
        <div className="mb-6">
          <ActionItemsPanel
            actionItems={analysisData?.action_items || []}
            schemaAnalysis={analysisData?.schema_analysis || null}
          />
        </div>
      )}

      {/* AI Readability Score (AS-3) */}
      {isRealAnalysis && (
        <div className="mb-6">
          <ReadabilityPanel readability={analysisData?.readability || null} />
        </div>
      )}

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
            <div className="w-full bg-mist rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  pillar.score >= 80 ? 'bg-clarity' :
                  pillar.score >= 60 ? 'bg-amber' :
                  'bg-red-500'
                }`}
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
                        {Math.round(factor.score)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {getScoreLabel(factor.score)}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-green-700 mb-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Evidence Found</h5>
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
                      <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Recommendations</h5>
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