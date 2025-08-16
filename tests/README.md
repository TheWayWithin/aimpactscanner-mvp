# AImpactScanner Test Suite
**Comprehensive Testing Framework for Priority 1 User Journey**

This directory contains the complete testing suite for AImpactScanner MVP, with specialized focus on validating the Priority 1 conversion-optimized user journey implementation.

## 🏗️ Test Architecture

```
tests/
├── e2e/                           # Priority 1 End-to-end tests
│   └── priority1-user-journey.test.js
├── integration/                   # Component integration tests
│   ├── component-integration.test.js
│   └── conversion-flow.test.js
├── unit/                         # Unit tests (existing)
│   └── factors.test.js
├── manual/                       # Manual validation tests
│   └── edge-function-validation.test.js
├── setup/                        # Test configuration
│   ├── test-config.js
│   └── database-setup.js
├── test-data/
│   └── urls.json
├── performance/
│   └── load-tests.js
├── priority1-test-suite.js      # Main test runner
└── README.md                     # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Test Environment
```bash
# Set up test database and verify configuration
npm run test:setup

# Or manually set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:performance   # Performance tests only

# Run with coverage
npm run test:coverage

# Run with UI dashboard
npm run test:ui
```

## 📝 Test Categories

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual factor analysis functions
- **Speed**: Fast (<2 seconds)
- **Scope**: Individual factors, data validation, edge cases
- **Example**: Testing HTTPS check, title analysis, meta description validation

```bash
# Run unit tests
npm run test:unit

# Run specific factor tests
npm run test:factors
```

### Integration Tests (`tests/integration/`)
- **Purpose**: Test complete analysis workflow
- **Speed**: Medium (5-30 seconds)
- **Scope**: Database operations, Edge Functions, real-time progress
- **Example**: Full analysis flow, progress tracking, concurrent analyses

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests (`tests/e2e/`)
- **Purpose**: Test complete user experience
- **Speed**: Slow (10-60 seconds)
- **Scope**: End-to-end user workflows, error scenarios
- **Example**: User submits URL → sees progress → views results

```bash
# Run E2E tests
npm run test:e2e
```

### Performance Tests (`tests/performance/`)
- **Purpose**: Validate performance targets
- **Speed**: Variable (30-120 seconds)
- **Scope**: Load testing, concurrent users, timeout handling
- **Example**: 10 concurrent analyses, Edge Function timeout testing

```bash
# Run performance tests
npm run test:performance
```

## 🎯 Test Data

### URL Test Collection (`tests/test-data/urls.json`)
The test suite includes carefully curated URLs for different scenarios:

- **Basic Sites**: Simple sites for fundamental testing
- **Edge Cases**: Error conditions, timeouts, malformed content
- **Performance Tests**: Sites with different loading characteristics
- **Factor Validation**: Sites with specific factor patterns

### Test Scenarios
- **HTTPS/HTTP**: Both secure and insecure sites
- **Content Variety**: Different content types and structures
- **Performance**: Fast and slow loading sites
- **Error Conditions**: 404, 500, timeouts
- **Concurrent Load**: Multiple simultaneous analyses

## 🔧 Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Test Configuration (`tests/setup/test-config.js`)
- Database connection setup
- Test utilities and helpers
- Timeout configurations
- Cleanup functions

## 📊 Test Utilities

### Available Helper Functions
```javascript
import { testUtils } from '../setup/test-config.js'

// Database operations
await testUtils.cleanupTestData()
await testUtils.createTestAnalysis(url)
await testUtils.waitForAnalysis(analysisId, timeout)

// Data retrieval
await testUtils.getProgressUpdates(analysisId)
await testUtils.getFactorResults(analysisId)
```

### Test Data Management
- Automatic cleanup before/after tests
- Consistent test data structure
- Isolated test environments
- Proper error handling

## 🎨 Writing Tests

### Unit Test Example
```javascript
import { describe, it, expect } from 'vitest'

describe('HTTPS Factor', () => {
  it('should score 100 for HTTPS URLs', () => {
    const result = checkHTTPS('https://example.com')
    expect(result.score).toBe(100)
    expect(result.confidence).toBe(100)
  })
})
```

### Integration Test Example
```javascript
import { testUtils } from '../setup/test-config.js'

describe('Analysis Flow', () => {
  it('should complete full analysis', async () => {
    const { analysisId } = await testUtils.createTestAnalysis()
    
    // Invoke Edge Function
    const { data } = await supabase.functions.invoke('analyze-page', {
      body: { url: 'https://example.com', analysisId }
    })
    
    // Wait for completion
    const status = await testUtils.waitForAnalysis(analysisId)
    expect(status).toBe('completed')
  })
})
```

## 📈 Performance Targets

### Current Targets (Mock Analysis)
- **Analysis Time**: ~10 seconds
- **Success Rate**: 100%
- **Concurrent Users**: 10+ without degradation

### Phase A Targets (Real Factors)
- **Analysis Time**: <15 seconds
- **Success Rate**: 95%
- **Concurrent Users**: 20+ without degradation
- **Individual Factor**: <2 seconds
- **Error Rate**: <2%

### Performance Test Validation
```javascript
// Timing validation
expect(duration).toBeLessThan(15000)

// Success rate validation
expect(successRate).toBeGreaterThan(95)

// Concurrent load validation
expect(concurrentResults.every(r => r.success)).toBe(true)
```

## 🛠️ Development Workflow

### 1. Test-Driven Development
```bash
# 1. Write failing test
npm run test:unit -- --watch

# 2. Implement factor
# Edit your factor implementation

# 3. Run tests until passing
npm run test:unit

# 4. Run integration tests
npm run test:integration
```

### 2. Factor Implementation Testing
```bash
# Test specific factor
npm run test:factors

# Test factor with real URLs
npm run test:integration

# Performance validation
npm run test:performance
```

### 3. Pre-deployment Testing
```bash
# Full test suite
npm run test:coverage

# Performance validation
npm run test:performance

# E2E user experience
npm run test:e2e
```

## 🔍 Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Watch mode for development
npm run test:watch
```

### Test Output
```bash
# Verbose output
npm run test -- --reporter=verbose

# JSON output for CI
npm run test:ci
```

### Common Issues
1. **Database Connection**: Ensure Supabase is running and env vars are set
2. **Edge Function**: Check function deployment and permissions
3. **Timeouts**: Adjust timeout values in test-config.js
4. **Test Data**: Use cleanup functions to avoid data conflicts

## 📋 Test Checklist

### Before Factor Implementation
- [ ] Database connection working
- [ ] Edge Function responsive
- [ ] Test data loading correctly
- [ ] Unit tests passing for mock factors

### During Factor Implementation
- [ ] Unit tests for each factor
- [ ] Integration tests passing
- [ ] Performance within targets
- [ ] Error handling working

### Before Deployment
- [ ] Full test suite passing
- [ ] Performance tests meeting targets
- [ ] E2E tests validating user experience
- [ ] Coverage report acceptable

## 🎯 Next Steps

### For Phase A Implementation
1. **Replace Mock Factors**: Update unit tests as you implement real factors
2. **Performance Optimization**: Use performance tests to validate <15s target
3. **Error Handling**: Ensure circuit breakers work with integration tests
4. **User Experience**: Validate with E2E tests

### For Phase B Implementation
1. **Queue System Testing**: Add tests for background processing
2. **Extended Performance**: Test 22-factor analysis
3. **Concurrent Load**: Validate 20+ concurrent users
4. **Complete User Flow**: Test full 2-phase experience

This testing framework provides comprehensive coverage for your transition from MVP foundation to production-ready AImpactScanner. Use it to validate each phase of development and ensure reliability at scale.