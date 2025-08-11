// tests/setup/global-setup.js - Global Playwright Test Setup
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

async function globalSetup() {
  console.log('🚀 Starting Playwright Global Setup...');
  
  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    
    let retries = 60; // 60 attempts with 1 second delay = 60 seconds max
    let serverReady = false;
    
    while (retries > 0 && !serverReady) {
      try {
        await page.goto('http://localhost:5173', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        // Check if the page actually loaded (not just returned 200)
        const title = await page.title();
        if (title && !title.includes('Error')) {
          serverReady = true;
          console.log('✅ Development server is ready');
        }
      } catch (error) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!serverReady) {
      throw new Error('❌ Development server did not start within 60 seconds');
    }
    
    // Perform any additional setup tasks
    await setupTestEnvironment(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Playwright Global Setup Complete');
}

async function setupTestEnvironment(page) {
  // Clear any existing test data
  await page.evaluate(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });
  
  // Set up test environment variables if needed
  console.log('🧹 Test environment cleaned and prepared');
}

export default globalSetup;