// tierUtils.js - Utility functions for tier management and synchronization
import { supabase } from './supabaseClient';

/**
 * Get the actual user tier considering all sources
 * Checks users table (tier and subscription_tier) and subscriptions table
 */
export async function getActualUserTier(userId) {
  try {
    // First try the database function
    const { data: tierData, error: tierError } = await supabase
      .rpc('get_actual_user_tier', { user_id: userId });

    if (!tierError && tierData && tierData.length > 0) {
      return {
        tier: tierData[0].actual_tier,
        subscriptionStatus: tierData[0].subscription_status,
        hasActiveSubscription: tierData[0].has_active_subscription,
        stripeSubscriptionId: tierData[0].stripe_subscription_id
      };
    }

    // Fallback to direct queries if function fails
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tier, subscription_tier, subscription_status, tier_expires_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user tier:', userError);
      return { tier: 'free', subscriptionStatus: 'active' };
    }

    // Check if tier is expired
    if (userData.tier_expires_at && new Date(userData.tier_expires_at) < new Date()) {
      return { tier: 'free', subscriptionStatus: 'expired' };
    }

    // Check subscriptions table for active subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('tier, status, stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subData && subData.length > 0) {
      return {
        tier: subData[0].tier,
        subscriptionStatus: subData[0].status,
        hasActiveSubscription: true,
        stripeSubscriptionId: subData[0].stripe_subscription_id
      };
    }

    // Return the highest tier from user data
    const userTier = userData.tier || userData.subscription_tier || 'free';
    return {
      tier: userTier,
      subscriptionStatus: userData.subscription_status || 'active',
      hasActiveSubscription: false
    };

  } catch (error) {
    console.error('Error in getActualUserTier:', error);
    return { tier: 'free', subscriptionStatus: 'active' };
  }
}

/**
 * Sync user tier across all columns and localStorage
 */
export async function syncUserTier(userId, userEmail) {
  try {
    const actualTier = await getActualUserTier(userId);
    
    // Update localStorage for client-side tracking
    if (userEmail) {
      const storageKey = `usage_${userEmail}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        const unlimited = ['coffee', 'growth', 'scale', 'professional', 'enterprise'].includes(actualTier.tier);
        
        const updatedData = {
          ...data,
          tier: actualTier.tier,
          isUnlimited: unlimited,
          lastSynced: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
      }
    }

    // Update user record if needed - only update tier, not subscription_tier (has constraint)
    const { error } = await supabase
      .from('users')
      .update({
        tier: actualTier.tier,
        subscription_status: actualTier.subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error syncing user tier:', error);
    }

    return actualTier;
  } catch (error) {
    console.error('Error in syncUserTier:', error);
    return { tier: 'free', subscriptionStatus: 'active' };
  }
}

/**
 * Get tier display information
 */
export function getTierDisplayInfo(tier) {
  const tierInfo = {
    'free': {
      name: 'Free',
      icon: '🆓',
      displayName: '🆓 Free',
      limit: 3,
      isUnlimited: false,
      color: 'bg-gray-100 text-gray-800'
    },
    'coffee': {
      name: 'Coffee',
      icon: '☕',
      displayName: '☕ Coffee',
      limit: null,
      isUnlimited: true,
      color: 'bg-yellow-100 text-yellow-800'
    },
    'growth': {
      name: 'Growth',
      icon: '🚀',
      displayName: '🚀 Growth',
      limit: null,
      isUnlimited: true,
      color: 'bg-blue-100 text-blue-800'
    },
    'scale': {
      name: 'Scale',
      icon: '📈',
      displayName: '📈 Scale',
      limit: null,
      isUnlimited: true,
      color: 'bg-purple-100 text-purple-800'
    },
    // Backward compatibility mappings
    'professional': {
      name: 'Growth',
      icon: '🚀',
      displayName: '🚀 Growth',
      limit: null,
      isUnlimited: true,
      color: 'bg-blue-100 text-blue-800'
    },
    'enterprise': {
      name: 'Scale',
      icon: '📈',
      displayName: '📈 Scale',
      limit: null,
      isUnlimited: true,
      color: 'bg-purple-100 text-purple-800'
    }
  };

  return tierInfo[tier] || tierInfo['free'];
}

/**
 * Check if user has access to a feature based on tier
 */
export function hasFeatureAccess(tier, feature) {
  // Map old tier names to new ones for backward compatibility
  const mappedTier = tier === 'professional' ? 'growth' : tier === 'enterprise' ? 'scale' : tier;
  
  const featureMatrix = {
    'pdf_export': ['coffee', 'growth', 'scale', 'professional', 'enterprise'],
    'unlimited_analyses': ['coffee', 'growth', 'scale', 'professional', 'enterprise'],
    'planner': ['growth', 'scale', 'professional', 'enterprise'],
    'priority_support': ['growth', 'scale', 'professional', 'enterprise'],
    'api_access': ['scale', 'enterprise'], // Removed from growth tier
    'team_management': ['scale', 'enterprise']
  };

  const allowedTiers = featureMatrix[feature] || [];
  return allowedTiers.includes(mappedTier) || allowedTiers.includes(tier);
}

/**
 * Calculate remaining analyses for the current month
 */
export function calculateRemainingAnalyses(tier, monthlyUsed) {
  const tierInfo = getTierDisplayInfo(tier);
  
  if (tierInfo.isUnlimited) {
    return 'Unlimited';
  }
  
  return Math.max(0, tierInfo.limit - monthlyUsed);
}