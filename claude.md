# AImpactScanner Claude Code Prompts
## Updated July 24, 2025 - Complete MVP Ready for Production Deployment

## Current Project State

### 🚀 PRODUCTION-READY COMPLETE MVP ✅
- **10-Factor Analysis System**: Full implementation with sophisticated scoring (30-95% ranges)
- **Complete Payment Integration**: Coffee Tier ($5/month) with Stripe + webhook processing
- **Full User Experience**: Tier management, account dashboard, upgrade flow integrated
- **Real-Time Progress**: Live analysis updates with educational content
- **Backend Deployed**: All Supabase Edge Functions live and operational
- **Frontend Ready**: React app with all features complete and tested
- **Single Blocker**: Netlify deployment configuration (backend fully functional)

### Critical Lessons Learned

#### Database Schema Issues (RESOLVED)
- **Problem**: Missing columns (`message`, `stage`, `progress_percent`, `phase`)
- **Solution**: Always check table schema before Edge Function deployment
- **Command**: Use `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'table_name'`

#### RLS Policy Conflicts (RESOLVED)  
- **Problem**: Service role couldn't update user tables due to auth.uid() policies
- **Solution**: Add service role policies: `current_setting('role') = 'service_role'`
- **Location**: `supabase/migrations/003_service_role_policies.sql`

#### Edge Function Timeout Constraints (MONITORED)
- **Current Status**: 10-factor analysis targets <15 seconds (within 60s limit)
- **Risk**: Medium - could approach timeout under load
- **Mitigation Plan**: 4 documented fallback options (factor reduction, async processing, progressive enhancement, platform migration)
- **Monitoring**: Performance tracking with 50s warning threshold implemented

#### Testing Framework Implementation (COMPLETE)
- **Achievement**: Comprehensive test suite with unit, integration, E2E, and performance tests
- **Coverage**: Factor validation, database operations, real-time progress, concurrent users
- **Environment**: Proper UUID handling, test data management, cleanup automation
- **Commands**: Easy-to-use npm scripts for different test scenarios

#### Real Factor Implementation Success (NEW - July 19, 2025)
- **Achievement**: Transformed from binary 0/100% to nuanced 30-95% scoring
- **Lesson**: User feedback drives critical improvements - binary scoring was identified as major limitation
- **Solution**: Implemented sophisticated content analysis with realistic score distribution
- **Impact**: Tool now provides actionable insights instead of pass/fail results

#### Database Schema Validation (NEW)
- **Problem**: Live database schema differed from migration files
- **Lesson**: Always validate schema against live database, not just migration files
- **Solution**: Added comprehensive error handling and fallback values
- **Prevention**: Include schema validation in deployment checklist

#### Production Deployment Strategy (NEW - July 24, 2025)
- **Decision**: Deploy complete 10-factor MVP with all features
- **Rationale**: All features work in development - issue is deployment config, not code
- **Architecture**: Backend 100% functional on Supabase, frontend deployment is only blocker
- **Risk Management**: 4 documented Edge Function timeout mitigation strategies
- **Handover**: Complete deployment plan documented for session continuity

## Testing Framework

### Test Environment Setup ✅
The project now includes a complete testing framework supporting test-driven development:

```bash
# Quick setup and validation
npm run test:setup     # Initialize test environment
npm run test:summary   # Get current status overview

# Development workflow
npm run test:unit -- --watch  # TDD for factor implementation
npm run test:db        # Database operations validation
npm run test:progress  # Real-time progress tracking
npm run test:coverage  # Coverage analysis
npm run test:ui        # Visual test dashboard
```

### Test Categories

#### Unit Tests (`npm run test:unit`)
- **Purpose**: Individual factor validation
- **Coverage**: All 10 Phase A factors with mock implementations
- **Performance**: <2 seconds per factor
- **Validation**: Data structure, scoring logic, edge cases

#### Integration Tests (`npm run test:integration`)
- **Purpose**: Complete analysis workflow
- **Coverage**: Database operations, Edge Functions, real-time progress
- **Performance**: <30 seconds for full workflow
- **Validation**: End-to-end user experience

#### Performance Tests (`npm run test:performance`)
- **Purpose**: Load testing and concurrent user validation
- **Coverage**: 20+ concurrent users, timeout handling, memory management
- **Performance**: <15 seconds Phase A, <45 seconds complete
- **Validation**: Production readiness

### Test-Driven Development Workflow

#### Factor Implementation Pattern
```bash
# 1. Start with failing test
npm run test:unit -- --watch

# 2. Implement factor in Edge Function
# Edit: supabase/functions/analyze-page/lib/AnalysisEngine.ts

# 3. Validate with integration tests
npm run test:integration

# 4. Performance validation
npm run test:performance
```

#### Database Testing
```bash
# Validate database operations
npm run test:db

# Test real-time progress
npm run test:progress

# Edge Function integration
npm run test:edge
```

## Enhanced Development Prompts

### Two-Phase Analysis Development
```
Implement enhanced factor analysis following our two-phase architecture:
- Phase A (Instant): 10 factors in <15 seconds using existing simplified Edge Function
- Phase B (Background): 12 factors via queue system for complete 22-factor analysis
Refer to Factor Implementation Guide v1.0 for exact specifications and code examples.
```

### Factor Implementation
```
Implement [factor name] following the Factor Implementation Guide v1.0. Use the provided TypeScript code, ensure proper error handling with circuit breakers, and include educational content. Test with mock data first, then integrate real analysis logic.
```

### Test-Driven Factor Development
```
Implement [factor name] using test-driven development:
1. Start with: npm run test:unit -- --watch
2. Review existing mock implementation in tests/unit/factors.test.js
3. Implement real factor in Edge Function
4. Validate with integration tests: npm run test:integration
5. Performance check: npm run test:performance
```

### Real-Time Progress Enhancement
```
Enhance the working real-time progress system with [specific feature]. Current system uses Supabase subscriptions with educational content. Maintain the proven pattern of progress_percent, stage, message, and educational_content fields.
```

### Testing Validation
```
Validate [component/feature] with comprehensive testing:
- Unit tests: npm run test:unit
- Database operations: npm run test:db  
- Real-time progress: npm run test:progress
- Integration workflow: npm run test:integration
- Performance targets: npm run test:performance
Monitor for <15s Phase A completion and proper error handling.
```

## Development Prompts

### Component Creation
```
Create a new React component for [component name] that [functionality]. Follow our existing patterns in Auth.jsx, use AI Search Mastery brand styling with CSS variables, and ensure proper error handling and loading states.
```

### Database Migration
```
Create a Supabase migration for [changes needed]. Follow our existing schema patterns, include proper RLS policies, add necessary indexes for performance, and ensure compatibility with our current table structure.
```

### Edge Function Development
```
Implement a new Edge Function or enhance existing one for [functionality]. Use Deno/TypeScript, handle the 60-second timeout limit, implement proper error handling, and ensure efficient database operations.
```

## Architecture Prompts

### Full Stack Feature
```
Design and implement [feature name] across our React frontend and Supabase backend. Consider our current architecture, performance targets (35-50 seconds, 20+ concurrent users), and maintain brand consistency throughout.
```

### Code Review
```
Review [file/component] for security vulnerabilities, performance issues, and adherence to our coding standards. Check for proper error handling, memory leaks, and compatibility with our Supabase setup.
```

### Testing Strategy
```
Create comprehensive tests for [component/function]. Include unit tests, integration tests, and edge cases. Consider our Supabase setup, real-time subscriptions, and Edge Function constraints.
```

## Analysis & Planning Prompts

### Technical Investigation
```
Investigate [issue/requirement] in our codebase. Analyze the current implementation, identify potential problems, and propose solutions that align with our technical stack and performance requirements.
```

### Architecture Decision
```
Help me make an architectural decision about [topic]. Consider our current React + Supabase stack, performance targets, scalability requirements, and the 3-week MVP timeline.
```

### Refactoring Guidance
```
Suggest refactoring strategies for [component/system]. Focus on improving performance, maintainability, and alignment with our brand standards while minimizing disruption to existing functionality.
```

## Quick Commands

### File Analysis
```
Analyze [file path] and explain its current functionality, identify potential issues, and suggest improvements.
```

### Error Debugging
```
Debug this error: [error message]. Check related files and suggest fixes.
```

### Feature Implementation
```
Implement [specific feature] following our existing patterns and brand guidelines.
```

### Test Environment Check
```
Verify test environment status and run appropriate tests:
- Environment: npm run test:setup
- Status: npm run test:summary  
- Quick validation: npm run test:db && npm run test:progress
```

## Context-Specific Prompts

### Brand Consistency
```
Ensure this component/feature maintains AI Search Mastery brand identity. Use our CSS variables (--authority-white, --mastery-blue, --framework-black) and reference the MASTERY-AI Framework v3.1.1 appropriately.
```

### Performance Focus
```
Optimize this code for our CURRENT performance targets:
- 10-Factor Analysis: <15 seconds (within 60s Edge Function limit)
- Concurrent Users: 20+ without degradation
- Memory: <512MB per analysis
- Database: <50 queries per analysis
- Success Rate: 95% for complete analysis
- Timeout Mitigation: Monitor 50s threshold, implement fallback options
```

### Supabase Integration
```
Implement this feature using our existing Supabase setup. Use the configured client, respect RLS policies, and ensure proper error handling for Edge Functions.
```

## Project Status Prompts

### Progress Check
```
Review our current progress against the MVP timeline. Identify completed features, remaining tasks, and potential blockers. Suggest priority adjustments if needed.
```

### Deployment Readiness
```
Assess our codebase for production readiness. Check security, performance, error handling, and compliance with our technical requirements.
```

### Documentation Update
```
Update our documentation to reflect recent changes. Ensure accuracy of setup instructions, API documentation, and architectural decisions.
```

---

## 🎯 IMMEDIATE DEPLOYMENT PRIORITY (July 24, 2025)

### CRITICAL: Fix Netlify Frontend Deployment
```
**Current Blocker**: Netlify build failing despite complete backend functionality
**Fix Strategy**: Debug build configuration with complete 10-factor MVP
**Expected Resolution**: 1-2 hours
**Impact**: Immediate revenue generation capability once resolved
```

### Post-Deployment Tasks (After Live Site)
```
1. Switch to Production Stripe Keys (15 minutes)
2. Test Complete User Journey (15 minutes)  
3. Monitor Edge Function Performance (ongoing)
4. Implement timeout mitigation if needed (30 minutes)
```

### Edge Function Timeout Mitigation Options
```
If 10-factor analysis approaches 60s timeout:
**Option A**: Reduce to 5 core factors (5 minutes)
**Option B**: Implement async background processing (15 minutes)
**Option C**: Progressive enhancement (30 minutes)
**Option D**: Migrate to Netlify Functions (2-4 hours)
```

### Future Enhancement Roadmap (Post-Revenue)
```
- Additional factor implementation (extend beyond 10)
- Queue-based processing for complex analysis
- Advanced caching and performance optimization
- Multi-region deployment
```

---

## Development Environment Setup

### Database Schema Verification
```
Before any database-related development, verify schema:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '[table_name]'
ORDER BY ordinal_position;
```

### Edge Function Testing
```
Test Edge Function changes locally:
1. `supabase functions deploy [function-name]`
2. Check logs: Supabase Dashboard → Edge Functions → Logs
3. Test via frontend or direct API call
4. Monitor for timeout and permission errors
```

### RLS Policy Troubleshooting
```
If Edge Function can't update tables, check RLS policies:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = '[table_name]';
```
Ensure service role policies exist for INSERT/UPDATE operations.

---

## Project Architecture Reference

### Current File Structure
```
/docs/                          # Complete documentation suite
├── PRD_v8.0.md                # Product requirements with two-phase approach
├── Technical_Architecture_Document_v1.0.md  # Implementation blueprint
├── Factor_Implementation_Guide_v1.0.md      # Code for all 22 factors
├── MVP_Development_Checklist.md             # 21-day timeline
└── MASTERY-AI Framework v3.1.1/             # 148-factor specification

/supabase/functions/analyze-page/
├── index.ts                    # Simplified working Edge Function
├── index-original.ts           # Original Puppeteer version (backup)
└── deno.json                   # Permissions configuration

/src/components/
├── AnalysisProgress.jsx        # Working real-time progress
├── TierIndicator.jsx           # Header tier display
├── TierSelection.jsx           # Pricing page
├── AccountDashboard.jsx        # Account management
├── UpgradeHandler.jsx          # Payment flow integration
└── Auth.jsx                    # Existing auth pattern

/tests/                         # Complete testing framework
├── setup/
│   ├── test-config.js         # Test configuration and utilities
│   └── database-setup.js      # Database setup and validation
├── test-data/
│   └── urls.json             # Test URLs for various scenarios
├── unit/
│   └── factors.test.js       # Factor validation tests
├── integration/
│   └── analysis-flow.test.js # Complete workflow tests
├── e2e/
│   └── user-flow.test.js     # End-to-end user experience
├── performance/
│   └── load-tests.js         # Performance and concurrent user tests
└── test-summary.js           # Test status monitoring tool
```

### Database Tables
- `analyses`: Main analysis records (working)
- `analysis_progress`: Real-time progress tracking (working)  
- `analysis_factors`: Individual factor results (working)
- `users`: User management (existing)

### Key Configuration Files
- `supabase/config.toml`: Edge Function settings
- `supabase/migrations/003_service_role_policies.sql`: Critical RLS fixes
- `.env.test`: Test environment variables
- `vitest.config.js`: Test framework configuration
- `tests/README.md`: Complete testing documentation