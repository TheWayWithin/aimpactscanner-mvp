// Unit Tests for Individual Factors
import { describe, it, expect, beforeEach } from 'vitest'
import { testConfig, testUtils } from '../setup/test-config.js'

// Mock factor implementations for testing
// These will be replaced with real implementations from AnalysisEngine

const mockFactors = {
  // HTTPS Check (AI.1.1)
  checkHTTPS: (url) => {
    const score = url.startsWith('https://') ? 100 : 0
    return {
      factor_id: 'AI.1.1',
      factor_name: 'HTTPS Security',
      pillar: 'AI',
      score,
      confidence: 100,
      weight: 1.0,
      evidence: [url.startsWith('https://') ? 'Site uses HTTPS' : 'Site uses HTTP only'],
      recommendations: score === 100 ? [] : ['Enable HTTPS for improved security and SEO']
    }
  },

  // Title Optimization (AI.1.2)
  analyzeTitle: (title) => {
    let score = 0
    let evidence = []
    let recommendations = []

    if (!title || title.length === 0) {
      evidence.push('No title tag found')
      recommendations.push('Add a descriptive page title')
    } else if (title.length < 30) {
      score = 40
      evidence.push(`Title is short (${title.length} characters)`)
      recommendations.push('Consider lengthening title to 50-60 characters')
    } else if (title.length > 60) {
      score = 60
      evidence.push(`Title is long (${title.length} characters)`)
      recommendations.push('Consider shortening title to under 60 characters')
    } else {
      score = 85
      evidence.push(`Title length is optimal (${title.length} characters)`)
    }

    return {
      factor_id: 'AI.1.2',
      factor_name: 'Title Optimization',
      pillar: 'AI',
      score,
      confidence: 95,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Meta Description (AI.1.3)
  analyzeMetaDescription: (metaDescription) => {
    let score = 0
    let evidence = []
    let recommendations = []

    if (!metaDescription) {
      evidence.push('No meta description found')
      recommendations.push('Add a meta description for better search snippets')
    } else if (metaDescription.length < 120) {
      score = 50
      evidence.push(`Meta description is short (${metaDescription.length} characters)`)
      recommendations.push('Consider lengthening to 150-160 characters')
    } else if (metaDescription.length > 160) {
      score = 70
      evidence.push(`Meta description is long (${metaDescription.length} characters)`)
      recommendations.push('Consider shortening to under 160 characters')
    } else {
      score = 90
      evidence.push(`Meta description length is optimal (${metaDescription.length} characters)`)
    }

    return {
      factor_id: 'AI.1.3',
      factor_name: 'Meta Description Quality',
      pillar: 'AI',
      score,
      confidence: 90,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Author Information (A.2.1)
  findAuthor: (content) => {
    const authorPatterns = [
      /by\s+([A-Za-z\s]+)/i,
      /author:\s*([A-Za-z\s]+)/i,
      /written\s+by\s+([A-Za-z\s]+)/i
    ]

    let score = 0
    let evidence = []
    let recommendations = []

    for (const pattern of authorPatterns) {
      const match = content.match(pattern)
      if (match) {
        score = 80
        evidence.push(`Author found: ${match[1]}`)
        break
      }
    }

    if (score === 0) {
      evidence.push('No author information found')
      recommendations.push('Add author information to establish authority')
    }

    return {
      factor_id: 'A.2.1',
      factor_name: 'Author Information',
      pillar: 'Authority',
      score,
      confidence: 85,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Contact Information (A.3.2) - Enhanced with nuanced scoring
  findContact: (url, links, content) => {
    let score = 0
    let evidence = []
    let recommendations = []

    // Check for contact page links
    const contactPagePatterns = [
      /\/contact\/?$/i,
      /\/contact-us\/?$/i,
      /\/get-in-touch\/?$/i,
      /\/reach-us\/?$/i
    ]

    const hasContactPage = links.some(link => 
      contactPagePatterns.some(pattern => pattern.test(link))
    )

    if (hasContactPage) {
      score += 40
      evidence.push('Contact page link found')
    }

    // Check for email links
    const emailLinks = links.filter(link => 
      link.startsWith('mailto:') || 
      link.includes('@')
    )

    if (emailLinks.length > 0) {
      score += 30
      evidence.push(`${emailLinks.length} email contact(s) found`)
    }

    // Check for phone links
    const phoneLinks = links.filter(link => 
      link.startsWith('tel:') ||
      /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\+\d{1,3}\s*\d{3,}/.test(link)
    )

    if (phoneLinks.length > 0) {
      score += 20
      evidence.push(`${phoneLinks.length} phone contact(s) found`)
    }

    // Check for physical address indicators in content
    const addressPatterns = [
      /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)/i
    ]

    const hasAddress = addressPatterns.some(pattern => pattern.test(content || ''))
    if (hasAddress) {
      score += 10
      evidence.push('Address information detected')
    }

    if (score === 0) {
      evidence.push('No contact information found')
      recommendations.push('Add a contact page to improve trust signals')
      recommendations.push('Include email contact information')
      recommendations.push('Consider adding phone number for direct contact')
    } else if (score < 60) {
      recommendations.push('Add more contact methods for better accessibility')
    }

    return {
      factor_id: 'A.3.2',
      factor_name: 'Contact Information',
      pillar: 'Authority',
      score: Math.min(score, 100),
      confidence: 80,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Heading Hierarchy Analysis (S.1.1)
  analyzeHeadings: (headings) => {
    let score = 0
    let evidence = []
    let recommendations = []

    if (headings.length === 0) {
      evidence.push('No headings found on page')
      recommendations.push('Add proper heading structure (H1, H2, H3) to organize content')
      return {
        factor_id: 'S.1.1',
        factor_name: 'Heading Hierarchy',
        pillar: 'Structure',
        score: 0,
        confidence: 100,
        weight: 1.0,
        evidence,
        recommendations
      }
    }

    // Parse heading levels
    const headingData = headings.map(h => ({
      level: parseInt(h.level || h.tagName?.charAt(1) || '1'),
      text: h.text || h.textContent || '',
      wordCount: (h.text || h.textContent || '').split(/\s+/).length
    }))

    // Check for H1
    const h1Count = headingData.filter(h => h.level === 1).length
    if (h1Count === 1) {
      score += 25
      evidence.push('Single H1 tag found (optimal)')
    } else if (h1Count > 1) {
      score += 10
      evidence.push(`${h1Count} H1 tags found (should be 1)`)
      recommendations.push('Use only one H1 tag per page for best SEO')
    } else {
      recommendations.push('Add an H1 tag for the main page topic')
    }

    // Check hierarchy logic
    let hierarchyScore = 0
    let lastLevel = 0
    let hierarchyBreaks = 0

    for (const heading of headingData) {
      if (lastLevel === 0) {
        lastLevel = heading.level
        continue
      }
      
      const levelJump = heading.level - lastLevel
      if (levelJump > 1) {
        hierarchyBreaks++
      }
      lastLevel = heading.level
    }

    if (hierarchyBreaks === 0) {
      hierarchyScore = 25
      evidence.push('Proper heading hierarchy maintained')
    } else {
      hierarchyScore = Math.max(0, 25 - (hierarchyBreaks * 5))
      evidence.push(`${hierarchyBreaks} hierarchy breaks found`)
      recommendations.push('Fix heading hierarchy (don\'t skip levels, e.g., H1→H3)')
    }
    score += hierarchyScore

    // Check heading content quality
    const avgWordCount = headingData.reduce((sum, h) => sum + h.wordCount, 0) / headingData.length
    if (avgWordCount >= 2 && avgWordCount <= 8) {
      score += 25
      evidence.push('Headings have appropriate length')
    } else if (avgWordCount < 2) {
      score += 10
      recommendations.push('Make headings more descriptive (2-8 words ideal)')
    } else {
      score += 15
      recommendations.push('Shorten headings for better scannability')
    }

    // Check for content structure
    const totalHeadings = headingData.length
    if (totalHeadings >= 3) {
      score += 25
      evidence.push(`${totalHeadings} headings provide good content structure`)
    } else {
      score += 10
      recommendations.push('Add more headings to improve content structure')
    }

    evidence.unshift(`Heading structure: ${headingData.map(h => `H${h.level}`).join(', ')}`)

    return {
      factor_id: 'S.1.1',
      factor_name: 'Heading Hierarchy',
      pillar: 'Structure',
      score: Math.min(score, 100),
      confidence: 90,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Structured Data Detection (AI.2.1)
  analyzeStructuredData: (htmlContent) => {
    let score = 0
    let evidence = []
    let recommendations = []

    // Extract JSON-LD structured data
    const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)
    let jsonLdData = []

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim()
          const parsed = JSON.parse(content)
          jsonLdData.push(parsed)
        } catch (e) {
          evidence.push('⚠ Invalid JSON-LD found')
        }
      }
    }

    if (jsonLdData.length > 0) {
      score += 40
      evidence.push(`${jsonLdData.length} JSON-LD structured data block(s) found`)
      
      // Check for common schemas
      const schemas = jsonLdData.flatMap(item => {
        if (Array.isArray(item)) return item.map(i => i['@type']).filter(Boolean)
        return item['@type'] ? [item['@type']] : []
      })
      
      const uniqueSchemas = [...new Set(schemas)]
      if (uniqueSchemas.length > 0) {
        score += 30
        evidence.push(`Schemas: ${uniqueSchemas.join(', ')}`)
      }
      
      // Bonus for high-value schemas
      const valuableSchemas = ['Article', 'BlogPosting', 'Person', 'Organization', 'WebSite', 'FAQPage']
      const hasValuableSchema = uniqueSchemas.some(schema => valuableSchemas.includes(schema))
      if (hasValuableSchema) {
        score += 20
        evidence.push('Contains high-value schema types')
      }
    }

    // Check for microdata
    const microdataPattern = /itemscope|itemtype|itemprop/i
    if (microdataPattern.test(htmlContent)) {
      score += 10
      evidence.push('Microdata markup detected')
    }

    // Check for RDFa
    const rdfaPattern = /typeof=|property=|resource=/i
    if (rdfaPattern.test(htmlContent)) {
      score += 5
      evidence.push('RDFa markup detected')
    }

    if (score === 0) {
      evidence.push('No structured data found')
      recommendations.push('Add JSON-LD structured data to help AI understand your content')
      recommendations.push('Implement Article or BlogPosting schema for content pages')
      recommendations.push('Add Organization schema for business information')
    } else if (score < 70) {
      recommendations.push('Expand structured data with additional relevant schemas')
      recommendations.push('Ensure all structured data is valid and complete')
    }

    return {
      factor_id: 'AI.2.1',
      factor_name: 'Structured Data Detection',
      pillar: 'AI',
      score: Math.min(score, 100),
      confidence: jsonLdData.length > 0 ? 95 : 70,
      weight: 1.0,
      evidence: evidence.length ? evidence : ['No structured data found'],
      recommendations
    }
  },

  // FAQ Schema Analysis (AI.2.3)
  analyzeFAQ: (structuredData, htmlContent) => {
    let score = 0
    let evidence = []
    let recommendations = []

    // Check for FAQ schema in structured data
    const faqSchema = structuredData.find(item => item['@type'] === 'FAQPage')
    if (faqSchema) {
      score += 50
      evidence.push('FAQPage schema detected')
      
      if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity)) {
        const questionCount = faqSchema.mainEntity.length
        score += 30
        evidence.push(`${questionCount} structured questions found`)
        
        if (questionCount >= 3) {
          score += 20
          evidence.push('Comprehensive FAQ content')
        }
      }
    }

    // Check for Question schema
    const questionSchemas = structuredData.filter(item => item['@type'] === 'Question')
    if (questionSchemas.length > 0) {
      score += 25
      evidence.push(`${questionSchemas.length} Question schema(s) found`)
    }

    // Check for FAQ patterns in HTML
    const faqPatterns = [
      /<h[1-6][^>]*>.*\?.*<\/h[1-6]>/gi,
      /class=["'][^"']*faq[^"']*["']/gi,
      /frequently asked questions/gi,
      /<details[^>]*>.*<summary[^>]*>.*\?.*<\/summary>/gi
    ]

    let htmlFaqScore = 0
    for (const pattern of faqPatterns) {
      const matches = htmlContent.match(pattern)
      if (matches) {
        htmlFaqScore += 10
        evidence.push(`FAQ pattern detected (${matches.length} instances)`)
      }
    }
    score += Math.min(htmlFaqScore, 30)

    // Check for question words
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who']
    const questionPattern = new RegExp(`\\b(${questionWords.join('|')})\\b.*\\?`, 'gi')
    const questionMatches = htmlContent.match(questionPattern)

    if (questionMatches && questionMatches.length >= 3) {
      score += 20
      evidence.push(`${questionMatches.length} question patterns in content`)
    } else if (questionMatches && questionMatches.length > 0) {
      score += 10
      evidence.push(`${questionMatches.length} question pattern(s) in content`)
    }

    if (score === 0) {
      evidence.push('No FAQ content detected')
      recommendations.push('Add FAQ section to address common user questions')
      recommendations.push('Implement FAQPage structured data for better AI understanding')
      recommendations.push('Include question-answer pairs relevant to your content')
    } else if (score < 70) {
      recommendations.push('Expand FAQ content with more comprehensive questions')
      recommendations.push('Add structured data markup for existing FAQ content')
    }

    return {
      factor_id: 'AI.2.3',
      factor_name: 'FAQ Schema Analysis',
      pillar: 'AI',
      score: Math.min(score, 100),
      confidence: 85,
      weight: 1.0,
      evidence: evidence.length ? evidence : ['No FAQ content detected'],
      recommendations
    }
  },

  // Image Alt Text Analysis (M.2.3)
  analyzeImageAltText: (images) => {
    if (images.length === 0) {
      return {
        factor_id: 'M.2.3',
        factor_name: 'Image Alt Text Analysis',
        pillar: 'Machine Readability',
        score: 100, // No images means no accessibility issues
        confidence: 100,
        weight: 1.0,
        evidence: ['No images found on page'],
        recommendations: []
      }
    }

    let score = 0
    let evidence = []
    let recommendations = []

    const totalImages = images.length
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0)
    const decorativeImages = images.filter(img => img.alt === '')

    // Calculate alt text coverage
    const coverage = (imagesWithAlt.length / totalImages) * 100

    if (coverage === 100) {
      score = 100
      evidence.push(`All ${totalImages} images have alt text`)
    } else if (coverage >= 80) {
      score = 80
      evidence.push(`${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`)
      recommendations.push('Add alt text to remaining images')
    } else if (coverage >= 60) {
      score = 60
      evidence.push(`⚠ ${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`)
      recommendations.push('Improve alt text coverage for better accessibility')
    } else {
      score = Math.max(20, coverage * 0.5)
      evidence.push(`❌ Only ${imagesWithAlt.length}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`)
      recommendations.push('Add alt text to images for accessibility and AI understanding')
    }

    // Check alt text quality
    if (imagesWithAlt.length > 0) {
      const avgAltLength = imagesWithAlt.reduce((sum, img) => sum + (img.alt?.length || 0), 0) / imagesWithAlt.length
      
      if (avgAltLength >= 10 && avgAltLength <= 125) {
        evidence.push('Alt text length is appropriate')
      } else if (avgAltLength < 10) {
        recommendations.push('Make alt text more descriptive (10-125 characters recommended)')
      } else {
        recommendations.push('Shorten alt text for better usability (10-125 characters recommended)')
      }
      
      // Check for keyword stuffing
      const suspiciousAlt = imagesWithAlt.filter(img => {
        const alt = img.alt?.toLowerCase() || ''
        const words = alt.split(/\s+/)
        const uniqueWords = new Set(words)
        return words.length > 5 && uniqueWords.size / words.length < 0.6
      })
      
      if (suspiciousAlt.length > 0) {
        recommendations.push('Avoid keyword stuffing in alt text - focus on describing the image')
      }
    }

    if (decorativeImages.length > 0) {
      evidence.push(`${decorativeImages.length} decorative images properly marked with empty alt`)
    }

    return {
      factor_id: 'M.2.3',
      factor_name: 'Image Alt Text Analysis',
      pillar: 'Machine Readability',
      score,
      confidence: 90,
      weight: 1.0,
      evidence,
      recommendations
    }
  },

  // Word Count Analysis (S.3.1)
  analyzeWordCount: (content) => {
    // Clean content - remove script, style, and excessive whitespace
    const cleanContent = content
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanContent) {
      return {
        factor_id: 'S.3.1',
        factor_name: 'Word Count Analysis',
        pillar: 'Structure',
        score: 0,
        confidence: 100,
        weight: 1.0,
        evidence: ['No readable content found'],
        recommendations: [
          'Add substantial textual content to your page',
          'Aim for at least 300 words for basic topics',
          'Provide comprehensive information on your subject'
        ]
      }
    }

    const words = cleanContent.split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length

    let score = 0
    let evidence = [`Word count: ${wordCount} words`]
    let recommendations = []

    // Score based on word count ranges
    if (wordCount >= 1500) {
      score = 100
      evidence.push('Comprehensive content length')
    } else if (wordCount >= 1000) {
      score = 90
      evidence.push('Good content depth')
    } else if (wordCount >= 600) {
      score = 75
      evidence.push('Adequate content length')
    } else if (wordCount >= 300) {
      score = 60
      evidence.push('⚠ Minimal content length')
      recommendations.push('Consider expanding content for better AI understanding')
    } else if (wordCount >= 150) {
      score = 40
      evidence.push('⚠ Very short content')
      recommendations.push('Add more detailed information (aim for 300+ words)')
    } else {
      score = 20
      evidence.push('❌ Insufficient content')
      recommendations.push('Significantly expand content with detailed information')
    }

    // Additional content quality indicators
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const avgWordsPerSentence = wordCount / sentences.length

    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
      evidence.push('Good sentence structure and readability')
    } else if (avgWordsPerSentence < 10) {
      recommendations.push('Consider using more detailed sentences')
    } else {
      recommendations.push('Break up long sentences for better readability')
    }

    // Check for content structure indicators
    const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 50)
    if (paragraphs.length >= 3) {
      evidence.push(`${paragraphs.length} substantial paragraphs detected`)
    } else if (wordCount > 300) {
      recommendations.push('Break content into more paragraphs for better structure')
    }

    return {
      factor_id: 'S.3.1',
      factor_name: 'Word Count Analysis',
      pillar: 'Structure',
      score,
      confidence: 95,
      weight: 1.0,
      evidence,
      recommendations
    }
  }
}

describe('Factor Analysis Unit Tests', () => {
  describe('HTTPS Check (AI.1.1)', () => {
    it('should score 100 for HTTPS URLs', () => {
      const result = mockFactors.checkHTTPS('https://example.com')
      expect(result.score).toBe(100)
      expect(result.confidence).toBe(100)
      expect(result.evidence).toContain('Site uses HTTPS')
      expect(result.recommendations).toHaveLength(0)
    })

    it('should score 0 for HTTP URLs', () => {
      const result = mockFactors.checkHTTPS('http://example.com')
      expect(result.score).toBe(0)
      expect(result.confidence).toBe(100)
      expect(result.evidence).toContain('Site uses HTTP only')
      expect(result.recommendations).toContain('Enable HTTPS for improved security and SEO')
    })
  })

  describe('Title Optimization (AI.1.2)', () => {
    it('should score 0 for missing title', () => {
      const result = mockFactors.analyzeTitle('')
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No title tag found')
      expect(result.recommendations).toContain('Add a descriptive page title')
    })

    it('should score 40 for short title', () => {
      const result = mockFactors.analyzeTitle('Short Title')
      expect(result.score).toBe(40)
      expect(result.evidence[0]).toContain('Title is short')
    })

    it('should score 85 for optimal title', () => {
      const result = mockFactors.analyzeTitle('This is an optimal title length for SEO purposes')
      expect(result.score).toBe(85)
      expect(result.evidence[0]).toContain('Title length is optimal')
    })

    it('should score 60 for long title', () => {
      const result = mockFactors.analyzeTitle('This is a very long title that exceeds the recommended 60 character limit for SEO')
      expect(result.score).toBe(60)
      expect(result.evidence[0]).toContain('Title is long')
    })
  })

  describe('Meta Description (AI.1.3)', () => {
    it('should score 0 for missing meta description', () => {
      const result = mockFactors.analyzeMetaDescription(null)
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No meta description found')
    })

    it('should score 50 for short meta description', () => {
      const result = mockFactors.analyzeMetaDescription('Short description')
      expect(result.score).toBe(50)
      expect(result.evidence[0]).toContain('Meta description is short')
    })

    it('should score 90 for optimal meta description', () => {
      const result = mockFactors.analyzeMetaDescription('This is an optimal meta description that falls within the recommended 150-160 character range for search engine snippets')
      expect(result.score).toBe(90)
      expect(result.evidence[0]).toContain('Meta description length is optimal')
    })
  })

  describe('Author Information (A.2.1)', () => {
    it('should find author with "by" pattern', () => {
      const result = mockFactors.findAuthor('This article was written by John Smith')
      expect(result.score).toBe(80)
      expect(result.evidence[0]).toContain('Author found: John Smith')
    })

    it('should find author with "author:" pattern', () => {
      const result = mockFactors.findAuthor('Author: Jane Doe')
      expect(result.score).toBe(80)
      expect(result.evidence[0]).toContain('Author found: Jane Doe')
    })

    it('should score 0 when no author found', () => {
      const result = mockFactors.findAuthor('This content has no author information')
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No author information found')
    })
  })

  describe('Contact Information (A.3.2)', () => {
    it('should find contact page and score appropriately', () => {
      const links = ['/home', '/contact', '/about']
      const result = mockFactors.findContact('https://example.com', links)
      expect(result.score).toBe(40)
      expect(result.evidence).toContain('Contact page link found')
    })

    it('should detect email contacts', () => {
      const links = ['mailto:contact@example.com', '/home']
      const result = mockFactors.findContact('https://example.com', links)
      expect(result.score).toBe(30)
      expect(result.evidence).toContain('1 email contact(s) found')
    })

    it('should detect phone contacts', () => {
      const links = ['tel:+1234567890', '/home']
      const result = mockFactors.findContact('https://example.com', links)
      expect(result.score).toBe(20)
      expect(result.evidence).toContain('1 phone contact(s) found')
    })

    it('should combine multiple contact methods', () => {
      const links = ['/contact', 'mailto:test@example.com', 'tel:123-456-7890']
      const content = '123 Main Street, Anytown, USA'
      const result = mockFactors.findContact('https://example.com', links, content)
      expect(result.score).toBe(100) // 40 + 30 + 20 + 10 = 100
      expect(result.evidence).toContain('Contact page link found')
      expect(result.evidence).toContain('1 email contact(s) found')
      expect(result.evidence).toContain('1 phone contact(s) found')
      expect(result.evidence).toContain('Address information detected')
    })

    it('should score 0 when no contact info found', () => {
      const links = ['/home', '/products', '/services']
      const result = mockFactors.findContact('https://example.com', links)
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No contact information found')
      expect(result.recommendations).toContain('Add a contact page to improve trust signals')
    })
  })

  describe('Heading Hierarchy Analysis (S.1.1)', () => {
    it('should score perfect heading structure', () => {
      const headings = [
        { level: 1, text: 'Main Title' },
        { level: 2, text: 'Section One' },
        { level: 3, text: 'Subsection' },
        { level: 2, text: 'Section Two' }
      ]
      const result = mockFactors.analyzeHeadings(headings)
      expect(result.score).toBe(100) // 25 + 25 + 25 + 25
      expect(result.evidence).toContain('Single H1 tag found (optimal)')
      expect(result.evidence).toContain('Proper heading hierarchy maintained')
    })

    it('should detect hierarchy breaks', () => {
      const headings = [
        { level: 1, text: 'Main Title' },
        { level: 3, text: 'Skipped Level' } // H1 to H3 is a break
      ]
      const result = mockFactors.analyzeHeadings(headings)
      expect(result.evidence).toContain('1 hierarchy breaks found')
      expect(result.recommendations).toContain('Fix heading hierarchy (don\'t skip levels, e.g., H1→H3)')
    })

    it('should handle multiple H1s', () => {
      const headings = [
        { level: 1, text: 'First Title' },
        { level: 1, text: 'Second Title' }
      ]
      const result = mockFactors.analyzeHeadings(headings)
      expect(result.evidence).toContain('2 H1 tags found (should be 1)')
      expect(result.recommendations).toContain('Use only one H1 tag per page for best SEO')
    })

    it('should handle no headings', () => {
      const result = mockFactors.analyzeHeadings([])
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No headings found on page')
      expect(result.recommendations).toContain('Add proper heading structure (H1, H2, H3) to organize content')
    })

    it('should check heading length appropriateness', () => {
      const headings = [
        { level: 1, text: 'Good Length Title' }, // 3 words - good
        { level: 2, text: 'A' }, // 1 word - too short
        { level: 3, text: 'This is an extremely long heading that goes on and on' } // Too long
      ]
      const result = mockFactors.analyzeHeadings(headings)
      expect(result.recommendations).toContain('Make headings more descriptive (2-8 words ideal)')
    })
  })

  describe('Structured Data Detection (AI.2.1)', () => {
    it('should detect valid JSON-LD', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article"
        }
        </script>
      `
      const result = mockFactors.analyzeStructuredData(htmlContent)
      expect(result.score).toBeGreaterThanOrEqual(70) // 40 + 30
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('Schemas: Article')
    })

    it('should detect high-value schemas', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "Test Blog Post"
        }
        </script>
      `
      const result = mockFactors.analyzeStructuredData(htmlContent)
      expect(result.score).toBeGreaterThanOrEqual(90) // 40 + 30 + 20
      expect(result.evidence).toContain('Contains high-value schema types')
    })

    it('should detect microdata', () => {
      const htmlContent = `<div itemscope itemtype="https://schema.org/Article">Content</div>`
      const result = mockFactors.analyzeStructuredData(htmlContent)
      expect(result.score).toBe(10)
      expect(result.evidence).toContain('Microdata markup detected')
    })

    it('should handle invalid JSON-LD', () => {
      const htmlContent = `
        <script type="application/ld+json">
        { invalid json }
        </script>
      `
      const result = mockFactors.analyzeStructuredData(htmlContent)
      expect(result.evidence).toContain('⚠ Invalid JSON-LD found')
    })

    it('should score 0 for no structured data', () => {
      const htmlContent = '<p>Just regular content</p>'
      const result = mockFactors.analyzeStructuredData(htmlContent)
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No structured data found')
      expect(result.recommendations).toContain('Add JSON-LD structured data to help AI understand your content')
    })
  })

  describe('FAQ Schema Analysis (AI.2.3)', () => {
    it('should detect FAQ schema', () => {
      const structuredData = [{
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'What is this?' },
          { '@type': 'Question', 'name': 'How does it work?' },
          { '@type': 'Question', 'name': 'Why use it?' }
        ]
      }]
      const htmlContent = ''
      const result = mockFactors.analyzeFAQ(structuredData, htmlContent)
      expect(result.score).toBe(100) // 50 + 30 + 20
      expect(result.evidence).toContain('FAQPage schema detected')
      expect(result.evidence).toContain('3 structured questions found')
      expect(result.evidence).toContain('Comprehensive FAQ content')
    })

    it('should detect Question schemas', () => {
      const structuredData = [
        { '@type': 'Question', 'name': 'What is this?' },
        { '@type': 'Question', 'name': 'How does it work?' }
      ]
      const htmlContent = ''
      const result = mockFactors.analyzeFAQ(structuredData, htmlContent)
      expect(result.score).toBe(25)
      expect(result.evidence).toContain('2 Question schema(s) found')
    })

    it('should detect FAQ patterns in HTML', () => {
      const structuredData = []
      const htmlContent = `
        <h2>What is this service?</h2>
        <p>This is an answer</p>
        <h2>How does it work?</h2>
        <p>Another answer</p>
        <div class="faq-section">
          <h3>Why choose us?</h3>
        </div>
      `
      const result = mockFactors.analyzeFAQ(structuredData, htmlContent)
      expect(result.score).toBeGreaterThan(0)
      expect(result.evidence).toContain('FAQ pattern detected')
    })

    it('should detect question patterns', () => {
      const structuredData = []
      const htmlContent = 'What is AI? How does machine learning work? Why is data important?'
      const result = mockFactors.analyzeFAQ(structuredData, htmlContent)
      expect(result.score).toBe(20)
      expect(result.evidence).toContain('3 question patterns in content')
    })

    it('should score 0 for no FAQ content', () => {
      const structuredData = []
      const htmlContent = 'Just regular content without questions.'
      const result = mockFactors.analyzeFAQ(structuredData, htmlContent)
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No FAQ content detected')
      expect(result.recommendations).toContain('Add FAQ section to address common user questions')
    })
  })

  describe('Image Alt Text Analysis (M.2.3)', () => {
    it('should score 100 for all images with alt text', () => {
      const images = [
        { alt: 'Description of first image' },
        { alt: 'Description of second image' },
        { alt: 'Description of third image' }
      ]
      const result = mockFactors.analyzeImageAltText(images)
      expect(result.score).toBe(100)
      expect(result.evidence).toContain('All 3 images have alt text')
    })

    it('should score 100 for no images', () => {
      const result = mockFactors.analyzeImageAltText([])
      expect(result.score).toBe(100)
      expect(result.evidence).toContain('No images found on page')
    })

    it('should calculate coverage percentage', () => {
      const images = [
        { alt: 'Good alt text' },
        { alt: '' }, // Empty alt (decorative)
        { alt: null }, // Missing alt
        { alt: 'Another good alt text' }
      ]
      const result = mockFactors.analyzeImageAltText(images)
      // 2 out of 4 images have meaningful alt text = 50% coverage
      expect(result.evidence[0]).toContain('50%')
    })

    it('should detect decorative images', () => {
      const images = [
        { alt: 'Meaningful alt text' },
        { alt: '' }, // Decorative image
        { alt: '' }  // Another decorative image
      ]
      const result = mockFactors.analyzeImageAltText(images)
      expect(result.evidence).toContain('2 decorative images properly marked with empty alt')
    })

    it('should check alt text length', () => {
      const images = [
        { alt: 'A' }, // Too short
        { alt: 'This is a very long alt text that goes on and on and exceeds the recommended length of 125 characters which is not good for usability' } // Too long
      ]
      const result = mockFactors.analyzeImageAltText(images)
      expect(result.recommendations).toContain('Make alt text more descriptive (10-125 characters recommended)')
    })

    it('should detect keyword stuffing', () => {
      const images = [
        { alt: 'keyword keyword keyword keyword keyword keyword' } // Repetitive keywords
      ]
      const result = mockFactors.analyzeImageAltText(images)
      expect(result.recommendations).toContain('Avoid keyword stuffing in alt text - focus on describing the image')
    })
  })

  describe('Word Count Analysis (S.3.1)', () => {
    it('should score comprehensive content highly', () => {
      const content = 'word '.repeat(1500) // 1500 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(100)
      expect(result.evidence).toContain('Word count: 1500 words')
      expect(result.evidence).toContain('Comprehensive content length')
    })

    it('should handle good content depth', () => {
      const content = 'word '.repeat(1000) // 1000 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(90)
      expect(result.evidence).toContain('Good content depth')
    })

    it('should handle adequate content', () => {
      const content = 'word '.repeat(600) // 600 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(75)
      expect(result.evidence).toContain('Adequate content length')
    })

    it('should handle minimal content with warning', () => {
      const content = 'word '.repeat(300) // 300 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(60)
      expect(result.evidence).toContain('⚠ Minimal content length')
      expect(result.recommendations).toContain('Consider expanding content for better AI understanding')
    })

    it('should handle very short content', () => {
      const content = 'word '.repeat(150) // 150 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(40)
      expect(result.evidence).toContain('⚠ Very short content')
      expect(result.recommendations).toContain('Add more detailed information (aim for 300+ words)')
    })

    it('should handle insufficient content', () => {
      const content = 'word '.repeat(50) // 50 words
      const result = mockFactors.analyzeWordCount(content)
      expect(result.score).toBe(20)
      expect(result.evidence).toContain('❌ Insufficient content')
      expect(result.recommendations).toContain('Significantly expand content with detailed information')
    })

    it('should score 0 for no content', () => {
      const result = mockFactors.analyzeWordCount('')
      expect(result.score).toBe(0)
      expect(result.evidence).toContain('No readable content found')
      expect(result.recommendations).toContain('Add substantial textual content to your page')
    })

    it('should clean HTML and scripts', () => {
      const content = `
        <script>alert('test')</script>
        <style>body { color: red; }</style>
        <p>This is actual content with multiple words.</p>
        <div>More content here.</div>
      `
      const result = mockFactors.analyzeWordCount(content)
      expect(result.evidence[0]).toContain('Word count: 8 words') // Only actual content words
    })

    it('should analyze sentence structure', () => {
      const content = 'This is a good sentence with proper length. This is another sentence. Short.'
      const result = mockFactors.analyzeWordCount(content)
      expect(result.evidence).toContain('Good sentence structure and readability')
    })

    it('should detect paragraph structure', () => {
      const content = `
        This is the first paragraph with enough content.
        
        This is the second paragraph with more content.
        
        This is the third paragraph completing the structure.
      `
      const result = mockFactors.analyzeWordCount(content)
      expect(result.evidence).toContain('substantial paragraphs detected')
    })
  })
})

describe('Factor Performance Tests', () => {
  it('should complete all 10 factor analysis within timeout', async () => {
    const startTime = Date.now()
    
    // Test data for comprehensive factor testing
    const testData = {
      url: 'https://example.com',
      title: 'Comprehensive Test Title for Analysis',
      metaDescription: 'This is a comprehensive meta description for testing purposes that falls within the optimal range',
      content: 'This content written by John Smith contains comprehensive information about our services. Contact us at 123 Main Street, Anytown, USA or email test@example.com',
      links: ['/contact', 'mailto:test@example.com', 'tel:123-456-7890'],
      headings: [
        { level: 1, text: 'Main Title' },
        { level: 2, text: 'Section One' },
        { level: 3, text: 'Subsection' }
      ],
      htmlContent: `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article"
        }
        </script>
        <h2>What is this service?</h2>
        <p>This is an answer</p>
      `,
      structuredData: [{ '@type': 'Article', 'headline': 'Test' }],
      images: [
        { alt: 'Descriptive alt text for image' },
        { alt: 'Another descriptive alt text' }
      ],
      longContent: 'word '.repeat(1000) // 1000 words
    }
    
    // Test all 10 factors
    const results = [
      mockFactors.checkHTTPS(testData.url),
      mockFactors.analyzeTitle(testData.title),
      mockFactors.analyzeMetaDescription(testData.metaDescription),
      mockFactors.findAuthor(testData.content),
      mockFactors.findContact(testData.url, testData.links, testData.content),
      mockFactors.analyzeHeadings(testData.headings),
      mockFactors.analyzeStructuredData(testData.htmlContent),
      mockFactors.analyzeFAQ(testData.structuredData, testData.htmlContent),
      mockFactors.analyzeImageAltText(testData.images),
      mockFactors.analyzeWordCount(testData.longContent)
    ]
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(testConfig.timeouts.factor_analysis)
    expect(results).toHaveLength(10)
    
    // Validate all results have required structure
    results.forEach((result, index) => {
      expect(result).toHaveProperty('factor_id')
      expect(result).toHaveProperty('factor_name')
      expect(result).toHaveProperty('pillar')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('weight')
      expect(result).toHaveProperty('evidence')
      expect(result).toHaveProperty('recommendations')
      
      // Validate score ranges
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
    })
    
    console.log(`✅ All 10 factors analyzed in ${duration}ms`)
  })

  it('should handle edge cases efficiently', async () => {
    const startTime = Date.now()
    
    // Edge case test data
    const edgeCases = [
      // Empty/null inputs
      mockFactors.checkHTTPS(''),
      mockFactors.analyzeTitle(''),
      mockFactors.analyzeMetaDescription(null),
      mockFactors.findAuthor(''),
      mockFactors.findContact('https://example.com', []),
      mockFactors.analyzeHeadings([]),
      mockFactors.analyzeStructuredData(''),
      mockFactors.analyzeFAQ([], ''),
      mockFactors.analyzeImageAltText([]),
      mockFactors.analyzeWordCount(''),
      
      // Extreme inputs
      mockFactors.analyzeTitle('x'.repeat(1000)), // Very long title
      mockFactors.analyzeMetaDescription('x'.repeat(2000)), // Very long meta
      mockFactors.analyzeHeadings(Array(100).fill({ level: 1, text: 'Heading' })), // Many headings
      mockFactors.analyzeStructuredData('<script>'.repeat(1000)), // Large HTML
      mockFactors.analyzeImageAltText(Array(1000).fill({ alt: 'test' })), // Many images
      mockFactors.analyzeWordCount('word '.repeat(10000)) // Very long content
    ]
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(testConfig.timeouts.factor_analysis * 2) // Allow more time for edge cases
    expect(edgeCases).toHaveLength(16)
    
    // All edge cases should return valid results
    edgeCases.forEach(result => {
      expect(result).toHaveProperty('score')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
    
    console.log(`✅ Edge cases handled in ${duration}ms`)
  })

  it('should maintain consistent scoring across iterations', () => {
    const testData = {
      url: 'https://example.com',
      title: 'Consistent Test Title',
      content: 'Test content with consistent scoring'
    }
    
    // Run same analysis multiple times
    const iterations = 10
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const result = mockFactors.checkHTTPS(testData.url)
      results.push(result.score)
    }
    
    // All scores should be identical for same input
    const uniqueScores = new Set(results)
    expect(uniqueScores.size).toBe(1)
    expect(results[0]).toBe(100) // HTTPS should always score 100 for https URLs
    
    console.log(`✅ Scoring consistency validated across ${iterations} iterations`)
  })
})

describe('Factor Data Validation', () => {
  it('should return valid factor structure', () => {
    const result = mockFactors.checkHTTPS('https://example.com')
    
    // Required fields
    expect(result).toHaveProperty('factor_id')
    expect(result).toHaveProperty('factor_name')
    expect(result).toHaveProperty('pillar')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('weight')
    expect(result).toHaveProperty('evidence')
    expect(result).toHaveProperty('recommendations')
    
    // Data types
    expect(typeof result.factor_id).toBe('string')
    expect(typeof result.factor_name).toBe('string')
    expect(typeof result.pillar).toBe('string')
    expect(typeof result.score).toBe('number')
    expect(typeof result.confidence).toBe('number')
    expect(typeof result.weight).toBe('number')
    expect(Array.isArray(result.evidence)).toBe(true)
    expect(Array.isArray(result.recommendations)).toBe(true)
    
    // Value ranges
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })
})