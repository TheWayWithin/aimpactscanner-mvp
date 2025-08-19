# GA4 + GDPR Implementation Setup Guide

This guide walks through setting up Google Analytics 4 with GDPR-compliant consent management and MCP integration for AImpactScanner.

## Phase 1: Google Analytics 4 Setup

### 1. Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create new property for `aimpactscanner.com`
3. Configure Enhanced Ecommerce
4. Set up the following custom events:
   - `analysis_start`
   - `analysis_complete` 
   - `sign_up`
   - `purchase`
   - `feature_usage`

### 2. Enable Google Analytics Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Analytics Data API
3. Create service account with Analytics Viewer role
4. Download JSON credentials file
5. Save to `credentials/google-analytics-service-account.json`

### 3. Configure Environment Variables

Update `.env.local` with your GA4 configuration:

```bash
# GA4 Configuration
VITE_GA4_MEASUREMENT_ID=G-YOUR-MEASUREMENT-ID
VITE_GA4_PROPERTY_ID=your-property-id

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-analytics-service-account.json
```

## Phase 2: GDPR Compliance with Enzuzo

### 1. Set Up Enzuzo Account

1. Go to [Enzuzo](https://enzuzo.com/)
2. Sign up for Business plan ($20/month for 4 domains)
3. Add domains:
   - `aimpactscanner.com`
   - `yourdomain2.com` 
   - `yourdomain3.com`
   - `yourdomain4.com`

### 2. Configure Consent Categories

In Enzuzo dashboard:
- **Necessary**: Always enabled (functional cookies)
- **Analytics**: GA4 tracking, performance measurement
- **Marketing**: Future advertising cookies (currently unused)

### 3. Get Enzuzo Integration Code

1. Generate JavaScript integration code in Enzuzo
2. Copy the custom script and domain configuration
3. Add to environment variables:

```bash
VITE_ENZUZO_DOMAIN_ID=your_enzuzo_domain_id
VITE_ENZUZO_SCRIPT_URL=https://app.enzuzo.com/apps/xxxxxxxx.js
```

## Phase 3: MCP Integration for Advanced Analytics

### 1. Verify MCP Server Configuration

Check Claude Code configuration in `~/.config/claude/config.json`:

```json
{
  "mcp": {
    "servers": {
      "google-analytics": {
        "command": "npx",
        "args": ["-y", "mcp-server-google-analytics"],
        "env": {
          "GA_PROPERTY_ID": "your-property-id",
          "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
        }
      }
    }
  }
}
```

### 2. Test MCP Integration

Use Claude Code to test analytics queries:

```javascript
// Test basic metrics
const metrics = await ga4MCP.getBasicMetrics('last_7_days');

// Test conversion funnel
const funnel = await ga4MCP.getConversionFunnel();

// Generate weekly report
const report = await ga4MCP.generateWeeklyReport();
```

## Phase 4: Implementation Verification

### 1. Test Consent Banner

1. Clear browser cookies and localStorage
2. Visit site - consent banner should appear
3. Test "Accept All", "Reject All", and "Customize" options
4. Verify GA4 tracking respects consent choices

### 2. Verify GA4 Events

Use GA4 Real-time reports to verify events:

1. **Page Views**: Navigate between pages
2. **Analysis Start**: Start website analysis  
3. **Analysis Complete**: Complete analysis workflow
4. **Sign Up**: Complete user registration
5. **Purchase**: Upgrade to Coffee tier

### 3. Test GDPR Compliance

1. **Consent Persistence**: Choices saved across sessions
2. **Consent Withdrawal**: Can change preferences
3. **Data Processing**: Analytics only active with consent
4. **Cookie Classification**: Proper necessary/analytics/marketing categories

## Phase 5: Production Deployment

### 1. Update Environment Variables

Production `.env`:

```bash
VITE_ENVIRONMENT=production
VITE_DEBUG_ANALYTICS=false
VITE_GA4_MEASUREMENT_ID=G-PRODUCTION-ID
VITE_SITE_URL=https://aimpactscanner.com
```

### 2. Deploy Privacy Policy

Create comprehensive privacy policy covering:
- Google Analytics data collection
- Cookie usage and categories
- User consent management
- Data retention and deletion
- GDPR rights and contact information

### 3. Monitor Implementation

1. **GA4 Dashboard**: Real-time event tracking
2. **Consent Metrics**: Track opt-in rates
3. **Conversion Funnel**: Monitor user journey
4. **Error Tracking**: Exception monitoring

## Advanced Features

### MCP-Powered Analytics Queries

With MCP integration, use Claude Code for advanced analytics:

```bash
# Generate weekly business insights
"Analyze last week's performance and suggest 3 specific optimizations"

# Revenue forecasting  
"Forecast Coffee tier revenue for next 3 months based on current trends"

# Conversion optimization
"Identify the biggest drop-off point in our funnel and suggest fixes"

# Competitive analysis
"Compare our conversion rates to industry benchmarks"
```

### Automated Reporting

Set up automated insights:
- Weekly performance summaries
- Anomaly detection and alerts
- Revenue attribution analysis
- User journey optimization recommendations

## Troubleshooting

### Common Issues

1. **Consent Banner Not Showing**
   - Check ConsentProvider wrapper in App.jsx
   - Verify localStorage is accessible
   - Ensure no cached consent state

2. **GA4 Events Not Tracking**
   - Verify consent is granted for analytics
   - Check GDPR-compliant tracking code
   - Confirm GA4 measurement ID is correct

3. **MCP Server Connection Failed**
   - Verify service account credentials
   - Check GA4 property ID configuration
   - Ensure API is enabled in Google Cloud

### Support Contacts

- **GA4 Issues**: Google Analytics support
- **GDPR Questions**: Enzuzo support team
- **MCP Integration**: Claude Code documentation
- **Implementation Help**: Development team

## Success Metrics

After implementation, monitor these KPIs:

- **Consent Opt-in Rate**: Target >60%
- **Analysis Completion Rate**: Monitor funnel conversion
- **Revenue Attribution**: Track upgrade sources
- **Page Performance**: Site speed impact
- **Compliance Score**: GDPR audit readiness

This implementation provides enterprise-grade analytics with full GDPR compliance and advanced MCP-powered insights for data-driven growth optimization.