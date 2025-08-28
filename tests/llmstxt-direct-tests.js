#!/usr/bin/env node
/**
 * Direct LLMs.txt Detection Tests
 * Tests the LLMs.txt detection logic independently of Edge Function
 * This validates the core logic from analyzeLLMsTxtImplementation
 */

// LLMs.txt scoring algorithm extracted from the Edge Function
function analyzeLLMsTxtImplementation(content, hasFile = true) {
  let score = hasFile ? 50 : 30; // Base score
  let evidence = [];
  let recommendations = [];
  
  if (!hasFile) {
    evidence.push('❌ No LLMs.txt file found at domain root');
    recommendations.push('Create an LLMs.txt file at /llms.txt following llmstxt.org specification');
    recommendations.push('Include your site title, summary, and links to key content');
    recommendations.push('This helps AI systems better understand and access your content');
    return {
      name: 'LLMs.txt Implementation',
      score: Math.min(score, 95),
      confidence: 90,
      evidence,
      recommendations
    };
  }
  
  evidence.push('✅ LLMs.txt file found and accessible');
  
  // Check file size (should be reasonable, not empty)
  if (content.length < 50) {
    evidence.push('File appears to be empty or minimal');
    recommendations.push('Add meaningful content to your LLMs.txt file');
    return {
      name: 'LLMs.txt Implementation',
      score: Math.min(score, 95),
      confidence: 90,
      evidence,
      recommendations
    };
  }
  
  evidence.push(`File size: ${content.length} characters`);
  
  // Check for required Markdown structure elements
  const hasH1 = /^#\s+.+/m.test(content);
  const hasBlockquote = /^>\s+.+/m.test(content);
  const hasLinks = /\[.+\]\(.+\)/g.test(content);
  const linkCount = (content.match(/\[.+\]\(.+\)/g) || []).length;
  
  // Score based on compliance
  if (hasH1) {
    score += 15;
    evidence.push('✅ Has H1 title (required)');
  } else {
    recommendations.push('Add an H1 title at the beginning of your LLMs.txt');
  }
  
  if (hasBlockquote) {
    score += 15;
    evidence.push('✅ Has blockquote summary (recommended)');
  } else {
    recommendations.push('Add a blockquote summary after your H1 title');
  }
  
  if (hasLinks && linkCount >= 5) {
    score += 20;
    evidence.push(`✅ Contains ${linkCount} content links`);
  } else if (hasLinks) {
    score += 10;
    evidence.push(`Contains ${linkCount} content links`);
    recommendations.push('Add more links to your important content (aim for 10+)');
  } else {
    recommendations.push('Add links to your most important pages with descriptions');
  }
  
  // Check for section headers (H2s)
  const h2Count = (content.match(/^##\s+.+/gm) || []).length;
  if (h2Count >= 2) {
    score += 10;
    evidence.push(`✅ Well-organized with ${h2Count} sections`);
  } else if (h2Count === 1) {
    score += 5;
    evidence.push('Has some section organization');
    recommendations.push('Consider organizing content into multiple H2 sections');
  } else {
    recommendations.push('Organize your content with H2 section headers');
  }
  
  // Check for optional section marker
  if (/^##\s+Optional/mi.test(content)) {
    evidence.push('✅ Includes optional resources section');
  }
  
  return {
    name: 'LLMs.txt Implementation',
    score: Math.min(score, 95), // Cap at 95
    confidence: 90,
    evidence,
    recommendations
  };
}

// Test URLs with known LLMs.txt status
const TEST_URLS = [
  'https://anthropic.com/llms.txt',
  'https://openai.com/llms.txt', 
  'https://github.com/llms.txt',
  'https://example.com/llms.txt', // Should not exist
  'https://httpbin.org/llms.txt'  // Should not exist
];

async function testLLMsTxtDirectly() {
  console.log('🧪 Direct LLMs.txt Detection Tests');
  console.log('===================================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const url of TEST_URLS) {
    console.log(`🔍 Testing: ${url}`);
    totalTests++;
    
    try {
      // Attempt to fetch the LLMs.txt file
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AImpactScanner/1.0 (LLMs.txt Compliance Check)'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const content = await response.text();
        console.log(`✅ Found LLMs.txt (${content.length} chars)`);
        
        // Test the scoring algorithm
        const result = analyzeLLMsTxtImplementation(content, true);
        
        console.log(`📊 Score: ${result.score}/95`);
        console.log(`📝 Evidence: ${result.evidence.length} items`);
        console.log(`💡 Recommendations: ${result.recommendations.length} items`);
        
        // Print detailed analysis
        console.log('   Evidence:');
        result.evidence.forEach(e => console.log(`     - ${e}`));
        
        if (result.recommendations.length > 0) {
          console.log('   Recommendations:');
          result.recommendations.slice(0, 3).forEach(r => console.log(`     - ${r}`));
        }
        
        // Validate scoring rules
        if (result.score >= 50 && result.score <= 95) {
          passedTests++;
          console.log(`✅ Scoring validation passed`);
        } else {
          failedTests.push({
            test: url,
            issue: `Invalid score: ${result.score} (expected 50-95)`,
            result
          });
          console.log(`❌ Scoring validation failed: ${result.score}`);
        }
        
      } else if (response.status === 404) {
        console.log(`❌ No LLMs.txt found (404)`);
        
        // Test the no-file scenario
        const result = analyzeLLMsTxtImplementation('', false);
        
        console.log(`📊 Score: ${result.score}/95`);
        console.log(`📝 Evidence: ${result.evidence.length} items`);
        console.log(`💡 Recommendations: ${result.recommendations.length} items`);
        
        // Validate base scoring
        if (result.score === 30) {
          passedTests++;
          console.log(`✅ Base scoring validation passed`);
        } else {
          failedTests.push({
            test: url,
            issue: `Invalid base score: ${result.score} (expected 30)`,
            result
          });
          console.log(`❌ Base scoring validation failed: ${result.score}`);
        }
        
      } else {
        console.log(`⚠️  HTTP ${response.status}: ${response.statusText}`);
        
        // Test error handling (should still return base score)
        const result = analyzeLLMsTxtImplementation('', false);
        
        if (result.score === 30) {
          passedTests++;
          console.log(`✅ Error handling validation passed`);
        } else {
          failedTests.push({
            test: url,
            issue: `Invalid error score: ${result.score} (expected 30)`,
            result
          });
          console.log(`❌ Error handling validation failed: ${result.score}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      
      // Test network error handling
      const result = analyzeLLMsTxtImplementation('', false);
      
      if (result.score === 30) {
        passedTests++;
        console.log(`✅ Network error handling validation passed`);
      } else {
        failedTests.push({
          test: url,
          issue: `Invalid network error score: ${result.score} (expected 30)`,
          result
        });
        console.log(`❌ Network error handling validation failed: ${result.score}`);
      }
    }
    
    console.log(''); // Spacer
  }
  
  // Test scoring algorithm with mock data
  console.log('📋 Algorithm Validation with Mock Content');
  console.log('------------------------------------------');
  
  const testCases = [
    {
      name: 'Perfect LLMs.txt',
      content: `# My Website

> This is a comprehensive summary of our website content.

## Main Content

- [About Us](/about) - Learn about our company
- [Products](/products) - Our main product offerings  
- [Services](/services) - Professional services we provide
- [Blog](/blog) - Latest news and insights
- [Documentation](/docs) - Technical documentation
- [Support](/support) - Customer support resources

## Resources  

- [API Documentation](/api) - Developer resources
- [Knowledge Base](/kb) - Help articles

## Optional

- [Privacy Policy](/privacy) - Data protection information`,
      expectedScore: 95, // 50 + 15 + 15 + 20 + 10 = 110, capped at 95
      expectedMin: 90,
      expectedMax: 95
    },
    {
      name: 'Good LLMs.txt', 
      content: `# Website Title

> Brief summary here.

- [Page 1](/page1) - Description
- [Page 2](/page2) - Description  
- [Page 3](/page3) - Description`,
      expectedMin: 75, // 50 + 15 + 15 + 10 = 90
      expectedMax: 95
    },
    {
      name: 'Basic LLMs.txt',
      content: `# Just a title

Some basic content without proper structure.`,
      expectedMin: 65, // 50 + 15 = 65
      expectedMax: 75
    },
    {
      name: 'Minimal LLMs.txt',
      content: `Basic content without title or structure, but with enough characters to be considered meaningful content for testing purposes.`,
      expectedMin: 50, // Just base file score (50) since content > 50 chars
      expectedMax: 60
    },
    {
      name: 'Empty LLMs.txt',
      content: '',
      expectedMin: 30, // Should be treated as no meaningful content
      expectedMax: 30
    }
  ];
  
  testCases.forEach((testCase, index) => {
    totalTests++;
    console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
    
    const hasFile = testCase.content.length >= 50;
    const result = analyzeLLMsTxtImplementation(testCase.content, hasFile);
    
    console.log(`📊 Score: ${result.score}/95`);
    console.log(`📝 Evidence (${result.evidence.length}):`, result.evidence.slice(0, 2).join('; '));
    
    if (result.score >= testCase.expectedMin && result.score <= testCase.expectedMax) {
      passedTests++;
      console.log(`✅ Score within expected range: ${testCase.expectedMin}-${testCase.expectedMax}`);
    } else {
      failedTests.push({
        test: testCase.name,
        issue: `Score ${result.score} not in range ${testCase.expectedMin}-${testCase.expectedMax}`,
        result
      });
      console.log(`❌ Score outside expected range: ${testCase.expectedMin}-${testCase.expectedMax}`);
    }
  });
  
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
      console.log(`${index + 1}. ${failure.test}: ${failure.issue}`);
    });
  }
  
  console.log('\n✨ Testing Complete!');
  
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
  testLLMsTxtDirectly()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testLLMsTxtDirectly };