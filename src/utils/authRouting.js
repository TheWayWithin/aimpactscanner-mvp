// authRouting.js - Post-authentication routing logic
import { supabase } from '../lib/supabaseClient';

/**
 * Retrieves and validates stored auth context from localStorage
 * @returns {Object|null} Auth context or null if expired/invalid
 */
export const getAuthContext = () => {
  try {
    const context = localStorage.getItem('authContext');
    const expiry = localStorage.getItem('authContextExpiry');

    if (!context || !expiry) {
      console.log('📭 No auth context found');
      return null;
    }

    // Check if expired (24-hour TTL)
    if (Date.now() > parseInt(expiry)) {
      console.log('⏰ Auth context expired, clearing');
      clearAuthContext();
      return null;
    }

    const parsed = JSON.parse(context);
    console.log('📦 Retrieved auth context:', parsed);
    return parsed;
  } catch (error) {
    console.error('❌ Error retrieving auth context:', error);
    return null;
  }
};

/**
 * Clears auth context from localStorage
 */
export const clearAuthContext = () => {
  localStorage.removeItem('authContext');
  localStorage.removeItem('authContextExpiry');
  console.log('🧹 Cleared auth context');
};

/**
 * Validates that authContext exists and contains required tier selection
 * @returns {boolean} True if valid, false otherwise
 */
export const validateAuthContext = () => {
  const context = getAuthContext();

  if (!context) {
    console.warn('⚠️ No authContext found - tier selection required before OAuth');
    return false;
  }

  if (!context.selectedTier) {
    console.error('❌ authContext missing selectedTier - invalid signup flow');
    return false;
  }

  // Check if context is expired (older than 24 hours)
  const expiry = localStorage.getItem('authContextExpiry');
  if (expiry && Date.now() > parseInt(expiry)) {
    console.warn('⚠️ authContext expired, clearing');
    clearAuthContext();
    return false;
  }

  // Check if context timestamp is reasonable (within last 30 minutes for active flow)
  const age = Date.now() - (context.timestamp || 0);
  const thirtyMinutes = 30 * 60 * 1000;
  if (age > thirtyMinutes) {
    console.warn(`⚠️ authContext is ${Math.round(age / 60000)} minutes old (max 30 min for active flow)`);
    // Don't clear - still valid within 24hr TTL, just warn
  }

  console.log('✅ authContext validation passed:', {
    tier: context.selectedTier,
    mode: context.mode,
    age: `${Math.round(age / 1000)}s`
  });

  return true;
};

/**
 * Stores pending analysis URL for post-signup retrieval
 * @param {string} url - The URL to analyze
 * @param {string} id - Optional analysis ID
 */
export const storePendingAnalysis = (url, id = null) => {
  if (url) {
    localStorage.setItem('pendingAnalysisUrl', url);
    if (id) {
      localStorage.setItem('pendingAnalysisId', id);
    }
    const ttl = 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('pendingAnalysisExpiry', (Date.now() + ttl).toString());
    console.log('📍 Stored pending analysis:', { url, id });
  }
};

/**
 * Retrieves pending analysis context and clears it
 * @returns {Object|null} { url, id } or null if expired/invalid
 */
export const getPendingAnalysis = () => {
  try {
    const url = localStorage.getItem('pendingAnalysisUrl');
    const id = localStorage.getItem('pendingAnalysisId');
    const expiry = localStorage.getItem('pendingAnalysisExpiry');

    if (!url) {
      return null;
    }

    // Check if expired
    if (expiry && Date.now() > parseInt(expiry)) {
      console.log('⏰ Pending analysis expired, clearing');
      clearPendingAnalysis();
      return null;
    }

    const result = { url, id };
    console.log('🎯 Retrieved pending analysis:', result);

    // Clear after retrieval (one-time use)
    clearPendingAnalysis();

    return result;
  } catch (error) {
    console.error('❌ Error retrieving pending analysis:', error);
    return null;
  }
};

/**
 * Clears pending analysis from localStorage
 */
export const clearPendingAnalysis = () => {
  localStorage.removeItem('pendingAnalysisUrl');
  localStorage.removeItem('pendingAnalysisId');
  localStorage.removeItem('pendingAnalysisExpiry');
  console.log('🧹 Cleared pending analysis');
};

/**
 * Determines post-signup destination based on context
 * @param {Object} user - Supabase user object
 * @param {Object} authContext - Retrieved auth context
 * @returns {Object} { path, state } for routing
 */
export const getPostSignupDestination = (user, authContext = null) => {
  console.log('🧭 Determining post-signup destination for user:', user?.id);

  // Check for pending analysis from landing page
  const pendingAnalysis = getPendingAnalysis();

  if (pendingAnalysis?.url) {
    console.log('✅ Has pending analysis, routing to /analyze with pre-filled URL');
    return {
      path: '/analyze',
      state: {
        prefilledUrl: pendingAnalysis.url,
        analysisId: pendingAnalysis.id,
        source: 'landing_page'
      }
    };
  }

  // Check if tier requires payment (Coffee/Growth/Scale)
  const tier = authContext?.selectedTier || user?.user_metadata?.selected_tier || 'free';
  const isTrial = authContext?.isTrial || false;
  const billingFrequency = authContext?.billingFrequency || 'annual';

  console.log('[authRouting] getPostSignupDestination - authContext:', authContext);
  console.log('[authRouting] Extracted tier:', tier);
  console.log('[authRouting] Extracted isTrial:', isTrial);
  console.log('[authRouting] isTrial type:', typeof isTrial);
  console.log('[authRouting] Extracted billingFrequency:', billingFrequency);

  // Paid tiers: Coffee, Growth, Scale
  if (tier === 'coffee' || tier === 'growth' || tier === 'scale') {
    console.log(`💳 ${tier} tier selected, routing to Stripe checkout (trial: ${isTrial}, billing: ${billingFrequency})`);

    const destination = {
      path: '/checkout',
      state: {
        tier: tier,
        isTrial: isTrial,
        billingFrequency: billingFrequency,
        userId: user?.id,
        email: user?.email
      }
    };

    console.log('[authRouting] Destination object:', destination);
    return destination;
  }

  // Free tier: Go to analysis page
  console.log('📊 Free tier selected, routing to /analyze');
  return {
    path: '/analyze',
    state: {
      prefilledUrl: null,
      source: 'direct_signup'
    }
  };
};

/**
 * Determines post-login destination based on user state
 * @param {Object} user - User data from database
 * @param {Object} session - Supabase session object
 * @returns {Object} { path, state } for routing
 */
export const getPostLoginDestination = async (user, session) => {
  console.log('🧭 Determining post-login destination for user:', user?.id);

  try {
    // PHASE 1 FIX: Check if user is coming from signup flow with tier selection
    // This handles existing users who clicked "sign up" and selected a tier
    const authContext = getAuthContext();

    if (authContext?.mode === 'signup' && authContext?.selectedTier) {
      console.log('🆕 Existing user coming from SIGNUP flow with tier selection');
      console.log('📦 authContext:', authContext);
      console.log('💡 Current database tier:', user?.tier);
      console.log('💡 Requested tier:', authContext.selectedTier);

      // If they selected a different tier, route through signup flow
      if (authContext.selectedTier !== user?.tier) {
        console.log('🔄 Tier change detected, routing to post-signup destination');

        // Update user's tier in database
        const { error: updateError } = await supabase
          .from('users')
          .update({
            tier: authContext.selectedTier,
            selected_tier: authContext.selectedTier,
            subscription_status: authContext.selectedTier === 'free' ? 'active' : 'pending_payment'
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Error updating user tier:', updateError);
        } else {
          console.log('✅ Updated user tier to:', authContext.selectedTier);
        }

        // Route to post-signup destination (includes Stripe checkout for Coffee tier)
        const destination = getPostSignupDestination(session?.user, authContext);
        clearAuthContext(); // Clear after use
        return destination;
      } else {
        console.log('✅ Same tier as database, continuing normal login flow');
        clearAuthContext(); // Clear unused context
      }
    }

    // Check if this is the first login (skip upsell)
    if (user?.is_first_login === true) {
      console.log('👋 First login detected, routing to post-signup destination');

      // Mark first login as complete
      await markFirstLoginComplete(user.id);

      // Route to post-signup destination
      const destination = getPostSignupDestination(session?.user, authContext);
      clearAuthContext(); // Clear after use
      return destination;
    }

    // Returning users: Route based on tier
    console.log('🔄 Returning user, checking tier for routing');
    console.log('📊 User tier:', user?.tier);

    // FIX BUG #8: Coffee/paid tier users should go to dashboard, not upsell
    if (user?.tier && user.tier !== 'free') {
      console.log('✅ Paid tier user (' + user.tier + '), routing to dashboard');
      return { path: '/dashboard', state: {} };
    }

    // Only show upsell to FREE tier users
    console.log('🆓 Free tier user, routing to upsell');
    return getUpsellPage(user);

  } catch (error) {
    console.error('❌ Error determining post-login destination:', error);
    // Fallback to dashboard
    return { path: '/dashboard', state: {} };
  }
};

/**
 * Marks user's first login as complete
 * @param {string} userId - User ID
 */
export const markFirstLoginComplete = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_first_login: false })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error marking first login complete:', error);
    } else {
      console.log('✅ Marked first login complete for user:', userId);
    }
  } catch (error) {
    console.error('❌ Exception marking first login complete:', error);
  }
};

/**
 * Determines tier-based upsell page
 * @param {Object} user - User data from database
 * @returns {Object} { path, state } for routing
 */
export const getUpsellPage = (user) => {
  const tier = user?.tier || 'free';

  console.log('🎯 Determining upsell page for tier:', tier);

  switch (tier) {
    case 'free':
      return {
        path: '/upsell/coffee',
        state: { currentTier: 'free' }
      };

    case 'coffee':
      return {
        path: '/upsell/growth',
        state: { currentTier: 'coffee' }
      };

    case 'growth':
      return {
        path: '/upsell/scale',
        state: { currentTier: 'growth' }
      };

    case 'scale':
      return {
        path: '/welcome/scale',
        state: { currentTier: 'scale' }
      };

    default:
      console.warn('⚠️ Unknown tier, routing to dashboard:', tier);
      return {
        path: '/dashboard',
        state: {}
      };
  }
};

/**
 * Retrieves user data from database including first_login flag
 * @param {string} userId - User ID
 * @returns {Object|null} User data or null
 */
export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, tier, is_first_login, subscription_status, monthly_analyses_used')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }

    console.log('✅ Retrieved user data:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception fetching user data:', error);
    return null;
  }
};
