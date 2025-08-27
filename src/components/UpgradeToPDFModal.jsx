/**
 * Upgrade to PDF Modal Component
 * 
 * Dedicated modal component for PDF upgrade prompts
 * Highlights PDF export features and drives Coffee tier conversions
 * Integrates with existing payment flow and tier system
 * 
 * Phase 3: Tier Access Control Integration
 */

import React, { useState } from 'react';
import { useUpgrade } from './UpgradeHandler';

const UpgradeToPDFModal = ({ isOpen, onClose, currentTier, onUpgrade, user }) => {
  const [upgradeStatus, setUpgradeStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { handleUpgrade, loading } = useUpgrade(
    user,
    (result) => {
      setUpgradeStatus({ type: 'success', message: 'Upgrade successful! Redirecting to payment...' });
      if (onUpgrade) onUpgrade('coffee');
    },
    (error) => {
      setUpgradeStatus({ type: 'error', message: error });
      setIsProcessing(false);
    }
  );

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    if (loading || isProcessing) return;
    
    setIsProcessing(true);
    setUpgradeStatus({ type: 'processing', message: 'Preparing secure checkout...' });
    
    try {
      await handleUpgrade('coffee');
    } catch (error) {
      console.error('Upgrade error:', error);
      setUpgradeStatus({ type: 'error', message: 'Payment setup failed. Please try again.' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Enhanced Header with Urgency */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-t-xl"></div>
          
          <div className="relative flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Unlock Professional PDF Reports</h3>
                <p className="text-gray-600 text-lg">Transform your analysis into shareable business documents</p>
                <div className="flex items-center mt-2 text-sm">
                  <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium mr-2">
                    🔥 Most Popular
                  </div>
                  <span className="text-green-600 font-medium">Start immediately after payment</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Enhanced PDF Preview Section with Visual Appeal */}
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-100 shadow-sm overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200 to-blue-200 rounded-full opacity-20 transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative flex items-start">
              <div className="flex-shrink-0 mr-6">
                <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-200 transform rotate-3">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center mt-2">
                  <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">PDF Report</div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
                  Professional PDF Reports Include:
                  <span className="ml-2 text-lg">🎨</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Executive Summary Dashboard</span>
                  </div>
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">8-Pillar Framework Analysis</span>
                  </div>
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Detailed Factor Breakdowns</span>
                  </div>
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Prioritized Action Plan</span>
                  </div>
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Professional Branding</span>
                  </div>
                  <div className="flex items-center text-blue-800 text-sm bg-white/60 rounded-lg p-2">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Unlimited PDF Exports</span>
                  </div>
                </div>
                
                {/* Added value indicators */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">✨ Instant Access</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">📊 Client-Ready</span>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">🏆 Professional Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Value Proposition with Social Proof */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-yellow-900 text-lg mb-2">Why Our Users Love PDF Reports:</h5>
                <p className="text-yellow-800 mb-3">
                  <strong>Perfect for client reports and stakeholder presentations.</strong> 
                  Turn your analysis into professional documentation that demonstrates value and drives action.
                </p>
                
                {/* Testimonial quotes */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/70 rounded-lg p-3 border border-yellow-200">
                    <p className="text-sm text-yellow-800 italic mb-2">
                      "These PDF reports save me 3+ hours per client presentation. The professional formatting is perfect for executive meetings."
                    </p>
                    <p className="text-xs text-yellow-700 font-medium">— Marketing Director, SaaS Company</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-yellow-200">
                    <p className="text-sm text-yellow-800 italic mb-2">
                      "ROI became clear after the first client report. The detailed recommendations helped close 2 new consulting contracts."
                    </p>
                    <p className="text-xs text-yellow-700 font-medium">— SEO Consultant, Digital Agency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Free Tier */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Free Tier</h5>
                  <p className="text-sm text-gray-600">{currentTier === 'free' ? 'Current Plan' : 'Basic Plan'}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  No PDF export capability
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  3 analyses per month
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic web results view
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Community support
                </li>
              </ul>
            </div>

            {/* Coffee Tier */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 relative">
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <span className="text-sm">☕</span>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900">Coffee Tier</h5>
                  <p className="text-sm text-blue-600">$4.95/month</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center font-medium">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  ✨ Professional PDF Reports
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited analyses
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Clean, professional results
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Educational content library
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email support
                </li>
              </ul>
            </div>
          </div>

          {/* Enhanced Call to Action with Urgency and Value */}
          <div className="text-center bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 text-white shadow-xl">
            {/* Urgency indicator */}
            <div className="mb-4">
              <div className="inline-flex items-center bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Limited Time: Start Today!
              </div>
            </div>
            
            <h4 className="text-2xl font-bold mb-4">Ready to Create Professional Reports?</h4>
            
            {/* Status Messages */}
            {upgradeStatus && (
              <div className={`mb-4 p-4 rounded-lg ${
                upgradeStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                upgradeStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                <div className="flex items-center">
                  {upgradeStatus.type === 'processing' && (
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {upgradeStatus.type === 'success' && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {upgradeStatus.type === 'error' && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{upgradeStatus.message}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleUpgradeClick}
              disabled={loading || isProcessing}
              className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl shadow-lg transition-all duration-200 mb-4 ${
                loading || isProcessing
                  ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
                  : 'text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transform hover:scale-105 hover:shadow-2xl'
              }`}
            >
              {loading || isProcessing ? (
                <>
                  <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isProcessing ? 'Setting up payment...' : 'Processing...'}
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Get Coffee Tier - $4.95/month
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
            
            {/* Value reinforcement */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center text-blue-100">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Instant access after payment</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Cancel anytime, no contracts</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Secure Stripe payment processing</span>
              </div>
            </div>
            
            {/* Money-back guarantee */}
            <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
              <div className="flex items-center justify-center text-white">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">30-day satisfaction guarantee</span>
              </div>
              <p className="text-blue-100 text-sm mt-1">Not happy? Get a full refund, no questions asked.</p>
            </div>
            
            {/* Alternative Action - Less Prominent */}
            <div className="mt-6 pt-4 border-t border-blue-300/30">
              <button
                onClick={onClose}
                className="text-sm text-blue-200 hover:text-white underline transition-colors duration-200"
              >
                Maybe later, continue without PDF export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeToPDFModal;