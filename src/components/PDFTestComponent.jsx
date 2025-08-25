/**
 * PDF Test Component
 * 
 * Phase 1: Basic PDF generation testing
 * Validates jsPDF and html2canvas functionality
 * 
 * This is a temporary test component that will be removed in Phase 2
 */

import React, { useState, useRef } from 'react';
import { 
  testPDFGeneration, 
  downloadPDF, 
  testHTMLToPDF, 
  validatePDFLibraries 
} from '../utils/pdfGenerator.js';

const PDFTestComponent = () => {
  const [testStatus, setTestStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const testElementRef = useRef(null);

  // Basic PDF generation test
  const handleBasicPDFTest = async () => {
    setIsLoading(true);
    setTestStatus('Testing basic PDF generation...');
    
    try {
      const pdfBlob = await testPDFGeneration();
      downloadPDF(pdfBlob, 'basic-test.pdf');
      setTestStatus('✅ Basic PDF generation successful! PDF downloaded.');
    } catch (error) {
      setTestStatus(`❌ Basic PDF test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // HTML to PDF conversion test
  const handleHTMLToPDFTest = async () => {
    setIsLoading(true);
    setTestStatus('Testing HTML to PDF conversion...');
    
    try {
      if (testElementRef.current) {
        const pdfBlob = await testHTMLToPDF(testElementRef.current);
        downloadPDF(pdfBlob, 'html-conversion-test.pdf');
        setTestStatus('✅ HTML to PDF conversion successful! PDF downloaded.');
      } else {
        throw new Error('Test element not found');
      }
    } catch (error) {
      setTestStatus(`❌ HTML to PDF test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Library validation test
  const handleLibraryValidation = () => {
    setTestStatus('Validating PDF libraries...');
    
    const status = validatePDFLibraries();
    
    if (status.jsPDF && status.html2canvas && status.browserSupport) {
      setTestStatus('✅ All PDF libraries loaded successfully!');
    } else {
      setTestStatus(`❌ Library validation failed: ${status.errors.join(', ')}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          PDF Generation Library Test
        </h2>
        <p className="text-gray-600 mb-6">
          Phase 1: Validate jsPDF and html2canvas functionality for future report generation
        </p>
        
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleLibraryValidation}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Validate Libraries
          </button>
          
          <button
            onClick={handleBasicPDFTest}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Testing...' : 'Test Basic PDF'}
          </button>
          
          <button
            onClick={handleHTMLToPDFTest}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Converting...' : 'Test HTML→PDF'}
          </button>
        </div>

        {/* Status Display */}
        {testStatus && (
          <div className={`p-4 rounded-lg ${
            testStatus.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : testStatus.includes('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {testStatus}
          </div>
        )}
      </div>

      {/* Sample HTML Content for PDF Conversion Testing */}
      <div 
        ref={testElementRef}
        className="border border-gray-300 rounded-lg p-6 bg-gray-50"
        style={{ width: '600px', minHeight: '400px' }}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            AImpactScanner Analysis Report
          </h3>
          <p className="text-gray-600">Sample HTML Content for PDF Conversion Test</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Test Section 1</h4>
            <p className="text-gray-700">
              This is sample content that will be converted to PDF. It includes various 
              HTML elements to test the conversion process.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Test Section 2</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Bullet point 1</li>
              <li>Bullet point 2</li>
              <li>Bullet point 3</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Test Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-gray-600">Sample Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">A+</div>
                <div className="text-gray-600">Sample Grade</div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-6">
            Generated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> This is a Phase 1 test component. 
          It will be removed when the PDF report feature is fully implemented in Phase 2.
        </p>
      </div>
    </div>
  );
};

export default PDFTestComponent;