#!/usr/bin/env node
// run-e2e-tests.js - E2E Test Runner with Temp Email Integration
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * E2E Test Runner for AImpactScanner
 * Provides organized test execution with proper setup and reporting
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const TEST_SUITES = {
  'user-journey': {
    name: 'Complete User Journey with Temp Email',
    file: 'tests/e2e/user-journey-with-temp-email.spec.js',
    description: 'Tests anonymous → authenticated flow with 10minute.com',
    estimatedTime: '8 minutes',
    critical: true
  },
  'usage-tracking': {
    name: 'Usage Tracking and Tier Management',
    file: 'tests/e2e/usage-tracking-flow.spec.js',
    description: 'Tests free tier → Coffee tier progression',
    estimatedTime: '6 minutes',
    critical: true
  },
  'error-handling': {
    name: 'Error Handling and Edge Cases',
    file: 'tests/e2e/error-handling-edge-cases.spec.js',
    description: 'Tests error scenarios and security validation',
    estimatedTime: '5 minutes',
    critical: false
  }
};

class E2ETestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  async checkPrerequisites() {
    this.log('\n🔍 Checking prerequisites...', 'cyan');
    
    try {
      // Check if dev server is running
      const { stdout } = await execAsync('curl -s http://localhost:5174 > /dev/null && echo "server_running" || echo "server_not_running"');
      
      if (!stdout.includes('server_running')) {
        this.log('❌ Development server not running on localhost:5174', 'red');
        this.log('💡 Run: npm run dev', 'yellow');
        return false;
      }
      
      this.log('✅ Development server running', 'green');
      
      // Check Playwright installation
      await execAsync('npx playwright --version');
      this.log('✅ Playwright installed', 'green');
      
      // Check test files exist
      for (const [key, suite] of Object.entries(TEST_SUITES)) {
        try {
          await fs.access(suite.file);
          this.log(`✅ Test suite found: ${suite.name}`, 'green');
        } catch (error) {
          this.log(`❌ Test suite missing: ${suite.file}`, 'red');
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      this.log(`❌ Prerequisites check failed: ${error.message}`, 'red');
      return false;
    }
  }

  async runSuite(suiteKey, options = {}) {
    const suite = TEST_SUITES[suiteKey];
    if (!suite) {
      throw new Error(`Unknown test suite: ${suiteKey}`);
    }
    
    this.log(`\n🚀 Running: ${suite.name}`, 'bright');
    this.log(`📋 Description: ${suite.description}`, 'blue');
    this.log(`⏱️ Estimated time: ${suite.estimatedTime}`, 'blue');
    
    const startTime = Date.now();
    
    try {
      // Build command
      let command = `npx playwright test ${suite.file}`;
      
      if (options.ui) {
        command += ' --ui';
      }
      
      if (options.debug) {
        command += ' --debug';
      }
      
      if (options.headed) {
        command += ' --headed';
      }
      
      if (options.browser) {
        command += ` --project="${options.browser}"`;
      }
      
      if (options.grep) {
        command += ` --grep="${options.grep}"`;
      }
      
      // Execute test
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 20 * 60 * 1000, // 20 minutes max
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const duration = Date.now() - startTime;
      const durationMin = Math.round(duration / 1000 / 60 * 10) / 10;
      
      // Parse results
      const testMatch = stdout.match(/(\d+) passed.*?(\d+) failed/);
      const passed = testMatch ? parseInt(testMatch[1]) : 0;
      const failed = testMatch ? parseInt(testMatch[2]) : 0;
      
      this.totalTests += passed + failed;
      this.passedTests += passed;
      this.failedTests += failed;
      
      const result = {
        suite: suite.name,
        passed,
        failed,
        duration: durationMin,
        success: failed === 0,
        output: stdout
      };
      
      this.results.push(result);
      
      if (result.success) {
        this.log(`✅ ${suite.name} completed successfully`, 'green');
        this.log(`   📊 ${passed} tests passed in ${durationMin} minutes`, 'green');
      } else {
        this.log(`❌ ${suite.name} failed`, 'red');
        this.log(`   📊 ${passed} passed, ${failed} failed in ${durationMin} minutes`, 'red');
        
        if (stderr) {
          this.log(`   🔍 Error details: ${stderr.substring(0, 200)}...`, 'red');
        }
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const durationMin = Math.round(duration / 1000 / 60 * 10) / 10;
      
      this.log(`❌ ${suite.name} execution failed`, 'red');
      this.log(`   ⚠️ Error: ${error.message}`, 'red');
      
      const result = {
        suite: suite.name,
        passed: 0,
        failed: 1,
        duration: durationMin,
        success: false,
        error: error.message
      };
      
      this.results.push(result);
      this.failedTests += 1;
      this.totalTests += 1;
      
      return result;
    }
  }

  async runAll(options = {}) {
    this.log('\n🎯 Running complete E2E test suite with temp email integration', 'bright');
    
    const prereqsOk = await this.checkPrerequisites();
    if (!prereqsOk) {
      this.log('\n❌ Prerequisites not met. Please fix issues and try again.', 'red');
      process.exit(1);
    }
    
    // Run test suites in order
    const suiteKeys = Object.keys(TEST_SUITES);
    
    if (options.criticalOnly) {
      this.log('\n⚡ Running critical tests only', 'yellow');
      suiteKeys.filter(key => TEST_SUITES[key].critical);
    }
    
    for (const suiteKey of suiteKeys) {
      if (options.criticalOnly && !TEST_SUITES[suiteKey].critical) {
        continue;
      }
      
      await this.runSuite(suiteKey, options);
      
      // Short pause between suites
      if (!options.ui && !options.debug) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.generateReport();
  }

  async runSingle(suiteKey, options = {}) {
    this.log(`\n🎯 Running single test suite: ${suiteKey}`, 'bright');
    
    const prereqsOk = await this.checkPrerequisites();
    if (!prereqsOk) {
      this.log('\n❌ Prerequisites not met. Please fix issues and try again.', 'red');
      process.exit(1);
    }
    
    await this.runSuite(suiteKey, options);
    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalDurationMin = Math.round(totalDuration / 1000 / 60 * 10) / 10;
    
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 E2E TEST RESULTS SUMMARY', 'bright');
    this.log('='.repeat(60), 'cyan');
    
    this.log(`\n📈 Overall Results:`, 'bright');
    this.log(`   Total Tests: ${this.totalTests}`);
    this.log(`   Passed: ${this.passedTests}`, this.passedTests > 0 ? 'green' : 'reset');
    this.log(`   Failed: ${this.failedTests}`, this.failedTests > 0 ? 'red' : 'reset');
    this.log(`   Success Rate: ${Math.round(this.passedTests / this.totalTests * 100)}%`);
    this.log(`   Total Duration: ${totalDurationMin} minutes`);
    
    this.log(`\n📋 Test Suite Breakdown:`, 'bright');
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      
      this.log(`   ${status} ${result.suite}`, color);
      this.log(`     ${result.passed} passed, ${result.failed} failed (${result.duration}min)`);
    }
    
    // Generate recommendations
    this.log(`\n💡 Recommendations:`, 'bright');
    
    if (this.failedTests === 0) {
      this.log('   🎉 All tests passed! Ready for production deployment.', 'green');
    } else {
      this.log('   🔧 Some tests failed. Review failures before deployment.', 'yellow');
      
      const failedSuites = this.results.filter(r => !r.success);
      for (const suite of failedSuites) {
        this.log(`   🔍 Check: ${suite.suite}`, 'red');
      }
    }
    
    // Performance insights
    const slowSuites = this.results.filter(r => r.duration > 10);
    if (slowSuites.length > 0) {
      this.log(`\n⚡ Performance Notes:`, 'yellow');
      for (const suite of slowSuites) {
        this.log(`   📊 ${suite.suite} took ${suite.duration} minutes (consider optimization)`);
      }
    }
    
    this.log('\n' + '='.repeat(60), 'cyan');
    
    // Exit with appropriate code
    process.exit(this.failedTests > 0 ? 1 : 0);
  }

  async generateDetailedReport() {
    const reportDir = 'test-results/e2e';
    const reportFile = path.join(reportDir, 'detailed-report.json');
    
    try {
      await fs.mkdir(reportDir, { recursive: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        totalTests: this.totalTests,
        passedTests: this.passedTests,
        failedTests: this.failedTests,
        totalDuration: Date.now() - this.startTime,
        results: this.results,
        environment: {
          node: process.version,
          platform: process.platform,
          ci: !!process.env.CI
        }
      };
      
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      this.log(`\n📄 Detailed report saved: ${reportFile}`, 'blue');
      
    } catch (error) {
      this.log(`⚠️ Could not save detailed report: ${error.message}`, 'yellow');
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);

async function main() {
  const runner = new E2ETestRunner();
  
  const options = {
    ui: args.includes('--ui'),
    debug: args.includes('--debug'),
    headed: args.includes('--headed'),
    criticalOnly: args.includes('--critical-only'),
    browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1],
    grep: args.find(arg => arg.startsWith('--grep='))?.split('=')[1]
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 AImpactScanner E2E Test Runner

Usage:
  node tests/run-e2e-tests.js [options] [suite]

Test Suites:
  user-journey     Complete anonymous → authenticated flow
  usage-tracking   Usage limits and tier management  
  error-handling   Error scenarios and edge cases
  all              Run all test suites (default)

Options:
  --ui             Open Playwright UI
  --debug          Run in debug mode
  --headed         Show browser windows
  --critical-only  Run only critical tests
  --browser=name   Run on specific browser
  --grep=pattern   Filter tests by pattern
  --help, -h       Show this help

Examples:
  node tests/run-e2e-tests.js                    # Run all tests
  node tests/run-e2e-tests.js user-journey       # Run specific suite
  node tests/run-e2e-tests.js --ui               # Open UI for all tests
  node tests/run-e2e-tests.js --critical-only    # Run critical tests only
  node tests/run-e2e-tests.js --browser=firefox  # Test on Firefox
`);
    process.exit(0);
  }
  
  const suiteArg = args.find(arg => !arg.startsWith('--'));
  
  try {
    if (suiteArg && suiteArg !== 'all' && TEST_SUITES[suiteArg]) {
      await runner.runSingle(suiteArg, options);
    } else {
      await runner.runAll(options);
    }
    
    await runner.generateDetailedReport();
    
  } catch (error) {
    console.error(`${COLORS.red}❌ Test runner failed: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Self-test validation
async function selfTest() {
  console.log('🔧 Running self-test validation...');
  
  try {
    // Check required files exist
    const requiredFiles = [
      'tests/e2e/user-journey-with-temp-email.spec.js',
      'tests/e2e/usage-tracking-flow.spec.js',
      'tests/e2e/error-handling-edge-cases.spec.js',
      'tests/utils/temp-email-utils.js',
      'tests/setup/temp-email-config.js'
    ];
    
    for (const file of requiredFiles) {
      await fs.access(file);
      console.log(`✅ ${file}`);
    }
    
    console.log('✅ Self-test passed - all required files present');
    
  } catch (error) {
    console.error(`❌ Self-test failed: ${error.message}`);
    process.exit(1);
  }
}

if (args.includes('--self-test')) {
  selfTest();
} else {
  main();
}