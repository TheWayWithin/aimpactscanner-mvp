// tests/setup/global-teardown.js - Global Playwright Test Teardown
import { chromium } from '@playwright/test';

async function globalTeardown() {
  console.log('🧹 Starting Playwright Global Teardown...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Clean up any test data that might have been created
    await page.goto('http://localhost:5173');
    
    // Clear test data from the application
    await page.evaluate(() => {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB if used
      if (window.indexedDB) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name?.includes('test')) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    });
    
    console.log('🗑️  Test data cleaned up');
    
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up test data:', error.message);
    // Don't fail the teardown if cleanup fails
  } finally {
    await browser.close();
  }
  
  console.log('✅ Playwright Global Teardown Complete');
}

export default globalTeardown;