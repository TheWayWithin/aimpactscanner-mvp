import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

function ROICalculator({ currentScore, monthlyTraffic = 5000 }) {
  const [avgOrderValue, setAvgOrderValue] = useState(100);
  const [conversionRate, setConversionRate] = useState(2);
  const [calculatedROI, setCalculatedROI] = useState(null);

  // Calculate potential improvements based on score increase
  const calculateROI = () => {
    const targetScore = 75; // Professional tier average
    const scoreImprovement = targetScore - currentScore;
    const trafficIncrease = (scoreImprovement / 100) * 2.5; // 2.5% traffic per point
    
    const newMonthlyTraffic = monthlyTraffic * (1 + trafficIncrease);
    const additionalTraffic = newMonthlyTraffic - monthlyTraffic;
    const additionalConversions = (additionalTraffic * conversionRate) / 100;
    const additionalRevenue = additionalConversions * avgOrderValue;
    
    // Professional tier cost
    const monthlyCost = 29;
    const roi = ((additionalRevenue - monthlyCost) / monthlyCost) * 100;
    
    setCalculatedROI({
      additionalTraffic: Math.round(additionalTraffic),
      additionalConversions: Math.round(additionalConversions),
      additionalRevenue: Math.round(additionalRevenue),
      monthlyCost,
      roi: Math.round(roi),
      paybackDays: Math.round(30 * (monthlyCost / additionalRevenue))
    });
  };

  useEffect(() => {
    calculateROI();
  }, [avgOrderValue, conversionRate, currentScore]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">ROI Calculator</h3>
        <Tooltip content="Based on average improvements seen by our Professional tier members">
          <span className="text-sm text-gray-500 cursor-help">ⓘ Methodology</span>
        </Tooltip>
      </div>

      {/* Input Parameters */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Average Order Value
          </label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input
              type="number"
              value={avgOrderValue}
              onChange={(e) => setAvgOrderValue(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Current Conversion Rate
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              min="0.1"
              max="100"
              step="0.1"
            />
            <span className="ml-2">%</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="flex justify-between text-sm">
            <span>Current Monthly Traffic:</span>
            <span className="font-semibold">{monthlyTraffic.toLocaleString()} visitors</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Current AI Score:</span>
            <span className="font-semibold">{currentScore}/100</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculatedROI && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Expected Monthly Results:</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Additional Traffic:</span>
              <span className="font-semibold">+{calculatedROI.additionalTraffic.toLocaleString()} visitors</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Additional Conversions:</span>
              <span className="font-semibold">+{calculatedROI.additionalConversions} sales</span>
            </div>
            
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Additional Revenue:</span>
              <span className="text-green-600">${calculatedROI.additionalRevenue.toLocaleString()}/mo</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Professional Tier Cost:</span>
              <span className="text-sm">-${calculatedROI.monthlyCost}/mo</span>
            </div>
            
            <div className={`bg-gradient-to-r ${calculatedROI.roi > 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'} rounded-lg p-4 mt-4`}>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Return on Investment</p>
                <p className={`text-3xl font-bold ${calculatedROI.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatedROI.roi > 0 ? '+' : ''}{calculatedROI.roi}%
                </p>
                {calculatedROI.paybackDays < 30 && (
                  <p className="text-sm text-green-600 mt-1">
                    Pays for itself in {calculatedROI.paybackDays} days
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button 
        className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Increasing Revenue →
      </button>
    </div>
  );
}

export default ROICalculator;