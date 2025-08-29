#!/usr/bin/env node
// run-tier-tests.js - Comprehensive Tier Testing Execution Script
// Orchestrates all tier system tests with reporting and parallel execution

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * TIER TESTING EXECUTION SCRIPT
 * 
 * Provides multiple execution modes for testing the tier system:
 * - Individual tier tests
 * - Complete tier suite
 * - Cross-browser testing
 * - Performance benchmarking
 * - Continuous integration mode
 */

const SCRIPT_CONFIG = {
  testDir: './tests/tiers',
  reportDir: './test-results/tier-tests',
  logFile: './test-results/tier-tests/execution.log',
  timeout: 300000, // 5 minutes per test
  retries: 2
};

const TIER_TYPES = ['FREE', 'COFFEE', 'GROWTH', 'SCALE'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(SCRIPT_CONFIG.reportDir)) {
    fs.mkdirSync(SCRIPT_CONFIG.reportDir, { recursive: true });
  }
}

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  try {
    fs.appendFileSync(SCRIPT_CONFIG.logFile, logMessage);
  } catch (error) {
    // Ignore logging errors
  }
}

// Execute Playwright command with error handling
function runPlaywrightCommand(command, options = {}) {
  log(`Executing: ${command}`);
  
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: options.timeout || SCRIPT_CONFIG.timeout,
      ...options
    });
    
    log(`Command completed successfully`);
    return { success: true, output: result };
    
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.output?.toString() || ''
    };
  }
}

// Test execution modes
const EXECUTION_MODES = {
  // Run all tier tests sequentially
  async runAllTiers() {
    log('🚀 Starting complete tier system test suite...');
    
    const results = {
      startTime: new Date(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    // Run main tier signup flow tests
    const mainTestResult = runPlaywrightCommand(
      `npx playwright test tests/tiers/tier-signup-flows.spec.js --reporter=html --output-dir=${SCRIPT_CONFIG.reportDir}`
    );
    
    results.tests.push({
      name: 'Tier Signup Flows',
      result: mainTestResult.success ? 'PASSED' : 'FAILED',
      output: mainTestResult.output,
      error: mainTestResult.error
    });
    
    if (mainTestResult.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
    results.summary.total++;
    
    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;
    
    // Generate summary report
    generateSummaryReport(results);
    
    log(`✅ Tier test suite completed. Passed: ${results.summary.passed}, Failed: ${results.summary.failed}`);
    return results;
  },

  // Run specific tier test
  async runSpecificTier(tierType) {
    if (!TIER_TYPES.includes(tierType.toUpperCase())) {
      log(`❌ Invalid tier type: ${tierType}. Valid options: ${TIER_TYPES.join(', ')}`, 'error');
      return { success: false };
    }
    
    log(`🎯 Running ${tierType} tier specific tests...`);
    
    const grepPattern = `${tierType} Tier`;
    const command = `npx playwright test tests/tiers/tier-signup-flows.spec.js --grep="${grepPattern}" --reporter=html --output-dir=${SCRIPT_CONFIG.reportDir}`;
    
    return runPlaywrightCommand(command);
  },

  // Cross-browser testing
  async runCrossBrowser() {
    log('🌐 Starting cross-browser tier testing...');
    
    const results = {
      startTime: new Date(),
      browsers: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };
    
    for (const browser of BROWSERS) {
      log(`🔍 Testing on ${browser}...`);
      
      const result = runPlaywrightCommand(
        `npx playwright test tests/tiers/tier-signup-flows.spec.js --project=${browser} --reporter=html --output-dir=${SCRIPT_CONFIG.reportDir}/${browser}`
      );
      
      results.browsers.push({
        browser,
        success: result.success,
        output: result.output,
        error: result.error
      });
      
      results.summary.total++;
      if (result.success) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
    }
    
    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;
    
    generateCrossBrowserReport(results);
    
    log(`✅ Cross-browser testing completed. Passed: ${results.summary.passed}/${results.summary.total}`);
    return results;
  },

  // Performance benchmarking
  async runPerformanceBenchmark() {
    log('⚡ Starting tier system performance benchmarking...');
    
    // Run tests with performance tracing enabled
    const command = `npx playwright test tests/tiers/tier-signup-flows.spec.js --trace=on --video=on --reporter=html --output-dir=${SCRIPT_CONFIG.reportDir}/performance`;
    
    const result = runPlaywrightCommand(command);
    
    if (result.success) {
      log('📊 Performance benchmark completed successfully');
      log('📁 Performance traces available in test-results/tier-tests/performance/');
    } else {
      log('❌ Performance benchmark failed', 'error');
    }
    
    return result;
  },

  // Quick validation (essential tests only)
  async runQuickValidation() {
    log('⚡ Running quick tier validation tests...');
    
    // Run only the most critical tier tests
    const command = `npx playwright test tests/tiers/tier-signup-flows.spec.js --grep="Free Tier.*Complete Signup|Cross-Tier.*Consistency" --reporter=line`;
    
    const result = runPlaywrightCommand(command);
    
    if (result.success) {
      log('✅ Quick validation passed');
    } else {
      log('❌ Quick validation failed - run full test suite for details', 'error');
    }
    
    return result;
  },

  // Debug mode (with headed browser)
  async runDebugMode(tierType = null) {
    log('🐛 Starting debug mode tier testing...');
    
    let command = `npx playwright test tests/tiers/tier-signup-flows.spec.js --headed --debug --timeout=0`;
    
    if (tierType) {
      command += ` --grep="${tierType} Tier"`;
    }
    
    log('🔍 Debug mode: Browser will open for manual inspection');
    log('💡 Use playwright inspector to step through tests');
    
    return runPlaywrightCommand(command, { stdio: 'inherit' });
  }
};

// Generate summary report
function generateSummaryReport(results) {
  const reportPath = path.join(SCRIPT_CONFIG.reportDir, 'summary-report.json');
  const htmlReportPath = path.join(SCRIPT_CONFIG.reportDir, 'summary-report.html');
  
  // JSON report
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // HTML report
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Tier System Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { padding: 20px; border-radius: 6px; text-align: center; }
        .passed { background: #dcfce7; border-left: 4px solid #16a34a; }
        .failed { background: #fee2e2; border-left: 4px solid #dc2626; }
        .total { background: #dbeafe; border-left: 4px solid #2563eb; }
        .test-result { margin: 20px 0; padding: 15px; border-radius: 6px; }
        .test-passed { background: #f0fdf4; border: 1px solid #16a34a; }
        .test-failed { background: #fef2f2; border: 1px solid #dc2626; }
        .timestamp { color: #6b7280; font-size: 14px; }
        .duration { font-weight: bold; color: #374151; }
        pre { background: #f9fafb; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Tier System Test Summary</h1>
            <p class="timestamp">Executed: ${results.startTime.toLocaleString()}</p>
            <p class="duration">Duration: ${Math.round(results.duration / 1000)}s</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div style="font-size: 2em; font-weight: bold;">${results.summary.total}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div style="font-size: 2em; font-weight: bold;">${results.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div style="font-size: 2em; font-weight: bold;">${results.summary.failed}</div>
            </div>
        </div>
        
        <h2>Test Results</h2>
        ${results.tests.map(test => `
            <div class="test-result ${test.result === 'PASSED' ? 'test-passed' : 'test-failed'}">
                <h3>${test.result === 'PASSED' ? '✅' : '❌'} ${test.name}</h3>
                <p><strong>Result:</strong> ${test.result}</p>
                ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                ${test.output ? `<pre>${test.output}</pre>` : ''}
            </div>
        `).join('')}
        
        <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 6px;">
            <h3>📁 Additional Reports</h3>
            <ul>
                <li><strong>HTML Report:</strong> ./test-results/tier-tests/playwright-report/index.html</li>
                <li><strong>JSON Results:</strong> ./test-results/tier-tests/summary-report.json</li>
                <li><strong>Execution Log:</strong> ./test-results/tier-tests/execution.log</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  
  log(`📊 Summary report generated: ${htmlReportPath}`);
}

// Generate cross-browser report
function generateCrossBrowserReport(results) {
  const reportPath = path.join(SCRIPT_CONFIG.reportDir, 'cross-browser-report.html');
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Cross-Browser Tier Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .browser-result { margin: 20px 0; padding: 20px; border-radius: 6px; }
        .browser-passed { background: #f0fdf4; border: 1px solid #16a34a; }
        .browser-failed { background: #fef2f2; border: 1px solid #dc2626; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { padding: 20px; border-radius: 6px; text-align: center; background: #dbeafe; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Cross-Browser Tier Testing Report</h1>
        <p>Executed: ${results.startTime.toLocaleString()}</p>
        <p>Duration: ${Math.round(results.duration / 1000)}s</p>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Browsers Tested</h3>
                <div style="font-size: 2em; font-weight: bold;">${results.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div style="font-size: 2em; font-weight: bold;">${Math.round((results.summary.passed / results.summary.total) * 100)}%</div>
            </div>
        </div>
        
        ${results.browsers.map(browser => `
            <div class="browser-result ${browser.success ? 'browser-passed' : 'browser-failed'}">
                <h3>${browser.success ? '✅' : '❌'} ${browser.browser}</h3>
                <p><strong>Status:</strong> ${browser.success ? 'PASSED' : 'FAILED'}</p>
                ${browser.error ? `<p><strong>Error:</strong> ${browser.error}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, htmlContent);
  log(`🌐 Cross-browser report generated: ${reportPath}`);
}

// Command line interface
async function main() {
  ensureDirectories();
  
  const args = process.argv.slice(2);
  const command = args[0];
  const option = args[1];
  
  log('🎯 Tier Testing Suite Initialized');
  
  try {
    switch (command) {
      case 'all':
        await EXECUTION_MODES.runAllTiers();
        break;
        
      case 'tier':
        if (!option) {
          log('❌ Please specify tier type: npm run test:tier tier FREE', 'error');
          process.exit(1);
        }
        await EXECUTION_MODES.runSpecificTier(option);
        break;
        
      case 'cross-browser':
        await EXECUTION_MODES.runCrossBrowser();
        break;
        
      case 'performance':
        await EXECUTION_MODES.runPerformanceBenchmark();
        break;
        
      case 'quick':
        await EXECUTION_MODES.runQuickValidation();
        break;
        
      case 'debug':
        await EXECUTION_MODES.runDebugMode(option);
        break;
        
      default:
        console.log(`
🎯 Tier Testing Suite - Usage:

  npm run test:tier all              - Run complete tier test suite
  npm run test:tier tier FREE        - Run specific tier tests  
  npm run test:tier tier COFFEE      - Run Coffee tier tests
  npm run test:tier cross-browser    - Run cross-browser testing
  npm run test:tier performance      - Run performance benchmarks
  npm run test:tier quick            - Run quick validation
  npm run test:tier debug [TIER]     - Run in debug mode
  
Available tiers: ${TIER_TYPES.join(', ')}
        `);
        break;
    }
    
  } catch (error) {
    log(`❌ Execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`💥 Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export default EXECUTION_MODES;