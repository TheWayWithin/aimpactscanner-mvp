# GTM Configuration Guide for AImpactScanner

## Container Information
- **Container ID**: GTM-WCQGG5N6
- **GA4 Property**: G-EJ5M874QBZ
- **Dashboard**: https://tagmanager.google.com

## URGENT FIX REQUIRED: Enzuzo Configuration

### Current Issue
- **Error**: "more than one cookie banner was attempted to be loaded"
- **Impact**: GDPR non-compliance, privacy widget showing incorrectly
- **Root Cause**: Duplicate or misconfigured Enzuzo tags in GTM

### Step-by-Step Fix Instructions

#### 1. Access GTM Dashboard
1. Go to https://tagmanager.google.com
2. Sign in with your Google account
3. Select container: **GTM-WCQGG5N6**

#### 2. Audit Enzuzo Tags
1. Click on "Tags" in the left sidebar
2. Search for "Enzuzo" in the search bar
3. Identify all Enzuzo-related tags
4. Check for duplicates or multiple instances

#### 3. Remove Duplicate Tags
If you find multiple Enzuzo tags:
1. Keep only ONE main Enzuzo tag
2. Click on duplicate tags → Actions → Delete
3. Document which tags were removed

#### 4. Configure the Main Enzuzo Tag

Click on the main Enzuzo tag and configure:

##### Trigger Settings
- **Trigger**: All Pages
- **Firing Priority**: 1 (fire early)

##### Enzuzo Configuration
```javascript
// Expected configuration in tag
{
  "domain_id": "d7ac73b6-7c38-11f0-9bf3-a7c11342cf5c",
  "settings": {
    "cookie_consent_banner": true,
    "auto_blocking": true,
    "privacy_policy_widget": false,
    "terms_widget": false,
    "cookie_declaration": false
  }
}
```

##### Features to ENABLE ✅
- Cookie Consent Banner
- Auto-blocking of scripts (for GDPR compliance)
- Google Consent Mode integration

##### Features to DISABLE ❌
- Privacy Policy Widget (we have our own footer)
- Terms of Service Widget
- Cookie Declaration Widget
- Any duplicate consent mechanisms

#### 5. Test in Preview Mode
1. Click "Preview" button in GTM
2. Enter your website URL
3. Check that:
   - Cookie consent banner appears
   - No privacy widget at page bottom
   - No console errors about duplicate banners

#### 6. Publish Changes
1. Click "Submit" button
2. Add version name: "Fix Enzuzo duplicate banner issue"
3. Add description: "Removed duplicate Enzuzo tags, disabled privacy widget"
4. Click "Publish"

### Post-Deployment Verification

#### Browser Testing
1. Clear all cookies and cache
2. Visit site in incognito/private mode
3. Verify:
   - [ ] Cookie consent banner appears on first visit
   - [ ] No privacy policy widget at bottom
   - [ ] Console shows no Enzuzo errors
   - [ ] GTM loads successfully

#### Console Checks
Open browser console (F12) and verify:
- No error: "[enzuzo] more than one cookie banner was attempted to be loaded"
- GTM initialized: "🏷️ Google Tag Manager initialized with consent mode: GTM-WCQGG5N6"
- No duplicate Enzuzo initialization messages

### Troubleshooting

#### If cookie banner doesn't appear:
1. Check Enzuzo tag is enabled in GTM
2. Verify trigger is set to "All Pages"
3. Check Enzuzo domain ID matches: d7ac73b6-7c38-11f0-9bf3-a7c11342cf5c

#### If privacy widget still appears:
1. Return to GTM and check Enzuzo configuration
2. Ensure privacy_policy_widget is set to false
3. Check for other tags that might load Enzuzo

#### If duplicate banner error persists:
1. Look for Enzuzo scripts in:
   - Other GTM tags
   - Custom HTML tags
   - Third-party integrations
2. Remove all but one Enzuzo implementation

### Recommended GTM Tag Structure

After cleanup, your GTM container should have:
- **1x Enzuzo Cookie Consent Tag** (configured as above)
- **1x Google Analytics GA4 Configuration Tag**
- **Multiple GA4 Event Tags** (for tracking)
- **NO duplicate consent/privacy tags**

### Alternative: Temporary Disable
If immediate fix isn't possible:
1. Pause all Enzuzo tags in GTM
2. Enable SimpleConsentBanner in code (uncomment in App.jsx)
3. Use custom footer for privacy/terms links

### Contact for Issues
- GTM Support: https://support.google.com/tagmanager
- Enzuzo Support: https://enzuzo.com/support