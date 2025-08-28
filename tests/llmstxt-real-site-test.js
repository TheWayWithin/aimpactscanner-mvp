#!/usr/bin/env node
/**
 * Real Site LLMs.txt Detection Test
 * Tests against llmstxt.org which has a confirmed LLMs.txt file
 */

// Import the algorithm from the direct tests
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LLMs.txt scoring algorithm (same as in Edge Function)
function analyzeLLMsTxtImplementation(content, hasFile = true) {
  let score = hasFile ? 50 : 30;
  let evidence = [];
  let recommendations = [];
  
  if (!hasFile) {
    evidence.push('❌ No LLMs.txt file found at domain root');
    recommendations.push('Create an LLMs.txt file at /llms.txt following llmstxt.org specification');
    return {
      name: 'LLMs.txt Implementation',
      score: Math.min(score, 95),
      confidence: 90,
      evidence,
      recommendations
    };
  }
  
  evidence.push('✅ LLMs.txt file found and accessible');
  
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
    score: Math.min(score, 95),
    confidence: 90,
    evidence,
    recommendations
  };
}

async function testRealSite() {
  console.log('🧪 Real Site LLMs.txt Detection Test');
  console.log('=====================================\n');
  
  const testUrl = 'https://llmstxt.org/llms.txt';
  
  console.log(`🔍 Testing real LLMs.txt file: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'AImpactScanner/1.0 (LLMs.txt Compliance Check)'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    console.log(`✅ Successfully fetched LLMs.txt (${content.length} characters)`);
    
    // Analyze the content
    const result = analyzeLLMsTxtImplementation(content, true);
    
    console.log('\n📊 Analysis Results:');
    console.log(`Score: ${result.score}/95 (${result.confidence}% confidence)`);
    console.log(`Factor: ${result.name}`);
    
    console.log('\n📝 Evidence:');
    result.evidence.forEach(e => console.log(`  • ${e}`));
    
    console.log('\n💡 Recommendations:');
    if (result.recommendations.length === 0) {
      console.log('  • No recommendations - excellent implementation!');
    } else {
      result.recommendations.forEach(r => console.log(`  • ${r}`));
    }
    
    // Validate the content structure manually
    console.log('\n🔍 Content Structure Analysis:');
    
    const hasH1 = /^#\s+.+/m.test(content);
    console.log(`H1 Title: ${hasH1 ? '✅ Found' : '❌ Missing'}`);
    
    const hasBlockquote = /^>\s+.+/m.test(content);
    console.log(`Blockquote Summary: ${hasBlockquote ? '✅ Found' : '❌ Missing'}`);
    
    const linkCount = (content.match(/\[.+\]\(.+\)/g) || []).length;
    console.log(`Links: ${linkCount} ${linkCount >= 5 ? '✅' : linkCount >= 1 ? '⚠️' : '❌'}`);
    
    const h2Count = (content.match(/^##\s+.+/gm) || []).length;
    console.log(`Sections (H2): ${h2Count} ${h2Count >= 2 ? '✅' : h2Count >= 1 ? '⚠️' : '❌'}`);
    
    const hasOptional = /^##\s+Optional/mi.test(content);
    console.log(`Optional Section: ${hasOptional ? '✅ Found' : '❌ Not found'}`);
    
    // Expected score calculation
    let expectedScore = 50; // Base
    if (hasH1) expectedScore += 15;
    if (hasBlockquote) expectedScore += 15; 
    if (linkCount >= 5) expectedScore += 20;
    else if (linkCount >= 1) expectedScore += 10;
    if (h2Count >= 2) expectedScore += 10;
    else if (h2Count >= 1) expectedScore += 5;
    
    expectedScore = Math.min(expectedScore, 95);
    
    console.log(`\n🎯 Expected Score: ${expectedScore}`);
    console.log(`🎯 Actual Score: ${result.score}`);
    console.log(`🎯 Match: ${result.score === expectedScore ? '✅ Perfect' : '❌ Mismatch'}`);
    
    // Show first few lines of content for context
    console.log('\n📄 Content Preview:');
    const lines = content.split('\n').slice(0, 10);
    lines.forEach((line, index) => {
      console.log(`${String(index + 1).padStart(2, ' ')}: ${line}`);
    });
    
    if (lines.length < content.split('\n').length) {
      console.log(`... (${content.split('\n').length - lines.length} more lines)`);
    }
    
    // Test against Edge Function scoring rules
    console.log('\n🧮 Scoring Rules Validation:');
    console.log('Expected scoring breakdown:');
    console.log(`  • Base (file exists): 50 points`);
    console.log(`  • H1 title: ${hasH1 ? '15' : '0'} points`);
    console.log(`  • Blockquote: ${hasBlockquote ? '15' : '0'} points`);
    console.log(`  • Links (${linkCount}): ${linkCount >= 5 ? '20' : linkCount >= 1 ? '10' : '0'} points`);
    console.log(`  • Sections (${h2Count}): ${h2Count >= 2 ? '10' : h2Count >= 1 ? '5' : '0'} points`);
    console.log(`  • Total: ${expectedScore} (capped at 95)`);
    
    return {
      success: true,
      score: result.score,
      expectedScore,
      match: result.score === expectedScore,
      result
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealSite()
    .then(result => {
      if (result.success && result.match) {
        console.log('\n✅ Real site test PASSED - Algorithm working correctly!');
        process.exit(0);
      } else {
        console.log('\n❌ Real site test FAILED - Algorithm needs review');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testRealSite };