// Enzuzo Test Component - For verifying GDPR integration
import React, { useEffect, useState } from 'react';
import { useEnzuzoConsent } from '../privacy/enzuzo-integration.jsx';

const EnzuzoTestComponent = () => {
  const [enzuzoStatus, setEnzuzoStatus] = useState('checking');
  const [events, setEvents] = useState([]);
  
  const { hasConsent, showConsentBanner, resetConsent } = useEnzuzoConsent();

  useEffect(() => {
    // Check Enzuzo integration status
    const checkEnzuzo = () => {
      const hasRoot = document.getElementById('__enzuzo-root');
      const hasScript = document.getElementById('__enzuzo-root-script');
      
      if (hasRoot && hasScript) {
        setEnzuzoStatus('success');
        addEvent('✅ Enzuzo Integration', 'Root div and script loaded successfully');
      } else if (hasRoot || hasScript) {
        setEnzuzoStatus('partial');
        addEvent('⚠️ Enzuzo Status', 'Partial integration detected');
      } else {
        setEnzuzoStatus('error');
        addEvent('❌ Enzuzo Error', 'Integration not found');
      }
      
      // Check for Enzuzo global object
      if (typeof window !== 'undefined' && window.Enzuzo) {
        addEvent('✅ Enzuzo API', 'Global Enzuzo object available');
      }
    };

    setTimeout(checkEnzuzo, 2000);
  }, []);

  const addEvent = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [...prev, { timestamp, type, message }]);
  };

  const testFunctions = {
    checkConsent: () => {
      const analyticsConsent = hasConsent('analytics');
      const marketingConsent = hasConsent('marketing');
      addEvent('🍪 Consent Check', `Analytics: ${analyticsConsent}, Marketing: ${marketingConsent}`);
    },
    
    showBanner: () => {
      showConsentBanner();
      addEvent('📢 Banner Action', 'Show consent banner triggered');
    },
    
    resetAllConsent: () => {
      resetConsent();
      addEvent('🔄 Reset Action', 'All consent preferences reset');
    },
    
    checkGlobalAPI: () => {
      if (typeof window !== 'undefined' && window.Enzuzo) {
        addEvent('🌐 Global API', 'Enzuzo global object available');
        const consent = window.Enzuzo.getConsent ? window.Enzuzo.getConsent() : 'No getConsent method';
        addEvent('📋 Current Consent', JSON.stringify(consent));
      } else {
        addEvent('❌ Global API', 'Enzuzo global object not found');
      }
    }
  };

  const getStatusColor = () => {
    switch (enzuzoStatus) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🍪 Enzuzo GDPR Test Dashboard</h1>
        <p className="text-gray-600">Testing Enzuzo integration for GDPR compliance</p>
      </div>

      {/* Enzuzo Status */}
      <div className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}>
        <h2 className="font-semibold mb-2">🔒 Enzuzo Integration Status</h2>
        <div className="text-sm space-y-1">
          <div><strong>Domain ID:</strong> d7ac73b6-7c38-11f0-9bf3-a7c11342cf5c</div>
          <div><strong>Script URL:</strong> https://app.enzuzo.com/scripts/privacy/d7ac73b6-7c38-11f0-9bf3-a7c11342cf5c</div>
          <div><strong>Root Element:</strong> {document.getElementById('__enzuzo-root') ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Script Element:</strong> {document.getElementById('__enzuzo-root-script') ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Global API:</strong> {typeof window !== 'undefined' && window.Enzuzo ? '✅ Available' : '❌ Not available'}</div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testFunctions.checkConsent}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🍪 Check Consent Status
        </button>
        
        <button
          onClick={testFunctions.showBanner}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          📢 Show Consent Banner
        </button>
        
        <button
          onClick={testFunctions.resetAllConsent}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          🔄 Reset Consent
        </button>
        
        <button
          onClick={testFunctions.checkGlobalAPI}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          🌐 Check Global API
        </button>
      </div>

      {/* Event Log */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📝 Test Event Log</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-gray-500 text-sm">No events yet. Click buttons above to test Enzuzo integration.</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-sm bg-white p-2 rounded border">
                <span className="font-mono text-gray-500">{event.timestamp}</span>
                <span className="ml-2 font-semibold">{event.type}</span>
                <span className="ml-2">{event.message}</span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setEvents([])}
          className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🗑️ Clear Log
        </button>
      </div>

      {/* Manual Verification */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Manual Verification Steps</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>Consent Banner</strong>: Should appear on first visit (clear cookies to test)</li>
          <li>2. <strong>Cookie Categories</strong>: Should show Necessary, Analytics, Marketing options</li>
          <li>3. <strong>GTM Integration</strong>: Consent choices should affect GA4 tracking</li>
          <li>4. <strong>Privacy Policy</strong>: Auto-generated policy should be accessible</li>
          <li>5. <strong>Browser Console</strong>: Check for Enzuzo initialization messages</li>
        </ol>
      </div>

      {/* GDPR Compliance Info */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">🛡️ GDPR Compliance Features</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>✅ <strong>Cookie Consent Management</strong>: Professional banner with granular controls</li>
          <li>✅ <strong>Auto-updating Privacy Policy</strong>: Legal changes handled automatically</li>
          <li>✅ <strong>EU User Protection</strong>: Geographic consent requirements</li>
          <li>✅ <strong>GTM Consent Mode</strong>: Analytics respect user preferences</li>
          <li>✅ <strong>Multi-domain Support</strong>: Consistent consent across properties</li>
        </ul>
      </div>
    </div>
  );
};

export default EnzuzoTestComponent;