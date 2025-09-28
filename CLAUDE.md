# AImpactScanner Claude Code Integration Guide

## System Overview
AImpactScanner is a production-ready AI-powered website analysis tool using the MASTERY-AI framework. This guide provides essential context for Claude Code specialists working on the system.

## Architecture Stack
- **Frontend**: React SPA with real-time updates
- **Backend**: Supabase Edge Functions (analyze-page)
- **Database**: Supabase Postgres with RLS
- **Hosting**: Netlify with auto-deployment
- **Payment**: Stripe with tiered pricing
- **Analysis**: 15-factor MASTERY-AI framework

## Deployment Guardrails

### 🚨 Mandatory Pre-Deployment Validation
The system includes deployment guardrails to prevent the "130-factor incident" from July 2025. ALL deployments must pass validation:

```bash
# Required validation sequence
./guardrails/deployment-validation.sh --skip-health-check  # Pre-deployment
supabase functions deploy analyze-page                     # Deploy
./guardrails/deployment-validation.sh                      # Post-deployment
```

### Quick Reference Commands

#### Development Validation
```bash
# Factor count validation
node ./guardrails/factor-count-validator.js

# Pre-commit validation
./guardrails/pre-commit-check.sh

# Local testing validation
./guardrails/local-test-validation.sh
```

#### Deployment Commands
```bash
# Standard deployment sequence
./guardrails/deploy-sequence.sh

# Manual step-by-step deployment
./guardrails/deployment-validation.sh --skip-health-check
supabase functions deploy analyze-page
./guardrails/deployment-validation.sh

# Emergency rollback
./guardrails/emergency-rollback.sh
```

#### Monitoring and Health Checks
```bash
# System health check
./guardrails/health-check.sh

# Performance monitoring
./guardrails/performance-monitor.sh --duration 60

# Factor analysis audit
./guardrails/factor-audit.sh --detailed
```

### Graduated Automation Framework

#### Level 1: Manual Validation (Current)
- Developer executes all validation commands
- Manual verification of each step
- Direct coordination with @operator for deployment
- **Use Case**: Critical production deployments, major feature releases

#### Level 2: Semi-Automated (Future)
- Automated pre-deployment validation
- Manual approval gates for deployment
- Automated post-deployment monitoring
- **Use Case**: Regular feature updates, bug fixes

#### Level 3: Fully Automated (Future Enhancement)
- CI/CD pipeline integration
- Automated rollback triggers
- Self-healing deployment mechanisms
- **Use Case**: Minor updates, configuration changes

### Deployment Decision Tree

#### Pre-Deployment Assessment
```
Is this a critical system change?
├── YES → Use Level 1 (Manual Validation)
│   ├── Factor count changes? → Extra validation required
│   ├── Edge Function changes? → Performance testing required
│   └── Database schema changes? → Backup verification required
└── NO → Can use Level 2 (when available)
    ├── Factor implementation only? → Standard validation
    ├── UI/UX changes only? → Simplified validation
    └── Configuration changes? → Basic health check
```

#### Deployment Risk Assessment
```
Risk Level: HIGH
├── Factor count > 15
├── Edge Function timeout > 25s
├── Database migration required
└── External API integration changes

Risk Level: MEDIUM
├── Factor implementation changes
├── Performance optimizations
├── UI component updates
└── Configuration adjustments

Risk Level: LOW
├── Content updates
├── Styling changes
├── Documentation updates
└── Non-critical bug fixes
```

### Factor Count Management
- **Maximum**: 20 factors (hard limit)
- **Expected**: 15 factors (current production)
- **Validator**: `node ./guardrails/factor-count-validator.js`
- **Framework**: MASTERY-AI (Machine, Authority, Semantic, Topical, Engagement, Reference, Yield, AI)

#### Factor Change Protocol
1. **Validate**: Run factor-count-validator.js
2. **Document**: Update factor rationale in docs
3. **Test**: Verify timeout compliance
4. **Review**: Get @architect approval for >15 factors
5. **Deploy**: Use manual validation sequence

### Monitoring Thresholds
- Analysis failure rate: Must be <5%
- Edge Function response time: Must be <30 seconds
- File size warning: >1000 lines (indicates module import issues)
- Factor processing time: <25 seconds per analysis
- Database query performance: <100ms average

## AGENT-11 Coordination Protocols

### Specialist Roles and Guardrail Responsibilities

#### @operator - Deployment Specialist
- **Primary**: Execute all deployment validations
- **Monitors**: System health, performance metrics, error rates
- **Escalates**: Validation failures, performance degradation
- **Tools**: deployment-validation.sh, monitoring dashboards

#### @developer - Implementation Specialist
- **Primary**: Factor implementation within MASTERY framework
- **Validates**: Code against factor-count-validator.js
- **Documents**: Temporary workarounds with FIXME comments
- **Maintains**: Edge Function performance under 30s timeout

#### @architect - System Design Specialist
- **Primary**: Guardrail architecture and integration decisions
- **Reviews**: Factor scaling strategies, system boundaries
- **Plans**: Migration paths when Supabase adds module support
- **Defines**: Monitoring and alerting thresholds

### Emergency Procedures and Rollback

#### Deployment Failure Recovery (CRITICAL)
```bash
# Immediate rollback sequence
./guardrails/emergency-rollback.sh
./guardrails/health-check.sh --verify-rollback
```

**Step-by-Step Recovery Process:**
1. **Immediate Action** (0-5 minutes):
   - Execute emergency rollback script
   - Verify system health post-rollback
   - Notify @coordinator of incident
   
2. **Assessment** (5-15 minutes):
   - Check Edge Function logs in Supabase dashboard
   - Run factor validation audit
   - Document failure symptoms in `progress.md`
   
3. **Investigation** (15-60 minutes):
   - Validate factor count and file size constraints
   - Review recent git commits for breaking changes
   - Test with minimal payload to isolate issues
   
4. **Resolution Planning** (60+ minutes):
   - Coordinate with @architect for system design issues
   - Plan fix implementation with @developer
   - Schedule re-deployment with @operator

#### Factor Count Violations (BLOCKING)
```bash
# Emergency factor audit
./guardrails/factor-audit.sh --emergency --detailed
```

**Violation Response Protocol:**
1. **Stop**: Immediately halt deployment process
2. **Audit**: Run detailed factor analysis with emergency flag
3. **Escalate**: Contact @coordinator and @architect immediately
4. **Verify**: Cross-check against MASTERY-AI framework documentation
5. **Document**: Record violation details and resolution plan
6. **Update**: Revise expected counts only with @architect approval

#### Escalation Procedures

##### Level 1: Standard Issues (Response: 15 minutes)
- Validation failures
- Performance degradation
- Minor factor count discrepancies
- **Contact**: @developer → @operator

##### Level 2: System Impact (Response: 5 minutes)
- Edge Function complete failure
- Database connectivity issues
- Major factor count violations (>20)
- **Contact**: @coordinator + @architect + @operator

##### Level 3: Production Down (Response: Immediate)
- Complete system unavailability
- Data corruption risks
- Security breach indicators
- **Contact**: ALL AGENTS + immediate rollback

#### Rollback Decision Matrix
```
Rollback Trigger Conditions:
├── Analysis failure rate > 10% → Immediate rollback
├── Edge Function timeout > 35s → Immediate rollback
├── Factor count > 20 → Block deployment
├── Database errors > 5% → Immediate rollback
├── Performance degradation > 50% → Immediate rollback
└── Security alerts → Emergency rollback
```

### Coordinator Workflow Integration

#### Pre-Deployment Coordination
1. **@developer**: Completes factor validation and local testing
2. **@architect**: Reviews system impact and approves design changes
3. **@operator**: Executes deployment validation sequence
4. **@coordinator**: Orchestrates the deployment timeline and communications

#### During Deployment
- Real-time monitoring dashboard shared with all agents
- @operator provides status updates every 5 minutes during deployment
- @coordinator manages communications and decision-making
- Emergency contact established for immediate escalation

#### Post-Deployment
- @operator monitors system for 1 hour minimum
- @developer validates feature functionality
- @coordinator documents deployment outcomes
- Team reviews lessons learned and process improvements

#### Guardrail Script Integration
All guardrail scripts integrate with coordinator workflows:
- `./guardrails/notify-coordinator.sh` - Automated status updates
- `./guardrails/escalation-trigger.sh` - Automatic escalation based on thresholds
- `./guardrails/deployment-report.sh` - Comprehensive deployment summary

## Critical Path Protection

### 🚨 NEVER BLOCK These Operations
These are critical paths that must ALWAYS execute, regardless of optimization state:

1. **Authentication State Changes**
   - Login/logout flows
   - Session validation
   - Auth state callbacks
   - User initialization after auth
   ```javascript
   // ❌ WRONG - Blocks critical auth flow
   if (!isTabVisible) return; // In auth handler
   
   // ✅ CORRECT - Only block non-critical operations
   if (!isTabVisible && !isAuthOperation) return;
   ```

2. **Navigation State Updates**
   - View changes (landing → login → dashboard)
   - Post-authentication redirects
   - Route guards and protections

3. **Payment Processing**
   - Stripe checkout sessions
   - Webhook handlers
   - Subscription updates

4. **User Data Initialization**
   - First-time user creation
   - Tier assignment
   - Critical user preferences

### ⚡ Optimizable Operations (Can Defer/Block)
These operations can be deferred or blocked for optimization:

1. **Data Fetching**
   - Analysis history loading
   - Usage statistics
   - Non-critical API calls

2. **UI Updates**
   - Tooltips and hints
   - Background animations
   - Non-essential component renders

3. **Analytics & Tracking**
   - Event logging
   - Performance metrics
   - Usage analytics

### Implementation Guidelines
When adding optimization logic (tab visibility, debouncing, etc.):

1. **Ask**: Is this a critical path?
2. **Test**: Does blocking this prevent user access?
3. **Document**: Add operation to appropriate list above
4. **Validate**: Test auth flow after ANY App.jsx changes

## Development Guidelines

### Code Quality Standards
- No deployment without passing validation
- Mark temporary code with FIXME comments
- Maximum file size: 1000 lines (monitor for Supabase updates)
- Factor implementations must align with MASTERY framework
- **CRITICAL**: Test authentication flow after ANY App.jsx modifications

### Performance Requirements
- Edge Function timeout: 30 seconds maximum
- Analysis success rate: >95%
- Factor processing: Must complete within timeout constraints
- Database queries: Optimize for <100ms response times
- **Authentication redirect: Must complete within 2 seconds**

## Integration Patterns

### CI/CD Pipeline Integration
The guardrails integrate with GitHub Actions for automated validation:
- Pre-commit hooks for factor validation
- Pre-deployment system checks
- Post-deployment health verification
- Continuous monitoring setup

### Monitoring and Alerting
- **Health Checks**: Every 60 minutes in production
- **Post-Deployment**: Immediate + 1 hour follow-up
- **Issue Response**: Every 5 minutes during problems
- **Metrics**: Factor count, response time, error rate

## Documentation and Knowledge Base

### Key Documents
- `guardrails/README.md` - Complete guardrail documentation and script reference
- `docs/Technical_Architecture_Document_v1.0.md` - System architecture
- `docs/PRD_v8.0.md` - Product requirements
- `docs/The MASTERY-AI Framework v3.1.1 250703.md` - Analysis framework

### Guardrail Script Reference
```bash
# Core validation scripts
./guardrails/deployment-validation.sh      # Primary deployment validator
./guardrails/factor-count-validator.js     # Factor count enforcement
./guardrails/health-check.sh              # System health monitoring

# Development workflow scripts  
./guardrails/pre-commit-check.sh          # Pre-commit validation
./guardrails/local-test-validation.sh     # Local development testing
./guardrails/deploy-sequence.sh           # Automated deployment sequence

# Emergency response scripts
./guardrails/emergency-rollback.sh        # Immediate rollback execution
./guardrails/factor-audit.sh             # Emergency factor analysis
./guardrails/escalation-trigger.sh       # Automatic escalation system

# Monitoring and reporting scripts
./guardrails/performance-monitor.sh       # Performance tracking
./guardrails/notify-coordinator.sh        # Coordinator notifications
./guardrails/deployment-report.sh         # Comprehensive deployment reports
```

### Troubleshooting Resources
- Edge Function logs in Supabase dashboard
- Factor validation reports from validator script (`./guardrails/factor-audit.sh --report`)
- Performance metrics in deployment validation output
- Historical issues documented in `progress.md`
- Real-time monitoring via `./guardrails/performance-monitor.sh`
- Emergency response protocols in `guardrails/README.md`

## Best Practices for Claude Code

### When Working with Factors
1. **Pre-Change Validation**: Run `./guardrails/factor-count-validator.js` before any modifications
2. **Framework Alignment**: Understand the MASTERY framework before implementing changes
3. **Performance Impact**: Consider timeout implications of factor additions (max 25s processing time)
4. **Documentation**: Record business justification and technical rationale for changes
5. **Coordinator Approval**: Get @architect approval for any factor count changes >15

### When Deploying
1. **Mandatory Validation**: Never skip `./guardrails/deployment-validation.sh` sequence
2. **Risk Assessment**: Use deployment decision tree for risk classification
3. **Graduated Approach**: Apply appropriate automation level based on change complexity
4. **Monitoring Protocol**: Monitor for full hour after deployment using performance scripts
5. **Documentation**: Record deployment outcomes and lessons learned in `progress.md`
6. **Rollback Readiness**: Verify `./guardrails/emergency-rollback.sh` works before deployment

### When Troubleshooting
1. **Start with Guardrails**: Check `./guardrails/factor-audit.sh --detailed` output first
2. **System Health**: Run `./guardrails/health-check.sh` to verify system status
3. **Recent Changes**: Review git history and recent deployment reports
4. **Performance Analysis**: Use `./guardrails/performance-monitor.sh` for real-time metrics
5. **Escalation Path**: Follow the three-level escalation procedure for appropriate response
6. **Minimal Testing**: Test with minimal payload using `./guardrails/local-test-validation.sh`

### Coordinator Integration Best Practices
1. **Status Updates**: Use `./guardrails/notify-coordinator.sh` for automated status reporting
2. **Risk Communication**: Clearly communicate risk level using the assessment matrix
3. **Timeline Management**: Coordinate deployment windows with @coordinator
4. **Emergency Response**: Follow established escalation procedures without deviation
5. **Documentation**: Maintain clear records of decisions and rationale for audit trails

### Script Usage Guidelines
- Always run scripts from project root directory
- Check script permissions before execution (`chmod +x ./guardrails/*.sh`)
- Review script output for warnings and errors
- Use `--help` flag for script-specific documentation
- Report script failures immediately to @coordinator

This system prioritizes reliability and preventing production incidents while maintaining development velocity through systematic validation and clear escalation paths.