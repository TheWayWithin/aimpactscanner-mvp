#!/usr/bin/env node

// Performance Analysis Script
// Analyzes critical rendering path optimizations and build performance

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function analyzeHTMLOptimizations() {
  log('\n📄 Analyzing HTML Optimizations...', 'blue');
  
  const indexPath = path.join(path.dirname(__dirname), 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('❌ index.html not found', 'red');
    return false;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  const optimizations = {
    preconnect: content.includes('rel="preconnect"'),
    preload: content.includes('rel="preload"'),
    modulepreload: content.includes('rel="modulepreload"'),
    fetchpriority: content.includes('fetchpriority="high"'),
    criticalCSS: content.includes('/* Critical CSS'),
    fontDisplay: content.includes('font-display: swap'),
    dnsPretech: content.includes('rel="dns-prefetch"'),
    prefetch: content.includes('rel="prefetch"'),
    cssContainment: content.includes('contain: layout style'),
    willChange: content.includes('will-change:'),
    fontOptimization: content.includes('FontFace'),
    performanceMarks: content.includes('performance.mark')
  };
  
  Object.entries(optimizations).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const description = {
      preconnect: 'DNS preconnect for third-party domains',
      preload: 'Critical resource preloading',
      modulepreload: 'JavaScript module preloading',
      fetchpriority: 'Fetch priority hints',
      criticalCSS: 'Inline critical CSS',
      fontDisplay: 'Font display swap optimization',
      dnsPretech: 'DNS prefetch optimization',
      prefetch: 'Non-critical resource prefetching',
      cssContainment: 'CSS containment optimization',
      willChange: 'Will-change performance hints',
      fontOptimization: 'Font loading optimization',
      performanceMarks: 'Performance measurement marks'
    };
    log(`  ${status} ${description[key]}`, value ? 'green' : 'red');
  });
  
  return Object.values(optimizations).filter(Boolean).length;
}

function analyzeCSSOptimizations() {
  log('\n🎨 Analyzing CSS Optimizations...', 'blue');
  
  const cssPath = path.join(path.dirname(__dirname), 'src', 'App.css');
  if (!fs.existsSync(cssPath)) {
    log('❌ src/App.css not found', 'red');
    return false;
  }
  
  const content = fs.readFileSync(cssPath, 'utf8');
  const optimizations = {
    containment: content.includes('contain:'),
    willChange: content.includes('will-change:'),
    lazyLoading: content.includes('.lazy'),
    gpuAcceleration: content.includes('translateZ(0)'),
    reducedMotion: content.includes('prefers-reduced-motion'),
    highContrast: content.includes('prefers-contrast'),
    contentVisibility: content.includes('content-visibility'),
    fontDisplay: content.includes('font-display: swap'),
    clampSizing: content.includes('clamp('),
    layerOptimization: content.includes('layer('),
    containIntrinsic: content.includes('contain-intrinsic-size')
  };
  
  Object.entries(optimizations).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const description = {
      containment: 'CSS containment for layout optimization',
      willChange: 'Will-change hints for animations',
      lazyLoading: 'Image lazy loading styles',
      gpuAcceleration: 'GPU acceleration with translateZ',
      reducedMotion: 'Reduced motion accessibility',
      highContrast: 'High contrast mode support',
      contentVisibility: 'Content visibility optimization',
      fontDisplay: 'Font display swap',
      clampSizing: 'Responsive clamp() sizing',
      layerOptimization: 'CSS layer optimization',
      containIntrinsic: 'Contain intrinsic size optimization'
    };
    log(`  ${status} ${description[key]}`, value ? 'green' : 'red');
  });
  
  return Object.values(optimizations).filter(Boolean).length;
}

function analyzeViteConfig() {
  log('\n⚡ Analyzing Vite Configuration...', 'blue');
  
  const vitePath = path.join(path.dirname(__dirname), 'vite.config.js');
  if (!fs.existsSync(vitePath)) {
    log('❌ vite.config.js not found', 'red');
    return false;
  }
  
  const content = fs.readFileSync(vitePath, 'utf8');
  const optimizations = {
    manualChunks: content.includes('manualChunks'),
    terserOptions: content.includes('terserOptions'),
    cssCodeSplit: content.includes('cssCodeSplit'),
    assetsInlineLimit: content.includes('assetsInlineLimit'),
    optimizeDeps: content.includes('optimizeDeps'),
    preTransformRequests: content.includes('preTransformRequests'),
    reportCompressedSize: content.includes('reportCompressedSize'),
    es2020Target: content.includes('es2020'),
    workerFormat: content.includes('worker')
  };
  
  Object.entries(optimizations).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const description = {
      manualChunks: 'Manual chunk splitting for better caching',
      terserOptions: 'Optimized code minification',
      cssCodeSplit: 'CSS code splitting',
      assetsInlineLimit: 'Small asset inlining',
      optimizeDeps: 'Dependency pre-bundling optimization',
      preTransformRequests: 'Pre-transform for faster dev server',
      reportCompressedSize: 'Compression size reporting',
      es2020Target: 'Modern ES2020 target for smaller bundles',
      workerFormat: 'Worker format optimization'
    };
    log(`  ${status} ${description[key]}`, value ? 'green' : 'red');
  });
  
  return Object.values(optimizations).filter(Boolean).length;
}

function analyzeComponentOptimizations() {
  log('\n⚛️ Analyzing Component Optimizations...', 'blue');
  
  const appPath = path.join(path.dirname(__dirname), 'src', 'App.jsx');
  const perfOptimizerPath = path.join(path.dirname(__dirname), 'src', 'components', 'PerformanceOptimizer.jsx');
  
  let optimizations = {};
  
  // Check App.jsx optimizations
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    optimizations = {
      ...optimizations,
      lazyComponents: appContent.includes('React.lazy'),
      suspenseBoundaries: appContent.includes('Suspense'),
      performanceMonitoring: appContent.includes('usePerformanceMonitoring'),
      memoDomComponents: appContent.includes('memo('),
      useMemoHooks: appContent.includes('useMemo'),
      useCallbackHooks: appContent.includes('useCallback')
    };
  }
  
  // Check PerformanceOptimizer component
  if (fs.existsSync(perfOptimizerPath)) {
    const perfContent = fs.readFileSync(perfOptimizerPath, 'utf8');
    optimizations = {
      ...optimizations,
      performanceOptimizer: true,
      intersectionObserver: perfContent.includes('IntersectionObserver'),
      performanceObserver: perfContent.includes('PerformanceObserver'),
      requestIdleCallback: perfContent.includes('requestIdleCallback'),
      lazyImageComponent: perfContent.includes('LazyImage'),
      coreWebVitals: perfContent.includes('Core Web Vitals')
    };
  } else {
    optimizations.performanceOptimizer = false;
  }
  
  Object.entries(optimizations).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const description = {
      lazyComponents: 'React.lazy() for code splitting',
      suspenseBoundaries: 'Suspense boundaries for loading states',
      performanceMonitoring: 'Performance monitoring hooks',
      memoDomComponents: 'React.memo() for component optimization',
      useMemoHooks: 'useMemo() for expensive calculations',
      useCallbackHooks: 'useCallback() for function memoization',
      performanceOptimizer: 'PerformanceOptimizer component',
      intersectionObserver: 'IntersectionObserver for lazy loading',
      performanceObserver: 'PerformanceObserver for metrics',
      requestIdleCallback: 'requestIdleCallback for non-critical work',
      lazyImageComponent: 'LazyImage component for image optimization',
      coreWebVitals: 'Core Web Vitals monitoring'
    };
    log(`  ${status} ${description[key]}`, value ? 'green' : 'red');
  });
  
  return Object.values(optimizations).filter(Boolean).length;
}

function generatePerformanceReport() {
  log('\n📊 Performance Optimization Report', 'bold');
  log('=' .repeat(50), 'blue');
  
  const htmlScore = analyzeHTMLOptimizations();
  const cssScore = analyzeCSSOptimizations();
  const viteScore = analyzeViteConfig();
  const componentScore = analyzeComponentOptimizations();
  
  const totalOptimizations = htmlScore + cssScore + viteScore + componentScore;
  const maxOptimizations = 12 + 11 + 9 + 12; // Maximum possible optimizations
  const percentage = Math.round((totalOptimizations / maxOptimizations) * 100);
  
  log('\n📈 Overall Performance Score', 'bold');
  log('-'.repeat(30), 'blue');
  log(`HTML Optimizations: ${htmlScore}/12`, htmlScore >= 10 ? 'green' : htmlScore >= 8 ? 'yellow' : 'red');
  log(`CSS Optimizations: ${cssScore}/11`, cssScore >= 9 ? 'green' : cssScore >= 7 ? 'yellow' : 'red');
  log(`Vite Configuration: ${viteScore}/9`, viteScore >= 7 ? 'green' : viteScore >= 5 ? 'yellow' : 'red');
  log(`Component Optimizations: ${componentScore}/12`, componentScore >= 10 ? 'green' : componentScore >= 8 ? 'yellow' : 'red');
  
  log(`\n🎯 Total Score: ${totalOptimizations}/${maxOptimizations} (${percentage}%)`, 
    percentage >= 85 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  
  if (percentage >= 85) {
    log('🎉 Excellent! Your critical rendering path is highly optimized.', 'green');
  } else if (percentage >= 70) {
    log('⚠️  Good optimization level, but there\'s room for improvement.', 'yellow');
  } else {
    log('🚨 Consider implementing more performance optimizations.', 'red');
  }
  
  log('\n💡 Key Performance Benefits:', 'blue');
  log('  • Reduced critical request chain length');
  log('  • Faster First Contentful Paint (FCP)');
  log('  • Improved Largest Contentful Paint (LCP)');
  log('  • Better Time to Interactive (TTI)');
  log('  • Enhanced Core Web Vitals scores');
  log('  • Optimized for mobile and desktop performance');
  
  return { totalOptimizations, maxOptimizations, percentage };
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generatePerformanceReport();
  process.exit(0);
}

export { generatePerformanceReport };