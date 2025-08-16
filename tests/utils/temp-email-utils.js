// temp-email-utils.js - 10minute.com Integration Utilities for E2E Testing
import { expect } from '@playwright/test';

/**
 * Utility class for handling temporary email addresses via 10minute.com
 * Enables complete authentication flow testing without permanent email accounts
 */
export class TempEmailUtils {
  constructor(page) {
    this.page = page;
    this.currentEmail = null;
    this.emailDomain = null;
    this.inbox = [];
  }

  /**
   * Generate a temporary email address using 10minute.com
   * @returns {Promise<string>} The generated email address
   */
  async generateTempEmail() {
    console.log('🏃‍♂️ Generating temporary email address...');
    
    // Navigate to 10minute.com in a new tab
    const emailPage = await this.page.context().newPage();
    
    try {
      await emailPage.goto('https://10minute.com', { 
        waitUntil: 'networkidle', 
        timeout: 15000 
      });
      
      // Wait for email to be generated and extract it
      await emailPage.waitForSelector('#mailAddress', { timeout: 10000 });
      
      const emailElement = await emailPage.locator('#mailAddress');
      this.currentEmail = await emailElement.textContent();
      
      if (!this.currentEmail || !this.currentEmail.includes('@')) {
        throw new Error('Failed to extract email address from 10minute.com');
      }
      
      // Extract domain for inbox polling
      this.emailDomain = this.currentEmail.split('@')[1];
      
      console.log(`✅ Generated temporary email: ${this.currentEmail}`);
      
      // Keep the email page open for inbox monitoring
      this.emailPage = emailPage;
      
      return this.currentEmail;
      
    } catch (error) {
      await emailPage.close();
      throw new Error(`Failed to generate temporary email: ${error.message}`);
    }
  }

  /**
   * Poll the inbox for new emails, specifically looking for magic links
   * @param {number} timeoutMs - Maximum time to wait for email (default: 60000ms)
   * @param {number} pollIntervalMs - Interval between checks (default: 2000ms)
   * @returns {Promise<string|null>} The magic link URL if found, null otherwise
   */
  async waitForMagicLink(timeoutMs = 60000, pollIntervalMs = 2000) {
    console.log(`📧 Waiting for magic link email to ${this.currentEmail}...`);
    
    if (!this.emailPage || !this.currentEmail) {
      throw new Error('No email page available. Generate email first.');
    }
    
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < timeoutMs) {
      attempts++;
      console.log(`📮 Checking inbox (attempt ${attempts})...`);
      
      try {
        // Refresh the email page to check for new messages
        await this.emailPage.reload({ waitUntil: 'networkidle', timeout: 10000 });
        
        // Look for email messages in the inbox
        const emailElements = await this.emailPage.locator('.mail-item, .email-item, .message-item').all();
        
        if (emailElements.length > 0) {
          console.log(`📬 Found ${emailElements.length} email(s)`);
          
          // Check each email for magic link
          for (const emailElement of emailElements) {
            try {
              // Click on the email to open it
              await emailElement.click({ timeout: 5000 });
              
              // Wait for email content to load
              await this.emailPage.waitForTimeout(1000);
              
              // Look for magic link in email content
              const magicLink = await this.extractMagicLinkFromPage();
              
              if (magicLink) {
                console.log(`🔗 Magic link found: ${magicLink.substring(0, 50)}...`);
                return magicLink;
              }
              
            } catch (emailError) {
              console.log(`⚠️ Error reading email: ${emailError.message}`);
              continue;
            }
          }
        }
        
        // Wait before next poll
        console.log(`⏳ No magic link found yet, waiting ${pollIntervalMs}ms...`);
        await this.emailPage.waitForTimeout(pollIntervalMs);
        
      } catch (pollError) {
        console.log(`⚠️ Polling error: ${pollError.message}`);
        await this.emailPage.waitForTimeout(pollIntervalMs);
      }
    }
    
    console.log(`❌ Magic link not found after ${timeoutMs}ms timeout`);
    return null;
  }

  /**
   * Extract magic link from the current email page content
   * @returns {Promise<string|null>} The magic link URL if found
   */
  async extractMagicLinkFromPage() {
    try {
      // Multiple selectors to handle different email formats
      const linkSelectors = [
        'a[href*="supabase"]',
        'a[href*="confirm"]', 
        'a[href*="token"]',
        'a[href*="auth"]',
        'a[href*="magic"]',
        'a[href*="login"]',
        'a[href*="verify"]'
      ];
      
      for (const selector of linkSelectors) {
        const linkElements = await this.emailPage.locator(selector).all();
        
        for (const link of linkElements) {
          const href = await link.getAttribute('href');
          
          if (href && (href.includes('confirm') || href.includes('token') || href.includes('auth'))) {
            // Validate it's a proper magic link
            if (href.startsWith('http') && href.includes('token')) {
              return href;
            }
          }
        }
      }
      
      // Also try to extract from plain text content
      const pageContent = await this.emailPage.content();
      const urlRegex = /https?:\/\/[^\s<>"]+(?:confirm|token|auth|verify)[^\s<>"]*/gi;
      const matches = pageContent.match(urlRegex);
      
      if (matches && matches.length > 0) {
        return matches[0];
      }
      
      return null;
      
    } catch (error) {
      console.log(`⚠️ Error extracting magic link: ${error.message}`);
      return null;
    }
  }

  /**
   * Alternative email generation using different services as fallback
   * @returns {Promise<string>} Generated email address
   */
  async generateFallbackEmail() {
    console.log('🔄 Trying fallback email generation...');
    
    // List of alternative temporary email services
    const fallbackServices = [
      'https://temp-mail.org',
      'https://tempmail.lol',
      'https://guerrillamail.com'
    ];
    
    for (const service of fallbackServices) {
      try {
        const emailPage = await this.page.context().newPage();
        
        await emailPage.goto(service, { 
          waitUntil: 'networkidle', 
          timeout: 15000 
        });
        
        // Service-specific email extraction logic
        let emailSelector;
        switch (service) {
          case 'https://temp-mail.org':
            emailSelector = '#mail';
            break;
          case 'https://tempmail.lol':
            emailSelector = '.email-address';
            break;
          case 'https://guerrillamail.com':
            emailSelector = '#email-widget';
            break;
        }
        
        if (emailSelector) {
          await emailPage.waitForSelector(emailSelector, { timeout: 10000 });
          const email = await emailPage.locator(emailSelector).textContent();
          
          if (email && email.includes('@')) {
            this.currentEmail = email.trim();
            this.emailPage = emailPage;
            console.log(`✅ Fallback email generated: ${this.currentEmail}`);
            return this.currentEmail;
          }
        }
        
        await emailPage.close();
        
      } catch (error) {
        console.log(`⚠️ Fallback service ${service} failed: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('All email generation services failed');
  }

  /**
   * Handle magic link authentication flow
   * @param {string} magicLink - The magic link URL to process
   * @returns {Promise<boolean>} Success status
   */
  async handleMagicLinkAuth(magicLink) {
    console.log('🔑 Processing magic link authentication...');
    
    if (!magicLink) {
      throw new Error('No magic link provided');
    }
    
    try {
      // Navigate to magic link in the main page context
      await this.page.goto(magicLink, { 
        waitUntil: 'networkidle', 
        timeout: 15000 
      });
      
      // Wait for authentication to complete
      await this.page.waitForTimeout(2000);
      
      // Check for successful authentication indicators
      const authSuccess = await this.page.evaluate(() => {
        // Check for authentication state in localStorage or URL
        return localStorage.getItem('supabase.auth.token') !== null ||
               window.location.href.includes('dashboard') ||
               window.location.href.includes('account') ||
               document.querySelector('[data-auth-state="authenticated"]') !== null;
      });
      
      if (authSuccess) {
        console.log('✅ Magic link authentication successful');
        return true;
      } else {
        console.log('❌ Magic link authentication failed');
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Magic link processing error: ${error.message}`);
      return false;
    }
  }

  /**
   * Complete email verification flow with retry logic
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<boolean>} Success status
   */
  async completeEmailVerification(maxRetries = 3) {
    console.log('🎯 Starting complete email verification flow...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🚀 Email verification attempt ${attempt}/${maxRetries}`);
      
      try {
        // Generate email if not already done
        if (!this.currentEmail) {
          await this.generateTempEmail();
        }
        
        // Wait for magic link
        const magicLink = await this.waitForMagicLink();
        
        if (magicLink) {
          // Process magic link
          const authSuccess = await this.handleMagicLinkAuth(magicLink);
          
          if (authSuccess) {
            console.log('🎉 Complete email verification successful!');
            return true;
          }
        }
        
        // If failed and we have more attempts, try with new email
        if (attempt < maxRetries) {
          console.log('🔄 Retrying with new email address...');
          await this.cleanup();
          await this.generateFallbackEmail();
        }
        
      } catch (error) {
        console.log(`❌ Verification attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          console.log('🔄 Retrying...');
          await this.cleanup();
        }
      }
    }
    
    console.log('❌ All email verification attempts failed');
    return false;
  }

  /**
   * Clean up email page and reset state
   */
  async cleanup() {
    console.log('🧹 Cleaning up temp email resources...');
    
    if (this.emailPage) {
      try {
        await this.emailPage.close();
      } catch (error) {
        console.log(`⚠️ Error closing email page: ${error.message}`);
      }
      this.emailPage = null;
    }
    
    this.currentEmail = null;
    this.emailDomain = null;
    this.inbox = [];
  }

  /**
   * Get current temporary email address
   * @returns {string|null} Current email or null if not generated
   */
  getCurrentEmail() {
    return this.currentEmail;
  }

  /**
   * Check if email utilities are ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.currentEmail !== null && this.emailPage !== null;
  }
}

/**
 * Helper function to create temp email utils instance
 * @param {Page} page - Playwright page instance
 * @returns {TempEmailUtils} Configured utils instance
 */
export function createTempEmailUtils(page) {
  return new TempEmailUtils(page);
}

/**
 * Simplified email generation for quick tests
 * @param {Page} page - Playwright page instance
 * @returns {Promise<string>} Generated email address
 */
export async function generateQuickTempEmail(page) {
  const utils = new TempEmailUtils(page);
  return await utils.generateTempEmail();
}

/**
 * Wait for magic link with simplified interface
 * @param {Page} page - Playwright page instance
 * @param {string} email - Email address to monitor
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string|null>} Magic link URL or null
 */
export async function waitForMagicLinkSimple(page, email, timeout = 60000) {
  const utils = new TempEmailUtils(page);
  utils.currentEmail = email;
  return await utils.waitForMagicLink(timeout);
}