# Resend SMTP Configuration Guide

## CRITICAL: Email Verification Fix

**Problem**: Email verification is enabled but no SMTP configured - users can't receive verification emails.

**Solution**: Configure Resend SMTP using your existing Resend account.

## Step 1: Get Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Navigate to **API Keys** section
3. Create a new API key with **Full Access** or **Send** permissions
4. Copy the API key (starts with `re_`)

## Step 2: Configure SMTP in Supabase Dashboard

### Option A: Supabase Dashboard (Recommended)

1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Settings** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure with these **EXACT** settings:

```
SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [YOUR_RESEND_API_KEY]
Sender Email: support@aimpactscanner.com
Sender Name: AImpact Scanner
```

### Option B: Local Configuration (Development)

If you need to test locally, uncomment and configure the SMTP section in `supabase/config.toml`:

```toml
# Uncomment and configure this section:
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "YOUR_RESEND_API_KEY"
admin_email = "support@aimpactscanner.com"
sender_name = "AImpact Scanner"
```

**IMPORTANT**: Never commit your API key to git. Use environment variables:
```toml
pass = "env(RESEND_API_KEY)"
```

## Step 3: Verify Domain (If Not Done Already)

1. In Resend dashboard, go to **Domains**
2. Add `aimpactscanner.com` if not already added
3. Configure DNS records as shown in Resend
4. Wait for verification (usually 24-48 hours max)

## Step 4: Test Email Delivery

After configuration, test with a real signup:

1. Go to your app's signup page
2. Register with a real email address
3. Check that verification email arrives
4. Verify email delivery in Resend dashboard analytics

## Step 5: Monitor and Optimize

- **Resend Analytics**: Check delivery rates in dashboard
- **Supabase Logs**: Monitor auth logs for email errors
- **User Feedback**: Ensure verification emails arrive in inbox (not spam)

## Troubleshooting

### Email Not Arriving
1. Check spam folder
2. Verify domain authentication in Resend
3. Check Resend dashboard for delivery status
4. Ensure API key has correct permissions

### SMTP Connection Errors
1. Verify API key is correct
2. Check port 465 is not blocked
3. Ensure `resend` is used as username (not your email)

### DNS Issues
1. Wait 24-48 hours for DNS propagation
2. Use DNS checker tools to verify records
3. Contact Resend support if verification fails

## Expected Results

After configuration:
- ✅ Users receive verification emails within 1-2 minutes
- ✅ 99%+ email delivery rate (Resend standard)
- ✅ Professional sender reputation
- ✅ Proper SPF/DKIM authentication
- ✅ Email verification flow works end-to-end

## Cost Impact

- **0-3,000 emails/month**: Free
- **3,000+ emails/month**: $20/month
- **Scaling**: $0.65 per 1,000 emails

## Security Notes

- API key provides full sending access - keep secure
- Use environment variables, never commit keys
- Monitor usage to prevent abuse
- Set up alerts for unusual sending patterns

---

**Next Step**: Provide your Resend API key to complete the SMTP configuration.