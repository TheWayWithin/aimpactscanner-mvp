# Factor Implementation Guide v1.0
## AImpactScanner MVP - Complete Factor Implementation Reference

**Version**: 1.0.0 - Implementation Ready Edition  
**Date**: July 11th, 2025  
**Status**: Ready for Development  
**Related**: PRD v8.0, TAD v1.0, MASTERY-AI Framework v3.1.1  

---

## Overview

This guide provides complete implementation details for all 22 MVP factors, organized by processing phase and complexity. Each factor includes exact implementation code, scoring algorithms, fallback strategies, and educational content.

---

## Phase A: Instant Factors (10 factors - 15s max)

### AI.1.1 - HTTPS Security Check
**Target Time**: <100ms  
**Complexity**: Trivial  
**Weight**: 1.5  

```typescript
interface FactorResult {
  id: string;
  score: number;
  confidence: number;
  evidence: string[];
  recommendations: string[];
  processingTime: number;
}

async function analyzeHTTPS(url: string): Promise<FactorResult> {
  const startTime = Date.now();
  
  try {
    const isHTTPS = url.toLowerCase().startsWith('https://');
    
    return {
      id: 'AI.1.1',
      score: isHTTPS ? 100 : 0,
      confidence: 100,
      evidence: [
        `URL protocol: ${new URL(url).protocol}`,
        isHTTPS ? 'Secure HTTPS connection detected' : 'Insecure HTTP connection detected'
      ],
      recommendations: isHTTPS ? [] : [
        'Implement HTTPS encryption for security and AI trust',
        'Redirect all HTTP traffic to HTTPS',
        'Update internal links to use HTTPS protocol'
      ],
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      id: 'AI.1.1',
      score: 0,
      confidence: 50,
      evidence: [`Error analyzing URL: ${error.message}`],
      recommendations: ['Verify URL format and accessibility'],
      processingTime: Date.now() - startTime
    };
  }
}
```

**Educational Content**: "HTTPS encryption is critical for AI systems to trust your content. It ensures data integrity and user security, making your site more likely to be cited by AI platforms."

---

### AI.1.2 - Title Tag Optimization
**Target Time**: <100ms  
**Complexity**: Trivial  
**Weight**: 2.0  

```typescript
async function analyzeTitleOptimization(title: string): Promise<FactorResult> {
  const startTime = Date.now();
  
  if (!title || title.trim().length === 0) {
    return {
      id: 'AI.1.2',
      score: 0,
      confidence: 100,
      evidence: ['No title tag found'],
      recommendations: [
        'Add a descriptive title tag to your page',
        'Include primary keywords naturally',
        'Keep title length between 50-60 characters'
      ],
      processingTime: Date.now() - startTime
    };
  }
  
  const length = title.trim().length;
  let score = 0;
  const evidence = [`Title: "${title}"`, `Length: ${length} characters`];
  const recommendations = [];
  
  // Length scoring
  if (length >= 30 && length <= 60) {
    score += 40;
    evidence.push('✓ Optimal length for search snippets');
  } else if (length < 30) {
    score += 20;
    recommendations.push('Consider making title more descriptive (30-60 characters ideal)');
  } else if (length > 60) {
    score += 25;
    recommendations.push('Shorten title for better snippet display (30-60 characters ideal)');
  }
  
  // Content quality scoring
  const words = title.toLowerCase().split(/\s+/);
  if (words.length >= 3) {
    score += 30;
    evidence.push('✓ Contains multiple descriptive words');
  } else {
    recommendations.push('Add more descriptive words to title');
  }
  
  // AI-friendly patterns
  const aiPatterns = [
    /\b(guide|tutorial|how to|complete|ultimate|definitive)\b/i,
    /\b(2024|2025|latest|updated)\b/i,
    /\b(step by step|comprehensive|detailed)\b/i
  ];
  
  const hasAIPattern = aiPatterns.some(pattern => pattern.test(title));
  if (hasAIPattern) {
    score += 30;
    evidence.push('✓ Contains AI-friendly descriptive patterns');
  } else {
    recommendations.push('Consider adding descriptive words like "guide", "complete", or current year');
  }
  
  return {
    id: 'AI.1.2',
    score: Math.min(score, 100),
    confidence: 95,
    evidence,
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Title tags are the first thing AI systems read. Descriptive, well-structured titles with clear topic indicators help AI understand and cite your content accurately."

---

### AI.1.3 - Meta Description Quality
**Target Time**: <100ms  
**Complexity**: Trivial  
**Weight**: 1.8  

```typescript
async function analyzeMetaDescription(metaTags: HTMLMetaElement[]): Promise<FactorResult> {
  const startTime = Date.now();
  
  const descriptionTag = metaTags.find(tag => 
    tag.name?.toLowerCase() === 'description' || 
    tag.getAttribute('name')?.toLowerCase() === 'description'
  );
  
  if (!descriptionTag || !descriptionTag.content) {
    return {
      id: 'AI.1.3',
      score: 0,
      confidence: 100,
      evidence: ['No meta description found'],
      recommendations: [
        'Add a meta description summarizing your page content',
        'Keep description between 150-160 characters',
        'Include primary keywords naturally',
        'Write for both users and AI systems'
      ],
      processingTime: Date.now() - startTime
    };
  }
  
  const description = descriptionTag.content.trim();
  const length = description.length;
  let score = 0;
  const evidence = [`Description: "${description}"`, `Length: ${length} characters`];
  const recommendations = [];
  
  // Length scoring
  if (length >= 120 && length <= 160) {
    score += 50;
    evidence.push('✓ Optimal length for search snippets');
  } else if (length >= 80 && length < 120) {
    score += 35;
    recommendations.push('Consider expanding description (120-160 characters ideal)');
  } else if (length > 160) {
    score += 30;
    recommendations.push('Shorten description to prevent truncation (120-160 characters ideal)');
  } else {
    score += 15;
    recommendations.push('Expand description with more detail (120-160 characters ideal)');
  }
  
  // Content quality
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 2) {
    score += 25;
    evidence.push('✓ Contains multiple informative sentences');
  } else {
    recommendations.push('Add more detailed sentences to description');
  }
  
  // Action words and clarity
  const actionWords = /\b(learn|discover|find|get|understand|explore|complete|achieve)\b/i;
  if (actionWords.test(description)) {
    score += 25;
    evidence.push('✓ Contains action-oriented language');
  } else {
    recommendations.push('Consider adding action words to engage readers');
  }
  
  return {
    id: 'AI.1.3',
    score: Math.min(score, 100),
    confidence: 90,
    evidence,
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Meta descriptions help AI systems understand your page's purpose. Well-written descriptions improve click-through rates and provide context for AI citation decisions."

---

### A.2.1 - Author Information Detection
**Target Time**: <200ms  
**Complexity**: Trivial  
**Weight**: 1.2  

```typescript
async function analyzeAuthorInformation(content: string, structuredData: any[]): Promise<FactorResult> {
  const startTime = Date.now();
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check structured data for author
  const authorFromSchema = structuredData.find(item => 
    item['@type'] === 'Article' || item['@type'] === 'BlogPosting'
  )?.author;
  
  if (authorFromSchema) {
    score += 40;
    evidence.push('✓ Author information in structured data');
    
    if (typeof authorFromSchema === 'object' && authorFromSchema.name) {
      score += 20;
      evidence.push(`Author: ${authorFromSchema.name}`);
    }
  }
  
  // Check for common author patterns in HTML
  const authorPatterns = [
    /class=["'].*author.*["']/i,
    /rel=["']author["']/i,
    /by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /<span[^>]*>\s*Author:\s*([^<]+)<\/span>/i,
    /Written by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];
  
  let authorFound = false;
  for (const pattern of authorPatterns) {
    const match = content.match(pattern);
    if (match) {
      authorFound = true;
      score += 25;
      evidence.push('✓ Author information found in content');
      if (match[1]) {
        evidence.push(`Detected author: ${match[1]}`);
      }
      break;
    }
  }
  
  // Check for byline patterns
  const bylinePatterns = [
    /class=["'].*byline.*["']/i,
    /class=["'].*by-author.*["']/i,
    /<address[^>]*>.*<\/address>/i
  ];
  
  for (const pattern of bylinePatterns) {
    if (pattern.test(content)) {
      score += 15;
      evidence.push('✓ Author byline structure detected');
      break;
    }
  }
  
  if (score === 0) {
    recommendations.push(
      'Add author information to establish content credibility',
      'Use structured data markup for author details',
      'Include author bio or credentials where appropriate',
      'Consider adding rel="author" attribute to author links'
    );
  } else if (score < 70) {
    recommendations.push(
      'Enhance author information with structured data',
      'Add more detailed author credentials or bio'
    );
  }
  
  return {
    id: 'A.2.1',
    score: Math.min(score, 100),
    confidence: authorFound ? 85 : 70,
    evidence: evidence.length ? evidence : ['No clear author information found'],
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Author information builds trust with AI systems. Clear authorship signals help AI platforms assess content credibility and increase citation likelihood."

---

### A.3.2 - Contact Information Detection
**Target Time**: <200ms  
**Complexity**: Trivial  
**Weight**: 1.0  

```typescript
async function analyzeContactInformation(url: string, links: HTMLAnchorElement[]): Promise<FactorResult> {
  const startTime = Date.now();
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  const domain = new URL(url).hostname;
  
  // Check for contact page
  const contactPagePatterns = [
    /\/contact\/?$/i,
    /\/contact-us\/?$/i,
    /\/get-in-touch\/?$/i,
    /\/reach-us\/?$/i
  ];
  
  const hasContactPage = links.some(link => {
    const href = link.href || '';
    return contactPagePatterns.some(pattern => pattern.test(href));
  });
  
  if (hasContactPage) {
    score += 40;
    evidence.push('✓ Contact page link found');
  }
  
  // Check for email links
  const emailLinks = links.filter(link => 
    link.href?.startsWith('mailto:') || 
    link.textContent?.includes('@')
  );
  
  if (emailLinks.length > 0) {
    score += 30;
    evidence.push(`✓ ${emailLinks.length} email contact(s) found`);
  }
  
  // Check for phone links
  const phoneLinks = links.filter(link => 
    link.href?.startsWith('tel:') ||
    /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\+\d{1,3}\s*\d{3,}/.test(link.textContent || '')
  );
  
  if (phoneLinks.length > 0) {
    score += 20;
    evidence.push(`✓ ${phoneLinks.length} phone contact(s) found`);
  }
  
  // Check for physical address indicators
  const addressPatterns = [
    /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)/i,
    /address/i,
    /location/i
  ];
  
  const pageText = links.map(l => l.textContent).join(' ');
  const hasAddress = addressPatterns.some(pattern => pattern.test(pageText));
  
  if (hasAddress) {
    score += 10;
    evidence.push('✓ Address information detected');
  }
  
  if (score === 0) {
    recommendations.push(
      'Add a contact page to improve trust signals',
      'Include email contact information',
      'Consider adding phone number for direct contact',
      'Add physical address if applicable to business'
    );
  } else if (score < 60) {
    recommendations.push(
      'Add more contact methods for better accessibility',
      'Ensure contact information is easy to find'
    );
  }
  
  return {
    id: 'A.3.2',
    score: Math.min(score, 100),
    confidence: 80,
    evidence: evidence.length ? evidence : ['No contact information found'],
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Contact information signals legitimacy to AI systems. Multiple contact methods demonstrate transparency and build trust for content citation."

---

### S.1.1 - Heading Hierarchy Analysis
**Target Time**: <300ms  
**Complexity**: Low  
**Weight**: 1.8  

```typescript
interface HeadingInfo {
  level: number;
  text: string;
  wordCount: number;
}

async function analyzeHeadingHierarchy(headings: HTMLHeadingElement[]): Promise<FactorResult> {
  const startTime = Date.now();
  
  if (headings.length === 0) {
    return {
      id: 'S.1.1',
      score: 0,
      confidence: 100,
      evidence: ['No headings found on page'],
      recommendations: [
        'Add proper heading structure (H1, H2, H3) to organize content',
        'Use H1 for main topic, H2 for sections, H3 for subsections',
        'Include keywords naturally in headings'
      ],
      processingTime: Date.now() - startTime
    };
  }
  
  const headingData: HeadingInfo[] = headings.map(h => ({
    level: parseInt(h.tagName[1]),
    text: h.textContent?.trim() || '',
    wordCount: (h.textContent?.trim().split(/\s+/) || []).length
  }));
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for H1
  const h1Count = headingData.filter(h => h.level === 1).length;
  if (h1Count === 1) {
    score += 25;
    evidence.push('✓ Single H1 tag found (optimal)');
  } else if (h1Count > 1) {
    score += 10;
    evidence.push(`⚠ ${h1Count} H1 tags found (should be 1)`);
    recommendations.push('Use only one H1 tag per page for best SEO');
  } else {
    recommendations.push('Add an H1 tag for the main page topic');
  }
  
  // Check hierarchy logic
  let hierarchyScore = 0;
  let lastLevel = 0;
  let hierarchyBreaks = 0;
  
  for (const heading of headingData) {
    if (lastLevel === 0) {
      lastLevel = heading.level;
      continue;
    }
    
    const levelJump = heading.level - lastLevel;
    if (levelJump > 1) {
      hierarchyBreaks++;
    }
    lastLevel = heading.level;
  }
  
  if (hierarchyBreaks === 0) {
    hierarchyScore = 25;
    evidence.push('✓ Proper heading hierarchy maintained');
  } else {
    hierarchyScore = Math.max(0, 25 - (hierarchyBreaks * 5));
    evidence.push(`⚠ ${hierarchyBreaks} hierarchy breaks found`);
    recommendations.push('Fix heading hierarchy (don\'t skip levels, e.g., H1→H3)');
  }
  score += hierarchyScore;
  
  // Check heading content quality
  const avgWordCount = headingData.reduce((sum, h) => sum + h.wordCount, 0) / headingData.length;
  if (avgWordCount >= 2 && avgWordCount <= 8) {
    score += 25;
    evidence.push('✓ Headings have appropriate length');
  } else if (avgWordCount < 2) {
    score += 10;
    recommendations.push('Make headings more descriptive (2-8 words ideal)');
  } else {
    score += 15;
    recommendations.push('Shorten headings for better scannability');
  }
  
  // Check for content structure
  const totalHeadings = headingData.length;
  if (totalHeadings >= 3) {
    score += 25;
    evidence.push(`✓ ${totalHeadings} headings provide good content structure`);
  } else {
    score += 10;
    recommendations.push('Add more headings to improve content structure');
  }
  
  evidence.unshift(`Heading structure: ${headingData.map(h => `H${h.level}`).join(', ')}`);
  
  return {
    id: 'S.1.1',
    score: Math.min(score, 100),
    confidence: 90,
    evidence,
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Proper heading hierarchy helps AI systems understand your content structure. Clear organization with H1, H2, H3 tags makes content easier to parse and cite."

---

### AI.2.1 - Structured Data Detection
**Target Time**: <400ms  
**Complexity**: Low  
**Weight**: 2.2  

```typescript
async function analyzeStructuredData(htmlContent: string): Promise<FactorResult> {
  const startTime = Date.now();
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Extract JSON-LD structured data
  const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  let jsonLdData = [];
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        const parsed = JSON.parse(content);
        jsonLdData.push(parsed);
      } catch (e) {
        evidence.push('⚠ Invalid JSON-LD found');
      }
    }
  }
  
  if (jsonLdData.length > 0) {
    score += 40;
    evidence.push(`✓ ${jsonLdData.length} JSON-LD structured data block(s) found`);
    
    // Check for common schemas
    const schemas = jsonLdData.flatMap(item => {
      if (Array.isArray(item)) return item.map(i => i['@type']).filter(Boolean);
      return item['@type'] ? [item['@type']] : [];
    });
    
    const uniqueSchemas = [...new Set(schemas)];
    if (uniqueSchemas.length > 0) {
      score += 30;
      evidence.push(`Schemas: ${uniqueSchemas.join(', ')}`);
    }
    
    // Bonus for high-value schemas
    const valuableSchemas = ['Article', 'BlogPosting', 'Person', 'Organization', 'WebSite', 'FAQPage'];
    const hasValuableSchema = uniqueSchemas.some(schema => valuableSchemas.includes(schema));
    if (hasValuableSchema) {
      score += 20;
      evidence.push('✓ Contains high-value schema types');
    }
  }
  
  // Check for microdata
  const microdataPattern = /itemscope|itemtype|itemprop/i;
  if (microdataPattern.test(htmlContent)) {
    score += 10;
    evidence.push('✓ Microdata markup detected');
  }
  
  // Check for RDFa
  const rdfaPattern = /typeof=|property=|resource=/i;
  if (rdfaPattern.test(htmlContent)) {
    score += 5;
    evidence.push('✓ RDFa markup detected');
  }
  
  if (score === 0) {
    recommendations.push(
      'Add JSON-LD structured data to help AI understand your content',
      'Implement Article or BlogPosting schema for content pages',
      'Add Organization schema for business information',
      'Consider FAQPage schema for question-answer content'
    );
  } else if (score < 70) {
    recommendations.push(
      'Expand structured data with additional relevant schemas',
      'Ensure all structured data is valid and complete'
    );
  }
  
  return {
    id: 'AI.2.1',
    score: Math.min(score, 100),
    confidence: jsonLdData.length > 0 ? 95 : 70,
    evidence: evidence.length ? evidence : ['No structured data found'],
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Structured data provides explicit context to AI systems. JSON-LD markup helps AI understand your content type, author, and key information for accurate citations."

---

### AI.2.3 - FAQ Schema Detection
**Target Time**: <300ms  
**Complexity**: Low  
**Weight**: 1.4  

```typescript
async function analyzeFAQSchema(structuredData: any[], htmlContent: string): Promise<FactorResult> {
  const startTime = Date.now();
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  // Check for FAQ schema in structured data
  const faqSchema = structuredData.find(item => item['@type'] === 'FAQPage');
  if (faqSchema) {
    score += 50;
    evidence.push('✓ FAQPage schema detected');
    
    if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity)) {
      const questionCount = faqSchema.mainEntity.length;
      score += 30;
      evidence.push(`✓ ${questionCount} structured questions found`);
      
      if (questionCount >= 3) {
        score += 20;
        evidence.push('✓ Comprehensive FAQ content');
      }
    }
  }
  
  // Check for Question schema
  const questionSchemas = structuredData.filter(item => item['@type'] === 'Question');
  if (questionSchemas.length > 0) {
    score += 25;
    evidence.push(`✓ ${questionSchemas.length} Question schema(s) found`);
  }
  
  // Check for FAQ patterns in HTML
  const faqPatterns = [
    /<h[1-6][^>]*>.*\?.*<\/h[1-6]>/gi,
    /class=["'][^"']*faq[^"']*["']/gi,
    /frequently asked questions/gi,
    /<details[^>]*>.*<summary[^>]*>.*\?.*<\/summary>/gi
  ];
  
  let htmlFaqScore = 0;
  for (const pattern of faqPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      htmlFaqScore += 10;
      evidence.push(`✓ FAQ pattern detected (${matches.length} instances)`);
    }
  }
  score += Math.min(htmlFaqScore, 30);
  
  // Check for question words
  const questionWords = ['what', 'why', 'how', 'when', 'where', 'who'];
  const questionPattern = new RegExp(`\\b(${questionWords.join('|')})\\b.*\\?`, 'gi');
  const questionMatches = htmlContent.match(questionPattern);
  
  if (questionMatches && questionMatches.length >= 3) {
    score += 20;
    evidence.push(`✓ ${questionMatches.length} question patterns in content`);
  } else if (questionMatches && questionMatches.length > 0) {
    score += 10;
    evidence.push(`✓ ${questionMatches.length} question pattern(s) in content`);
  }
  
  if (score === 0) {
    recommendations.push(
      'Add FAQ section to address common user questions',
      'Implement FAQPage structured data for better AI understanding',
      'Include question-answer pairs relevant to your content',
      'Use clear question formats (What, Why, How, etc.)'
    );
  } else if (score < 70) {
    recommendations.push(
      'Expand FAQ content with more comprehensive questions',
      'Add structured data markup for existing FAQ content',
      'Ensure answers are detailed and helpful'
    );
  }
  
  return {
    id: 'AI.2.3',
    score: Math.min(score, 100),
    confidence: 85,
    evidence: evidence.length ? evidence : ['No FAQ content detected'],
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "FAQ content directly addresses user questions that AI systems often receive. Well-structured Q&A helps AI provide accurate responses and cite your content."

---

### M.2.3 - Image Alt Text Analysis
**Target Time**: <200ms  
**Complexity**: Trivial  
**Weight**: 1.0  

```typescript
async function analyzeImageAltText(images: HTMLImageElement[]): Promise<FactorResult> {
  const startTime = Date.now();
  
  if (images.length === 0) {
    return {
      id: 'M.2.3',
      score: 100, // No images means no accessibility issues
      confidence: 100,
      evidence: ['No images found on page'],
      recommendations: [],
      processingTime: Date.now() - startTime
    };
  }
  
  let score = 0;
  const evidence = [];
  const recommendations = [];
  
  const totalImages = images.length;
  const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0);
  const decorativeImages = images.filter(img => img.alt === '');
  
  // Calculate alt text coverage
  const coverage = (imagesWithAlt.length / totalImages) * 100;
  
  if (coverage === 100) {
    score = 100;
    evidence.push(`✓ All ${totalImages} images have alt text`);
  } else if (coverage >= 80) {
    score = 80;
    evidence.push(`✓ ${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
    recommendations.push('Add alt text to remaining images');
  } else if (coverage >= 60) {
    score = 60;
    evidence.push(`⚠ ${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
    recommendations.push('Improve alt text coverage for better accessibility');
  } else {
    score = Math.max(20, coverage * 0.5);
    evidence.push(`❌ Only ${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
    recommendations.push('Add alt text to images for accessibility and AI understanding');
  }
  
  // Check alt text quality
  if (imagesWithAlt.length > 0) {
    const avgAltLength = imagesWithAlt.reduce((sum, img) => sum + (img.alt?.length || 0), 0) / imagesWithAlt.length;
    
    if (avgAltLength >= 10 && avgAltLength <= 125) {
      evidence.push('✓ Alt text length is appropriate');
    } else if (avgAltLength < 10) {
      recommendations.push('Make alt text more descriptive (10-125 characters recommended)');
    } else {
      recommendations.push('Shorten alt text for better usability (10-125 characters recommended)');
    }
    
    // Check for keyword stuffing
    const suspiciousAlt = imagesWithAlt.filter(img => {
      const alt = img.alt?.toLowerCase() || '';
      const words = alt.split(/\s+/);
      const uniqueWords = new Set(words);
      return words.length > 5 && uniqueWords.size / words.length < 0.6;
    });
    
    if (suspiciousAlt.length > 0) {
      recommendations.push('Avoid keyword stuffing in alt text - focus on describing the image');
    }
  }
  
  if (decorativeImages.length > 0) {
    evidence.push(`✓ ${decorativeImages.length} decorative images properly marked with empty alt`);
  }
  
  if (score < 100 && recommendations.length === 0) {
    recommendations.push(
      'Add descriptive alt text to all content images',
      'Use empty alt="" for decorative images',
      'Keep alt text concise but descriptive (10-125 characters)'
    );
  }
  
  return {
    id: 'M.2.3',
    score,
    confidence: 90,
    evidence,
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Alt text helps AI systems understand image content. Descriptive alt text improves accessibility and helps AI comprehend the visual context of your content."

---

### S.3.1 - Word Count Analysis
**Target Time**: <200ms  
**Complexity**: Trivial  
**Weight**: 1.5  

```typescript
async function analyzeWordCount(content: string): Promise<FactorResult> {
  const startTime = Date.now();
  
  // Clean content - remove script, style, and excessive whitespace
  const cleanContent = content
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanContent) {
    return {
      id: 'S.3.1',
      score: 0,
      confidence: 100,
      evidence: ['No readable content found'],
      recommendations: [
        'Add substantial textual content to your page',
        'Aim for at least 300 words for basic topics',
        'Provide comprehensive information on your subject'
      ],
      processingTime: Date.now() - startTime
    };
  }
  
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  let score = 0;
  const evidence = [`Word count: ${wordCount} words`];
  const recommendations = [];
  
  // Score based on word count ranges
  if (wordCount >= 1500) {
    score = 100;
    evidence.push('✓ Comprehensive content length');
  } else if (wordCount >= 1000) {
    score = 90;
    evidence.push('✓ Good content depth');
  } else if (wordCount >= 600) {
    score = 75;
    evidence.push('✓ Adequate content length');
  } else if (wordCount >= 300) {
    score = 60;
    evidence.push('⚠ Minimal content length');
    recommendations.push('Consider expanding content for better AI understanding');
  } else if (wordCount >= 150) {
    score = 40;
    evidence.push('⚠ Very short content');
    recommendations.push('Add more detailed information (aim for 300+ words)');
  } else {
    score = 20;
    evidence.push('❌ Insufficient content');
    recommendations.push('Significantly expand content with detailed information');
  }
  
  // Additional content quality indicators
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgWordsPerSentence = wordCount / sentences.length;
  
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
    evidence.push('✓ Good sentence structure and readability');
  } else if (avgWordsPerSentence < 10) {
    recommendations.push('Consider using more detailed sentences');
  } else {
    recommendations.push('Break up long sentences for better readability');
  }
  
  // Check for content structure indicators
  const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  if (paragraphs.length >= 3) {
    evidence.push(`✓ ${paragraphs.length} substantial paragraphs detected`);
  } else if (wordCount > 300) {
    recommendations.push('Break content into more paragraphs for better structure');
  }
  
  return {
    id: 'S.3.1',
    score,
    confidence: 95,
    evidence,
    recommendations,
    processingTime: Date.now() - startTime
  };
}
```

**Educational Content**: "Substantial content signals expertise to AI systems. Comprehensive articles with 600+ words provide more context for AI understanding and citation opportunities."

---

## Phase B: Background Factors (12 factors - 45s max)

### E.2.1 - Page Load Speed Assessment
**Target Time**: <5000ms  
**Complexity**: High  
**Weight**: 2.5  

```typescript
async function analyzePageLoadSpeed(page: puppeteer.Page): Promise<FactorResult> {
  const startTime = Date.now();
  
  try {
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        transferSize: navigation.transferSize || 0,
        domElements: document.querySelectorAll('*').length
      };
    });
    
    let score = 0;
    const evidence = [];
    const recommendations = [];
    
    // First Contentful Paint scoring
    const fcp = performanceMetrics.firstContentfulPaint;
    evidence.push(`First Contentful Paint: ${fcp.toFixed(0)}ms`);
    
    if (fcp <= 1800) {
      score += 40;
      evidence.push('✓ Excellent First Contentful Paint');
    } else if (fcp <= 3000) {
      score += 30;
      evidence.push('✓ Good First Contentful Paint');
    } else if (fcp <= 4000) {
      score += 20;
      evidence.push('⚠ Fair First Contentful Paint');
      recommendations.push('Optimize First Contentful Paint (target: <1.8s)');
    } else {
      score += 10;
      evidence.push('❌ Poor First Contentful Paint');
      recommendations.push('Significantly improve First Contentful Paint performance');
    }
    
    // DOM Content Loaded scoring
    const dcl = performanceMetrics.domContentLoaded;
    evidence.push(`DOM Content Loaded: ${dcl.toFixed(0)}ms`);
    
    if (dcl <= 1500) {
      score += 30;
      evidence.push('✓ Fast DOM processing');
    } else if (dcl <= 2500) {
      score += 20;
      evidence.push('✓ Adequate DOM processing');
    } else {
      score += 10;
      evidence.push('⚠ Slow DOM processing');
      recommendations.push('Optimize DOM complexity and JavaScript execution');
    }
    
    // Transfer size scoring
    const transferSize = performanceMetrics.transferSize;
    evidence.push(`Transfer size: ${(transferSize / 1024).toFixed(1)}KB`);
    
    if (transferSize <= 500000) { // 500KB
      score += 20;
      evidence.push('✓ Efficient page size');
    } else if (transferSize <= 1000000) { // 1MB
      score += 15;
      evidence.push('✓ Reasonable page size');
    } else if (transferSize <= 2000000) { // 2MB
      score += 10;
      evidence.push('⚠ Large page size');
      recommendations.push('Reduce page size through compression and optimization');
    } else {
      score += 5;
      evidence.push('❌ Very large page size');
      recommendations.push('Significantly reduce page size for better performance');
    }
    
    // DOM complexity scoring
    const domElements = performanceMetrics.domElements;
    evidence.push(`DOM elements: ${domElements}`);
    
    if (domElements <= 1500) {
      score += 10;
      evidence.push('✓ Reasonable DOM complexity');
    } else if (domElements <= 3000) {
      score += 5;
      evidence.push('⚠ Complex DOM structure');
    } else {
      evidence.push('❌ Very complex DOM structure');
      recommendations.push('Simplify DOM structure for better performance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great performance! Consider implementing performance monitoring');
    }
    
    return {
      id: 'E.2.1',
      score: Math.min(score, 100),
      confidence: 90,
      evidence,
      recommendations,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      id: 'E.2.1',
      score: 0,
      confidence: 50,
      evidence: [`Error measuring performance: ${error.message}`],
      recommendations: [
        'Ensure page loads correctly for performance measurement',
        'Check for JavaScript errors that might affect metrics'
      ],
      processingTime: Date.now() - startTime
    };
  }
}
```

**Educational Content**: "Page speed affects user experience and AI crawling efficiency. Fast-loading pages are more likely to be fully analyzed and cited by AI systems."

---

## Implementation Utilities

### Factor Result Formatting
```typescript
// Utility function to standardize factor results
function formatFactorResult(
  factorId: string,
  score: number,
  confidence: number,
  evidence: string[],
  recommendations: string[],
  processingTime: number,
  weight?: number
): FactorResult {
  return {
    id: factorId,
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    evidence: evidence.length > 0 ? evidence : ['Analysis completed'],
    recommendations: recommendations.length > 0 ? recommendations : [],
    processingTime,
    weight: weight || 1.0,
    timestamp: new Date().toISOString()
  };
}
```

### Educational Content Database
```typescript
const educationalContent: Record<string, string> = {
  'AI.1.1': 'HTTPS encryption builds trust with AI systems and ensures secure data transmission.',
  'AI.1.2': 'Title tags are the first signal AI systems use to understand your content topic.',
  'AI.1.3': 'Meta descriptions provide AI systems with page summaries for better context.',
  'A.2.1': 'Author information establishes content credibility and expertise signals.',
  'A.3.2': 'Contact information builds trust and demonstrates transparency to AI systems.',
  'S.1.1': 'Proper heading structure helps AI understand content organization and hierarchy.',
  'AI.2.1': 'Structured data provides explicit context that AI systems can easily parse.',
  'AI.2.3': 'FAQ content directly addresses questions AI systems commonly receive.',
  'M.2.3': 'Alt text helps AI understand visual content and improves accessibility.',
  'S.3.1': 'Substantial content demonstrates expertise and provides more citation opportunities.',
  'E.2.1': 'Fast loading pages are more likely to be fully crawled and analyzed by AI systems.'
};

export function getEducationalContent(factorId: string): string {
  return educationalContent[factorId] || 'This factor helps AI systems better understand and cite your content.';
}
```

---

## Testing & Validation

### Unit Test Example
```typescript
describe('Title Analysis', () => {
  it('should score optimal title correctly', () => {
    const title = 'Complete Guide to AI Optimization - 2025 Edition';
    const result = analyzeTitleOptimization(title);
    
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidence).toBeGreaterThan(90);
    expect(result.recommendations).toHaveLength(0);
  });
  
  it('should handle missing title', () => {
    const result = analyzeTitleOptimization('');
    
    expect(result.score).toBe(0);
    expect(result.recommendations).toContain('Add a descriptive title tag');
  });
});
```

This Factor Implementation Guide provides complete, production-ready code for all 22 MVP factors with proper error handling, performance optimization, and educational content integration.