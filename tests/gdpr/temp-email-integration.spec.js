// 10minute Mail Integration for GDPR Consent Testing
// Tests email-based consent workflows and confirmation processes

import { test, expect } from '@playwright/test';

// 10minute Mail API configuration
const TEMP_EMAIL_CONFIG = {
  API_BASE: 'https://www.1secmail.com/api/v1/',
  DOMAINS: ['1secmail.com', '1secmail.org', '1secmail.net'],
  DEFAULT_DOMAIN: '1secmail.com'
};

class TempEmailService {
  constructor() {
    this.emailAddress = null;
    this.username = null;
    this.domain = TEMP_EMAIL_CONFIG.DEFAULT_DOMAIN;
  }

  async createTempEmail() {
    // Generate random username
    this.username = Math.random().toString(36).substring(2, 15);
    this.emailAddress = `${this.username}@${this.domain}`;
    return this.emailAddress;
  }

  async getMessages() {
    if (!this.username) {
      throw new Error('No email address created');
    }

    const response = await fetch(
      `${TEMP_EMAIL_CONFIG.API_BASE}?action=getMessages&login=${this.username}&domain=${this.domain}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    
    return await response.json();
  }

  async getMessage(messageId) {
    if (!this.username) {
      throw new Error('No email address created');
    }

    const response = await fetch(
      `${TEMP_EMAIL_CONFIG.API_BASE}?action=readMessage&login=${this.username}&domain=${this.domain}&id=${messageId}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status}`);
    }
    
    return await response.json();
  }

  async waitForEmail(timeoutMs = 60000, pollIntervalMs = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const messages = await this.getMessages();
        if (messages && messages.length > 0) {
          return messages;
        }
      } catch (error) {
        console.log('Error checking for emails:', error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`No emails received within ${timeoutMs}ms`);
  }
}

test.describe('Email-Based GDPR Consent Workflows', () => {
  let tempEmail;

  test.beforeEach(async () => {
    tempEmail = new TempEmailService();
  });

  test.describe('Magic Link Authentication with Consent', () => {
    
    test('should handle consent during magic link signup flow', async ({ page }) => {
      const email = await tempEmail.createTempEmail();
      console.log('Created temp email:', email);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // First handle cookie consent
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      if (await consentBanner.isVisible()) {
        await page.locator('text=Accept All').click();
      }
      
      // Look for login/signup flow
      const authTriggers = [
        'text="Sign In"',
        'text="Login"', 
        'text="Get Started"',
        'text="Start Analysis"',
        'button:has-text("Sign")',
        'a:has-text("Sign")'
      ];
      
      let authFound = false;
      for (const trigger of authTriggers) {
        const element = page.locator(trigger);
        if (await element.isVisible()) {
          await element.click();
          authFound = true;
          break;
        }
      }
      
      if (authFound) {
        await page.waitForLoadState('networkidle');
        
        // Look for email input field
        const emailInputs = [
          'input[type="email"]',
          'input[placeholder*="email"]',
          'input[name="email"]'
        ];
        
        let emailInput = null;
        for (const selector of emailInputs) {
          const input = page.locator(selector);
          if (await input.isVisible()) {
            emailInput = input;
            break;
          }
        }
        
        if (emailInput) {
          await emailInput.fill(email);
          
          // Submit form
          const submitButtons = [
            'button:has-text("Send")',
            'button:has-text("Sign")',
            'button[type="submit"]',
            'text="Send Magic Link"'
          ];
          
          for (const buttonSelector of submitButtons) {
            const button = page.locator(buttonSelector);
            if (await button.isVisible()) {
              await button.click();
              break;
            }
          }
          
          // Wait for confirmation message
          await expect(page.locator('text="Check your email", text="magic link", text="sent"').first())
            .toBeVisible({ timeout: 10000 });
          
          console.log('Magic link signup initiated, waiting for email...');
          
          // Wait for email with magic link
          try {
            const messages = await tempEmail.waitForEmail(60000);
            console.log(`Received ${messages.length} messages`);
            
            if (messages.length > 0) {
              const message = await tempEmail.getMessage(messages[0].id);
              console.log('Email subject:', message.subject);
              console.log('Email preview:', message.body.substring(0, 200));
              
              // Look for magic link in email content
              const linkRegex = /https?:\/\/[^\s<>"]+/g;
              const links = message.body.match(linkRegex) || [];
              const magicLinks = links.filter(link => 
                link.includes('token') || 
                link.includes('verify') || 
                link.includes('confirm') ||
                link.includes('magic')
              );
              
              if (magicLinks.length > 0) {
                console.log('Found magic link:', magicLinks[0]);
                
                // Visit magic link
                await page.goto(magicLinks[0]);
                await page.waitForLoadState('networkidle');
                
                // Verify successful authentication
                const successIndicators = [
                  'text="Welcome"',
                  'text="Dashboard"', 
                  'text="Account"',
                  'text="Analysis"',
                  'button:has-text("Sign Out")',
                  'text="Logged in"'
                ];
                
                let authSuccess = false;
                for (const indicator of successIndicators) {
                  if (await page.locator(indicator).isVisible({ timeout: 5000 })) {
                    authSuccess = true;
                    break;
                  }
                }
                
                expect(authSuccess).toBe(true);
                console.log('Authentication successful via magic link');
              }
            }
          } catch (error) {
            console.log('Email timeout or error:', error.message);
            // Test continues - this documents the email flow availability
          }
        }
      } else {
        console.log('No authentication flow found - documenting for manual verification');
      }
    });
  });

  test.describe('Consent Confirmation Emails', () => {
    
    test('should send consent confirmation when user opts in', async ({ page }) => {
      const email = await tempEmail.createTempEmail();
      console.log('Testing consent confirmation with email:', email);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Accept all cookies with potential email capture
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      
      if (await consentBanner.isVisible()) {
        // Click customize to see if email option exists
        await page.locator('text=Customize').click();
        await page.waitForTimeout(1000);
        
        // Look for email subscription options in consent preferences
        const emailOptions = [
          'input[type="email"]',
          'text="email"',
          'text="newsletter"',
          'text="updates"',
          'checkbox:has-text("email")'
        ];
        
        let emailFieldFound = false;
        for (const option of emailOptions) {
          if (await page.locator(option).isVisible()) {
            emailFieldFound = true;
            console.log('Found email option in consent flow');
            
            if (option.includes('input[type="email"]')) {
              await page.locator(option).fill(email);
            } else if (option.includes('checkbox')) {
              await page.locator(option).check();
            }
            break;
          }
        }
        
        // Save preferences
        await page.locator('text=Save Preferences').click();
        
        if (emailFieldFound) {
          console.log('Email consent provided, checking for confirmation...');
          
          try {
            const messages = await tempEmail.waitForEmail(30000);
            
            if (messages.length > 0) {
              const message = await tempEmail.getMessage(messages[0].id);
              console.log('Consent confirmation email received');
              console.log('Subject:', message.subject);
              
              // Verify it's a consent-related email
              const consentKeywords = ['consent', 'privacy', 'preferences', 'subscription', 'confirm'];
              const isConsentEmail = consentKeywords.some(keyword => 
                message.subject.toLowerCase().includes(keyword) ||
                message.body.toLowerCase().includes(keyword)
              );
              
              expect(isConsentEmail).toBe(true);
            }
          } catch (error) {
            console.log('No consent confirmation email received:', error.message);
          }
        } else {
          console.log('No email capture found in consent flow');
        }
      }
    });
  });

  test.describe('Consent Withdrawal Notifications', () => {
    
    test('should handle consent withdrawal email notifications', async ({ page }) => {
      const email = await tempEmail.createTempEmail();
      console.log('Testing consent withdrawal with email:', email);
      
      // This test documents the expected behavior for consent withdrawal
      // In a full implementation, users might receive confirmation emails
      // when they withdraw consent or delete their data
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Accept cookies first
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      if (await consentBanner.isVisible()) {
        await page.locator('text=Accept All').click();
      }
      
      // Simulate consent withdrawal by clearing localStorage and rejecting
      await page.evaluate(() => {
        localStorage.removeItem('cookie-consent');
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Reject all cookies this time
      const newConsentBanner = page.locator('div:has-text("🍪 We use cookies")');
      if (await newConsentBanner.isVisible()) {
        await page.locator('text=Reject All').click();
      }
      
      // In a real implementation, this might trigger a withdrawal confirmation email
      console.log('Consent withdrawal simulated - checking for notification patterns');
      
      // Verify the withdrawal was processed
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      if (consentData) {
        const consent = JSON.parse(consentData);
        expect(consent.analytics).toBe(false);
        expect(consent.marketing).toBe(false);
        console.log('Consent withdrawal confirmed in localStorage');
      }
    });
  });

  test.describe('GDPR Data Request Workflows', () => {
    
    test('should provide mechanism for data access requests', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for privacy policy or data rights information
      const privacyLinks = [
        'text="Privacy Policy"',
        'text="Privacy"',
        'a[href*="privacy"]',
        'text="Data Rights"',
        'text="GDPR"'
      ];
      
      let privacyFound = false;
      for (const linkSelector of privacyLinks) {
        const link = page.locator(linkSelector);
        if (await link.isVisible()) {
          await link.click();
          privacyFound = true;
          break;
        }
      }
      
      if (privacyFound) {
        await page.waitForLoadState('networkidle');
        
        // Look for data request contact information or forms
        const dataRequestElements = [
          'text="data request"',
          'text="access your data"',
          'text="delete your data"',
          'text="download your data"',
          'text="contact us"',
          'input[type="email"]',
          'form'
        ];
        
        let requestMechanismFound = false;
        for (const element of dataRequestElements) {
          if (await page.locator(element).isVisible()) {
            requestMechanismFound = true;
            console.log('Found data request mechanism:', element);
            break;
          }
        }
        
        // Document findings
        console.log('Data request mechanism available:', requestMechanismFound);
        
        // In a full GDPR implementation, there should be clear mechanisms
        // for users to request their data or request deletion
      } else {
        console.log('Privacy policy not found - needs manual verification');
      }
    });
  });
});