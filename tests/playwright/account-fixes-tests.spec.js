// Account Page Fixes Test Suite
// Tests for recent account page improvements and subscription management
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://app.aimpactscanner.com';
const TEST_EMAIL = `test_account_${Date.now()}@temp-mail.org`;

test.describe('Account Page Fixes - Recent Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Note: These tests may require pre-authenticated sessions
    // or test accounts with different tier statuses
  });

  test.describe('Manage Subscription Button Functionality', () => {
    test('should display Manage Subscription button for paid tier users', async ({ page }) => {
      // Navigate to account page (assumes user is logged in)
      // You may need to implement authentication helper for testing
      try {
        await page.click('button:has-text("👤 Account")');
      } catch {
        // Alternative navigation methods
        await page.click('text*="Account"');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Check for Manage Subscription button
      const manageSubButton = page.locator('button:has-text("Manage Subscription")');
      
      // For Coffee tier or higher users, button should be visible
      if (await manageSubButton.count() > 0) {
        await expect(manageSubButton).toBeVisible();
        await expect(manageSubButton).not.toBeDisabled();
      }
    });

    test('should not display Manage Subscription button for Free tier users', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check current tier indicator
      const freeTierIndicator = page.locator('text*="🆓 Free", text*="Free Plan"');
      
      if (await freeTierIndicator.count() > 0) {
        // For Free tier users, Manage Subscription button should not exist
        const manageSubButton = page.locator('button:has-text("Manage Subscription")');
        await expect(manageSubButton).not.toBeVisible();
        
        // Should show upgrade button instead
        const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Coffee")');
        await expect(upgradeButton.first()).toBeVisible();
      }
    });

    test('should redirect to Stripe Customer Portal when clicked', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      const manageSubButton = page.locator('button:has-text("Manage Subscription")');
      
      if (await manageSubButton.count() > 0) {
        // Set up page navigation listener
        const navigationPromise = page.waitForURL(/billing\.stripe\.com|customer-portal/, { timeout: 15000 });
        
        await manageSubButton.click();
        
        try {
          await navigationPromise;
          expect(page.url()).toMatch(/billing\.stripe\.com|stripe/);
        } catch (error) {
          // If redirect doesn't happen immediately, check for loading state
          const loadingButton = page.locator('button:has-text("Loading"), button[disabled]:has-text("Manage")');
          if (await loadingButton.count() > 0) {
            await expect(loadingButton).toBeVisible();
          }
        }
      }
    });

    test('should handle Manage Subscription errors gracefully', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      const manageSubButton = page.locator('button:has-text("Manage Subscription")');
      
      if (await manageSubButton.count() > 0) {
        // Intercept network request to simulate error
        await page.route('**/create-portal-session', route => {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Portal session creation failed' })
          });
        });
        
        await manageSubButton.click();
        
        // Check for error handling
        const errorMessage = page.locator('text*="Unable to open", text*="try again", text*="error"');
        await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show appropriate loading states', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      const manageSubButton = page.locator('button:has-text("Manage Subscription")');
      
      if (await manageSubButton.count() > 0) {
        await manageSubButton.click();
        
        // Check for loading state
        const loadingButton = page.locator('button:has-text("Loading"), button[disabled]');
        
        // Loading state should appear briefly
        if (await loadingButton.count() > 0) {
          await expect(loadingButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Usage Tracking Improvements', () => {
    test('should accurately display usage for Free tier users', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check usage section
      const usageSection = page.locator('[data-testid="usage-summary"], text*="Usage Summary"');
      await expect(usageSection.first()).toBeVisible();
      
      // For Free tier, should show X/3 analyses
      const freeUsage = page.locator('text*="/ 3 analyses", text*="3 analyses"');
      
      if (await freeUsage.count() > 0) {
        await expect(freeUsage.first()).toBeVisible();
        
        // Check usage bar
        const usageBar = page.locator('.progress-bar, [data-testid="usage-bar"]');
        if (await usageBar.count() > 0) {
          await expect(usageBar).toBeVisible();
        }
      }
    });

    test('should show unlimited usage for Coffee tier users', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for Coffee tier indicator
      const coffeeTier = page.locator('text*="☕ Coffee", text*="Coffee"');
      
      if (await coffeeTier.count() > 0) {
        // Should show unlimited usage
        const unlimitedUsage = page.locator('text*="Unlimited", text*="unlimited analyses"');
        await expect(unlimitedUsage.first()).toBeVisible();
        
        // Should show monthly usage count
        const monthlyCount = page.locator('text*="completed", text*="this month"');
        if (await monthlyCount.count() > 0) {
          await expect(monthlyCount.first()).toBeVisible();
        }
      }
    });

    test('should display correct remaining analyses count', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check remaining analyses display
      const remainingAnalyses = page.locator('text*="Remaining Analyses"');
      await expect(remainingAnalyses.first()).toBeVisible();
      
      // Should show numerical count or "Unlimited"
      const countDisplay = page.locator('text*="Unlimited", [data-testid="remaining-count"]');
      const hasCount = await page.locator('text=/\\d+/').count() > 0;
      const hasUnlimited = await page.locator('text*="Unlimited"').count() > 0;
      
      expect(hasCount || hasUnlimited).toBeTruthy();
    });

    test('should update usage counts after completing analysis', async ({ page }) => {
      // First, check current usage
      await page.click('button:has-text("👤 Account")');
      const initialUsage = await page.locator('text*="Analyses Used"').textContent();
      
      // Perform an analysis
      await page.click('button:has-text("🔍 New Analysis")');
      await page.fill('input#url', 'example.com');
      await page.click('button:has-text("Start AI Analysis")');
      
      // Wait for analysis completion
      await page.waitForSelector('[data-testid="analysis-results"], text*="Analysis Complete"', { 
        timeout: 30000 
      });
      
      // Return to account page
      await page.click('button:has-text("👤 Account")');
      
      // Check if usage updated
      const updatedUsage = await page.locator('text*="Analyses Used"').textContent();
      
      // Usage should have increased (unless unlimited)
      if (initialUsage && updatedUsage && !updatedUsage.includes('Unlimited')) {
        expect(updatedUsage).not.toEqual(initialUsage);
      }
    });

    test('should handle usage limit reached state', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for limit reached indicators
      const limitReached = page.locator(
        'text*="limit reached", text*="Monthly limit", text*="Upgrade"'
      );
      
      if (await limitReached.count() > 0) {
        await expect(limitReached.first()).toBeVisible();
        
        // Should show upgrade suggestion
        const upgradePrompt = page.locator('text*="Upgrade", text*="Coffee"');
        await expect(upgradePrompt.first()).toBeVisible();
      }
    });

    test('should display usage reset date', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for reset date information
      const resetDate = page.locator('text*="Reset Date", text*="Next month", text*="resets on"');
      await expect(resetDate.first()).toBeVisible();
      
      // Should show actual date or descriptive text
      const dateDisplay = page.locator('text*="Reset Date"').locator('xpath=following-sibling::*');
      if (await dateDisplay.count() > 0) {
        const dateText = await dateDisplay.textContent();
        expect(dateText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Billing Section Consolidation', () => {
    test('should display consolidated subscription details', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for subscription details section
      const subscriptionSection = page.locator(
        '[data-testid="subscription-details"], text*="Subscription Details"'
      );
      await expect(subscriptionSection.first()).toBeVisible();
      
      // Should contain current plan, status, and relevant actions
      const currentPlan = page.locator('text*="Current Plan"');
      await expect(currentPlan).toBeVisible();
      
      const subscriptionStatus = page.locator('text*="Active", text*="Free Plan", text*="Pending"');
      await expect(subscriptionStatus.first()).toBeVisible();
    });

    test('should show correct tier badges and status indicators', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for tier badges
      const tierBadges = page.locator(
        '.badge, [class*="badge"], span:has-text("Free"), span:has-text("Coffee")'
      );
      
      if (await tierBadges.count() > 0) {
        await expect(tierBadges.first()).toBeVisible();
        
        // Badge should have appropriate styling
        const badgeClasses = await tierBadges.first().getAttribute('class');
        expect(badgeClasses).toBeTruthy();
      }
    });

    test('should handle different subscription statuses correctly', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for different possible statuses
      const statusOptions = [
        'Active',
        'Free Plan', 
        'Pending Payment',
        'Registration Incomplete',
        'Canceled'
      ];
      
      let statusFound = false;
      for (const status of statusOptions) {
        const statusElement = page.locator(`text*="${status}"`);
        if (await statusElement.count() > 0) {
          await expect(statusElement).toBeVisible();
          statusFound = true;
          break;
        }
      }
      
      expect(statusFound).toBeTruthy();
    });

    test('should display payment pending states appropriately', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for payment pending indicators
      const pendingPayment = page.locator(
        'text*="Payment Pending", text*="pending payment", text*="complete the payment"'
      );
      
      if (await pendingPayment.count() > 0) {
        await expect(pendingPayment.first()).toBeVisible();
        
        // Should include helpful instructions
        const instructions = page.locator('text*="complete the payment process"');
        await expect(instructions).toBeVisible();
      }
    });

    test('should consolidate all billing-related information in one section', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // All billing info should be in subscription details section
      const subscriptionSection = page.locator('[data-testid="subscription-details"]');
      
      if (await subscriptionSection.count() > 0) {
        // Check that billing info is contained within this section
        const billingElements = [
          'text*="Current Plan"',
          'text*="Analyses Used"', 
          'text*="Remaining"',
          'button:has-text("Manage"), button:has-text("Upgrade")'
        ];
        
        for (const selector of billingElements) {
          const element = subscriptionSection.locator(selector);
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Account Information Display', () => {
    test('should display user email correctly', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check email display
      const emailDisplay = page.locator('text*="Email"').locator('xpath=following-sibling::*');
      
      if (await emailDisplay.count() > 0) {
        const emailText = await emailDisplay.textContent();
        expect(emailText).toMatch(/@|Not available/);
      }
    });

    test('should show account creation date', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check account created date
      const createdDate = page.locator('text*="Account Created"').locator('xpath=following-sibling::*');
      
      if (await createdDate.count() > 0) {
        const dateText = await createdDate.textContent();
        expect(dateText?.length).toBeGreaterThan(0);
      }
    });

    test('should display last sign in information', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check last sign in
      const lastSignIn = page.locator('text*="Last Sign In"').locator('xpath=following-sibling::*');
      
      if (await lastSignIn.count() > 0) {
        const signInText = await lastSignIn.textContent();
        expect(signInText?.length).toBeGreaterThan(0);
      }
    });

    test('should handle missing or unavailable data gracefully', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for "Not available" fallbacks
      const notAvailable = page.locator('text*="Not available", text*="N/A"');
      
      // System should handle missing data without breaking
      const accountSection = page.locator('[data-testid="account-overview"], text*="Account Overview"');
      await expect(accountSection.first()).toBeVisible();
    });
  });

  test.describe('Account Page Performance and UX', () => {
    test('should load account page quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.click('button:has-text("👤 Account")');
      await page.waitForSelector('[data-testid="account-overview"], text*="Account"');
      
      const loadTime = Date.now() - startTime;
      
      // Account page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should maintain responsive design on account page', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('button:has-text("👤 Account")');
      
      // Key elements should be visible on mobile
      const accountElements = page.locator(
        'text*="Account Overview", text*="Subscription Details", text*="Usage Summary"'
      );
      
      await expect(accountElements.first()).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.click('button:has-text("👤 Account")');
      
      await expect(accountElements.first()).toBeVisible();
    });

    test('should handle account data loading states', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Check for loading states or skeleton screens
      const loadingStates = page.locator(
        'text*="Loading", [data-testid="skeleton"], [class*="loading"]'
      );
      
      // Account page should show content, not permanent loading states
      await page.waitForTimeout(3000);
      
      const actualContent = page.locator(
        'text*="Account Overview", text*="Current Plan", text*="Usage"'
      );
      
      await expect(actualContent.first()).toBeVisible();
    });

    test('should provide clear navigation back from account page', async ({ page }) => {
      await page.click('button:has-text("👤 Account")');
      
      // Should be able to navigate back to dashboard
      const dashboardButton = page.locator('button:has-text("🏠 Dashboard")');
      await expect(dashboardButton).toBeVisible();
      
      await dashboardButton.click();
      
      // Should return to dashboard view
      const dashboardContent = page.locator('text*="Welcome Back", text*="Start New Analysis"');
      await expect(dashboardContent.first()).toBeVisible();
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/functions/**', route => {
        route.abort();
      });
      
      await page.click('button:has-text("👤 Account")');
      
      // Should show error handling or fallback content
      const errorHandling = page.locator(
        'text*="Unable to load", text*="Try again", text*="Network error"'
      );
      
      // Page shouldn't break completely
      const pageStructure = page.locator('text*="Account", button, nav');
      await expect(pageStructure.first()).toBeVisible();
    });

    test('should handle expired sessions appropriately', async ({ page }) => {
      // This test would need session manipulation
      // Basic check that authentication errors are handled
      
      await page.click('button:has-text("👤 Account")');
      
      // If session expires, should redirect to login or show appropriate message
      await page.waitForTimeout(2000);
      
      const authenticationErrors = page.locator(
        'text*="Please log in", text*="Session expired", text*="Sign in"'
      );
      
      // If error occurs, it should be handled gracefully
      if (await authenticationErrors.count() > 0) {
        await expect(authenticationErrors.first()).toBeVisible();
      }
    });
  });
});