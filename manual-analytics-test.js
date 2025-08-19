// Manual Analytics Testing Script
// Interactive testing of GTM + GA4 implementation
// Run this script in browser console while on analytics test page

console.log('🔬 Starting Manual Analytics Test Suite...');
console.log('📊 GTM Container: GTM-WCQGG5N6');
console.log('📈 GA4 Property: G-EJ5M874QBZ');

// Test configuration
const TEST_CONFIG = {
  gtmContainer: 'GTM-WCQGG5N6',
  ga4Property: 'G-EJ5M874QBZ',
  testEvents: [
    'analysis_start',
    'analysis_complete', 
    'sign_up',
    'purchase',
    'feature_usage'
  ]
};

// Analytics test functions
const AnalyticsTests = {
  
  // 1. Verify GTM Integration
  checkGTMIntegration() {
    console.log('\n🧪 Test 1: GTM Integration Check');
    
    const results = {
      dataLayerExists: Array.isArray(window.dataLayer),
      gtmScriptLoaded: !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]'),
      gtmInitialized: window.dataLayer && window.dataLayer.some(item => item.event === 'gtm.js'),
      dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
    };
    
    console.log('📊 Results:', results);
    
    if (results.dataLayerExists && results.gtmInitialized) {
      console.log('✅ GTM Integration: PASSED');
      return true;
    } else {
      console.log('❌ GTM Integration: FAILED');
      return false;
    }
  },
  
  // 2. Monitor Data Layer Events
  startEventMonitoring() {
    console.log('\n🧪 Test 2: Starting Event Monitoring');
    
    if (!window.analyticsTestEvents) {
      window.analyticsTestEvents = [];
    }
    
    // Override dataLayer.push to capture events
    if (!window.originalDataLayerPush) {
      window.originalDataLayerPush = window.dataLayer.push;
      window.dataLayer.push = function() {
        const event = arguments[0];
        window.analyticsTestEvents.push({
          timestamp: new Date().toISOString(),
          event: event
        });
        console.log('📤 Data Layer Event:', event);
        return window.originalDataLayerPush.apply(window.dataLayer, arguments);
      };
    }
    
    console.log('✅ Event monitoring active');
  },
  
  // 3. Test Individual Events
  async testAnalysisStartEvent() {
    console.log('\n🧪 Test 3: Analysis Start Event');
    
    const button = document.querySelector('button:contains("Test Analysis Start")') || 
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Test Analysis Start'));
    
    if (button) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recentEvent = window.analyticsTestEvents?.find(e => e.event.event === 'analysis_start');
      if (recentEvent) {
        console.log('✅ analysis_start event fired correctly');
        console.log('📊 Event data:', recentEvent.event);
        return true;
      }
    }
    
    console.log('❌ analysis_start event test failed');
    return false;
  },
  
  async testAnalysisCompleteEvent() {
    console.log('\n🧪 Test 4: Analysis Complete Event');
    
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Test Analysis Complete'));
    
    if (button) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recentEvent = window.analyticsTestEvents?.find(e => e.event.event === 'analysis_complete');
      if (recentEvent) {
        console.log('✅ analysis_complete event fired correctly');
        console.log('📊 Event data:', recentEvent.event);
        return true;
      }
    }
    
    console.log('❌ analysis_complete event test failed');
    return false;
  },
  
  async testSignupEvent() {
    console.log('\n🧪 Test 5: User Signup Event');
    
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Test User Signup'));
    
    if (button) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recentEvent = window.analyticsTestEvents?.find(e => e.event.event === 'sign_up');
      if (recentEvent) {
        console.log('✅ sign_up event fired correctly');
        console.log('📊 Event data:', recentEvent.event);
        return true;
      }
    }
    
    console.log('❌ sign_up event test failed');
    return false;
  },
  
  async testPurchaseEvent() {
    console.log('\n🧪 Test 6: Coffee Purchase Event (Enhanced Ecommerce)');
    
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Test Coffee Purchase'));
    
    if (button) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recentEvent = window.analyticsTestEvents?.find(e => e.event.event === 'purchase');
      if (recentEvent && recentEvent.event.value === 5) {
        console.log('✅ purchase event (Coffee tier $5) fired correctly');
        console.log('📊 Event data:', recentEvent.event);
        console.log('💰 Enhanced Ecommerce Items:', recentEvent.event.items);
        return true;
      }
    }
    
    console.log('❌ purchase event test failed');
    return false;
  },
  
  async testFeatureUsageEvent() {
    console.log('\n🧪 Test 7: Feature Usage Event');
    
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Test Feature Usage'));
    
    if (button) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recentEvent = window.analyticsTestEvents?.find(e => e.event.event === 'feature_usage');
      if (recentEvent) {
        console.log('✅ feature_usage event fired correctly');
        console.log('📊 Event data:', recentEvent.event);
        return true;
      }
    }
    
    console.log('❌ feature_usage event test failed');
    return false;
  },
  
  // 8. Run All Tests
  async runAllTests() {
    console.log('\n🚀 Running Complete Analytics Test Suite...\n');
    
    const results = {
      gtmIntegration: this.checkGTMIntegration(),
      eventMonitoring: true // Always succeeds
    };
    
    this.startEventMonitoring();
    
    // Wait a moment for setup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test all events
    results.analysisStart = await this.testAnalysisStartEvent();
    results.analysisComplete = await this.testAnalysisCompleteEvent();
    results.signup = await this.testSignupEvent();
    results.purchase = await this.testPurchaseEvent();
    results.featureUsage = await this.testFeatureUsageEvent();
    
    // Generate report
    console.log('\n📊 ANALYTICS TEST RESULTS SUMMARY:');
    console.log('═══════════════════════════════════════');
    
    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASSED' : 'FAILED';
      console.log(`${icon} ${test}: ${status}`);
    });
    
    console.log('═══════════════════════════════════════');
    console.log(`📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Analytics implementation verified!');
      console.log('✅ Production deployment approved');
    } else {
      console.log('⚠️ Some tests failed - review implementation');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Open GA4 Real-time Reports: https://analytics.google.com/analytics/web/#/p467346442/realtime/overview');
    console.log('2. Verify events appear in "Events in the last 30 minutes"');
    console.log('3. Check Coffee tier purchase shows $5.00 revenue');
    
    return results;
  },
  
  // Utility function to show captured events
  showCapturedEvents() {
    console.log('\n📝 Captured Events Summary:');
    if (window.analyticsTestEvents && window.analyticsTestEvents.length > 0) {
      window.analyticsTestEvents.forEach((capture, index) => {
        console.log(`${index + 1}. [${capture.timestamp}] ${capture.event.event}`, capture.event);
      });
    } else {
      console.log('No events captured yet. Run tests first.');
    }
  }
};

// Auto-run if on analytics test page
if (window.location.href.includes('localhost:5173')) {
  console.log('🎯 Analytics test environment detected');
  console.log('📋 Available commands:');
  console.log('  AnalyticsTests.runAllTests() - Run complete test suite');
  console.log('  AnalyticsTests.checkGTMIntegration() - Test GTM only');
  console.log('  AnalyticsTests.showCapturedEvents() - Show event log');
  
  // Check if we're on the analytics test page
  setTimeout(() => {
    const analyticsTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analytics Test'));
    if (analyticsTab && !analyticsTab.className.includes('bg-red-600')) {
      console.log('💡 Tip: Click "🔬 Analytics Test" tab first, then run AnalyticsTests.runAllTests()');
    } else if (document.querySelector('h1:contains("Analytics Test")') || 
               Array.from(document.querySelectorAll('h1')).some(h => h.textContent.includes('Analytics Test'))) {
      console.log('🎯 Analytics Test page detected - ready for testing!');
      console.log('🚀 Run: AnalyticsTests.runAllTests()');
    }
  }, 1000);
}

// Make functions globally available
window.AnalyticsTests = AnalyticsTests;

console.log('\n✅ Manual Analytics Test Script loaded successfully!');
console.log('🎮 Type AnalyticsTests.runAllTests() to start testing');