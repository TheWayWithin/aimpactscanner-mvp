// Lightweight A/B test utility
// Deterministic bucketing with localStorage persistence
// Fires analytics event on first assignment

const STORAGE_KEY = 'ab_test_assignments';

// --- A/B Test Definitions (Audit v3 Backlog) ---
// Activate after 2-4 weeks of baseline data collection post-launch.
// Set status to 'active' when ready to run.

export const AB_TESTS = {
  hero_subheadline_v1: {
    status: 'ready',       // ready | active | paused | complete
    variants: ['control', 'benefit'],
    hypothesis: 'A benefit-oriented sub-headline will increase scan starts vs the framework-focused control.',
    control: 'Analyze your page against the published 27-factor MASTERY-AI Framework. Get a prioritized list of what to fix first — free in under 60 seconds.',
    benefit: 'Find out why AI assistants skip your business — and get a prioritized fix list in under 60 seconds. Free, no signup.',
    primaryMetric: 'scan_start',
    secondaryMetric: 'scan_complete_free',
    minSamplePerVariant: 200,
  },
  sample_report_placement_v1: {
    status: 'ready',
    variants: ['control', 'inline'],
    hypothesis: 'Showing an inline mini sample report on the homepage will increase scans more than a "View Sample Report" CTA button.',
    control: 'CTA button linking to /sample-report page',
    inline: 'Inline mini-report preview embedded in homepage Section 5',
    primaryMetric: 'scan_start',
    secondaryMetric: 'view_sample_report',
    minSamplePerVariant: 250,
  },
  pricing_highlight_v1: {
    status: 'ready',
    variants: ['control', 'highlight'],
    hypothesis: 'Strongly highlighting the Growth tier as "Most Popular" with visual emphasis will increase Growth tier selection rate.',
    control: 'Three-tier table with equal visual weight',
    highlight: 'Growth tier scaled up, bordered, with "Most Popular" badge and slight lift',
    primaryMetric: 'select_plan',
    secondaryMetric: 'checkout_start',
    minSamplePerVariant: 150,
  },
};

/**
 * Get the variant for a given test. Assigns deterministically on first call
 * and persists the assignment in localStorage.
 *
 * @param {string} testName - Unique test identifier (e.g., 'hero_headline_v1')
 * @param {string[]} variants - Array of variant names (default: ['control', 'variant'])
 * @returns {string} The assigned variant name
 */
export function getVariant(testName, variants = ['control', 'variant']) {
  const assignments = getAssignments();

  // Return existing assignment if present
  if (assignments[testName]) {
    return assignments[testName];
  }

  // Deterministic bucketing based on a random value stored per-user
  const bucket = getUserBucket();
  const index = Math.abs(hashCode(`${testName}:${bucket}`)) % variants.length;
  const variant = variants[index];

  // Persist
  assignments[testName] = variant;
  saveAssignments(assignments);

  // Fire analytics event
  trackAssignment(testName, variant);

  return variant;
}

/**
 * Check if a user is in a specific variant without triggering assignment.
 */
export function peekVariant(testName) {
  const assignments = getAssignments();
  return assignments[testName] || null;
}

/**
 * Force a variant for testing/debugging. Only works in development.
 */
export function forceVariant(testName, variant) {
  if (import.meta.env.DEV) {
    const assignments = getAssignments();
    assignments[testName] = variant;
    saveAssignments(assignments);
    console.log(`[AB] Forced ${testName} = ${variant}`);
  }
}

/**
 * Get all current assignments (for debugging).
 */
export function getAllAssignments() {
  return { ...getAssignments() };
}

// --- Internal helpers ---

function getAssignments() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAssignments(assignments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // localStorage full or unavailable - continue without persistence
  }
}

function getUserBucket() {
  const key = 'ab_user_bucket';
  let bucket = localStorage.getItem(key);
  if (!bucket) {
    bucket = Math.random().toString(36).slice(2, 10);
    try {
      localStorage.setItem(key, bucket);
    } catch {
      // continue without persistence
    }
  }
  return bucket;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

function trackAssignment(testName, variant) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'ab_test_assignment',
      ab_test_name: testName,
      ab_test_variant: variant,
      timestamp: new Date().toISOString()
    });
  }
}
