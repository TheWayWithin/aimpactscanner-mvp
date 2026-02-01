# AImpactScanner Architecture Documentation

**Version**: v1.0  
**Last Updated**: February 1, 2026  
**Framework**: MASTERY-AI v3.1.1  

## Overview

AImpactScanner is a modern, scalable SaaS application providing professional AI optimization analysis for websites. Built with a serverless-first architecture, it delivers sub-15 second analysis results with enterprise-grade accuracy.

## Technology Stack

### Frontend Layer
- **Framework**: React 19.1.0 with modern hooks architecture
- **Build Tool**: Vite 7.0.0 for fast development and optimized production builds
- **Styling**: Tailwind CSS 4.1.10 for utility-first styling
- **State Management**: Custom React hooks for modular state management
  - `useAuth` - Authentication and user session management
  - `useAnalysis` - Analysis workflow and results
  - `useRouting` - Client-side navigation and view management
  - `useUsageTracking` - Tier limits and usage monitoring
- **Bundle Optimization**: Dynamic imports and code splitting for optimal performance

### Backend Infrastructure
- **Primary**: Supabase (PostgreSQL + Edge Functions + Real-time)
- **Edge Functions**: TypeScript/Deno runtime for serverless API endpoints
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: WebSocket connections for live analysis progress
- **Authentication**: Multi-provider OAuth (Google, GitHub) + Magic Links

### Deployment & Hosting
- **Frontend Deployment**: Netlify with automatic deployments from Git
- **Database & APIs**: Supabase cloud infrastructure
- **CDN**: Built-in CDN through Netlify for global distribution
- **Branch Strategy**: `develop` → staging, `main` → production

### Payment Processing
- **Provider**: Stripe
- **Integration**: Checkout Sessions + Customer Portal
- **Webhooks**: Real-time subscription status updates
- **Security**: Webhook signature verification

## Architecture Patterns

### Component Architecture
```
src/
├── components/           # Reusable UI components
│   ├── gdpr/            # GDPR compliance components (replacing Enzuzo)
│   ├── auth/            # Authentication forms and flows
│   └── dashboard/       # User dashboard and account management
├── hooks/               # Custom React hooks for state management
├── analytics/           # GTM and GA4 integration
├── pages/               # Route-level components
└── utils/               # Shared utilities and helpers
```

### Data Flow Architecture
```
User Action → React Component → Custom Hook → Supabase Edge Function → Database
                     ↓                                    ↓
              UI Updates ← Real-time Subscription ← Database Triggers
```

### State Management Pattern
- **Authentication State**: Centralized in `useAuth` hook
- **Analysis State**: Managed by `useAnalysis` hook with real-time updates
- **Navigation State**: Client-side routing via `useRouting` hook
- **Cross-cutting Concerns**: Shared refs and actions pattern for hook coordination

## Database Schema

### Core Tables
```sql
-- User profiles with tier management
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  monthly_analyses_used INTEGER DEFAULT 0,
  created_at TIMESTAMP
)

-- Analysis requests and results
analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  url TEXT,
  status TEXT,
  results JSONB,
  created_at TIMESTAMP
)

-- Factor analysis details (MASTERY-AI Framework)
factors (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id),
  factor_name TEXT,
  score NUMERIC,
  recommendations TEXT[]
)
```

### Security Model
- **Row Level Security (RLS)**: All tables protected with user-specific policies
- **Service Role**: Backend functions use elevated permissions for cross-user operations
- **API Security**: Supabase JWT tokens for authenticated requests

## API Architecture

### Edge Functions (Supabase)
```typescript
// Core analysis engine
/analyze-page              // Main analysis orchestration
/stripe-webhook           // Payment webhook processing  
/create-checkout-session  // Stripe payment initiation
/create-portal-session    // Customer portal access
```

### External Integrations
- **Stripe API**: Payment processing and subscription management
- **Google Analytics**: Event tracking via GTM integration
- **OAuth Providers**: Google and GitHub for authentication

## Real-time Features

### WebSocket Subscriptions
```typescript
// Live analysis progress updates
supabase
  .channel('analysis-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'analyses',
    filter: `id=eq.${analysisId}`
  }, handleProgressUpdate)
```

### Progress Tracking
- **Granular Updates**: 18+ progress checkpoints during analysis
- **Educational Content**: Dynamic tips and insights during waiting
- **Real-time UI**: Progress bars and status updates without page refresh

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Lazy-loaded components with React.lazy()
- **Bundle Analysis**: Webpack Bundle Analyzer for size monitoring
- **Image Optimization**: Responsive images with proper formats
- **Caching Strategy**: Service worker for static asset caching

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Supabase handles database connections
- **Edge Computing**: Functions deployed to multiple global regions
- **Circuit Breakers**: Fallback strategies for external API failures

### Monitoring & Analytics
- **Performance Monitoring**: Custom performance metrics tracking
- **Error Tracking**: Comprehensive error logging and alerts
- **User Analytics**: GTM + GA4 for user behavior insights
- **Business Metrics**: Conversion tracking and revenue analytics

## Security Architecture

### Authentication & Authorization
- **Multi-factor Auth**: OAuth providers + Magic Links
- **Session Management**: Secure JWT tokens with automatic refresh
- **Role-based Access**: Tier-based feature access control
- **GDPR Compliance**: Native cookie consent and privacy controls

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Input Validation**: Comprehensive sanitization and validation
- **Rate Limiting**: Supabase built-in rate limiting
- **Audit Logging**: Complete audit trail for sensitive operations

### Privacy & Compliance
- **Cookie Management**: Native GDPR-compliant cookie consent
- **Data Minimization**: Only collect necessary user data
- **Right to Deletion**: User data deletion on account termination
- **Privacy Policy**: Comprehensive privacy documentation

## Scaling Strategy

### Current Limits & Capacity
- **Free Tier**: 3 analyses/month per user
- **Coffee Tier**: Unlimited Phase A analyses
- **Database**: PostgreSQL with auto-scaling via Supabase
- **Edge Functions**: Auto-scaling serverless execution

### Growth Architecture
- **Horizontal Scaling**: Serverless functions scale automatically
- **Database Sharding**: Future consideration for multi-tenancy
- **CDN Optimization**: Global distribution for international users
- **API Rate Limiting**: Tier-based rate limiting for fair usage

## Development Workflow

### Testing Strategy
```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# End-to-end Tests
npm run test:playwright

# Performance Tests
npm run test:performance
```

### Deployment Pipeline
```bash
# Development
git push origin develop → Auto-deploy to staging

# Production
develop → main (PR review) → Auto-deploy to production
```

### Quality Gates
- **Build Verification**: `npm run build` must pass
- **Test Coverage**: Comprehensive test suite execution
- **Performance Budgets**: Bundle size and performance monitoring
- **Security Scanning**: Automated dependency vulnerability checks

## Monitoring & Observability

### Application Monitoring
- **Performance Metrics**: Page load times and user interactions
- **Error Tracking**: Client-side and server-side error monitoring
- **User Flows**: Complete user journey analytics
- **Business KPIs**: Conversion rates and revenue metrics

### Infrastructure Monitoring
- **Database Performance**: Query performance and connection monitoring
- **Function Execution**: Edge function performance and error rates
- **CDN Performance**: Global distribution and cache hit rates
- **Uptime Monitoring**: Service availability across all components

## Cost Architecture

### Current Operational Costs
- **Supabase**: ~$25/month for database and functions
- **Netlify**: Free tier (expected to upgrade as traffic grows)
- **Stripe**: 2.9% + $0.30 per transaction
- **Domain & SSL**: ~$15/year
- **Monitoring**: Included in platform costs

### Cost Optimization Strategies
- **GDPR Compliance**: Replaced Enzuzo ($29/month) with native solution
- **Bundle Optimization**: Reduced bandwidth costs through code splitting
- **Caching Strategy**: Minimized function execution costs
- **Efficient Queries**: Optimized database usage patterns

## Future Architecture Considerations

### Phase B Expansion (22-Factor Analysis)
- **Enhanced Analysis Engine**: Additional MASTERY-AI factors
- **Batch Processing**: Queue system for complex analyses
- **Report Generation**: PDF generation with advanced insights

### Enterprise Features
- **API Access**: RESTful API for enterprise integrations
- **Team Management**: Multi-user account management
- **White-label Solutions**: Branded analysis reports
- **Advanced Analytics**: Custom reporting and insights

### Technical Debt & Improvements
- **TypeScript Migration**: Gradual adoption for better type safety
- **State Management**: Consider Zustand for complex state scenarios
- **Testing Coverage**: Expand integration and E2E test coverage
- **Performance Optimization**: Further bundle size reduction

---

**Maintainers**: Development Team  
**Review Cycle**: Quarterly architecture review  
**Next Review**: May 1, 2026