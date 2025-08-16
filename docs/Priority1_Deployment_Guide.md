# Priority 1 Deployment Guide
## Preview Analysis System Deployment

### Overview
This guide covers the complete deployment process for the Priority 1 user journey improvements, including the new preview analysis system, component integration, and production configuration requirements.

---

## Prerequisites

### Technical Requirements
- **Node.js**: Version 16+ for React application build
- **Supabase Project**: Active project with Edge Functions enabled
- **Netlify Account**: For frontend deployment (or alternative hosting)
- **Domain Configuration**: Properly configured DNS and SSL

### Access Requirements
- Supabase project admin access
- Netlify deployment permissions
- Environment variable configuration access
- Database migration permissions

---

## Pre-Deployment Checklist

### 1. Code Review & Testing
- [ ] All new components (PreviewAnalysis, PreviewResults) tested locally
- [ ] Integration tests passing for complete preview flow
- [ ] Edge Function analysis working with new flow
- [ ] Real-time subscriptions tested with multiple concurrent users
- [ ] SessionStorage persistence working across view transitions

### 2. Database Schema Validation
- [ ] `analysis_progress` table exists with required columns
- [ ] `analyses` table updated for anonymous analysis storage
- [ ] RLS policies configured for preview access
- [ ] Real-time publication includes `analysis_progress` table

### 3. Environment Configuration
- [ ] All required environment variables documented
- [ ] Production vs development configuration separated
- [ ] API keys and secrets properly secured
- [ ] Feature flags configured for gradual rollout

---

## Deployment Steps

### Step 1: Database Migrations

#### Run Required Migrations
```sql
-- Ensure analysis_progress table has all required columns
ALTER TABLE analysis_progress 
ADD COLUMN IF NOT EXISTS educational_content text;

-- Verify RLS policies for anonymous access
CREATE POLICY IF NOT EXISTS "Allow anonymous progress reads"
ON analysis_progress FOR SELECT
USING (true);

-- Enable real-time for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE analysis_progress;
```

#### Validate Database Schema
```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analysis_progress'
ORDER BY ordinal_position;

-- Test anonymous access
SELECT count(*) FROM analysis_progress; -- Should work without auth
```

### Step 2: Edge Function Deployment

#### Deploy analyze-page Function
```bash
# Navigate to project root
cd /path/to/aimpactscanner-mvp

# Deploy the updated Edge Function
supabase functions deploy analyze-page

# Verify deployment
supabase functions list
```

#### Test Edge Function
```bash
# Test with curl (replace with your actual URLs)
curl -X POST 'https://your-project.supabase.co/functions/v1/analyze-page' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "analysis_id": "test-123"
  }'
```

### Step 3: Frontend Build Configuration

#### Update Environment Variables
```bash
# Production environment file (.env.production)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_FEATURE_PREVIEW=true
REACT_APP_ENVIRONMENT=production
```

#### Build Validation
```bash
# Clean build
npm run clean
npm install

# Production build
npm run build

# Test build locally
npm run serve
```

### Step 4: Component Integration Verification

#### Test App.jsx Integration
- [ ] Landing page loads correctly
- [ ] URL input triggers preview analysis
- [ ] Progress tracking displays real-time updates
- [ ] Results show with proper progressive disclosure
- [ ] Registration flow preserves analysis data

#### Verify State Management
```javascript
// Test sessionStorage persistence
console.log(sessionStorage.getItem('landingAnalysisData'));
console.log(sessionStorage.getItem('pendingAnalysisUrl'));
console.log(sessionStorage.getItem('pendingAnalysisId'));
```

### Step 5: Real-Time Configuration

#### Supabase Real-Time Setup
```sql
-- Verify real-time is enabled for required tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

#### Test Real-Time Subscriptions
```javascript
// Test subscription in browser console
const { createClient } = supabase;
const client = createClient(url, anonKey);

const subscription = client
  .channel('test-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'analysis_progress'
  }, (payload) => {
    console.log('Real-time update:', payload);
  })
  .subscribe();
```

---

## Production Deployment

### Netlify Deployment

#### Build Settings
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "16"
  REACT_APP_FEATURE_PREVIEW = "true"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Environment Variables in Netlify
1. Go to Site Settings → Environment Variables
2. Add all required environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`  
   - `REACT_APP_FEATURE_PREVIEW`
3. Ensure sensitive keys are not exposed in client build

#### Deploy Command
```bash
# Option 1: Git-based deployment
git push origin main  # Triggers automatic deployment

# Option 2: Manual deployment
netlify deploy --prod --dir=build
```

### Alternative Hosting (Vercel/AWS/etc.)

#### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "env": {
    "REACT_APP_SUPABASE_URL": "@supabase-url",
    "REACT_APP_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### AWS S3 + CloudFront
```bash
# Build and sync to S3
npm run build
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR-ID --paths "/*"
```

---

## Post-Deployment Validation

### Functional Testing

#### End-to-End User Flow
1. **Landing Page Test**
   - Navigate to production site
   - Enter test URL (e.g., "example.com")
   - Verify analysis starts immediately

2. **Progress Tracking Test**
   - Confirm real-time progress updates
   - Verify educational content displays
   - Check completion auto-navigation

3. **Results Display Test**
   - Verify actual analysis results display
   - Confirm 3 unlocked factors shown in detail
   - Check locked content preview displays

4. **Conversion Flow Test**
   - Test "Get Free Account" CTA
   - Verify registration preserves analysis data
   - Confirm complete results accessible after registration

### Performance Validation

#### Analysis Speed Testing
```bash
# Use curl to test analysis timing
time curl -X POST 'https://your-project.supabase.co/functions/v1/analyze-page' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "analysis_id": "perf-test"}'
```

#### Load Testing
```javascript
// Simple load test script
async function loadTest() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          analysis_id: `load-test-${i}`
        })
      })
    );
  }
  
  const results = await Promise.all(promises);
  console.log('All requests completed:', results.length);
}
```

### Monitoring Setup

#### Error Tracking
```javascript
// Add error tracking to components
useEffect(() => {
  const errorHandler = (error) => {
    console.error('Preview Analysis Error:', error);
    // Send to monitoring service (e.g., Sentry)
  };
  
  window.addEventListener('error', errorHandler);
  return () => window.removeEventListener('error', errorHandler);
}, []);
```

#### Analytics Integration
```javascript
// Track key user actions
const trackAnalysisStart = (url) => {
  analytics.track('Preview Analysis Started', { url });
};

const trackResultsViewed = (analysisId, factors) => {
  analytics.track('Preview Results Viewed', { 
    analysisId, 
    factorCount: factors.length 
  });
};

const trackConversion = (action) => {
  analytics.track('Preview Conversion', { action });
};
```

---

## Configuration Management

### Environment-Specific Settings

#### Development Configuration
```javascript
// config/development.js
export const config = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  enablePreview: true,
  enableAnalytics: false,
  debugMode: true
};
```

#### Production Configuration
```javascript
// config/production.js
export const config = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  enablePreview: true,
  enableAnalytics: true,
  debugMode: false
};
```

### Feature Flags

#### Preview Feature Toggle
```javascript
// utils/featureFlags.js
export const isPreviewEnabled = () => {
  return process.env.REACT_APP_FEATURE_PREVIEW === 'true';
};

// In App.jsx
const initialView = isPreviewEnabled() ? 'landing' : 'auth';
```

#### Gradual Rollout
```javascript
// Percentage-based rollout
export const shouldShowPreview = (userId) => {
  const hash = simpleHash(userId);
  const percentage = parseInt(process.env.REACT_APP_PREVIEW_ROLLOUT_PERCENT) || 100;
  return (hash % 100) < percentage;
};
```

---

## Rollback Procedures

### Quick Rollback Options

#### 1. Feature Flag Disable
```bash
# Immediate disable via environment variable
# In Netlify: Set REACT_APP_FEATURE_PREVIEW=false
# Triggers automatic rebuild and deployment
```

#### 2. Git Revert
```bash
# Identify problematic commit
git log --oneline

# Revert specific commit
git revert commit-hash

# Force deploy previous version
git push origin main
```

#### 3. Component-Level Rollback
```javascript
// Temporary disable in App.jsx
const useOldFlow = true; // Quick toggle

if (useOldFlow) {
  setCurrentView('auth'); // Skip to original auth flow
} else {
  setCurrentView('landing'); // Use new preview flow
}
```

### Emergency Procedures

#### Database Issues
```sql
-- Disable real-time if causing problems
ALTER PUBLICATION supabase_realtime DROP TABLE analysis_progress;

-- Disable RLS if blocking functionality
ALTER TABLE analysis_progress DISABLE ROW LEVEL SECURITY;
```

#### Edge Function Issues
```bash
# Rollback to previous Edge Function version
supabase functions deploy analyze-page --legacy-bundle

# Or disable completely and use fallback
# Set environment variable: DISABLE_EDGE_FUNCTIONS=true
```

---

## Success Metrics & Monitoring

### Key Performance Indicators

#### Technical Metrics
- **Analysis Completion Rate**: >95% of started analyses complete successfully
- **Analysis Speed**: <15 seconds average completion time
- **Real-Time Reliability**: >99% successful subscription connections
- **Error Rate**: <1% of user sessions encounter errors

#### Business Metrics
- **Preview Engagement**: Time spent viewing preview results
- **Conversion Rate**: Preview viewers → Account creation
- **Analysis Quality**: User satisfaction with preview results
- **Revenue Impact**: Preview users → Subscription conversion

### Monitoring Dashboards

#### Technical Dashboard
```javascript
// Key metrics to track
const technicalMetrics = {
  analysisStarted: 'count of analysis initiations',
  analysisCompleted: 'count of successful completions', 
  analysisErrors: 'count of failed analyses',
  averageAnalysisTime: 'mean completion time',
  subscriptionErrors: 'real-time connection failures',
  sessionStorageErrors: 'data persistence failures'
};
```

#### Business Dashboard
```javascript
// Conversion funnel metrics
const conversionMetrics = {
  landingPageViews: 'unique visitors to landing page',
  analysisStarts: 'users who submit URL for analysis',
  previewViews: 'users who view preview results',
  registrationClicks: 'users who click "Get Free Account"',
  completedRegistrations: 'successful account creations',
  subscriptionUpgrades: 'preview users → paid subscriptions'
};
```

---

## Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs and user feedback
- [ ] Monitor conversion rate trends
- [ ] Check Edge Function performance metrics
- [ ] Validate real-time subscription stability

#### Monthly  
- [ ] Analysis framework updates (if needed)
- [ ] Security patch application
- [ ] Performance optimization review
- [ ] User experience feedback integration

#### Quarterly
- [ ] Comprehensive load testing
- [ ] Security audit of preview flow
- [ ] Conversion optimization analysis
- [ ] Technical debt assessment

### Update Procedures

#### Component Updates
1. **Development**: Test changes in development environment
2. **Staging**: Deploy to staging for integration testing
3. **Feature Flag**: Use feature flags for gradual rollout
4. **Monitor**: Track metrics during rollout
5. **Full Deploy**: Complete rollout after validation

#### Framework Updates
1. **Framework Analysis**: Review MASTERY-AI Framework changes
2. **Factor Mapping**: Update factor implementations if needed
3. **Edge Function**: Deploy updated analysis logic
4. **Validation**: Test with known websites for consistency
5. **Documentation**: Update user-facing documentation

This deployment guide ensures reliable, monitored deployment of the Priority 1 improvements while maintaining system stability and user experience quality.