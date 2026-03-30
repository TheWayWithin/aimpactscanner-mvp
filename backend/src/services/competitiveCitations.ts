/**
 * Competitive Citation Intelligence Service
 *
 * Tracks competitor citations alongside the user's own citations,
 * providing share-of-voice analysis and citation gap detection.
 *
 * Architecture:
 * - Reuses SimulatedAdapter pattern from citationTracker
 * - Stores competitor results in dedicated `competitor_citations` table
 * - Competitor config stored per-user in `competitor_configs` (max 5 domains)
 * - Share-of-voice and gap analysis computed on demand from stored data
 */

import { supabaseAdmin } from '../lib/supabase';
import {
  AIPlatform,
  SimulatedAdapter,
  getMonitorConfig,
} from './citationTracker';

// --- Types ---

export interface CompetitorConfig {
  id: string;
  user_id: string;
  competitor_domains: string[];
  created_at: string;
  updated_at: string;
}

export interface ShareOfVoice {
  keyword: string;
  user_citations: number;
  competitors: Record<string, number>;
  user_share: number;
  total_mentions: number;
}

export interface CitationGap {
  query: string;
  platform: AIPlatform;
  competitor_domain: string;
  competitor_cited: boolean;
  user_cited: boolean;
  opportunity_score: number;
}

export interface OpportunityReport {
  gaps: CitationGap[];
  share_of_voice: ShareOfVoice[];
  summary: string;
  generated_at: string;
}

// --- Constants ---

const MAX_COMPETITORS = 5;
const PLATFORMS: AIPlatform[] = ['chatgpt', 'perplexity', 'claude', 'gemini', 'copilot'];

// --- Query Generation (mirrors citationTracker) ---

function generateQueries(keyword: string): string[] {
  return [
    `What is ${keyword}?`,
    `Best ${keyword} tools`,
    `Recommend ${keyword}`,
    `${keyword} comparison`,
    `Top ${keyword} solutions`,
  ];
}

// --- Competitor Config CRUD ---

/**
 * Store up to 5 competitor domains for a user.
 * Upserts -- creates config if none exists, updates if it does.
 */
export async function setCompetitors(
  userId: string,
  domains: string[]
): Promise<CompetitorConfig> {
  if (!Array.isArray(domains) || domains.length === 0) {
    throw new Error('At least one competitor domain is required');
  }

  if (domains.length > MAX_COMPETITORS) {
    throw new Error(`Maximum ${MAX_COMPETITORS} competitor domains allowed`);
  }

  // Normalize domains
  const normalizedDomains = domains.map((d) =>
    d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  );

  // Check for duplicates
  const unique = [...new Set(normalizedDomains)];
  if (unique.length !== normalizedDomains.length) {
    throw new Error('Duplicate domains are not allowed');
  }

  // Upsert: try update first, then insert
  const existing = await getCompetitors(userId);

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('competitor_configs')
      .update({
        competitor_domains: unique,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating competitor config:', error);
      throw new Error('Failed to update competitor config');
    }

    return data as unknown as CompetitorConfig;
  }

  const { data, error } = await supabaseAdmin
    .from('competitor_configs')
    .insert({
      user_id: userId,
      competitor_domains: unique,
    } as never)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating competitor config:', error);
    throw new Error('Failed to create competitor config');
  }

  return data as unknown as CompetitorConfig;
}

/**
 * Get a user's competitor configuration.
 */
export async function getCompetitors(userId: string): Promise<CompetitorConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('competitor_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching competitor config:', error);
    throw new Error('Failed to fetch competitor config');
  }

  return data as unknown as CompetitorConfig;
}

// --- Competitor Citation Checking ---

/**
 * Run citation checks for all configured competitor domains.
 * Reuses the SimulatedAdapter pattern from citationTracker.
 * Requires user to have a monitor config (for keywords and platforms).
 */
export async function checkCompetitorCitations(
  userId: string
): Promise<{ domain: string; results_count: number; cited_count: number }[]> {
  const competitorConfig = await getCompetitors(userId);
  if (!competitorConfig || competitorConfig.competitor_domains.length === 0) {
    throw new Error('No competitors configured. Set competitors first.');
  }

  const monitorConfig = await getMonitorConfig(userId);
  if (!monitorConfig) {
    throw new Error('No monitor config found. Create a monitor config first to define keywords and platforms.');
  }

  const platforms = monitorConfig.platforms.length > 0
    ? monitorConfig.platforms
    : PLATFORMS.slice(0, 3);

  const summaries: { domain: string; results_count: number; cited_count: number }[] = [];

  for (const competitorDomain of competitorConfig.competitor_domains) {
    let totalResults = 0;
    let totalCited = 0;

    for (const keyword of monitorConfig.keywords) {
      const queries = generateQueries(keyword).slice(0, 2);

      for (const query of queries) {
        const platformChecks = platforms.map(async (platform) => {
          const adapter = new SimulatedAdapter(platform);

          try {
            const result = await adapter.checkCitation(competitorDomain, query);

            await supabaseAdmin
              .from('competitor_citations')
              .insert({
                user_id: userId,
                competitor_domain: competitorDomain,
                platform,
                query,
                cited: result.cited,
                context_quote: result.context,
                sentiment: result.sentiment,
              } as never);

            return result;
          } catch (err) {
            console.error(`Competitor citation check failed for ${competitorDomain}/${platform}/${query}:`, err);
            return null;
          }
        });

        const results = await Promise.allSettled(platformChecks);
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            totalResults++;
            if (r.value.cited) totalCited++;
          }
        }
      }
    }

    summaries.push({
      domain: competitorDomain,
      results_count: totalResults,
      cited_count: totalCited,
    });
  }

  return summaries;
}

// --- Share of Voice ---

/**
 * Calculate share of voice for the user vs competitors.
 * Compares citation counts across keywords. If keywords are provided,
 * filters to only those; otherwise uses all keywords from monitor config.
 */
export async function calculateShareOfVoice(
  userId: string,
  keywords?: string[]
): Promise<ShareOfVoice[]> {
  const monitorConfig = await getMonitorConfig(userId);
  if (!monitorConfig) {
    throw new Error('No monitor config found');
  }

  const competitorConfig = await getCompetitors(userId);
  const competitorDomains = competitorConfig?.competitor_domains ?? [];

  const targetKeywords = keywords && keywords.length > 0
    ? keywords
    : monitorConfig.keywords;

  const results: ShareOfVoice[] = [];

  for (const keyword of targetKeywords) {
    // Count user citations for this keyword
    const { count: userCount } = await supabaseAdmin
      .from('citations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cited', true)
      .ilike('query', `%${keyword}%`);

    const userCitations = userCount ?? 0;

    // Count competitor citations for this keyword
    const competitorCounts: Record<string, number> = {};
    let totalCompetitor = 0;

    for (const domain of competitorDomains) {
      const { count: compCount } = await supabaseAdmin
        .from('competitor_citations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('competitor_domain', domain)
        .eq('cited', true)
        .ilike('query', `%${keyword}%`);

      const c = compCount ?? 0;
      competitorCounts[domain] = c;
      totalCompetitor += c;
    }

    const totalMentions = userCitations + totalCompetitor;
    const userShare = totalMentions > 0
      ? Math.round((userCitations / totalMentions) * 100)
      : 0;

    results.push({
      keyword,
      user_citations: userCitations,
      competitors: competitorCounts,
      user_share: userShare,
      total_mentions: totalMentions,
    });
  }

  return results;
}

// --- Citation Gap Analysis ---

/**
 * Find queries where competitors are cited but the user is not.
 * Scores opportunities by how many competitor citations exist (higher = better opportunity).
 */
export async function findCitationGaps(userId: string): Promise<CitationGap[]> {
  const competitorConfig = await getCompetitors(userId);
  if (!competitorConfig || competitorConfig.competitor_domains.length === 0) {
    return [];
  }

  // Get all competitor citations where competitor was cited
  const { data: competitorCited, error: compError } = await supabaseAdmin
    .from('competitor_citations')
    .select('*')
    .eq('user_id', userId)
    .eq('cited', true);

  if (compError) {
    console.error('Error fetching competitor citations for gaps:', compError);
    throw new Error('Failed to fetch competitor citations');
  }

  if (!competitorCited || competitorCited.length === 0) {
    return [];
  }

  // Get all user citations
  const { data: userCitations, error: userError } = await supabaseAdmin
    .from('citations')
    .select('*')
    .eq('user_id', userId);

  if (userError) {
    console.error('Error fetching user citations for gaps:', userError);
    throw new Error('Failed to fetch user citations');
  }

  // Build a set of user-cited query+platform combos
  const userCitedSet = new Set<string>();
  for (const c of (userCitations ?? [])) {
    const typed = c as unknown as { query: string; platform: string; cited: boolean };
    if (typed.cited) {
      userCitedSet.add(`${typed.platform}::${typed.query}`);
    }
  }

  // Count how many times each query+platform is cited by competitors
  const competitorFrequency = new Map<string, number>();
  for (const c of competitorCited) {
    const typed = c as unknown as { query: string; platform: string };
    const key = `${typed.platform}::${typed.query}`;
    competitorFrequency.set(key, (competitorFrequency.get(key) ?? 0) + 1);
  }

  // Find gaps: competitor cited, user not
  const gaps: CitationGap[] = [];
  const seen = new Set<string>();

  for (const c of competitorCited) {
    const typed = c as unknown as {
      query: string;
      platform: AIPlatform;
      competitor_domain: string;
    };

    const key = `${typed.platform}::${typed.query}::${typed.competitor_domain}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const platformQueryKey = `${typed.platform}::${typed.query}`;
    const userCited = userCitedSet.has(platformQueryKey);

    if (!userCited) {
      const frequency = competitorFrequency.get(platformQueryKey) ?? 1;
      // Score: more competitor citations = higher opportunity
      // Normalize to 0-100 range
      const opportunityScore = Math.min(100, Math.round(frequency * 20));

      gaps.push({
        query: typed.query,
        platform: typed.platform,
        competitor_domain: typed.competitor_domain,
        competitor_cited: true,
        user_cited: false,
        opportunity_score: opportunityScore,
      });
    }
  }

  // Sort by opportunity score descending
  gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);

  return gaps;
}

// --- Opportunity Report ---

/**
 * Generate a comprehensive opportunity report combining share of voice
 * and citation gap analysis.
 */
export async function generateOpportunityReport(userId: string): Promise<OpportunityReport> {
  const [shareOfVoice, gaps] = await Promise.all([
    calculateShareOfVoice(userId),
    findCitationGaps(userId),
  ]);

  // Generate summary text
  const avgShare = shareOfVoice.length > 0
    ? Math.round(shareOfVoice.reduce((sum, s) => sum + s.user_share, 0) / shareOfVoice.length)
    : 0;

  const highOpportunityGaps = gaps.filter((g) => g.opportunity_score >= 60);
  const uniqueCompetitors = new Set(gaps.map((g) => g.competitor_domain));

  let summary = `Your average share of voice across ${shareOfVoice.length} keywords is ${avgShare}%.`;

  if (gaps.length > 0) {
    summary += ` Found ${gaps.length} citation gaps across ${uniqueCompetitors.size} competitors.`;
  }

  if (highOpportunityGaps.length > 0) {
    summary += ` ${highOpportunityGaps.length} high-opportunity gaps (score >= 60) identified.`;
  }

  if (avgShare < 30) {
    summary += ' Your share of voice is below average -- focus on improving AI visibility for your core keywords.';
  } else if (avgShare >= 60) {
    summary += ' Strong share of voice -- maintain your position and monitor for competitor gains.';
  }

  return {
    gaps,
    share_of_voice: shareOfVoice,
    summary,
    generated_at: new Date().toISOString(),
  };
}
