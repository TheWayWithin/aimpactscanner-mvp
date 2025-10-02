# Resend Domain Setup Guide for aimpactscanner.com

## Overview

This guide will walk you through adding your aimpactscanner.com domain to your existing Resend account. This is required before you can send verification emails from your AImpact Scanner application.

**Estimated Time**: 30-60 minutes (mostly waiting for DNS propagation)  
**Difficulty**: Beginner-friendly with step-by-step instructions  
**Prerequisites**: 
- Existing Resend account
- Access to your domain registrar (where you bought aimpactscanner.com)
- Admin access to DNS settings

---

## Step 1: Add Domain to Resend Account

### 1.1 Login to Resend Dashboard
1. Go to [https://resend.com/login](https://resend.com/login)
2. Sign in with your existing Resend account credentials
3. You should see your Resend dashboard

### 1.2 Navigate to Domains Section
1. In the left sidebar, click on **"Domains"**
2. Click the **"Add Domain"** button (usually blue/green button in top right)

### 1.3 Enter Your Domain
1. In the domain field, enter: `aimpactscanner.com`
2. Click **"Add Domain"** or **"Continue"**

**What happens next**: Resend will show you DNS records that need to be added to your domain.

---

## Step 2: Understanding DNS Records (Non-Technical Explanation)

Before we configure DNS, here's what these records do:

### SPF Record
- **Purpose**: Tells email providers "Resend is allowed to send emails for aimpactscanner.com"
- **Analogy**: Like giving Resend a business card that says they represent your company
- **Without it**: Your emails might go to spam

### DKIM Record  
- **Purpose**: Digital signature that proves emails actually came from Resend
- **Analogy**: Like a tamper-proof seal on an envelope
- **Without it**: Email providers can't verify authenticity

### DMARC Record
- **Purpose**: Instructions for what to do with emails that fail SPF/DKIM checks
- **Analogy**: Company policy on how to handle suspicious mail
- **Without it**: No protection against email spoofing

**Bottom Line**: These records make your emails legitimate and trusted by Gmail, Outlook, etc.

---

## Step 3: Get DNS Records from Resend

After adding your domain, Resend will show you DNS records. They'll look something like this:

### Example Records (Your actual values will be different):

```
Type: TXT
Name: aimpactscanner.com (or @)
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT  
Name: resend._domainkey.aimpactscanner.com
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... [long string]

Type: TXT
Name: _dmarc.aimpactscanner.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@resend.com
```

**IMPORTANT**: 
- Copy these EXACT values from your Resend dashboard
- Don't use the examples above - use YOUR specific records
- Keep this tab open while you configure DNS

---

## Step 4: Configure DNS Records

### 4.1 Access Your Domain DNS Settings

**Where to go depends on where you bought your domain:**

**Common Registrars:**
- **GoDaddy**: My Products → Domain → Manage → DNS
- **Namecheap**: Domain List → Manage → Advanced DNS  
- **Cloudflare**: Dashboard → Your Domain → DNS → Records
- **Google Domains**: My Domains → Your Domain → DNS
- **AWS Route 53**: Hosted Zones → Your Domain

**Can't find DNS settings?**
- Look for "DNS Management", "DNS Settings", or "Nameservers"
- Contact your domain registrar's support if needed

### 4.2 Add the SPF Record

1. **Click "Add Record" or similar button**
2. **Set these values**:
   - **Type**: TXT
   - **Name**: @ (or leave blank, or "aimpactscanner.com")
   - **Value**: `v=spf1 include:_spf.resend.com ~all`
   - **TTL**: 3600 (or use default)

3. **Click "Save" or "Add Record"**

**Common Issues:**
- If you have an existing SPF record, you need to modify it instead of adding a new one
- Existing SPF might look like: `v=spf1 include:_spf.google.com ~all`
- Update it to: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`

### 4.3 Add the DKIM Record

1. **Click "Add Record" again**
2. **Set these values**:
   - **Type**: TXT
   - **Name**: `resend._domainkey` (some registrars auto-add .aimpactscanner.com)
   - **Value**: [Copy the EXACT long value from Resend - starts with "p=MIG..."]
   - **TTL**: 3600 (or use default)

3. **Click "Save" or "Add Record"**

**Troubleshooting:**
- If "Name" field doesn't accept the underscore, try `resend._domainkey.aimpactscanner.com`
- Some registrars require the full domain name in the Name field

### 4.4 Add the DMARC Record

1. **Click "Add Record" again**
2. **Set these values**:
   - **Type**: TXT
   - **Name**: `_dmarc` (some registrars auto-add .aimpactscanner.com)
   - **Value**: `v=DMARC1; p=none; rua=mailto:dmarc@resend.com`
   - **TTL**: 3600 (or use default)

3. **Click "Save" or "Add Record"**

---

## Step 5: Verify Configuration

### 5.1 In Your DNS Provider
After adding all records, your DNS should show:
- 1 SPF record (TXT record for @ or domain root)
- 1 DKIM record (TXT record for resend._domainkey)  
- 1 DMARC record (TXT record for _dmarc)

### 5.2 In Resend Dashboard
1. Go back to your Resend dashboard
2. Navigate to **Domains** section
3. Find your aimpactscanner.com domain
4. Click **"Verify"** or **"Check DNS"**

**Expected Results:**
- ✅ SPF Record: Verified
- ✅ DKIM Record: Verified  
- ✅ DMARC Record: Verified

---

## Step 6: Troubleshooting DNS Issues

### 6.1 Common Problems

**"Records not found" after adding them:**
- **Wait 5-15 minutes** - DNS changes take time to propagate
- **Check TTL settings** - Lower TTL (like 300) propagates faster
- **Verify exact spelling** - DNS is case-sensitive and typo-sensitive

**SPF record conflicts:**
- You can only have ONE SPF record per domain
- If you have existing SPF, modify it to include Resend
- Example: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`

**DKIM verification fails:**
- **Check the Name field**: Try both `resend._domainkey` and `resend._domainkey.aimpactscanner.com`
- **Copy the entire value**: DKIM values are very long - make sure you copied everything
- **No quotes**: Don't add quotes around the value unless your DNS provider requires them

### 6.2 DNS Propagation Timeline

**Typical timelines:**
- **Immediate to 5 minutes**: Most modern DNS providers
- **15-30 minutes**: Common for many registrars
- **Up to 2 hours**: Some legacy systems
- **Up to 24-48 hours**: Worst case scenario

**How to check propagation:**
1. Use online DNS checker: [whatsmydns.net](https://www.whatsmydns.net)
2. Select "TXT" record type
3. Enter your domain: `aimpactscanner.com`
4. Look for your SPF record in results

### 6.3 Testing Tools

**Online DNS Lookup Tools:**
- [MXToolbox](https://mxtoolbox.com/TxtLookup.aspx): Check TXT records
- [DNS Checker](https://dnschecker.org/): Global propagation status
- [Google Admin Toolbox](https://toolbox.googleapps.com/apps/dig/): Detailed DNS lookup

**Command Line (if you're comfortable):**
```bash
# Check SPF record
dig TXT aimpactscanner.com

# Check DKIM record  
dig TXT resend._domainkey.aimpactscanner.com

# Check DMARC record
dig TXT _dmarc.aimpactscanner.com
```

---

## Step 7: Final Verification in Resend

### 7.1 Complete Domain Verification
1. **Wait for DNS propagation** (15-30 minutes typically)
2. **Return to Resend dashboard**
3. **Go to Domains section**
4. **Click "Verify" next to aimpactscanner.com**

### 7.2 Expected Success State
All records should show:
- ✅ **SPF**: Verified  
- ✅ **DKIM**: Verified
- ✅ **DMARC**: Verified
- ✅ **Domain Status**: Active/Verified

### 7.3 Generate API Key
1. **Go to API Keys section** in Resend dashboard
2. **Click "Create API Key"**
3. **Name it**: "AImpact Scanner SMTP"
4. **Copy the API key** - you'll need this for SMTP configuration
5. **Store it securely** - you can't see it again after closing the dialog

---

## Step 8: Test Domain Configuration

### 8.1 Send Test Email
1. **In Resend dashboard**, go to **"Send"** or **"Test"** section
2. **Create a test email**:
   - **From**: `support@aimpactscanner.com`
   - **To**: Your personal email
   - **Subject**: "Domain Test"
   - **Body**: "Testing aimpactscanner.com domain setup"
3. **Send the email**

### 8.2 Verify Delivery
1. **Check your personal email** (including spam folder)
2. **Email should arrive within 1-2 minutes**
3. **Check email headers** for authentication results:
   - Should show SPF: PASS
   - Should show DKIM: PASS

---

## Step 9: What's Next

### 9.1 You Now Have:
- ✅ **Domain verified** in Resend
- ✅ **SPF/DKIM/DMARC** configured
- ✅ **API key** for SMTP configuration
- ✅ **Professional email delivery** setup

### 9.2 Next Steps:
1. **Configure SMTP** in your Supabase project using:
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: [Your Resend API key]
   - **From Email**: `support@aimpactscanner.com`

2. **Test email verification** in your application
3. **Monitor delivery rates** in Resend dashboard

### 9.3 Monitoring
- **Resend dashboard** shows delivery analytics
- **Check bounce/complaint rates** regularly
- **Monitor domain reputation** for optimal delivery

---

## Troubleshooting Reference

### Common Error Messages

**"Domain already exists"**
- Someone else added this domain to Resend
- Contact Resend support to transfer domain ownership
- Verify you own the domain with them

**"SPF record validation failed"**
- Check for typos in the SPF record
- Ensure you have only ONE SPF record
- Wait longer for DNS propagation

**"DKIM signature not found"**
- Verify the DKIM record name exactly matches Resend's requirement
- Check that you copied the entire DKIM value
- Some DNS providers have character limits - contact support if needed

**"Domain verification timed out"**
- DNS propagation can take up to 48 hours
- Try verifying again after waiting
- Use DNS checking tools to confirm records are live

### Contact Information

**Resend Support:**
- Dashboard: Support chat bubble
- Email: support@resend.com
- Documentation: [resend.com/docs](https://resend.com/docs)

**DNS Provider Support:**
- Contact your domain registrar's support
- Most have live chat or ticket systems
- Have your domain name and account details ready

---

## Security Best Practices

### 9.1 API Key Security
- **Never commit API keys to code repositories**
- **Store in environment variables only**
- **Regenerate keys if compromised**
- **Use separate keys for development/production**

### 9.2 Email Security
- **Monitor delivery reports** for abuse
- **Set up DMARC policy** to protect against spoofing
- **Regularly review** who has access to your Resend account
- **Enable 2FA** on your Resend account

### 9.3 Domain Protection
- **Keep domain registration current** to prevent expiration
- **Use domain lock** to prevent unauthorized transfers
- **Monitor DNS changes** for unauthorized modifications

---

**Congratulations!** Once you complete these steps, your aimpactscanner.com domain will be fully configured for professional email delivery through Resend. Your email verification system will work reliably with 99%+ delivery rates.

**Questions?** Refer to the troubleshooting section above or contact Resend support through their dashboard.