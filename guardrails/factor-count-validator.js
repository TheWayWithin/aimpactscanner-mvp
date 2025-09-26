#!/usr/bin/env node
/**
 * Factor Count Validator
 * Prevents accidental factor proliferation by validating factor counts across the codebase
 * Run this as a pre-commit hook or CI check
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  MAX_FACTORS: 20,
  EXPECTED_FACTORS: 15,
  FACTOR_ID_PATTERN: /factor_id['":\s]+["']([A-Z]+\.\d+\.\d+)["']/g,
  FILES_TO_CHECK: [
    'supabase/functions/analyze-page/index.ts',
    'supabase/functions/analyze-page/lib/AnalysisEngine.ts'
  ]
};

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

class FactorValidator {
  constructor() {
    this.factors = new Set();
    this.factorLocations = {};
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Read and analyze a file for factor definitions
   */
  analyzeFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.warnings.push(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Reset the regex
    CONFIG.FACTOR_ID_PATTERN.lastIndex = 0;
    
    let match;
    while ((match = CONFIG.FACTOR_ID_PATTERN.exec(content)) !== null) {
      const factorId = match[1];
      this.factors.add(factorId);
      
      // Track where each factor is defined
      if (!this.factorLocations[factorId]) {
        this.factorLocations[factorId] = [];
      }
      
      // Find line number
      const position = match.index;
      const lineNumber = content.substring(0, position).split('\n').length;
      
      this.factorLocations[factorId].push({
        file: filePath,
        line: lineNumber
      });
    }

    // Check for duplicate factor definitions within the same file
    Object.entries(this.factorLocations).forEach(([factorId, locations]) => {
      const fileLocations = locations.filter(loc => loc.file === filePath);
      if (fileLocations.length > 1) {
        this.warnings.push(
          `Duplicate factor "${factorId}" in ${path.basename(filePath)} at lines: ${fileLocations.map(l => l.line).join(', ')}`
        );
      }
    });
  }

  /**
   * Validate factor count against limits
   */
  validateFactorCount() {
    const factorCount = this.factors.size;
    
    if (factorCount > CONFIG.MAX_FACTORS) {
      this.errors.push(
        `❌ Too many factors: ${factorCount} (max: ${CONFIG.MAX_FACTORS})`
      );
    } else if (factorCount !== CONFIG.EXPECTED_FACTORS) {
      this.warnings.push(
        `⚠️  Unexpected factor count: ${factorCount} (expected: ${CONFIG.EXPECTED_FACTORS})`
      );
    }
    
    return factorCount;
  }

  /**
   * Check for common issues that led to the "130-factor" incident
   */
  checkForCommonIssues() {
    // Check for suspicious patterns
    const allFactorIds = Array.from(this.factors).sort();
    
    // Check for sequential numbering that might indicate auto-generation
    const sequentialPattern = /^[A-Z]+\.(\d+)\.(\d+)$/;
    let lastMajor = 0;
    let sequentialCount = 0;
    
    allFactorIds.forEach(id => {
      const match = id.match(sequentialPattern);
      if (match) {
        const major = parseInt(match[1]);
        if (major === lastMajor + 1) {
          sequentialCount++;
        }
        lastMajor = major;
      }
    });
    
    if (sequentialCount > 10) {
      this.warnings.push(
        '⚠️  Many sequential factor IDs detected - verify these are intentional'
      );
    }

    // Check for factors that might be duplicates with different IDs
    const factorPrefixes = new Set();
    allFactorIds.forEach(id => {
      const prefix = id.split('.')[0];
      factorPrefixes.add(prefix);
    });
    
    if (factorPrefixes.size > 8) {
      this.warnings.push(
        `⚠️  Many factor categories detected (${factorPrefixes.size}) - verify MASTERY framework compliance`
      );
    }
  }

  /**
   * Generate a detailed report
   */
  generateReport() {
    console.log('\n' + colors.blue + '═══════════════════════════════════════════');
    console.log('     FACTOR COUNT VALIDATION REPORT');
    console.log('═══════════════════════════════════════════' + colors.reset);
    
    const factorCount = this.validateFactorCount();
    
    console.log(`\n📊 ${colors.blue}Summary:${colors.reset}`);
    console.log(`   Total unique factors: ${factorCount}`);
    console.log(`   Expected factors: ${CONFIG.EXPECTED_FACTORS}`);
    console.log(`   Maximum allowed: ${CONFIG.MAX_FACTORS}`);
    
    if (this.factors.size > 0) {
      console.log(`\n📋 ${colors.blue}Detected Factors:${colors.reset}`);
      const sortedFactors = Array.from(this.factors).sort();
      sortedFactors.forEach((factor, index) => {
        const locations = this.factorLocations[factor];
        console.log(`   ${index + 1}. ${factor}`);
        if (locations.length > 1) {
          console.log(`      ${colors.yellow}↳ Found in ${locations.length} locations${colors.reset}`);
        }
      });
    }
    
    this.checkForCommonIssues();
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}❌ ERRORS:${colors.reset}`);
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️  WARNINGS:${colors.reset}`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`\n${colors.green}✅ All checks passed!${colors.reset}`);
    }
    
    console.log('\n' + colors.blue + '═══════════════════════════════════════════' + colors.reset + '\n');
    
    return this.errors.length === 0;
  }

  /**
   * Main validation process
   */
  validate() {
    console.log(colors.blue + '🔍 Starting factor count validation...' + colors.reset);
    
    CONFIG.FILES_TO_CHECK.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      console.log(`   Analyzing: ${file}`);
      this.analyzeFile(fullPath);
    });
    
    const success = this.generateReport();
    
    if (!success) {
      console.log(colors.red + '❌ Validation failed! Please fix the errors before proceeding.' + colors.reset);
      process.exit(1);
    }
    
    return success;
  }
}

// Export for use in other scripts
module.exports = FactorValidator;

// Run if called directly
if (require.main === module) {
  const validator = new FactorValidator();
  validator.validate();
}