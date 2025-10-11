/**
 * Route Configuration for AImpactScanner MVP
 * 
 * Defines which routes require authentication and their security levels
 * Used by ProtectedRoute component to enforce access control
 */

// Routes that require authentication
export const PROTECTED_ROUTES = [
  'dashboard',
  'input',           // New Analysis page
  'analysis',        // Analysis in progress
  'results',         // Analysis results
  'account',         // Account settings
  'pricing',         // Upgrade page (when authenticated)
  'checkout-success', // Payment confirmation
  'checkout-cancel',  // Payment cancelled
  'upsell-coffee',   // Tier upsells (require auth)
  'upsell-growth',
  'upsell-scale',
  'welcome-scale',
];

// Routes that are public (no authentication required)
export const PUBLIC_ROUTES = [
  'landing',
  'login',
  'signup',
  'register',
  'oauth-callback',
  'unified-registration',
  'email-verification',
  'diagnostic-signup',
  'preview-analysis',    // Anonymous analysis preview
  'preview-results',     // Anonymous results preview
  'teaser-results',      // Anonymous teaser results
  'privacy',            // Privacy policy
  'terms',              // Terms of service
  'contact',            // Contact page
  'about',              // About page
];

// Special routes that have conditional authentication
export const CONDITIONAL_ROUTES = {
  'pricing': {
    description: 'Pricing page accessible to both authenticated and anonymous users',
    requireAuth: false, // Can be accessed by anyone
    component: 'TierSelection'
  }
};

/**
 * Check if a route requires authentication
 * @param {string} route - The route name to check
 * @returns {boolean} - Whether the route requires authentication
 */
export const isProtectedRoute = (route) => {
  return PROTECTED_ROUTES.includes(route);
};

/**
 * Check if a route is public (no auth required)
 * @param {string} route - The route name to check  
 * @returns {boolean} - Whether the route is public
 */
export const isPublicRoute = (route) => {
  return PUBLIC_ROUTES.includes(route);
};

/**
 * Get appropriate redirect destination for unauthenticated users
 * @param {string} attemptedRoute - The route the user tried to access
 * @returns {string} - Where to redirect unauthenticated users
 */
export const getUnauthenticatedRedirect = (attemptedRoute) => {
  // For most protected routes, redirect to landing page
  // This preserves the conversion flow by showing value proposition
  
  switch (attemptedRoute) {
    case 'dashboard':
    case 'input':
    case 'analysis':
    case 'results':
      return 'landing'; // Show value proposition and allow anonymous analysis
      
    case 'account':
    case 'checkout-success':
    case 'checkout-cancel':
      return 'login'; // These specifically need login
      
    case 'pricing':
      return 'pricing'; // Pricing is accessible to anonymous users too
      
    default:
      return 'landing';
  }
};

/**
 * Routes that should preserve user intent for post-auth redirect
 */
export const INTENT_PRESERVING_ROUTES = [
  'dashboard',
  'input', 
  'analysis',
  'results',
  'account',
  'pricing'
];

/**
 * Check if route intent should be preserved for post-auth redirect
 * @param {string} route - The route name to check
 * @returns {boolean} - Whether to preserve intent
 */
export const shouldPreserveIntent = (route) => {
  return INTENT_PRESERVING_ROUTES.includes(route);
};