# AImpactScanner Production Deployment Checklist

## ✅ Completed Tasks

### User Experience Integration
- [x] **Tier indicator** added to main app header showing current tier and usage
- [x] **TierSelection component** integrated into main app navigation (Pricing tab)
- [x] **Upgrade prompts** implemented when free users hit 3-analysis limit
- [x] **UpgradeHandler** connected to main app flow
- [x] **Account/billing management** section added to main app (Account tab)

### Infrastructure & Security
- [x] **netlify.toml** configuration file created for deployment
- [x] **Webhook signature verification** implemented with proper HMAC-SHA256
- [x] **Production-ready security** headers and CORS configuration

## 📋 Remaining Tasks

### 1. Production Environment Setup

#### Switch to Live Stripe Keys
**Current State**: Using test keys (`pk_test_...`, `sk_test_...`)

**Required Actions**:
1. **Create live Stripe product**:
   - Go to Stripe Dashboard → Products
   - Switch to "Live mode" (toggle in top-left)
   - Create "AImpactScanner Coffee Tier" product ($5.00 USD Monthly)
   - Copy the live price ID (`price_1...`)

2. **Update environment variables**:
   
   **Frontend (.env.local for testing, Netlify for production)**:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_PUBLISHABLE_KEY"
   VITE_STRIPE_COFFEE_PRICE_ID="price_YOUR_LIVE_COFFEE_PRICE_ID"
   ```

   **Backend (Supabase Edge Functions → Settings → Secrets)**:
   ```bash
   STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_SECRET_KEY"
   STRIPE_WEBHOOK_SECRET="whsec_YOUR_LIVE_WEBHOOK_SECRET"
   ```

3. **Configure live webhook endpoint**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Create new endpoint: `https://www.aimpactscanner.com/.netlify/functions/stripe-webhook`
   - OR (if using Supabase): `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook secret (`whsec_...`) and add to Supabase secrets

4. **Redeploy Edge Functions** after updating secrets:
   ```bash
   npm run deploy:functions
   ```

### 2. Domain & Deployment Configuration

#### Netlify Setup
1. **Deploy to Netlify**:
   - Connect GitHub repository to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables in Netlify dashboard

2. **Environment Variables in Netlify**:
   ```
   VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   VITE_STRIPE_COFFEE_PRICE_ID=price_YOUR_LIVE_PRICE_ID
   ```

#### Domain Configuration (Namecheap → Netlify)
1. **Get Netlify site URL** after deployment (e.g., `amazing-site-123456.netlify.app`)

2. **Configure custom domain in Netlify**:
   - Go to Netlify Dashboard → Domain Settings
   - Add custom domain: `www.aimpactscanner.com`
   - Note the DNS targets provided by Netlify

3. **Update Namecheap DNS**:
   - Log into Namecheap account
   - Go to Domain List → Manage for aimpactscanner.com
   - Advanced DNS tab
   - Add CNAME record:
     ```
     Type: CNAME
     Host: www
     Value: [netlify-site-url] (e.g., amazing-site-123456.netlify.app)
     TTL: 30 min
     ```
   - Add redirect for apex domain:
     ```
     Type: URL Redirect
     Host: @
     Value: https://www.aimpactscanner.com
     TTL: 30 min
     ```

4. **SSL Certificate**: Netlify will auto-provision SSL certificate once DNS propagates

### 3. Testing & Validation

#### Pre-Production Testing Checklist
- [ ] **Local testing with live Stripe keys**:
  - Test coffee tier upgrade flow
  - Verify webhook processing
  - Check user tier updates in database

- [ ] **Deploy preview testing**:
  - Deploy to Netlify preview environment
  - Test complete user flow
  - Verify all components work correctly

#### Production Testing Checklist
- [ ] **Complete user journey**:
  - Sign up as new user
  - Perform 3 free analyses
  - Hit upgrade prompt on 4th attempt
  - Upgrade to coffee tier via Stripe checkout
  - Verify unlimited access after upgrade

- [ ] **Payment processing**:
  - Test with real credit card (small amount)
  - Verify webhook processing
  - Check database updates
  - Confirm email notifications

- [ ] **Edge cases**:
  - Failed payment handling
  - Subscription cancellation
  - Expired subscription behavior

### 4. Go-Live Process

1. **Final checks**:
   - All environment variables set correctly
   - Webhook endpoints pointing to production domain
   - DNS propagation complete (use `dig` or online DNS checker)
   - SSL certificate active

2. **Soft launch**:
   - Test with personal account first
   - Verify analytics and monitoring
   - Check error logging

3. **Public announcement**:
   - Update social media
   - Notify beta users
   - Monitor for any issues

## 🚨 Security Considerations

### Production Security Checklist
- [x] **Webhook signature verification** implemented and tested
- [x] **HTTPS enforcement** configured in netlify.toml
- [x] **Security headers** configured (HSTS, XSS protection, etc.)
- [ ] **Environment secrets** never committed to version control
- [ ] **Database RLS policies** tested and validated
- [ ] **Rate limiting** considered for API endpoints

### Monitoring & Alerts
- **Stripe Dashboard**: Monitor for failed payments and disputes
- **Supabase Logs**: Monitor Edge Function errors
- **Netlify Analytics**: Monitor site performance and errors
- **Google Analytics**: Track user behavior and conversions

## 📞 Support & Maintenance

### Post-Launch Monitoring
- Daily check of Stripe transactions
- Weekly review of user analytics
- Monthly performance optimization
- Quarterly security review

### Customer Support Process
- Set up support email (support@aimpactscanner.com)
- Create knowledge base for common issues
- Monitor user feedback and feature requests

---

**Status**: Ready for production deployment once live Stripe keys are configured and domain is set up.

**Estimated Time to Go Live**: 2-4 hours (mostly waiting for DNS propagation)