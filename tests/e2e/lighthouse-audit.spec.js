/**
 * Lighthouse Performance Audit - Phase 9
 * Target: >90 scores on signup page before production deployment
 */

import { test, expect, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app/#signup';
const TARGET_SCORE = 90;

test.describe('Lighthouse Audit - Signup Page', () => {
  test('should score >90 on all categories', async () => {
    console.log('🔍 Running Lighthouse audit on:', STAGING_URL);

    // Launch Chrome
    const chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox'
      ]
    });

    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
      }
    };

    try {
      const runnerResult = await lighthouse(STAGING_URL, options);
      const report = runnerResult.lhr;

      // Extract scores
      const scores = {
        performance: Math.round(report.categories.performance.score * 100),
        accessibility: Math.round(report.categories.accessibility.score * 100),
        bestPractices: Math.round(report.categories['best-practices'].score * 100),
        seo: Math.round(report.categories.seo.score * 100)
      };

      console.log('\n📊 LIGHTHOUSE AUDIT RESULTS');
      console.log('═══════════════════════════════════════');
      console.log(`Performance:     ${scores.performance}/100 ${scores.performance >= TARGET_SCORE ? '✅' : '❌'}`);
      console.log(`Accessibility:   ${scores.accessibility}/100 ${scores.accessibility >= TARGET_SCORE ? '✅' : '❌'}`);
      console.log(`Best Practices:  ${scores.bestPractices}/100 ${scores.bestPractices >= TARGET_SCORE ? '✅' : '❌'}`);
      console.log(`SEO:             ${scores.seo}/100 ${scores.seo >= TARGET_SCORE ? '✅' : '❌'}`);
      console.log('═══════════════════════════════════════\n');

      // Identify failing categories
      const failures = [];
      if (scores.performance < TARGET_SCORE) failures.push(`Performance: ${scores.performance}/100`);
      if (scores.accessibility < TARGET_SCORE) failures.push(`Accessibility: ${scores.accessibility}/100`);
      if (scores.bestPractices < TARGET_SCORE) failures.push(`Best Practices: ${scores.bestPractices}/100`);
      if (scores.seo < TARGET_SCORE) failures.push(`SEO: ${scores.seo}/100`);

      // Extract top issues for failing categories
      if (failures.length > 0) {
        console.log('❌ FAILING CATEGORIES:');
        failures.forEach(f => console.log(`   - ${f}`));
        console.log('\n🔧 TOP ISSUES TO FIX:\n');

        // Performance issues
        if (scores.performance < TARGET_SCORE) {
          console.log('Performance Issues:');
          const perfAudits = report.categories.performance.auditRefs
            .map(ref => report.audits[ref.id])
            .filter(audit => audit.score !== null && audit.score < 0.9)
            .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
            .slice(0, 3);

          perfAudits.forEach((audit, i) => {
            console.log(`   ${i + 1}. ${audit.title}`);
            if (audit.displayValue) console.log(`      Impact: ${audit.displayValue}`);
          });
          console.log('');
        }

        // Accessibility issues
        if (scores.accessibility < TARGET_SCORE) {
          console.log('Accessibility Issues:');
          const a11yAudits = report.categories.accessibility.auditRefs
            .map(ref => report.audits[ref.id])
            .filter(audit => audit.score !== null && audit.score < 1)
            .slice(0, 3);

          a11yAudits.forEach((audit, i) => {
            console.log(`   ${i + 1}. ${audit.title}`);
            if (audit.description) console.log(`      ${audit.description.substring(0, 80)}...`);
          });
          console.log('');
        }

        // Best Practices issues
        if (scores.bestPractices < TARGET_SCORE) {
          console.log('Best Practices Issues:');
          const bpAudits = report.categories['best-practices'].auditRefs
            .map(ref => report.audits[ref.id])
            .filter(audit => audit.score !== null && audit.score < 1)
            .slice(0, 3);

          bpAudits.forEach((audit, i) => {
            console.log(`   ${i + 1}. ${audit.title}`);
          });
          console.log('');
        }

        // SEO issues
        if (scores.seo < TARGET_SCORE) {
          console.log('SEO Issues:');
          const seoAudits = report.categories.seo.auditRefs
            .map(ref => report.audits[ref.id])
            .filter(audit => audit.score !== null && audit.score < 1)
            .slice(0, 3);

          seoAudits.forEach((audit, i) => {
            console.log(`   ${i + 1}. ${audit.title}`);
          });
          console.log('');
        }
      }

      // Overall assessment
      const allPassed = failures.length === 0;
      console.log('\n═══════════════════════════════════════');
      if (allPassed) {
        console.log('✅ PASS: All categories scored ≥90');
        console.log('✅ RECOMMENDATION: Proceed to Phase 10 production deployment');
      } else {
        console.log(`❌ BLOCK: ${failures.length} categories below threshold`);
        console.log('❌ RECOMMENDATION: Fix critical issues before production');
      }
      console.log('═══════════════════════════════════════\n');

      // Assert all scores meet threshold
      expect(scores.performance, `Performance score should be ≥${TARGET_SCORE}`).toBeGreaterThanOrEqual(TARGET_SCORE);
      expect(scores.accessibility, `Accessibility score should be ≥${TARGET_SCORE}`).toBeGreaterThanOrEqual(TARGET_SCORE);
      expect(scores.bestPractices, `Best Practices score should be ≥${TARGET_SCORE}`).toBeGreaterThanOrEqual(TARGET_SCORE);
      expect(scores.seo, `SEO score should be ≥${TARGET_SCORE}`).toBeGreaterThanOrEqual(TARGET_SCORE);

    } finally {
      await chrome.kill();
    }
  });
});
