// Utility functions for Enzuzo cleanup in tests
// Exported functions can be used across multiple test files

// Utility function to force cleanup Enzuzo elements
export const forceCleanupEnzuzo = async (page) => {
  await page.evaluate(() => {
    // Remove all Enzuzo-related elements
    const selectors = [
      '#ez-cookie-notification',
      '.enzuzo-cookiebanner-container',
      '.ez-consent',
      '[id*="ez-"]',
      '[class*="enzuzo"]',
      '[class*="ez-"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        console.log(`🧹 Removing Enzuzo element: ${selector}`);
        el.remove();
      });
    });
    
    // Remove Enzuzo scripts
    const scripts = document.querySelectorAll('script[src*="enzuzo"], script[src*="ez-"]');
    scripts.forEach(script => {
      console.log('🧹 Removing Enzuzo script:', script.src);
      script.remove();
    });
    
    // Clear globals
    if (window.Enzuzo) {
      console.log('🧹 Clearing Enzuzo global');
      delete window.Enzuzo;
    }
    
    // Clear storage
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('enzuzo')) {
        console.log('🧹 Clearing Enzuzo localStorage:', key);
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('enzuzo')) {
        console.log('🧹 Clearing Enzuzo sessionStorage:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ Enzuzo cleanup completed');
  });
  
  // Wait for cleanup to take effect
  await page.waitForTimeout(500);
};

// Check for any remaining Enzuzo elements
export const checkForEnzuzoElements = async (page) => {
  const results = await page.evaluate(() => {
    const selectors = [
      '#ez-cookie-notification',
      '.enzuzo-cookiebanner-container',
      '.ez-consent',
      '[id*="ez-"]',
      '[class*="enzuzo"]',
      '[class*="ez-"]'
    ];
    
    const foundElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        foundElements.push({ selector, count: elements.length });
      }
    });
    
    return {
      hasEnzuzoGlobal: typeof window.Enzuzo !== 'undefined',
      elements: foundElements,
      scripts: document.querySelectorAll('script[src*="enzuzo"], script[src*="ez-"]').length
    };
  });
  
  return results;
};