# Coffee Tier Quick Start Guide
## Deploy Your $5/Month Revenue Stream in 60 Minutes

**🎯 Goal**: Deploy complete Coffee tier subscription system  
**⏱️ Time**: 60 minutes  
**💰 Revenue**: $500-1,500 MRR potential  

---

## ⚡ 15-Minute Quick Deploy

### **Step 1: Stripe Setup (10 minutes)**
```bash
1. Go to: https://dashboard.stripe.com/products
2. Create Product: "AImpactScanner Coffee Tier"
   - Price: $5.00 USD monthly
   - Copy Price ID (starts with "price_")
3. Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: https://[your-project].supabase.co/functions/v1/stripe-webhook
   - Select events: checkout.session.completed, invoice.payment_succeeded
   - Copy webhook secret (starts with "whsec_")
```

### **Step 2: Environment Variables (5 minutes)**
```bash
# Add to Supabase Dashboard -> Settings -> Environment Variables:
STRIPE_SECRET_KEY=sk_live_... (from Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe)

# Add to your .env.local:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (from Stripe)
VITE_STRIPE_COFFEE_PRICE_ID=price_... (from Stripe)
```

---

## 🚀 Production Deployment Commands

### **Database (Already Complete ✅)**
```bash
# Verify migration status:
npm run verify:steps
# Should show: "🎉 All steps completed successfully!"
```

### **Deploy Edge Functions**
```bash
# Deploy all payment processing functions:
npx supabase functions deploy analyze-page
npx supabase functions deploy create-checkout-session  
npx supabase functions deploy stripe-webhook
```

### **Frontend Integration**
```jsx
// Add to your App.jsx:
import TierSelection from './components/TierSelection'
import UsageDashboard from './components/UsageDashboard'
import { useUpgrade } from './components/UpgradeHandler'

function App() {
  const { handleUpgrade } = useUpgrade(user, onSuccess, onError)
  
  return (
    <>
      <UsageDashboard user={user} onUpgrade={handleUpgrade} />
      <TierSelection currentTier={user?.tier} onUpgrade={handleUpgrade} />
    </>
  )
}
```

### **Deploy Frontend**
```bash
npm run build
# Deploy to Vercel/Netlify/your hosting platform
```

---

## ✅ Test Payment Flow

### **Test Coffee Tier Purchase**
1. **Sign up** new user account
2. **Run 3 analyses** (hit free limit)
3. **Click "Buy Me a Coffee"** button
4. **Use test card**: 4242 4242 4242 4242
5. **Verify unlimited access** granted

### **Monitor Success**
```sql
-- Check new subscription in Supabase SQL Editor:
SELECT * FROM subscriptions WHERE tier = 'coffee' ORDER BY created_at DESC LIMIT 5;

-- Verify user tier updated:
SELECT email, tier, tier_expires_at FROM users WHERE tier = 'coffee';
```

---

## 📊 Revenue Tracking

### **Daily Revenue Check**
```sql
-- Today's Coffee tier revenue:
SELECT 
  COUNT(*) as new_subscriptions,
  COUNT(*) * 5 as revenue_usd
FROM subscriptions 
WHERE tier = 'coffee' 
AND DATE(created_at) = CURRENT_DATE;
```

### **Monthly Recurring Revenue**
```sql
-- Current MRR:
SELECT 
  COUNT(*) * 5 as coffee_mrr,
  COUNT(*) as active_coffee_users
FROM subscriptions 
WHERE tier = 'coffee' 
AND status = 'active';
```

---

## 🎯 Success Checklist

### **Hour 1: Deploy**
- [ ] Stripe products and webhooks configured
- [ ] Environment variables set
- [ ] Edge Functions deployed
- [ ] Frontend integrated and deployed

### **Hour 2: Test**
- [ ] Complete test purchase successful
- [ ] User tier updated correctly
- [ ] Unlimited analysis access working
- [ ] Webhook processing verified

### **Hour 3: Monitor**
- [ ] First real customer signup
- [ ] Revenue tracking operational
- [ ] Support documentation ready
- [ ] Growth metrics baseline established

---

## 🚨 Emergency Troubleshooting

### **Payment Not Working**
```bash
# Check Stripe webhook logs:
https://dashboard.stripe.com/webhooks/[webhook-id]

# Check Supabase function logs:
https://supabase.com/dashboard/project/[project]/functions
```

### **User Not Upgraded**
```sql
-- Manually upgrade user if needed:
UPDATE users 
SET tier = 'coffee', tier_expires_at = NOW() + INTERVAL '1 month'
WHERE email = 'customer@email.com';
```

### **Quick Rollback**
```bash
# Disable webhook temporarily:
# Go to Stripe Dashboard -> Webhooks -> Disable

# Revert to free analysis for all:
UPDATE users SET tier = 'free' WHERE tier = 'coffee';
```

---

## 🎉 You're Live!

Your Coffee tier is now **production-ready** and **revenue-generating**!

**Next 30 days focus:**
1. **Week 1**: Monitor and optimize conversion (target: 10-20 subscribers)
2. **Week 2**: Enhance user experience (target: 30-50 subscribers)  
3. **Week 3**: Add growth features (target: 60-100 subscribers)
4. **Week 4**: Plan Professional tier (target: 100+ subscribers)

**Expected outcome**: $500-1,500 MRR by end of Month 1 🚀☕