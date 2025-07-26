# AImpactScanner Claude Code Prompts
## Updated July 25, 2025 - Production UI Polish with VPN-Proof Timezone Handling

## Current Project State

### 🎉 LIVE & FULLY OPERATIONAL AT WWW.AIMPACTSCANNER.COM ✅
- **10-Factor Analysis System**: Complete real-time analysis with 30-95% nuanced scoring
- **Payment Integration**: Coffee Tier ($5/month) fully functional with Stripe
- **Complete User Journey**: Authentication → Analysis → Results → Payment working end-to-end
- **Real-Time Progress**: Live updates (10% → 100%) with educational content
- **All Systems Operational**: Frontend deployed on Netlify, backend on Supabase
- **Revenue Ready**: Production system capable of immediate revenue generation
- **Status**: DEPLOYED & GENERATING VALUE ✅

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

#### Real Factor Implementation Success (July 19, 2025)
- **Achievement**: Transformed from binary 0/100% to nuanced 30-95% scoring
- **Lesson**: User feedback drives critical improvements - binary scoring was identified as major limitation
- **Solution**: Implemented sophisticated content analysis with realistic score distribution
- **Impact**: Tool now provides actionable insights instead of pass/fail results

#### Production UI Polish Success (NEW - July 25, 2025)
- **Achievement**: Professional production interface with all development artifacts removed
- **User-Driven**: Three cosmetic improvements identified and systematically addressed
- **Technical Challenge**: VPN interference with timezone display required manual UTC calculation
- **Solution**: VPN-proof timezone conversion using manual EDT/EST offset detection
- **Impact**: Clean, professional interface ready for public use and revenue generation

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

#### Production Deployment Challenges (NEW - July 25, 2025)
- **Challenge**: Netlify build failures due to package.json duplicate keys
- **Solution**: Systematic debugging and configuration cleanup
- **Learning**: Build configuration requires exact precision
- **Impact**: Successful deployment after resolving 5 critical issues

#### Real-Time Progress Optimization (NEW - July 25, 2025)
- **Problem**: Progress updates too fast (200ms) for user visibility
- **Solution**: Optimized timing to 800ms intervals with subscription readiness delays
- **Learning**: User experience timing more critical than technical performance
- **Result**: Smooth visual progress tracking from 10% → 100%

#### Data Model Consistency (NEW - July 25, 2025)
- **Problem**: Frontend-backend pillar ID mismatch prevented complete results display
- **Solution**: Aligned Edge Function output with frontend expectations ('Authority' → 'A')
- **Learning**: Data contracts between services must be strictly maintained
- **Prevention**: Add data model validation to integration testing

#### Authentication Production Configuration (July 25, 2025)
- **Problem**: Magic links redirecting to localhost instead of production domain
- **Solution**: Updated Supabase URL Configuration with proper site URL
- **Learning**: Authentication services require explicit production configuration
- **Checklist**: Always verify auth flows in production environment

#### Real-Time Subscription Reliability (NEW - July 25, 2025)
- **Problem**: Complex Supabase channel configuration causing CHANNEL_ERROR
- **Lesson**: Simpler configuration often more reliable than feature-rich options
- **Solution**: Streamlined channel setup removed broadcast/presence complexity
- **Result**: 100% reliable real-time progress updates for all users

#### Global User Experience (NEW - July 25, 2025)
- **Challenge**: VPN users experiencing incorrect timezone display (4+ hours off)
- **Root Cause**: Browser timezone detection affected by VPN location
- **Innovation**: Manual UTC offset calculation bypassing browser APIs entirely
- **Code Pattern**: Dynamic EDT/EST detection using timezone offset comparison
- **Impact**: Accurate time display regardless of user's VPN or geographic location

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

### Production UI Polish
```
Clean up production interface by removing development artifacts:
1. Remove development/testing buttons and navigation elements
2. Fix user-facing labels and terminology (e.g., "Phase A" → "Analysis Date")
3. Implement VPN-proof timezone display using manual UTC calculations
4. Test real-time subscription reliability with simplified configuration
5. Validate professional appearance and user experience
```

### VPN-Proof Timezone Implementation
```
Implement timezone display that works regardless of user's VPN or location:
1. Detect EDT vs EST using timezone offset comparison
2. Calculate manual UTC offset (EDT: -4 hours, EST: -5 hours)
3. Apply offset directly to UTC timestamp without browser timezone APIs
4. Format with clear "ET" suffix for user clarity
5. Test with users in different geographic locations and VPN configurations
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

### Production Readiness Assessment
```
Evaluate production readiness including:
1. Remove all development artifacts and testing interfaces
2. Verify professional appearance and user experience
3. Test with global users and various network conditions (VPNs)
4. Validate real-time features work reliably
5. Ensure all user-facing text and labels are clear and professional
```

### User Experience Validation
```
Conduct user experience review focusing on:
1. Navigation clarity and professional appearance
2. Time and date displays accuracy for global users
3. Real-time progress updates reliability
4. Removal of confusing or technical development elements
5. Clear labeling and terminology throughout interface
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

### Real-Time Subscription Debugging
```
If real-time features aren't working:
1. Check browser console for CHANNEL_ERROR messages
2. Simplify channel configuration to basic setup:
   `supabase.channel(`analysis_progress_${analysisId}`)`
3. Remove complex broadcast/presence options that can cause failures
4. Verify RLS policies allow service role and user access
5. Test with different user accounts and network conditions
```

### VPN and Global User Testing
```
Test features with global users and VPN scenarios:
1. Test timezone display with users in different geographic locations
2. Verify functionality with common VPN services (NordVPN, ExpressVPN, etc.)
3. Use manual UTC calculations instead of browser timezone APIs
4. Validate that all time displays show consistent Eastern Time
5. Include VPN testing in regular QA processes
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