// Comprehensive Edge Case Tests for Structured Data Detection (AI.2.1)
import { describe, it, expect, beforeEach } from 'vitest'
import { testConfig, testUtils } from '../setup/test-config.js'

// Enhanced mock for comprehensive structured data testing
// This should match the real implementation in AnalysisEngine.ts
const structuredDataDetector = {
  analyzeStructuredData: (htmlContent) => {
    let score = 0
    let evidence = []
    let recommendations = []

    const safeContent = htmlContent || ''

    try {
      // JSON-LD Detection with error handling
      const jsonLdMatches = safeContent.match(/<script[^>]*type\s*=\s*['"](application\/ld\+json)['"][^>]*>([\s\S]*?)<\/script>/gi)
      let validJsonLdCount = 0
      let invalidJsonLdCount = 0
      let foundSchemas = []

      if (jsonLdMatches) {
        jsonLdMatches.forEach(match => {
          const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
          
          try {
            const parsedData = JSON.parse(content)
            validJsonLdCount++
            
            // Extract schema types
            if (parsedData['@type']) {
              const schemaType = Array.isArray(parsedData['@type']) ? parsedData['@type'][0] : parsedData['@type']
              if (!foundSchemas.includes(schemaType)) {
                foundSchemas.push(schemaType)
              }
            }
          } catch (parseError) {
            invalidJsonLdCount++
          }
        })

        if (validJsonLdCount > 0) {
          score += 40
          evidence.push(`${validJsonLdCount} JSON-LD structured data block(s) found`)
          
          if (foundSchemas.length > 0) {
            evidence.push(`Schemas: ${foundSchemas.join(', ')}`)
            score += 30
            
            // High-value schema bonus
            const highValueSchemas = ['Article', 'BlogPosting', 'NewsArticle', 'Review', 'Product', 'Organization', 'Person', 'Event']
            const hasHighValueSchema = foundSchemas.some(schema => highValueSchemas.includes(schema))
            if (hasHighValueSchema) {
              score += 20
              evidence.push('Contains high-value schema types')
            }
          }
        }

        if (invalidJsonLdCount > 0) {
          evidence.push(`⚠ Invalid JSON-LD found`)
          recommendations.push('Fix JSON-LD syntax errors for better AI understanding')
        }
      }

      // Microdata Detection
      const microdataRegex = /itemscope|itemtype|itemprop/i
      if (microdataRegex.test(safeContent)) {
        score += 10
        evidence.push('Microdata markup detected')
      }

      // Open Graph Detection
      const ogRegex = /<meta[^>]*property\s*=\s*['"](og:|fb:)[^'"]*['"][^>]*>/i
      if (ogRegex.test(safeContent)) {
        score += 5
        evidence.push('Open Graph metadata found')
      }

      // Twitter Cards Detection
      const twitterRegex = /<meta[^>]*name\s*=\s*['"]twitter:[^'"]*['"][^>]*>/i
      if (twitterRegex.test(safeContent)) {
        score += 5
        evidence.push('Twitter Card metadata found')
      }

      // Generate recommendations
      if (score === 0) {
        evidence.push('No structured data found')
        recommendations.push('Add JSON-LD structured data to help AI understand your content')
        recommendations.push('Consider implementing schema.org markup for better search visibility')
      } else if (score < 50) {
        recommendations.push('Expand structured data with additional schema types')
      }

    } catch (error) {
      evidence.push('Error analyzing structured data')
      recommendations.push('Check HTML syntax and structured data formatting')
    }

    return {
      factor_id: 'AI.2.1',
      factor_name: 'Structured Data Detection',
      pillar: 'AI',
      score: Math.min(score, 100),
      confidence: 85,
      weight: 1.0,
      evidence,
      recommendations
    }
  }
}

describe('Structured Data Detection - Comprehensive Edge Cases', () => {
  
  describe('Valid JSON-LD Scenarios', () => {
    it('should parse basic JSON-LD correctly', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article",
          "author": "John Doe"
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(htmlContent)
      
      expect(result.score).toBeGreaterThanOrEqual(70) // 40 + 30
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('Schemas: Article')
    })

    it('should handle multiple JSON-LD blocks', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "First Article"
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Test Company"
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(htmlContent)
      
      expect(result.score).toBeGreaterThanOrEqual(70)
      expect(result.evidence).toContain('2 JSON-LD structured data block(s) found')
      expect(result.evidence.some(e => e.includes('Article') && e.includes('Organization'))).toBe(true)
    })

    it('should detect high-value schema types', () => {
      const highValueSchemas = [
        'Article', 'BlogPosting', 'NewsArticle', 'Review', 
        'Product', 'Organization', 'Person', 'Event'
      ]
      
      highValueSchemas.forEach(schemaType => {
        const htmlContent = `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "${schemaType}",
            "name": "Test ${schemaType}"
          }
          </script>
        `
        
        const result = structuredDataDetector.analyzeStructuredData(htmlContent)
        
        expect(result.score).toBeGreaterThanOrEqual(90) // 40 + 30 + 20 for high-value
        expect(result.evidence).toContain('Contains high-value schema types')
        expect(result.evidence).toContain(`Schemas: ${schemaType}`)
      })
    })

    it('should handle array @type values', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": ["Article", "BlogPosting"],
          "headline": "Test with Array Type"
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(htmlContent)
      
      expect(result.score).toBeGreaterThanOrEqual(70)
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('Schemas: Article') // Should use first type
    })

    it('should handle nested JSON-LD structures', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Complex Article",
          "author": {
            "@type": "Person",
            "name": "John Doe"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Test Publisher"
          }
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(htmlContent)
      
      expect(result.score).toBeGreaterThanOrEqual(70)
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('Schemas: Article')
    })
  })

  describe('Malformed JSON-LD Edge Cases', () => {
    it('should handle invalid JSON syntax gracefully', () => {
      const malformedCases = [
        // Missing closing braces
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Missing Brace"
        </script>`,
        
        // Extra commas
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Extra Comma",
        }
        </script>`,
        
        // Unquoted keys
        `<script type="application/ld+json">
        {
          @context: "https://schema.org",
          @type: "Article",
          headline: "Unquoted Keys"
        }
        </script>`,
        
        // Single quotes instead of double quotes
        `<script type="application/ld+json">
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': 'Single Quotes'
        }
        </script>`,
        
        // Trailing comma
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Trailing Comma",
        }
        </script>`,
        
        // Comments (not valid in JSON)
        `<script type="application/ld+json">
        {
          // This is a comment
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "With Comments"
        }
        </script>`,
        
        // Empty JSON-LD
        `<script type="application/ld+json">
        </script>`,
        
        // Just whitespace
        `<script type="application/ld+json">
        
        </script>`,
        
        // Invalid escape sequences
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Invalid \\x escape"
        }
        </script>`
      ]

      malformedCases.forEach((htmlContent, index) => {
        const result = structuredDataDetector.analyzeStructuredData(htmlContent)
        
        // Should not throw an error
        expect(result.factor_id).toBe('AI.2.1')
        expect(result.evidence).toContain('⚠ Invalid JSON-LD found')
        expect(result.recommendations).toContain('Fix JSON-LD syntax errors for better AI understanding')
        
        console.log(`✅ Handled malformed JSON-LD case ${index + 1}`)
      })
    })

    it('should handle mixed valid and invalid JSON-LD', () => {
      const htmlContent = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Valid JSON-LD"
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Invalid JSON-LD",
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(htmlContent)
      
      expect(result.score).toBeGreaterThanOrEqual(70) // Should count the valid one
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('⚠ Invalid JSON-LD found')
      expect(result.evidence).toContain('Schemas: Article')
    })

    it('should handle HTML entities and special characters in JSON-LD', () => {
      const testCases = [
        // HTML entities
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Title with &amp; Entity"
        }
        </script>`,
        
        // Unicode characters
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Title with émojis 🚀"
        }
        </script>`,
        
        // Newlines and tabs
        `<script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Title with\\nNewline\\tTab"
        }
        </script>`,
        
        // CDATA sections
        `<script type="application/ld+json">
        //<![CDATA[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "CDATA Section"
        }
        //]]>
        </script>`
      ]

      testCases.forEach((htmlContent, index) => {
        expect(() => {
          const result = structuredDataDetector.analyzeStructuredData(htmlContent)
          expect(result.factor_id).toBe('AI.2.1')
        }).not.toThrow() // Should handle special characters gracefully for case ${index + 1}
      })
    })

    it('should handle script tags with different attributes', () => {
      const scriptVariations = [
        // Different quote styles
        `<script type='application/ld+json'>{"@context": "https://schema.org", "@type": "Article"}</script>`,
        
        // Extra attributes
        `<script type="application/ld+json" id="structured-data">{"@context": "https://schema.org", "@type": "Article"}</script>`,
        
        // Different spacing
        `<script  type = "application/ld+json" >{"@context": "https://schema.org", "@type": "Article"}</script>`,
        
        // Case variations
        `<SCRIPT TYPE="APPLICATION/LD+JSON">{"@context": "https://schema.org", "@type": "Article"}</SCRIPT>`,
        
        // Self-closing (invalid but might exist)
        `<script type="application/ld+json" />`,
        
        // Multiple script attributes
        `<script async defer type="application/ld+json" crossorigin="anonymous">{"@context": "https://schema.org", "@type": "Article"}</script>`
      ]

      scriptVariations.forEach((htmlContent, index) => {
        const result = structuredDataDetector.analyzeStructuredData(htmlContent)
        
        // Most should work except self-closing
        if (!htmlContent.includes('/>')) {
          expect(result.score).toBeGreaterThan(0) // Should detect valid JSON-LD for variation ${index + 1}
        }
      })
    })
  })

  describe('Microdata Detection Edge Cases', () => {
    it('should detect various microdata attributes', () => {
      const microdataTestCases = [
        // itemscope only
        { html: '<div itemscope>Content</div>', shouldDetect: true },
        
        // itemtype only
        { html: '<div itemtype="https://schema.org/Article">Content</div>', shouldDetect: true },
        
        // itemprop only
        { html: '<span itemprop="headline">Title</span>', shouldDetect: true },
        
        // Multiple attributes
        { html: '<div itemscope itemtype="https://schema.org/Article"><h1 itemprop="headline">Title</h1></div>', shouldDetect: true },
        
        // Case variations
        { html: '<div ITEMSCOPE ITEMTYPE="https://schema.org/Article">Content</div>', shouldDetect: true },
        
        // Mixed case
        { html: '<div ItemScope ItemType="https://schema.org/Article">Content</div>', shouldDetect: true },
        
        // No microdata
        { html: '<div class="article">Regular content</div>', shouldDetect: false },
        
        // Similar but not microdata
        { html: '<div data-itemscope="true">Not microdata</div>', shouldDetect: false }
      ]

      microdataTestCases.forEach(({ html, shouldDetect }, index) => {
        const result = structuredDataDetector.analyzeStructuredData(html)
        
        const hasEvidence = result.evidence.some(e => e.includes('Microdata markup detected'))
        expect(hasEvidence).toBe(shouldDetect) // Microdata detection for case ${index + 1}
        
        if (shouldDetect) {
          expect(result.score).toBeGreaterThanOrEqual(10)
        }
      })
    })

    it('should handle nested microdata structures', () => {
      const nestedMicrodata = `
        <div itemscope itemtype="https://schema.org/Article">
          <h1 itemprop="headline">Article Title</h1>
          <div itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">John Doe</span>
          </div>
          <div itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Publisher Name</span>
          </div>
        </div>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(nestedMicrodata)
      
      expect(result.evidence).toContain('Microdata markup detected')
      expect(result.score).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Open Graph and Twitter Cards Edge Cases', () => {
    it('should detect various Open Graph properties', () => {
      const ogTestCases = [
        // Basic OG tags
        { html: '<meta property="og:title" content="Page Title">', shouldDetect: true },
        { html: '<meta property="og:description" content="Page Description">', shouldDetect: true },
        { html: '<meta property="og:image" content="image.jpg">', shouldDetect: true },
        { html: '<meta property="og:url" content="https://example.com">', shouldDetect: true },
        
        // Facebook specific
        { html: '<meta property="fb:app_id" content="123456789">', shouldDetect: true },
        { html: '<meta property="fb:pages" content="123456789">', shouldDetect: true },
        
        // Different quote styles
        { html: `<meta property='og:title' content='Page Title'>`, shouldDetect: true },
        
        // Case variations
        { html: '<META PROPERTY="OG:TITLE" CONTENT="Page Title">', shouldDetect: true },
        
        // Extra attributes
        { html: '<meta property="og:title" content="Page Title" id="og-title">', shouldDetect: true },
        
        // Not Open Graph
        { html: '<meta name="description" content="Regular meta">', shouldDetect: false },
        { html: '<meta property="twitter:title" content="Twitter Title">', shouldDetect: false }
      ]

      ogTestCases.forEach(({ html, shouldDetect }, index) => {
        const result = structuredDataDetector.analyzeStructuredData(html)
        
        const hasEvidence = result.evidence.some(e => e.includes('Open Graph metadata found'))
        expect(hasEvidence).toBe(shouldDetect) // Open Graph detection for case ${index + 1}
        
        if (shouldDetect) {
          expect(result.score).toBeGreaterThanOrEqual(5)
        }
      })
    })

    it('should detect various Twitter Card properties', () => {
      const twitterTestCases = [
        // Basic Twitter Cards
        { html: '<meta name="twitter:card" content="summary">', shouldDetect: true },
        { html: '<meta name="twitter:title" content="Tweet Title">', shouldDetect: true },
        { html: '<meta name="twitter:description" content="Tweet Description">', shouldDetect: true },
        { html: '<meta name="twitter:image" content="image.jpg">', shouldDetect: true },
        { html: '<meta name="twitter:site" content="@username">', shouldDetect: true },
        { html: '<meta name="twitter:creator" content="@author">', shouldDetect: true },
        
        // Different quote styles
        { html: `<meta name='twitter:card' content='summary'>`, shouldDetect: true },
        
        // Case variations
        { html: '<META NAME="TWITTER:CARD" CONTENT="SUMMARY">', shouldDetect: true },
        
        // Not Twitter Cards
        { html: '<meta name="description" content="Regular meta">', shouldDetect: false },
        { html: '<meta property="og:title" content="OG Title">', shouldDetect: false }
      ]

      twitterTestCases.forEach(({ html, shouldDetect }, index) => {
        const result = structuredDataDetector.analyzeStructuredData(html)
        
        const hasEvidence = result.evidence.some(e => e.includes('Twitter Card metadata found'))
        expect(hasEvidence).toBe(shouldDetect) // Twitter Card detection for case ${index + 1}
        
        if (shouldDetect) {
          expect(result.score).toBeGreaterThanOrEqual(5)
        }
      })
    })

    it('should handle multiple metadata types in combination', () => {
      const combinedMetadata = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article"
        }
        </script>
        <div itemscope itemtype="https://schema.org/Organization">
          <span itemprop="name">Company Name</span>
        </div>
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG Description">
        <meta name="twitter:card" content="summary">
        <meta name="twitter:title" content="Twitter Title">
      `
      
      const result = structuredDataDetector.analyzeStructuredData(combinedMetadata)
      
      expect(result.score).toBeGreaterThan(80) // Should get points from all types
      expect(result.evidence).toContain('JSON-LD structured data block(s) found')
      expect(result.evidence).toContain('Microdata markup detected')
      expect(result.evidence).toContain('Open Graph metadata found')
      expect(result.evidence).toContain('Twitter Card metadata found')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle very large HTML content efficiently', () => {
      const largeContent = `
        <html>
          <head>
            ${'<meta name="description" content="filler content">'.repeat(1000)}
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Test Article in Large Content"
            }
            </script>
            ${'<meta name="keywords" content="more filler">'.repeat(1000)}
          </head>
          <body>
            ${'<p>Filler paragraph content</p>'.repeat(10000)}
          </body>
        </html>
      `
      
      const startTime = Date.now()
      const result = structuredDataDetector.analyzeStructuredData(largeContent)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
    })

    it('should handle pathological regex inputs', () => {
      const pathologicalInputs = [
        // Very long script tag without JSON-LD type
        `<script type="text/javascript">${'a'.repeat(100000)}</script>`,
        
        // Many script tags
        Array(1000).fill('<script>console.log("test");</script>').join(''),
        
        // Deeply nested HTML
        '<div>'.repeat(1000) + 'content' + '</div>'.repeat(1000),
        
        // Many potential microdata attributes
        Array(1000).fill('<div data-item="test">content</div>').join(''),
        
        // Many meta tags
        Array(10000).fill('<meta name="test" content="value">').join('')
      ]

      pathologicalInputs.forEach((input, index) => {
        const startTime = Date.now()
        const result = structuredDataDetector.analyzeStructuredData(input)
        const endTime = Date.now()
        
        expect(endTime - startTime).toBeLessThan(500) // Should complete within 500ms for pathological input ${index + 1}
        expect(result.factor_id).toBe('AI.2.1')
      })
    })

    it('should handle null and undefined inputs gracefully', () => {
      const edgeInputs = [null, undefined, '', '   ', '<html></html>']
      
      edgeInputs.forEach((input, index) => {
        expect(() => {
          const result = structuredDataDetector.analyzeStructuredData(input)
          expect(result.factor_id).toBe('AI.2.1')
          expect(typeof result.score).toBe('number')
          expect(result.score).toBeGreaterThanOrEqual(0)
          expect(result.score).toBeLessThanOrEqual(100)
        }).not.toThrow() // Should handle edge input ${index + 1} gracefully
      })
    })

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = [
        // Unclosed tags
        '<script type="application/ld+json">{"@type": "Article"}',
        
        // Mismatched tags
        '<script type="application/ld+json">{"@type": "Article"}</div>',
        
        // Invalid HTML entities
        '<script type="application/ld+json">{"@type": "Article&invalid;"}</script>',
        
        // Mixed case and invalid attributes
        '<SCRIPT TYPE=application/ld+json>{"@type": "Article"}</SCRIPT>',
        
        // HTML comments in JSON
        '<script type="application/ld+json"><!-- comment -->{"@type": "Article"}</script>'
      ]

      malformedHtml.forEach((html, index) => {
        expect(() => {
          const result = structuredDataDetector.analyzeStructuredData(html)
          expect(result.factor_id).toBe('AI.2.1')
        }).not.toThrow() // Should handle malformed HTML ${index + 1} gracefully
      })
    })
  })

  describe('Real-World Schema Examples', () => {
    it('should handle complex real-world Article schema', () => {
      const realWorldArticle = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "How to Optimize Your Website for AI Search",
          "image": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
          "author": {
            "@type": "Person",
            "name": "Jane Smith",
            "url": "https://example.com/author/jane-smith"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Tech Blog",
            "logo": {
              "@type": "ImageObject",
              "url": "https://example.com/logo.png"
            }
          },
          "datePublished": "2024-01-15",
          "dateModified": "2024-01-20",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://example.com/article"
          }
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(realWorldArticle)
      
      expect(result.score).toBeGreaterThanOrEqual(90) // High-value schema
      expect(result.evidence).toContain('Contains high-value schema types')
      expect(result.evidence).toContain('Schemas: Article')
    })

    it('should handle complex e-commerce Product schema', () => {
      const ecommerceProduct = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Premium Wireless Headphones",
          "image": "https://example.com/headphones.jpg",
          "description": "High-quality wireless headphones with noise cancellation",
          "sku": "WH-1000XM4",
          "mpn": "WH1000XM4",
          "brand": {
            "@type": "Brand",
            "name": "AudioTech"
          },
          "offers": {
            "@type": "Offer",
            "url": "https://example.com/headphones",
            "priceCurrency": "USD",
            "price": "299.99",
            "priceValidUntil": "2024-12-31",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "AudioTech Store"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "127"
          }
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(ecommerceProduct)
      
      expect(result.score).toBeGreaterThanOrEqual(90) // High-value schema
      expect(result.evidence).toContain('Contains high-value schema types')
      expect(result.evidence).toContain('Schemas: Product')
    })

    it('should handle Organization schema with complex structure', () => {
      const organizationSchema = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TechCorp Solutions",
          "alternateName": "TechCorp",
          "url": "https://techcorp.example.com",
          "logo": "https://techcorp.example.com/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-123-4567",
            "contactType": "customer service"
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Tech Street",
            "addressLocality": "San Francisco",
            "addressRegion": "CA",
            "postalCode": "94105",
            "addressCountry": "US"
          },
          "sameAs": [
            "https://www.facebook.com/techcorp",
            "https://www.twitter.com/techcorp",
            "https://www.linkedin.com/company/techcorp"
          ]
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(organizationSchema)
      
      expect(result.score).toBeGreaterThanOrEqual(90)
      expect(result.evidence).toContain('Contains high-value schema types')
      expect(result.evidence).toContain('Schemas: Organization')
    })
  })

  describe('Schema Validation Edge Cases', () => {
    it('should handle schemas without @context', () => {
      const noContextSchema = `
        <script type="application/ld+json">
        {
          "@type": "Article",
          "headline": "Article without context"
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(noContextSchema)
      
      expect(result.score).toBeGreaterThanOrEqual(70) // Should still work
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
    })

    it('should handle schemas without @type', () => {
      const noTypeSchema = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "headline": "Schema without type"
        }
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(noTypeSchema)
      
      expect(result.score).toBe(40) // Should get basic JSON-LD points but no schema type points
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
      expect(result.evidence).not.toContain('Schemas:')
    })

    it('should handle empty JSON-LD objects', () => {
      const emptySchema = `
        <script type="application/ld+json">
        {}
        </script>
      `
      
      const result = structuredDataDetector.analyzeStructuredData(emptySchema)
      
      expect(result.score).toBe(40) // Basic JSON-LD detection
      expect(result.evidence).toContain('1 JSON-LD structured data block(s) found')
    })
  })
})

describe('Structured Data Integration with Test Data', () => {
  it('should work with factor-test-sites.json expected ranges', () => {
    // Test against expected ranges from our test data
    const testSites = {
      wellStructured: {
        html: `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Well Structured Documentation",
            "author": {"@type": "Person", "name": "Doc Author"}
          }
          </script>
          <meta property="og:title" content="OG Title">
          <div itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Org Name</span>
          </div>
        `,
        expectedRange: [70, 90] // From factor-test-sites.json
      },
      corporate: {
        html: `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Corporate Site"
          }
          </script>
          <meta property="og:title" content="Corporate Title">
          <meta name="twitter:card" content="summary">
        `,
        expectedRange: [80, 95]
      },
      minimal: {
        html: '<p>Just regular content</p>',
        expectedRange: [0, 20]
      }
    }

    Object.entries(testSites).forEach(([siteType, { html, expectedRange }]) => {
      const result = structuredDataDetector.analyzeStructuredData(html)
      
      expect(result.score).toBeGreaterThanOrEqual(expectedRange[0]) // ${siteType} minimum score
      expect(result.score).toBeLessThanOrEqual(expectedRange[1]) // ${siteType} maximum score
      
      // Validate evidence quality
      expect(result.evidence.length).toBeGreaterThan(0)
      if (result.score === 0) {
        expect(result.recommendations.length).toBeGreaterThan(0)
      }
    })
  })
})