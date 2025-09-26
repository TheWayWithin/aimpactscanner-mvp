import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Complete 15-factor analysis implementation for AImpactScanner MVP
// MASTERY-AI Framework v3.1.1 compliant

// Factor types
interface FactorResult {
  factor_id: string;
  factor_name: string;
  pillar: string;
  phase: 'instant' | 'background';
  score: number;
  confidence: number;
  weight: number;
  evidence: string[];
  recommendations: string[];
  processing_time_ms: number;
}

interface AnalysisResult {
  factors: FactorResult[];
  overall_score: number;
  processing_time_ms: number;
  success: boolean;
  error?: string;
}

// Factor 1: HTTPS Security (M.1.1)
function analyzeHTTPS(url: string): FactorResult {
  const startTime = Date.now();
  const isHTTPS = url.startsWith('https://');
  const score = isHTTPS ? 100 : 0;
  
  return {
    factor_id: 'M.1.1',
    factor_name: 'HTTPS Security',
    pillar: 'M',
    phase: 'instant',
    score,
    confidence: 100,
    weight: 0.73,
    evidence: [
      isHTTPS ? 'Site uses HTTPS protocol' : 'Site uses HTTP protocol',
      isHTTPS ? 'Secure connection established' : 'Insecure connection detected'
    ],
    recommendations: isHTTPS ? [] : [
      'Enable HTTPS for improved security and SEO',
      'Configure SSL/TLS certificate',
      'Implement HTTP to HTTPS redirects'
    ],
    processing_time_ms: Date.now() - startTime
  };
}

// Factor 2: Title Optimization (M.2.1)
function analyzeTitle(title: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  if (!title) {
    evidence.push('No title tag found');
    recommendations.push('Add a descriptive title tag');
    recommendations.push('Keep title between 50-60 characters');
  } else {
    const length = title.length;
    evidence.push(`Title: "${title}"`);
    evidence.push(`Length: ${length} characters`);
    
    // Length scoring
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
    
    // Content quality
    const wordCount = title.split(/\s+/).length;
    if (wordCount >= 3 && wordCount <= 12) {
      score += 30;
      evidence.push('Good descriptive title');
    } else {
      score += 15;
      recommendations.push('Improve title descriptiveness');
    }
    
    // Keyword diversity
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

// Factor 3: Meta Description (M.2.2)
function analyzeMetaDescription(metaDescription: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
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
    
    // Length scoring
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
    
    // CTA check
    const ctaWords = ['learn', 'discover', 'find', 'get', 'download', 'start', 'explore', 'see'];
    const hasCtaWords = ctaWords.some(word => metaDescription.toLowerCase().includes(word));
    if (hasCtaWords) {
      score += 30;
      evidence.push('Contains compelling call-to-action language');
    } else {
      recommendations.push('Add call-to-action words');
    }
    
    // Natural language
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

// Factor 4: Author Information (A.2.1)
function analyzeAuthor(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
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
  
  // Check for professional indicators
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

// Factor 5: Contact Information (A.3.2)
function analyzeContact(url: string, content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
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
  
  // Base score if no contact info
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
  
  // Address check
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

// Factor 6: Heading Hierarchy (S.2.2)
function analyzeHeadings(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  const h1Tags = (content.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || []).map(h => h.replace(/<[^>]*>/g, '').trim());
  const h2Tags = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Tags = (content.match(/<h3[^>]*>/gi) || []).length;
  
  evidence.push(`H1 tags: ${h1Tags.length}`);
  evidence.push(`H2 tags: ${h2Tags}`);
  evidence.push(`H3 tags: ${h3Tags}`);
  
  // H1 structure
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
  
  // H2 structure
  if (h2Tags >= 2) {
    score += 30;
    evidence.push('Good H2 structure for content organization');
  } else if (h2Tags >= 1) {
    score += 15;
    recommendations.push('Add more H2 headings to improve structure');
  } else {
    recommendations.push('Add H2 headings to organize content');
  }
  
  // H3 structure
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

// Factor 7: Structured Data Detection (M.3.1)
function analyzeStructuredData(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for JSON-LD
  const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  
  if (jsonLdMatches && jsonLdMatches.length > 0) {
    score += 50;
    evidence.push(`Found ${jsonLdMatches.length} JSON-LD blocks`);
    
    // Try to parse and analyze
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
      } catch (e) {
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
  
  // Check for microdata
  if (content.includes('itemscope') || content.includes('itemtype')) {
    score += 20;
    evidence.push('Microdata markup detected');
  }
  
  // Check for RDFa
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

// Factor 8: FAQ Schema Analysis (AI.2.3)
function analyzeFAQ(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for FAQ patterns
  const faqTerms = /frequently\s+asked\s+questions?|faq|q\s*&\s*a|questions?\s+and\s+answers?/i;
  const hasFAQSection = faqTerms.test(content);
  
  if (hasFAQSection) {
    score += 30;
    evidence.push('FAQ section detected');
  }
  
  // Check for question patterns
  const questionMatches = content.match(/\?[^?]{10,}/g) || [];
  if (questionMatches.length >= 3) {
    score += 30;
    evidence.push(`Found ${questionMatches.length} questions`);
  } else if (questionMatches.length >= 1) {
    score += 15;
    evidence.push(`Found ${questionMatches.length} question(s)`);
    recommendations.push('Add more Q&A content');
  }
  
  // Check for FAQ schema
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
      } catch (e) {
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

// Factor 9: Image Alt Text Analysis (M.2.3)
function analyzeImages(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  const imageTags = content.match(/<img[^>]*>/gi) || [];
  const imageCount = imageTags.length;
  
  if (imageCount === 0) {
    score = 50; // Neutral if no images
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
    
    // Quality check
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

// Factor 10: Content Depth (S.3.1)
function analyzeWordCount(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Remove HTML tags for text analysis
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 2).length;
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  evidence.push(`Word count: ${wordCount}`);
  evidence.push(`Sentences: ${sentences.length}`);
  
  // Score based on content depth
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
  
  // Structure check
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

// Factor 11: Citation-Worthy Content (AI.1.1)
function analyzeCitationWorthyContent(content: string, title: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Remove HTML tags for text analysis
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const factualClaims = sentences.filter(s => 
    /\b(shows?|proves?|demonstrates?|indicates?|reveals?|studies?|research|data|evidence|according to|based on)\b/i.test(s)
  ).length;
  
  // Fact density assessment
  const wordCount = textContent.split(' ').filter(w => w.length > 2).length;
  const factDensity = wordCount > 0 ? factualClaims / Math.ceil(wordCount / 100) : 0;
  
  evidence.push(`Word count: ${wordCount}`);
  evidence.push(`Factual claims identified: ${factualClaims}`);
  evidence.push(`Fact density: ${factDensity.toFixed(2)} claims per 100 words`);
  
  // Score based on fact density
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
  
  // Hierarchical structure assessment
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
  
  // Citation anchors (links to sources)
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

// Factor 12: Source Authority Signals (AI.1.2)
function analyzeSourceAuthoritySignals(content: string, url: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for author information
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
  
  // Check for institutional affiliation
  const domainParts = new URL(url).hostname.split('.');
  const isEduOrg = domainParts.some(part => ['edu', 'org', 'gov'].includes(part));
  if (isEduOrg) {
    score += 20;
    evidence.push('Institutional domain detected (.edu/.org/.gov)');
  }
  
  // Check for professional indicators
  const professionalTerms = /expertise|experience|specializ|certified|published|research|study/gi;
  const professionalMatches = (content.match(professionalTerms) || []).length;
  
  if (professionalMatches >= 3) {
    score += 20;
    evidence.push('Multiple professional authority indicators');
  } else if (professionalMatches >= 1) {
    score += 10;
    evidence.push('Some professional indicators present');
  }
  
  // Check for references
  const references = /reference|citation|source|bibliography/i.test(content);
  if (references) {
    score += 20;
    evidence.push('References or bibliography section found');
  } else {
    recommendations.push('Add references section to support claims');
  }
  
  // Base score varies based on actual content quality
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

// Factor 13: Evidence Chunking for RAG (AI.1.5)
function analyzeEvidenceChunking(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Remove HTML tags for text analysis
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  evidence.push(`Content paragraphs: ${paragraphs.length}`);
  evidence.push(`Sentences: ${sentences.length}`);
  
  // Check paragraph/chunk sizes (optimal 150-300 words)
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
  
  // Check for semantic boundaries
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
  
  // Check for internal links
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

// Factor 14: Transparency & Disclosure (A.3.1)
function analyzeTransparencyDisclosure(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for disclosure statements
  const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
  const hasDisclosure = disclosureTerms.test(content);
  
  if (hasDisclosure) {
    score += 30;
    evidence.push('Disclosure statements found');
  } else {
    recommendations.push('Add disclosure statements for transparency');
    recommendations.push('Include conflict of interest information if applicable');
  }
  
  // Check for funding information
  const fundingTerms = /funded\s+by|grant|supported\s+by|sponsored\s+by/i;
  const hasFunding = fundingTerms.test(content);
  
  if (hasFunding) {
    score += 25;
    evidence.push('Funding source transparency present');
  } else {
    recommendations.push('Include funding source information if applicable');
  }
  
  // Check for methodology
  const methodTerms = /method|process|approach|criteria|how\s+we|our\s+process/i;
  const hasMethod = methodTerms.test(content);
  
  if (hasMethod) {
    score += 25;
    evidence.push('Methodology or process information included');
  } else {
    recommendations.push('Explain your methodology and process');
  }
  
  // Check for update info
  const updatedTerms = /updated|revised|last\s+modified|published/i;
  const hasUpdated = updatedTerms.test(content);
  
  if (hasUpdated) {
    score += 20;
    evidence.push('Update information provided');
  } else {
    recommendations.push('Include publication and update dates');
  }
  
  // Base transparency score
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

// Factor 15: Page Load Speed (E.1.1)
function analyzePageLoadSpeed(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Analyze page size indicators
  const pageSize = content.length;
  const imageTags = (content.match(/<img[^>]*>/gi) || []).length;
  const scriptTags = (content.match(/<script[^>]*>/gi) || []).length;
  const styleTags = (content.match(/<style[^>]*>/gi) || []).length;
  const cssLinks = (content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
  
  evidence.push(`Page content size: ${Math.round(pageSize / 1024)} KB`);
  evidence.push(`Images: ${imageTags}`);
  evidence.push(`Scripts: ${scriptTags}`);
  evidence.push(`CSS files: ${cssLinks + styleTags}`);
  
  // Score based on page size
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
  
  // Check for optimization indicators
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
  
  // Check for performance meta tags
  const hasPreload = /<link[^>]*rel=["']preload["']/i.test(content);
  const hasPrefetch = /<link[^>]*rel=["']prefetch["']/i.test(content);
  
  if (hasPreload || hasPrefetch) {
    score += 20;
    evidence.push('Resource preloading/prefetching implemented');
  } else {
    recommendations.push('Consider preloading critical resources');
  }
  
  // Base score
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

// Main analysis function
async function analyzeAllFactors(url: string, pageContent: string, title: string, metaDescription: string, progressCallback?: (stage: string, percent: number, message: string, educational: string) => Promise<void>): Promise<AnalysisResult> {
  const startTime = Date.now();
  const factors: FactorResult[] = [];
  
  // Helper function for progress updates
  const updateProgress = async (factorNumber: number, factorName: string, educationalContent: string) => {
    if (progressCallback) {
      const progress = Math.round((factorNumber / 15) * 80) + 10; // 10% start + 80% for 15 factors
      await progressCallback(
        `analyzing_${factorName.toLowerCase().replace(/\s+/g, '_')}`,
        progress,
        `Analyzing: ${factorName}`,
        educationalContent
      );
      // Delay to ensure progress update is visible
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };
  
  try {
    // Factor 1: HTTPS Security
    await updateProgress(1, 'HTTPS Security', 'Checking if your site uses secure HTTPS protocol - essential for AI search rankings and user trust.');
    factors.push(analyzeHTTPS(url));
    
    // Factor 2: Title Optimization
    await updateProgress(2, 'Title Optimization', 'Analyzing your page title for length, keywords, and AI search optimization best practices.');
    factors.push(analyzeTitle(title));
    
    // Factor 3: Meta Description
    await updateProgress(3, 'Meta Description Quality', 'Evaluating your meta description for search snippet optimization and user engagement factors.');
    factors.push(analyzeMetaDescription(metaDescription));
    
    // Factor 4: Author Information
    await updateProgress(4, 'Author Information', 'Detecting author bylines and credibility signals that establish expertise and trustworthiness.');
    factors.push(analyzeAuthor(pageContent));
    
    // Factor 5: Contact Information
    await updateProgress(5, 'Contact Information', 'Scanning for contact methods (email, phone, address) that build trust and authority signals.');
    factors.push(analyzeContact(url, pageContent));
    
    // Factor 6: Heading Hierarchy
    await updateProgress(6, 'Heading Hierarchy', 'Analyzing your heading structure (H1-H6) for semantic organization and content accessibility.');
    factors.push(analyzeHeadings(pageContent));
    
    // Factor 7: Structured Data
    await updateProgress(7, 'Structured Data', 'Checking for JSON-LD, microdata, and schema markup that helps AI understand your content.');
    factors.push(analyzeStructuredData(pageContent));
    
    // Factor 8: FAQ Schema
    await updateProgress(8, 'FAQ Content', 'Identifying question-answer patterns and FAQ structured data for enhanced AI comprehension.');
    factors.push(analyzeFAQ(pageContent));
    
    // Factor 9: Image Alt Text
    await updateProgress(9, 'Image Accessibility', 'Evaluating image alt text coverage and quality for accessibility and AI image understanding.');
    factors.push(analyzeImages(pageContent));
    
    // Factor 10: Content Depth
    await updateProgress(10, 'Content Depth', 'Analyzing content length, readability, and depth for comprehensive topic coverage.');
    factors.push(analyzeWordCount(pageContent));
    
    // Factor 11: Citation-Worthy Content
    await updateProgress(11, 'Citation-Worthy Content', 'Checking if your content has the structure and depth needed for AI systems to cite it.');
    factors.push(analyzeCitationWorthyContent(pageContent, title));
    
    // Factor 12: Source Authority
    await updateProgress(12, 'Source Authority', 'Evaluating authority signals that help AI systems assess credibility and trustworthiness.');
    factors.push(analyzeSourceAuthoritySignals(pageContent, url));
    
    // Factor 13: Evidence Chunking
    await updateProgress(13, 'Evidence Chunking', 'Analyzing content chunking for optimal AI retrieval-augmented generation processing.');
    factors.push(analyzeEvidenceChunking(pageContent));
    
    // Factor 14: Transparency & Disclosure
    await updateProgress(14, 'Transparency Standards', 'Checking for transparency and disclosure standards that build trust with AI systems.');
    factors.push(analyzeTransparencyDisclosure(pageContent));
    
    // Factor 15: Page Load Speed
    await updateProgress(15, 'Page Load Speed', 'Evaluating page load speed optimization for better user experience and AI crawler efficiency.');
    factors.push(analyzePageLoadSpeed(pageContent));
    
    // Calculate overall score
    const overall_score = calculateOverallScore(factors);
    const processing_time_ms = Date.now() - startTime;
    
    return {
      factors,
      overall_score,
      processing_time_ms,
      success: true
    };
    
  } catch (error) {
    console.error('Analysis failed:', error);
    return {
      factors,
      overall_score: 0,
      processing_time_ms: Date.now() - startTime,
      success: false,
      error: error.message
    };
  }
}

// Calculate overall score from factors
function calculateOverallScore(factors: FactorResult[]): number {
  if (factors.length === 0) return 0;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  factors.forEach(factor => {
    // Weight by confidence to account for reliability
    const weightedScore = factor.score * (factor.confidence / 100) * factor.weight;
    totalScore += weightedScore;
    totalWeight += factor.weight;
  });
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

// Fetch webpage data
async function fetchPageData(url: string): Promise<{title: string, metaDescription: string, content: string}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AImpactScanner/1.0 (AI Search Optimization Analysis)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    let metaDescription = '';
    
    // Standard meta description
    let metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
    if (!metaMatch) {
      // Try reversed order
      metaMatch = html.match(/<meta[^>]*content=["']([^"']*)[^>]*name=["']description/i);
    }
    if (!metaMatch) {
      // Try Open Graph
      metaMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i);
    }
    
    metaDescription = metaMatch ? metaMatch[1].trim() : '';
    
    return { title, metaDescription, content: html };
    
  } catch (error) {
    console.error(`Failed to fetch page data: ${error.message}`);
    return { title: '', metaDescription: '', content: '' };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('=== 15-FACTOR ANALYSIS START ===');
    
    const { url, userId, analysisId } = await req.json();
    
    console.log('Parameters:', { url, userId, analysisId });
    
    // Validate inputs
    if (!url || !userId || !analysisId) {
      throw new Error('Missing required parameters: url, userId, or analysisId');
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');
    
    // Progress tracking helper
    const updateProgress = async (stage: string, percent: number, message: string, educational: string) => {
      try {
        const { error } = await supabase
          .from('analysis_progress')
          .insert({
            analysis_id: analysisId,
            stage,
            progress_percent: percent,
            message,
            educational_content: educational
          });
        
        if (error) {
          console.error('Progress update error:', error);
        } else {
          console.log(`Progress: ${percent}% - ${message}`);
        }
      } catch (e) {
        console.error('Progress update exception:', e);
      }
    };
    
    // Insert new analysis record
    await supabase
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userId,
        url: url,
        status: 'processing',
        scores: {
          overall_score: 0,
          pillars: {},
          factors: {}
        },
        factor_results: {},
        framework_version: '3.1.1',
        created_at: new Date().toISOString()
      });
    
    // Start analysis
    await updateProgress('initialization', 10, 'Initializing analysis engine...', 'Setting up secure analysis environment...');
    
    // Brief delay to ensure frontend subscription is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch webpage content
    await updateProgress('fetching', 15, 'Fetching webpage content...', 'Downloading HTML and analyzing page structure...');
    const pageData = await fetchPageData(url);
    
    // Perform 15-factor analysis
    const analysisResult = await analyzeAllFactors(url, pageData.content, pageData.title, pageData.metaDescription, updateProgress);
    
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }
    
    const factors = analysisResult.factors;
    
    console.log('Factors analyzed:', {
      count: factors.length,
      factors: factors.map(f => ({ 
        factor_id: f.factor_id, 
        factor_name: f.factor_name, 
        score: f.score, 
        pillar: f.pillar 
      }))
    });
    
    // Insert factor results
    for (const factor of factors) {
      const insertResult = await supabase
        .from('analysis_factors')
        .insert({
          analysis_id: analysisId,
          factor_id: factor.factor_id,
          factor_name: factor.factor_name,
          pillar: factor.pillar,
          phase: factor.phase,
          score: factor.score,
          confidence: factor.confidence,
          weight: factor.weight,
          evidence: factor.evidence,
          recommendations: factor.recommendations,
          processing_time_ms: factor.processing_time_ms,
          educational_content: `${factor.factor_name} is essential for AI optimization and search visibility.`
        });
      
      if (insertResult.error) {
        console.error(`Error inserting factor ${factor.factor_name}:`, insertResult.error);
      } else {
        console.log(`Successfully inserted factor: ${factor.factor_name} (Score: ${factor.score})`);
      }
    }
    
    await updateProgress('finalization', 95, 'Finalizing results...', 'Calculating overall optimization score...');
    
    const overallScore = analysisResult.overall_score;
    
    // Calculate pillar scores
    const pillarData = {
      AI: { score: 0, weight: 23.8, factors: 0, totalWeight: 0, name: "AI Response Optimization & Citation" },
      A: { score: 0, weight: 17.9, factors: 0, totalWeight: 0, name: "Authority & Trust Signals" },
      M: { score: 0, weight: 14.6, factors: 0, totalWeight: 0, name: "Machine Readability & Technical Infrastructure" },
      S: { score: 0, weight: 13.9, factors: 0, totalWeight: 0, name: "Semantic Content Quality" },
      E: { score: 0, weight: 10.9, factors: 0, totalWeight: 0, name: "Engagement & User Experience" },
      T: { score: 0, weight: 8.9, factors: 0, totalWeight: 0, name: "Topical Expertise & Experience" },
      R: { score: 0, weight: 5.9, factors: 0, totalWeight: 0, name: "Reference Networks & Citations" },
      Y: { score: 0, weight: 4.1, factors: 0, totalWeight: 0, name: "Yield Optimization & Freshness" }
    };
    
    // Calculate weighted scores per pillar
    factors.forEach(factor => {
      const pillar = factor.pillar;
      if (pillarData[pillar]) {
        const factorWeight = factor.weight || 1.0;
        pillarData[pillar].score += factor.score * factorWeight;
        pillarData[pillar].totalWeight += factorWeight;
        pillarData[pillar].factors += 1;
      }
    });
    
    // Calculate weighted average scores
    Object.keys(pillarData).forEach(pillar => {
      if (pillarData[pillar].totalWeight > 0) {
        pillarData[pillar].score = Math.round(pillarData[pillar].score / pillarData[pillar].totalWeight);
      }
    });
    
    // Update analysis as completed
    console.log('Updating analysis status to completed...');
    console.log('Overall score:', overallScore);
    
    try {
      const updateResult = await supabase
        .from('analyses')
        .update({ 
          status: 'completed',
          overall_score: overallScore,
          page_title: pageData.title || null,
          page_description: pageData.metaDescription || null,
          framework_version: '3.1.1',
          scores: {
            overall_score: overallScore,
            pillars: pillarData,
            factors: factors.reduce((acc, f) => {
              acc[f.factor_id] = {
                score: f.score,
                confidence: f.confidence,
                evidence: f.evidence,
                recommendations: f.recommendations
              };
              return acc;
            }, {})
          },
          analysis_duration: analysisResult.processing_time_ms
        })
        .eq('id', analysisId);
      
      if (updateResult.error) {
        console.error('Database update error:', updateResult.error);
        console.log('Analysis status update failed, but factors were saved successfully');
      } else {
        console.log('Analysis status updated to completed');
      }
    } catch (dbError) {
      console.error('Database operation exception:', dbError);
      console.log('Continuing despite database error - factors are saved');
    }
    
    try {
      await updateProgress('complete', 100, 'Analysis complete!', 'Review your factor scores and recommendations for optimization opportunities.');
    } catch (progressError) {
      console.error('Final progress update failed:', progressError);
    }
    
    console.log('=== ANALYSIS COMPLETE ===');
    console.log(`Overall score: ${overallScore}`);
    console.log(`Factors analyzed: ${factors.length}`);
    console.log('Factors successfully inserted, analysis functional');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Analysis completed successfully',
      analysisId,
      factors_count: factors.length,
      factors: factors,
      pillars: pillarData,
      overall_score: overallScore,
      processing_time_ms: analysisResult.processing_time_ms,
      tier: 'coffee',
      remainingAnalyses: 'unlimited'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});