// SimpleAccountDashboard.jsx - Simplified account view that works without database
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { hasFeatureAccess } from '../lib/tierUtils';
import ApiKeysSection from './ApiKeysSection';

const SimpleAccountDashboard = ({ user, userTier, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [actualMonthlyCount, setActualMonthlyCount] = useState(null);
  const { usageData } = useUsageTracking(user?.email);

  // DEBUG: Log tier data to diagnose display issue
  console.log('[DEBUG Dashboard] User tier prop:', userTier);
  console.log('[DEBUG Dashboard] User object tier:', user?.tier);
  console.log('[DEBUG Dashboard] User subscription_tier:', user?.subscription_tier);
  console.log('[DEBUG Dashboard] Full user object:', user);
  
  // Fetch actual analysis count from database
  useEffect(() => {
    const fetchActualCount = async () => {
      if (!user?.id) return;
      
      try {
        // Get current month's start date
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Count analyses from this month
        const { count, error } = await supabase
          .from('analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth);
        
        if (!error && count !== null) {
          setActualMonthlyCount(count);
          console.log(`📊 Actual analyses this month: ${count}`);
        }
      } catch (error) {
        console.error('Failed to fetch actual analysis count:', error);
      }
    };
    
    fetchActualCount();
  }, [user?.id]);
  
  // Get tier display info
  const getTierDisplayName = (tier) => {
    const tierNames = {
      'free': 'Free',
      'coffee': 'Solo',
      'coffee_pending': 'Solo (Payment Pending)',
      'pending_payment': 'Payment Pending',
      'pending_registration': 'Registration Incomplete',
      'growth': 'Growth',
      'scale': 'Scale'
    };
    return tierNames[tier] || tier || 'Unknown';
  };

  const getTierBadgeColor = (tier) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-800',
      'coffee': 'bg-yellow-100 text-yellow-800',
      'coffee_pending': 'bg-yellow-100 text-yellow-600',
      'pending_payment': 'bg-orange-100 text-orange-800',
      'growth': 'bg-blue-100 text-blue-800',
      'scale': 'bg-cloud text-mastery'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Call the Edge Function to create a portal session
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          returnUrl: window.location.href 
        }
      });

      if (error) {
        console.error('Portal session error:', error);
        alert('Unable to open subscription management. Please try again.');
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned');
        alert('Unable to open subscription management. Please try again.');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemainingAnalyses = () => {
    const tier = userTier?.toLowerCase();
    const used = getUsedAnalyses();

    // Tier limits
    const tierLimits = {
      'free': 3,
      'coffee': 10,
      'growth': 40,
      'scale': 100
    };

    const limit = tierLimits[tier];

    // DEBUG: Log calculation details
    console.log('[DEBUG getRemainingAnalyses] Tier:', tier);
    console.log('[DEBUG getRemainingAnalyses] Limit:', limit);
    console.log('[DEBUG getRemainingAnalyses] Used:', used);
    console.log('[DEBUG getRemainingAnalyses] Remaining:', Math.max(0, limit - used));

    if (!limit) return 3; // Default to free tier limit

    return Math.max(0, limit - used);
  };

  const getUsedAnalyses = () => {
    // Prefer actual database count over localStorage tracking
    if (actualMonthlyCount !== null) {
      return actualMonthlyCount;
    }
    return usageData.monthlyUsed || 0;
  };

  const getSubscriptionStatus = () => {
    if (userTier === 'free') return 'Free Plan';
    if (userTier && userTier.toLowerCase() === 'coffee') return 'Active';
    if (userTier === 'coffee_pending' || userTier === 'pending_payment') return 'Pending Payment';
    if (userTier === 'pending_registration') return 'Registration Incomplete';
    return 'Active';
  };

  const showManageButton = userTier && (['coffee', 'growth', 'scale'].includes(userTier.toLowerCase()));
  const showUpgradeButton = userTier === 'free';
  const showPaymentPending = userTier === 'coffee_pending' || userTier === 'pending_payment';

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user?.email || 'Not available'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-mono text-xs text-gray-500">{user?.id || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-lg">{getTierDisplayName(userTier)}</p>
                {/* API Access Badge - Show for all tiers */}
                {hasFeatureAccess(userTier, 'api_access') ? (
                  // Scale tier - Active badge
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-mastery">
                    🔌 API Access
                  </span>
                ) : (
                  // Free/Solo/Growth - Locked badge with tooltip
                  <div className="relative group">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 cursor-help">
                      API Access
                    </span>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-sm rounded py-3 px-4 z-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <p className="font-semibold mb-1">🔌 Automate Your Analysis</p>
                      <p className="mb-2">Programmatic access via REST API</p>
                      <p className="text-xs opacity-90">Upgrade to Scale to unlock API access</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierBadgeColor(userTier)}`}>
              {getSubscriptionStatus()}
            </span>
          </div>

          {showPaymentPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Your Solo tier subscription is pending payment.
                Please complete the payment process to activate your subscription.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Analyses Used This Month</p>
              <p className="font-medium">{getUsedAnalyses()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Remaining Analyses</p>
              <p className="font-medium">{getRemainingAnalyses()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {showManageButton && (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}
            
            {showUpgradeButton && (
              <a
                href="/#pricing"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block"
              >
                Upgrade to Solo 
              </a>
            )}
          </div>
        </div>
      </div>

      {/* API Keys Section - Scale tier only */}
      {hasFeatureAccess(userTier, 'api_access') && (
        <ApiKeysSection />
      )}

      {/* Usage Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Summary</h2>
        
        <div className="space-y-3">
          {userTier === 'free' ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Monthly Usage</span>
                <span className="text-sm text-gray-600">
                  {getUsedAnalyses()} / 3 analyses
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((getUsedAnalyses() / 3) * 100, 100)}%` }}
                />
              </div>
              {getRemainingAnalyses() === 0 && (
                <p className="text-sm text-orange-600 mt-2 max-w-full overflow-hidden break-words">
                  Monthly limit reached. Upgrade to Solo for 10 analyses/month!
                </p>
              )}
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800">
                {getRemainingAnalyses()} analyses remaining with your {getTierDisplayName(userTier)} plan
              </p>
              <p className="text-sm text-green-600 mt-1">
                You've completed {getUsedAnalyses()} analyses this month
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Account Created</span>
            <span>{formatDate(user?.created_at)}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Last Sign In</span>
            <span>{formatDate(user?.last_sign_in_at)}</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Reset Date</span>
            <span>{formatDate(usageData.resetDate) || 'Next month'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAccountDashboard;