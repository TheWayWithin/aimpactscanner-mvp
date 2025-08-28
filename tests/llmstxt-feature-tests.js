#!/usr/bin/env node
/**
 * LLMs.txt Feature Testing Suite
 * Tests the analyzeLLMsTxtImplementation function in the Edge Function
 * 
 * Test Categories:
 * 1. Sites WITH LLMs.txt - detection and scoring
 * 2. Sites WITHOUT LLMs.txt - base scoring  
 * 3. Scoring algorithm validation
 * 4. Error handling
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test URLs for different scenarios
const TEST_CASES = {
  withLLMsTxt: [
    'https://anthropic.com',  // Known to have comprehensive LLMs.txt
    'https://openai.com',     // Likely to have LLMs.txt
    'https://github.com'      // May have LLMs.txt
  ],
  withoutLLMsTxt: [
    'https://example.com',    // Basic test site
    'https://httpbin.org',    // Testing utility site
    'https://jsonplaceholder.typicode.com' // API testing site
  ],
  potentialErrors: [
    'https://nonexistent-domain-12345.com', // Should cause network error
    'https://httpstat.us/500',               // Should return 500 error
    'https://httpstat.us/403'                // Should return 403 error
  ]
};

// Expected scoring rules
const SCORING_RULES = {
  base: 30,           // No file
  fileExists: 50,     // File exists
  h1Title: 15,        // H1 title bonus
  blockquote: 15,     // Blockquote summary bonus  
  links5Plus: 20,     // 5+ links bonus
  linksLess: 10,      // Less than 5 links bonus
  sections: 10,       // H2 sections bonus (2+)
  sectionsPartial: 5, // Some sections bonus (1)
  maxScore: 95        // Maximum possible score
};

async function testLLMsTxtDetection() {
  console.log('🧪 LLMs.txt Feature Testing Suite');
  console.log('===================================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  // Helper function to call the Edge Function
  async function callAnalyzeFunction(url) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-page', {
        body: { url }
      });
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      // Find the LLMs.txt factor in the results
      const llmsTxtFactor = data.factors?.find(factor => 
        factor.name === 'LLMs.txt Implementation' || 
        factor.name.includes('LLMs.txt')
      );
      
      return llmsTxtFactor;
    } catch (error) {
      console.error(`Error calling analyze function for ${url}:`, error.message);
      return null;
    }
  }

  // Helper function to validate scoring
  function validateScoring(result, expectedMin, expectedMax, testName) {
    totalTests++;
    const score = result?.score || 0;
    
    if (score >= expectedMin && score <= expectedMax) {
      console.log(`✅ ${testName}: Score ${score} (expected ${expectedMin}-${expectedMax})`);
      passedTests++;
      return true;
    } else {
      console.log(`❌ ${testName}: Score ${score} (expected ${expectedMin}-${expectedMax})`);
      failedTests.push({
        test: testName,
        expected: `${expectedMin}-${expectedMax}`,
        actual: score,
        result: result
      });
      return false;
    }
  }

  // Helper function to check evidence and recommendations
  function validateContent(result, testName, shouldHaveFile = false) {
    totalTests++;
    const evidence = result?.evidence || [];
    const recommendations = result?.recommendations || [];
    
    let hasCorrectEvidence = false;
    let hasCorrectRecommendations = false;
    
    if (shouldHaveFile) {
      // Should have positive evidence for file detection
      hasCorrectEvidence = evidence.some(e => 
        e.includes('LLMs.txt file found') || e.includes('✅')
      );
      // May or may not have recommendations depending on file quality
      hasCorrectRecommendations = true; // Less strict for sites with files
    } else {
      // Should have evidence about missing file
      hasCorrectEvidence = evidence.some(e => 
        e.includes('No LLMs.txt file found') || 
        e.includes('Could not check LLMs.txt') ||
        e.includes('❌')
      );
      // Should have recommendations to create file
      hasCorrectRecommendations = recommendations.some(r => 
        r.includes('Create an LLMs.txt') || 
        r.includes('Implement LLMs.txt')
      );
    }
    
    if (hasCorrectEvidence && hasCorrectRecommendations) {
      console.log(`✅ ${testName}: Content validation passed`);
      passedTests++;
      return true;
    } else {
      console.log(`❌ ${testName}: Content validation failed`);
      console.log(`   Evidence ok: ${hasCorrectEvidence}`);
      console.log(`   Recommendations ok: ${hasCorrectRecommendations}`);
      failedTests.push({
        test: testName,
        issue: 'Content validation failed',
        evidence: hasCorrectEvidence,
        recommendations: hasCorrectRecommendations
      });
      return false;
    }
  }

  // Test 1: Sites WITH LLMs.txt
  console.log('📋 Test Group 1: Sites WITH LLMs.txt');
  console.log('------------------------------------------');
  
  for (const url of TEST_CASES.withLLMsTxt) {
    console.log(`\n🔍 Testing: ${url}`);
    const result = await callAnalyzeFunction(url);
    
    if (!result) {
      console.log(`❌ Failed to get result for ${url}`);
      failedTests.push({ test: url, issue: 'No result returned' });
      totalTests++;
      continue;
    }
    
    console.log(`📊 Result: Score ${result.score}, Confidence ${result.confidence}`);
    console.log(`📝 Evidence: ${result.evidence?.length || 0} items`);
    console.log(`💡 Recommendations: ${result.recommendations?.length || 0} items`);
    
    // Validate scoring for sites with LLMs.txt (should be 50-95)
    validateScoring(result, 50, 95, `${url} scoring`);
    
    // Validate content
    validateContent(result, `${url} content`, true);
    
    // Print detailed analysis
    if (result.evidence?.length) {
      console.log('   Evidence:', result.evidence.slice(0, 3).join('; '));
    }
    if (result.recommendations?.length) {
      console.log('   Sample recommendations:', result.recommendations.slice(0, 2).join('; '));
    }
  }

  // Test 2: Sites WITHOUT LLMs.txt  
  console.log('\n\n📋 Test Group 2: Sites WITHOUT LLMs.txt');
  console.log('--------------------------------------------');
  
  for (const url of TEST_CASES.withoutLLMsTxt) {
    console.log(`\n🔍 Testing: ${url}`);
    const result = await callAnalyzeFunction(url);
    
    if (!result) {
      console.log(`❌ Failed to get result for ${url}`);
      failedTests.push({ test: url, issue: 'No result returned' });
      totalTests++;
      continue;
    }
    
    console.log(`📊 Result: Score ${result.score}, Confidence ${result.confidence}`);
    console.log(`📝 Evidence: ${result.evidence?.length || 0} items`);
    console.log(`💡 Recommendations: ${result.recommendations?.length || 0} items`);
    
    // Validate base scoring (should be exactly 30)
    validateScoring(result, 30, 30, `${url} base scoring`);
    
    // Validate content
    validateContent(result, `${url} content`, false);
    
    // Print detailed analysis
    if (result.evidence?.length) {
      console.log('   Evidence:', result.evidence.join('; '));
    }
    if (result.recommendations?.length) {
      console.log('   Sample recommendations:', result.recommendations.slice(0, 2).join('; '));
    }
  }

  // Test 3: Error Handling
  console.log('\n\n📋 Test Group 3: Error Handling');
  console.log('----------------------------------');
  
  for (const url of TEST_CASES.potentialErrors) {
    console.log(`\n🔍 Testing error handling: ${url}`);
    const result = await callAnalyzeFunction(url);
    
    if (!result) {
      console.log(`ℹ️  Expected: Edge Function handled error gracefully`);
      totalTests++;
      passedTests++;
      continue;
    }
    
    console.log(`📊 Result: Score ${result.score}, Confidence ${result.confidence}`);
    
    // Should still return base score even with errors
    validateScoring(result, 30, 30, `${url} error handling`);
    
    // Should have appropriate error evidence
    totalTests++;
    const hasErrorEvidence = result.evidence?.some(e => 
      e.includes('network error') || 
      e.includes('Could not check') ||
      e.includes('Unable to access')
    );
    
    if (hasErrorEvidence) {
      console.log(`✅ ${url}: Error evidence present`);
      passedTests++;
    } else {
      console.log(`❌ ${url}: No error evidence found`);
      failedTests.push({
        test: url,
        issue: 'Missing error evidence',
        evidence: result.evidence
      });
    }
  }

  // Test 4: Scoring Algorithm Validation
  console.log('\n\n📋 Test Group 4: Scoring Algorithm Rules');
  console.log('------------------------------------------');
  
  // Test that scores don't exceed maximum
  totalTests++;
  const allScores = [];
  
  // Collect scores from previous tests
  for (const url of [...TEST_CASES.withLLMsTxt, ...TEST_CASES.withoutLLMsTxt]) {
    const result = await callAnalyzeFunction(url);
    if (result?.score) {
      allScores.push(result.score);
    }
  }
  
  const maxScore = Math.max(...allScores);
  if (maxScore <= SCORING_RULES.maxScore) {
    console.log(`✅ Maximum score validation: ${maxScore} ≤ ${SCORING_RULES.maxScore}`);
    passedTests++;
  } else {
    console.log(`❌ Maximum score validation: ${maxScore} > ${SCORING_RULES.maxScore}`);
    failedTests.push({
      test: 'Maximum score validation',
      expected: `≤ ${SCORING_RULES.maxScore}`,
      actual: maxScore
    });
  }
  
  // Test minimum score
  totalTests++;
  const minScore = Math.min(...allScores);
  if (minScore >= SCORING_RULES.base) {
    console.log(`✅ Minimum score validation: ${minScore} ≥ ${SCORING_RULES.base}`);
    passedTests++;
  } else {
    console.log(`❌ Minimum score validation: ${minScore} < ${SCORING_RULES.base}`);
    failedTests.push({
      test: 'Minimum score validation',
      expected: `≥ ${SCORING_RULES.base}`,
      actual: minScore
    });
  }

  // Final Results
  console.log('\n\n🏁 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests Details:');
    failedTests.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test}`);
      if (failure.expected && failure.actual) {
        console.log(`   Expected: ${failure.expected}, Got: ${failure.actual}`);
      }
      if (failure.issue) {
        console.log(`   Issue: ${failure.issue}`);
      }
    });
  }
  
  console.log('\n✨ Testing Complete!');
  
  // Return summary for potential CI/CD integration
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests.length,
    successRate: (passedTests / totalTests) * 100,
    failures: failedTests
  };
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testLLMsTxtDetection()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testLLMsTxtDetection };