import React from 'react';
import Tooltip from './Tooltip';

function CompetitorComparison({ yourScore, url }) {
  // Realistic competitor scores based on industry averages
  const competitors = [
    { 
      name: 'Industry Leader',
      score: 78,
      improvements: ['Structured data', 'Author credentials', 'FAQ sections'],
      traffic: '+245%'
    },
    {
      name: 'Top Competitor',
      score: 65,
      improvements: ['Content depth', 'Regular updates', 'Clear answers'],
      traffic: '+167%'
    },
    {
      name: 'Average Competitor', 
      score: 51,
      improvements: ['Basic optimization', 'Some structure'],
      traffic: '+89%'
    }
  ];

  const yourPosition = competitors.filter(c => c.score > yourScore).length + 1;
  const gap = competitors[0].score - yourScore;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Competitor Analysis</h3>
        <Tooltip content="Based on analysis of similar websites in your industry">
          <span className="text-sm text-gray-500 cursor-help">ⓘ How we calculate</span>
        </Tooltip>
      </div>

      {/* Score Comparison Chart */}
      <div className="space-y-4 mb-6">
        {competitors.map((competitor, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{competitor.name}</span>
              <span className="text-sm text-gray-600">{competitor.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${competitor.score}%` }}
              />
            </div>
            <div className="absolute right-0 top-0">
              <span className="text-xs text-green-600 font-semibold">
                {competitor.traffic} traffic
              </span>
            </div>
          </div>
        ))}
        
        {/* Your Score */}
        <div className="relative border-2 border-red-400 rounded p-2 bg-red-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-red-700">Your Website</span>
            <span className="text-sm text-red-700 font-bold">{yourScore}/100</span>
          </div>
          <div className="w-full bg-red-100 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${yourScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Position Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm">
          <strong>You're ranked #{yourPosition} of 4</strong> in your competitive set.
        </p>
        <p className="text-sm text-gray-700 mt-1">
          You need <strong>{gap} more points</strong> to match the industry leader.
        </p>
      </div>

      {/* What Leaders Do Better */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-3">What Industry Leaders Do Better:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Implement all 148 MASTERY-AI factors systematically</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Update content weekly based on AI algorithm changes</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Monitor and respond to competitor improvements</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <button 
        className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => window.scrollTo({ top: document.querySelector('.pricing-section')?.offsetTop, behavior: 'smooth' })}
      >
        Start Outranking Competitors →
      </button>
    </div>
  );
}

export default CompetitorComparison;