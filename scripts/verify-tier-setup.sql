-- Verification script to confirm tier setup is working correctly

-- 1. Check your current user state
SELECT 
  'User Table' as source,
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  u.monthly_analyses_used,
  u.stripe_customer_id
FROM users u
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- 2. Check your active subscriptions
SELECT 
  'Subscriptions Table' as source,
  s.tier,
  s.status,
  s.stripe_subscription_id,
  s.current_period_end,
  s.created_at
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND s.status = 'active'
ORDER BY s.created_at DESC;

-- 3. Test the get_actual_user_tier function
SELECT 
  'Function Result' as source,
  actual_tier,
  subscription_status,
  has_active_subscription,
  stripe_subscription_id
FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);

-- 4. Check if the tier and subscription_tier are now in sync
SELECT 
  CASE 
    WHEN tier = subscription_tier THEN '✅ Tiers are synchronized'
    ELSE '❌ Tiers are NOT synchronized'
  END as sync_status,
  tier,
  subscription_tier
FROM users
WHERE email = 'jamie.watters.mail@icloud.com';

-- 5. Verify you have Coffee tier access
SELECT 
  CASE 
    WHEN tier = 'coffee' THEN '✅ You have Coffee tier access'
    WHEN tier = 'free' THEN '🆓 You have Free tier (3 analyses/month)'
    ELSE '❓ Unknown tier: ' || tier
  END as tier_status,
  CASE 
    WHEN tier IN ('coffee', 'professional', 'enterprise') THEN 'Unlimited analyses'
    ELSE '3 analyses per month'
  END as analysis_limit
FROM users
WHERE email = 'jamie.watters.mail@icloud.com';