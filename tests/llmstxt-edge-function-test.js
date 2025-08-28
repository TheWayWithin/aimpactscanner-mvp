#!/usr/bin/env node
/**
 * LLMs.txt Edge Function Integration Test
 * Tests the LLMs.txt detection in the actual Edge Function
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.log('Need: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction() {
  console.log('🧪 LLMs.txt Edge Function Integration Test');
  console.log('==========================================\n');
  
  // Test cases with expected LLMs.txt results
  const testCases = [
    {
      name: 'Site WITH LLMs.txt',
      url: 'https://llmstxt.org',
      expectedScoreMin: 80,
      expectedScoreMax: 95,
      shouldHaveFile: true
    },
    {
      name: 'Site WITHOUT LLMs.txt',
      url: 'https://example.com',
      expectedScoreMin: 30,
      expectedScoreMax: 30,
      shouldHaveFile: false
    }
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    totalTests++;
    
    try {
      // Create test parameters
      const testParams = {
        url: testCase.url,
        userId: randomUUID(),
        analysisId: randomUUID()
      };
      
      console.log(`   Analysis ID: ${testParams.analysisId}`);
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-page', {
        body: testParams
      });
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from Edge Function');
      }
      
      console.log(`✅ Edge Function call successful`);
      console.log(`   Factors returned: ${data.factors?.length || 0}`);
      
      // Find the LLMs.txt factor
      const llmsTxtFactor = data.factors?.find(factor => 
        factor.name === 'LLMs.txt Implementation' || 
        factor.name.includes('LLMs.txt')
      );
      
      if (!llmsTxtFactor) {
        // Check if it might be under a different name
        console.log('   Available factors:');
        data.factors?.forEach(f => console.log(`     - ${f.name}`));
        
        throw new Error('LLMs.txt factor not found in results');
      }
      
      console.log(`📊 LLMs.txt Factor Results:`);
      console.log(`   Score: ${llmsTxtFactor.score}/95`);
      console.log(`   Confidence: ${llmsTxtFactor.confidence}%`);
      console.log(`   Evidence items: ${llmsTxtFactor.evidence?.length || 0}`);
      console.log(`   Recommendations: ${llmsTxtFactor.recommendations?.length || 0}`);
      
      // Validate score range
      if (llmsTxtFactor.score >= testCase.expectedScoreMin && 
          llmsTxtFactor.score <= testCase.expectedScoreMax) {
        console.log(`✅ Score validation passed: ${llmsTxtFactor.score} in range ${testCase.expectedScoreMin}-${testCase.expectedScoreMax}`);
        passedTests++;
      } else {
        console.log(`❌ Score validation failed: ${llmsTxtFactor.score} not in range ${testCase.expectedScoreMin}-${testCase.expectedScoreMax}`);
        failedTests.push({
          test: testCase.name,
          issue: `Score ${llmsTxtFactor.score} outside expected range`,
          expected: `${testCase.expectedScoreMin}-${testCase.expectedScoreMax}`,
          actual: llmsTxtFactor.score
        });
      }
      
      // Show evidence for debugging
      if (llmsTxtFactor.evidence?.length) {
        console.log(`   Key evidence:`);
        llmsTxtFactor.evidence.slice(0, 3).forEach(e => 
          console.log(`     • ${e}`)
        );
      }
      
      // Show recommendations if any
      if (llmsTxtFactor.recommendations?.length) {
        console.log(`   Sample recommendations:`);
        llmsTxtFactor.recommendations.slice(0, 2).forEach(r => 
          console.log(`     • ${r}`)
        );
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      failedTests.push({
        test: testCase.name,
        issue: error.message
      });
    }
    
    console.log(''); // Spacer
  }
  
  // Summary
  console.log('🏁 Test Results Summary');
  console.log('=======================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test}: ${failure.issue}`);
      if (failure.expected && failure.actual) {
        console.log(`   Expected: ${failure.expected}, Got: ${failure.actual}`);
      }
    });
  }
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests.length,
    successRate: (passedTests / totalTests) * 100,
    failures: failedTests
  };
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEdgeFunction()
    .then(results => {
      if (results.passed === results.total) {
        console.log('\n✅ All Edge Function tests PASSED!');
        console.log('LLMs.txt detection is working correctly in the Edge Function.');
        process.exit(0);
      } else {
        console.log('\n❌ Some Edge Function tests FAILED!');
        console.log('LLMs.txt detection may have issues in the Edge Function.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testEdgeFunction };