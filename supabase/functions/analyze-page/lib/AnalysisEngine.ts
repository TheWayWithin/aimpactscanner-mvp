// Analysis Engine for AImpactScanner MVP
// Implements Phase A factors using Puppeteer for real analysis

export interface FactorResult {
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
  cache_hit?: boolean;
}

export interface AnalysisResult {
  factors: FactorResult[];
  overall_score: number;
  processing_time_ms: number;
  success: boolean;
  error?: string;
}

export class AnalysisEngine {
  constructor() {}

  // Fetch webpage data for analysis
  private async fetchPageData(url: string): Promise<{title: string, metaDescription: string, content: string}> {
    try {
      console.log(`📥 Fetching page data for: ${url}`);
      
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
      const metaMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']*)["\'][^>]*>/i);
      const metaDescription = metaMatch ? metaMatch[1].trim() : '';
      
      // Extract basic content (simplified)
      const content = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      console.log(`✅ Page data extracted - Title: "${title.substring(0, 50)}...", Meta: "${metaDescription.substring(0, 50)}..."`);
      
      return { title, metaDescription, content };
      
    } catch (error) {
      console.error(`❌ Failed to fetch page data: ${error.message}`);
      // Return empty data on fetch failure
      return { title: '', metaDescription: '', content: '' };
    }
  }

  // Phase A: Instant Analysis (4 factors initially, <15 seconds)
  async analyzeInstantFactors(url: string, progressCallback?: (stage: string, progress: number, message: string, educationalContent: string) => Promise<void>): Promise<AnalysisResult> {
    const startTime = Date.now();
    const factors: FactorResult[] = [];
    
    // Helper function for progress updates
    const updateProgress = async (factorNumber: number, factorName: string, educationalContent: string) => {
      if (progressCallback) {
        const progress = Math.round((factorNumber / 10) * 80) + 10; // 10% start + 80% for factors
        await progressCallback(
          `analyzing_${factorName.toLowerCase().replace(/\s+/g, '_')}`,
          progress,
          `Analyzing: ${factorName}`,
          educationalContent
        );
        // Longer delay to ensure progress update is visible to frontend
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };
    
    try {
      console.log(`🔍 Starting instant analysis for: ${url}`);
      console.log(`📞 Progress callback available: ${!!progressCallback}`);
      
      // Fetch the webpage content for analysis
      const pageData = await this.fetchPageData(url);
      
      // Factor 1: HTTPS Security (AI.1.1) - Protocol analysis
      console.log('🔍 Starting Factor 1: HTTPS Security');
      await updateProgress(1, 'HTTPS Security', 'Checking if your site uses secure HTTPS protocol - essential for AI search rankings and user trust.');
      const httpsResult = await this.analyzeHTTPS(url);
      factors.push(httpsResult);
      console.log('✅ Completed Factor 1: HTTPS Security');
      
      // Factor 2: Title Optimization (AI.1.2) - Content analysis
      await updateProgress(2, 'Title Optimization', 'Analyzing your page title for length, keywords, and AI search optimization best practices.');
      const titleResult = await this.analyzeTitle(pageData.title);
      factors.push(titleResult);
      
      // Factor 3: Meta Description (AI.1.3) - Content analysis  
      await updateProgress(3, 'Meta Description Quality', 'Evaluating your meta description for search snippet optimization and user engagement factors.');
      const metaResult = await this.analyzeMetaDescription(pageData.metaDescription);
      factors.push(metaResult);
      
      // Factor 4: Author Information (A.2.1) - Content analysis
      await updateProgress(4, 'Author Information', 'Detecting author bylines and credibility signals that establish expertise and trustworthiness.');
      const authorResult = await this.analyzeAuthor(pageData.content);
      factors.push(authorResult);
      
      // Factor 5: Contact Information (A.3.2) - Content analysis
      await updateProgress(5, 'Contact Information', 'Scanning for contact methods (email, phone, address) that build trust and authority signals.');
      const contactResult = await this.analyzeContact(url, pageData.content);
      factors.push(contactResult);
      
      // Factor 6: Heading Hierarchy (S.1.1) - Content analysis
      await updateProgress(6, 'Heading Hierarchy', 'Analyzing your heading structure (H1-H6) for semantic organization and content accessibility.');
      const headingsResult = await this.analyzeHeadings(pageData.content);
      factors.push(headingsResult);
      
      // Factor 7: Structured Data Detection (AI.2.1) - Content analysis
      await updateProgress(7, 'Structured Data', 'Checking for JSON-LD, microdata, and schema markup that helps AI understand your content.');
      const structuredDataResult = await this.analyzeStructuredData(pageData.content);
      factors.push(structuredDataResult);
      
      // Factor 8: FAQ Schema Analysis (AI.2.3) - Content analysis
      await updateProgress(8, 'FAQ Content', 'Identifying question-answer patterns and FAQ structured data for enhanced AI comprehension.');
      const faqResult = await this.analyzeFAQ(pageData.content);
      factors.push(faqResult);
      
      // Factor 9: Image Alt Text Analysis (M.2.3) - Content analysis
      await updateProgress(9, 'Image Accessibility', 'Evaluating image alt text coverage and quality for accessibility and AI image understanding.');
      const imageResult = await this.analyzeImages(pageData.content);
      factors.push(imageResult);
      
      // Factor 10: Word Count Analysis (S.3.1) - Content analysis
      await updateProgress(10, 'Content Depth', 'Analyzing content length, readability, and depth for comprehensive topic coverage.');
      const wordCountResult = await this.analyzeWordCount(pageData.content);
      factors.push(wordCountResult);
      
      // Calculate overall score
      const overall_score = this.calculateOverallScore(factors);
      const processing_time_ms = Date.now() - startTime;
      
      console.log(`✅ Phase A analysis completed in ${processing_time_ms}ms`);
      console.log(`📊 Analyzed ${factors.length}/10 factors with overall score: ${overall_score}`);
      
      return {
        factors,
        overall_score,
        processing_time_ms,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Instant analysis failed:', error);
      return {
        factors,
        overall_score: 0,
        processing_time_ms: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  // Factor Implementation: HTTPS Security (AI.1.1)
  private async analyzeHTTPS(url: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      // Simple URL protocol check
      const isHTTPS = url.startsWith('https://');
      const score = isHTTPS ? 100 : 0;
      const confidence = 100; // We can be 100% confident about protocol
      
      const evidence = [
        isHTTPS ? 'Site uses HTTPS protocol' : 'Site uses HTTP protocol',
        isHTTPS ? 'Secure connection established' : 'Insecure connection detected'
      ];
      
      const recommendations = isHTTPS ? [] : [
        'Enable HTTPS for improved security and SEO',
        'Configure SSL/TLS certificate',
        'Implement HTTP to HTTPS redirects'
      ];
      
      return {
        factor_id: 'AI.1.1',
        factor_name: 'HTTPS Security',
        pillar: 'AI',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('HTTPS analysis failed:', error);
      
      // Fallback result for errors
      return {
        factor_id: 'AI.1.1',
        factor_name: 'HTTPS Security',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing HTTPS: ${error.message}`],
        recommendations: ['Unable to analyze HTTPS - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Calculate overall score from factors
  private calculateOverallScore(factors: FactorResult[]): number {
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

  // Factor Implementation: Title Optimization (AI.1.2)
  private async analyzeTitle(title: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 100;
      const evidence = [];
      const recommendations = [];
      
      if (!title) {
        score = 0;
        evidence.push('No title tag found');
        recommendations.push('Add a descriptive title tag to improve SEO');
        recommendations.push('Keep title between 50-60 characters for optimal display');
      } else {
        const length = title.length;
        evidence.push(`Title length: ${length} characters`);
        evidence.push(`Title: "${title}"`);
        
        // Length scoring (optimal: 50-60 chars)
        if (length >= 50 && length <= 60) {
          score += 40; // Optimal length
          evidence.push('Title length is optimal for search results');
        } else if (length >= 40 && length <= 70) {
          score += 30; // Good length
          evidence.push('Title length is acceptable');
        } else if (length >= 30 && length <= 80) {
          score += 20; // Okay length
          evidence.push('Title length could be optimized');
          if (length < 40) recommendations.push('Consider making title longer for better keyword coverage');
          if (length > 70) recommendations.push('Consider shortening title to prevent truncation in search results');
        } else {
          score += 10; // Poor length
          evidence.push('Title length is not optimal');
          if (length < 30) recommendations.push('Title is too short - add more descriptive keywords');
          if (length > 80) recommendations.push('Title is too long - will be truncated in search results');
        }
        
        // Content quality scoring
        const hasNumbers = /\d/.test(title);
        const hasSpecialChars = /[|•·→←↑↓★☆✓✗⚡🔥💡📈📊⭐]/.test(title);
        const wordCount = title.split(/\s+/).length;
        const hasCommonWords = /\b(how|what|why|best|guide|tips|complete|ultimate|2024|2025)\b/i.test(title);
        
        if (wordCount >= 4 && wordCount <= 12) {
          score += 20;
          evidence.push('Good word count for readability');
        } else {
          score += 10;
          if (wordCount < 4) recommendations.push('Add more descriptive words to title');
          if (wordCount > 12) recommendations.push('Simplify title for better readability');
        }
        
        if (hasNumbers) {
          score += 15;
          evidence.push('Includes numbers for specificity');
        }
        
        if (hasSpecialChars) {
          score += 10;
          evidence.push('Uses engaging special characters');
        }
        
        if (hasCommonWords) {
          score += 15;
          evidence.push('Contains high-value keywords');
        }
        
        // Cap at 100
        score = Math.min(score, 100);
        
        if (score >= 80) {
          evidence.push('Excellent title optimization');
        } else if (score >= 60) {
          evidence.push('Good title, minor improvements possible');
          recommendations.push('Consider adding numbers or power words for better engagement');
        } else if (score >= 40) {
          evidence.push('Average title, several improvements needed');
          recommendations.push('Optimize title length and add engaging elements');
        } else {
          evidence.push('Title needs significant optimization');
          recommendations.push('Rewrite title with proper length and engaging keywords');
        }
      }
      
      return {
        factor_id: 'AI.1.2',
        factor_name: 'Title Optimization',
        pillar: 'AI',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Title analysis failed:', error);
      
      return {
        factor_id: 'AI.1.2',
        factor_name: 'Title Optimization',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing title: ${error.message}`],
        recommendations: ['Unable to analyze title - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Meta Description (AI.1.3)
  private async analyzeMetaDescription(metaDescription: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 100;
      const evidence = [];
      const recommendations = [];
      
      if (!metaDescription) {
        score = 0;
        evidence.push('No meta description found');
        recommendations.push('Add a meta description between 150-160 characters');
        recommendations.push('Include target keywords and call-to-action');
      } else {
        const length = metaDescription.length;
        evidence.push(`Meta description length: ${length} characters`);
        evidence.push(`Meta description: "${metaDescription}"`);
        
        // Length scoring (optimal: 150-160 chars)
        if (length >= 150 && length <= 160) {
          score += 50; // Optimal length
          evidence.push('Meta description length is optimal');
        } else if (length >= 140 && length <= 170) {
          score += 40; // Good length
          evidence.push('Meta description length is good');
        } else if (length >= 120 && length <= 180) {
          score += 30; // Acceptable length
          evidence.push('Meta description length is acceptable');
          if (length < 140) recommendations.push('Consider expanding meta description for better keyword coverage');
          if (length > 160) recommendations.push('Consider shortening to prevent truncation in search results');
        } else {
          score += 15; // Poor length
          evidence.push('Meta description length needs optimization');
          if (length < 120) recommendations.push('Meta description is too short - expand with more details');
          if (length > 180) recommendations.push('Meta description is too long - will be truncated');
        }
        
        // Content quality analysis
        const wordCount = metaDescription.split(/\s+/).length;
        const hasCallToAction = /\b(learn|discover|find|get|download|read|explore|see|try|start|join|visit|click)\b/i.test(metaDescription);
        const hasNumbers = /\d/.test(metaDescription);
        const hasQuestionWords = /\b(how|what|why|when|where|who)\b/i.test(metaDescription);
        const endsWithPunctuation = /[.!?]$/.test(metaDescription.trim());
        
        if (wordCount >= 20 && wordCount <= 30) {
          score += 20;
          evidence.push('Good word count for meta description');
        } else {
          score += 10;
          if (wordCount < 20) recommendations.push('Add more descriptive content to meta description');
          if (wordCount > 30) recommendations.push('Simplify meta description for better readability');
        }
        
        if (hasCallToAction) {
          score += 15;
          evidence.push('Contains call-to-action words');
        } else {
          recommendations.push('Add call-to-action words to encourage clicks');
        }
        
        if (hasNumbers) {
          score += 10;
          evidence.push('Includes specific numbers or data');
        }
        
        if (hasQuestionWords) {
          score += 5;
          evidence.push('Uses question words for engagement');
        }
        
        if (endsWithPunctuation) {
          score += 5;
          evidence.push('Properly punctuated');
        } else {
          recommendations.push('End meta description with proper punctuation');
        }
        
        // Cap at 100
        score = Math.min(score, 100);
        
        if (score >= 85) {
          evidence.push('Excellent meta description optimization');
        } else if (score >= 70) {
          evidence.push('Good meta description, minor improvements possible');
        } else if (score >= 50) {
          evidence.push('Average meta description, several improvements needed');
        } else {
          evidence.push('Meta description needs significant optimization');
          recommendations.push('Rewrite meta description with proper length and engaging content');
        }
      }
      
      return {
        factor_id: 'AI.1.3',
        factor_name: 'Meta Description',
        pillar: 'AI',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Meta description analysis failed:', error);
      
      return {
        factor_id: 'AI.1.3',
        factor_name: 'Meta Description',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing meta description: ${error.message}`],
        recommendations: ['Unable to analyze meta description - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Author Information (A.2.1)
  private async analyzeAuthor(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 90;
      const evidence = [];
      const recommendations = [];
      
      // Author detection patterns
      const authorPatterns = [
        /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /author[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /written\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /created\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /@([A-Za-z][A-Za-z0-9_]+)/g, // Social handles
      ];
      
      const foundAuthors = new Set();
      
      for (const pattern of authorPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            const author = match[1].trim();
            // Filter out common false positives
            if (!author.match(/^(the|and|or|but|with|from|about|news|blog|post|article|page|site|home|contact|login|register)$/i)) {
              foundAuthors.add(author);
            }
          }
        }
      }
      
      const authorCount = foundAuthors.size;
      
      if (authorCount === 0) {
        score = 0;
        evidence.push('No author information detected');
        recommendations.push('Add clear author bylines to establish credibility');
        recommendations.push('Include author bio or credentials');
        recommendations.push('Consider adding "About the Author" section');
      } else {
        evidence.push(`Found ${authorCount} potential author(s): ${Array.from(foundAuthors).join(', ')}`);
        
        // Base score for having author information
        score += 40;
        
        // Bonus for multiple authors (collaborative content)
        if (authorCount > 1) {
          score += 15;
          evidence.push('Multiple authors detected - good for collaborative authority');
        }
        
        // Check for additional author indicators
        const hasAuthorBio = /author bio|about the author|biography|credentials|expertise/i.test(content);
        const hasAuthorLinks = /author profile|author page|more by|other articles/i.test(content);
        const hasExpertise = /expert|specialist|certified|phd|md|professor|director|founder|ceo/i.test(content);
        const hasContact = /contact|email|twitter|linkedin|social/i.test(content);
        
        if (hasAuthorBio) {
          score += 20;
          evidence.push('Author bio or credentials found');
        } else {
          recommendations.push('Add author bio to establish expertise');
        }
        
        if (hasAuthorLinks) {
          score += 15;
          evidence.push('Author profile links detected');
        } else {
          recommendations.push('Link to author profile or other articles');
        }
        
        if (hasExpertise) {
          score += 15;
          evidence.push('Author expertise indicators found');
        }
        
        if (hasContact) {
          score += 10;
          evidence.push('Author contact information available');
        } else {
          recommendations.push('Provide author contact or social media links');
        }
        
        // Cap at 100
        score = Math.min(score, 100);
        
        if (score >= 80) {
          evidence.push('Excellent author information and credibility');
        } else if (score >= 60) {
          evidence.push('Good author presence, minor improvements possible');
        } else if (score >= 40) {
          evidence.push('Basic author information present');
        }
      }
      
      return {
        factor_id: 'A.2.1',
        factor_name: 'Author Information',
        pillar: 'A',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Author analysis failed:', error);
      
      return {
        factor_id: 'A.2.1',
        factor_name: 'Author Information',
        pillar: 'A',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing author information: ${error.message}`],
        recommendations: ['Unable to analyze author information - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Contact Information Detection (A.3.2)
  private async analyzeContact(url: string, content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 80;
      const evidence = [];
      const recommendations = [];
      
      // Extract links from content (simple approach for MVP)
      const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
      const links = [];
      let linkMatch;
      while ((linkMatch = linkPattern.exec(content)) !== null) {
        links.push(linkMatch[1]);
      }
      
      // Check for contact page links
      const contactPagePatterns = [
        /\/contact\/?$/i,
        /\/contact-us\/?$/i,
        /\/get-in-touch\/?$/i,
        /\/reach-us\/?$/i,
        /\/about\/?$/i
      ];
      
      const hasContactPage = links.some(link => 
        contactPagePatterns.some(pattern => pattern.test(link))
      );
      
      if (hasContactPage) {
        score += 40;
        evidence.push('Contact page link found');
      }
      
      // Check for email links and addresses
      const emailPattern = /(?:mailto:|[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})/gi;
      const emailMatches = content.match(emailPattern);
      
      if (emailMatches && emailMatches.length > 0) {
        score += 30;
        evidence.push(`${emailMatches.length} email contact(s) found`);
      }
      
      // Check for phone numbers
      const phonePatterns = [
        /tel:[+\d\-\(\)\s]+/gi,
        /\(\d{3}\)\s*\d{3}-\d{4}/g,
        /\d{3}-\d{3}-\d{4}/g,
        /\+\d{1,3}\s*\d{3,}/g
      ];
      
      let phoneCount = 0;
      for (const pattern of phonePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          phoneCount += matches.length;
        }
      }
      
      if (phoneCount > 0) {
        score += 20;
        evidence.push(`${phoneCount} phone contact(s) found`);
      }
      
      // Check for physical address indicators
      const addressPatterns = [
        /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/i,
        /\d{5}(?:-\d{4})?/g // ZIP codes
      ];
      
      const hasAddress = addressPatterns.some(pattern => pattern.test(content));
      if (hasAddress) {
        score += 10;
        evidence.push('Address information detected');
      }
      
      // Provide recommendations based on score
      if (score === 0) {
        evidence.push('No contact information found');
        recommendations.push('Add a contact page to improve trust signals');
        recommendations.push('Include email contact information');
        recommendations.push('Consider adding phone number for direct contact');
        recommendations.push('Add physical address if applicable to business');
      } else if (score < 60) {
        recommendations.push('Add more contact methods for better accessibility');
        recommendations.push('Ensure contact information is easy to find');
      } else {
        evidence.push('Good contact information coverage');
      }
      
      return {
        factor_id: 'A.3.2',
        factor_name: 'Contact Information',
        pillar: 'A',
        phase: 'instant',
        score: Math.min(score, 100),
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Contact analysis failed:', error);
      
      return {
        factor_id: 'A.3.2',
        factor_name: 'Contact Information',
        pillar: 'A',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing contact information: ${error.message}`],
        recommendations: ['Unable to analyze contact information - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Heading Hierarchy Analysis (S.1.1)
  private async analyzeHeadings(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 90;
      const evidence = [];
      const recommendations = [];
      
      // Extract headings from HTML content
      const headingPattern = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
      const headings = [];
      let headingMatch;
      
      while ((headingMatch = headingPattern.exec(content)) !== null) {
        headings.push({
          level: parseInt(headingMatch[1]),
          text: headingMatch[2].replace(/<[^>]*>/g, '').trim(),
          wordCount: headingMatch[2].replace(/<[^>]*>/g, '').trim().split(/\s+/).length
        });
      }
      
      if (headings.length === 0) {
        return {
          factor_id: 'S.1.1',
          factor_name: 'Heading Hierarchy',
          pillar: 'S',
          phase: 'instant',
          score: 0,
          confidence: 100,
          weight: 1.0,
          evidence: ['No headings found on page'],
          recommendations: [
            'Add proper heading structure (H1, H2, H3) to organize content',
            'Use H1 for main topic, H2 for sections, H3 for subsections',
            'Include keywords naturally in headings'
          ],
          processing_time_ms: Date.now() - startTime
        };
      }
      
      // Check for H1
      const h1Count = headings.filter(h => h.level === 1).length;
      if (h1Count === 1) {
        score += 25;
        evidence.push('Single H1 tag found (optimal)');
      } else if (h1Count > 1) {
        score += 10;
        evidence.push(`${h1Count} H1 tags found (should be 1)`);
        recommendations.push('Use only one H1 tag per page for best SEO');
      } else {
        recommendations.push('Add an H1 tag for the main page topic');
      }
      
      // Check hierarchy logic
      let hierarchyScore = 0;
      let lastLevel = 0;
      let hierarchyBreaks = 0;
      
      for (const heading of headings) {
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
        evidence.push('Proper heading hierarchy maintained');
      } else {
        hierarchyScore = Math.max(0, 25 - (hierarchyBreaks * 5));
        evidence.push(`${hierarchyBreaks} hierarchy breaks found`);
        recommendations.push('Fix heading hierarchy (don\'t skip levels, e.g., H1→H3)');
      }
      score += hierarchyScore;
      
      // Check heading content quality
      const avgWordCount = headings.reduce((sum, h) => sum + h.wordCount, 0) / headings.length;
      if (avgWordCount >= 2 && avgWordCount <= 8) {
        score += 25;
        evidence.push('Headings have appropriate length');
      } else if (avgWordCount < 2) {
        score += 10;
        recommendations.push('Make headings more descriptive (2-8 words ideal)');
      } else {
        score += 15;
        recommendations.push('Shorten headings for better scannability');
      }
      
      // Check for content structure
      const totalHeadings = headings.length;
      if (totalHeadings >= 3) {
        score += 25;
        evidence.push(`${totalHeadings} headings provide good content structure`);
      } else {
        score += 10;
        recommendations.push('Add more headings to improve content structure');
      }
      
      evidence.unshift(`Heading structure: ${headings.map(h => `H${h.level}`).join(', ')}`);
      
      return {
        factor_id: 'S.1.1',
        factor_name: 'Heading Hierarchy',
        pillar: 'S',
        phase: 'instant',
        score: Math.min(score, 100),
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Heading analysis failed:', error);
      
      return {
        factor_id: 'S.1.1',
        factor_name: 'Heading Hierarchy',
        pillar: 'S',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing headings: ${error.message}`],
        recommendations: ['Unable to analyze heading structure - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Structured Data Detection (AI.2.1)
  private async analyzeStructuredData(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 70;
      const evidence = [];
      const recommendations = [];
      
      // Extract JSON-LD structured data
      const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
      let jsonLdData = [];
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const scriptContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            const parsed = JSON.parse(scriptContent);
            jsonLdData.push(parsed);
          } catch (e) {
            evidence.push('⚠ Invalid JSON-LD found');
          }
        }
      }
      
      if (jsonLdData.length > 0) {
        score += 40;
        confidence = 95;
        evidence.push(`${jsonLdData.length} JSON-LD structured data block(s) found`);
        
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
        const valuableSchemas = ['Article', 'BlogPosting', 'Person', 'Organization', 'WebSite', 'FAQPage', 'Product', 'Event'];
        const hasValuableSchema = uniqueSchemas.some(schema => valuableSchemas.includes(schema));
        if (hasValuableSchema) {
          score += 20;
          evidence.push('Contains high-value schema types');
        }
      }
      
      // Check for microdata
      const microdataPattern = /itemscope|itemtype|itemprop/i;
      if (microdataPattern.test(content)) {
        score += 10;
        evidence.push('Microdata markup detected');
      }
      
      // Check for RDFa
      const rdfaPattern = /typeof=|property=|resource=/i;
      if (rdfaPattern.test(content)) {
        score += 5;
        evidence.push('RDFa markup detected');
      }
      
      // Check for OpenGraph tags
      const ogPattern = /<meta[^>]*property=["']og:[^"']*["'][^>]*>/i;
      if (ogPattern.test(content)) {
        score += 5;
        evidence.push('OpenGraph metadata detected');
      }
      
      // Check for Twitter Card tags
      const twitterPattern = /<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/i;
      if (twitterPattern.test(content)) {
        score += 5;
        evidence.push('Twitter Card metadata detected');
      }
      
      // Provide recommendations based on score
      if (score === 0) {
        evidence.push('No structured data found');
        recommendations.push('Add JSON-LD structured data to help AI understand your content');
        recommendations.push('Implement Article or BlogPosting schema for content pages');
        recommendations.push('Add Organization schema for business information');
        recommendations.push('Consider FAQPage schema for question-answer content');
      } else if (score < 70) {
        recommendations.push('Expand structured data with additional relevant schemas');
        recommendations.push('Ensure all structured data is valid and complete');
        recommendations.push('Add OpenGraph and Twitter Card metadata for social sharing');
      } else {
        evidence.push('Excellent structured data implementation');
      }
      
      return {
        factor_id: 'AI.2.1',
        factor_name: 'Structured Data Detection',
        pillar: 'AI',
        phase: 'instant',
        score: Math.min(score, 100),
        confidence,
        weight: 1.0,
        evidence: evidence.length ? evidence : ['No structured data found'],
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Structured data analysis failed:', error);
      
      return {
        factor_id: 'AI.2.1',
        factor_name: 'Structured Data Detection',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing structured data: ${error.message}`],
        recommendations: ['Unable to analyze structured data - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: FAQ Schema Analysis (AI.2.3)
  private async analyzeFAQ(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 85;
      const evidence = [];
      const recommendations = [];
      
      // Extract JSON-LD structured data for FAQ analysis
      const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
      let structuredData = [];
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const scriptContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            const parsed = JSON.parse(scriptContent);
            structuredData.push(parsed);
          } catch (e) {
            // Ignore invalid JSON-LD for FAQ analysis
          }
        }
      }
      
      // Check for FAQ schema in structured data
      const faqSchema = structuredData.find(item => item['@type'] === 'FAQPage');
      if (faqSchema) {
        score += 50;
        evidence.push('FAQPage schema detected');
        
        if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity)) {
          const questionCount = faqSchema.mainEntity.length;
          score += 30;
          evidence.push(`${questionCount} structured questions found`);
          
          if (questionCount >= 3) {
            score += 20;
            evidence.push('Comprehensive FAQ content');
          }
        }
      }
      
      // Check for Question schema
      const questionSchemas = structuredData.filter(item => item['@type'] === 'Question');
      if (questionSchemas.length > 0) {
        score += 25;
        evidence.push(`${questionSchemas.length} Question schema(s) found`);
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
        const matches = content.match(pattern);
        if (matches) {
          htmlFaqScore += 10;
          evidence.push(`FAQ pattern detected (${matches.length} instances)`);
        }
      }
      score += Math.min(htmlFaqScore, 30);
      
      // Check for question words
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who'];
      const questionPattern = new RegExp(`\\b(${questionWords.join('|')})\\b.*\\?`, 'gi');
      const questionMatches = content.match(questionPattern);
      
      if (questionMatches && questionMatches.length >= 3) {
        score += 20;
        evidence.push(`${questionMatches.length} question patterns in content`);
      } else if (questionMatches && questionMatches.length > 0) {
        score += 10;
        evidence.push(`${questionMatches.length} question pattern(s) in content`);
      }
      
      // Provide recommendations based on score
      if (score === 0) {
        evidence.push('No FAQ content detected');
        recommendations.push('Add FAQ section to address common user questions');
        recommendations.push('Implement FAQPage structured data for better AI understanding');
        recommendations.push('Include question-answer pairs relevant to your content');
        recommendations.push('Use clear question formats (What, Why, How, etc.)');
      } else if (score < 70) {
        recommendations.push('Expand FAQ content with more comprehensive questions');
        recommendations.push('Add structured data markup for existing FAQ content');
        recommendations.push('Ensure answers are detailed and helpful');
      } else {
        evidence.push('Excellent FAQ implementation');
      }
      
      return {
        factor_id: 'AI.2.3',
        factor_name: 'FAQ Schema Analysis',
        pillar: 'AI',
        phase: 'instant',
        score: Math.min(score, 100),
        confidence,
        weight: 1.0,
        evidence: evidence.length ? evidence : ['No FAQ content detected'],
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('FAQ analysis failed:', error);
      
      return {
        factor_id: 'AI.2.3',
        factor_name: 'FAQ Schema Analysis',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing FAQ content: ${error.message}`],
        recommendations: ['Unable to analyze FAQ content - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Image Alt Text Analysis (M.2.3)
  private async analyzeImages(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 90;
      const evidence = [];
      const recommendations = [];
      
      // Extract images from HTML content
      const imagePattern = /<img[^>]*>/gi;
      const imageMatches = content.match(imagePattern) || [];
      
      if (imageMatches.length === 0) {
        return {
          factor_id: 'M.2.3',
          factor_name: 'Image Alt Text Analysis',
          pillar: 'M',
          phase: 'instant',
          score: 100, // No images means no accessibility issues
          confidence: 100,
          weight: 1.0,
          evidence: ['No images found on page'],
          recommendations: [],
          processing_time_ms: Date.now() - startTime
        };
      }
      
      const totalImages = imageMatches.length;
      let imagesWithAlt = 0;
      let decorativeImages = 0;
      let totalAltLength = 0;
      let suspiciousAlt = 0;
      
      for (const img of imageMatches) {
        const altMatch = img.match(/alt=["']([^"']*)["']/i);
        if (altMatch) {
          const altText = altMatch[1];
          if (altText === '') {
            decorativeImages++;
          } else {
            imagesWithAlt++;
            totalAltLength += altText.length;
            
            // Check for keyword stuffing
            const words = altText.toLowerCase().split(/\s+/);
            const uniqueWords = new Set(words);
            if (words.length > 5 && uniqueWords.size / words.length < 0.6) {
              suspiciousAlt++;
            }
          }
        }
      }
      
      // Calculate alt text coverage
      const coverage = (imagesWithAlt / totalImages) * 100;
      
      if (coverage === 100) {
        score = 100;
        evidence.push(`All ${totalImages} images have alt text`);
      } else if (coverage >= 80) {
        score = 80;
        evidence.push(`${imagesWithAlt}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
        recommendations.push('Add alt text to remaining images');
      } else if (coverage >= 60) {
        score = 60;
        evidence.push(`⚠ ${imagesWithAlt}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
        recommendations.push('Improve alt text coverage for better accessibility');
      } else {
        score = Math.max(20, coverage * 0.5);
        evidence.push(`❌ Only ${imagesWithAlt}/${totalImages} images have alt text (${coverage.toFixed(0)}%)`);
        recommendations.push('Add alt text to images for accessibility and AI understanding');
      }
      
      // Check alt text quality
      if (imagesWithAlt > 0) {
        const avgAltLength = totalAltLength / imagesWithAlt;
        
        if (avgAltLength >= 10 && avgAltLength <= 125) {
          evidence.push('Alt text length is appropriate');
        } else if (avgAltLength < 10) {
          recommendations.push('Make alt text more descriptive (10-125 characters recommended)');
        } else {
          recommendations.push('Shorten alt text for better usability (10-125 characters recommended)');
        }
        
        if (suspiciousAlt > 0) {
          recommendations.push('Avoid keyword stuffing in alt text - focus on describing the image');
        }
      }
      
      if (decorativeImages > 0) {
        evidence.push(`${decorativeImages} decorative images properly marked with empty alt`);
      }
      
      return {
        factor_id: 'M.2.3',
        factor_name: 'Image Alt Text Analysis',
        pillar: 'M',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Image analysis failed:', error);
      
      return {
        factor_id: 'M.2.3',
        factor_name: 'Image Alt Text Analysis',
        pillar: 'M',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing images: ${error.message}`],
        recommendations: ['Unable to analyze image alt text - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Word Count Analysis (S.3.1)
  private async analyzeWordCount(content: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 95;
      const evidence = [];
      const recommendations = [];
      
      // Clean content - remove script, style, and excessive whitespace
      const cleanContent = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!cleanContent) {
        return {
          factor_id: 'S.3.1',
          factor_name: 'Word Count Analysis',
          pillar: 'S',
          phase: 'instant',
          score: 0,
          confidence: 100,
          weight: 1.0,
          evidence: ['No readable content found'],
          recommendations: [
            'Add substantial textual content to your page',
            'Aim for at least 300 words for basic topics',
            'Provide comprehensive information on your subject'
          ],
          processing_time_ms: Date.now() - startTime
        };
      }
      
      const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      evidence.push(`Word count: ${wordCount} words`);
      
      // Score based on word count ranges
      if (wordCount >= 1500) {
        score = 100;
        evidence.push('Comprehensive content length');
      } else if (wordCount >= 1000) {
        score = 90;
        evidence.push('Good content depth');
      } else if (wordCount >= 600) {
        score = 75;
        evidence.push('Adequate content length');
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
        evidence.push('Good sentence structure and readability');
      } else if (avgWordsPerSentence < 10) {
        recommendations.push('Consider using more detailed sentences');
      } else {
        recommendations.push('Break up long sentences for better readability');
      }
      
      // Check for content structure indicators
      const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
      if (paragraphs.length >= 3) {
        evidence.push(`${paragraphs.length} substantial paragraphs detected`);
      } else if (wordCount > 300) {
        recommendations.push('Break content into more paragraphs for better structure');
      }
      
      return {
        factor_id: 'S.3.1',
        factor_name: 'Word Count Analysis',
        pillar: 'S',
        phase: 'instant',
        score,
        confidence,
        weight: 1.0,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Word count analysis failed:', error);
      
      return {
        factor_id: 'S.3.1',
        factor_name: 'Word Count Analysis',
        pillar: 'S',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.0,
        evidence: [`Error analyzing word count: ${error.message}`],
        recommendations: ['Unable to analyze content length - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }
}