// Analytics Test Component - For verifying GTM integration
import React, { useEffect, useState } from 'react';
import { useGTMTracking } from '../analytics/gtm-integration.jsx';

const AnalyticsTestComponent = () => {
  const [events, setEvents] = useState([]);
  const [gtmStatus, setGtmStatus] = useState('checking');
  
  const {
    trackPageView,
    trackAnalysisStart,
    trackAnalysisComplete,
    trackSignup,
    trackUpgrade,
    trackFeatureUsage,
    trackError
  } = useGTMTracking();

  useEffect(() => {
    // Check GTM integration status
    const checkGTM = () => {
      if (typeof window !== 'undefined') {
        const hasDataLayer = window.dataLayer && Array.isArray(window.dataLayer);
        const hasGTM = hasDataLayer && window.dataLayer.some(item => item.event === 'gtm.js');
        
        if (hasGTM) {
          setGtmStatus('success');
          addEvent('✅ GTM Integration', 'GTM-WCQGG5N6 loaded successfully');
        } else if (hasDataLayer) {
          setGtmStatus('partial');
          addEvent('⚠️ GTM Status', 'Data Layer exists but GTM not confirmed');
        } else {
          setGtmStatus('error');
          addEvent('❌ GTM Error', 'Data Layer not found');
        }
      }
    };

    setTimeout(checkGTM, 1000);
  }, []);

  const addEvent = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [...prev, { timestamp, type, message }]);
  };

  const testEvents = {
    analysisStart: () => {
      trackAnalysisStart('example.com');
      addEvent('📊 Event Fired', 'analysis_start with example.com');
    },
    
    analysisComplete: () => {
      trackAnalysisComplete('example.com', 67, 12);
      addEvent('📊 Event Fired', 'analysis_complete - Score: 67, Duration: 12s');
    },
    
    signup: () => {
      trackSignup('free');
      addEvent('📊 Event Fired', 'sign_up with free tier');
    },
    
    purchase: () => {
      trackUpgrade('free', 'coffee', 5);
      addEvent('📊 Event Fired', 'purchase - Coffee tier $5');
    },
    
    featureUsage: () => {
      trackFeatureUsage('analytics_test', 'button_click');
      addEvent('📊 Event Fired', 'feature_usage - analytics test');
    }
  };

  const getStatusColor = () => {
    switch (gtmStatus) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔬 Analytics Test Dashboard</h1>
        <p className="text-gray-600">Testing GTM integration for GTM-WCQGG5N6 with GA4 property G-EJ5M874QBZ</p>
      </div>

      {/* GTM Status */}
      <div className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}>
        <h2 className="font-semibold mb-2">📊 GTM Integration Status</h2>
        <div className="text-sm">
          <div>Container ID: GTM-WCQGG5N6</div>
          <div>GA4 Property: G-EJ5M874QBZ</div>
          <div>Data Layer Items: {typeof window !== 'undefined' && window.dataLayer ? window.dataLayer.length : 'N/A'}</div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testEvents.analysisStart}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔍 Test Analysis Start
        </button>
        
        <button
          onClick={testEvents.analysisComplete}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          ✅ Test Analysis Complete
        </button>
        
        <button
          onClick={testEvents.signup}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          👤 Test User Signup
        </button>
        
        <button
          onClick={testEvents.purchase}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          💰 Test Coffee Purchase
        </button>
        
        <button
          onClick={testEvents.featureUsage}
          className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          ⚡ Test Feature Usage
        </button>
        
        <button
          onClick={() => setEvents([])}
          className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          🗑️ Clear Events
        </button>
      </div>

      {/* Event Log */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📝 Event Log</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-gray-500 text-sm">No events yet. Click buttons above to test.</div>
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
      </div>

      {/* Verification Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📈 Verification Steps</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click test buttons above to fire events</li>
          <li>2. Open <a href="https://analytics.google.com/analytics/web/#/p467346442/realtime/overview" target="_blank" rel="noopener noreferrer" className="underline">GA4 Real-time Reports</a></li>
          <li>3. Check "Events in the last 30 minutes" section</li>
          <li>4. Look for: analysis_start, analysis_complete, sign_up, purchase, feature_usage</li>
          <li>5. Open browser console (F12) to see data layer pushes</li>
        </ol>
      </div>
    </div>
  );
};

export default AnalyticsTestComponent;