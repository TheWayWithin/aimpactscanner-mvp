import React, { useState } from 'react';
import FactorCard from './FactorCard';

function PillarSection({ pillar, isExpanded: defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getScoreColor = (score) => {
    if (score >= 80) return '#059669'; // Green
    if (score >= 60) return '#D97706'; // Orange
    return '#DC2626'; // Red
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '✓';
    if (score >= 60) return '!';
    return '⚠';
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
      {/* Pillar Header */}
      <div 
        className="p-4 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ backgroundColor: `${pillar.color}10` }}
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Pillar Icon */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: pillar.color }}
            >
              {pillar.id}
            </div>
            
            {/* Pillar Info */}
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                  {pillar.name}
                </h3>
                <span className="text-sm font-medium px-2 py-1 rounded" 
                      style={{ 
                        backgroundColor: `${pillar.color}20`,
                        color: pillar.color 
                      }}>
                  {pillar.weight}% weight
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                {pillar.description} • {pillar.factors.length} factors
              </p>
            </div>
          </div>

          {/* Score and Expand Button */}
          <div className="flex items-center space-x-4">
            {/* Score Display */}
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span 
                  className="text-xl font-bold"
                  style={{ color: getScoreColor(pillar.score) }}
                >
                  {getScoreIcon(pillar.score)} {pillar.score}%
                </span>
              </div>
              <div className="text-xs" style={{ color: '#64748B' }}>
                {pillar.factors.filter(f => f.score >= 80).length} of {pillar.factors.length} excellent
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform"
              style={{ 
                backgroundColor: '#F1F5F9',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="#64748B" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${pillar.score}%`,
                backgroundColor: getScoreColor(pillar.score)
              }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Factor Details */}
      {isExpanded && (
        <div className="border-t" style={{ borderColor: '#E2E8F0' }}>
          <div className="p-4 space-y-4" style={{ backgroundColor: '#FEFEFE' }}>
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="text-lg font-bold" style={{ color: '#059669' }}>
                  {pillar.factors.filter(f => f.score >= 80).length}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>Excellent</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="text-lg font-bold" style={{ color: '#D97706' }}>
                  {pillar.factors.filter(f => f.score >= 60 && f.score < 80).length}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>Good</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="text-lg font-bold" style={{ color: '#DC2626' }}>
                  {pillar.factors.filter(f => f.score < 60).length}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>Needs Work</div>
              </div>
              <div className="text-center p-3 rounded" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="text-lg font-bold" style={{ color: pillar.color }}>
                  {Math.round(pillar.factors.reduce((sum, f) => sum + f.score, 0) / pillar.factors.length)}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>Avg Score</div>
              </div>
            </div>

            {/* Individual Factor Cards */}
            <div className="grid gap-4">
              {pillar.factors
                .sort((a, b) => {
                  // Sort by score (lowest first for attention) then by factor_id
                  if (a.score !== b.score) return a.score - b.score;
                  return a.factor_id.localeCompare(b.factor_id);
                })
                .map(factor => (
                  <FactorCard 
                    key={factor.factor_id} 
                    factor={factor} 
                    pillarColor={pillar.color}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PillarSection;