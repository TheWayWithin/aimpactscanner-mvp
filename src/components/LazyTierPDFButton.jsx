/**
 * Lazy-loaded Tier PDF Button
 * 
 * This component dynamically imports TierPDFButton and its PDF dependencies
 * only when needed, reducing the initial bundle size significantly
 * 
 * Performance optimization for AImpactScanner
 */

import React, { Suspense, useState } from 'react';

// Lazy load the tier PDF button component
const TierPDFButton = React.lazy(() => import('./TierPDFButton'));

// Loading state for PDF button
const PDFButtonLoadingState = () => (
  <div className="flex items-center justify-center">
    <button 
      disabled
      className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-400 rounded-lg border border-gray-200 cursor-not-allowed"
    >
      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
      Loading PDF...
    </button>
  </div>
);

// Error boundary for PDF button failures
class PDFButtonErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PDF Button Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5 text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-red-800 font-medium">PDF Unavailable</span>
          </div>
          <p className="text-red-700 text-sm">
            PDF generation is temporarily unavailable. Please refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const LazyTierPDFButton = ({ analysisId, url, analysisData, onReportGenerated, userEmail, user }) => {
  return (
    <PDFButtonErrorBoundary>
      <Suspense fallback={<PDFButtonLoadingState />}>
        <TierPDFButton
          analysisId={analysisId}
          url={url}
          analysisData={analysisData}
          onReportGenerated={onReportGenerated}
          userEmail={userEmail}
          user={user}
        />
      </Suspense>
    </PDFButtonErrorBoundary>
  );
};

export default LazyTierPDFButton;