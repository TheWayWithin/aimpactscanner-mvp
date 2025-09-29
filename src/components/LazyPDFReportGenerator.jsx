/**
 * Lazy-loaded PDF Report Generator
 * 
 * This component dynamically imports PDFReportGenerator only when needed,
 * reducing the initial bundle size by ~560KB (jsPDF + html2canvas libraries)
 * 
 * Performance optimization for AImpactScanner
 */

import React, { Suspense, useState } from 'react';

// Lazy load the PDF report generator component
const PDFReportGenerator = React.lazy(() => import('./PDFReportGenerator'));

// Loading component for PDF generation
const PDFLoadingState = () => (
  <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg border border-blue-200">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-blue-600 font-medium">Loading PDF Generator...</p>
        <p className="text-sm text-blue-500 mt-1">Preparing libraries for report generation</p>
      </div>
    </div>
  </div>
);

// Error boundary for PDF generation failures
class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PDF Generator Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-red-800 font-semibold">PDF Generation Error</h3>
          </div>
          <p className="text-red-700 mb-4">
            Failed to load PDF generation components. This might be due to network issues or browser compatibility.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LazyPDFReportGenerator = ({ analysisId, url, analysisData, onReportGenerated, className }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <PDFErrorBoundary>
      <Suspense fallback={<PDFLoadingState />}>
        <PDFReportGenerator
          analysisId={analysisId}
          url={url}
          analysisData={analysisData}
          onReportGenerated={onReportGenerated}
          className={className}
          onLoadStart={handleLoadStart}
          onLoadComplete={handleLoadComplete}
        />
      </Suspense>
    </PDFErrorBoundary>
  );
};

export default LazyPDFReportGenerator;