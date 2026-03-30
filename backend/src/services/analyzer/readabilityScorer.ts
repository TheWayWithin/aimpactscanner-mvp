/**
 * AI-Focused Readability Scoring Engine
 *
 * Analyzes page content for how well AI models can consume and cite it.
 * Evaluates 7 factors: sentence clarity, term consistency, logical flow,
 * chunking quality, definition coverage, claim-evidence pairing, and
 * answer-engine formatting.
 */

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface ReadabilityResult {
  overall_score: number;
  factors: ReadabilityFactor[];
  top_improvements: ReadabilityImprovement[];
}

export interface ReadabilityFactor {
  name: string;
  key: string;
  score: number;
  description: string;
  details: string;
}

export interface ReadabilityImprovement {
  factor: string;
  issue: string;
  original: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Factor weights (must sum to 1.0)
// ---------------------------------------------------------------------------

const WEIGHTS: Record<string, number> = {
  sentence_clarity: 0.20,
  term_consistency: 0.15,
  logical_flow: 0.15,
  chunking_quality: 0.15,
  definition_coverage: 0.10,
  claim_evidence: 0.15,
  answer_engine: 0.10,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip all HTML tags and decode common entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split text into sentences on . ! ? boundaries. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** Count words in a string. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/** Rough syllable count by counting vowel groups. */
function syllableCount(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 2) return 1;
  const groups = cleaned.match(/[aeiouy]+/g);
  if (!groups) return 1;
  let count = groups.length;
  // Silent-e heuristic
  if (cleaned.endsWith('e') && count > 1) count--;
  return Math.max(count, 1);
}

/** Clamp a number between min and max. */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Truncate a string to maxLen characters, adding ellipsis if needed. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3).trimEnd() + '...';
}

/** Extract text content from HTML paragraphs. */
function extractParagraphs(html: string): string[] {
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  return matches.map(m => stripHtml(m)).filter(t => t.length > 0);
}

/** Extract headings with their level. */
function extractHeadings(html: string): { level: number; text: string }[] {
  const results: { level: number; text: string }[] = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    results.push({ level: parseInt(match[1], 10), text: stripHtml(match[2]) });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Factor 1: Sentence Clarity (20%)
// ---------------------------------------------------------------------------

function scoreSentenceClarity(plainText: string): ReadabilityFactor {
  const sentences = splitSentences(plainText);
  if (sentences.length === 0) {
    return {
      name: 'Sentence Clarity',
      key: 'sentence_clarity',
      score: 30,
      description: 'How clear and concise sentences are for AI comprehension.',
      details: 'No sentences detected in content.',
    };
  }

  const sentenceLengths = sentences.map(s => wordCount(s));
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  // Passive voice detection
  const passiveRegex = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
  const passiveMatches = plainText.match(passiveRegex) || [];
  const passiveRatio = passiveMatches.length / sentences.length;

  // Jargon / complex word ratio (3+ syllable words)
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const complexWords = words.filter(w => syllableCount(w) >= 3);
  const jargonRatio = words.length > 0 ? complexWords.length / words.length : 0;

  // Score components
  let lengthScore: number;
  if (avgLength <= 20) lengthScore = 100;
  else if (avgLength <= 25) lengthScore = 80;
  else if (avgLength <= 30) lengthScore = 60;
  else if (avgLength <= 40) lengthScore = 40;
  else lengthScore = 20;

  let passiveScore: number;
  if (passiveRatio < 0.10) passiveScore = 100;
  else if (passiveRatio < 0.20) passiveScore = 70;
  else if (passiveRatio < 0.30) passiveScore = 45;
  else passiveScore = 20;

  let jargonScore: number;
  if (jargonRatio < 0.15) jargonScore = 100;
  else if (jargonRatio < 0.25) jargonScore = 70;
  else if (jargonRatio < 0.35) jargonScore = 45;
  else jargonScore = 20;

  const score = clamp(Math.round(lengthScore * 0.4 + passiveScore * 0.3 + jargonScore * 0.3), 0, 100);

  const details = [
    `Avg sentence length: ${avgLength.toFixed(1)} words`,
    `Passive voice: ${(passiveRatio * 100).toFixed(1)}% of sentences`,
    `Complex words (3+ syllables): ${(jargonRatio * 100).toFixed(1)}%`,
  ].join('. ');

  return {
    name: 'Sentence Clarity',
    key: 'sentence_clarity',
    score,
    description: 'How clear and concise sentences are for AI comprehension.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 2: Term Consistency (15%)
// ---------------------------------------------------------------------------

function scoreTermConsistency(plainText: string): ReadabilityFactor {
  // Find capitalized multi-word terms (potential proper nouns / product names)
  const termRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const terms: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = termRegex.exec(plainText)) !== null) {
    terms.push(match[1]);
  }

  // Find acronyms
  const acronymRegex = /\b([A-Z]{2,6})\b/g;
  const acronyms: string[] = [];
  while ((match = acronymRegex.exec(plainText)) !== null) {
    acronyms.push(match[1]);
  }

  // Check for acronym / full-name inconsistencies:
  // An acronym appears without ever being defined alongside the full name
  let inconsistencies = 0;
  const definitionPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\(([A-Z]{2,6})\)/g;
  const definedAcronyms = new Set<string>();
  while ((match = definitionPattern.exec(plainText)) !== null) {
    definedAcronyms.add(match[2]);
  }

  const uniqueAcronyms = new Set(acronyms);
  for (const acr of uniqueAcronyms) {
    // Skip very common ones that don't need definition
    if (['US', 'UK', 'EU', 'AI', 'IT', 'HR', 'PR', 'CEO', 'CTO', 'API', 'URL', 'HTML', 'CSS', 'SEO', 'FAQ'].includes(acr)) continue;
    if (!definedAcronyms.has(acr)) {
      inconsistencies++;
    }
  }

  const score = clamp(100 - inconsistencies * 15, 0, 100);

  const details = inconsistencies === 0
    ? 'All terms used consistently. No undefined acronyms detected.'
    : `Found ${inconsistencies} acronym(s) used without definition (e.g. ${[...uniqueAcronyms].filter(a => !definedAcronyms.has(a) && !['US', 'UK', 'EU', 'AI', 'IT', 'HR', 'PR', 'CEO', 'CTO', 'API', 'URL', 'HTML', 'CSS', 'SEO', 'FAQ'].includes(a)).slice(0, 3).join(', ')}).`;

  return {
    name: 'Term Consistency',
    key: 'term_consistency',
    score,
    description: 'Whether concepts are referred to consistently throughout the content.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 3: Logical Flow (15%)
// ---------------------------------------------------------------------------

function scoreLogicalFlow(html: string, totalWords: number): ReadabilityFactor {
  const headings = extractHeadings(html);

  if (headings.length === 0) {
    const score = totalWords < 200 ? 60 : 25;
    return {
      name: 'Logical Flow',
      key: 'logical_flow',
      score,
      description: 'Whether content follows a logical heading hierarchy.',
      details: totalWords < 200
        ? 'Short content with no headings detected; acceptable for brief pages.'
        : 'No headings found. Content lacks structural hierarchy for AI parsing.',
    };
  }

  // Check hierarchy: no skipping levels
  let hierarchyErrors = 0;
  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level;
    if (jump > 1) hierarchyErrors++;
  }

  const hierarchyScore = headings.length > 1
    ? clamp(100 - hierarchyErrors * 25, 0, 100)
    : 100;

  // Heading density: ideal ~1 heading per 300 words
  const idealHeadings = Math.max(1, Math.floor(totalWords / 300));
  const densityRatio = headings.length / idealHeadings;
  let densityScore: number;
  if (densityRatio >= 0.8 && densityRatio <= 2.0) densityScore = 100;
  else if (densityRatio >= 0.5) densityScore = 70;
  else if (densityRatio >= 0.3) densityScore = 45;
  else densityScore = 20;

  const score = clamp(Math.round(hierarchyScore * 0.6 + densityScore * 0.4), 0, 100);

  const details = [
    `${headings.length} heading(s) found`,
    `Hierarchy errors: ${hierarchyErrors}`,
    `Heading density: ${densityRatio.toFixed(1)}x ideal (1 per 300 words)`,
  ].join('. ');

  return {
    name: 'Logical Flow',
    key: 'logical_flow',
    score,
    description: 'Whether content follows a logical heading hierarchy.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 4: Chunking Quality (15%)
// ---------------------------------------------------------------------------

function scoreChunkingQuality(html: string, totalWords: number): ReadabilityFactor {
  const paragraphs = extractParagraphs(html);
  const headings = extractHeadings(html);
  const listCount = (html.match(/<(ul|ol)\b/gi) || []).length;
  const boldCount = (html.match(/<(strong|b)\b/gi) || []).length;

  if (totalWords === 0) {
    return {
      name: 'Chunking Quality',
      key: 'chunking_quality',
      score: 30,
      description: 'How well content is broken into scannable, digestible chunks.',
      details: 'No content detected.',
    };
  }

  // Average paragraph length
  const paraLengths = paragraphs.map(p => wordCount(p));
  const avgParaLength = paraLengths.length > 0
    ? paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length
    : totalWords; // if no <p> tags, treat all as one block

  let paraScore: number;
  if (avgParaLength <= 60) paraScore = 100;
  else if (avgParaLength <= 100) paraScore = 80;
  else if (avgParaLength <= 150) paraScore = 55;
  else paraScore = 25;

  // Scannable elements bonus
  const scannableElements = listCount + headings.length + Math.min(boldCount, 10);
  const scannableRatio = scannableElements / Math.max(1, Math.ceil(totalWords / 100));
  let scannableScore: number;
  if (scannableRatio >= 1.0) scannableScore = 100;
  else if (scannableRatio >= 0.5) scannableScore = 75;
  else if (scannableRatio >= 0.2) scannableScore = 50;
  else scannableScore = 25;

  const score = clamp(Math.round(paraScore * 0.6 + scannableScore * 0.4), 0, 100);

  const details = [
    `${paragraphs.length} paragraph(s), avg ${avgParaLength.toFixed(0)} words`,
    `${listCount} list(s), ${headings.length} heading(s), ${boldCount} bold element(s)`,
  ].join('. ');

  return {
    name: 'Chunking Quality',
    key: 'chunking_quality',
    score,
    description: 'How well content is broken into scannable, digestible chunks.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 5: Definition Coverage (10%)
// ---------------------------------------------------------------------------

function scoreDefinitionCoverage(plainText: string): ReadabilityFactor {
  // Find technical / jargon terms: capitalized multi-word phrases,
  // words with special characters (camelCase, snake_case)
  const technicalTerms = new Set<string>();

  // Capitalized multi-word terms
  const multiWordRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match: RegExpExecArray | null;
  while ((match = multiWordRegex.exec(plainText)) !== null) {
    technicalTerms.add(match[1]);
  }

  // All-caps acronyms (2-6 letters, not common)
  const acronymRegex = /\b([A-Z]{2,6})\b/g;
  const commonAcronyms = new Set(['US', 'UK', 'EU', 'IT', 'HR', 'PR', 'CEO', 'CTO', 'THE', 'AND', 'FOR', 'NOT']);
  while ((match = acronymRegex.exec(plainText)) !== null) {
    if (!commonAcronyms.has(match[1])) {
      technicalTerms.add(match[1]);
    }
  }

  if (technicalTerms.size === 0) {
    return {
      name: 'Definition Coverage',
      key: 'definition_coverage',
      score: 85,
      description: 'Whether technical terms are defined near their first use.',
      details: 'No significant technical terms detected.',
    };
  }

  // Check for definitions: term followed by "is", "means", "refers to", or parenthetical
  const definitionPatterns = [
    /\bis\s+(?:a|an|the)\b/i,
    /\bmeans\b/i,
    /\brefers?\s+to\b/i,
    /\bdefined\s+as\b/i,
    /\(.*?\)/,                 // parenthetical explanation
  ];

  let definedCount = 0;
  for (const term of technicalTerms) {
    // Get context around first occurrence (100 chars after)
    const idx = plainText.indexOf(term);
    if (idx === -1) continue;
    const contextAfter = plainText.slice(idx + term.length, idx + term.length + 120);
    for (const pattern of definitionPatterns) {
      if (pattern.test(contextAfter)) {
        definedCount++;
        break;
      }
    }
  }

  const definedRatio = definedCount / technicalTerms.size;
  const score = clamp(Math.round(definedRatio * 100), 0, 100);

  const undefinedTerms = [...technicalTerms].filter(term => {
    const idx = plainText.indexOf(term);
    if (idx === -1) return true;
    const ctx = plainText.slice(idx + term.length, idx + term.length + 120);
    return !definitionPatterns.some(p => p.test(ctx));
  });

  const details = [
    `${technicalTerms.size} technical term(s) found`,
    `${definedCount} defined near first use (${(definedRatio * 100).toFixed(0)}%)`,
    undefinedTerms.length > 0
      ? `Undefined: ${undefinedTerms.slice(0, 3).join(', ')}`
      : 'All terms defined',
  ].join('. ');

  return {
    name: 'Definition Coverage',
    key: 'definition_coverage',
    score,
    description: 'Whether technical terms are defined near their first use.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 6: Claim-Evidence Pairing (15%)
// ---------------------------------------------------------------------------

function scoreClaimEvidence(plainText: string, html: string): ReadabilityFactor {
  // Claim indicators
  const claimPatterns = [
    /\bstudies?\s+show/gi,
    /\bresearch\s+(?:indicates?|suggests?|shows?|finds?|found)\b/gi,
    /\baccording\s+to\b/gi,
    /\bdata\s+(?:shows?|suggests?|indicates?|reveals?)\b/gi,
    /\bexperts?\s+(?:say|believe|recommend|suggest)\b/gi,
    /\bstatistics?\s+(?:show|indicate|suggest|reveal)\b/gi,
    /\b\d+(?:\.\d+)?%/g,       // percentages
    /\b\d+x\s+(?:more|faster|better|higher|lower)/gi,
  ];

  let totalClaims = 0;
  const claimPositions: number[] = [];

  for (const pattern of claimPatterns) {
    let match: RegExpExecArray | null;
    const p = new RegExp(pattern.source, pattern.flags);
    while ((match = p.exec(plainText)) !== null) {
      totalClaims++;
      claimPositions.push(match.index);
    }
  }

  if (totalClaims === 0) {
    return {
      name: 'Claim-Evidence Pairing',
      key: 'claim_evidence',
      score: 70,
      description: 'Whether claims are backed by evidence, citations, or data.',
      details: 'No explicit claims or statistics detected.',
    };
  }

  // Evidence indicators: links, citations near claims
  const linkCount = (html.match(/<a\s+[^>]*href/gi) || []).length;
  const citationPatterns = /\[\d+\]|\(\d{4}\)|\bsource:?\b|\bcitation\b/gi;
  const citations = (plainText.match(citationPatterns) || []).length;
  const evidenceCount = linkCount + citations;

  // Ratio of evidence to claims
  const evidenceRatio = Math.min(evidenceCount / totalClaims, 1.0);
  const score = clamp(Math.round(evidenceRatio * 100), 0, 100);

  const details = [
    `${totalClaims} claim(s)/statistic(s) detected`,
    `${evidenceCount} supporting evidence element(s) (${linkCount} links, ${citations} citations)`,
    `Evidence coverage: ${(evidenceRatio * 100).toFixed(0)}%`,
  ].join('. ');

  return {
    name: 'Claim-Evidence Pairing',
    key: 'claim_evidence',
    score,
    description: 'Whether claims are backed by evidence, citations, or data.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Factor 7: Answer-Engine Formatting (10%)
// ---------------------------------------------------------------------------

function scoreAnswerEngine(html: string, plainText: string): ReadabilityFactor {
  let signals = 0;
  let maxSignals = 0;

  // 1. FAQ sections
  maxSignals += 2;
  const hasFaq = /faq|frequently\s+asked/i.test(plainText);
  if (hasFaq) signals += 2;

  // 2. "What is X?" / "How to" question-answer patterns
  maxSignals += 2;
  const questionPatterns = /(what\s+is|how\s+to|how\s+do|why\s+does|when\s+should)\b/gi;
  const questionCount = (plainText.match(questionPatterns) || []).length;
  if (questionCount >= 3) signals += 2;
  else if (questionCount >= 1) signals += 1;

  // 3. Definition lists (<dl>) or schema-like structures
  maxSignals += 1;
  const hasDefList = /<dl\b/i.test(html);
  if (hasDefList) signals += 1;

  // 4. Tables
  maxSignals += 2;
  const tableCount = (html.match(/<table\b/gi) || []).length;
  if (tableCount >= 2) signals += 2;
  else if (tableCount >= 1) signals += 1;

  // 5. Numbered/ordered steps
  maxSignals += 2;
  const olCount = (html.match(/<ol\b/gi) || []).length;
  if (olCount >= 2) signals += 2;
  else if (olCount >= 1) signals += 1;

  // 6. Short opening paragraph (featured-snippet friendly: < 50 words)
  maxSignals += 2;
  const paragraphs = extractParagraphs(html);
  if (paragraphs.length > 0 && wordCount(paragraphs[0]) <= 50) {
    signals += 2;
  } else if (paragraphs.length > 0 && wordCount(paragraphs[0]) <= 80) {
    signals += 1;
  }

  // 7. Structured data / JSON-LD
  maxSignals += 1;
  const hasStructuredData = /application\/ld\+json/i.test(html);
  if (hasStructuredData) signals += 1;

  const score = maxSignals > 0
    ? clamp(Math.round((signals / maxSignals) * 100), 0, 100)
    : 50;

  const details = [
    `Answer-ready signals: ${signals}/${maxSignals}`,
    hasFaq ? 'FAQ section detected' : 'No FAQ section',
    `${questionCount} question-answer pattern(s)`,
    `${tableCount} table(s), ${olCount} ordered list(s)`,
    hasStructuredData ? 'Structured data present' : 'No structured data',
  ].join('. ');

  return {
    name: 'Answer-Engine Formatting',
    key: 'answer_engine',
    score,
    description: 'How well content is formatted for AI answer engines and featured snippets.',
    details,
  };
}

// ---------------------------------------------------------------------------
// Improvement generator
// ---------------------------------------------------------------------------

function generateImprovement(factor: ReadabilityFactor, plainText: string, html: string): ReadabilityImprovement | null {
  const impact: 'high' | 'medium' | 'low' = factor.score < 40 ? 'high' : factor.score < 65 ? 'medium' : 'low';

  switch (factor.key) {
    case 'sentence_clarity': {
      const sentences = splitSentences(plainText);
      const longest = sentences.reduce((a, b) => wordCount(a) > wordCount(b) ? a : b, '');
      if (wordCount(longest) <= 20) return null;
      const words = longest.split(/\s+/);
      const midpoint = Math.ceil(words.length / 2);
      const suggestion = words.slice(0, midpoint).join(' ') + '. ' +
        words.slice(midpoint).join(' ');
      return {
        factor: factor.name,
        issue: `Sentences average too long (${factor.details.split('.')[0]}). Long sentences reduce AI comprehension.`,
        original: truncate(longest, 200),
        suggestion: truncate(suggestion, 200),
        impact,
      };
    }

    case 'term_consistency': {
      return {
        factor: factor.name,
        issue: 'Acronyms used without being defined on first use.',
        original: truncate(factor.details, 200),
        suggestion: 'Define each acronym on first use, e.g. "Customer Relationship Management (CRM)".',
        impact,
      };
    }

    case 'logical_flow': {
      const headings = extractHeadings(html);
      if (headings.length === 0) {
        const firstPara = extractParagraphs(html)[0] || plainText.slice(0, 200);
        return {
          factor: factor.name,
          issue: 'Content lacks heading structure for AI navigation.',
          original: truncate(firstPara, 200),
          suggestion: 'Add descriptive headings (H2, H3) to break content into logical sections.',
          impact,
        };
      }
      // Find first hierarchy skip
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level - headings[i - 1].level > 1) {
          return {
            factor: factor.name,
            issue: `Heading hierarchy skips from H${headings[i - 1].level} to H${headings[i].level}.`,
            original: truncate(`H${headings[i - 1].level}: "${headings[i - 1].text}" followed by H${headings[i].level}: "${headings[i].text}"`, 200),
            suggestion: `Add an intermediate H${headings[i - 1].level + 1} heading between these sections.`,
            impact,
          };
        }
      }
      return null;
    }

    case 'chunking_quality': {
      const paragraphs = extractParagraphs(html);
      const longPara = paragraphs.find(p => wordCount(p) > 100);
      if (longPara) {
        return {
          factor: factor.name,
          issue: 'Paragraphs are too long for easy AI chunking.',
          original: truncate(longPara, 200),
          suggestion: 'Break this paragraph into 2-3 shorter paragraphs of 40-80 words each, or convert key points to a bullet list.',
          impact,
        };
      }
      return {
        factor: factor.name,
        issue: 'Content lacks scannable elements (lists, bold text, sub-headings).',
        original: truncate(plainText.slice(0, 200), 200),
        suggestion: 'Add bullet lists for key points, use bold for important terms, and include sub-headings.',
        impact,
      };
    }

    case 'definition_coverage': {
      return {
        factor: factor.name,
        issue: 'Technical terms used without definitions.',
        original: truncate(factor.details, 200),
        suggestion: 'Add a brief definition after each technical term on first use, e.g. "Natural Language Processing (NLP) is the branch of AI that...".',
        impact,
      };
    }

    case 'claim_evidence': {
      // Find first percentage/claim without nearby link
      const claimMatch = plainText.match(/\b\d+(?:\.\d+)?%\b[^.]*\./);
      const sample = claimMatch ? claimMatch[0] : plainText.slice(0, 200);
      return {
        factor: factor.name,
        issue: 'Claims and statistics lack supporting citations or links.',
        original: truncate(sample, 200),
        suggestion: 'Add a source link or citation after each statistic, e.g. "72% of users prefer... (Source: Forrester 2025)".',
        impact,
      };
    }

    case 'answer_engine': {
      return {
        factor: factor.name,
        issue: 'Content is not formatted for AI answer engines.',
        original: truncate(plainText.slice(0, 200), 200),
        suggestion: 'Add an FAQ section with "What is...?" questions, use tables for comparisons, and include numbered step lists.',
        impact,
      };
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function analyzeReadability(htmlContent: string): ReadabilityResult {
  const plainText = stripHtml(htmlContent);
  const totalWords = wordCount(plainText);

  // Run all 7 factors
  const factors: ReadabilityFactor[] = [
    scoreSentenceClarity(plainText),
    scoreTermConsistency(plainText),
    scoreLogicalFlow(htmlContent, totalWords),
    scoreChunkingQuality(htmlContent, totalWords),
    scoreDefinitionCoverage(plainText),
    scoreClaimEvidence(plainText, htmlContent),
    scoreAnswerEngine(htmlContent, plainText),
  ];

  // Composite weighted score
  const overall_score = clamp(
    Math.round(
      factors.reduce((sum, f) => sum + f.score * (WEIGHTS[f.key] || 0), 0)
    ),
    0,
    100
  );

  // Top 3 improvements from lowest-scoring factors
  const sortedFactors = [...factors].sort((a, b) => a.score - b.score);
  const top_improvements: ReadabilityImprovement[] = [];
  for (const factor of sortedFactors) {
    if (top_improvements.length >= 3) break;
    const improvement = generateImprovement(factor, plainText, htmlContent);
    if (improvement) {
      top_improvements.push(improvement);
    }
  }

  return { overall_score, factors, top_improvements };
}
