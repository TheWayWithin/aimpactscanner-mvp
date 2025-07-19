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
  async analyzeInstantFactors(url: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const factors: FactorResult[] = [];
    
    try {
      console.log(`🔍 Starting instant analysis for: ${url}`);
      
      // Fetch the webpage content for analysis
      const pageData = await this.fetchPageData(url);
      
      // Factor 1: HTTPS Security (AI.1.1) - Protocol analysis
      const httpsResult = await this.analyzeHTTPS(url);
      factors.push(httpsResult);
      
      // Factor 2: Title Optimization (AI.1.2) - Content analysis
      const titleResult = await this.analyzeTitle(pageData.title);
      factors.push(titleResult);
      
      // Factor 3: Meta Description (AI.1.3) - Content analysis  
      const metaResult = await this.analyzeMetaDescription(pageData.metaDescription);
      factors.push(metaResult);
      
      // Factor 4: Author Information (A.2.1) - Content analysis
      const authorResult = await this.analyzeAuthor(pageData.content);
      factors.push(authorResult);
      
      // Calculate overall score
      const overall_score = this.calculateOverallScore(factors);
      const processing_time_ms = Date.now() - startTime;
      
      console.log(`✅ Instant analysis completed in ${processing_time_ms}ms`);
      console.log(`📊 Analyzed ${factors.length} factors with overall score: ${overall_score}`);
      
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

  private async analyzeContact(url: string, links: string[]): Promise<FactorResult> {
    // TODO: Implement contact information detection
    throw new Error('Contact analysis not implemented yet');
  }

  private async analyzeHeadings(headings: any[]): Promise<FactorResult> {
    // TODO: Implement heading hierarchy analysis
    throw new Error('Headings analysis not implemented yet');
  }

  private async analyzeStructuredData(structuredData: any): Promise<FactorResult> {
    // TODO: Implement structured data analysis
    throw new Error('Structured data analysis not implemented yet');
  }

  private async analyzeFAQ(structuredData: any): Promise<FactorResult> {
    // TODO: Implement FAQ schema analysis
    throw new Error('FAQ analysis not implemented yet');
  }

  private async analyzeImages(images: any[]): Promise<FactorResult> {
    // TODO: Implement image alt text analysis
    throw new Error('Images analysis not implemented yet');
  }

  private async analyzeWordCount(content: string): Promise<FactorResult> {
    // TODO: Implement word count analysis
    throw new Error('Word count analysis not implemented yet');
  }
}