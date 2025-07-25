import React, { useState } from 'react';

function FactorCard({ factor, pillarColor }) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return '#059669'; // Green
    if (score >= 60) return '#D97706'; // Orange
    return '#DC2626'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  const getImpactLevel = (score) => {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    return 'High';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#059669';
    if (confidence >= 60) return '#D97706';
    return '#DC2626';
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      style={{ borderColor: '#E2E8F0' }}
    >
      {/* Factor Header */}
      <div 
        className="p-4 cursor-pointer"
        style={{ backgroundColor: '#FFFFFF' }}
        onClick={toggleDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Factor Icon/ID */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: pillarColor }}
            >
              {factor.factor_id.split('.').pop()}
            </div>

            {/* Factor Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium" style={{ color: '#0F172A' }}>
                  {factor.factor_name}
                </h4>
                <span 
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ 
                    backgroundColor: `${pillarColor}15`,
                    color: pillarColor 
                  }}
                >
                  {factor.factor_id}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm" style={{ color: '#64748B' }}>
                  Impact: <span className="font-medium">{getImpactLevel(factor.score)}</span>
                </span>
                <span className="text-sm" style={{ color: '#64748B' }}>
                  Confidence: <span 
                    className="font-medium"
                    style={{ color: getConfidenceColor(factor.confidence) }}
                  >
                    {factor.confidence}%
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Score and Expand */}
          <div className="flex items-center space-x-3">
            {/* Score Display */}
            <div className="text-right">
              <div 
                className="text-2xl font-bold"
                style={{ color: getScoreColor(factor.score) }}
              >
                {factor.score}
              </div>
              <div 
                className="text-xs font-medium"
                style={{ color: getScoreColor(factor.score) }}
              >
                {getScoreLabel(factor.score)}
              </div>
            </div>

            {/* Expand Button */}
            <div 
              className="w-6 h-6 rounded flex items-center justify-center transition-transform"
              style={{ 
                backgroundColor: '#F1F5F9',
                transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="#64748B" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
            <div 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${factor.score}%`,
                backgroundColor: getScoreColor(factor.score)
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div 
          className="border-t p-4 space-y-4"
          style={{ 
            borderColor: '#E2E8F0',
            backgroundColor: '#FAFBFC'
          }}
        >
          {/* Evidence Section */}
          {factor.evidence && factor.evidence.length > 0 && (
            <div>
              <h5 className="font-medium mb-2" style={{ color: '#0F172A' }}>
                Evidence Found
              </h5>
              <div className="space-y-1">
                {factor.evidence.map((evidence, index) => (
                  <div 
                    key={index}
                    className="text-sm p-2 rounded border-l-2"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      borderLeftColor: getScoreColor(factor.score),
                      color: '#374151'
                    }}
                  >
                    {evidence}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {factor.recommendations && factor.recommendations.length > 0 && (
            <div>
              <h5 className="font-medium mb-2" style={{ color: '#0F172A' }}>
                Recommendations
              </h5>
              <div className="space-y-2">
                {factor.recommendations.map((recommendation, index) => (
                  <div 
                    key={index}
                    className="text-sm p-3 rounded border-l-4"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      borderLeftColor: pillarColor,
                      color: '#374151'
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <span 
                        className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: pillarColor }}
                      />
                      <span>{recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational Content */}
          {factor.educational_content && (
            <div 
              className="p-3 rounded border-l-4"
              style={{ 
                backgroundColor: '#F8FAFC',
                borderLeftColor: '#1E3A8A'
              }}
            >
              <h5 className="font-medium mb-2 flex items-center space-x-2" style={{ color: '#1E3A8A' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Framework Insight</span>
              </h5>
              <p className="text-sm" style={{ color: '#374151' }}>
                {factor.educational_content}
              </p>
            </div>
          )}

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
            <div>
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                Analysis Date
              </span>
              <div className="text-sm font-medium" style={{ color: '#0F172A' }}>
                {factor.created_at ? new Intl.DateTimeFormat('en-US', {
                  timeZone: 'America/New_York',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }).format(new Date(factor.created_at)) : 'Unknown'}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                Analysis Time
              </span>
              <div className="text-sm font-medium" style={{ color: '#0F172A' }}>
                {factor.created_at ? (() => {
                  // Debug: log the original timestamp
                  console.log('Original timestamp:', factor.created_at);
                  const date = new Date(factor.created_at);
                  console.log('Parsed date (UTC):', date.toISOString());
                  
                  // Force Eastern Time conversion by subtracting 4 hours (EDT) or 5 hours (EST)
                  const now = new Date();
                  const isEDT = now.getTimezoneOffset() < new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
                  const offsetHours = isEDT ? 4 : 5; // EDT is UTC-4, EST is UTC-5
                  
                  const easternTime = new Date(date.getTime() - (offsetHours * 60 * 60 * 1000));
                  const timeString = easternTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  console.log('Eastern Time:', timeString);
                  return timeString + ' ET';
                })() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactorCard;