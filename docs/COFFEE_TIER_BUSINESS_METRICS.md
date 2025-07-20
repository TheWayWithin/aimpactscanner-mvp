# Coffee Tier Business Metrics & Analytics
## Revenue Tracking and Growth Analysis

**Purpose**: Monitor Coffee tier performance and optimize for growth  
**Target**: $500-1,500 MRR Month 1  
**Update Frequency**: Daily monitoring, weekly analysis  

---

## 📊 Key Performance Indicators

### **Revenue Metrics**

#### **Monthly Recurring Revenue (MRR)**
```sql
-- Current Coffee tier MRR
SELECT 
  'Coffee Tier MRR' as metric,
  COUNT(*) * 5 as mrr_usd,
  COUNT(*) as active_subscribers,
  ROUND(COUNT(*) * 5 * 12, 0) as annual_run_rate
FROM subscriptions 
WHERE tier = 'coffee' 
AND status = 'active';
```

#### **Daily Revenue Growth**
```sql
-- Daily new Coffee tier subscriptions
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  COUNT(*) * 5 as daily_revenue,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_subscribers
FROM subscriptions 
WHERE tier = 'coffee'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### **Conversion Metrics**

#### **Free to Coffee Conversion Rate**
```sql
-- Overall conversion funnel
WITH user_stats AS (
  SELECT 
    COUNT(CASE WHEN tier = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN tier = 'coffee' THEN 1 END) as coffee_users,
    COUNT(*) as total_users
  FROM users
)
SELECT 
  free_users,
  coffee_users,
  total_users,
  ROUND((coffee_users::float / total_users::float) * 100, 2) as coffee_conversion_rate,
  ROUND((coffee_users::float / (free_users + coffee_users)::float) * 100, 2) as paid_conversion_rate
FROM user_stats;
```

#### **Weekly Conversion Tracking**
```sql
-- Weekly conversion analysis
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(CASE WHEN tier = 'free' THEN 1 END) as new_free_users,
  COUNT(CASE WHEN tier = 'coffee' THEN 1 END) as new_coffee_users,
  ROUND(
    COUNT(CASE WHEN tier = 'coffee' THEN 1 END)::float / 
    COUNT(*)::float * 100, 2
  ) as weekly_conversion_rate
FROM users
WHERE created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY week
ORDER BY week DESC;
```

### **Usage Analytics**

#### **Analysis Volume by Tier**
```sql
-- Daily analysis usage comparison
SELECT 
  DATE(created_at) as date,
  tier,
  COUNT(*) as analyses_count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(processing_time_ms), 0) as avg_processing_time
FROM usage_analytics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date, tier
ORDER BY date DESC, tier;
```

#### **Coffee Tier Usage Intensity**
```sql
-- Coffee tier user engagement
SELECT 
  user_id,
  COUNT(*) as total_analyses,
  DATE(MIN(created_at)) as first_analysis,
  DATE(MAX(created_at)) as last_analysis,
  EXTRACT(days FROM MAX(created_at) - MIN(created_at)) + 1 as days_active,
  ROUND(COUNT(*)::float / (EXTRACT(days FROM MAX(created_at) - MIN(created_at)) + 1), 2) as analyses_per_day
FROM usage_analytics
WHERE tier = 'coffee'
GROUP BY user_id
ORDER BY total_analyses DESC
LIMIT 20;
```

## 🎯 Growth Targets & Milestones

### **30-Day Growth Plan**

#### **Week 1 Targets**
```sql
-- Week 1 success metrics
Target Subscribers: 10-20
Target MRR: $50-100
Conversion Rate: 15-20%
Daily Signups: 2-3
```

#### **Week 2 Targets**
```sql
-- Week 2 success metrics  
Target Subscribers: 30-50
Target MRR: $150-250
Conversion Rate: 20-25%
Daily Signups: 3-5
```

#### **Week 3 Targets**
```sql
-- Week 3 success metrics
Target Subscribers: 60-100
Target MRR: $300-500
Conversion Rate: 25-30%
Daily Signups: 5-8
```

#### **Week 4 Targets**
```sql
-- Week 4 success metrics
Target Subscribers: 100-200
Target MRR: $500-1,000
Conversion Rate: 30-35%
Daily Signups: 8-12
```

### **Performance Tracking Dashboard**

#### **Daily Metrics Query**
```sql
-- Run this daily for performance tracking
WITH daily_stats AS (
  SELECT 
    CURRENT_DATE as report_date,
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'coffee' AND status = 'active') as active_coffee_subs,
    (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE) as new_signups_today,
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'coffee' AND created_at::date = CURRENT_DATE) as new_coffee_today,
    (SELECT COUNT(*) FROM usage_analytics WHERE created_at::date = CURRENT_DATE AND tier = 'coffee') as coffee_analyses_today
)
SELECT 
  report_date,
  active_coffee_subs,
  active_coffee_subs * 5 as current_mrr,
  new_signups_today,
  new_coffee_today,
  CASE WHEN new_signups_today > 0 
    THEN ROUND((new_coffee_today::float / new_signups_today::float) * 100, 1) 
    ELSE 0 
  END as daily_conversion_rate,
  coffee_analyses_today
FROM daily_stats;
```

## 📈 Optimization Strategies

### **Conversion Rate Optimization**

#### **A/B Testing Targets**
```bash
# Test these elements for improved conversion:
1. Pricing page copy ("Buy Me a Coffee" vs "Upgrade to Unlimited")
2. Tier limit messaging (when users hit 3 analyses)
3. Upgrade button placement and color
4. Value proposition emphasis (speed, unlimited, professional)
```

#### **Funnel Analysis**
```sql
-- Identify conversion bottlenecks
WITH funnel AS (
  SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN ua.user_id IS NOT NULL THEN u.id END) as users_who_analyzed,
    COUNT(DISTINCT CASE WHEN u.monthly_analyses_used >= 3 THEN u.id END) as users_hit_limit,
    COUNT(DISTINCT CASE WHEN s.user_id IS NOT NULL THEN u.id END) as users_upgraded
  FROM users u
  LEFT JOIN usage_analytics ua ON u.id = ua.user_id
  LEFT JOIN subscriptions s ON u.id = s.user_id AND s.tier = 'coffee'
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  total_users,
  users_who_analyzed,
  users_hit_limit,
  users_upgraded,
  ROUND((users_who_analyzed::float / total_users::float) * 100, 1) as analysis_rate,
  ROUND((users_hit_limit::float / users_who_analyzed::float) * 100, 1) as limit_hit_rate,
  ROUND((users_upgraded::float / users_hit_limit::float) * 100, 1) as upgrade_rate
FROM funnel;
```

### **Revenue Optimization**

#### **Customer Lifetime Value (LTV)**
```sql
-- Calculate Coffee tier LTV
WITH subscription_durations AS (
  SELECT 
    user_id,
    created_at,
    CASE 
      WHEN status = 'active' THEN EXTRACT(days FROM NOW() - created_at)
      ELSE EXTRACT(days FROM updated_at - created_at)
    END as days_subscribed
  FROM subscriptions
  WHERE tier = 'coffee'
)
SELECT 
  COUNT(*) as total_coffee_subscribers,
  ROUND(AVG(days_subscribed), 0) as avg_days_subscribed,
  ROUND(AVG(days_subscribed) / 30.0, 1) as avg_months_subscribed,
  ROUND((AVG(days_subscribed) / 30.0) * 5, 2) as estimated_ltv
FROM subscription_durations;
```

#### **Churn Analysis**
```sql
-- Monthly churn rate calculation
WITH monthly_churn AS (
  SELECT 
    DATE_TRUNC('month', updated_at) as month,
    COUNT(*) as churned_users
  FROM subscriptions
  WHERE tier = 'coffee' 
  AND status IN ('canceled', 'incomplete_expired')
  GROUP BY month
),
monthly_active AS (
  SELECT 
    DATE_TRUNC('month', date_val) as month,
    COUNT(DISTINCT s.user_id) as active_users
  FROM generate_series(
    DATE_TRUNC('month', NOW() - INTERVAL '6 months'),
    DATE_TRUNC('month', NOW()),
    INTERVAL '1 month'
  ) date_val
  CROSS JOIN subscriptions s
  WHERE s.tier = 'coffee'
  AND s.created_at <= date_val
  AND (s.status = 'active' OR s.updated_at > date_val)
  GROUP BY month
)
SELECT 
  ma.month,
  ma.active_users,
  COALESCE(mc.churned_users, 0) as churned_users,
  ROUND((COALESCE(mc.churned_users, 0)::float / ma.active_users::float) * 100, 2) as churn_rate_percent
FROM monthly_active ma
LEFT JOIN monthly_churn mc ON ma.month = mc.month
ORDER BY ma.month DESC;
```

## 🎯 Action Items by Performance

### **If Conversion Rate < 20%**
```bash
Priority Actions:
1. Analyze user feedback for upgrade hesitation
2. Test different pricing messaging
3. Improve value demonstration on analysis results
4. Add social proof and testimonials
5. Optimize upgrade button placement and design
```

### **If MRR Growth < Target**
```bash
Priority Actions:
1. Increase free tier acquisition through SEO/content
2. Implement referral program for existing Coffee users
3. Create limited-time promotional pricing
4. Add email nurture sequence for free tier users
5. Improve onboarding to demonstrate value faster
```

### **If Churn Rate > 5%**
```bash
Priority Actions:
1. Survey churned users for feedback
2. Improve Coffee tier feature set
3. Add usage reminders and engagement emails
4. Implement win-back campaigns
5. Enhance customer support for paying users
```

## 📧 Automated Reporting

### **Daily Email Report Template**
```markdown
## AImpactScanner Coffee Tier Daily Report

**Date**: {CURRENT_DATE}

### Key Metrics
- **MRR**: ${CURRENT_MRR} ({MRR_CHANGE} vs yesterday)
- **Active Coffee Subscribers**: {COFFEE_SUBS}
- **New Signups Today**: {NEW_SIGNUPS}
- **New Coffee Subscribers**: {NEW_COFFEE_SUBS}
- **Conversion Rate**: {CONVERSION_RATE}%

### Alerts
{ALERT_IF_CONVERSION_BELOW_TARGET}
{ALERT_IF_NEW_CHURN_DETECTED}
{ALERT_IF_TECHNICAL_ISSUES}

### Action Items
{GENERATED_ACTION_ITEMS_BASED_ON_PERFORMANCE}
```

### **Weekly Analysis Points**
```bash
Every Monday, analyze:
1. Week-over-week growth trends
2. Conversion funnel performance
3. Customer feedback themes
4. Technical performance issues
5. Competitive landscape changes
6. Feature request prioritization
7. Marketing campaign effectiveness
```

---

**🎯 Success Formula**: Monitor daily, optimize weekly, and maintain focus on sustainable 25-35% conversion rates for consistent MRR growth to $1,500+ by Month 1.