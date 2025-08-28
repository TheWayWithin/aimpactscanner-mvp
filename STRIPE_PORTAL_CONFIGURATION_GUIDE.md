# Stripe Customer Portal Configuration Guide

## Overview
The Stripe Customer Portal allows your customers to manage their subscriptions, update payment methods, download invoices, and cancel subscriptions without contacting support.

## Current Implementation Status
✅ **Edge Function Created**: `create-portal-session` is deployed and ready
✅ **Frontend Integration**: AccountDashboard.jsx has the "Manage Subscription" button
✅ **Environment Variables**: STRIPE_SECRET_KEY is configured
⚠️ **Portal Configuration**: Needs to be set up in Stripe Dashboard

## Step-by-Step Configuration

### 1. Access Stripe Customer Portal Settings
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Billing** → **Customer portal**
3. Or use direct link: https://dashboard.stripe.com/settings/billing/portal

### 2. Configure Portal Settings

#### Basic Settings
- **Portal Link**: Enable the customer portal
- **Default redirect link**: Set to `https://aimpactscanner.com/account`

#### Products Section
- ✅ **Subscriptions**: Allow customers to view
- ✅ **Cancel subscriptions**: Enable with confirmation
- ✅ **Pause subscriptions**: Optional (recommended: disabled for simplicity)
- ✅ **Switch plans**: Enable if you want upgrade/downgrade options

#### Business Information
- **Business name**: AImpactScanner
- **Support email**: Your support email
- **Support phone**: Optional
- **Support URL**: https://aimpactscanner.com/support
- **Privacy policy**: https://aimpactscanner.com/privacy
- **Terms of service**: https://aimpactscanner.com/terms

#### Features to Enable
1. **Customer can update subscriptions**
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ Switch pricing plans (if you have multiple)

2. **Customer can update billing**
   - ✅ Update payment methods
   - ✅ View billing history
   - ✅ Download invoices

3. **Customer information**
   - ✅ Update email address
   - ✅ Update billing address
   - ✅ Update tax ID

### 3. Cancellation Settings
Configure what happens when customers cancel:

1. **Cancellation flow**:
   - **Immediate vs End of Period**: Choose "Cancel at period end" (recommended)
   - **Cancellation reason**: Enable collection (helps understand churn)
   - **Offer discount**: Optional retention offer

2. **Confirmation page**:
   - Add custom message: "Your subscription will remain active until [end date]. You can reactivate anytime before then."

### 4. Branding Customization
1. **Colors**:
   - Primary color: #2563EB (Blue matching your brand)
   - Accent color: #3B82F6
   - Background: #FFFFFF

2. **Logo**: Upload your AImpactScanner logo

3. **Custom CSS** (optional):
```css
/* Optional custom styling */
.CustomerPortal {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### 5. Save Configuration
1. Click **Save** at the bottom of the page
2. Note the configuration ID if shown (optional for multiple configs)

### 6. Test the Portal
1. Go to your app at https://aimpactscanner.com
2. Sign in with a test account that has an active subscription
3. Navigate to Account Dashboard
4. Click "Manage Subscription"
5. Verify you're redirected to the Stripe Customer Portal
6. Test these functions:
   - View subscription details
   - Update payment method
   - Download invoice
   - Cancel subscription (use test account!)

## Optional: Multiple Portal Configurations

If you want different portal experiences for different customer segments:

1. Create additional configurations in Stripe Dashboard
2. Note the configuration IDs
3. Add to Edge Function environment:
```bash
supabase secrets set STRIPE_PORTAL_CONFIGURATION_ID=bpc_1234567890abcdef
```

4. The Edge Function already supports this (see line 73-76 in create-portal-session/index.ts)

## Troubleshooting

### Common Issues

1. **"No active subscription found"**
   - Ensure the user has a `stripe_customer_id` in the database
   - Check that the subscription is active in Stripe

2. **Portal doesn't open**
   - Verify STRIPE_SECRET_KEY is correct
   - Check Edge Function logs: `supabase functions logs create-portal-session`

3. **Wrong redirect after portal**
   - Update the default redirect link in Stripe settings
   - Pass correct `returnUrl` from frontend

### Debug Commands
```bash
# Check Edge Function deployment
supabase functions list

# View recent logs
supabase functions logs create-portal-session

# Test directly (replace with actual values)
curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/create-portal-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"returnUrl": "https://aimpactscanner.com/account"}'
```

## Security Considerations

1. **Authentication**: Portal sessions are tied to the authenticated user
2. **Customer Verification**: Stripe handles email verification
3. **Session Expiry**: Portal links expire after 24 hours
4. **Audit Trail**: All changes are logged in Stripe

## Next Steps

After configuration:
1. ✅ Test with a real subscription
2. ✅ Update your documentation
3. ✅ Add portal link to confirmation emails
4. ✅ Monitor usage in Stripe Dashboard

## Support Resources

- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Portal Configuration API](https://stripe.com/docs/api/customer_portal/configuration)
- [Best Practices Guide](https://stripe.com/docs/billing/subscriptions/customer-portal/best-practices)