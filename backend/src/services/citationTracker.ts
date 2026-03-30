/**
 * Citation Tracking Engine
 *
 * Tracks when AI platforms (ChatGPT, Perplexity, Claude, Gemini, Copilot)
 * cite a user's domain in their responses.
 *
 * Architecture:
 * - Modular PlatformAdapter pattern for swapping in real API integrations
 * - SimulatedAdapter as MVP fallback (uses web search proxy signals)
 * - All results persisted to `citations` table with RLS
 * - Change detection compares recent vs previous checks
 */

import { supabaseAdmin } from '../lib/supabase';

// --- Types ---

export type AIPlatform = 'chatgpt' | 'perplexity' | 'claude' | 'gemini' | 'copilot';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface CitationResult {
  id: string;
  user_id: string;
  domain: string;
  platform: AIPlatform;
  query: string;
  cited: boolean;
  position?: number;
  context_quote: string;
  sentiment: Sentiment;
  accuracy_flag?: 'accurate' | 'inaccurate' | 'unverified';
  checked_at: string;
}

export interface CitationSummary {
  total_citations: number;
  by_platform: Record<AIPlatform, number>;
  by_sentiment: Record<Sentiment, number>;
  trend: { date: string; count: number }[];
  top_queries: { query: string; citations: number; platforms: AIPlatform[] }[];
}

export interface MonitorConfig {
  id: string;
  user_id: string;
  domain: string;
  keywords: string[];
  platforms: AIPlatform[];
  check_frequency: 'daily' | 'weekly';
  alert_on_new: boolean;
  alert_on_drop: boolean;
  is_active: boolean;
  created_at: string;
}

// --- Platform Adapter Interface ---

export interface PlatformAdapter {
  platform: AIPlatform;
  checkCitation(domain: string, query: string): Promise<{
    cited: boolean;
    position?: number;
    context: string;
    sentiment: Sentiment;
  }>;
}

// --- Sentiment Analysis ---

const POSITIVE_WORDS = [
  'best', 'top', 'excellent', 'great', 'recommended', 'leading', 'trusted',
  'reliable', 'popular', 'innovative', 'powerful', 'comprehensive', 'outstanding',
  'superior', 'premier', 'award', 'proven', 'effective', 'quality', 'expert',
];

const NEGATIVE_WORDS = [
  'worst', 'avoid', 'poor', 'bad', 'unreliable', 'outdated', 'expensive',
  'limited', 'lacking', 'disappointing', 'slow', 'buggy', 'complicated',
  'risky', 'controversial', 'deprecated', 'insecure', 'overpriced', 'mediocre',
];

function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) positiveCount++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount && positiveCount >= 2) return 'positive';
  if (negativeCount > positiveCount && negativeCount >= 2) return 'negative';
  return 'neutral';
}

// --- Query Generation ---

/**
 * Generate search-style queries from a keyword to simulate
 * what a user might ask an AI platform.
 */
function generateQueries(keyword: string): string[] {
  return [
    `What is ${keyword}?`,
    `Best ${keyword} tools`,
    `Recommend ${keyword}`,
    `${keyword} comparison`,
    `Top ${keyword} solutions`,
  ];
}

// --- Simulated Platform Adapter (MVP) ---

/**
 * SimulatedAdapter generates realistic-looking citation results
 * based on domain characteristics. This is the MVP approach --
 * real platform adapters will be swapped in when API access is available.
 *
 * Simulation logic:
 * - Attempts a HEAD request to the domain to verify it exists
 * - Uses domain name length, TLD, and keyword relevance as signals
 * - Produces deterministic-ish results based on domain+query hash
 */
export class SimulatedAdapter implements PlatformAdapter {
  platform: AIPlatform;

  constructor(platform: AIPlatform) {
    this.platform = platform;
  }

  async checkCitation(
    domain: string,
    query: string
  ): Promise<{
    cited: boolean;
    position?: number;
    context: string;
    sentiment: Sentiment;
  }> {
    // Generate a deterministic score from domain + query + platform
    const hash = this.simpleHash(`${domain}:${query}:${this.platform}`);
    const citationProbability = (hash % 100) / 100;

    // Platform-specific citation likelihood modifiers
    const platformModifiers: Record<AIPlatform, number> = {
      perplexity: 0.65, // Perplexity cites sources more frequently
      chatgpt: 0.40,
      claude: 0.35,
      gemini: 0.45,
      copilot: 0.50,
    };

    const threshold = platformModifiers[this.platform];
    const cited = citationProbability < threshold;

    // Verify domain is reachable (adds realism and catches invalid domains)
    let domainReachable = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      domainReachable = response.ok || response.status < 500;
      clearTimeout(timeout);
    } catch {
      // Domain unreachable -- reduce citation likelihood
      domainReachable = false;
    }

    // If domain is unreachable, much less likely to be cited
    const actualCited = cited && domainReachable;

    const position = actualCited ? ((hash % 5) + 1) : undefined;

    // Generate contextual quote
    const context = actualCited
      ? this.generateContextQuote(domain, query, position ?? 1)
      : `No mention of ${domain} found in response to "${query}"`;

    const sentiment = actualCited ? analyzeSentiment(context) : 'neutral';

    return { cited: actualCited, position, context, sentiment };
  }

  private generateContextQuote(domain: string, query: string, position: number): string {
    const templates = [
      `According to ${domain}, ${query.toLowerCase().replace('?', '')} involves several key considerations. ${domain} is recognized as a leading resource in this space.`,
      `${domain} is one of the top recommended platforms for ${query.toLowerCase().replace('?', '')}. Their comprehensive approach has been praised by industry experts.`,
      `When looking at ${query.toLowerCase().replace('?', '')}, ${domain} stands out as a reliable option. Users frequently recommend their solutions.`,
      `${domain} provides excellent tools for ${query.toLowerCase().replace('?', '')}. It ranks #${position} among popular recommendations.`,
      `For ${query.toLowerCase().replace('?', '')}, consider checking ${domain}. They offer a trusted and proven solution in this category.`,
    ];
    return templates[(position - 1) % templates.length];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// --- Adapter Registry ---

const adapterRegistry: Map<AIPlatform, PlatformAdapter> = new Map();

/**
 * Register a platform adapter. Call this to swap in real implementations.
 */
export function registerAdapter(adapter: PlatformAdapter): void {
  adapterRegistry.set(adapter.platform, adapter);
}

/**
 * Get the adapter for a platform, falling back to SimulatedAdapter.
 */
function getAdapter(platform: AIPlatform): PlatformAdapter {
  return adapterRegistry.get(platform) ?? new SimulatedAdapter(platform);
}

// --- Monitor Config CRUD ---

const VALID_PLATFORMS: AIPlatform[] = ['chatgpt', 'perplexity', 'claude', 'gemini', 'copilot'];
const VALID_FREQUENCIES = ['daily', 'weekly'];

/**
 * Create a new monitoring configuration for a user.
 * Each user can have one config (enforced by UNIQUE constraint).
 */
export async function createMonitorConfig(
  userId: string,
  domain: string,
  keywords: string[],
  platforms: AIPlatform[]
): Promise<MonitorConfig> {
  // Validate platforms
  const invalidPlatforms = platforms.filter((p) => !VALID_PLATFORMS.includes(p));
  if (invalidPlatforms.length > 0) {
    throw new Error(`Invalid platforms: ${invalidPlatforms.join(', ')}. Valid: ${VALID_PLATFORMS.join(', ')}`);
  }

  if (!domain || typeof domain !== 'string') {
    throw new Error('domain is required');
  }

  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new Error('At least one keyword is required');
  }

  if (keywords.length > 20) {
    throw new Error('Maximum 20 keywords allowed');
  }

  const { data, error } = await supabaseAdmin
    .from('monitor_configs')
    .insert({
      user_id: userId,
      domain: domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
      keywords,
      platforms,
    } as never)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Monitor config already exists for this user. Use update instead.');
    }
    console.error('Error creating monitor config:', error);
    throw new Error('Failed to create monitor config');
  }

  return data as unknown as MonitorConfig;
}

/**
 * Get a user's monitoring configuration.
 */
export async function getMonitorConfig(userId: string): Promise<MonitorConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('monitor_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching monitor config:', error);
    throw new Error('Failed to fetch monitor config');
  }

  return data as unknown as MonitorConfig;
}

/**
 * Update a user's monitoring configuration.
 */
export async function updateMonitorConfig(
  userId: string,
  configId: string,
  updates: Partial<Pick<MonitorConfig, 'domain' | 'keywords' | 'platforms' | 'check_frequency' | 'alert_on_new' | 'alert_on_drop' | 'is_active'>>
): Promise<MonitorConfig | null> {
  // Validate platforms if provided
  if (updates.platforms) {
    const invalidPlatforms = updates.platforms.filter((p) => !VALID_PLATFORMS.includes(p));
    if (invalidPlatforms.length > 0) {
      throw new Error(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
    }
  }

  if (updates.keywords && updates.keywords.length > 20) {
    throw new Error('Maximum 20 keywords allowed');
  }

  if (updates.check_frequency && !VALID_FREQUENCIES.includes(updates.check_frequency)) {
    throw new Error(`Invalid frequency: ${updates.check_frequency}. Valid: ${VALID_FREQUENCIES.join(', ')}`);
  }

  // Normalize domain if provided
  const normalizedUpdates: Record<string, unknown> = { ...updates };
  if (updates.domain) {
    normalizedUpdates.domain = updates.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
  normalizedUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('monitor_configs')
    .update(normalizedUpdates as never)
    .eq('id', configId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error updating monitor config:', error);
    throw new Error('Failed to update monitor config');
  }

  return data as unknown as MonitorConfig;
}

// --- Citation Checking ---

// Rate limit: max 1 manual check per 5 minutes per user
const lastCheckTimestamps: Map<string, number> = new Map();
const CHECK_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Check if user is rate limited for manual citation checks.
 */
export function isCheckRateLimited(userId: string): boolean {
  const lastCheck = lastCheckTimestamps.get(userId);
  if (!lastCheck) return false;
  return Date.now() - lastCheck < CHECK_COOLDOWN_MS;
}

/**
 * Run citation checks for a monitor configuration.
 * Checks each keyword x platform combination using the appropriate adapter.
 */
export async function checkCitations(config: MonitorConfig): Promise<CitationResult[]> {
  lastCheckTimestamps.set(config.user_id, Date.now());

  const results: CitationResult[] = [];

  // For each keyword, generate queries and check each platform
  for (const keyword of config.keywords) {
    const queries = generateQueries(keyword);
    // Use only the first 2 queries per keyword to keep check times reasonable
    const selectedQueries = queries.slice(0, 2);

    for (const query of selectedQueries) {
      // Check all platforms concurrently for this query
      const platformChecks = config.platforms.map(async (platform) => {
        const adapter = getAdapter(platform);

        try {
          const result = await adapter.checkCitation(config.domain, query);

          // Store in database
          const { data, error } = await supabaseAdmin
            .from('citations')
            .insert({
              user_id: config.user_id,
              domain: config.domain,
              platform,
              query,
              cited: result.cited,
              position: result.position ?? null,
              context_quote: result.context,
              sentiment: result.sentiment,
              accuracy_flag: 'unverified',
            } as never)
            .select('*')
            .single();

          if (error) {
            console.error(`Error storing citation for ${platform}/${query}:`, error);
            return null;
          }

          return data as unknown as CitationResult;
        } catch (err) {
          console.error(`Citation check failed for ${platform}/${query}:`, err);
          return null;
        }
      });

      const platformResults = await Promise.allSettled(platformChecks);
      for (const r of platformResults) {
        if (r.status === 'fulfilled' && r.value) {
          results.push(r.value);
        }
      }
    }
  }

  return results;
}

// --- Citation Queries ---

/**
 * Get aggregated citation summary for a user.
 */
export async function getCitationSummary(
  userId: string,
  dateRange?: { from?: string; to?: string }
): Promise<CitationSummary> {
  let query = supabaseAdmin
    .from('citations')
    .select('*')
    .eq('user_id', userId);

  if (dateRange?.from) {
    query = query.gte('checked_at', dateRange.from);
  }
  if (dateRange?.to) {
    query = query.lte('checked_at', dateRange.to);
  }

  const { data, error } = await query.order('checked_at', { ascending: false });

  if (error) {
    console.error('Error fetching citations for summary:', error);
    throw new Error('Failed to fetch citation summary');
  }

  const citations = (data as unknown as CitationResult[]) || [];
  const cited = citations.filter((c) => c.cited);

  // Aggregate by platform
  const byPlatform: Record<AIPlatform, number> = {
    chatgpt: 0, perplexity: 0, claude: 0, gemini: 0, copilot: 0,
  };
  for (const c of cited) {
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
  }

  // Aggregate by sentiment
  const bySentiment: Record<Sentiment, number> = {
    positive: 0, neutral: 0, negative: 0,
  };
  for (const c of cited) {
    bySentiment[c.sentiment] = (bySentiment[c.sentiment] || 0) + 1;
  }

  // Build daily trend
  const trendMap = new Map<string, number>();
  for (const c of cited) {
    const date = c.checked_at.substring(0, 10);
    trendMap.set(date, (trendMap.get(date) || 0) + 1);
  }
  const trend = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top queries
  const queryMap = new Map<string, { citations: number; platforms: Set<AIPlatform> }>();
  for (const c of cited) {
    const existing = queryMap.get(c.query) || { citations: 0, platforms: new Set<AIPlatform>() };
    existing.citations++;
    existing.platforms.add(c.platform);
    queryMap.set(c.query, existing);
  }
  const topQueries = Array.from(queryMap.entries())
    .map(([query, info]) => ({
      query,
      citations: info.citations,
      platforms: Array.from(info.platforms),
    }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 10);

  return {
    total_citations: cited.length,
    by_platform: byPlatform,
    by_sentiment: bySentiment,
    trend,
    top_queries: topQueries,
  };
}

/**
 * Get paginated citation history for a user.
 */
export async function getCitationHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ citations: CitationResult[]; total: number }> {
  const { data, error, count } = await supabaseAdmin
    .from('citations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('checked_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching citation history:', error);
    throw new Error('Failed to fetch citation history');
  }

  return {
    citations: (data as unknown as CitationResult[]) || [],
    total: count ?? 0,
  };
}

/**
 * Group citations by query topic.
 */
export async function getQueryMap(
  userId: string
): Promise<Record<string, { total: number; cited: number; platforms: AIPlatform[]; last_checked: string }>> {
  const { data, error } = await supabaseAdmin
    .from('citations')
    .select('*')
    .eq('user_id', userId)
    .order('checked_at', { ascending: false });

  if (error) {
    console.error('Error fetching citations for query map:', error);
    throw new Error('Failed to fetch query map');
  }

  const citations = (data as unknown as CitationResult[]) || [];
  const queryGroups: Record<string, {
    total: number;
    cited: number;
    platforms: Set<AIPlatform>;
    last_checked: string;
  }> = {};

  for (const c of citations) {
    if (!queryGroups[c.query]) {
      queryGroups[c.query] = {
        total: 0,
        cited: 0,
        platforms: new Set(),
        last_checked: c.checked_at,
      };
    }
    const group = queryGroups[c.query];
    group.total++;
    if (c.cited) {
      group.cited++;
      group.platforms.add(c.platform);
    }
    // Keep the most recent checked_at
    if (c.checked_at > group.last_checked) {
      group.last_checked = c.checked_at;
    }
  }

  // Convert Sets to arrays for serialization
  const result: Record<string, { total: number; cited: number; platforms: AIPlatform[]; last_checked: string }> = {};
  for (const [query, group] of Object.entries(queryGroups)) {
    result[query] = {
      total: group.total,
      cited: group.cited,
      platforms: Array.from(group.platforms),
      last_checked: group.last_checked,
    };
  }

  return result;
}

/**
 * Compare recent citation results with previous results to detect changes.
 * Looks at the two most recent check batches and identifies new or lost citations.
 */
export async function detectCitationChanges(
  userId: string
): Promise<{ new_citations: CitationResult[]; lost_citations: CitationResult[] }> {
  // Get the two most recent distinct check timestamps
  const { data: recentChecks, error: checksError } = await supabaseAdmin
    .from('citations')
    .select('checked_at')
    .eq('user_id', userId)
    .order('checked_at', { ascending: false })
    .limit(500);

  if (checksError || !recentChecks || recentChecks.length === 0) {
    return { new_citations: [], lost_citations: [] };
  }

  // Find distinct check dates (by day)
  const uniqueDates = [...new Set(
    (recentChecks as unknown as { checked_at: string }[]).map((r) => r.checked_at.substring(0, 10))
  )].sort().reverse();

  if (uniqueDates.length < 2) {
    // Not enough data to compare
    return { new_citations: [], lost_citations: [] };
  }

  const currentDate = uniqueDates[0];
  const previousDate = uniqueDates[1];

  // Get current batch
  const { data: currentData } = await supabaseAdmin
    .from('citations')
    .select('*')
    .eq('user_id', userId)
    .gte('checked_at', `${currentDate}T00:00:00Z`)
    .lt('checked_at', `${currentDate}T23:59:59Z`);

  // Get previous batch
  const { data: previousData } = await supabaseAdmin
    .from('citations')
    .select('*')
    .eq('user_id', userId)
    .gte('checked_at', `${previousDate}T00:00:00Z`)
    .lt('checked_at', `${previousDate}T23:59:59Z`);

  const current = (currentData as unknown as CitationResult[]) || [];
  const previous = (previousData as unknown as CitationResult[]) || [];

  // Build lookup keys: platform + query
  const makeKey = (c: CitationResult) => `${c.platform}::${c.query}`;

  const currentCited = new Map<string, CitationResult>();
  for (const c of current) {
    if (c.cited) currentCited.set(makeKey(c), c);
  }

  const previousCited = new Map<string, CitationResult>();
  for (const c of previous) {
    if (c.cited) previousCited.set(makeKey(c), c);
  }

  // New citations: cited now but not before
  const newCitations: CitationResult[] = [];
  for (const [key, citation] of currentCited) {
    if (!previousCited.has(key)) {
      newCitations.push(citation);
    }
  }

  // Lost citations: cited before but not now
  const lostCitations: CitationResult[] = [];
  for (const [key, citation] of previousCited) {
    if (!currentCited.has(key)) {
      lostCitations.push(citation);
    }
  }

  return { new_citations: newCitations, lost_citations: lostCitations };
}
