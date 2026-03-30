/**
 * Schema Generation & Validation Engine
 *
 * Analyzes page content for existing structured data, detects
 * applicable schema types, generates ready-to-paste JSON-LD,
 * and validates against Google Rich Results requirements.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SchemaResult {
  detected: DetectedSchema[];
  missing: MissingSchema[];
  generated: GeneratedSchema[];
  validation: SchemaValidation[];
  completeness_score: number;
}

export interface DetectedSchema {
  type: string;
  source: 'json-ld' | 'microdata' | 'rdfa';
  valid: boolean;
  issues: string[];
}

export interface MissingSchema {
  type: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GeneratedSchema {
  type: string;
  json_ld: string;
  description: string;
}

export interface SchemaValidation {
  type: string;
  field: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags and collapse whitespace. */
function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract content of the first matching tag. */
function extractTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

/** Extract an attribute value from the first matching element. */
function extractAttr(html: string, selector: RegExp): string {
  const m = html.match(selector);
  return m ? m[1].trim() : '';
}

/** Extract meta tag content by name or property. */
function extractMeta(html: string, name: string): string {
  const byName = new RegExp(
    `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const byProp = new RegExp(
    `<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  // Also handle content before name/property
  const byNameRev = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`,
    'i'
  );
  const byPropRev = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`,
    'i'
  );

  return (
    extractAttr(html, byName) ||
    extractAttr(html, byProp) ||
    extractAttr(html, byNameRev) ||
    extractAttr(html, byPropRev)
  );
}

/** Parse URL into its parts. */
function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Word count of plain text. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Wrap a schema object as a ready-to-paste JSON-LD script block. */
function wrapJsonLd(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

// ---------------------------------------------------------------------------
// 1. Schema Detection
// ---------------------------------------------------------------------------

interface ParsedSchema {
  type: string;
  source: 'json-ld' | 'microdata' | 'rdfa';
  data: Record<string, unknown>;
}

function detectSchemas(html: string): ParsedSchema[] {
  const found: ParsedSchema[] = [];

  // --- JSON-LD ---
  const jsonLdRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : [parsed];
      for (const item of items) {
        const type = (item['@type'] as string) || 'Unknown';
        found.push({ type, source: 'json-ld', data: item });
      }
    } catch {
      // malformed JSON-LD -- recorded later in validation
      found.push({
        type: 'Unknown',
        source: 'json-ld',
        data: { _malformed: true },
      });
    }
  }

  // --- Microdata ---
  const microdataRe = /itemtype=["'](https?:\/\/schema\.org\/(\w+))["']/gi;
  while ((m = microdataRe.exec(html)) !== null) {
    found.push({ type: m[2], source: 'microdata', data: {} });
  }

  // --- RDFa ---
  const rdfaRe = /typeof=["'](?:schema:)?(\w+)["']/gi;
  while ((m = rdfaRe.exec(html)) !== null) {
    found.push({ type: m[1], source: 'rdfa', data: {} });
  }

  return found;
}

// ---------------------------------------------------------------------------
// 2. Schema Applicability Detection
// ---------------------------------------------------------------------------

interface ApplicableSchema {
  type: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

function detectApplicableSchemas(
  url: string,
  html: string,
  plainText: string
): ApplicableSchema[] {
  const applicable: ApplicableSchema[] = [];
  const parsed = parseUrl(url);
  const path = parsed?.pathname ?? '/';
  const words = wordCount(plainText);
  const lowerText = plainText.toLowerCase();
  const lowerHtml = html.toLowerCase();

  // WebSite -- homepage
  if (path === '/' || path === '') {
    applicable.push({
      type: 'WebSite',
      reason: 'Page is the homepage -- WebSite schema enables sitelinks searchbox in SERPs',
      priority: 'high',
    });
  }

  // Organization -- homepage or about page
  if (path === '/' || path === '' || /\/about\/?$/i.test(path)) {
    applicable.push({
      type: 'Organization',
      reason: 'Homepage or about page should declare Organization identity',
      priority: 'high',
    });
  }

  // BreadcrumbList -- 2+ path segments
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    applicable.push({
      type: 'BreadcrumbList',
      reason: `URL has ${segments.length} path segments -- breadcrumbs improve navigation in SERPs`,
      priority: 'medium',
    });
  }

  // Article -- substantial text with title and date indicators
  const hasDateIndicator =
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/.test(plainText) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}\b/i.test(
      plainText
    ) ||
    /datetime=["'][^"']+["']/i.test(html) ||
    /<time[^>]*>/i.test(html);

  if (words >= 300 && hasDateIndicator) {
    applicable.push({
      type: 'Article',
      reason: 'Page has substantial text content (300+ words) with date indicators -- Article schema enables rich results',
      priority: 'high',
    });
  }

  // FAQPage -- FAQ section or 3+ questions
  const faqTerms =
    /frequently\s+asked\s+questions?|faq|q\s*&\s*a|questions?\s+and\s+answers?/i;
  const questionCount = (plainText.match(/\?/g) || []).length;
  if (faqTerms.test(lowerText) || questionCount >= 3) {
    applicable.push({
      type: 'FAQPage',
      reason: 'Page contains FAQ content or multiple questions -- FAQPage schema enables expanded FAQ rich results',
      priority: 'high',
    });
  }

  // HowTo -- step-by-step instructions
  const howToPatterns =
    /step\s*[1-9]|step\s+one|step\s+two|how\s+to\b/i;
  const hasOrderedList = /<ol[\s>]/i.test(html);
  if (howToPatterns.test(lowerText) || (hasOrderedList && words >= 200)) {
    applicable.push({
      type: 'HowTo',
      reason: 'Page contains step-by-step instructions -- HowTo schema enables how-to rich results',
      priority: 'medium',
    });
  }

  // Product -- price indicators + product-like content
  const pricePattern = /\$\d+|\bprice\b|\bcost\b|\bbuy\b|\badd\s+to\s+cart\b/i;
  if (pricePattern.test(lowerText) || pricePattern.test(lowerHtml)) {
    applicable.push({
      type: 'Product',
      reason: 'Page contains price indicators -- Product schema enables price/availability rich results',
      priority: 'high',
    });
  }

  return applicable;
}

// ---------------------------------------------------------------------------
// 3. Schema Validation
// ---------------------------------------------------------------------------

/** Required and recommended fields per schema type (Google Rich Results). */
const FIELD_REQUIREMENTS: Record<
  string,
  { required: string[]; recommended: string[] }
> = {
  Article: {
    required: ['headline', 'datePublished', 'author'],
    recommended: ['image', 'dateModified', 'publisher', 'description'],
  },
  FAQPage: {
    required: ['mainEntity'],
    recommended: [],
  },
  Product: {
    required: ['name'],
    recommended: ['offers', 'review', 'aggregateRating', 'image', 'description'],
  },
  Organization: {
    required: ['name', 'url'],
    recommended: ['logo', 'sameAs', 'description'],
  },
  BreadcrumbList: {
    required: ['itemListElement'],
    recommended: [],
  },
  WebSite: {
    required: ['name', 'url'],
    recommended: ['potentialAction'],
  },
  HowTo: {
    required: ['name', 'step'],
    recommended: ['description', 'totalTime', 'image'],
  },
};

function validateSchema(
  schemaType: string,
  data: Record<string, unknown>
): SchemaValidation[] {
  const results: SchemaValidation[] = [];
  const reqs = FIELD_REQUIREMENTS[schemaType];
  if (!reqs) return results;

  if ((data as Record<string, unknown>)._malformed) {
    results.push({
      type: schemaType,
      field: 'JSON',
      issue: 'JSON-LD block contains invalid JSON -- browsers and search engines will ignore it',
      severity: 'error',
    });
    return results;
  }

  for (const field of reqs.required) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      results.push({
        type: schemaType,
        field,
        issue: `Missing required field "${field}" -- Google will not generate a rich result without it`,
        severity: 'error',
      });
    }
  }

  // Additional structural checks
  if (schemaType === 'FAQPage' && data.mainEntity) {
    if (!Array.isArray(data.mainEntity)) {
      results.push({
        type: 'FAQPage',
        field: 'mainEntity',
        issue: 'mainEntity must be an array of Question objects',
        severity: 'error',
      });
    } else {
      for (let i = 0; i < (data.mainEntity as unknown[]).length; i++) {
        const item = (data.mainEntity as Record<string, unknown>[])[i];
        if (item['@type'] !== 'Question') {
          results.push({
            type: 'FAQPage',
            field: `mainEntity[${i}].@type`,
            issue: `Item must have @type "Question", found "${item['@type'] ?? 'none'}"`,
            severity: 'error',
          });
        }
        if (!item.acceptedAnswer) {
          results.push({
            type: 'FAQPage',
            field: `mainEntity[${i}].acceptedAnswer`,
            issue: 'Each Question must have an acceptedAnswer',
            severity: 'error',
          });
        }
      }
    }
  }

  if (schemaType === 'BreadcrumbList' && data.itemListElement) {
    if (!Array.isArray(data.itemListElement)) {
      results.push({
        type: 'BreadcrumbList',
        field: 'itemListElement',
        issue: 'itemListElement must be an array of ListItem objects',
        severity: 'error',
      });
    }
  }

  if (schemaType === 'Product') {
    const hasOffers = 'offers' in data;
    const hasReview = 'review' in data;
    const hasRating = 'aggregateRating' in data;
    if (!hasOffers && !hasReview && !hasRating) {
      results.push({
        type: 'Product',
        field: 'offers/review/aggregateRating',
        issue:
          'Product must have at least one of: offers, review, or aggregateRating for rich results',
        severity: 'error',
      });
    }
  }

  for (const field of reqs.recommended) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      results.push({
        type: schemaType,
        field,
        issue: `Missing recommended field "${field}" -- adding it may improve rich result appearance`,
        severity: 'warning',
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 4. Schema Generation
// ---------------------------------------------------------------------------

function generateArticleSchema(
  url: string,
  html: string,
  plainText: string
): GeneratedSchema {
  const title = extractTag(html, 'title') || extractTag(html, 'h1') || 'Page Title';
  const description = extractMeta(html, 'description') || plainText.slice(0, 160);

  // Try to find date
  const dateMatch =
    plainText.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/) ||
    html.match(/datetime=["']([^"']+)["']/i);
  const datePublished = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

  // Try to find author
  const authorMeta = extractMeta(html, 'author');
  const authorMatch = plainText.match(/(?:by|author)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);
  const author = authorMeta || (authorMatch ? authorMatch[1] : 'Author Name');

  // Try to find image
  const ogImage = extractMeta(html, 'og:image');
  const firstImg = extractAttr(html, /<img[^>]+src=["']([^"']+)["']/i);
  const image = ogImage || firstImg || 'https://example.com/image.jpg';

  const parsed = parseUrl(url);
  const domain = parsed?.hostname ?? 'example.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: stripTags(title).slice(0, 110),
    description: stripTags(description).slice(0, 300),
    datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    image,
    publisher: {
      '@type': 'Organization',
      name: domain,
      logo: {
        '@type': 'ImageObject',
        url: `${parsed?.origin ?? 'https://' + domain}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return {
    type: 'Article',
    json_ld: wrapJsonLd(schema),
    description:
      'Article schema enables rich results with headline, author, date, and thumbnail in search.',
  };
}

function generateFAQSchema(html: string): GeneratedSchema {
  // Extract Q&A pairs: look for headings followed by paragraphs
  const qaPairs: Array<{ question: string; answer: string }> = [];

  // Pattern 1: h2/h3/h4 with question mark followed by next paragraph
  const headingRe =
    /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>\s*(?:<[^>]+>\s*)*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    const q = stripTags(m[1]).trim();
    const a = stripTags(m[2]).trim();
    if (q.includes('?') && a.length > 10) {
      qaPairs.push({ question: q, answer: a });
    }
  }

  // Pattern 2: dt/dd pairs
  const dtddRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  while ((m = dtddRe.exec(html)) !== null) {
    const q = stripTags(m[1]).trim();
    const a = stripTags(m[2]).trim();
    if (q.length > 5 && a.length > 10) {
      qaPairs.push({ question: q, answer: a });
    }
  }

  // Fallback: if no pairs found, create placeholder entries
  if (qaPairs.length === 0) {
    qaPairs.push(
      { question: 'What is [your topic]?', answer: 'Replace with your answer.' },
      {
        question: 'How does [your product/service] work?',
        answer: 'Replace with your answer.',
      }
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qaPairs.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  };

  return {
    type: 'FAQPage',
    json_ld: wrapJsonLd(schema),
    description:
      'FAQPage schema enables expanded FAQ rich results directly in search, increasing click-through rate.',
  };
}

function generateHowToSchema(
  html: string,
  plainText: string
): GeneratedSchema {
  const title =
    extractTag(html, 'title') || extractTag(html, 'h1') || 'How To Guide';

  // Try to extract steps from ordered lists
  const steps: Array<{ name: string; text: string }> = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;

  // Find the first <ol> block
  const olMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  const listHtml = olMatch ? olMatch[1] : html;

  while ((m = liRe.exec(listHtml)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text.length > 5) {
      steps.push({
        name: text.slice(0, 80),
        text,
      });
    }
    if (steps.length >= 10) break;
  }

  // Fallback: extract "Step N" patterns
  if (steps.length === 0) {
    const stepRe = /step\s*(\d+)[:\s.\-]*([\s\S]{10,200}?)(?=step\s*\d+|$)/gi;
    while ((m = stepRe.exec(plainText)) !== null) {
      steps.push({
        name: `Step ${m[1]}`,
        text: m[2].trim(),
      });
      if (steps.length >= 10) break;
    }
  }

  if (steps.length === 0) {
    steps.push(
      { name: 'Step 1', text: 'Replace with your first step.' },
      { name: 'Step 2', text: 'Replace with your second step.' }
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: stripTags(title),
    description:
      extractMeta(html, 'description') || plainText.slice(0, 160),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  return {
    type: 'HowTo',
    json_ld: wrapJsonLd(schema),
    description:
      'HowTo schema enables step-by-step rich results with expandable instructions in search.',
  };
}

function generateProductSchema(
  url: string,
  html: string,
  plainText: string
): GeneratedSchema {
  const title =
    extractTag(html, 'title') || extractTag(html, 'h1') || 'Product Name';
  const description =
    extractMeta(html, 'description') || plainText.slice(0, 300);

  // Try to extract price
  const priceMatch = plainText.match(
    /\$\s*([\d,]+\.?\d{0,2})/
  );
  const price = priceMatch ? priceMatch[1].replace(/,/g, '') : '0.00';

  const ogImage = extractMeta(html, 'og:image');
  const firstImg = extractAttr(html, /<img[^>]+src=["']([^"']+)["']/i);
  const image = ogImage || firstImg || 'https://example.com/product.jpg';

  const currency = 'USD';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: stripTags(title),
    description: stripTags(description).slice(0, 300),
    image,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url,
    },
  };

  return {
    type: 'Product',
    json_ld: wrapJsonLd(schema),
    description:
      'Product schema enables price, availability, and review rich results in search.',
  };
}

function generateOrganizationSchema(
  url: string,
  html: string
): GeneratedSchema {
  const parsed = parseUrl(url);
  const domain = parsed?.hostname ?? 'example.com';
  const origin = parsed?.origin ?? `https://${domain}`;

  // Try to find org name from title or og:site_name
  const siteName =
    extractMeta(html, 'og:site_name') ||
    extractTag(html, 'title')?.split(/[|\-–]/).pop()?.trim() ||
    domain;

  // Look for logo
  const logoRe = /<img[^>]*(?:class|alt|src)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i;
  const logoRev = /<img[^>]*src=["']([^"']+logo[^"']*)["']/i;
  const logoUrl =
    extractAttr(html, logoRe) ||
    extractAttr(html, logoRev) ||
    `${origin}/logo.png`;

  // Look for social links
  const socialRe =
    /href=["'](https?:\/\/(?:www\.)?(?:facebook|twitter|x|linkedin|instagram|youtube|github)\.com\/[^"']+)["']/gi;
  const sameAs: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = socialRe.exec(html)) !== null) {
    if (!sameAs.includes(sm[1])) {
      sameAs.push(sm[1]);
    }
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: stripTags(siteName),
    url: origin,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl.startsWith('http') ? logoUrl : `${origin}${logoUrl}`,
    },
  };

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return {
    type: 'Organization',
    json_ld: wrapJsonLd(schema),
    description:
      'Organization schema establishes brand identity and enables Knowledge Panel in search.',
  };
}

function generateBreadcrumbSchema(url: string): GeneratedSchema {
  const parsed = parseUrl(url);
  if (!parsed) {
    return {
      type: 'BreadcrumbList',
      json_ld: '',
      description: 'Could not parse URL for breadcrumb generation.',
    };
  }

  const origin = parsed.origin;
  const segments = parsed.pathname.split('/').filter(Boolean);

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: origin,
    },
  ];

  let pathAccum = '';
  for (let i = 0; i < segments.length; i++) {
    pathAccum += `/${segments[i]}`;
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: segments[i]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${origin}${pathAccum}`,
    });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };

  return {
    type: 'BreadcrumbList',
    json_ld: wrapJsonLd(schema),
    description:
      'BreadcrumbList schema enables breadcrumb navigation trail in search results.',
  };
}

function generateWebSiteSchema(url: string, html: string): GeneratedSchema {
  const parsedUrl = parseUrl(url);
  const origin = parsedUrl?.origin ?? url;
  const domain = parsedUrl?.hostname ?? 'example.com';

  const siteName =
    extractMeta(html, 'og:site_name') ||
    extractTag(html, 'title')?.split(/[|\-–]/).pop()?.trim() ||
    domain;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: stripTags(siteName),
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return {
    type: 'WebSite',
    json_ld: wrapJsonLd(schema),
    description:
      'WebSite schema enables Sitelinks Searchbox directly in Google search results.',
  };
}

// Generator dispatch map
const GENERATORS: Record<
  string,
  (url: string, html: string, plainText: string) => GeneratedSchema
> = {
  Article: generateArticleSchema,
  FAQPage: (_url, html) => generateFAQSchema(html),
  HowTo: (_url, html, plainText) => generateHowToSchema(html, plainText),
  Product: generateProductSchema,
  Organization: (url, html) => generateOrganizationSchema(url, html),
  BreadcrumbList: (url) => generateBreadcrumbSchema(url),
  WebSite: (url, html) => generateWebSiteSchema(url, html),
};

// ---------------------------------------------------------------------------
// 5. Main entry point
// ---------------------------------------------------------------------------

export function analyzeAndGenerateSchema(
  url: string,
  htmlContent: string
): SchemaResult {
  const plainText = stripTags(htmlContent);

  // 1. Detect existing schemas
  const parsedSchemas = detectSchemas(htmlContent);
  const detectedTypes = new Set<string>();

  const detected: DetectedSchema[] = parsedSchemas.map((ps) => {
    detectedTypes.add(ps.type);
    const issues = validateSchema(ps.type, ps.data);
    return {
      type: ps.type,
      source: ps.source,
      valid: issues.filter((v) => v.severity === 'error').length === 0,
      issues: issues
        .filter((v) => v.severity === 'error')
        .map((v) => `${v.field}: ${v.issue}`),
    };
  });

  // 2. Determine applicable schemas
  const applicable = detectApplicableSchemas(url, htmlContent, plainText);

  // 3. Build validation results for detected schemas
  const validation: SchemaValidation[] = [];
  for (const ps of parsedSchemas) {
    validation.push(...validateSchema(ps.type, ps.data));
  }

  // 4. Find missing schemas and generate JSON-LD
  const missing: MissingSchema[] = [];
  const generated: GeneratedSchema[] = [];

  for (const schema of applicable) {
    if (!detectedTypes.has(schema.type)) {
      missing.push({
        type: schema.type,
        reason: schema.reason,
        priority: schema.priority,
      });

      const generator = GENERATORS[schema.type];
      if (generator) {
        generated.push(generator(url, htmlContent, plainText));
      }
    }
  }

  // 5. Completeness score
  const totalApplicable = applicable.length;
  let validPresent = 0;
  for (const schema of applicable) {
    const det = detected.find(
      (d) => d.type === schema.type && d.valid
    );
    if (det) {
      validPresent++;
    }
  }

  const completeness_score =
    totalApplicable > 0
      ? Math.round((validPresent / totalApplicable) * 100)
      : 100; // No applicable schemas means nothing is missing

  return {
    detected,
    missing,
    generated,
    validation,
    completeness_score,
  };
}
