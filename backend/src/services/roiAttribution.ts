/**
 * ROI Attribution Framework
 *
 * Connects citation data to business outcomes by estimating
 * AI-referred traffic, conversions, and revenue.
 *
 * Methodology:
 * - Citations are multiplied by a traffic_multiplier (default 15 visits/citation)
 *   based on industry estimates of AI response → click-through behavior.
 * - Traffic is converted using a conversion_rate (default 2.5%).
 * - Revenue is estimated as conversions * avg_deal_value.
 * - Confidence levels reflect data quality: 'high' (analytics connected),
 *   'estimated' (defaults with reasonable data), 'directional' (sparse data).
 *
 * Even approximate models are valuable — all estimates include a
 * methodology_note explaining how figures are derived.
 */

import { supabaseAdmin } from '../lib/supabase';

// --- Types ---

export interface ROIConfig {
  id: string;
  user_id: string;
  analytics_provider: 'ga4' | 'plausible' | 'manual';
  analytics_property_id?: string;
  avg_deal_value: number;
  conversion_rate: number;
  traffic_multiplier: number;
  subscription_cost: number;
  created_at: string;
  updated_at: string;
}

export interface AttributionData {
  period: string;                  // "2026-03" (month)
  citations_count: number;
  estimated_ai_traffic: number;
  estimated_conversions: number;
  estimated_revenue: number;
  confidence: 'high' | 'estimated' | 'directional';
  methodology_note: string;
}

export interface ROISummary {
  current_month: AttributionData;
  trend: AttributionData[];
  roi_percentage: number;
  subscription_cost: number;
  total_ai_revenue: number;
  payback_note: string;
}

export interface MonthlyReport {
  generated_at: string;
  period: string;
  summary: ROISummary;
  config: ROIConfig;
  charts: {
    citations_by_month: { period: string; count: number }[];
    revenue_by_month: { period: string; revenue: number }[];
    roi_by_month: { period: string; roi: number }[];
  };
  methodology: string;
}

// --- Defaults ---

const DEFAULT_TRAFFIC_MULTIPLIER = 15;
const DEFAULT_CONVERSION_RATE = 0.025;
const DEFAULT_AVG_DEAL_VALUE = 100;
const DEFAULT_SUBSCRIPTION_COST = 19.95;
const MIN_CITATIONS_FOR_ESTIMATED = 5;

// --- ROI Config CRUD ---

/**
 * Create or update ROI configuration for a user.
 * Uses upsert on the unique user_id constraint.
 */
export async function createROIConfig(
  userId: string,
  config: {
    analytics_provider?: 'ga4' | 'plausible' | 'manual';
    analytics_property_id?: string;
    avg_deal_value?: number;
    conversion_rate?: number;
    traffic_multiplier?: number;
    subscription_cost?: number;
  }
): Promise<ROIConfig> {
  const row = {
    user_id: userId,
    analytics_provider: config.analytics_provider ?? 'manual',
    analytics_property_id: config.analytics_property_id ?? null,
    avg_deal_value: config.avg_deal_value ?? DEFAULT_AVG_DEAL_VALUE,
    conversion_rate: config.conversion_rate ?? DEFAULT_CONVERSION_RATE,
    traffic_multiplier: config.traffic_multiplier ?? DEFAULT_TRAFFIC_MULTIPLIER,
    subscription_cost: config.subscription_cost ?? DEFAULT_SUBSCRIPTION_COST,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('roi_configs')
    .upsert(row as never, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Error upserting ROI config:', error);
    throw new Error('Failed to save ROI configuration');
  }

  return data as unknown as ROIConfig;
}

/**
 * Get a user's ROI configuration. Returns null if not configured.
 */
export async function getROIConfig(userId: string): Promise<ROIConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('roi_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    console.error('Error fetching ROI config:', error);
    throw new Error('Failed to fetch ROI configuration');
  }

  return data as unknown as ROIConfig;
}

// --- Citation Count Helpers ---

/**
 * Get the count of positive citations for a user in a given month.
 * Month format: "YYYY-MM"
 */
async function getCitationCountForMonth(userId: string, month: string): Promise<number> {
  const startDate = `${month}-01T00:00:00Z`;
  // Calculate end of month
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12
    ? `${year + 1}-01`
    : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  const endDate = `${nextMonth}-01T00:00:00Z`;

  const { count, error } = await supabaseAdmin
    .from('citations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cited', true)
    .gte('checked_at', startDate)
    .lt('checked_at', endDate);

  if (error) {
    console.error(`Error counting citations for ${month}:`, error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get the current month as "YYYY-MM".
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get the last N months as "YYYY-MM" strings, including the current month.
 */
function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months.reverse();
}

// --- Attribution Calculation ---

/**
 * Determine the confidence level based on available data.
 */
function determineConfidence(
  citationsCount: number,
  analyticsProvider: string
): 'high' | 'estimated' | 'directional' {
  if (analyticsProvider !== 'manual' && citationsCount >= MIN_CITATIONS_FOR_ESTIMATED) {
    return 'high';
  }
  if (citationsCount >= MIN_CITATIONS_FOR_ESTIMATED) {
    return 'estimated';
  }
  return 'directional';
}

/**
 * Build a methodology note explaining how estimates were derived.
 */
function buildMethodologyNote(
  citationsCount: number,
  trafficMultiplier: number,
  conversionRate: number,
  avgDealValue: number,
  confidence: string
): string {
  const parts = [
    `${citationsCount} positive citation(s) detected this period.`,
    `Traffic estimated at ${trafficMultiplier} visits per citation (${citationsCount * trafficMultiplier} total).`,
    `Conversion rate: ${(conversionRate * 100).toFixed(1)}%.`,
    `Avg deal value: $${avgDealValue.toFixed(2)}.`,
  ];

  if (confidence === 'directional') {
    parts.push('Low data volume — treat figures as directional indicators only.');
  } else if (confidence === 'estimated') {
    parts.push('Using default multipliers. Connect analytics for higher-confidence estimates.');
  } else {
    parts.push('Analytics-informed estimate with high confidence.');
  }

  return parts.join(' ');
}

/**
 * Calculate attribution data for a given month.
 *
 * Pipeline:
 *   citations -> estimated traffic -> estimated conversions -> estimated revenue
 */
export async function calculateAttribution(
  userId: string,
  month?: string
): Promise<AttributionData> {
  const targetMonth = month ?? getCurrentMonth();
  const config = await getROIConfig(userId);

  const trafficMultiplier = config?.traffic_multiplier ?? DEFAULT_TRAFFIC_MULTIPLIER;
  const conversionRate = config?.conversion_rate ?? DEFAULT_CONVERSION_RATE;
  const avgDealValue = config?.avg_deal_value ?? DEFAULT_AVG_DEAL_VALUE;
  const analyticsProvider = config?.analytics_provider ?? 'manual';

  const citationsCount = await getCitationCountForMonth(userId, targetMonth);

  const estimatedAiTraffic = citationsCount * trafficMultiplier;
  const estimatedConversions = estimatedAiTraffic * conversionRate;
  const estimatedRevenue = estimatedConversions * avgDealValue;

  const confidence = determineConfidence(citationsCount, analyticsProvider);
  const methodologyNote = buildMethodologyNote(
    citationsCount,
    trafficMultiplier,
    conversionRate,
    avgDealValue,
    confidence
  );

  const attribution: AttributionData = {
    period: targetMonth,
    citations_count: citationsCount,
    estimated_ai_traffic: Math.round(estimatedAiTraffic * 100) / 100,
    estimated_conversions: Math.round(estimatedConversions * 100) / 100,
    estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
    confidence,
    methodology_note: methodologyNote,
  };

  // Persist the calculation for historical tracking
  await persistAttribution(userId, attribution);

  return attribution;
}

/**
 * Persist attribution data to the database for trend tracking.
 * Uses upsert on the (user_id, period) unique constraint.
 */
async function persistAttribution(
  userId: string,
  attribution: AttributionData
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('attribution_data')
    .upsert({
      user_id: userId,
      period: attribution.period,
      citations_count: attribution.citations_count,
      estimated_ai_traffic: attribution.estimated_ai_traffic,
      estimated_conversions: attribution.estimated_conversions,
      estimated_revenue: attribution.estimated_revenue,
      confidence: attribution.confidence,
      methodology_note: attribution.methodology_note,
      calculated_at: new Date().toISOString(),
    } as never, { onConflict: 'user_id,period' })
    .select('*')
    .single();

  if (error) {
    // Non-fatal: log but don't throw — the calculation itself succeeded
    console.error('Error persisting attribution data:', error);
  }
}

// --- ROI Summary ---

/**
 * Calculate full ROI summary for a user: current month, 6-month trend, ROI %.
 */
export async function getROISummary(userId: string): Promise<ROISummary> {
  const config = await getROIConfig(userId);
  const subscriptionCost = config?.subscription_cost ?? DEFAULT_SUBSCRIPTION_COST;

  // Calculate attribution for the last 6 months
  const months = getLastNMonths(6);
  const trend: AttributionData[] = [];

  for (const month of months) {
    const attribution = await calculateAttribution(userId, month);
    trend.push(attribution);
  }

  const currentMonth = trend[trend.length - 1];
  const totalAiRevenue = trend.reduce((sum, a) => sum + a.estimated_revenue, 0);
  const totalCost = subscriptionCost * months.length;

  // ROI = (total revenue - total cost) / total cost * 100
  const roiPercentage = totalCost > 0
    ? Math.round(((totalAiRevenue - totalCost) / totalCost) * 100)
    : 0;

  const multiplier = totalCost > 0 ? (totalAiRevenue / totalCost).toFixed(1) : '0';
  let paybackNote: string;

  if (totalAiRevenue === 0) {
    paybackNote = 'No AI-attributed revenue detected yet. Run citation checks to start tracking.';
  } else if (totalAiRevenue < totalCost) {
    const coverage = totalCost > 0 ? ((totalAiRevenue / totalCost) * 100).toFixed(0) : '0';
    paybackNote = `Your AI-attributed revenue covers ${coverage}% of your subscription cost over the last 6 months.`;
  } else {
    paybackNote = `Your AI-attributed revenue covers ${multiplier}x your subscription cost over the last 6 months.`;
  }

  return {
    current_month: currentMonth,
    trend,
    roi_percentage: roiPercentage,
    subscription_cost: subscriptionCost,
    total_ai_revenue: Math.round(totalAiRevenue * 100) / 100,
    payback_note: paybackNote,
  };
}

// --- Monthly Report ---

/**
 * Generate structured report data for a given month (or current).
 * Returns JSON suitable for client-side PDF rendering.
 */
export async function generateMonthlyReport(
  userId: string,
  month?: string
): Promise<MonthlyReport> {
  const targetMonth = month ?? getCurrentMonth();
  const config = await getROIConfig(userId);
  const summary = await getROISummary(userId);

  // Build chart data from trend
  const citationsByMonth = summary.trend.map((a) => ({
    period: a.period,
    count: a.citations_count,
  }));

  const revenueByMonth = summary.trend.map((a) => ({
    period: a.period,
    revenue: a.estimated_revenue,
  }));

  const subscriptionCost = config?.subscription_cost ?? DEFAULT_SUBSCRIPTION_COST;
  const roiByMonth = summary.trend.map((a) => ({
    period: a.period,
    roi: subscriptionCost > 0
      ? Math.round(((a.estimated_revenue - subscriptionCost) / subscriptionCost) * 100)
      : 0,
  }));

  const trafficMultiplier = config?.traffic_multiplier ?? DEFAULT_TRAFFIC_MULTIPLIER;
  const conversionRate = config?.conversion_rate ?? DEFAULT_CONVERSION_RATE;
  const avgDealValue = config?.avg_deal_value ?? DEFAULT_AVG_DEAL_VALUE;

  const methodology = [
    'AImpactScanner ROI Attribution Methodology',
    '==========================================',
    '',
    '1. Citation Detection: AI platforms (ChatGPT, Perplexity, Claude, Gemini, Copilot)',
    '   are monitored for mentions of your domain. Only positive citations are counted.',
    '',
    `2. Traffic Estimation: Each citation is estimated to drive ${trafficMultiplier} visits.`,
    '   This multiplier is based on industry research into AI response click-through rates.',
    '   Connect Google Analytics or Plausible for measured traffic data.',
    '',
    `3. Conversion Estimation: ${(conversionRate * 100).toFixed(1)}% of AI-referred traffic`,
    '   is estimated to convert. Adjust this in your ROI config to match your actual rate.',
    '',
    `4. Revenue Estimation: Each conversion is valued at $${avgDealValue.toFixed(2)}`,
    '   (your configured average deal value).',
    '',
    '5. Confidence Levels:',
    '   - High: Analytics connected + sufficient citation volume',
    '   - Estimated: Default multipliers with reasonable citation data',
    '   - Directional: Low data volume, treat as directional indicators',
    '',
    'All estimates are transparent. We show our work so you can calibrate accordingly.',
  ].join('\n');

  const effectiveConfig: ROIConfig = config ?? {
    id: '',
    user_id: userId,
    analytics_provider: 'manual',
    avg_deal_value: DEFAULT_AVG_DEAL_VALUE,
    conversion_rate: DEFAULT_CONVERSION_RATE,
    traffic_multiplier: DEFAULT_TRAFFIC_MULTIPLIER,
    subscription_cost: DEFAULT_SUBSCRIPTION_COST,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    generated_at: new Date().toISOString(),
    period: targetMonth,
    summary,
    config: effectiveConfig,
    charts: {
      citations_by_month: citationsByMonth,
      revenue_by_month: revenueByMonth,
      roi_by_month: roiByMonth,
    },
    methodology,
  };
}
