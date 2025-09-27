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
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AImpactScanner/1.0 (AI Search Optimization Analysis)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract meta description - try multiple patterns
      let metaDescription = '';
      
      // Try with double quotes (most common) - capture everything until closing double quote
      let metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
      if (!metaMatch) {
        // Try reversed order (content before name) with double quotes
        metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
      }
      if (!metaMatch) {
        // Try with single quotes - capture everything until closing single quote
        metaMatch = html.match(/<meta[^>]*name='description'[^>]*content='([^']*)'/i);
      }
      if (!metaMatch) {
        // Try reversed order with single quotes
        metaMatch = html.match(/<meta[^>]*content='([^']*)'[^>]*name='description'/i);
      }
      if (!metaMatch) {
        // Try with property instead of name (Open Graph) with double quotes
        metaMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
      }
      if (!metaMatch) {
        // Try Twitter description with double quotes
        metaMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/i);
      }
      
      metaDescription = metaMatch ? metaMatch[1].trim() : '';
      
      // Extract content while preserving structured data
      // Keep script tags for structured data analysis, then clean for content analysis
      const content = html; // Keep full HTML for structured data detection
      
      // Page data extracted successfully
      
      return { title, metaDescription, content };
      
    } catch (error) {
      console.error(`❌ Failed to fetch page data: ${error.message}`);
      // Return empty data on fetch failure
      return { title: '', metaDescription: '', content: '' };
    }
  }

  // Phase A: Instant Analysis (18 factors, <15 seconds)
  async analyzeInstantFactors(url: string, progressCallback?: (stage: string, progress: number, message: string, educationalContent: string) => Promise<void>): Promise<AnalysisResult> {
    const startTime = Date.now();
    const factors: FactorResult[] = [];
    
    // Helper function for progress updates
    const updateProgress = async (factorNumber: number, factorName: string, educationalContent: string) => {
      if (progressCallback) {
        const progress = Math.round((factorNumber / 18) * 80) + 10; // 10% start + 80% for factors
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
      // Fetch the webpage content for analysis
      const pageData = await this.fetchPageData(url);
      
      // Factor 1: HTTPS Security (AI.1.1) - Protocol analysis
      await updateProgress(1, 'HTTPS Security', 'Checking if your site uses secure HTTPS protocol - essential for AI search rankings and user trust.');
      const httpsResult = await this.analyzeHTTPS(url);
      factors.push(httpsResult);
      
      // Factor 2: Title Optimization (AI.1.2) - Content analysis
      await updateProgress(2, 'Title Optimization', 'Analyzing your page title for length, keywords, and AI search optimization best practices.');
      const titleResult = await this.analyzeTitle(pageData.title);
      factors.push(titleResult);
      
      // Factor 3: Meta Description (AI.1.3) - Content analysis  
      await updateProgress(3, 'Meta Description Quality', 'Evaluating your meta description for search snippet optimization and user engagement factors.');
      const metaResult = await this.analyzeMetaDescription(pageData.metaDescription, pageData.title);
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
      
      // Factor 11: Citation-Worthy Content Structure (AI.1.1) - Content analysis
      await updateProgress(11, 'Citation-Worthy Content', 'Checking if your content has the structure and depth needed for AI systems to cite it.');
      const citationResult = await this.analyzeCitationWorthyContent(pageData.content, pageData.title);
      factors.push(citationResult);
      
      // Factor 12: Source Authority Signals (AI.1.2) - Content analysis
      await updateProgress(12, 'Source Authority', 'Evaluating authority signals that help AI systems assess credibility and trustworthiness.');
      const authorityResult = await this.analyzeSourceAuthoritySignals(pageData.content, url);
      factors.push(authorityResult);
      
      // Factor 13: Evidence Chunking for RAG (AI.1.5) - Content analysis
      await updateProgress(13, 'Evidence Chunking', 'Analyzing content chunking for optimal AI retrieval-augmented generation processing.');
      const chunkingResult = await this.analyzeEvidenceChunking(pageData.content);
      factors.push(chunkingResult);
      
      // Factor 14: Transparency & Disclosure (A.3.1) - Content analysis
      await updateProgress(14, 'Transparency Standards', 'Checking for transparency and disclosure standards that build trust with AI systems.');
      const transparencyResult = await this.analyzeTransparencyDisclosure(pageData.content);
      factors.push(transparencyResult);
      
      // Factor 15: Page Load Speed (E.1.1) - Content analysis
      await updateProgress(15, 'Page Load Speed', 'Evaluating page load speed optimization for better user experience and AI crawler efficiency.');
      const speedResult = await this.analyzePageLoadSpeed(pageData.content);
      factors.push(speedResult);
      
      // Calculate overall score
      const overall_score = this.calculateOverallScore(factors);
      const processing_time_ms = Date.now() - startTime;
      
      // Phase A analysis completed
      
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
        
        // Length scoring (optimal: 50-60 chars, but be more generous for clear titles)
        if (length >= 50 && length <= 60) {
          score += 40; // Optimal length
          evidence.push('Title length is optimal for search results');
        } else if (length >= 40 && length <= 70) {
          score += 35; // Good length
          evidence.push('Title length is good for search results');
        } else if (length >= 30 && length <= 80) {
          score += 25; // Acceptable length
          evidence.push('Title length is acceptable');
          if (length < 50) recommendations.push('Consider making title longer for better keyword coverage');
          if (length > 60) recommendations.push('Consider shortening title to prevent truncation in search results');
        } else {
          score += 15; // Poor length
          evidence.push('Title length needs optimization');
          if (length < 30) recommendations.push('Title is too short - add more descriptive keywords');
          if (length > 80) recommendations.push('Title is too long - will be truncated in search results');
        }
        
        // Content quality scoring
        const hasNumbers = /\d/.test(title);
        const hasSpecialChars = /[|•·→←↑↓★☆✓✗⚡🔥💡📈📊⭐]/.test(title);
        const wordCount = title.split(/\s+/).length;
        const hasCommonWords = /\b(how|what|why|best|guide|tips|complete|ultimate|2024|2025)\b/i.test(title);
        
        // Base scoring for descriptive content
        if (wordCount >= 3 && wordCount <= 12) {
          score += 25; // Good base score for descriptive titles
          evidence.push('Good word count for readability');
        } else {
          score += 15;
          if (wordCount < 3) recommendations.push('Add more descriptive words to title');
          if (wordCount > 12) recommendations.push('Simplify title for better readability');
        }
        
        // Brand presence (common in good titles)
        const hasBrand = /[-|:]\s*[A-Z][a-zA-Z]+/.test(title) || /[A-Z][a-zA-Z]+\s*[-|:]/.test(title);
        if (hasBrand) {
          score += 15;
          evidence.push('Includes brand name for recognition');
        }
        
        // Descriptive keywords (better than generic power words)
        const hasDescriptiveWords = /\b(calculators?|tools?|free|online|guides?|services?|apps?|platforms?|solutions?)\b/i.test(title);
        if (hasDescriptiveWords) {
          score += 15;
          evidence.push('Contains descriptive, relevant keywords');
        }
        
        // Engagement elements (bonus, not required)
        if (hasNumbers) {
          score += 10;
          evidence.push('Includes numbers for specificity');
        }
        
        if (hasSpecialChars) {
          score += 8;
          evidence.push('Uses engaging special characters');
        }
        
        if (hasCommonWords) {
          score += 12;
          evidence.push('Contains high-value engagement keywords');
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
  private async analyzeMetaDescription(metaDescription: string, pageTitle?: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let confidence = 100;
      const evidence = [];
      const recommendations = [];
      
      if (!metaDescription) {
        score = 0;
        evidence.push('No meta description found');
        evidence.push('Meta descriptions improve click-through rates from search results');
        
        // Enhanced recommendations based on context
        recommendations.push('Add a meta description between 150-160 characters');
        recommendations.push('Include your main value proposition and target keywords');
        recommendations.push('End with a call-to-action to encourage clicks');
        if (pageTitle) {
          recommendations.push(`Consider expanding on your title: "${pageTitle.substring(0, 50)}..."`);
        }
        recommendations.push('Meta descriptions directly impact search result appearance');
      } else {
        const length = metaDescription.length;
        evidence.push(`Meta description length: ${length} characters`);
        evidence.push(`Meta description: "${metaDescription}"`);
        
        // Length scoring (optimal: 150-160 chars)
        if (length >= 150 && length <= 160) {
          score += 50; // Optimal length
          evidence.push('Meta description length is optimal (150-160 characters)');
        } else if (length >= 140 && length <= 170) {
          score += 40; // Good length
          evidence.push('Meta description length is good');
          if (length < 150) recommendations.push('Consider expanding meta description slightly for optimal length (150-160 characters)');
          if (length > 160) recommendations.push('Consider shortening slightly to prevent truncation (optimal: 150-160 characters)');
        } else if (length >= 120 && length <= 180) {
          score += 30; // Acceptable length
          evidence.push('Meta description length is acceptable but not optimal');
          if (length < 140) recommendations.push('Expand meta description to 150-160 characters for better keyword coverage');
          if (length > 170) recommendations.push('Shorten meta description to 150-160 characters to prevent truncation');
        } else {
          score += 15; // Poor length
          evidence.push('Meta description length needs optimization');
          if (length < 120) recommendations.push('Meta description is too short - expand to 150-160 characters');
          if (length > 180) recommendations.push('Meta description is too long - shorten to 150-160 characters');
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
          // Only add generic improvement if no specific recommendations exist
          if (recommendations.length === 0) {
            recommendations.push('Consider adding more engaging elements to maximize click-through rate');
          }
        } else if (score >= 50) {
          evidence.push('Average meta description, several improvements needed');
          if (recommendations.length === 0) {
            recommendations.push('Improve meta description with better structure and content');
          }
        } else {
          evidence.push('Meta description needs significant optimization');
          if (length >= 150 && length <= 160) {
            // If length is optimal but score is low, focus on content quality
            recommendations.push('Length is optimal, but content needs improvement - add call-to-action and value proposition');
          } else {
            recommendations.push('Rewrite meta description with proper length (150-160 chars) and engaging content');
          }
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
      
      // Clean HTML and remove JSON-LD structured data to avoid false positives
      let cleanContent = content
        .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>.*?<\/script>/gis, '') // Remove JSON-LD
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove other scripts
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove styles
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // More specific author detection patterns
      const authorPatterns = [
        /(?:^|\s)by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[,.!?])/gi,
        /author:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[,.!?])/gi,
        /written\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[,.!?])/gi,
        /created\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[,.!?])/gi,
        /posted\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[,.!?])/gi,
      ];
      
      const foundAuthors = new Set();
      
      for (const pattern of authorPatterns) {
        const matches = cleanContent.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            const author = match[1].trim();
            // Enhanced false positive filtering
            const falsePositives = /^(the|and|or|but|with|from|about|news|blog|post|article|page|site|home|contact|login|register|context|type|json|data|schema|website|company|business|service|content|information|details|policy|terms|conditions|copyright|reserved|rights|all|some|other|more|less|most|best|top|new|old|first|last|next|previous|back|forward|up|down|left|right|here|there|now|then|today|yesterday|tomorrow|this|that|these|those|what|when|where|why|how|who|which|each|every|any|all|none|one|two|three|four|five|search|find|help|support|faq|guide|tutorial|example|demo|test|sample|null|undefined|true|false|yes|no|ok|error|success|failure|loading|wait|please|thank|thanks|welcome|hello|goodbye|see|view|read|click|link|url|http|https|www|com|org|net|edu|gov|mil|int|eu|co|uk|de|fr|es|it|jp|cn|in|au|ca|br|ru|kr|mx|tr|za|se|no|dk|fi|nl|be|at|ch|pl|cz|sk|hu|ro|bg|hr|si|ee|lv|lt|lu|mt|cy|ie|pt|gr|is|li|mc|sm|va|ad|md|by|ua|rs|me|mk|al|ba|xk|calculator|finance|financial|money|dollar|cost|price|rate|percent|calculation)$/i;
            
            if (!falsePositives.test(author) && author.length >= 2 && author.length <= 50) {
              // Additional validation: must look like a real name
              const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?){0,3}$/;
              if (namePattern.test(author)) {
                foundAuthors.add(author);
              }
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
        score += 60; // Increased base score - contact page is fundamental
        evidence.push('Contact page link found');
      }
      
      // Check for email links and addresses
      const emailPattern = /(?:mailto:|[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})/gi;
      const emailMatches = content.match(emailPattern);
      
      if (emailMatches && emailMatches.length > 0) {
        score += 25; // Bonus for email availability
        evidence.push(`${emailMatches.length} email contact(s) found`);
      }
      
      // Check for phone numbers (international support)
      const phonePatterns = [
        // Tel links
        /tel:[+\d\-\(\)\s]+/gi,
        
        // US formats
        /\(\d{3}\)\s*\d{3}-\d{4}/g,
        /\d{3}-\d{3}-\d{4}/g,
        /\d{3}\.\d{3}\.\d{4}/g,
        
        // International formats with country codes
        /\+\d{1,4}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{0,4}/g,
        
        // UK formats
        /\b(?:\+44\s?|0)(?:\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{6})/g,
        
        // European formats
        /\b(?:\+33|0)\s?[1-9](?:[\s\.-]?\d{2}){4}/g, // France
        /\b(?:\+49|0)\s?\d{2,4}[\s\/-]?\d{2,8}/g,    // Germany
        /\b(?:\+39|0)\s?\d{2,4}[\s\/-]?\d{6,8}/g,    // Italy
        
        // Australia/NZ
        /\b(?:\+61|0)\s?[2-478]\s?\d{4}\s?\d{4}/g,   // Australia
        /\b(?:\+64|0)\s?[2-9]\s?\d{3}\s?\d{4}/g,     // New Zealand
        
        // Asian formats
        /\b(?:\+81|0)\s?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{4}/g, // Japan
        /\b(?:\+86|0)\s?1[3-9]\d[\s\-]?\d{4}[\s\-]?\d{4}/g,  // China mobile
        /\b(?:\+91|0)\s?[6-9]\d{9}/g,                         // India
        
        // General fallback for phone-like patterns with context
        /\b(?:phone|tel|call|mobile|cell|fax)\s*:?\s*[\+\d\(\)\s\-\.]{7,20}/gi
      ];
      
      let phoneCount = 0;
      for (const pattern of phonePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          phoneCount += matches.length;
        }
      }
      
      if (phoneCount > 0) {
        score += 15; // Bonus for phone availability  
        evidence.push(`${phoneCount} phone contact(s) found`);
      }
      
      // Check for physical address indicators (international support)
      const addressPatterns = [
        // US street addresses (number + street name + suffix)
        /\b\d+\s+[A-Za-z][A-Za-z\s]{2,30}(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Way|Court|Ct\.?|Place|Pl\.?|Circle|Cir\.?|Parkway|Pkwy\.?)\b/i,
        
        // UK/International street addresses (number + street name + suffix)
        /\b\d+\s+[A-Za-z][A-Za-z\s]{2,30}(?:Street|Road|Lane|Close|Drive|Avenue|Way|Place|Gardens?|Square|Crescent|Terrace|Grove|Rise|View|Park|Hill|Green|Court|Mews|Walk|Row|Gate|Bridge|Cross|End|Side|Vale|Fields?|Heath|Common|Mill|Farm|House|Cottage|Manor|Lodge|Hall|Tower|Centre|Center)\b/i,
        
        // Postal codes in context (US ZIP, UK, Canada, etc.)
        /\b(?:zip|postal|post|mail|address|location|office|headquarters|hq|mailing)\s*:?\s*(?:\d{5}(?:-\d{4})?|[A-Z]\d[A-Z]\s*\d[A-Z]\d|[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}|[A-Z]\d{4}|[A-Z]{2}\d{2}\s*\d[A-Z]{2})\b/gi,
        
        // International postal code formats
        /\b[A-Za-z\s]{2,25},\s*(?:[A-Z]{2}\s+\d{5}(?:-\d{4})?|[A-Z]\d[A-Z]\s*\d[A-Z]\d|[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}|[A-Z]\d{4}|[A-Z]{2}\d{2}\s*\d[A-Z]{2}|\d{4,5})\b/i,
        
        // PO Box addresses (international variations)
        /\b(?:P\.?O\.?\s*Box|Post(?:al)?\s*Box|Box|Postbox|Boîte\s*Postale|Casella\s*Postale|Apartado|Postfach)\s+\d+/i,
        
        // Address with context keywords (international)
        /\b(?:address|location|office|headquarters|hq|visit\s*us|find\s*us|our\s*office|head\s*office|registered\s*office|correspondence|mail\s*to|send\s*to|ship\s*to|billing|delivery)\s*:?\s*[A-Za-z0-9\s,.-]{10,80}(?:Street|St|Road|Rd|Lane|Ln|Avenue|Ave|Drive|Dr|Boulevard|Blvd|Place|Pl|Close|Way|Square|Crescent|Terrace|Grove|Rise|View|Park|Hill|Green|Court|Mews|Walk|Row|Gate|Bridge|Cross|End|Side|Vale|Fields?|Heath|Common|Mill|Farm|House|Cottage|Manor|Lodge|Hall|Tower|Centre|Center|Straße|Str|Gasse|Platz|Weg|Allee|Ring|Damm|Ufer|Berg|Tal|Hof|Markt|Kirchgasse|Hauptstraße|Rue|Avenue|Boulevard|Place|Impasse|Allée|Quai|Pont|Via|Corso|Piazza|Viale|Largo|Vicolo|Strada|Calle|Plaza|Avenida|Paseo|Carrera|Rua|Praça|Travessa|Alameda|Estrada)/i,
        
        // Country-specific formats
        /\b[A-Za-z\s]{2,25},\s*(?:UK|United\s*Kingdom|England|Scotland|Wales|Ireland|Canada|Australia|Germany|France|Italy|Spain|Netherlands|Belgium|Switzerland|Austria|Sweden|Norway|Denmark|Finland|Poland|Czech|Slovakia|Hungary|Portugal|Greece|Turkey|Japan|Korea|Singapore|Malaysia|Thailand|India|China|Brazil|Mexico|Argentina|Chile|Colombia|Peru|Ecuador|Venezuela|South\s*Africa|Egypt|Morocco|Nigeria|Kenya|Ghana|Israel|UAE|Saudi\s*Arabia|Qatar|Kuwait|Bahrain|Oman|Jordan|Lebanon|Cyprus|Malta|Luxembourg|Lithuania|Latvia|Estonia|Slovenia|Croatia|Serbia|Bulgaria|Romania|Ukraine|Russia|Belarus|Kazakhstan)\b/i
      ];
      
      let addressFound = false;
      let addressDetails = [];
      
      for (const pattern of addressPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          addressFound = true;
          // Don't expose actual addresses for privacy
          addressDetails.push(`${matches.length} address indicator(s)`);
        }
      }
      
      if (addressFound) {
        score += 10;
        evidence.push(`Address information detected: ${addressDetails.join(', ')}`);
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
      
      // Enhanced hierarchy analysis with structure quality
      let hierarchyScore = 0;
      let lastLevel = 0;
      let hierarchyBreaks = 0;
      let structureIssues = 0;
      
      // Count heading levels using simple approach
      let h1Count = 0, h2Count = 0, h3Count = 0;
      for (const heading of headings) {
        if (heading.level === 1) h1Count++;
        else if (heading.level === 2) h2Count++;
        else if (heading.level === 3) h3Count++;
      }
      
      // Check for level skipping
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
      
      // Analyze heading distribution quality
      const totalHeadings = headings.length;
      const h3Percentage = Math.round((h3Count / totalHeadings) * 100);
      
      // Check for structural issues
      if (h3Percentage > 70) {
        structureIssues++;
        evidence.push('⚠ ' + h3Percentage + '% of headings are H3 (suggests poor content organization)');
        recommendations.push('Consider promoting some H3s to H2 for better section structure');
      }
      
      if (h2Count > 8) {
        structureIssues++;
        evidence.push('⚠ ' + h2Count + ' H2 sections may indicate overly fragmented content');
        recommendations.push('Consider grouping related H2 sections under broader topics');
      }
      
      // Calculate hierarchy score based on structure quality
      if (hierarchyBreaks === 0 && structureIssues === 0) {
        hierarchyScore = 25;
        evidence.push('Excellent heading hierarchy and structure');
      } else if (hierarchyBreaks === 0 && structureIssues === 1) {
        hierarchyScore = 20;
        evidence.push('Good hierarchy with minor structural issues');
      } else if (hierarchyBreaks === 0 && structureIssues >= 2) {
        hierarchyScore = 15;
        evidence.push('Hierarchy maintained but structure needs improvement');
      } else {
        hierarchyScore = Math.max(5, 25 - (hierarchyBreaks * 5) - (structureIssues * 3));
        evidence.push(hierarchyBreaks + ' hierarchy breaks and ' + structureIssues + ' structural issues found');
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
      
      // Check for content structure balance
      const totalHeadings = headings.length;
      if (totalHeadings >= 3 && totalHeadings <= 15) {
        score += 25;
        evidence.push(`${totalHeadings} headings provide good content structure`);
      } else if (totalHeadings > 15 && totalHeadings <= 25) {
        score += 20;
        evidence.push(`${totalHeadings} headings provide detailed structure`);
        recommendations.push('Consider consolidating some headings for better readability');
      } else if (totalHeadings > 25) {
        score += 15;
        evidence.push(`${totalHeadings} headings may be excessive for content organization`);
        recommendations.push('Simplify heading structure - too many headings can hurt readability');
      } else if (totalHeadings === 2) {
        score += 15;
        recommendations.push('Add more headings to improve content structure');
      } else {
        score += 10;
        recommendations.push('Add proper heading structure for better content organization');
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
        
        // Check for common schemas (including nested structures)
        const schemas = [];
        
        const extractSchemas = (obj) => {
          if (!obj) return;
          
          if (Array.isArray(obj)) {
            obj.forEach(extractSchemas);
          } else if (typeof obj === 'object') {
            if (obj['@type']) {
              if (Array.isArray(obj['@type'])) {
                schemas.push(...obj['@type']);
              } else {
                schemas.push(obj['@type']);
              }
            }
            
            // Check @graph property (common in complex structures)
            if (obj['@graph']) {
              extractSchemas(obj['@graph']);
            }
            
            // Recursively check other object properties for nested schemas
            Object.values(obj).forEach(value => {
              if (typeof value === 'object') {
                extractSchemas(value);
              }
            });
          }
        };
        
        jsonLdData.forEach(extractSchemas);
        
        const uniqueSchemas = [...new Set(schemas)];
        if (uniqueSchemas.length > 0) {
          score += 30;
          evidence.push(`${uniqueSchemas.length} schema types found: ${uniqueSchemas.join(', ')}`);
          
          // Bonus for multiple schema types (comprehensive implementation)
          if (uniqueSchemas.length >= 4) {
            score += 20;
            evidence.push('Comprehensive multi-schema implementation');
          } else if (uniqueSchemas.length >= 2) {
            score += 10;
            evidence.push('Multiple schema types implemented');
          }
        }
        
        // Bonus for high-value schemas
        const valuableSchemas = ['Article', 'BlogPosting', 'Person', 'Organization', 'WebSite', 'FAQPage', 'Product', 'Event', 'BreadcrumbList', 'ItemList', 'CollectionPage'];
        const foundValuableSchemas = uniqueSchemas.filter(schema => valuableSchemas.includes(schema));
        if (foundValuableSchemas.length > 0) {
          score += Math.min(foundValuableSchemas.length * 5, 20); // 5 points per valuable schema, max 20
          evidence.push(`High-value schemas: ${foundValuableSchemas.join(', ')}`);
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
            
            // Handle both single objects and arrays
            if (Array.isArray(parsed)) {
              structuredData.push(...parsed);
            } else {
              structuredData.push(parsed);
            }
          } catch (e) {
            // Invalid JSON-LD in FAQ analysis
          }
        }
      }
      
      // FAQ Analysis: Found structured data items
      
      // Check for FAQ schema in structured data (handle various formats)
      let faqSchema = structuredData.find(item => item['@type'] === 'FAQPage');
      
      // Also check within array items if main item has @graph
      if (!faqSchema) {
        for (const item of structuredData) {
          if (item['@graph'] && Array.isArray(item['@graph'])) {
            faqSchema = item['@graph'].find(subItem => subItem['@type'] === 'FAQPage');
            if (faqSchema) break;
          }
        }
      }
      if (faqSchema) {
        score += 50;
        evidence.push('FAQPage schema detected');
        if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity)) {
          const questionCount = faqSchema.mainEntity.length;
          score += 30;
          evidence.push(`${questionCount} structured questions found`);
          
          // Enhanced scoring for comprehensive FAQ implementations
          if (questionCount >= 10) {
            score += 30; // Bonus for extensive FAQ (10+ questions)
            evidence.push('Extensive FAQ implementation');
          } else if (questionCount >= 5) {
            score += 25; // Good implementation (5-9 questions)
            evidence.push('Comprehensive FAQ content');
          } else if (questionCount >= 3) {
            score += 20; // Basic implementation (3-4 questions)
            evidence.push('Good FAQ content');
          }
          
          // Additional bonus for quality indicators
          const hasDetailedAnswers = faqSchema.mainEntity.some(q => 
            q.acceptedAnswer && q.acceptedAnswer.text && q.acceptedAnswer.text.length > 100
          );
          if (hasDetailedAnswers) {
            score += 10;
            evidence.push('Detailed, comprehensive answers detected');
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
      
      // Check for question patterns in FAQ context (more strict)
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who'];
      const questionPattern = new RegExp(`\\b(${questionWords.join('|')})\\b.*\\?`, 'gi');
      const questionMatches = content.match(questionPattern);
      
      // Only count questions if they appear in FAQ-like context or sufficient quantity
      let contextualQuestions = 0;
      
      if (questionMatches) {
        // Check if questions appear near FAQ indicators
        const faqContextWords = ['faq', 'frequently', 'asked', 'question', 'answer', 'help', 'support'];
        const faqContextPattern = new RegExp(`\\b(${faqContextWords.join('|')})\\b`, 'gi');
        const hasNearbyFaqContext = faqContextPattern.test(content);
        
        if (hasNearbyFaqContext || questionMatches.length >= 5) {
          // Either FAQ context exists OR many questions (suggesting FAQ-like content)
          contextualQuestions = questionMatches.length;
          
          if (contextualQuestions >= 5) {
            score += 20;
            evidence.push(`${contextualQuestions} question patterns in FAQ-like context`);
          } else if (contextualQuestions >= 3) {
            score += 15;
            evidence.push(`${contextualQuestions} question patterns detected`);
          } else {
            score += 5;
            evidence.push(`${contextualQuestions} question pattern(s) in content`);
          }
        } else {
          // Questions found but no FAQ context - likely incidental content
          evidence.push(`${questionMatches.length} incidental question(s) found (not FAQ context)`);
        }
      }
      
      // Provide recommendations based on score
      if (score === 0) {
        evidence.push('No FAQ content detected');
        recommendations.push('Consider adding FAQ section to address common user questions');
        recommendations.push('Implement FAQPage structured data for better AI understanding');
        recommendations.push('Include question-answer pairs relevant to your specific domain');
        recommendations.push('Use clear question formats (What, Why, How, etc.)');
      } else if (score < 30) {
        // Low score - likely incidental questions, not real FAQ
        recommendations.push('Current questions appear to be incidental rather than structured FAQ');
        recommendations.push('Consider creating dedicated FAQ section with common user questions');
        recommendations.push('Add FAQPage structured data if you implement FAQ content');
        recommendations.push('Ensure FAQ answers are comprehensive and helpful');
      } else if (score < 70) {
        recommendations.push('Expand FAQ content with more comprehensive questions');
        recommendations.push('Add structured data markup for existing FAQ content');
        recommendations.push('Ensure answers are detailed and helpful');
        recommendations.push('Consider organizing FAQ by categories or topics');
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
        // No images found - this could be good or indicate missed opportunities
        // Score based on content type analysis
        const isLikelyArticle = content.includes('<article>') || 
                               content.includes('article') || 
                               content.match(/<h[1-6][^>]*>/gi)?.length > 3;
        
        let noImageScore = 75; // Default neutral score
        let noImageConfidence = 70; // Lower confidence since no analysis performed
        const noImageEvidence = ['No images found on page'];
        const noImageRecommendations = [];
        
        if (isLikelyArticle) {
          noImageScore = 60; // Articles typically benefit from images
          noImageRecommendations.push('Consider adding relevant images to enhance content engagement');
          noImageRecommendations.push('Images can improve user experience and AI understanding');
          noImageEvidence.push('Page appears to be article-style content that could benefit from images');
        } else {
          noImageScore = 80; // Simple pages may not need images
          noImageEvidence.push('Page type may not require images');
        }
        
        return {
          factor_id: 'M.2.3',
          factor_name: 'Image Alt Text Analysis',
          pillar: 'M',
          phase: 'instant',
          score: noImageScore,
          confidence: noImageConfidence,
          weight: 1.0,
          evidence: noImageEvidence,
          recommendations: noImageRecommendations,
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
      
      // Detect page type for contextual scoring
      const isUtilityPage = /calculator|tool|converter|generator|checker|analyzer|validator|form/i.test(content);
      const isArticlePage = /<article>|blog|tutorial|guide|how-to|step-by-step/i.test(content);
      
      // Score based on word count ranges with context awareness
      if (wordCount >= 2000) {
        score = isArticlePage ? 100 : 85;
        evidence.push(isArticlePage ? 'Comprehensive content length' : 'Very detailed content (may be excessive for utility pages)');
        if (!isArticlePage) recommendations.push('Consider if all content is necessary for user task completion');
      } else if (wordCount >= 1500) {
        score = isArticlePage ? 95 : 80;
        evidence.push(isArticlePage ? 'Excellent content depth' : 'Detailed content (good for complex utilities)');
      } else if (wordCount >= 1000) {
        score = isUtilityPage ? 90 : 85;
        evidence.push(isUtilityPage ? 'Good content depth for utility page' : 'Good content depth');
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
      
      // Check for content structure indicators (improved for HTML)
      const pTagMatches = content.match(/<p[^>]*>([^<]+|<[^/p][^>]*>[^<]*<\/[^>]*>)*<\/p>/gi) || [];
      const substantialParagraphs = pTagMatches.filter(p => {
        const textContent = p.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 50;
      });
      
      if (substantialParagraphs.length >= 3) {
        evidence.push(substantialParagraphs.length + ' substantial paragraphs detected');
      } else if (wordCount > 400) {
        recommendations.push('Break content into more paragraphs for better structure');
        if (substantialParagraphs.length <= 1) {
          evidence.push('⚠ Content appears to lack paragraph structure');
        }
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

  // Factor Implementation: Citation-Worthy Content Structure (AI.1.1)
  private async analyzeCitationWorthyContent(pageContent: string, title: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let evidence = [];
      let recommendations = [];
      
      // Remove HTML tags for text analysis
      const textContent = pageContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
      const headings = (pageContent.match(/<h[1-6][^>]*>/gi) || []).length;
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
      const citations = (pageContent.match(/<a[^>]*href[^>]*>/gi) || []).length;
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
    } catch (error) {
      console.error('Citation analysis failed:', error);
      return {
        factor_id: 'AI.1.1',
        factor_name: 'Citation-Worthy Content Structure',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.058,
        evidence: [`Error analyzing citation-worthy content: ${error.message}`],
        recommendations: ['Unable to analyze citation structure - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Source Authority Signals (AI.1.2)
  private async analyzeSourceAuthoritySignals(pageContent: string, url: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let evidence = [];
      let recommendations = [];
      
      // Check for author information
      const hasAuthor = /author|by\s+[A-Z][a-z]+|written\s+by/i.test(pageContent);
      const authorCredentials = /phd|md|professor|dr\.|certified|licensed/i.test(pageContent);
      
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
      
      // Check for structured data/schema markup
      const jsonLdMatches = pageContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
      let hasAuthoritySchema = false;
      let schemaScore = 0;
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            const parsed = JSON.parse(content);
            const schemas = Array.isArray(parsed) ? parsed : [parsed];
            
            for (const schema of schemas) {
              // Check for Person schema (author credentials)
              if (schema['@type'] === 'Person') {
                hasAuthoritySchema = true;
                schemaScore += 15;
                evidence.push('Person schema found for author authority');
                
                // Check for authority-relevant Person properties
                const authorityFields = ['jobTitle', 'worksFor', 'affiliation', 'sameAs', 'knowsAbout', 'alumniOf'];
                const foundFields = authorityFields.filter(field => schema[field]);
                if (foundFields.length >= 2) {
                  schemaScore += 10;
                  evidence.push(`Person schema includes authority fields: ${foundFields.join(', ')}`);
                }
              }
              
              // Check for Organization schema (institutional authority)
              if (schema['@type'] === 'Organization') {
                hasAuthoritySchema = true;
                schemaScore += 10;
                evidence.push('Organization schema found for institutional authority');
                
                const orgFields = ['sameAs', 'address', 'contactPoint', 'foundingDate'];
                const foundOrgFields = orgFields.filter(field => schema[field]);
                if (foundOrgFields.length >= 1) {
                  schemaScore += 5;
                  evidence.push('Organization schema includes credibility indicators');
                }
              }
              
              // Check for Article/BlogPosting schema with author
              if (['Article', 'BlogPosting'].includes(schema['@type'])) {
                if (schema.author) {
                  hasAuthoritySchema = true;
                  schemaScore += 10;
                  evidence.push('Article schema links to author information');
                  
                  if (typeof schema.author === 'object' && (schema.author['@type'] === 'Person' || schema.author.name)) {
                    schemaScore += 5;
                    evidence.push('Article author includes detailed Person information');
                  }
                }
                
                if (schema.publisher && typeof schema.publisher === 'object') {
                  schemaScore += 5;
                  evidence.push('Article includes publisher authority information');
                }
              }
            }
          } catch (e) {
            // Invalid JSON-LD, continue
          }
        }
      }
      
      score += Math.min(schemaScore, 30); // Cap schema contribution at 30 points
      
      // Add schema recommendations if missing
      if (!hasAuthoritySchema) {
        recommendations.push('Add Person schema markup with author credentials and affiliations');
        recommendations.push('Include Organization schema for institutional authority');
        recommendations.push('Implement Article schema linking content to credible authors');
        recommendations.push('Use sameAs property in schema to connect to authoritative profiles (LinkedIn, academic profiles)');
      } else if (schemaScore < 20) {
        recommendations.push('Enhance existing schema markup with more authority indicators');
        recommendations.push('Add sameAs properties to link to authoritative external profiles');
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
      const professionalMatches = (pageContent.match(professionalTerms) || []).length;
      
      if (professionalMatches >= 3) {
        score += 20;
        evidence.push('Multiple professional authority indicators');
      } else if (professionalMatches >= 1) {
        score += 10;
        evidence.push('Some professional indicators present');
      }
      
      // Check for citations and references
      const references = /reference|citation|source|bibliography/i.test(pageContent);
      if (references) {
        score += 20;
        evidence.push('References or bibliography section found');
      } else {
        recommendations.push('Add references section to support claims');
      }
      
      // Base score varies based on actual content quality
      if (score < 15) {
        score = Math.max(score, 15); // Lower floor for truly poor sites
        recommendations.push('Establish clear expertise and authority indicators');
        recommendations.push('Include professional background and credentials');
      } else if (score < 25) {
        // Slight boost for sites with minimal authority
        recommendations.push('Strengthen authority signals with more credentials');
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
    } catch (error) {
      console.error('Authority analysis failed:', error);
      return {
        factor_id: 'AI.1.2',
        factor_name: 'Source Authority Signals',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.058,
        evidence: [`Error analyzing authority signals: ${error.message}`],
        recommendations: ['Unable to analyze authority - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Evidence Chunking for RAG Optimization (AI.1.5)
  private async analyzeEvidenceChunking(pageContent: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let evidence = [];
      let recommendations = [];
      
      // Remove HTML tags for text analysis
      const textContent = pageContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
      
      // Check for semantic boundaries (headings, lists, clear sections)
      const headings = (pageContent.match(/<h[1-6][^>]*>/gi) || []).length;
      const lists = (pageContent.match(/<(ul|ol)[^>]*>/gi) || []).length;
      
      if (headings >= 3 && lists >= 1) {
        score += 30;
        evidence.push('Clear semantic boundaries with headings and lists');
      } else if (headings >= 2) {
        score += 15;
        recommendations.push('Add more structural elements (lists, sections)');
      } else {
        recommendations.push('Add headings and lists for better content segmentation');
      }
      
      // Check for cross-references and internal links
      const internalLinks = (pageContent.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [])
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
    } catch (error) {
      console.error('Evidence chunking analysis failed:', error);
      return {
        factor_id: 'AI.1.5',
        factor_name: 'Evidence Chunking for RAG Optimization',
        pillar: 'AI',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.058,
        evidence: [`Error analyzing evidence chunking: ${error.message}`],
        recommendations: ['Unable to analyze content chunking - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Transparency & Disclosure Standards (A.3.1)
  private async analyzeTransparencyDisclosure(pageContent: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let evidence = [];
      let recommendations = [];
      
      // Check for disclosure statements
      const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
      const hasDisclosure = disclosureTerms.test(pageContent);
      
      if (hasDisclosure) {
        score += 30;
        evidence.push('Disclosure statements found');
      } else {
        recommendations.push('Add disclosure statements for transparency');
        recommendations.push('Include conflict of interest information if applicable');
      }
      
      // Check for funding information
      const fundingTerms = /funded\s+by|grant|supported\s+by|sponsored\s+by/i;
      const hasFunding = fundingTerms.test(pageContent);
      
      if (hasFunding) {
        score += 25;
        evidence.push('Funding source transparency present');
      } else {
        recommendations.push('Include funding source information if applicable');
      }
      
      // Check for methodology or process transparency
      const methodTerms = /method|process|approach|criteria|how\s+we|our\s+process/i;
      const hasMethod = methodTerms.test(pageContent);
      
      if (hasMethod) {
        score += 25;
        evidence.push('Methodology or process information included');
      } else {
        recommendations.push('Explain your methodology and process');
      }
      
      // Check for last updated information
      const updatedTerms = /updated|revised|last\s+modified|published/i;
      const hasUpdated = updatedTerms.test(pageContent);
      
      if (hasUpdated) {
        score += 20;
        evidence.push('Update information provided');
      } else {
        recommendations.push('Include publication and update dates');
      }
      
      // Base transparency score varies by content quality
      if (score === 0) {
        score = 15; // Lower base for sites with no transparency
        recommendations.push('Implement basic transparency standards');
      } else if (score < 30) {
        score += 10; // Boost for sites with some transparency
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
    } catch (error) {
      console.error('Transparency analysis failed:', error);
      return {
        factor_id: 'A.3.1',
        factor_name: 'Transparency & Disclosure Standards',
        pillar: 'A',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 1.193,
        evidence: [`Error analyzing transparency: ${error.message}`],
        recommendations: ['Unable to analyze transparency - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  // Factor Implementation: Page Load Speed Optimization (E.1.1)
  private async analyzePageLoadSpeed(pageContent: string): Promise<FactorResult> {
    const startTime = Date.now();
    
    try {
      let score = 0;
      let evidence = [];
      let recommendations = [];
      
      // Analyze page size indicators
      const pageSize = pageContent.length;
      const imageTags = (pageContent.match(/<img[^>]*>/gi) || []).length;
      const scriptTags = (pageContent.match(/<script[^>]*>/gi) || []).length;
      const styleTags = (pageContent.match(/<style[^>]*>/gi) || []).length;
      const cssLinks = (pageContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
      
      evidence.push(`Page content size: ${Math.round(pageSize / 1024)} KB`);
      evidence.push(`Images: ${imageTags}`);
      evidence.push(`Scripts: ${scriptTags}`);
      evidence.push(`CSS files: ${cssLinks + styleTags}`);
      
      // Score based on page size with more granular ranges
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
      const hasLazyLoading = /loading=["']lazy["']|data-src/i.test(pageContent);
      const hasMinification = /\.min\.(js|css)/i.test(pageContent);
      
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
      
      // Check for performance-related meta tags
      const hasPreload = /<link[^>]*rel=["']preload["']/i.test(pageContent);
      const hasPrefetch = /<link[^>]*rel=["']prefetch["']/i.test(pageContent);
      
      if (hasPreload || hasPrefetch) {
        score += 20;
        evidence.push('Resource preloading/prefetching implemented');
      } else {
        recommendations.push('Consider preloading critical resources');
      }
      
      // Base score varies by optimization level
      if (score === 0) {
        score = 15; // Lower base for unoptimized sites
        recommendations.push('Implement basic page speed optimizations');
      } else if (score < 25) {
        score += 5; // Small boost for minimal optimization
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
    } catch (error) {
      console.error('Page speed analysis failed:', error);
      return {
        factor_id: 'E.1.1',
        factor_name: 'Page Load Speed Optimization',
        pillar: 'E',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 0.64,
        evidence: [`Error analyzing page speed: ${error.message}`],
        recommendations: ['Unable to analyze page speed - please check manually'],
        processing_time_ms: Date.now() - startTime
      };
    }
  }
}