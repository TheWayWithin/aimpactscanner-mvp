# Production SMTP Setup Guide

## Overview
The sign-up flow has been fixed locally by enabling email confirmations in `supabase/config.toml`. However, production requires SMTP configuration to send magic link emails.

## Local vs Production

### Local Development (WORKING)
- Uses inbucket for email testing
- Emails visible at: http://localhost:54324
- No external SMTP required
- Configuration: Already working

### Production (ACTION REQUIRED)
- Requires external SMTP provider
- Must be configured in Supabase dashboard
- Cannot use inbucket (local testing only)

## Required Actions for Production

### 1. Choose SMTP Provider
Recommended options:
- **SendGrid** - Reliable, generous free tier (100 emails/day)
- **Postmark** - Excellent deliverability, transactional focus
- **AWS SES** - Cost-effective for high volume
- **Mailgun** - Good balance of features and pricing

### 2. Configure SMTP in Supabase Dashboard

Navigate to: Supabase Dashboard → Project Settings → Authentication → Email Settings

**Required Settings**:
```
SMTP Host: smtp.sendgrid.net (or your provider)
SMTP Port: 587
SMTP User: apikey (for SendGrid) or your username
SMTP Password: [Your API key/password]
Sender Email: noreply@yourdomain.com
Sender Name: AI Impact Scanner
```

### 3. Verify Email Domain (if required)

Some providers (like SendGrid) require domain verification:
1. Add DNS records (SPF, DKIM) as provided by your SMTP provider
2. Verify domain ownership
3. Wait for DNS propagation (up to 48 hours)

### 4. Update Email Rate Limits

Current local config: 10 emails/hour (for testing)

Production recommendations:
- **Low traffic** (< 100 signups/day): 50 emails/hour
- **Medium traffic** (100-1000 signups/day): 200 emails/hour
- **High traffic** (1000+ signups/day): 500+ emails/hour

Configure in Supabase Dashboard → Settings → Rate Limits

### 5. Test Production Email Flow

After SMTP configuration:

1. **Test Sign-Up**:
   - Go to production site
   - Click "Continue with Email"
   - Enter test email address
   - Check email inbox for magic link

2. **Verify Email Delivery**:
   - Check email arrives within 1-2 minutes
   - Verify sender name and email correct
   - Test magic link works
   - Confirm user created in database

3. **Monitor SMTP Logs**:
   - Check Supabase logs for email sending
   - Monitor SMTP provider dashboard for delivery rates
   - Watch for bounces or spam complaints

## Troubleshooting

### Email Not Received

**Check:**
1. Spam folder (magic link emails often flagged)
2. SMTP credentials correct in Supabase
3. Email rate limits not exceeded
4. Domain verified (if required by provider)
5. Supabase logs for error messages

**Common Issues:**
- Invalid SMTP credentials → Check API key/password
- Rate limit exceeded → Increase limits or wait
- Domain not verified → Complete verification process
- Blocked by recipient → Check spam folder

### Email Marked as Spam

**Solutions:**
1. Configure SPF, DKIM, and DMARC records
2. Use authenticated domain (not generic email)
3. Warm up new SMTP account gradually
4. Monitor deliverability metrics

### Performance Issues

**Optimize:**
1. Use transactional email provider (not marketing)
2. Enable connection pooling if available
3. Monitor queue depth in SMTP provider
4. Consider dedicated IP for high volume

## Security Considerations

1. **API Keys**: Store in Supabase dashboard (encrypted), never in code
2. **Rate Limiting**: Prevent abuse and email bombing
3. **Email Validation**: Verify email format before sending
4. **Domain Authentication**: SPF/DKIM prevents spoofing
5. **Monitor Bounces**: Remove invalid emails from system

## Cost Estimates

### SendGrid (Free Tier)
- 100 emails/day free
- $19.95/month for 50,000 emails/month
- Good for early stage

### Postmark
- $15/month for 10,000 emails
- $1.25 per 1,000 after that
- Excellent deliverability

### AWS SES
- $0.10 per 1,000 emails
- Most cost-effective at scale
- Requires more setup

## Monitoring & Maintenance

### Key Metrics to Track
1. Email delivery rate (should be > 95%)
2. Bounce rate (should be < 2%)
3. Complaint rate (should be < 0.1%)
4. Average delivery time (should be < 2 minutes)

### Regular Checks
- Weekly: Review delivery metrics
- Monthly: Audit rate limits and usage
- Quarterly: Review SMTP provider costs
- As needed: Update email templates

## Testing Checklist

Before going live:
- [ ] SMTP configured in Supabase dashboard
- [ ] Domain verified (if required)
- [ ] Test email sent and received
- [ ] Magic link works end-to-end
- [ ] User created in database after confirmation
- [ ] Email appears professional (not spam)
- [ ] Rate limits appropriate for traffic
- [ ] Monitoring/logging configured
- [ ] Bounce handling configured

## Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **SendGrid Setup**: https://docs.sendgrid.com/for-developers/sending-email/supabase
- **Postmark Setup**: https://postmarkapp.com/support/article/1094-supabase
- **AWS SES Setup**: https://docs.aws.amazon.com/ses/

---

**Created**: October 8, 2025
**Status**: Local fix complete, production setup pending
**Priority**: HIGH - Required for email-based signups
