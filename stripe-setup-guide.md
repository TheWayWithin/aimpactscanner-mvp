# Stripe Live Key Setup Guide - Revenue Activation
## 15 Minutes to Revenue Generation - AImpactScanner

---

## 🎯 **Pre-Setup Checklist**

Before starting, ensure you have:
- [ ] Admin access to your Stripe account
- [ ] Admin access to Supabase project
- [ ] Local development environment running
- [ ] Test credit card ready for verification
- [ ] Backup of current .env.local file

**Current Status**: Platform revenue-ready, test keys working, awaiting live key deployment

---

## 📋 **Step 1: Stripe Dashboard - Locate Live Keys** (3 minutes)

### **1.1 Navigate to Live Keys**
1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. **CRITICAL**: Toggle from "Test Data" to "Live Data" (top left corner)
3. Navigate to **Developers → API Keys**
4. You should see "Live" mode indicator in the interface

### **1.2 Copy Required Keys**
**Copy these keys (keep them secure):**

#### **Publishable Key** (starts with `pk_live_`)
- Copy the "Publishable key" - this goes in your frontend
- Example format: `pk_live_51Abc...xyz`

#### **Secret Key** (starts with `sk_live_`)  
- Click "Reveal live key token" for Secret key
- Copy the complete secret key - this goes in Supabase
- Example format: `sk_live_51Abc...xyz`

### **1.3 Locate Coffee Tier Price ID**
1. Navigate to **Products → Coffee Tier** (or your $5/month product)
2. Copy the **Live Price ID** (starts with `price_`)
3. Example format: `price_1Abc...xyz`

---

## 🔧 **Step 2: Frontend Configuration** (3 minutes)

### **2.1 Update .env.local**
1. Open `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/.env.local`
2. **Backup current file first!**
3. Update these values:

```bash
# LIVE STRIPE KEYS (Replace test keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PRICE_ID_COFFEE=price_YOUR_LIVE_PRICE_ID_HERE

# Keep these unchanged
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **2.2 Restart Development Server**
```bash
# Stop current server (Ctrl+C)
# Restart to load new environment variables
npm run dev
```

**Verification**: Check browser console - no Stripe-related errors should appear

---

## ⚙️ **Step 3: Supabase Backend Configuration** (4 minutes)

### **3.1 Set Environment Variables**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your AImpactScanner project
3. Navigate to **Settings → Environment Variables**

### **3.2 Update/Add Required Variables**
Set these environment variables:

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Note**: If STRIPE_WEBHOOK_SECRET doesn't exist yet, we'll add it in Step 4

### **3.3 Deploy Environment Variables**
1. Click **Save** after adding variables
2. Environment variables are immediately available to Edge Functions
3. No restart required for Supabase services

---

## 🔗 **Step 4: Webhook Configuration** (3 minutes)

### **4.1 Configure Live Webhook Endpoint**
1. In Stripe Dashboard (Live mode), go to **Developers → Webhooks**
2. Click **Add endpoint** (or edit existing if you have one)

### **4.2 Webhook Settings**
```
Endpoint URL: https://your-project-id.supabase.co/functions/v1/stripe-webhook
Description: AImpactScanner Live Payments
```

### **4.3 Select Events**
Select these events (critical for subscription handling):
- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`

### **4.4 Get Webhook Signing Secret**
1. After creating webhook, click on it
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add this to Supabase environment variables:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET_HERE
```

---

## ✅ **Step 5: Test Live Payment Flow** (2 minutes)

### **5.1 End-to-End Test**
1. Go to your live site: [aimpactscanner.com](https://aimpactscanner.com)
2. Create new account (or use existing test account)
3. Use all 3 free analyses to trigger upgrade prompt
4. Click "Buy me a coffee" button

### **5.2 Complete Real Payment**
1. Use **real credit card** (not test card numbers!)
2. Complete Stripe checkout process
3. **Verify immediate tier upgrade** in your app
4. **Check unlimited analysis access** works

### **5.3 Verify in Stripe Dashboard**
1. Go to Stripe Dashboard → Payments (Live mode)
2. **Confirm payment appears** with $5.00 amount
3. **Check customer subscription** is active
4. **Verify webhook events** were received successfully

---

## 📊 **Step 6: Monitoring & Verification** (Ongoing)

### **6.1 Success Indicators** ✅
- [ ] Real payment processed successfully
- [ ] User tier upgraded from Free to Coffee
- [ ] Unlimited analysis access activated
- [ ] Stripe Dashboard shows live transaction
- [ ] No errors in browser console or Supabase logs

### **6.2 First 24 Hours Monitoring**
- **Stripe Dashboard**: Check every 2-4 hours for new payments
- **Supabase Logs**: Monitor Edge Function execution
- **App Analytics**: Watch conversion rates and user behavior
- **Support Queue**: Be ready for user questions

### **6.3 Critical Metrics to Track**
- **First Payment**: Target within 24-48 hours
- **Conversion Rate**: Maintain >15% free-to-paid
- **Payment Success Rate**: Target >95%
- **User Experience**: No payment flow errors

---

## 🚨 **Rollback Procedure** (Emergency Only)

### **If Issues Occur:**

#### **Quick Rollback to Test Mode**
1. **Frontend**: Restore original .env.local with test keys
2. **Backend**: Change Supabase STRIPE_SECRET_KEY back to test key
3. **Restart**: `npm run dev` to reload environment variables

#### **Emergency Contact Info**
- **Stripe Support**: Available in dashboard chat
- **Supabase Support**: Available in project dashboard
- **Backup Plan**: Test keys always work for verification

### **Common Issues & Solutions**
- **"Invalid API key"**: Check live vs test mode consistency
- **"No such price"**: Verify live price ID matches your product
- **Webhook failures**: Check endpoint URL and signing secret
- **Payment not completing**: Verify all webhook events are selected

---

## 💰 **Post-Activation Success Plan**

### **Immediate Actions (Next 24 hours)**
1. **Monitor First Transactions**: Watch Stripe dashboard closely
2. **Test User Journey**: Ensure new users can complete payment flow
3. **Document Issues**: Note any user experience friction
4. **Prepare Support**: Be ready to help first paying customers

### **Week 1 Optimization**
1. **Analyze Conversion Data**: Identify optimization opportunities
2. **User Feedback**: Collect feedback on payment experience
3. **Performance Tuning**: Optimize based on real user behavior
4. **Marketing Activation**: Begin customer acquisition with working payment flow

### **Success Milestones**
- **Day 1**: First real payment processed ✅
- **Week 1**: $50+ in revenue with multiple customers
- **Month 1**: $500-1,000 MRR target achievement
- **Ongoing**: 20%+ month-over-month growth

---

## 🎯 **Revenue Activation Summary**

### **What You're Activating:**
- **Real Revenue Generation**: $5/month Coffee tier subscriptions  
- **Unlimited Analysis Access**: For paying customers
- **Professional Customer Experience**: Production-quality payment flow
- **Business Analytics**: Real conversion and revenue data

### **Expected Timeline:**
- **Setup**: 15 minutes for key deployment
- **First Test Payment**: 2 minutes to verify
- **First Real Customer**: 24-48 hours (typical)
- **Revenue Momentum**: 1-2 weeks to establish

### **Business Impact:**
- **Immediate**: Transform from demo to revenue-generating business
- **Short-term**: Validate product-market fit with real customers
- **Long-term**: Foundation for scaling to Professional and Enterprise tiers

---

**🚀 YOU'RE NOW READY TO ACTIVATE LIVE REVENUE GENERATION!**

*Follow these steps carefully, test thoroughly, and you'll have real customers paying for your AI optimization platform within 24-48 hours.*