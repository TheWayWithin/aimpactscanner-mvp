/**
 * Action Items Generator Service
 *
 * Transforms generic FactorResult recommendations into specific,
 * actionable fix items with implementation guidance and code snippets.
 *
 * MASTERY-AI Framework v3.1.1
 */

import { FactorResult } from './types';

export interface ActionItem {
  id: string;
  factor_id: string;
  factor_name: string;
  what: string;
  why: string;
  impact: 'high' | 'medium' | 'low';
  fix_type: 'code' | 'content' | 'config';
  fix: string;
  code_snippet?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assignImpact(score: number, weight: number): 'high' | 'medium' | 'low' {
  if (score < 40 || weight > 1.0) return 'high';
  if (score < 70 || weight >= 0.7) return 'medium';
  return 'low';
}

function extractEvidence(factor: FactorResult, pattern: RegExp): string | undefined {
  for (const ev of factor.evidence) {
    const m = ev.match(pattern);
    if (m) return m[0];
  }
  return undefined;
}

function evidenceContains(factor: FactorResult, text: string): boolean {
  return factor.evidence.some((e) => e.toLowerCase().includes(text.toLowerCase()));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extract a short summary from HTML content for meta description generation. */
function extractContentSummary(html: string, maxLen = 160): string {
  const text = stripHtml(html);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  let summary = '';
  for (const s of sentences) {
    const candidate = summary ? `${summary}. ${s.trim()}` : s.trim();
    if (candidate.length > maxLen) break;
    summary = candidate;
  }
  return summary ? summary.slice(0, maxLen) : text.slice(0, maxLen);
}

/** Extract the page title from HTML. */
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

/** Extract headings from HTML. */
function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const results: Array<{ level: number; text: string }> = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push({ level: parseInt(m[1], 10), text: stripHtml(m[2]) });
  }
  return results;
}

/** Extract images missing alt text from HTML. */
function extractImagesMissingAlt(html: string): Array<{ src: string; context: string }> {
  const results: Array<{ src: string; context: string }> = [];
  const re = /<img[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    const hasAlt = altMatch && altMatch[1].trim().length > 0;
    if (!hasAlt) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : 'unknown';
      // Grab surrounding text as context (100 chars before and after)
      const pos = m.index;
      const before = stripHtml(html.slice(Math.max(0, pos - 150), pos)).slice(-80);
      const after = stripHtml(html.slice(pos + tag.length, pos + tag.length + 150)).slice(0, 80);
      results.push({ src, context: `${before} ... ${after}`.trim() });
    }
  }
  return results;
}

/** Extract question-like sentences from content for FAQ generation. */
function extractQuestions(html: string): string[] {
  const text = stripHtml(html);
  const questions: string[] = [];
  const re = /([A-Z][^.!?]*\?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const q = m[1].trim();
    if (q.length > 15 && q.length < 200) {
      questions.push(q);
    }
  }
  return questions;
}

/** Derive a descriptive alt text suggestion from an image src filename. */
function suggestAltFromSrc(src: string, context: string): string {
  // Extract filename without extension and path
  const parts = src.split('/');
  const filename = parts[parts.length - 1] || '';
  const name = filename
    .replace(/\.[^.]+$/, '') // remove extension
    .replace(/[-_]/g, ' ')  // convert separators to spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case
    .trim();

  if (name && name.length > 3 && !/^(img|image|photo|pic|screenshot)\s*\d*$/i.test(name)) {
    return name;
  }
  // Fall back to surrounding context
  const words = context.split(/\s+/).filter((w) => w.length > 3).slice(0, 6);
  return words.length > 0
    ? `Image related to ${words.join(' ')}`
    : 'Descriptive alt text needed';
}

// ---------------------------------------------------------------------------
// Per-factor action generators
// ---------------------------------------------------------------------------

type ActionGenerator = (
  factor: FactorResult,
  url: string,
  html: string,
  items: ActionItem[],
  counter: Record<string, number>
) => void;

function nextId(factorId: string, counter: Record<string, number>): string {
  const count = (counter[factorId] || 0) + 1;
  counter[factorId] = count;
  return `action-${factorId}-${count}`;
}

// M.1.1 HTTPS
const genHTTPS: ActionGenerator = (f, url, _html, items, ctr) => {
  if (f.score >= 80) return;
  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Site served over HTTP: ${url}`,
    why: 'HTTPS is a ranking signal and required for AI models to trust and cite your content.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'config',
    fix: 'Configure your server to redirect all HTTP traffic to HTTPS. Install an SSL/TLS certificate (free via Let\'s Encrypt) and add a permanent redirect.',
    code_snippet: `# Nginx redirect
server {
  listen 80;
  server_name ${new URL(url).hostname};
  return 301 https://$host$request_uri;
}

# Apache .htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
  });
};

// M.2.1 Title
const genTitle: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const currentTitle = extractTitle(html);
  const what = currentTitle
    ? `Page title "${currentTitle}" (${currentTitle.length} chars)`
    : 'Missing page title tag';

  let suggestedTitle = currentTitle;
  if (!currentTitle) {
    const h1 = extractHeadings(html).find((h) => h.level === 1);
    suggestedTitle = h1 ? h1.text.slice(0, 60) : 'Your Page Title - Primary Keyword | Brand';
  } else if (currentTitle.length < 40) {
    suggestedTitle = `${currentTitle} - Comprehensive Guide | YourBrand`;
    if (suggestedTitle.length > 60) suggestedTitle = suggestedTitle.slice(0, 57) + '...';
  } else if (currentTitle.length > 65) {
    suggestedTitle = currentTitle.slice(0, 57) + '...';
  }

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what,
    why: 'Title tags are the primary signal AI models use to understand and cite page content.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: `Optimize title to 50-60 characters with primary keyword near the front. ${f.recommendations.join('. ')}.`,
    code_snippet: `<title>${suggestedTitle}</title>`,
  });
};

// M.2.2 Meta Description
const genMetaDescription: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const hasMeta = /<meta[^>]*name=["']description["']/i.test(html);
  const summary = extractContentSummary(html);

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: hasMeta
      ? `Meta description needs optimization (${f.recommendations[0]})`
      : 'Missing meta description tag',
    why: 'Meta descriptions appear in search results and AI-generated summaries, directly affecting click-through rate.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: 'Add a compelling meta description between 150-160 characters with a call-to-action and primary keyword.',
    code_snippet: `<meta name="description" content="${summary}">`,
  });
};

// A.2.1 Author
const genAuthor: ActionGenerator = (f, _url, _html, items, ctr) => {
  if (f.score >= 80) return;
  const hasAuthor = evidenceContains(f, 'author information present');

  if (!hasAuthor) {
    items.push({
      id: nextId(f.factor_id, ctr),
      factor_id: f.factor_id,
      factor_name: f.factor_name,
      what: 'No author attribution found on page',
      why: 'Author markup establishes E-E-A-T signals that AI models use to evaluate source credibility.',
      impact: assignImpact(f.score, f.weight),
      fix_type: 'code',
      fix: 'Add visible author information with credentials and link to an author page. Include Person schema markup.',
      code_snippet: `<!-- Author byline -->
<div class="author" itemscope itemtype="https://schema.org/Person">
  <span itemprop="name">Author Name</span>,
  <span itemprop="jobTitle">Title/Credentials</span>
</div>

<!-- JSON-LD Author -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Author Name",
  "jobTitle": "Your Title",
  "url": "https://yoursite.com/about",
  "sameAs": ["https://linkedin.com/in/yourprofile"]
}
</script>`,
    });
  } else {
    // Author exists but missing credentials
    items.push({
      id: nextId(f.factor_id, ctr),
      factor_id: f.factor_id,
      factor_name: f.factor_name,
      what: 'Author information lacks credentials or qualifications',
      why: 'Author credentials strengthen E-E-A-T and increase likelihood of AI citation.',
      impact: assignImpact(f.score, f.weight),
      fix_type: 'content',
      fix: 'Add professional credentials, certifications, or relevant experience to the author section.',
    });
  }
};

// A.3.2 Contact
const genContact: ActionGenerator = (f, url, _html, items, ctr) => {
  if (f.score >= 80) return;
  const missing: string[] = [];
  if (!evidenceContains(f, 'email')) missing.push('email');
  if (!evidenceContains(f, 'phone')) missing.push('phone number');
  if (!evidenceContains(f, 'contact section')) missing.push('contact section');

  const hostname = new URL(url).hostname.replace(/^www\./, '');

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Missing contact elements: ${missing.join(', ')}`,
    why: 'Contact information is a core trust signal that AI models check when evaluating source authority.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'code',
    fix: `Add the missing contact elements (${missing.join(', ')}) to your page footer or a dedicated contact section.`,
    code_snippet: `<section id="contact">
  <h2>Contact Us</h2>
  <p>Email: <a href="mailto:hello@${hostname}">hello@${hostname}</a></p>
  <p>Phone: <a href="tel:+1234567890">(123) 456-7890</a></p>
  <address>123 Business St, City, State 12345</address>
</section>`,
  });
};

// S.2.2 Headings
const genHeadings: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const headings = extractHeadings(html);
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const h3Count = headings.filter((h) => h.level === 3).length;

  const issues: string[] = [];
  if (h1Count === 0) issues.push('missing H1');
  if (h1Count > 1) issues.push(`${h1Count} H1 tags (should be exactly 1)`);
  if (h2Count < 2) issues.push('fewer than 2 H2 tags');
  if (h3Count === 0) issues.push('no H3 tags for detailed hierarchy');

  const h1Text = headings.find((h) => h.level === 1)?.text || 'Your Primary Topic';
  const existingH2s = headings
    .filter((h) => h.level === 2)
    .map((h) => h.text)
    .slice(0, 3);

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Heading hierarchy issues: ${issues.join('; ')}`,
    why: 'AI models parse heading hierarchy to understand content structure and extract key topics.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: `Restructure headings: use exactly one H1, add 3-5 H2 sections, and nest H3s under each H2 for sub-topics.`,
    code_snippet: `<h1>${h1Text}</h1>
  <h2>${existingH2s[0] || 'What Is [Topic]'}</h2>
    <h3>Key Benefits</h3>
    <h3>How It Works</h3>
  <h2>${existingH2s[1] || 'Why [Topic] Matters'}</h2>
    <h3>Industry Statistics</h3>
  <h2>${existingH2s[2] || 'Getting Started with [Topic]'}</h2>
    <h3>Step-by-Step Guide</h3>`,
  });
};

// M.3.1 Structured Data
const genStructuredData: ActionGenerator = (f, url, html, items, ctr) => {
  if (f.score >= 80) return;
  const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["']/i.test(html);
  const title = extractTitle(html);
  const description = extractContentSummary(html, 200);
  const hostname = new URL(url).hostname;

  const schemaTypes: string[] = [];
  // Suggest applicable schema types based on content signals
  if (/article|blog|post|news/i.test(html)) schemaTypes.push('Article');
  if (/product|price|buy|shop/i.test(html)) schemaTypes.push('Product');
  if (/faq|question|answer/i.test(html)) schemaTypes.push('FAQPage');
  if (/how[\s-]to|step|guide|tutorial/i.test(html)) schemaTypes.push('HowTo');
  if (/review|rating|star/i.test(html)) schemaTypes.push('Review');
  if (/service|consulting|agency/i.test(html)) schemaTypes.push('Service');
  if (/about|company|organization/i.test(html)) schemaTypes.push('Organization');
  if (schemaTypes.length === 0) schemaTypes.push('WebPage');

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: hasJsonLd
      ? `Structured data present but incomplete (${f.recommendations.join('; ')})`
      : 'No structured data (JSON-LD) found on page',
    why: 'Structured data is the primary machine-readable format that AI models use to extract and cite information.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'code',
    fix: `Add JSON-LD structured data for: ${schemaTypes.join(', ')}. Place in <head> or end of <body>.`,
    code_snippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${schemaTypes[0]}",
  "headline": "${title}",
  "description": "${description.replace(/"/g, '\\"')}",
  "url": "${url}",
  "publisher": {
    "@type": "Organization",
    "name": "${hostname}",
    "url": "https://${hostname}"
  },
  "datePublished": "${new Date().toISOString().split('T')[0]}",
  "dateModified": "${new Date().toISOString().split('T')[0]}"
}
</script>`,
  });
};

// AI.2.3 FAQ
const genFAQ: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80) return;
  const hasFAQSchema = evidenceContains(f, 'faqpage schema');
  const questions = extractQuestions(html).slice(0, 3);

  if (!hasFAQSchema) {
    const faqItems = questions.length > 0
      ? questions.map((q) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: 'Provide a clear, concise answer here.' },
        }))
      : [
          {
            '@type': 'Question',
            name: 'What is [your primary topic]?',
            acceptedAnswer: { '@type': 'Answer', text: 'Provide a clear, concise answer here.' },
          },
          {
            '@type': 'Question',
            name: 'How does [your service/product] work?',
            acceptedAnswer: { '@type': 'Answer', text: 'Provide a clear, concise answer here.' },
          },
          {
            '@type': 'Question',
            name: 'Why choose [your brand]?',
            acceptedAnswer: { '@type': 'Answer', text: 'Provide a clear, concise answer here.' },
          },
        ];

    items.push({
      id: nextId(f.factor_id, ctr),
      factor_id: f.factor_id,
      factor_name: f.factor_name,
      what: questions.length > 0
        ? `${questions.length} question(s) found in content but no FAQ schema markup`
        : 'No FAQ content or FAQPage schema found',
      why: 'FAQ schema dramatically increases chances of being featured in AI-generated answers and voice search results.',
      impact: assignImpact(f.score, f.weight),
      fix_type: 'code',
      fix: 'Add a visible FAQ section on the page and implement FAQPage structured data to match.',
      code_snippet: `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems }, null, 2)}
</script>`,
    });
  }
};

// M.2.3 Images
const genImages: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const missingAlt = extractImagesMissingAlt(html);
  if (missingAlt.length === 0) return;

  const examples = missingAlt.slice(0, 5);
  const altSuggestions = examples.map((img) => {
    const suggested = suggestAltFromSrc(img.src, img.context);
    return `  <img src="${img.src}" alt="${suggested}">`;
  });

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `${missingAlt.length} image(s) missing descriptive alt text`,
    why: 'Alt text helps AI models understand visual content and is critical for accessibility and image search ranking.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'code',
    fix: `Add descriptive alt text to all ${missingAlt.length} images. Describe what the image shows, not generic labels.`,
    code_snippet: `<!-- Suggested alt text for images missing it -->\n${altSuggestions.join('\n')}`,
  });
};

// S.3.1 Word Count / Content Depth
const genWordCount: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const wordCountMatch = extractEvidence(f, /Word count:\s*(\d+)/);
  const wordCount = wordCountMatch ? parseInt(wordCountMatch.replace(/\D/g, ''), 10) : 0;
  const headings = extractHeadings(html).filter((h) => h.level === 2);

  const expansionAreas = headings.length > 0
    ? headings.map((h) => h.text).slice(0, 4)
    : ['Introduction / Overview', 'Key Benefits', 'How It Works', 'Conclusion'];

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Content depth is limited (${wordCount} words)`,
    why: 'AI models prefer comprehensive content with sufficient depth to extract reliable, citable information.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: `Expand content to 1000+ words. Add depth under these sections: ${expansionAreas.join(', ')}. Include data points, examples, and expert insights.`,
  });
};

// AI.1.1 Citation-Worthy
const genCitationWorthy: ActionGenerator = (f, _url, _html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Low fact density (${extractEvidence(f, /Fact density:.*/) || 'below threshold'})`,
    why: 'AI models prioritize content with verifiable facts, statistics, and expert quotes when selecting sources to cite.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: 'Add 3-5 statistics with sources, include expert quotes with attribution, reference recent studies or reports, and use precise numbers instead of vague language.',
  });
};

// AI.1.2 Source Authority
const genSourceAuthority: ActionGenerator = (f, _url, _html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const missing: string[] = [];
  if (!evidenceContains(f, 'author')) missing.push('author attribution');
  if (!evidenceContains(f, 'references')) missing.push('references section');
  if (!evidenceContains(f, 'professional')) missing.push('professional authority indicators');

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Weak source authority signals: missing ${missing.join(', ')}`,
    why: 'AI models evaluate source authority before citing content; low authority means your content gets skipped.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: 'Add a references section with linked sources, include author bio with credentials, and cite authoritative external sources (.gov, .edu, industry reports).',
  });
};

// AI.1.5 Evidence Chunking
const genEvidenceChunking: ActionGenerator = (f, _url, _html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: 'Content is not optimally structured for AI extraction (RAG)',
    why: 'AI models use retrieval-augmented generation (RAG) to extract content chunks; poorly structured content gets missed.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: 'Restructure content into 150-300 word sections under clear H2/H3 headings. Each section should cover one distinct sub-topic. Add bullet lists and internal links between sections.',
  });
};

// A.3.1 Transparency
const genTransparency: ActionGenerator = (f, _url, _html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const missing: string[] = [];
  if (!evidenceContains(f, 'disclosure')) missing.push('disclosure statement');
  if (!evidenceContains(f, 'methodology')) missing.push('methodology section');
  if (!evidenceContains(f, 'update information')) missing.push('publication/update dates');

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Missing transparency elements: ${missing.join(', ')}`,
    why: 'Transparency signals (methodology, disclosures, dates) are trust factors that AI models use to evaluate content reliability.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'content',
    fix: 'Add a methodology/editorial process section explaining how content is created and verified. Include publication and last-updated dates. Add disclosure statements if applicable.',
  });
};

// E.1.1 / P.1.1 Page Speed
const genPageSpeed: ActionGenerator = (f, _url, html, items, ctr) => {
  if (f.score >= 80 || f.recommendations.length === 0) return;
  const improvements: string[] = [];
  const snippets: string[] = [];

  const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
  const hasLazy = /loading=["']lazy["']/i.test(html);
  const hasMinified = /\.min\.(js|css)/i.test(html);
  const hasPreload = /<link[^>]*rel=["']preload["']/i.test(html);
  const scriptCount = (html.match(/<script[^>]*src=/gi) || []).length;

  if (imgCount > 3 && !hasLazy) {
    improvements.push('Add lazy loading to below-the-fold images');
    snippets.push('<img src="image.jpg" alt="description" loading="lazy" width="800" height="600">');
  }
  if (!hasMinified) {
    improvements.push('Minify CSS and JavaScript files');
  }
  if (!hasPreload) {
    improvements.push('Preload critical resources (fonts, hero images)');
    snippets.push('<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>');
  }
  if (scriptCount > 5) {
    improvements.push('Defer non-critical scripts');
    snippets.push('<script src="analytics.js" defer></script>');
  }

  if (improvements.length === 0) improvements.push('Run PageSpeed Insights for detailed recommendations');

  items.push({
    id: nextId(f.factor_id, ctr),
    factor_id: f.factor_id,
    factor_name: f.factor_name,
    what: `Page speed below optimal (score: ${f.score})`,
    why: 'Slow pages are deprioritized by AI crawlers and search engines; speed directly impacts indexing frequency.',
    impact: assignImpact(f.score, f.weight),
    fix_type: 'code',
    fix: improvements.join('. ') + '.',
    ...(snippets.length > 0 ? { code_snippet: snippets.join('\n\n') } : {}),
  });
};

// llms.txt check (synthetic - checks evidence across all factors)
function genLlmsTxt(
  factors: FactorResult[],
  url: string,
  _html: string,
  items: ActionItem[],
  counter: Record<string, number>
): void {
  // Check if any factor evidence mentions llms.txt
  const hasLlmsTxt = factors.some((f) =>
    f.evidence.some((e) => e.toLowerCase().includes('llms.txt'))
  );
  if (hasLlmsTxt) return;

  const hostname = new URL(url).hostname;
  const encodedUrl = encodeURIComponent(url);

  items.push({
    id: nextId('llms-txt', counter),
    factor_id: 'llms-txt',
    factor_name: 'LLMs.txt File',
    what: 'No llms.txt file detected for AI model discovery',
    why: 'An llms.txt file tells AI models what your site is about and how to cite it, dramatically improving AI visibility.',
    impact: 'high',
    fix_type: 'config',
    fix: `Create an llms.txt file at https://${hostname}/llms.txt. Use LLM.txt Mastery to generate one automatically.`,
    code_snippet: `# Example llms.txt for ${hostname}
# Title: Your Site Name
# Description: Brief description of your site's purpose and expertise.
# URL: ${url}

## About
Your site's main value proposition.

## Key Topics
- Topic 1
- Topic 2

---
Generate yours at: https://llmtxtmastery.com/?url=${encodedUrl}`,
  });
}

// ---------------------------------------------------------------------------
// Factor-to-generator mapping
// ---------------------------------------------------------------------------

const FACTOR_GENERATORS: Record<string, ActionGenerator> = {
  'M.1.1': genHTTPS,
  'M.2.1': genTitle,
  'M.2.2': genMetaDescription,
  'A.2.1': genAuthor,
  'A.3.2': genContact,
  'S.2.2': genHeadings,
  'M.3.1': genStructuredData,
  'AI.2.3': genFAQ,
  'M.2.3': genImages,
  'S.3.1': genWordCount,
  'AI.1.1': genCitationWorthy,
  'AI.1.2': genSourceAuthority,
  'AI.1.5': genEvidenceChunking,
  'A.3.1': genTransparency,
  'E.1.1': genPageSpeed,
  'P.1.1': genPageSpeed,
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function generateActionItems(
  factors: FactorResult[],
  url: string,
  htmlContent: string
): ActionItem[] {
  const items: ActionItem[] = [];
  const counter: Record<string, number> = {};

  // Build a weight lookup for sorting
  const weightMap = new Map<string, number>();
  for (const f of factors) {
    weightMap.set(f.factor_id, f.weight);
  }

  // Process each factor that has score < 80 and recommendations
  for (const factor of factors) {
    if (factor.score >= 80 && factor.recommendations.length === 0) continue;

    const generator = FACTOR_GENERATORS[factor.factor_id];
    if (generator) {
      generator(factor, url, htmlContent, items, counter);
    }
  }

  // llms.txt check (cross-factor)
  genLlmsTxt(factors, url, htmlContent, items, counter);

  // Sort: high impact first, then by factor weight (descending)
  items.sort((a, b) => {
    const impactDiff = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
    if (impactDiff !== 0) return impactDiff;
    const weightA = weightMap.get(a.factor_id) || 0;
    const weightB = weightMap.get(b.factor_id) || 0;
    return weightB - weightA;
  });

  return items;
}
