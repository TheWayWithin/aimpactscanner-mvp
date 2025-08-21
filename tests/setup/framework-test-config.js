// Framework Alignment Test Configuration
// Supports comprehensive MASTERY-AI Framework v3.1.1 validation

export const FRAMEWORK_CONFIG = {
  // Official MASTERY-AI Framework v3.1.1 specification
  version: 'v3.1.1',
  totalFactors: 148,
  
  // Pillar definitions with exact weights and names
  pillars: {
    'AI Response Optimization & Citation': {
      weight: 23.8,
      abbreviation: 'AI',
      factorCount: 3,
      description: 'Content structured for AI citation and response generation'
    },
    'Authority & Trust Signals': {
      weight: 17.9,
      abbreviation: 'A', 
      factorCount: 2,
      description: 'Credibility indicators and trust-building elements'
    },
    'Machine Readability & Technical Infrastructure': {
      weight: 14.6,
      abbreviation: 'M',
      factorCount: 3,
      description: 'Technical optimization for crawling and processing'
    },
    'Semantic Content Quality': {
      weight: 13.9,
      abbreviation: 'S',
      factorCount: 2,
      description: 'Content structure and semantic meaning'
    },
    'Engagement & User Experience': {
      weight: 10.9,
      abbreviation: 'E',
      factorCount: 1,
      description: 'User interaction and experience optimization'
    },
    'Topical Expertise & Experience': {
      weight: 8.9,
      abbreviation: 'T',
      factorCount: 1,
      description: 'Subject matter expertise demonstration'
    },
    'Reference Networks & Citations': {
      weight: 5.9,
      abbreviation: 'R',
      factorCount: 0,
      description: 'Citation patterns and reference quality'
    },
    'Yield Optimization & Freshness': {
      weight: 4.1,
      abbreviation: 'Y',
      factorCount: 0,
      description: 'Content freshness and performance optimization'
    }
  },
  
  // Phase A factors (currently implemented)
  phaseAFactors: [
    {
      id: 'AI.1.1',
      name: 'Citation-Worthy Content Structure',
      pillar: 'AI Response Optimization & Citation',
      description: 'Content formatted for AI citation with clear facts and sources'
    },
    {
      id: 'AI.1.2', 
      name: 'Source Authority Signals',
      pillar: 'AI Response Optimization & Citation',
      description: 'Credibility markers that AI systems recognize and trust'
    },
    {
      id: 'AI.1.5',
      name: 'Evidence Chunking for RAG Optimization',
      pillar: 'AI Response Optimization & Citation', 
      description: 'Content structured for retrieval-augmented generation'
    },
    {
      id: 'A.3.1',
      name: 'Transparency & Disclosure Standards',
      pillar: 'Authority & Trust Signals',
      description: 'Clear disclosure of affiliations, sponsorships, and conflicts'
    },
    {
      id: 'A.3.2',
      name: 'Contact Information & Accessibility', 
      pillar: 'Authority & Trust Signals',
      description: 'Multiple contact methods and accessibility compliance'
    },
    {
      id: 'M.1.4',
      name: 'Security and Access Control',
      pillar: 'Machine Readability & Technical Infrastructure',
      description: 'HTTPS implementation and security best practices'
    },
    {
      id: 'M.2.1',
      name: 'Title Tag Optimization',
      pillar: 'Machine Readability & Technical Infrastructure',
      description: 'Optimized title tags for search engines and AI'
    },
    {
      id: 'M.2.2',
      name: 'Meta Description Quality',
      pillar: 'Machine Readability & Technical Infrastructure',
      description: 'Compelling and informative meta descriptions'
    },
    {
      id: 'S.2.2',
      name: 'Heading Structure & Hierarchy',
      pillar: 'Semantic Content Quality',
      description: 'Logical heading hierarchy for content structure'
    },
    {
      id: 'E.1.1',
      name: 'Page Load Speed Optimization',
      pillar: 'Engagement & User Experience',
      description: 'Fast loading times for better user experience'
    }
  ],
  
  // Scoring methodology
  scoring: {
    method: 'Evidence-based',
    range: { min: 30, max: 95 },
    description: 'Realistic scoring ranges reflecting real-world optimization levels'
  },
  
  // Test URLs for validation
  testUrls: {
    highScore: 'https://anthropic.com',
    lowScore: 'https://example.com',
    aism: 'https://aisearchmastery.com',
    baseline: 'https://freecalchub.com'
  },
  
  // Expected score ranges for test URLs
  expectedScores: {
    'anthropic.com': { min: 60, max: 75 },
    'example.com': { min: 25, max: 35 },
    'aisearchmastery.com': { min: 70, max: 85 },
    'freecalchub.com': { min: 65, max: 80 }
  }
};

// Test validation functions
export const FRAMEWORK_VALIDATORS = {
  // Validate pillar structure
  validatePillars: (pillars) => {
    const expectedPillars = Object.keys(FRAMEWORK_CONFIG.pillars);
    const actualPillars = Object.keys(pillars);
    
    // Check all expected pillars are present
    for (const pillar of expectedPillars) {
      if (!actualPillars.includes(pillar)) {
        throw new Error(`Missing pillar: ${pillar}`);
      }
    }
    
    // Check pillar weights
    for (const [pillarName, pillarData] of Object.entries(pillars)) {
      const expected = FRAMEWORK_CONFIG.pillars[pillarName];
      if (!expected) {
        throw new Error(`Unexpected pillar: ${pillarName}`);
      }
      
      if (Math.abs(pillarData.weight - expected.weight) > 0.1) {
        throw new Error(`Incorrect weight for ${pillarName}: expected ${expected.weight}, got ${pillarData.weight}`);
      }
    }
    
    return true;
  },
  
  // Validate factor names
  validateFactors: (factors) => {
    const expectedFactorNames = FRAMEWORK_CONFIG.phaseAFactors.map(f => f.name);
    
    for (const factor of factors) {
      if (!expectedFactorNames.includes(factor.name)) {
        console.warn(`Unexpected factor name: ${factor.name}`);
      }
    }
    
    return true;
  },
  
  // Validate scoring methodology
  validateScoring: (score, url = null) => {
    if (score < FRAMEWORK_CONFIG.scoring.range.min || score > FRAMEWORK_CONFIG.scoring.range.max) {
      console.warn(`Score ${score} outside expected range ${FRAMEWORK_CONFIG.scoring.range.min}-${FRAMEWORK_CONFIG.scoring.range.max}`);
    }
    
    // Check against expected ranges for known URLs
    if (url) {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const expected = FRAMEWORK_CONFIG.expectedScores[domain];
      
      if (expected && (score < expected.min || score > expected.max)) {
        console.warn(`Score ${score} for ${domain} outside expected range ${expected.min}-${expected.max}`);
      }
    }
    
    return true;
  },
  
  // Validate framework version references
  validateVersion: (content) => {
    if (!content.includes(FRAMEWORK_CONFIG.version)) {
      throw new Error(`Framework version ${FRAMEWORK_CONFIG.version} not found in content`);
    }
    
    if (!content.includes(FRAMEWORK_CONFIG.totalFactors.toString())) {
      console.warn(`Total factor count ${FRAMEWORK_CONFIG.totalFactors} not prominently displayed`);
    }
    
    return true;
  }
};

// Test data generators
export const FRAMEWORK_TEST_DATA = {
  // Generate test analysis data
  generateTestAnalysis: (url = 'https://example.com') => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const expectedRange = FRAMEWORK_CONFIG.expectedScores[domain] || { min: 40, max: 70 };
    const score = Math.floor(Math.random() * (expectedRange.max - expectedRange.min) + expectedRange.min);
    
    return {
      url,
      overall_score: score,
      created_at: new Date().toISOString(),
      pillars: Object.fromEntries(
        Object.entries(FRAMEWORK_CONFIG.pillars).map(([name, config]) => [
          name.toLowerCase().replace(/[^a-z]/g, '_'),
          {
            score: score + Math.floor(Math.random() * 10 - 5), // ±5 variation
            weight: config.weight,
            factors: config.factorCount,
            name: name
          }
        ])
      ),
      factors: FRAMEWORK_CONFIG.phaseAFactors.map(factor => ({
        name: factor.name,
        score: score + Math.floor(Math.random() * 20 - 10), // ±10 variation
        pillar: factor.pillar,
        evidence: [`Test evidence for ${factor.name}`],
        recommendations: [`Test recommendation for ${factor.name}`]
      }))
    };
  },
  
  // Generate temp email for testing
  generateTempEmail: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `framework-test-${timestamp}-${random}@10minutemail.com`;
  }
};

// Performance benchmarks
export const FRAMEWORK_PERFORMANCE = {
  analysisTimeout: 60000, // 60 seconds max for complete analysis
  progressTimeout: 30000, // 30 seconds for progress display
  resultsTimeout: 15000,  // 15 seconds for results rendering
  
  expectedTiming: {
    authentication: 5000,  // 5 seconds
    analysisStart: 2000,   // 2 seconds
    progressDisplay: 1000, // 1 second
    resultsLoad: 10000     // 10 seconds
  }
};

export default {
  FRAMEWORK_CONFIG,
  FRAMEWORK_VALIDATORS,
  FRAMEWORK_TEST_DATA,
  FRAMEWORK_PERFORMANCE
};