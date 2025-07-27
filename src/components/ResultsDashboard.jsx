import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import FactorCard from './FactorCard';
import PillarSection from './PillarSection';

function ResultsDashboard({ analysisId }) {
  const [analysis, setAnalysis] = useState(null);
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Official MASTERY-AI Framework v3.1.1 Pillar configuration
  const pillars = [
    {
      id: 'AI',
      name: 'AI Response Optimization & Citation',
      description: 'Citation potential and AI system compatibility with MCP integration',
      color: '#1E3A8A', // Mastery Blue
      weight: 23.8 // Official framework weight
    },
    {
      id: 'A',
      name: 'Authority & Trust Signals',
      description: 'Credibility and expertise demonstration',
      color: '#059669', // Emerald
      weight: 17.9 // Official framework weight
    },
    {
      id: 'M',
      name: 'Machine Readability & Technical Infrastructure',
      description: 'Technical infrastructure and accessibility with LLMs.txt support',
      color: '#7C2D12', // Orange
      weight: 14.6 // Official framework weight
    },
    {
      id: 'S',
      name: 'Semantic Content Quality',
      description: 'Content depth and semantic relevance',
      color: '#6366F1', // Indigo
      weight: 13.9 // Official framework weight
    },
    {
      id: 'E',
      name: 'Engagement & User Experience',
      description: 'User interaction and experience quality',
      color: '#7C3AED', // Purple
      weight: 10.9 // Official framework weight
    },
    {
      id: 'T',
      name: 'Topical Expertise & Experience',
      description: 'Subject matter expertise and experience demonstration',
      color: '#DC2626', // Red
      weight: 8.9 // Official framework weight
    },
    {
      id: 'R',
      name: 'Reference Networks & Citations',
      description: 'Citation authority and reference network strength',
      color: '#0891B2', // Cyan
      weight: 5.9 // Official framework weight
    },
    {
      id: 'Y',
      name: 'Yield Optimization & Freshness',
      description: 'Performance optimization and content freshness',
      color: '#EA580C', // Orange
      weight: 4.1 // Official framework weight
    }
  ];

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch analysis details
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (analysisError) throw analysisError;

      // Fetch factor results with enhanced debugging
      console.log('🔍 Fetching factors for analysis_id:', analysisId);
      console.log('🔍 Analysis data:', analysisData);
      
      const { data: factorsData, error: factorsError } = await supabase
        .from('analysis_factors')
        .select(`
          id,
          analysis_id,
          factor_id,
          factor_name,
          pillar,
          score,
          confidence,
          weight,
          evidence,
          recommendations,
          processing_time_ms,
          educational_content,
          phase,
          created_at
        `)
        .eq('analysis_id', analysisId)
        .order('factor_id');

      console.log('🔍 Factors query result:', { data: factorsData, error: factorsError });
      console.log('🔍 Current user:', await supabase.auth.getUser());
      
      if (factorsError) {
        console.error('❌ Factors query error:', factorsError);
        console.error('❌ Full error details:', JSON.stringify(factorsError, null, 2));
        
        // If it's an RLS error, let's try a different approach
        if (factorsError.code === '42501' || factorsError.message?.includes('denied') || factorsError.message?.includes('policy')) {
          console.log('🔧 RLS policy error detected, trying alternative approach...');
          
          // Try to get factors through a different query
          const { data: alternativeFactors, error: altError } = await supabase
            .rpc('get_analysis_factors', { analysis_uuid: analysisId });
          
          if (!altError && alternativeFactors) {
            console.log('✅ Alternative query succeeded:', alternativeFactors);
            setFactors(alternativeFactors);
            setAnalysis(analysisData);
            return;
          }
        }
        
        throw factorsError;
      }

      console.log('✅ Analysis data fetched:', analysisData);
      console.log('✅ Factors data fetched:', factorsData);
      console.log('✅ Number of factors:', factorsData?.length || 0);
      console.log('✅ Analysis status:', analysisData.status);
      
      // Special handling for analyses stuck in "processing" but with factors
      if (analysisData.status === 'processing' && factorsData && factorsData.length > 0) {
        console.log('🔧 Found processing analysis with factors - treating as completed');
        // Calculate overall score from factors
        const calculatedScore = Math.round(factorsData.reduce((sum, f) => sum + f.score, 0) / factorsData.length);
        setAnalysis({
          ...analysisData,
          status: 'completed',
          overall_score: calculatedScore
        });
      } else {
        setAnalysis(analysisData);
      }
      
      setFactors(factorsData || []);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load analysis results');
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    if (!analysisId) return;

    fetchResults();
  }, [analysisId, fetchResults]);

  const groupFactorsByPillar = () => {
    const grouped = {};
    
    pillars.forEach(pillar => {
      grouped[pillar.id] = {
        ...pillar,
        factors: factors.filter(factor => factor.pillar === pillar.id),
        score: 0,
        maxScore: 0
      };
    });

    // Calculate pillar scores
    Object.keys(grouped).forEach(pillarId => {
      const pillarFactors = grouped[pillarId].factors;
      if (pillarFactors.length > 0) {
        const totalScore = pillarFactors.reduce((sum, factor) => sum + factor.score, 0);
        const maxPossible = pillarFactors.length * 100;
        grouped[pillarId].score = Math.round((totalScore / maxPossible) * 100);
        grouped[pillarId].maxScore = 100;
      }
    });

    return grouped;
  };

  const calculateOverallScore = () => {
    if (factors.length === 0) return 0;
    
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    const maxPossible = factors.length * 100;
    return Math.round((totalScore / maxPossible) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#059669'; // Green
    if (score >= 60) return '#D97706'; // Orange
    return '#DC2626'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical Issues';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#0891B2' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#FEF2F2', borderColor: '#F87171', border: '1px solid' }}>
        <p style={{ color: '#DC2626' }}>{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 text-center" style={{ color: '#64748B' }}>
        <p>No analysis results found.</p>
      </div>
    );
  }

  const pillarGroups = groupFactorsByPillar();
  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-8">
      {/* Header with Overall Score */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8" 
             style={{ 
               borderColor: getScoreColor(overallScore),
               backgroundColor: 'rgba(255, 255, 255, 0.9)'
             }}>
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </div>
            <div className="text-sm font-medium" style={{ color: '#64748B' }}>
              / 100
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            MASTERY-AI Analysis Results
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg font-semibold" style={{ color: getScoreColor(overallScore) }}>
              {getScoreLabel(overallScore)}
            </span>
            <span style={{ color: '#64748B' }}>•</span>
            <span style={{ color: '#64748B' }}>
              {factors.length} factors analyzed
            </span>
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Analyzed: {analysis.url}
          </p>
        </div>
      </div>

      {/* Pillar Results */}
      <div className="space-y-6">
        {pillars.map(pillar => {
          const pillarData = pillarGroups[pillar.id];
          
          if (!pillarData || pillarData.factors.length === 0) {
            return null;
          }

          return (
            <PillarSection
              key={pillar.id}
              pillar={pillarData}
              isExpanded={pillarData.score < 80} // Auto-expand low-scoring pillars
            />
          );
        })}
      </div>

      {/* Summary Insights */}
      <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>
          Key Insights & Recommendations
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performing Areas */}
          <div>
            <h4 className="font-medium mb-3" style={{ color: '#059669' }}>
              ✓ Strengths
            </h4>
            <ul className="space-y-2">
              {Object.values(pillarGroups)
                .filter(pillar => pillar.score >= 80 && pillar.factors.length > 0)
                .slice(0, 3)
                .map(pillar => (
                  <li key={pillar.id} className="text-sm" style={{ color: '#64748B' }}>
                    <strong style={{ color: pillar.color }}>{pillar.name}</strong> - {pillar.score}%
                  </li>
                ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h4 className="font-medium mb-3" style={{ color: '#DC2626' }}>
              ⚡ Priority Improvements
            </h4>
            <ul className="space-y-2">
              {Object.values(pillarGroups)
                .filter(pillar => pillar.score < 60 && pillar.factors.length > 0)
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map(pillar => (
                  <li key={pillar.id} className="text-sm" style={{ color: '#64748B' }}>
                    <strong style={{ color: pillar.color }}>{pillar.name}</strong> - {pillar.score}%
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDashboard;