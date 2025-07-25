// TierManager.ts - Coffee Tier Access Control and Management
// Handles tier validation, usage tracking, and subscription management

export interface TierAccessResult {
  allowed: boolean;
  tier: string;
  remainingAnalyses?: number;
  subscriptionExpired?: boolean;
  upgradeRequired?: boolean;
  message?: string;
}

export interface UsageRecord {
  userId: string;
  analysisId: string;
  tier: string;
  analysisType: string;
  processingTime: number;
  success: boolean;
}

export class TierManager {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Validates if a user can perform an analysis based on their tier
   */
  async validateAnalysisAccess(userId: string): Promise<TierAccessResult> {
    try {
      console.log('🔍 Checking tier access for user:', userId);

      // First try using database function (if migration is applied)
      try {
        const { data, error } = await this.supabase
          .rpc('check_tier_access', { user_uuid: userId });

        if (!error && data && data.length > 0) {
          const result = data[0];
          console.log('✅ Tier access result (function):', result);

          return {
            allowed: result.allowed,
            tier: result.tier,
            remainingAnalyses: result.remaining_analyses === -1 ? undefined : result.remaining_analyses,
            subscriptionExpired: result.subscription_expired,
            upgradeRequired: !result.allowed,
            message: result.message || ''
          };
        } else {
          console.log('⚠️ Database function returned no data, using fallback');
        }
      } catch (fnError) {
        console.log('⚠️ Database function not available, using fallback tier checking:', fnError.message);
      }

      // Fallback: Direct table query (for when migration not yet applied)
      try {
        const { data: user, error: userError } = await this.supabase
          .from('users')
          .select('tier, tier_expires_at, monthly_analyses_used, monthly_reset_date')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          console.log('❌ User not found (fallback):', userError?.message);
          return {
            allowed: false,
            tier: 'unknown',
            message: 'User not found'
          };
        }

        // Simple tier validation logic
        const userTier = user.tier || 'free';
        console.log('✅ User tier (fallback):', userTier);

        // For now, allow all analyses while we're setting up
        // In production, this would enforce tier limits
        return {
          allowed: true,
          tier: userTier,
          remainingAnalyses: userTier === 'free' ? 3 : undefined,
          subscriptionExpired: false,
          upgradeRequired: false,
          message: 'Analysis allowed (fallback mode)'
        };
      } catch (fallbackError) {
        console.log('❌ Fallback query failed:', fallbackError.message);
        // Ultimate fallback - allow analysis but log the issue
        return {
          allowed: true,
          tier: 'free',
          remainingAnalyses: 3,
          subscriptionExpired: false,
          upgradeRequired: false,
          message: 'Analysis allowed (ultimate fallback)'
        };
      }

    } catch (error) {
      console.error('❌ TierManager.validateAnalysisAccess error:', error);
      return {
        allowed: true, // Allow for now during setup
        tier: 'free',
        message: 'Analysis allowed (error fallback)'
      };
    }
  }

  /**
   * Records usage analytics and increments counters
   */
  async recordUsage(usage: UsageRecord): Promise<void> {
    try {
      console.log('📊 Recording usage for user:', usage.userId, 'tier:', usage.tier);

      // Try to increment monthly count for free tier users (if function exists)
      if (usage.tier === 'free') {
        try {
          await this.supabase
            .rpc('increment_monthly_analyses', { user_uuid: usage.userId });
        } catch (fnError) {
          console.log('⚠️ increment_monthly_analyses function not available');
        }
      }

      // Try to record usage analytics (if table exists)
      try {
        const { error: analyticsError } = await this.supabase
          .from('usage_analytics')
          .insert({
            user_id: usage.userId,
            analysis_id: usage.analysisId,
            tier: usage.tier,
            analysis_type: usage.analysisType,
            processing_time_ms: usage.processingTime,
            success: usage.success
          });

        if (analyticsError) {
          console.log('⚠️ Usage analytics table not available:', analyticsError.message);
        } else {
          console.log('✅ Usage recorded successfully');
        }
      } catch (tableError) {
        console.log('⚠️ Usage analytics table not available');
      }

    } catch (error) {
      console.error('❌ TierManager.recordUsage error:', error);
      // Don't throw - usage recording shouldn't break analysis
    }
  }

  /**
   * Upgrades a user to Coffee tier (called by Stripe webhook)
   */
  async upgradeToCoffeeTier(userId: string, subscriptionData: any): Promise<void> {
    try {
      console.log('☕ Upgrading user to Coffee tier:', userId);

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      // Update user tier
      const { error: userError } = await this.supabase
        .from('users')
        .update({
          tier: 'coffee',
          tier_expires_at: expiresAt.toISOString(),
          stripe_customer_id: subscriptionData.customer,
          subscription_status: 'active'
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Create subscription record
      const { error: subError } = await this.supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier: 'coffee',
          stripe_subscription_id: subscriptionData.id,
          stripe_price_id: subscriptionData.items.data[0].price.id,
          status: 'active',
          current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscriptionData.cancel_at_period_end || false
        }, {
          onConflict: 'stripe_subscription_id'
        });

      if (subError) throw subError;

      console.log('✅ User upgraded to Coffee tier successfully');

    } catch (error) {
      console.error('❌ TierManager.upgradeToCoffeeTier error:', error);
      throw error;
    }
  }

  /**
   * Downgrades a user when subscription expires or is canceled
   */
  async downgradeTier(userId: string, reason: string = 'subscription_ended'): Promise<void> {
    try {
      console.log('⬇️ Downgrading user tier:', userId, 'reason:', reason);

      // Update user to free tier
      const { error: userError } = await this.supabase
        .from('users')
        .update({
          tier: 'free',
          tier_expires_at: null,
          subscription_status: 'inactive'
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Update subscription status
      const { error: subError } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subError) {
        console.warn('⚠️ Could not update subscription status:', subError);
      }

      console.log('✅ User downgraded successfully');

    } catch (error) {
      console.error('❌ TierManager.downgradeTier error:', error);
      throw error;
    }
  }

  /**
   * Gets user tier and usage information
   */
  async getUserTierInfo(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          tier,
          tier_expires_at,
          monthly_analyses_used,
          monthly_reset_date,
          subscription_status,
          subscriptions (
            tier,
            status,
            current_period_end,
            cancel_at_period_end
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('❌ TierManager.getUserTierInfo error:', error);
      throw error;
    }
  }

  /**
   * Gets usage analytics for a user
   */
  async getUserUsageAnalytics(userId: string, days: number = 30): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('usage_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('❌ TierManager.getUserUsageAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Static helper to format tier display names
   */
  static formatTierName(tier: string): string {
    const tierNames = {
      'free': 'Free',
      'coffee': '☕ Coffee',
      'professional': '💼 Professional',
      'enterprise': '🏢 Enterprise'
    };
    return tierNames[tier] || tier;
  }

  /**
   * Static helper to get tier limits
   */
  static getTierLimits(tier: string): { analyses: number | string, features: string[] } {
    const limits = {
      'free': {
        analyses: 3,
        features: ['3 analyses per month', 'Basic recommendations', 'Phase A factors', 'Watermarked results']
      },
      'coffee': {
        analyses: 'Unlimited',
        features: ['Unlimited Phase A analyses', 'Professional recommendations', 'Clean results', 'Export capabilities']
      },
      'professional': {
        analyses: 'Unlimited',
        features: ['Everything in Coffee', 'Phase B factors (22 total)', 'Advanced analysis', 'Priority support']
      },
      'enterprise': {
        analyses: 'Unlimited',
        features: ['Everything in Professional', 'API access', 'Team collaboration', 'Custom reporting']
      }
    };
    return limits[tier] || limits['free'];
  }

  /**
   * Static helper to check if upgrade is available
   */
  static getAvailableUpgrades(currentTier: string): string[] {
    const upgradeMap = {
      'free': ['coffee', 'professional', 'enterprise'],
      'coffee': ['professional', 'enterprise'],
      'professional': ['enterprise'],
      'enterprise': []
    };
    return upgradeMap[currentTier] || [];
  }
}

export default TierManager;