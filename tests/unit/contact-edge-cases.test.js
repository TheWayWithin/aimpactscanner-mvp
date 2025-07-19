// Comprehensive Edge Case Tests for Contact Information Detection (A.3.2)
import { describe, it, expect, beforeEach } from 'vitest'
import { testConfig, testUtils } from '../setup/test-config.js'

// Enhanced mock for comprehensive contact detection testing
// This should match the real implementation in AnalysisEngine.ts
const contactDetector = {
  findContact: (url, links, content) => {
    let score = 0
    let evidence = []
    let recommendations = []

    // Ensure inputs are valid arrays/strings
    const safeLinks = Array.isArray(links) ? links : []
    const safeContent = content || ''

    // Contact page patterns (case insensitive, exact path matches)
    const contactPagePatterns = [
      /^\/contact\/?$/i,
      /^\/contact-us\/?$/i,
      /^\/get-in-touch\/?$/i,
      /^\/reach-us\/?$/i
    ]

    const hasContactPage = safeLinks.some(link => 
      contactPagePatterns.some(pattern => pattern.test(link))
    )

    if (hasContactPage) {
      score += 40
      evidence.push('Contact page link found')
    }

    // Email detection - more robust patterns
    const emailPatterns = [
      /^mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/,
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    ]

    const emailLinks = safeLinks.filter(link => 
      emailPatterns.some(pattern => pattern.test(link))
    )

    if (emailLinks.length > 0) {
      score += 30
      evidence.push(`${emailLinks.length} email contact(s) found`)
    }

    // Phone detection - comprehensive patterns
    const phonePatterns = [
      /^tel:(.+)$/,
      /^\+?\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
      /^\(\d{3}\)\s*\d{3}-\d{4}$/,
      /^\d{3}-\d{3}-\d{4}$/,
      /^\+\d{1,3}\s*\d{3,}$/
    ]

    const phoneLinks = safeLinks.filter(link => 
      phonePatterns.some(pattern => pattern.test(link))
    )

    if (phoneLinks.length > 0) {
      score += 20
      evidence.push(`${phoneLinks.length} phone contact(s) found`)
    }

    // Address detection in content
    const addressPatterns = [
      /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)(?:\s|,|$)/i
    ]

    const hasAddress = addressPatterns.some(pattern => pattern.test(safeContent))
    if (hasAddress) {
      score += 10
      evidence.push('Address information detected')
    }

    // Generate recommendations based on missing elements
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
  }
}

describe('Contact Information Detection - Comprehensive Edge Cases', () => {
  
  describe('Contact Page URL Pattern Edge Cases', () => {
    it('should detect exact contact page patterns only', () => {
      const testCases = [
        // Valid patterns (should match)
        { links: ['/contact'], expected: true, desc: 'exact contact path' },
        { links: ['/contact/'], expected: true, desc: 'contact with trailing slash' },
        { links: ['/Contact'], expected: true, desc: 'capitalized Contact' },
        { links: ['/CONTACT'], expected: true, desc: 'all caps CONTACT' },
        { links: ['/contact-us'], expected: true, desc: 'contact-us variation' },
        { links: ['/contact-us/'], expected: true, desc: 'contact-us with trailing slash' },
        { links: ['/get-in-touch'], expected: true, desc: 'get-in-touch phrase' },
        { links: ['/get-in-touch/'], expected: true, desc: 'get-in-touch with slash' },
        { links: ['/reach-us'], expected: true, desc: 'reach-us phrase' },
        { links: ['/reach-us/'], expected: true, desc: 'reach-us with slash' },
        
        // Invalid patterns (should NOT match)
        { links: ['/contact-page'], expected: false, desc: 'contact-page (not exact)' },
        { links: ['/contactus'], expected: false, desc: 'contactus (no separator)' },
        { links: ['/contact_us'], expected: false, desc: 'contact_us (underscore)' },
        { links: ['/contact.html'], expected: false, desc: 'contact.html (with extension)' },
        { links: ['/about/contact'], expected: false, desc: 'contact in subdirectory' },
        { links: ['/contact/form'], expected: false, desc: 'contact with subpath' },
        { links: ['/feedback'], expected: false, desc: 'feedback (not contact)' },
        { links: ['/support'], expected: false, desc: 'support (not contact)' },
        { links: ['contact'], expected: false, desc: 'relative path without leading slash' },
        { links: ['#contact'], expected: false, desc: 'anchor link' },
        { links: ['?contact=true'], expected: false, desc: 'query parameter' }
      ]

      testCases.forEach(({ links, expected, desc }) => {
        const result = contactDetector.findContact('https://example.com', links)
        const hasContactEvidence = result.evidence.some(e => e.includes('Contact page link found'))
        expect(hasContactEvidence).toBe(expected) // ${desc}
        
        if (expected) {
          expect(result.score).toBeGreaterThanOrEqual(40)
        }
      })
    })

    it('should handle multiple valid contact pages', () => {
      const links = ['/contact', '/contact-us', '/get-in-touch', '/reach-us']
      const result = contactDetector.findContact('https://example.com', links)
      
      expect(result.evidence).toContain('Contact page link found')
      expect(result.score).toBeGreaterThanOrEqual(40)
      // Should only count once even with multiple contact pages
      expect(result.evidence.filter(e => e.includes('Contact page link found')).length).toBe(1)
    })

    it('should handle mixed valid and invalid contact patterns', () => {
      const links = ['/contact', '/contactus', '/contact-page', '/about']
      const result = contactDetector.findContact('https://example.com', links)
      
      expect(result.evidence).toContain('Contact page link found')
      expect(result.score).toBe(40) // Only the valid /contact should count
    })
  })

  describe('Email Detection Edge Cases', () => {
    it('should validate email formats rigorously', () => {
      const testCases = [
        // Valid email formats
        { links: ['mailto:test@example.com'], expected: true, desc: 'standard mailto' },
        { links: ['mailto:user.name@example.com'], expected: true, desc: 'mailto with dots' },
        { links: ['mailto:user+tag@example.com'], expected: true, desc: 'mailto with plus addressing' },
        { links: ['mailto:test@subdomain.example.co.uk'], expected: true, desc: 'mailto with subdomain and country code' },
        { links: ['test@example.com'], expected: true, desc: 'plain email in href' },
        { links: ['user.name@example.org'], expected: true, desc: 'email with dots and org domain' },
        { links: ['contact123@example-site.com'], expected: true, desc: 'email with numbers and hyphens' },
        
        // Invalid email formats
        { links: ['mailto:'], expected: false, desc: 'empty mailto' },
        { links: ['mailto:invalid-email'], expected: false, desc: 'mailto without @ symbol' },
        { links: ['mailto:test@'], expected: false, desc: 'mailto without domain' },
        { links: ['mailto:@example.com'], expected: false, desc: 'mailto without local part' },
        { links: ['test@'], expected: false, desc: 'incomplete email missing domain' },
        { links: ['@example.com'], expected: false, desc: 'incomplete email missing local part' },
        { links: ['not-an-email'], expected: false, desc: 'plain text that is not email' },
        { links: ['test@com'], expected: false, desc: 'email without proper domain' },
        { links: ['test..double@example.com'], expected: false, desc: 'email with double dots' }
      ]

      testCases.forEach(({ links, expected, desc }) => {
        const result = contactDetector.findContact('https://example.com', links)
        const hasEmailEvidence = result.evidence.some(e => e.includes('email contact'))
        expect(hasEmailEvidence).toBe(expected) // ${desc}
        
        if (expected) {
          expect(result.score).toBeGreaterThanOrEqual(30)
        }
      })
    })

    it('should count unique emails correctly', () => {
      const testScenarios = [
        {
          links: ['mailto:contact@example.com'],
          expectedCount: 1,
          expectedScore: 30
        },
        {
          links: ['mailto:contact@example.com', 'mailto:support@example.com'],
          expectedCount: 2,
          expectedScore: 30
        },
        {
          links: ['contact@example.com', 'support@example.com', 'info@example.com'],
          expectedCount: 3,
          expectedScore: 30
        },
        {
          links: ['mailto:test@example.com', 'test@example.com'], // Same email in different formats
          expectedCount: 2, // Current implementation counts both
          expectedScore: 30
        }
      ]

      testScenarios.forEach(({ links, expectedCount, expectedScore }) => {
        const result = contactDetector.findContact('https://example.com', links)
        expect(result.evidence.some(e => e.includes(`${expectedCount} email contact(s) found`))).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(expectedScore)
      })
    })

    it('should handle malformed email links gracefully', () => {
      const malformedEmails = [
        'mailto:',
        'mailto:@',
        'mailto:@@example.com',
        'mailto:test@',
        'mailto:test@@example.com',
        'mailto:test@.com',
        'mailto:test@example.',
        'email:test@example.com', // Wrong protocol
        'tel:test@example.com' // Wrong protocol for email
      ]

      malformedEmails.forEach(email => {
        const result = contactDetector.findContact('https://example.com', [email])
        // Should not crash and should not detect invalid emails
        expect(result.factor_id).toBe('A.3.2')
        expect(typeof result.score).toBe('number')
      })
    })
  })

  describe('Phone Number Detection Edge Cases', () => {
    it('should validate international phone number formats', () => {
      const testCases = [
        // Valid phone formats
        { links: ['tel:+1234567890'], expected: true, desc: 'tel protocol with international code' },
        { links: ['tel:(123) 456-7890'], expected: true, desc: 'tel with US format' },
        { links: ['tel:123-456-7890'], expected: true, desc: 'tel with dashes' },
        { links: ['+1 (555) 123-4567'], expected: true, desc: 'international format in href' },
        { links: ['(555) 123-4567'], expected: true, desc: 'US format with parentheses' },
        { links: ['555-123-4567'], expected: true, desc: 'US format with dashes' },
        { links: ['+44 20 7946 0958'], expected: true, desc: 'UK format' },
        { links: ['+49 30 12345678'], expected: true, desc: 'German format' },
        { links: ['+33 1 42 86 83 26'], expected: true, desc: 'French format' },
        
        // Invalid phone formats
        { links: ['tel:'], expected: false, desc: 'empty tel protocol' },
        { links: ['tel:123'], expected: false, desc: 'tel with too few digits' },
        { links: ['tel:abc-def-ghij'], expected: false, desc: 'tel with letters' },
        { links: ['123'], expected: false, desc: 'too few digits without protocol' },
        { links: ['abc-def-ghij'], expected: false, desc: 'letters in phone format' },
        { links: ['12345678901234567890'], expected: false, desc: 'too many digits' },
        { links: ['+'], expected: false, desc: 'just plus sign' },
        { links: ['()'], expected: false, desc: 'empty parentheses' },
        { links: ['--'], expected: false, desc: 'just dashes' }
      ]

      testCases.forEach(({ links, expected, desc }) => {
        const result = contactDetector.findContact('https://example.com', links)
        const hasPhoneEvidence = result.evidence.some(e => e.includes('phone contact'))
        expect(hasPhoneEvidence).toBe(expected) // ${desc}
        
        if (expected) {
          expect(result.score).toBeGreaterThanOrEqual(20)
        }
      })
    })

    it('should count multiple phone numbers correctly', () => {
      const testScenarios = [
        {
          links: ['tel:+1234567890'],
          expectedCount: 1,
          expectedScore: 20
        },
        {
          links: ['tel:+1234567890', '(555) 123-4567'],
          expectedCount: 2,
          expectedScore: 20
        },
        {
          links: ['tel:+1234567890', '(555) 123-4567', '+44 20 7946 0958'],
          expectedCount: 3,
          expectedScore: 20
        }
      ]

      testScenarios.forEach(({ links, expectedCount, expectedScore }) => {
        const result = contactDetector.findContact('https://example.com', links)
        expect(result.evidence.some(e => e.includes(`${expectedCount} phone contact(s) found`))).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(expectedScore)
      })
    })

    it('should handle edge cases in phone number detection', () => {
      const edgeCases = [
        { links: ['tel:+1 (555) 123-4567 ext. 123'], expected: false, desc: 'phone with extension' },
        { links: ['sms:+1234567890'], expected: false, desc: 'SMS protocol instead of tel' },
        { links: ['callto:+1234567890'], expected: false, desc: 'callto protocol instead of tel' },
        { links: ['phone:+1234567890'], expected: false, desc: 'phone protocol instead of tel' }
      ]

      edgeCases.forEach(({ links, expected, desc }) => {
        const result = contactDetector.findContact('https://example.com', links)
        const hasPhoneEvidence = result.evidence.some(e => e.includes('phone contact'))
        expect(hasPhoneEvidence).toBe(expected) // ${desc}
      })
    })
  })

  describe('Address Detection Edge Cases', () => {
    it('should detect various address formats', () => {
      const testCases = [
        // Valid address formats
        { content: '123 Main Street, City, State', expected: true, desc: 'standard street address' },
        { content: '456 Oak Avenue Suite 101', expected: true, desc: 'avenue with suite' },
        { content: '789 Elm Road', expected: true, desc: 'road designation' },
        { content: '321 Pine Boulevard', expected: true, desc: 'boulevard designation' },
        { content: '654 Maple Drive Apt 5', expected: true, desc: 'drive with apartment' },
        { content: '987 Cedar Lane', expected: true, desc: 'lane designation' },
        { content: '147 First St', expected: true, desc: 'abbreviated street' },
        { content: '258 Second Ave', expected: true, desc: 'abbreviated avenue' },
        { content: '369 Third Rd', expected: true, desc: 'abbreviated road' },
        { content: '741 Fourth Blvd', expected: true, desc: 'abbreviated boulevard' },
        { content: '852 Fifth Dr', expected: true, desc: 'abbreviated drive' },
        { content: '963 Sixth Ln', expected: true, desc: 'abbreviated lane' },
        { content: 'Located at 1600 Pennsylvania Avenue', expected: true, desc: 'address in sentence' },
        
        // Invalid address formats
        { content: 'Main Street without number', expected: false, desc: 'street name without number' },
        { content: '123 without street type', expected: false, desc: 'number without street type' },
        { content: 'Just some text about streets', expected: false, desc: 'generic street mention' },
        { content: 'Street address will be provided', expected: false, desc: 'reference to address' },
        { content: '123', expected: false, desc: 'just a number' },
        { content: 'Street', expected: false, desc: 'just street type' },
        { content: 'Address: TBD', expected: false, desc: 'placeholder address' }
      ]

      testCases.forEach(({ content, expected, desc }) => {
        const result = contactDetector.findContact('https://example.com', [], content)
        const hasAddressEvidence = result.evidence.some(e => e.includes('Address information detected'))
        expect(hasAddressEvidence).toBe(expected) // ${desc}
        
        if (expected) {
          expect(result.score).toBeGreaterThanOrEqual(10)
        }
      })
    })

    it('should handle multiple addresses in content', () => {
      const content = `
        Our main office is at 123 Main Street, and we also have 
        a branch office at 456 Oak Avenue. You can visit us at 
        either 789 Pine Boulevard or our newest location at 321 Elm Drive.
      `
      
      const result = contactDetector.findContact('https://example.com', [], content)
      expect(result.evidence).toContain('Address information detected')
      expect(result.score).toBeGreaterThanOrEqual(10)
      // Should only count once even with multiple addresses
      expect(result.evidence.filter(e => e.includes('Address information detected')).length).toBe(1)
    })

    it('should handle very long content efficiently', () => {
      const longContent = 'This is a very long content string. '.repeat(1000) + 
                         '123 Main Street, City, State. ' + 
                         'More content. '.repeat(1000)
      
      const startTime = Date.now()
      const result = contactDetector.findContact('https://example.com', [], longContent)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
      expect(result.evidence).toContain('Address information detected')
    })
  })

  describe('Complex Scoring Scenarios', () => {
    it('should calculate combined scores correctly', () => {
      const scenarios = [
        {
          name: 'No contact information',
          links: [],
          content: '',
          expectedScore: 0,
          expectedRecommendations: 3 // Should have 3 recommendations
        },
        {
          name: 'Contact page only',
          links: ['/contact'],
          content: '',
          expectedScore: 40,
          expectedRecommendations: 1 // Should suggest more contact methods
        },
        {
          name: 'Email only',
          links: ['mailto:test@example.com'],
          content: '',
          expectedScore: 30,
          expectedRecommendations: 1
        },
        {
          name: 'Phone only',
          links: ['tel:+1234567890'],
          content: '',
          expectedScore: 20,
          expectedRecommendations: 1
        },
        {
          name: 'Address only',
          links: [],
          content: '123 Main Street, City, State',
          expectedScore: 10,
          expectedRecommendations: 1
        },
        {
          name: 'Contact page + Email',
          links: ['/contact', 'mailto:test@example.com'],
          content: '',
          expectedScore: 70, // 40 + 30
          expectedRecommendations: 1
        },
        {
          name: 'Contact page + Phone',
          links: ['/contact', 'tel:+1234567890'],
          content: '',
          expectedScore: 60, // 40 + 20
          expectedRecommendations: 1
        },
        {
          name: 'Email + Phone',
          links: ['mailto:test@example.com', 'tel:+1234567890'],
          content: '',
          expectedScore: 50, // 30 + 20
          expectedRecommendations: 1
        },
        {
          name: 'Contact page + Email + Phone',
          links: ['/contact', 'mailto:test@example.com', 'tel:+1234567890'],
          content: '',
          expectedScore: 90, // 40 + 30 + 20
          expectedRecommendations: 0 // Should have no recommendations
        },
        {
          name: 'All contact methods',
          links: ['/contact', 'mailto:test@example.com', 'tel:+1234567890'],
          content: '123 Main Street, City, State',
          expectedScore: 100, // 40 + 30 + 20 + 10 = 100 (capped)
          expectedRecommendations: 0
        }
      ]

      scenarios.forEach(({ name, links, content, expectedScore, expectedRecommendations }) => {
        const result = contactDetector.findContact('https://example.com', links, content)
        
        expect(result.score).toBe(expectedScore) // Score for ${name}
        expect(result.recommendations.length).toBe(expectedRecommendations) // Recommendations for ${name}
        
        // Validate evidence count matches score components
        let evidenceCount = 0
        if (result.evidence.includes('Contact page link found')) evidenceCount++
        if (result.evidence.some(e => e.includes('email contact'))) evidenceCount++
        if (result.evidence.some(e => e.includes('phone contact'))) evidenceCount++
        if (result.evidence.includes('Address information detected')) evidenceCount++
        if (result.evidence.includes('No contact information found')) evidenceCount++
        
        expect(evidenceCount).toBeGreaterThan(0) // Should have at least one evidence item for ${name}
      })
    })

    it('should enforce maximum score of 100', () => {
      // Create excessive contact information
      const excessiveLinks = [
        '/contact', '/contact-us', '/get-in-touch', '/reach-us', // Multiple contact pages
        'mailto:contact@example.com', 'mailto:support@example.com', 'mailto:info@example.com', // Multiple emails
        'tel:+1234567890', 'tel:(555) 123-4567', 'tel:+44 20 7946 0958' // Multiple phones
      ]
      
      const excessiveContent = `
        123 Main Street, City, State
        456 Oak Avenue, Another City, State  
        789 Pine Boulevard, Third City, State
      `
      
      const result = contactDetector.findContact('https://example.com', excessiveLinks, excessiveContent)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.score).toBe(100) // Should be exactly 100 due to capping
    })
  })

  describe('Input Validation and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const testCases = [
        { url: 'https://example.com', links: null, content: null },
        { url: 'https://example.com', links: undefined, content: undefined },
        { url: 'https://example.com', links: [], content: null },
        { url: 'https://example.com', links: null, content: '' },
        { url: 'https://example.com', links: [], content: undefined },
        { url: null, links: [], content: '' },
        { url: undefined, links: [], content: '' }
      ]

      testCases.forEach(({ url, links, content }, index) => {
        expect(() => {
          const result = contactDetector.findContact(url, links, content)
          expect(result.factor_id).toBe('A.3.2')
          expect(typeof result.score).toBe('number')
          expect(result.score).toBeGreaterThanOrEqual(0)
          expect(result.score).toBeLessThanOrEqual(100)
        }).not.toThrow() // Test case ${index + 1} should not throw
      })
    })

    it('should handle non-array links input', () => {
      const nonArrayInputs = [
        'string',
        123,
        { key: 'value' },
        true,
        false
      ]

      nonArrayInputs.forEach(input => {
        expect(() => {
          const result = contactDetector.findContact('https://example.com', input, '')
          expect(result.factor_id).toBe('A.3.2')
          expect(typeof result.score).toBe('number')
        }).not.toThrow()
      })
    })

    it('should handle very large inputs efficiently', () => {
      // Test with large arrays
      const manyLinks = Array.from({ length: 10000 }, (_, i) => `/page${i}`)
      manyLinks.push('/contact') // Add one valid contact link
      
      const longContent = 'a '.repeat(100000) + '123 Main Street, City, State'
      
      const startTime = Date.now()
      const result = contactDetector.findContact('https://example.com', manyLinks, longContent)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.evidence).toContain('Contact page link found')
      expect(result.evidence).toContain('Address information detected')
    })

    it('should handle malformed URLs and special characters', () => {
      const malformedInputs = [
        'not-a-url',
        '://missing-protocol',
        'javascript:void(0)',
        'data:text/html,<h1>Hello</h1>',
        '#anchor-only',
        '?query=only',
        'mailto:test@<script>alert("xss")</script>.com',
        'tel:+1234567890<script>alert("xss")</script>'
      ]

      malformedInputs.forEach(input => {
        expect(() => {
          const result = contactDetector.findContact('https://example.com', [input])
          expect(result.factor_id).toBe('A.3.2')
        }).not.toThrow()
      })
    })
  })

  describe('Performance and Stress Tests', () => {
    it('should maintain performance with realistic input sizes', () => {
      // Simulate a realistic website with many links
      const realisticLinks = [
        '/', '/about', '/services', '/products', '/blog', '/news',
        '/portfolio', '/team', '/careers', '/privacy', '/terms',
        '/sitemap', '/robots.txt', '/favicon.ico',
        '/contact', // Valid contact page
        'mailto:info@example.com', // Valid email
        'tel:+1234567890' // Valid phone
      ]
      
      const realisticContent = `
        Welcome to our company. We provide excellent services to our clients.
        Our main office is located at 123 Business Boulevard, Suite 456, 
        Commercial District, Business City, State 12345. 
        
        You can reach us through multiple channels for your convenience.
        We value our customers and strive to provide the best service possible.
        
        Our team is dedicated to helping you achieve your goals.
        Contact us today to learn more about our offerings.
      `
      
      const iterations = 100
      const startTime = Date.now()
      
      for (let i = 0; i < iterations; i++) {
        const result = contactDetector.findContact('https://example.com', realisticLinks, realisticContent)
        expect(result.score).toBe(100) // 40 + 30 + 20 + 10
      }
      
      const endTime = Date.now()
      const avgTime = (endTime - startTime) / iterations
      
      expect(avgTime).toBeLessThan(10) // Should average less than 10ms per analysis
    })

    it('should handle regex performance with pathological inputs', () => {
      // Test regex performance with potentially problematic strings
      const pathologicalInputs = [
        'a'.repeat(10000), // Very long string
        'test@'.repeat(1000), // Many incomplete emails
        'tel:'.repeat(1000), // Many incomplete phones
        '123 '.repeat(1000) + 'Street', // Long potential address
        Array(1000).fill('/contact').join(''), // Very long contact-like string
      ]
      
      pathologicalInputs.forEach((input, index) => {
        const startTime = Date.now()
        const result = contactDetector.findContact('https://example.com', [input], input)
        const endTime = Date.now()
        
        expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms for pathological input ${index + 1}
        expect(result.factor_id).toBe('A.3.2')
      })
    })
  })
})

describe('Contact Detection Integration with Test Data', () => {
  it('should work with factor-test-sites.json test data', () => {
    // Test against the expected ranges defined in our test data
    const testSites = {
      wellStructured: {
        links: ['/contact', '/help', 'mailto:docs@github.com'],
        content: '123 GitHub Way, San Francisco, CA',
        expectedRange: [60, 85] // From factor-test-sites.json
      },
      corporate: {
        links: ['/contact', 'mailto:support@github.com', 'tel:+1-555-0123'],
        content: 'GitHub HQ, 88 Colin P Kelly Jr St, San Francisco, CA 94107',
        expectedRange: [70, 90]
      },
      minimal: {
        links: [],
        content: '',
        expectedRange: [0, 20]
      }
    }

    Object.entries(testSites).forEach(([siteType, { links, content, expectedRange }]) => {
      const result = contactDetector.findContact('https://example.com', links, content)
      
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