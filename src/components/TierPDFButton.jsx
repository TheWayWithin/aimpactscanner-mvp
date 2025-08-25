/**
 * Tier-Based PDF Button Component
 * 
 * Provides tier access control for PDF export functionality
 * - Free tier: Shows disabled button with lock icon and upgrade prompt
 * - Coffee+ tier: Shows active button with full PDF export access
 * - Integrates with existing payment and upgrade flows
 * 
 * Phase 3: Tier Access Control Integration
 */

import React, { useState } from 'react';
import { useUsageTracking } from '../hooks/useUsageTracking';
import PDFReportGenerator from './PDFReportGenerator';
import UpgradeToPDFModal from './UpgradeToPDFModal';

const TierPDFButton = ({ analysisId, url, analysisData, onReportGenerated, userEmail, user }) => {
  const { usageData, hasPDFAccess } = useUsageTracking(userEmail);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handlePDFClick = () => {
    if (!hasPDFAccess()) {
      // Show upgrade modal for free tier users
      setShowUpgradeModal(true);
      return;
    }
    
    // For Coffee+ tiers, this will be handled by the PDFReportGenerator component
    // which will trigger its onClick handler
  };

  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
  };

  const handleUpgradeSuccess = (tier) => {
    console.log('Upgrade successful to tier:', tier);
    setUpgradeSuccess(true);
    setShowUpgradeModal(false);
    
    // Show success message briefly, then reload to update tier
    setTimeout(() => {
      window.location.reload(); // Refresh to update user tier
    }, 2000);
  };

  // Free tier - show compelling upgrade button with professional styling
  if (!hasPDFAccess()) {
    return (
      <>
        <div className="relative group">
          <button
            onClick={handlePDFClick}
            className="inline-flex items-center px-6 py-3 border-2 border-blue-300 text-sm font-semibold rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 min-w-[200px] justify-center sm:min-w-0 sm:justify-start"
            title="Upgrade to Coffee tier - Professional PDF reports for just $5/month"
          >
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export Professional PDF</span>
            <span className="sm:hidden">PDF Export</span>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-lg animate-pulse">
              <span className="hidden sm:inline">Upgrade</span>
              <span className="sm:hidden">Pro</span>
            </div>
          </button>
          
          {/* Hover tooltip for additional context */}
          <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 hidden sm:block">
            <p className="text-xs text-gray-700 mb-2">
              <strong>Professional PDF Reports Include:</strong>
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Executive summary dashboard</li>
              <li>• Detailed factor analysis</li>
              <li>• Actionable recommendations</li>
              <li>• Professional branding</li>
            </ul>
            <p className="text-xs text-blue-600 font-medium mt-2">Just $5/month - Cancel anytime</p>
          </div>
        </div>
        
        {/* Upgrade Success Message */}
        {upgradeSuccess && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Upgrade successful! Refreshing...</span>
            </div>
          </div>
        )}
        
        {/* Upgrade Modal */}
        <UpgradeToPDFModal 
          isOpen={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          currentTier={usageData.tier}
          onUpgrade={handleUpgradeSuccess}
          user={user}
        />
      </>
    );
  }

  // Coffee+ tiers - show professional active PDF export button
  return (
    <div className="relative group">
      <div className="inline-flex items-center">
        <PDFReportGenerator 
          analysisId={analysisId}
          url={url}
          analysisData={analysisData}
          onReportGenerated={onReportGenerated}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 min-w-[200px] justify-center sm:min-w-0 sm:justify-start"
        />
        
        {/* Premium tier indicator */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-0.5 rounded-full capitalize font-medium shadow-lg">
          <span className="hidden sm:inline">{usageData.tier} ✓</span>
          <span className="sm:hidden">✓</span>
        </div>
      </div>
      
      {/* Success indicator tooltip */}
      <div className="absolute left-0 top-full mt-2 w-56 bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 hidden sm:block">
        <p className="text-xs text-green-800">
          <strong>✓ PDF Export Enabled</strong>
        </p>
        <p className="text-xs text-green-700 mt-1">
          Generate unlimited professional reports with your {usageData.tier} tier subscription.
        </p>
      </div>
    </div>
  );
};

export default TierPDFButton;