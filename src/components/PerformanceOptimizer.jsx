// Performance Optimizer Component
// Implements critical path optimizations, lazy loading, and Core Web Vitals improvements

import { useEffect } from 'react';

const PerformanceOptimizer = () => {
  useEffect(() => {
    // Implement lazy loading for images
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }

    // Optimize font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        performance.mark('fonts-loaded');
        document.body.classList.add('fonts-loaded');
      });
    }

    // Preload critical resources based on user interaction
    const preloadCriticalResources = () => {
      // Preload analysis components on hover/focus of URL input
      const urlInput = document.querySelector('input[type="url"], input[placeholder*="website"]');
      if (urlInput) {
        const preloadAnalysisComponents = () => {
          const componentsToPreload = [
            '/src/components/SimpleAnalysisProgress.jsx',
            '/src/components/SimpleResultsDashboard.jsx'
          ];
          
          componentsToPreload.forEach(component => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = component;
            document.head.appendChild(link);
          });
        };

        urlInput.addEventListener('focus', preloadAnalysisComponents, { once: true });
        urlInput.addEventListener('mouseenter', preloadAnalysisComponents, { once: true });
      }
    };

    // Optimize third-party script loading
    const optimizeThirdPartyScripts = () => {
      // Delay non-critical scripts until after LCP
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Load non-critical third-party scripts here
          performance.mark('third-party-scripts-loaded');
        }, { timeout: 5000 });
      }
    };

    // Core Web Vitals optimization
    const setupCoreWebVitalsOptimization = () => {
      // Add will-change to elements that will animate
      const animatableElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
      animatableElements.forEach(el => {
        el.style.willChange = 'transform, opacity';
      });

      // Optimize for CLS by reserving space for dynamic content
      const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
      dynamicContainers.forEach(container => {
        if (!container.style.minHeight) {
          container.style.minHeight = container.dataset.minHeight || '200px';
        }
      });

      // Mark critical rendering path complete
      performance.mark('critical-path-complete');
    };

    // Initialize optimizations
    preloadCriticalResources();
    optimizeThirdPartyScripts();
    setupCoreWebVitalsOptimization();

    // Cleanup function
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  return null; // This is a utility component with no UI
};

// Utility hook for performance monitoring
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Monitor LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('LCP:', entry.startTime);
          // Track LCP in analytics if needed
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Monitor FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);
          // Track FID in analytics if needed
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Monitor CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        if (clsValue > 0) {
          console.log('CLS:', clsValue);
          // Track CLS in analytics if needed
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    }
  }, []);
};

// Lazy image component
export const LazyImage = ({ src, alt, className = '', ...props }) => {
  return (
    <img
      data-src={src}
      alt={alt}
      className={`lazy ${className}`}
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%)',
        backgroundSize: '400% 100%',
        animation: 'loading 1.4s ease infinite'
      }}
      {...props}
    />
  );
};

export default PerformanceOptimizer;