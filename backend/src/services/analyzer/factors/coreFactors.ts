/**
 * Core Factor Analysis Functions
 * 
 * MASTERY-AI Framework v3.1.1 - Factors 1-15
 * Ported from Supabase Edge Function to Node.js
 */

import { FactorResult } from '../types';

/**
 * Factor 1: HTTPS Security (M.1.1)
 */
export function analyzeHTTPS(url: string, requestedUrl?: string): FactorResult {
  const startTime = Date.now();
  // url is the FINAL URL after redirects were followed (AIS-ISS-2): a site
  // that 301s http -> https serves over HTTPS and must score accordingly,
  // however the user typed the URL.
  const isHTTPS = url.startsWith('https://');
  const score = isHTTPS ? 100 : 0;
  const redirectedToHTTPS = isHTTPS && !!requestedUrl && requestedUrl.startsWith('http://');

  const evidence = [
    isHTTPS ? 'Site uses HTTPS protocol' : 'Site uses HTTP protocol',
    isHTTPS ? 'Secure connection established' : 'Insecure connection detected'
  ];
  if (redirectedToHTTPS) {
    evidence.push(`HTTP input redirected to HTTPS (${requestedUrl} → ${url}) - HTTPS is enforced`);
  }

  return {
    factor_id: 'M.1.1',
    factor_name: 'HTTPS Security',
    pillar: 'M',
    phase: 'instant',
    score,
    confidence: 100,
    weight: 0.73,
    evidence,
    recommendations: isHTTPS ? [] : [
      'Enable HTTPS for improved security and SEO',
      'Configure SSL/TLS certificate',
      'Implement HTTP to HTTPS redirects'
    ],
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 2: Title Optimization (M.2.1)
 */
export function analyzeTitle(title: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  if (!title) {
    evidence.push('No title tag found');
    recommendations.push('Add a descriptive title tag');
    recommendations.push('Keep title between 50-60 characters');
  } else {
    const length = title.length;
    evidence.push(`Title: "${title}"`);
    evidence.push(`Length: ${length} characters`);
    
    if (length >= 50 && length <= 60) {
      score += 40;
      evidence.push('Title length is optimal');
    } else if (length >= 40 && length <= 70) {
      score += 35;
      evidence.push('Title length is good');
    } else if (length >= 30 && length <= 80) {
      score += 25;
      evidence.push('Title length is acceptable');
      if (length < 50) recommendations.push('Consider making title longer');
      if (length > 60) recommendations.push('Consider shortening title');
    } else {
      score += 15;
      evidence.push('Title length needs optimization');
      if (length < 30) recommendations.push('Title is too short');
      if (length > 80) recommendations.push('Title is too long');
    }
    
    const wordCount = title.split(/\s+/).length;
    if (wordCount >= 3 && wordCount <= 12) {
      score += 30;
      evidence.push('Good descriptive title');
    } else {
      score += 15;
      recommendations.push('Improve title descriptiveness');
    }
    
    const uniqueWords = new Set(title.toLowerCase().split(/\s+/));
    if (uniqueWords.size / wordCount > 0.7) {
      score += 30;
      evidence.push('Good keyword diversity');
    } else {
      score += 15;
      recommendations.push('Reduce keyword repetition');
    }
  }
  
  return {
    factor_id: 'M.2.1',
    factor_name: 'Title Optimization',
    pillar: 'M',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 95,
    weight: 0.80,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 3: Meta Description (M.2.2)
 */
export function analyzeMetaDescription(metaDescription: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  if (!metaDescription || metaDescription.length === 0) {
    evidence.push('No meta description found');
    recommendations.push('Add compelling meta description');
    recommendations.push('Include primary keywords naturally');
    recommendations.push('Keep between 150-160 characters');
    recommendations.push('Include call-to-action');
  } else {
    const length = metaDescription.length;
    evidence.push(`Meta description: "${metaDescription}"`);
    evidence.push(`Length: ${length} characters`);
    
    if (length >= 150 && length <= 160) {
      score += 40;
      evidence.push('Meta description length is optimal');
    } else if (length >= 120 && length <= 180) {
      score += 25;
      if (length < 150) {
        recommendations.push('Expand meta description to 150-160 characters');
      } else {
        recommendations.push('Shorten meta description to 150-160 characters');
      }
    } else {
      score += 10;
      recommendations.push('Optimize meta description length to 150-160 characters');
    }
    
    const ctaWords = ['learn', 'discover', 'find', 'get', 'download', 'start', 'explore', 'see'];
    const hasCtaWords = ctaWords.some(word => metaDescription.toLowerCase().includes(word));
    if (hasCtaWords) {
      score += 30;
      evidence.push('Contains compelling call-to-action language');
    } else {
      recommendations.push('Add call-to-action words');
    }
    
    const hasNaturalFlow = /\b(and|or|the|of|in|to|for|with|by)\b/i.test(metaDescription);
    if (hasNaturalFlow) {
      score += 30;
      evidence.push('Natural language flow detected');
    } else {
      recommendations.push('Use natural language and avoid keyword stuffing');
    }
  }
  
  return {
    factor_id: 'M.2.2',
    factor_name: 'Meta Description',
    pillar: 'M',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 100,
    weight: 0.80,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 4: Author Information (A.2.1)
 */
export function analyzeAuthor(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const hasAuthor = /author|by\s+[A-Z][a-z]+|written\s+by/i.test(content);
  const authorCredentials = /phd|md|professor|dr\.|certified|licensed/i.test(content);
  
  if (hasAuthor) {
    score += 50;
    evidence.push('Author information present');
    if (authorCredentials) {
      score += 30;
      evidence.push('Author credentials indicated');
    } else {
      recommendations.push('Add author credentials and qualifications');
    }
  } else {
    score = 20;
    recommendations.push('Include clear author attribution');
    recommendations.push('Add author bio and credentials');
  }
  
  const professionalTerms = /expertise|experience|specializ|certified|published|research|study/gi;
  const professionalMatches = (content.match(professionalTerms) || []).length;
  
  if (professionalMatches >= 3) {
    score += 20;
    evidence.push('Multiple professional authority indicators');
  } else if (professionalMatches >= 1) {
    score += 10;
    evidence.push('Some professional indicators present');
  }
  
  return {
    factor_id: 'A.2.1',
    factor_name: 'Author Information',
    pillar: 'A',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 90,
    weight: 1.2,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 5: Contact Information (A.3.2)
 */
export function analyzeContact(_url: string, content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const contactTerms = /contact|email|phone|address|reach\s+us|get\s+in\s+touch/i;
  
  const hasEmail = emailPattern.test(content);
  const hasPhone = phonePattern.test(content);
  const hasContactSection = contactTerms.test(content);
  
  if (hasEmail) {
    score += 35;
    evidence.push('Email address found');
  }
  if (hasPhone) {
    score += 30;
    evidence.push('Phone number found');
  }
  if (hasContactSection) {
    score += 25;
    evidence.push('Contact section present');
  }
  
  if (!hasEmail && !hasPhone && !hasContactSection) {
    score = 10;
    recommendations.push('Add clear contact information');
    recommendations.push('Include email and phone');
    recommendations.push('Create dedicated contact section');
  } else if (score < 50) {
    if (!hasEmail) recommendations.push('Add email contact');
    if (!hasPhone) recommendations.push('Consider adding phone number');
    if (!hasContactSection) recommendations.push('Create dedicated contact section');
  }
  
  const addressTerms = /address|location|street|city|state|zip|postal/i;
  const hasAddress = addressTerms.test(content);
  if (hasAddress) {
    score += 10;
    evidence.push('Address information indicated');
  }
  
  return {
    factor_id: 'A.3.2',
    factor_name: 'Contact Information',
    pillar: 'A',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 95,
    weight: 1.193,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 6: Heading Hierarchy (S.2.2)
 */
export function analyzeHeadings(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const h1Tags = (content.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || []).map(h => h.replace(/<[^>]*>/g, '').trim());
  const h2Tags = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Tags = (content.match(/<h3[^>]*>/gi) || []).length;
  
  evidence.push(`H1 tags: ${h1Tags.length}`);
  evidence.push(`H2 tags: ${h2Tags}`);
  evidence.push(`H3 tags: ${h3Tags}`);
  
  if (h1Tags.length === 1) {
    score += 30;
    evidence.push('Proper H1 structure (exactly one H1)');
    const h1 = h1Tags[0];
    if (h1.length >= 20 && h1.length <= 70) {
      score += 20;
      evidence.push('H1 length is appropriate');
    } else {
      recommendations.push('Optimize H1 length to 20-70 characters');
    }
  } else if (h1Tags.length === 0) {
    evidence.push('No H1 tag found');
    recommendations.push('Add exactly one H1 tag');
  } else {
    evidence.push(`Multiple H1 tags found: ${h1Tags.length}`);
    recommendations.push('Use only one H1 tag per page');
    score += 10;
  }
  
  if (h2Tags >= 2) {
    score += 30;
    evidence.push('Good H2 structure for content organization');
  } else if (h2Tags >= 1) {
    score += 15;
    recommendations.push('Add more H2 headings to improve structure');
  } else {
    recommendations.push('Add H2 headings to organize content');
  }
  
  if (h3Tags >= 1) {
    score += 20;
    evidence.push('H3 tags present for detailed hierarchy');
  } else {
    recommendations.push('Consider adding H3 tags for detailed organization');
  }
  
  return {
    factor_id: 'S.2.2',
    factor_name: 'Heading Hierarchy',
    pillar: 'S',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 95,
    weight: 0.76,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 7: Structured Data Detection (M.3.1)
 */
export function analyzeStructuredData(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  
  if (jsonLdMatches && jsonLdMatches.length > 0) {
    score += 50;
    evidence.push(`Found ${jsonLdMatches.length} JSON-LD blocks`);
    
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        const parsed = JSON.parse(jsonContent);
        const schemas = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const schema of schemas) {
          if (schema['@type']) {
            evidence.push(`Schema type: ${schema['@type']}`);
            score += 10;
          }
        }
      } catch {
        // Invalid JSON
      }
    }
    score = Math.min(score, 100);
  } else {
    score = 20;
    recommendations.push('Add JSON-LD structured data');
    recommendations.push('Implement Schema.org markup');
    recommendations.push('Use Article or BlogPosting schema');
  }
  
  if (content.includes('itemscope') || content.includes('itemtype')) {
    score += 20;
    evidence.push('Microdata markup detected');
  }
  
  if (content.includes('typeof=') || content.includes('property=')) {
    score += 10;
    evidence.push('RDFa markup detected');
  }
  
  if (score < 50) {
    recommendations.push('Implement comprehensive structured data');
  }
  
  return {
    factor_id: 'M.3.1',
    factor_name: 'Structured Data Detection',
    pillar: 'M',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 90,
    weight: 1.0,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 8: FAQ Schema Analysis (AI.2.3)
 */
export function analyzeFAQ(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const faqTerms = /frequently\s+asked\s+questions?|faq|q\s*&\s*a|questions?\s+and\s+answers?/i;
  const hasFAQSection = faqTerms.test(content);
  
  if (hasFAQSection) {
    score += 30;
    evidence.push('FAQ section detected');
  }
  
  const questionMatches = content.match(/\?[^?]{10,}/g) || [];
  if (questionMatches.length >= 3) {
    score += 30;
    evidence.push(`Found ${questionMatches.length} questions`);
  } else if (questionMatches.length >= 1) {
    score += 15;
    evidence.push(`Found ${questionMatches.length} question(s)`);
    recommendations.push('Add more Q&A content');
  }
  
  const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  let hasFAQSchema = false;
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        const parsed = JSON.parse(jsonContent);
        const schemas = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const schema of schemas) {
          if (schema['@type'] === 'FAQPage') {
            hasFAQSchema = true;
            score += 40;
            evidence.push('FAQPage schema implemented');
            
            if (schema.mainEntity && Array.isArray(schema.mainEntity)) {
              evidence.push(`${schema.mainEntity.length} FAQ items in schema`);
            }
          }
        }
      } catch {
        // Invalid JSON
      }
    }
  }
  
  if (!hasFAQSchema) {
    recommendations.push('Implement FAQPage schema markup');
  }
  
  if (score < 30) {
    score = 20;
    recommendations.push('Add FAQ section with common questions');
    recommendations.push('Structure Q&A content clearly');
  }
  
  return {
    factor_id: 'AI.2.3',
    factor_name: 'FAQ Schema Analysis',
    pillar: 'AI',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 85,
    weight: 1.0,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 9: Image Alt Text Analysis (M.2.3)
 */
export function analyzeImages(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const imageTags = content.match(/<img[^>]*>/gi) || [];
  const imageCount = imageTags.length;
  
  if (imageCount === 0) {
    score = 50;
    evidence.push('No images found on page');
    recommendations.push('Consider adding relevant images');
  } else {
    evidence.push(`Total images: ${imageCount}`);
    
    let imagesWithAlt = 0;
    let imagesWithGoodAlt = 0;
    
    for (const img of imageTags) {
      const altMatch = img.match(/alt=["']([^"']*)/i);
      if (altMatch && altMatch[1]) {
        imagesWithAlt++;
        if (altMatch[1].length > 5 && !altMatch[1].match(/^(image|photo|picture|img)/i)) {
          imagesWithGoodAlt++;
        }
      }
    }
    
    const altCoverage = (imagesWithAlt / imageCount) * 100;
    evidence.push(`Images with alt text: ${imagesWithAlt}/${imageCount} (${altCoverage.toFixed(0)}%)`);
    
    if (altCoverage === 100) {
      score += 50;
      evidence.push('All images have alt text');
    } else if (altCoverage >= 80) {
      score += 40;
      evidence.push('Good alt text coverage');
      recommendations.push('Add alt text to remaining images');
    } else if (altCoverage >= 50) {
      score += 25;
      evidence.push('Moderate alt text coverage');
      recommendations.push('Improve alt text coverage');
    } else {
      score += 10;
      evidence.push('Poor alt text coverage');
      recommendations.push('Add descriptive alt text to images');
    }
    
    const qualityCoverage = (imagesWithGoodAlt / imageCount) * 100;
    if (qualityCoverage >= 80) {
      score += 50;
      evidence.push('High-quality descriptive alt text');
    } else if (qualityCoverage >= 50) {
      score += 25;
      recommendations.push('Improve alt text descriptions');
    } else {
      score += 10;
      recommendations.push('Make alt text more descriptive');
    }
  }
  
  return {
    factor_id: 'M.2.3',
    factor_name: 'Image Alt Text Analysis',
    pillar: 'M',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 95,
    weight: 1.0,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 10: Content Depth (S.3.1)
 */
export function analyzeWordCount(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 2).length;
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  evidence.push(`Word count: ${wordCount}`);
  evidence.push(`Sentences: ${sentences.length}`);
  
  if (wordCount >= 1500) {
    score += 50;
    evidence.push('Exceptionally comprehensive content (1500+ words)');
  } else if (wordCount >= 1000) {
    score += 45;
    evidence.push('Comprehensive content length (1000+ words)');
  } else if (wordCount >= 500) {
    score += 35;
    evidence.push('Substantial content length (500+ words)');
  } else if (wordCount >= 300) {
    score += 25;
    evidence.push('Adequate content length (300+ words)');
    recommendations.push('Consider expanding content for better depth');
  } else if (wordCount >= 100) {
    score += 15;
    evidence.push('Minimal content length');
    recommendations.push('Increase content to 500+ words');
  } else {
    score += 5;
    evidence.push('Very limited content');
    recommendations.push('Add substantial content (500+ words)');
  }
  
  const paragraphs = (content.match(/<p[^>]*>/gi) || []).length;
  const lists = (content.match(/<(ul|ol)[^>]*>/gi) || []).length;
  
  if (paragraphs >= 5) {
    score += 30;
    evidence.push('Well-structured paragraph organization');
  } else if (paragraphs >= 3) {
    score += 15;
    recommendations.push('Add more paragraphs for better flow');
  }
  
  if (lists >= 2) {
    score += 20;
    evidence.push('Lists used for content structure');
  } else if (lists >= 1) {
    score += 10;
    evidence.push('Some structured lists present');
  }
  
  return {
    factor_id: 'S.3.1',
    factor_name: 'Content Depth',
    pillar: 'S',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 80,
    weight: 0.74,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 11: Citation-Worthy Content (AI.1.1)
 */
export function analyzeCitationWorthyContent(content: string, _title: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const factualClaims = sentences.filter(s => 
    /\b(shows?|proves?|demonstrates?|indicates?|reveals?|studies?|research|data|evidence|according to|based on)\b/i.test(s)
  ).length;
  
  const wordCount = textContent.split(' ').filter(w => w.length > 2).length;
  const factDensity = wordCount > 0 ? factualClaims / Math.ceil(wordCount / 100) : 0;
  
  evidence.push(`Word count: ${wordCount}`);
  evidence.push(`Factual claims identified: ${factualClaims}`);
  evidence.push(`Fact density: ${factDensity.toFixed(2)} claims per 100 words`);
  
  if (factDensity >= 1.5) {
    score += 45;
    evidence.push('Exceptional fact density for AI citation');
  } else if (factDensity >= 1.0) {
    score += 40;
    evidence.push('Excellent fact density for AI citation');
  } else if (factDensity >= 0.7) {
    score += 30;
    evidence.push('Good fact density');
    recommendations.push('Add more verifiable claims and supporting evidence');
  } else if (factDensity >= 0.5) {
    score += 25;
    evidence.push('Adequate fact density');
    recommendations.push('Increase factual content with verifiable claims');
  } else if (factDensity >= 0.2) {
    score += 15;
    evidence.push('Limited factual content');
    recommendations.push('Increase factual content with verifiable claims');
    recommendations.push('Add supporting evidence and data points');
  } else {
    score += 5;
    evidence.push('Very low fact density');
    recommendations.push('Add substantial factual content with verifiable claims');
    recommendations.push('Include supporting evidence and data points');
  }
  
  const headings = (content.match(/<h[1-6][^>]*>/gi) || []).length;
  if (headings >= 3) {
    score += 30;
    evidence.push('Clear hierarchical structure with multiple headings');
  } else if (headings >= 1) {
    score += 15;
    recommendations.push('Add more headings (H2, H3) for better content structure');
  } else {
    recommendations.push('Implement clear heading hierarchy for content organization');
  }
  
  const citations = (content.match(/<a[^>]*href[^>]*>/gi) || []).length;
  if (citations >= 3) {
    score += 30;
    evidence.push('Multiple citation anchors found');
  } else if (citations >= 1) {
    score += 15;
    evidence.push('Some citation anchors present');
    recommendations.push('Add more links to authoritative sources');
  } else {
    recommendations.push('Include links to credible sources and references');
  }
  
  return {
    factor_id: 'AI.1.1',
    factor_name: 'Citation-Worthy Content Structure',
    pillar: 'AI',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 85,
    weight: 1.058,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 12: Source Authority Signals (AI.1.2)
 */
export function analyzeSourceAuthoritySignals(content: string, url: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const hasAuthor = /author|by\s+[A-Z][a-z]+|written\s+by/i.test(content);
  const authorCredentials = /phd|md|professor|dr\.|certified|licensed/i.test(content);
  
  if (hasAuthor) {
    score += 25;
    evidence.push('Author information present');
    if (authorCredentials) {
      score += 15;
      evidence.push('Author credentials indicated');
    } else {
      recommendations.push('Add author credentials and qualifications');
    }
  } else {
    recommendations.push('Include clear author attribution and bio');
  }
  
  const domainParts = new URL(url).hostname.split('.');
  const isEduOrg = domainParts.some(part => ['edu', 'org', 'gov'].includes(part));
  if (isEduOrg) {
    score += 20;
    evidence.push('Institutional domain detected (.edu/.org/.gov)');
  }
  
  const professionalTerms = /expertise|experience|specializ|certified|published|research|study/gi;
  const professionalMatches = (content.match(professionalTerms) || []).length;
  
  if (professionalMatches >= 3) {
    score += 20;
    evidence.push('Multiple professional authority indicators');
  } else if (professionalMatches >= 1) {
    score += 10;
    evidence.push('Some professional indicators present');
  }
  
  const references = /reference|citation|source|bibliography/i.test(content);
  if (references) {
    score += 20;
    evidence.push('References or bibliography section found');
  } else {
    recommendations.push('Add references section to support claims');
  }
  
  if (score < 15) {
    score = Math.max(score, 15);
    recommendations.push('Establish clear expertise and authority indicators');
    recommendations.push('Include professional background and credentials');
  }
  
  return {
    factor_id: 'AI.1.2',
    factor_name: 'Source Authority Signals',
    pillar: 'AI',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 80,
    weight: 1.058,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 13: Evidence Chunking for RAG (AI.1.5)
 */
export function analyzeEvidenceChunking(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  evidence.push(`Content paragraphs: ${paragraphs.length}`);
  evidence.push(`Sentences: ${sentences.length}`);
  
  let optimalChunks = 0;
  paragraphs.forEach(para => {
    const wordCount = para.split(' ').filter(w => w.length > 2).length;
    if (wordCount >= 150 && wordCount <= 300) {
      optimalChunks++;
    }
  });
  
  if (optimalChunks >= 3) {
    score += 40;
    evidence.push('Multiple paragraphs with optimal chunk size (150-300 words)');
  } else if (optimalChunks >= 1) {
    score += 20;
    evidence.push('Some optimal-sized content chunks present');
    recommendations.push('Organize more content into 150-300 word chunks');
  } else {
    recommendations.push('Structure content in 150-300 word chunks for AI processing');
  }
  
  const headings = (content.match(/<h[1-6][^>]*>/gi) || []).length;
  const lists = (content.match(/<(ul|ol)[^>]*>/gi) || []).length;
  
  if (headings >= 3 && lists >= 1) {
    score += 30;
    evidence.push('Clear semantic boundaries with headings and lists');
  } else if (headings >= 2) {
    score += 15;
    recommendations.push('Add more structural elements (lists, sections)');
  } else {
    recommendations.push('Add headings and lists for better content segmentation');
  }
  
  const internalLinks = (content.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [])
    .filter(link => link.includes('href="/') || !link.includes('http')).length;
  
  if (internalLinks >= 3) {
    score += 30;
    evidence.push('Good cross-referencing with internal links');
  } else if (internalLinks >= 1) {
    score += 15;
    recommendations.push('Add more internal links for content connections');
  } else {
    recommendations.push('Include internal links to connect related content chunks');
  }
  
  return {
    factor_id: 'AI.1.5',
    factor_name: 'Evidence Chunking for RAG Optimization',
    pillar: 'AI',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 75,
    weight: 1.058,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 14: Transparency & Disclosure (A.3.1)
 */
export function analyzeTransparencyDisclosure(content: string, _url: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
  const hasDisclosure = disclosureTerms.test(content);
  
  if (hasDisclosure) {
    score += 30;
    evidence.push('Disclosure statements found');
  } else {
    recommendations.push('Add disclosure statements for transparency');
    recommendations.push('Include conflict of interest information if applicable');
  }
  
  const fundingTerms = /funded\s+by|grant|supported\s+by|sponsored\s+by/i;
  const hasFunding = fundingTerms.test(content);
  
  if (hasFunding) {
    score += 25;
    evidence.push('Funding source transparency present');
  } else {
    recommendations.push('Include funding source information if applicable');
  }
  
  const methodTerms = /method|process|approach|criteria|how\s+we|our\s+process/i;
  const hasMethod = methodTerms.test(content);
  
  if (hasMethod) {
    score += 25;
    evidence.push('Methodology or process information included');
  } else {
    recommendations.push('Explain your methodology and process');
  }
  
  const updatedTerms = /updated|revised|last\s+modified|published/i;
  const hasUpdated = updatedTerms.test(content);

  if (hasUpdated) {
    score += 20;
    evidence.push('Update information provided');
  } else {
    recommendations.push('Include publication and update dates');
  }

  if (score === 0) {
    score = 15;
    recommendations.push('Implement basic transparency standards');
  } else if (score < 30) {
    score += 10;
  }
  
  return {
    factor_id: 'A.3.1',
    factor_name: 'Transparency & Disclosure Standards',
    pillar: 'A',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 75,
    weight: 1.193,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Factor 15: Page Load Speed (E.1.1)
 */
export function analyzePageLoadSpeed(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  const pageSize = content.length;
  const imageTags = (content.match(/<img[^>]*>/gi) || []).length;
  const scriptTags = (content.match(/<script[^>]*>/gi) || []).length;
  const styleTags = (content.match(/<style[^>]*>/gi) || []).length;
  const cssLinks = (content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
  
  evidence.push(`Page content size: ${Math.round(pageSize / 1024)} KB`);
  evidence.push(`Images: ${imageTags}`);
  evidence.push(`Scripts: ${scriptTags}`);
  evidence.push(`CSS files: ${cssLinks + styleTags}`);
  
  if (pageSize < 50000) {
    score += 45;
    evidence.push('Exceptionally lightweight page for optimal loading');
  } else if (pageSize < 100000) {
    score += 40;
    evidence.push('Lightweight page size for fast loading');
  } else if (pageSize < 250000) {
    score += 30;
    evidence.push('Reasonable page size');
  } else if (pageSize < 500000) {
    score += 20;
    evidence.push('Moderate page size');
    recommendations.push('Consider optimizing images and content for faster loading');
  } else if (pageSize < 1000000) {
    score += 10;
    evidence.push('Large page size may impact loading speed');
    recommendations.push('Optimize page size - consider compressing content');
  } else {
    score += 5;
    evidence.push('Very large page size');
    recommendations.push('Significantly reduce page size for better performance');
  }
  
  const hasLazyLoading = /loading=["']lazy["']|data-src/i.test(content);
  const hasMinification = /\.min\.(js|css)/i.test(content);
  
  if (hasLazyLoading) {
    score += 20;
    evidence.push('Lazy loading implementation detected');
  } else if (imageTags > 3) {
    recommendations.push('Implement lazy loading for images');
  }
  
  if (hasMinification) {
    score += 20;
    evidence.push('Minified resources detected');
  } else {
    recommendations.push('Minify CSS and JavaScript files');
  }
  
  const hasPreload = /<link[^>]*rel=["']preload["']/i.test(content);
  const hasPrefetch = /<link[^>]*rel=["']prefetch["']/i.test(content);
  
  if (hasPreload || hasPrefetch) {
    score += 20;
    evidence.push('Resource preloading/prefetching implemented');
  } else {
    recommendations.push('Consider preloading critical resources');
  }
  
  if (score === 0) {
    score = 15;
    recommendations.push('Implement basic page speed optimizations');
  } else if (score < 25) {
    score += 5;
  }
  
  return {
    factor_id: 'E.1.1',
    factor_name: 'Page Load Speed Optimization',
    pillar: 'E',
    phase: 'instant',
    score: Math.min(score, 100),
    confidence: 70,
    weight: 0.64,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime
  };
}
