# Resend API Key Generation Guide

## Overview
This guide walks you through generating a Resend API key specifically for SMTP configuration with your AImpact Scanner application. This is a critical step that enables email delivery.

## Step-by-Step API Key Generation

### Step 1: Access Your Resend Account
1. Go to [https://resend.com/login](https://resend.com/login)
2. Log in with your existing Resend account credentials
3. You should see the Resend dashboard

### Step 2: Navigate to API Keys
1. In the left sidebar, click **"API Keys"**
2. You'll see a list of any existing API keys
3. Click the **"Create API Key"** button (usually blue button in top-right)

### Step 3: Configure Your SMTP API Key
When creating the API key, configure these settings:

**Basic Information:**
- **Name**: `AImpactScanner-SMTP-Production`
  - *This helps you identify the key's purpose later*
- **Permission**: Select **"Sending access"**
  - *This gives the key permission to send emails*

**Domain Restriction:**
- **Domain**: Select **"aimpactscanner.com"** from the dropdown
  - *This restricts the key to only send emails from your domain*
  - *If aimpactscanner.com doesn't appear, you need to add your domain first*

### Step 4: Generate and Secure the Key
1. Click **"Create"** to generate the API key
2. **CRITICAL**: The API key will be displayed only once
3. **Copy the key immediately** - it looks like: `re_AbCdEfGh_1234567890abcdef`
4. **Store it securely** - you'll need it for Supabase configuration

### Step 5: Verify Domain Status
Before using the API key, ensure your domain is properly configured:

1. In Resend dashboard, go to **"Domains"**
2. Find **aimpactscanner.com** in the list
3. Status should show **"Verified"** with green checkmark
4. If not verified, you need to complete DNS setup first

## API Key Security Best Practices

### Immediate Security Steps
- ✅ **Never commit to code repositories** - API keys should never be in your source code
- ✅ **Store in environment variables** - Use Supabase dashboard environment settings
- ✅ **Document the key purpose** - Note what this key is used for
- ✅ **Limit permissions** - Only give "Sending access" for SMTP usage

### Long-term Security Management
- 🔄 **Rotate keys quarterly** - Generate new keys every 3 months
- 📊 **Monitor usage** - Check Resend logs for unauthorized usage
- 🚨 **Revoke compromised keys** - Delete keys immediately if compromised
- 👥 **Separate keys by environment** - Use different keys for dev/staging/production

## Using the API Key

### For Supabase SMTP Configuration
Once you have your API key, use it in Supabase:

1. **Go to Supabase Dashboard** → Your Project → Authentication → Settings
2. **Scroll to SMTP Settings**
3. **Configure these values**:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465
   SMTP Username: resend
   SMTP Password: [YOUR_API_KEY_HERE]
   
   From Email: support@aimpactscanner.com
   From Name: AImpact Scanner
   ```

### Environment Variable Storage
If using environment variables, add to your `.env` file:
```bash
RESEND_API_KEY=re_AbCdEfGh_1234567890abcdef
```

**Important**: Never commit `.env` files to git repositories.

## Troubleshooting API Key Issues

### "Domain not verified" Error
**Problem**: API key created but domain shows as unverified
**Solution**: 
1. Complete DNS record setup in Netlify
2. Wait 15-30 minutes for DNS propagation
3. Return to Resend and verify domain status

### "Permission denied" Error
**Problem**: API key doesn't have proper permissions
**Solution**:
1. Check API key permissions in Resend dashboard
2. Ensure "Sending access" is enabled
3. Verify domain restriction allows aimpactscanner.com

### "Authentication failed" Error
**Problem**: API key not working in SMTP configuration
**Solution**:
1. Verify API key was copied correctly (no extra spaces)
2. Check that domain verification is complete
3. Try regenerating a new API key

### API Key Not Appearing in Dropdown
**Problem**: aimpactscanner.com doesn't appear when creating domain-restricted key
**Solution**:
1. First add domain in Resend → Domains → Add Domain
2. Complete DNS verification process
3. Return to API key creation after domain is verified

## API Key Management

### Multiple API Keys Strategy
Consider creating separate API keys for different purposes:
- **Production SMTP**: For live email delivery
- **Development SMTP**: For testing (can use different domain)
- **API Integration**: If you plan to use Resend API directly
- **Monitoring**: Read-only keys for analytics access

### Key Naming Convention
Use descriptive names to track key purposes:
- `AImpactScanner-SMTP-Production`
- `AImpactScanner-SMTP-Development`  
- `AImpactScanner-API-Integration`
- `AImpactScanner-Monitoring`

### Key Rotation Process
Quarterly key rotation procedure:
1. Generate new API key with same permissions
2. Update Supabase SMTP configuration with new key
3. Test email delivery with new key
4. Delete old API key from Resend dashboard
5. Update documentation with new key information

## Integration with AImpact Scanner

### Expected Email Volume
Based on your application usage:
- **MVP Phase**: 100-500 emails/month (well within free tier)
- **Growth Phase**: 1,000-10,000 emails/month ($20/month plan)
- **Scale Phase**: 50,000+ emails/month (volume pricing)

### Email Types Sent
Your API key will be used for:
- ✅ **Email verification** (new user signups)
- ✅ **Password reset** (forgot password flow)
- ✅ **Login notifications** (security alerts)
- ✅ **System notifications** (future features)

### Monitoring Usage
Track API key usage in Resend dashboard:
- **Delivery rates** (should be 99%+)
- **Bounce rates** (should be <1%)
- **Spam complaints** (should be <0.1%)
- **Monthly volume** (track against plan limits)

## Next Steps After API Key Creation

### Immediate Actions
1. ✅ **Secure the API key** - Store safely, never commit to code
2. ✅ **Configure SMTP** - Add to Supabase dashboard settings
3. ✅ **Test delivery** - Run email verification test
4. ✅ **Verify monitoring** - Check Resend dashboard for delivery logs

### Ongoing Management
1. 📊 **Monitor usage** - Weekly checks of delivery rates
2. 🔄 **Quarterly rotation** - Update API keys every 3 months
3. 📈 **Scale planning** - Monitor volume growth vs. plan limits
4. 🛡️ **Security review** - Regular audit of key permissions and usage

## Support and Resources

### Documentation
- **Resend API Docs**: [docs.resend.com](https://docs.resend.com)
- **SMTP Integration**: [docs.resend.com/api-reference/emails/send-email](https://docs.resend.com/api-reference/emails/send-email)
- **Domain Setup**: [docs.resend.com/domains/introduction](https://docs.resend.com/domains/introduction)

### Getting Help
- **Resend Support**: Available through dashboard chat
- **Community Forum**: [github.com/resendlabs/resend](https://github.com/resendlabs/resend)
- **Status Page**: [status.resend.com](https://status.resend.com)

### Related AImpact Scanner Guides
- **DNS Setup**: See `resend-domain-setup-guide.md`
- **SMTP Configuration**: See `resend-smtp-setup-guide.md`
- **Testing**: Run `node scripts/test-email-delivery.js`
- **Validation**: Run `node scripts/validate-smtp-config.js`

## Summary

Your Resend API key is the authentication credential that allows AImpact Scanner to send emails through Resend's SMTP service. Proper generation, storage, and management of this key is critical for reliable email delivery.

**Key Takeaways**:
- Generate domain-restricted API key with "Sending access" permissions
- Store securely in Supabase dashboard (never in code)
- Monitor usage and rotate quarterly for security
- Use the key for SMTP configuration in Supabase Authentication settings

Once you have your API key, you're ready to configure SMTP and enable professional email delivery for your application.