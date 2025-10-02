# DNS Verification Checklist & Troubleshooting

**Purpose**: Comprehensive checklist to verify DNS records are properly configured and troubleshoot propagation issues.

## Pre-Verification Checklist

### Before Starting DNS Configuration
- [ ] Resend account access confirmed
- [ ] Domain `aimpactscanner.com` added to Resend
- [ ] DNS record values copied from Resend dashboard
- [ ] Netlify DNS panel access confirmed
- [ ] Current DNS records backed up (if needed)

### Required DNS Records from Resend
- [ ] **SPF Record**: `v=spf1 include:_spf.resend.com ~all`
- [ ] **DKIM Record**: Unique key from Resend (starts with `v=DKIM1`)
- [ ] **DMARC Record**: Optional enhancement with RUA parameter

---

## DNS Configuration Verification

### Step 1: Netlify DNS Panel Verification
After adding each record, confirm in Netlify DNS panel:

#### SPF Record Check
- [ ] **Type**: TXT
- [ ] **Name**: `@` (root domain)
- [ ] **Value**: `v=spf1 include:_spf.resend.com ~all`
- [ ] **Status**: Saved successfully
- [ ] **Visible**: Appears in DNS records list

#### DKIM Record Check  
- [ ] **Type**: TXT
- [ ] **Name**: Exact selector from Resend (e.g., `re12345._domainkey`)
- [ ] **Value**: Complete DKIM key from Resend
- [ ] **Status**: Saved successfully
- [ ] **Visible**: Appears in DNS records list

#### DMARC Record Check (Optional)
- [ ] **Type**: TXT
- [ ] **Name**: `_dmarc`
- [ ] **Value**: `v=DMARC1; p=none; rua=mailto:dmarc@resend.com`
- [ ] **Status**: Saved successfully
- [ ] **Visible**: Appears in DNS records list

### Step 2: Initial DNS Verification (5-10 minutes)
Check if records are immediately visible:

```bash
# Quick DNS check (if you have dig command)
dig TXT aimpactscanner.com | grep spf
dig TXT _dmarc.aimpactscanner.com
```

**Expected Results**:
- [ ] SPF record appears in dig output
- [ ] DMARC record appears (if configured)
- [ ] No error messages in DNS queries

---

## DNS Propagation Monitoring

### Timeline Expectations
- **0-5 minutes**: Records appear in Netlify DNS panel
- **5-15 minutes**: Records begin appearing in DNS checkers
- **15-30 minutes**: Global propagation mostly complete
- **30-60 minutes**: All regions should show new records
- **1-2 hours**: Maximum time for complete propagation

### Step 3: Online DNS Propagation Check (15 minutes after adding)

#### Using whatsmydns.net
1. Go to https://whatsmydns.net
2. Enter domain: `aimpactscanner.com`
3. Select record type: **TXT**
4. Click **Search**

**SPF Record Verification**:
- [ ] Green checkmarks appear across multiple regions
- [ ] Record value shows: `v=spf1 include:_spf.resend.com ~all`
- [ ] No red X marks in major regions (US, Europe, Asia)

**DKIM Record Verification**:
1. Change hostname to: `[dkim-selector].aimpactscanner.com`
2. Keep record type: **TXT**
3. Click **Search**

- [ ] Green checkmarks appear for DKIM record
- [ ] Record value shows complete DKIM key
- [ ] Propagation visible globally

**DMARC Record Verification**:
1. Change hostname to: `_dmarc.aimpactscanner.com`
2. Keep record type: **TXT**
3. Click **Search**

- [ ] Green checkmarks appear for DMARC record
- [ ] Record value shows DMARC policy
- [ ] Global propagation confirmed

### Step 4: Alternative DNS Checkers (For Confirmation)

#### Using DNS Checker (dnschecker.org)
1. Go to https://dnschecker.org
2. Enter domain: `aimpactscanner.com`
3. Select: **TXT Record**
4. Click **Search**

- [ ] Results show across multiple global locations
- [ ] SPF record visible in results
- [ ] All major regions show consistent results

#### Using MXToolbox
1. Go to https://mxtoolbox.com/TxtLookup.aspx
2. Enter: `aimpactscanner.com`
3. Click **TXT Lookup**

- [ ] SPF record appears in results
- [ ] No errors or warnings shown
- [ ] Record format validated as correct

---

## Resend Dashboard Verification

### Step 5: Resend Domain Verification (After DNS Propagation)

#### Access Resend Verification
1. Login to Resend dashboard
2. Navigate to **Domains** section
3. Find `aimpactscanner.com`
4. Look for verification status indicators

#### Manual Verification Trigger
For each DNS record:
- [ ] Click **"Verify"** button for SPF record
- [ ] Click **"Verify"** button for DKIM record  
- [ ] Click **"Verify"** button for DMARC record (if configured)

#### Expected Verification Results
- [ ] **SPF Status**: ✅ Verified (green checkmark)
- [ ] **DKIM Status**: ✅ Verified (green checkmark)
- [ ] **DMARC Status**: ✅ Verified (green checkmark, if configured)
- [ ] **Domain Status**: "Active" or "Verified"
- [ ] **API Key Generation**: Now available/enabled

### Step 6: API Key Generation Availability
After all records verified:
- [ ] **API Keys** section accessible
- [ ] **"Create API Key"** button enabled
- [ ] Domain appears in API key domain dropdown
- [ ] No "domain not visible" errors

---

## Troubleshooting Common Issues

### Issue 1: Records Not Appearing in DNS Checkers

**Possible Causes**:
- DNS propagation still in progress
- Record not saved properly in Netlify
- Incorrect record values
- Netlify DNS sync delays

**Troubleshooting Steps**:
1. **Wait Longer** (up to 2 hours for complete propagation)
2. **Check Netlify Panel**: Verify records are still there
3. **Re-save Records**: Edit and save again in Netlify
4. **Clear DNS Cache**: Use `ipconfig /flushdns` on Windows or `sudo dscacheutil -flushcache` on Mac
5. **Try Different DNS Checker**: Different services may show different results

**Resolution Checklist**:
- [ ] Waited at least 30 minutes after adding records
- [ ] Verified records exist in Netlify DNS panel
- [ ] Checked multiple DNS checker services
- [ ] Confirmed record values are exact matches from Resend

### Issue 2: DKIM Record Verification Fails

**Possible Causes**:
- DKIM selector name incorrect
- DKIM value truncated or malformed
- DNS character limits exceeded
- Copy-paste errors

**Troubleshooting Steps**:
1. **Double-check DKIM selector**: Must match exactly from Resend
2. **Verify complete DKIM value**: Should start with `v=DKIM1; k=rsa; p=`
3. **Check for truncation**: DKIM values are very long, ensure complete
4. **Re-copy from Resend**: Copy again from Resend dashboard

**DKIM Validation Checklist**:
- [ ] DKIM selector name copied exactly from Resend
- [ ] DKIM value is complete (several hundred characters)
- [ ] No extra spaces or line breaks in value
- [ ] Record saved successfully in Netlify

### Issue 3: SPF Record Conflicts

**Possible Causes**:
- Existing SPF record already present
- Multiple SPF records (not allowed)
- Incorrect SPF syntax

**Troubleshooting Steps**:
1. **Check for existing SPF**: Look for other TXT records with `v=spf1`
2. **Merge SPF records**: Combine into single record if multiple exist
3. **Use SPF include**: Add `include:_spf.resend.com` to existing SPF
4. **Validate SPF syntax**: Use SPF checker tools

**SPF Resolution Options**:

**Option A: No existing SPF record**
- [ ] Add new SPF record: `v=spf1 include:_spf.resend.com ~all`

**Option B: Existing SPF record**
- [ ] Edit existing SPF to include: `include:_spf.resend.com`
- [ ] Example: `v=spf1 include:_spf.resend.com include:_spf.google.com ~all`

### Issue 4: DNS Propagation Delays

**Expected vs Actual Timeline**:
- **Normal**: 15-30 minutes for most regions
- **Delayed**: 1-2 hours for complete global propagation
- **Slow**: Up to 24 hours in rare cases

**Factors Affecting Propagation Speed**:
- TTL values (Time To Live)
- Geographic location
- DNS resolver caching
- Internet service provider delays

**Acceleration Strategies**:
1. **Lower TTL**: Change TTL to 300 seconds (5 minutes) if possible
2. **Use Different Resolvers**: Try Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)
3. **Clear Local Cache**: Flush DNS cache on your device
4. **Check Multiple Locations**: Use global DNS checkers

**Patience Checklist**:
- [ ] Waited at least 1 hour after DNS configuration
- [ ] Checked propagation in multiple global regions
- [ ] Verified records using different DNS checker services
- [ ] Confirmed no errors in DNS configuration

### Issue 5: Resend Verification Still Fails

**When DNS Shows Propagated but Resend Can't Verify**:

**Additional Wait Time**:
- [ ] Wait another 30 minutes after DNS propagation
- [ ] Resend may have additional caching delays
- [ ] Try verification again every 15 minutes

**Manual Verification**:
1. **Copy DNS Query Results**: From whatsmydns.net or similar
2. **Contact Resend Support**: Provide DNS propagation evidence
3. **Check Resend Status**: Verify no service issues at Resend

**Alternative Verification Methods**:
- [ ] Use command line DNS tools to verify
- [ ] Check with multiple DNS checker services
- [ ] Provide screenshots to Resend support if needed

---

## Verification Success Criteria

### Complete Success Checklist
- [ ] **All DNS records configured** in Netlify DNS panel
- [ ] **Global DNS propagation confirmed** via multiple checkers
- [ ] **All records verified** in Resend dashboard
- [ ] **Domain status "Active"** in Resend
- [ ] **API key generation available**
- [ ] **Test email delivery working**

### Ready for Next Steps
When all items above are checked:
- [ ] Generate Resend API key
- [ ] Configure SMTP in Supabase
- [ ] Test complete email verification flow
- [ ] Monitor email delivery performance

---

## Timeline Summary

### Typical Success Timeline
- **0-10 minutes**: DNS configuration in Netlify
- **15-30 minutes**: DNS propagation globally
- **30-45 minutes**: Resend verification complete
- **45-60 minutes**: API key generated and SMTP configured
- **Total**: 1 hour for complete setup

### Delayed Timeline (If Issues Occur)
- **0-10 minutes**: DNS configuration
- **30-120 minutes**: Extended DNS propagation
- **2-3 hours**: Resend verification complete
- **Total**: 2-3 hours with troubleshooting

### Emergency Workaround
If DNS verification is severely delayed:
- **Temporary Solution**: Disable email verification in Supabase
- **Quick Fix**: Set `enable_confirmations = false`
- **Restore July Functionality**: Immediate user access
- **Configure SMTP Later**: Complete DNS setup when propagation resolves

---

## Contact Information for Support

### Netlify DNS Support
- **Dashboard**: Support chat in Netlify dashboard
- **Community**: Netlify Community Forum
- **Documentation**: Netlify DNS management docs

### Resend Support
- **Email**: support@resend.com
- **Dashboard**: Support chat in Resend dashboard
- **Documentation**: Resend domain verification guides

### DNS Troubleshooting Resources
- **whatsmydns.net**: Global DNS propagation checker
- **dnschecker.org**: Alternative DNS verification
- **mxtoolbox.com**: Email authentication validators
- **dig web interface**: Online DNS lookup tools

**CRITICAL**: Complete this verification checklist step-by-step. Don't proceed to API key generation until ALL DNS records show as verified in Resend dashboard. Rushing this process will result in "domain not visible" errors.