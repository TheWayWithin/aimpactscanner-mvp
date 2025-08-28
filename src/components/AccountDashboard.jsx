// AccountDashboard.jsx - Account and billing management component
// Shows subscription details, usage, and billing management

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { getActualUserTier, getTierDisplayInfo, syncUserTier } from '../lib/tierUtils';

const AccountDashboard = ({ user, className = '' }) => {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the same client-side usage tracking as the main app
  const { usageData } = useUsageTracking(user?.email);

  useEffect(() => {
    if (user?.id) {
      fetchAccountData();
    }
  }, [user]);

  const handleManageSubscription = async () => {
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
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the actual tier considering all sources
      const actualTierInfo = await getActualUserTier(user.id);
      
      // Skip sync due to subscription_tier constraint issues
      // await syncUserTier(user.id, user.email);

      // Fetch user account information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          tier,
          subscription_tier,
          tier_expires_at,
          monthly_analyses_used,
          monthly_reset_date,
          subscription_status,
          stripe_customer_id,
          created_at
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Merge actual tier info with user data
      const mergedUserData = {
        ...userData,
        tier: actualTierInfo.tier,
        subscription_status: actualTierInfo.subscriptionStatus,
        has_active_subscription: actualTierInfo.hasActiveSubscription,
        stripe_subscription_id: actualTierInfo.stripeSubscriptionId
      };

      // Fetch recent analyses for usage stats
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('id, created_at, url, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (analysesError) {
        console.warn('Error fetching analyses:', analysesError);
      }

      // Check for any subscription records
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('tier, status, stripe_subscription_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setAccountData({
        user: mergedUserData,
        analyses: analysesData || [],
        subscription: subscriptionData?.[0] || null
      });
    } catch (error) {
      console.error('Error fetching account data:', error);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier) => {
    const tierNames = {
      'free': '🆓 Free',
      'coffee': '☕ Coffee',
      'growth': '🚀 Growth',
      'scale': '📈 Scale',
      // Backward compatibility
      'professional': '🚀 Growth',
      'enterprise': '📈 Scale'
    };
    return tierNames[tier] || tier;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemainingAnalyses = () => {
    // Use client-side usage data instead of database data
    if (usageData.isUnlimited) {
      return 'Unlimited';
    }
    return usageData.remaining || 0;
  };

  const getUsedAnalyses = () => {
    // Use client-side usage data instead of database data
    return usageData.monthlyUsed || 0;
  };

  const isSubscriptionExpired = () => {
    // Check subscription end date first, then tier expiry
    if (accountData?.subscription?.current_period_end) {
      return new Date(accountData.subscription.current_period_end) < new Date();
    }
    if (accountData?.user?.tier_expires_at) {
      return new Date(accountData.user.tier_expires_at) < new Date();
    }
    return false;
  };

  const getSubscriptionStatus = () => {
    if (!accountData?.user) return 'Unknown';
    
    const tier = accountData.user.tier;
    const status = accountData.user.subscription_status;
    
    if (tier === 'free') return 'Free Plan';
    if (isSubscriptionExpired()) return 'Expired';
    if (status === 'active') return 'Active';
    if (status === 'canceled') return 'Canceled';
    return status || 'Unknown';
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Temporary Connection Issue
          </h3>
          <p className="text-yellow-800 mb-4">
            We're experiencing temporary issues connecting to our database. This doesn't affect your ability to run analyses.
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-gray-700 mb-2">✅ You can still:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Run free analyses (3 per month)</li>
              <li>View analysis results</li>
              <li>Access all features</li>
            </ul>
          </div>
          <button
            onClick={fetchAccountData}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!accountData) return null;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {formatDate(accountData.user.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer ID</span>
                  <span className="text-sm font-mono text-gray-500" style={{fontSize: '11px'}}>
                    {accountData.user.stripe_customer_id || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Subscription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Plan</span>
                  <span className="text-sm font-medium">
                    {getTierDisplayName(accountData.user.tier)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${
                    getSubscriptionStatus() === 'Active' ? 'text-green-600' :
                    getSubscriptionStatus() === 'Expired' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {getSubscriptionStatus()}
                  </span>
                </div>
                {(accountData.subscription?.current_period_end || accountData.user.tier_expires_at) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {isSubscriptionExpired() ? 'Expired' : 'Renews'}
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(accountData.subscription?.current_period_end || accountData.user.tier_expires_at)}
                    </span>
                  </div>
                )}
                {accountData.subscription && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subscription ID</span>
                    <span className="text-sm font-mono text-gray-500" style={{fontSize: '11px'}}>
                      {accountData.subscription.stripe_subscription_id || 'Not set'}
                    </span>
                  </div>
                )}
                {accountData.user.has_active_subscription && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Subscription</span>
                    <span className="text-sm font-medium text-green-600">✓ Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Subscription Management Button */}
          {accountData.user.tier !== 'free' && accountData.user.stripe_customer_id && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleManageSubscription}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Subscription
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Cancel anytime, update payment method, or download invoices
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {getRemainingAnalyses()}
              </div>
              <div className="text-sm text-gray-600">
                {usageData.isUnlimited ? 'Analyses Available' : 'Remaining This Month'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {getUsedAnalyses()}
              </div>
              <div className="text-sm text-gray-600">Used This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {accountData.analyses.length}
              </div>
              <div className="text-sm text-gray-600">Total Analyses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {accountData.analyses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {accountData.analyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {analysis.url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(analysis.created_at)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      analysis.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : analysis.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing Actions */}
      {accountData.user.tier !== 'free' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Billing Management</h2>
          </div>
          <div className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Manage your subscription, update payment methods, and view billing history through Stripe.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => alert('Billing portal integration coming soon!')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Manage Billing
                </button>
                <button
                  onClick={() => alert('Download invoices feature coming soon!')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Download Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDashboard;