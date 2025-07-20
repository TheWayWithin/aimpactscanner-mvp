// UsageDashboard.jsx - User Tier and Usage Information Component
// Shows current tier, usage statistics, and upgrade prompts

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const UsageDashboard = ({ user, onUpgrade, className = '' }) => {
  const [usage, setUsage] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user tier and usage information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          tier,
          tier_expires_at,
          monthly_analyses_used,
          monthly_reset_date,
          subscription_status
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Fetch recent usage analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('usage_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (analyticsError) {
        console.warn('Analytics fetch error:', analyticsError);
      }

      setUsage(userData);
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      setError('Failed to load usage information');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAnalyses = () => {
    if (!usage) return 0;
    
    if (usage.tier === 'free') {
      return Math.max(0, 3 - (usage.monthly_analyses_used || 0));
    }
    return 'Unlimited';
  };

  const getUsageColor = () => {
    if (!usage || usage.tier !== 'free') return 'text-green-600';
    
    const remaining = getRemainingAnalyses();
    if (remaining === 0) return 'text-red-600';
    if (remaining === 1) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTierDisplayName = (tier) => {
    const tierNames = {
      'free': 'Free',
      'coffee': '☕ Coffee',
      'professional': '💼 Professional',
      'enterprise': '🏢 Enterprise'
    };
    return tierNames[tier] || tier;
  };

  const isSubscriptionExpired = () => {
    if (!usage?.tier_expires_at) return false;
    return new Date(usage.tier_expires_at) < new Date();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchUsageData}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-gray-500 text-sm">No usage data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Plan & Usage</h3>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Current Tier Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Tier</span>
            <span className="font-medium text-lg">
              {getTierDisplayName(usage.tier)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Analyses Remaining</span>
            <span className={`font-medium text-lg ${getUsageColor()}`}>
              {getRemainingAnalyses()}
            </span>
          </div>

          {usage.tier_expires_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {isSubscriptionExpired() ? 'Expired' : 'Expires'}
              </span>
              <span className={`font-medium ${isSubscriptionExpired() ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(usage.tier_expires_at)}
              </span>
            </div>
          )}
        </div>

        {/* Upgrade Prompts */}
        {usage.tier === 'free' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Upgrade to Coffee Tier
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Get unlimited Phase A analyses for just $5/month. No more limits!
                </p>
                <button
                  onClick={() => onUpgrade?.('coffee')}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  ☕ Buy Me a Coffee
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubscriptionExpired() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Subscription Expired
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Your subscription has expired. Renew to continue unlimited access.
                </p>
                <button
                  onClick={() => onUpgrade?.(usage.tier)}
                  className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Renew Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {analytics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {analytics.slice(0, 5).map((activity, index) => (
                <div key={activity.id || index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Phase A Analysis
                  </span>
                  <span className="text-gray-500">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {analytics.length}
              </div>
              <div className="text-gray-500">Analyses (30 days)</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {usage.tier === 'free' ? usage.monthly_analyses_used || 0 : analytics.length}
              </div>
              <div className="text-gray-500">This Month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;