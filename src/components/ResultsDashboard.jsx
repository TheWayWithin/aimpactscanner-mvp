import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import FactorCard from './FactorCard';
import PillarSection from './PillarSection';

function ResultsDashboard({ analysisId }) {
  const [analysis, setAnalysis] = useState(null);
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MASTERY-AI Pillar configuration
  const pillars = [
    {
      id: 'AI',
      name: 'AI Response Optimization',
      description: 'Citation potential and AI system compatibility',
      color: '#1E3A8A', // Mastery Blue
      weight: 18.5
    },
    {
      id: 'A',
      name: 'Authority Signals',
      description: 'Credibility and expertise demonstration',
      color: '#059669', // Emerald
      weight: 16.0
    },
    {
      id: 'M',
      name: 'Machine Readability',
      description: 'Technical infrastructure and accessibility',
      color: '#7C2D12', // Orange
      weight: 15.5
    },
    {
      id: 'S',
      name: 'Semantic Content Quality',
      description: 'Content depth and relevance',
      color: '#6366F1', // Indigo
      weight: 14.0
    },
    {
      id: 'T',
      name: 'Topical Relevance',
      description: 'Subject matter alignment and coverage',
      color: '#DC2626', // Red
      weight: 12.5
    },
    {
      id: 'E',
      name: 'Engagement Optimization',
      description: 'User interaction and experience quality',
      color: '#7C3AED', // Purple
      weight: 11.5
    },
    {
      id: 'R',
      name: 'Reach & Amplification',
      description: 'Distribution and discoverability',
      color: '#0891B2', // Cyan
      weight: 6.5
    },
    {
      id: 'Y',
      name: 'Yield Optimization',
      description: 'Performance and conversion efficiency',
      color: '#EA580C', // Orange
      weight: 5.5
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

      // Fetch factor results
      const { data: factorsData, error: factorsError } = await supabase
        .from('analysis_factors')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('factor_id');

      if (factorsError) throw factorsError;

      console.log('✅ Analysis data fetched:', analysisData);
      console.log('✅ Factors data fetched:', factorsData);
      console.log('✅ Number of factors:', factorsData?.length || 0);
      
      setAnalysis(analysisData);
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