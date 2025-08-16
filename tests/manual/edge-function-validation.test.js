// Manual Edge Function Validation Test
// Tests the real Edge Function with actual data flow

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunctionIntegration() {
  console.log('🧪 Starting Edge Function Integration Test');
  console.log('📍 Testing with anthropic.com for reliable results');
  
  const testUrl = 'https://anthropic.com';
  const analysisId = `test-${Date.now()}`;
  const userId = 'test-user-123';
  
  try {
    console.log('🚀 Invoking Edge Function...');
    console.log(`   URL: ${testUrl}`);
    console.log(`   Analysis ID: ${analysisId}`);
    
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('analyze-page', {
      body: {
        url: testUrl,
        analysisId,
        userId
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`⏱️  Analysis completed in ${duration} seconds`);
    
    if (error) {
      console.error('❌ Edge Function Error:', error);
      return false;
    }
    
    if (!data) {
      console.error('❌ No data returned from Edge Function');
      return false;
    }
    
    console.log('✅ Edge Function Response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Overall Score: ${data.overall_score}`);
    console.log(`   Factors Count: ${data.factors_count}`);
    console.log(`   Processing Time: ${data.processing_time_ms}ms`);
    
    // Validate response structure
    if (!data.success) {
      console.error('❌ Edge Function reported failure:', data.error);
      return false;
    }
    
    if (!data.factors || !Array.isArray(data.factors)) {
      console.error('❌ Invalid factors data structure');
      return false;
    }
    
    if (data.factors.length === 0) {
      console.error('❌ No factors returned');
      return false;
    }
    
    console.log('📊 Factor Analysis Results:');
    data.factors.forEach((factor, index) => {
      console.log(`   ${index + 1}. ${factor.name}: ${factor.score}`);
      console.log(`      Evidence: ${factor.evidence?.length || 0} items`);
      console.log(`      Recommendations: ${factor.recommendations?.length || 0} items`);
    });
    
    // Test sessionStorage simulation for landing page flow
    console.log('💾 Testing sessionStorage data structure...');
    const analysisData = {
      results: {
        overall_score: data.overall_score,
        factors: data.factors,
        url: testUrl,
        created_at: new Date().toISOString()
      }
    };
    
    // Simulate what PreviewResults component expects
    const sessionData = JSON.stringify(analysisData);
    console.log(`📦 Session data size: ${Math.round(sessionData.length / 1024)} KB`);
    
    // Validate data can be parsed correctly
    try {
      const parsedData = JSON.parse(sessionData);
      if (parsedData.results.overall_score === data.overall_score) {
        console.log('✅ Session data structure valid');
      } else {
        console.error('❌ Session data structure mismatch');
        return false;
      }
    } catch (parseError) {
      console.error('❌ Session data parsing failed:', parseError);
      return false;
    }
    
    console.log('🎉 Edge Function Integration Test PASSED');
    return true;
    
  } catch (error) {
    console.error('❌ Test Exception:', error);
    return false;
  }
}

async function testProgressTracking() {
  console.log('🔄 Testing Progress Tracking...');
  
  const analysisId = `progress-test-${Date.now()}`;
  let progressUpdates = [];
  
  // Set up real-time subscription
  const subscription = supabase
    .channel(`analysis_progress_${analysisId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'analysis_progress',
      filter: `analysis_id=eq.${analysisId}`
    }, (payload) => {
      console.log('📊 Progress Update:', payload.new);
      progressUpdates.push(payload.new);
    })
    .subscribe();
  
  // Wait for subscription to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start analysis
  const { data, error } = await supabase.functions.invoke('analyze-page', {
    body: {
      url: 'https://anthropic.com',
      analysisId,
      userId: 'test-progress-user'
    }
  });
  
  // Wait for analysis to complete
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // Clean up subscription
  subscription.unsubscribe();
  
  console.log(`📈 Progress Updates Received: ${progressUpdates.length}`);
  
  if (progressUpdates.length > 0) {
    console.log('📊 Progress Summary:');
    progressUpdates.forEach((update, index) => {
      console.log(`   ${index + 1}. ${update.progress_percent}% - ${update.message}`);
    });
    console.log('✅ Progress Tracking Test PASSED');
    return true;
  } else {
    console.error('❌ No progress updates received');
    return false;
  }
}

async function testFactorValidation() {
  console.log('🔍 Testing Factor Validation...');
  
  const { data, error } = await supabase.functions.invoke('analyze-page', {
    body: {
      url: 'https://anthropic.com',
      analysisId: `validation-test-${Date.now()}`,
      userId: 'test-validation-user'
    }
  });
  
  if (error || !data.success) {
    console.error('❌ Factor validation test failed:', error || data.error);
    return false;
  }
  
  console.log('🧬 Validating Framework Compliance...');
  
  const expectedFactors = [
    'Citation-Worthy Content Structure',
    'Source Authority Signals', 
    'Evidence Chunking for RAG Optimization',
    'Transparency & Disclosure Standards',
    'Contact Information & Accessibility',
    'Security and Access Control',
    'Title Tag Optimization',
    'Meta Description Quality',
    'Heading Structure & Hierarchy',
    'Content Depth and Comprehensiveness',
    'Page Load Speed Optimization'
  ];
  
  const receivedFactors = data.factors.map(f => f.name);
  
  console.log('📋 Expected vs Received Factors:');
  expectedFactors.forEach(expected => {
    const found = receivedFactors.includes(expected);
    console.log(`   ${found ? '✅' : '❌'} ${expected}`);
  });
  
  // Check score ranges (should be 30-95)
  const scoreValidation = data.factors.every(factor => {
    const validScore = factor.score >= 30 && factor.score <= 95;
    if (!validScore) {
      console.error(`❌ Invalid score for ${factor.name}: ${factor.score}`);
    }
    return validScore;
  });
  
  if (scoreValidation) {
    console.log('✅ All factor scores within valid range (30-95)');
  }
  
  // Check evidence and recommendations
  const contentValidation = data.factors.every(factor => {
    const hasEvidence = factor.evidence && factor.evidence.length > 0;
    const hasRecommendations = factor.recommendations && factor.recommendations.length > 0;
    
    if (!hasEvidence) {
      console.error(`❌ No evidence for ${factor.name}`);
    }
    if (!hasRecommendations) {
      console.error(`❌ No recommendations for ${factor.name}`);
    }
    
    return hasEvidence && hasRecommendations;
  });
  
  if (contentValidation) {
    console.log('✅ All factors have evidence and recommendations');
  }
  
  const allValid = scoreValidation && contentValidation && 
                   receivedFactors.length === expectedFactors.length;
  
  if (allValid) {
    console.log('✅ Factor Validation Test PASSED');
  } else {
    console.error('❌ Factor Validation Test FAILED');
  }
  
  return allValid;
}

// Run all tests
async function runAllTests() {
  console.log('🎯 Priority 1 User Journey - Real Data Flow Validation');
  console.log('=' * 60);
  
  const tests = [
    { name: 'Edge Function Integration', test: testEdgeFunctionIntegration },
    { name: 'Progress Tracking', test: testProgressTracking },
    { name: 'Factor Validation', test: testFactorValidation }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n🧪 Running ${name} Test...`);
    const passed = await test();
    results.push({ name, passed });
    console.log(`${passed ? '✅' : '❌'} ${name} Test ${passed ? 'PASSED' : 'FAILED'}\n`);
  }
  
  console.log('📊 Test Summary:');
  console.log('=' * 40);
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Execute tests if run directly
if (import.meta.main) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testEdgeFunctionIntegration, testProgressTracking, testFactorValidation };