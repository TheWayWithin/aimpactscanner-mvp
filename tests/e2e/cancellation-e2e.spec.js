// End-to-End Tests for Cancellation Flow
// Tests the complete user journey using Playwright browser automation
// Including UI interactions, modal behavior, and success/error flows

import { test, expect } from '@playwright/test'

/**
 * TEST SUITE: Cancellation End-to-End Tests
 * 
 * This test suite validates the complete user experience:
 * 
 * 1. Opening cancellation modal from account dashboard
 * 2. Form interactions and validation
 * 3. 30-day guarantee messaging and UI
 * 4. Success/error handling and user feedback
 * 5. Page state changes after cancellation
 * 6. Modal accessibility and keyboard navigation
 */

test.describe('Cancellation Flow E2E Tests', () => {
  let page

  // Test data
  const testUser = {
    email: 'test-cancellation@example.com',
    password: 'test-password-123'
  }

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Navigate to the application
    await page.goto('http://localhost:3000')
    
    // Mock successful authentication for testing
    await page.evaluate(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-123',
          email: 'test@example.com'
        }
      }))
    })

    // Set up interceptors for API calls
    await page.route('**/functions/v1/cancel-subscription', async route => {
      // We'll customize this response in individual tests
      await route.continue()
    })
  })

  test.describe('Modal Opening and Basic UI', () => {
    test('should open cancellation modal from account dashboard', async () => {
      // Navigate to account dashboard (assuming this is where cancel button lives)
      await page.goto('http://localhost:3000/account')
      
      // Look for cancel subscription button
      const cancelButton = page.locator('text=Cancel Subscription')
      await expect(cancelButton).toBeVisible()
      
      // Click to open modal
      await cancelButton.click()
      
      // Verify modal is open
      await expect(page.locator('text=Cancel Your Subscription')).toBeVisible()
      await expect(page.locator('text=30-Day Money Back Guarantee')).toBeVisible()
    })

    test('should display all required UI elements in modal', async () => {
      // Open modal (assuming it's accessible directly for testing)
      await page.evaluate(() => {
        // Simulate modal being opened
        window.testOpenCancellationModal = true
      })
      
      await page.goto('http://localhost:3000/account')
      
      // Wait for modal to be visible
      await expect(page.locator('[data-testid="cancellation-modal"]')).toBeVisible()
      
      // Check all required elements
      await expect(page.locator('text=Cancel Your Subscription')).toBeVisible()
      await expect(page.locator('text=30-Day Money Back Guarantee')).toBeVisible()
      await expect(page.locator('text=Why are you canceling?')).toBeVisible()
      await expect(page.locator('text=Any additional feedback?')).toBeVisible()
      await expect(page.locator('text=What happens when you cancel:')).toBeVisible()
      
      // Check buttons
      await expect(page.locator('button:text("Cancel Subscription")')).toBeVisible()
      await expect(page.locator('button:text("Keep Subscription")')).toBeVisible()
      
      // Check guarantee information
      await expect(page.locator('text=If you\'re within 30 days of subscribing, you\'ll receive a full refund')).toBeVisible()
      
      // Check support link
      await expect(page.locator('a[href="mailto:support@aimpactscanner.com"]')).toBeVisible()
    })

    test('should show all cancellation reason options', async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
      
      // Click on the reason dropdown
      const reasonSelect = page.locator('select:near(:text("Why are you canceling"))')
      await reasonSelect.click()
      
      // Verify all options are present
      const expectedOptions = [
        'Too expensive',
        'Not using it enough',
        'Missing features I need',
        'Technical issues',
        'Found a better alternative',
        'Just need to pause temporarily',
        'Other'
      ]
      
      for (const option of expectedOptions) {
        await expect(page.locator(`option:text("${option}")`)).toBeVisible()
      }
    })
  })

  test.describe('Form Interactions', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
      await expect(page.locator('text=Cancel Your Subscription')).toBeVisible()
    })

    test('should allow selecting cancellation reason', async () => {
      const reasonSelect = page.locator('select:near(:text("Why are you canceling"))')
      
      await reasonSelect.selectOption('too_expensive')
      await expect(reasonSelect).toHaveValue('too_expensive')
      
      await reasonSelect.selectOption('technical_issues')
      await expect(reasonSelect).toHaveValue('technical_issues')
    })

    test('should allow entering feedback text', async () => {
      const feedbackTextarea = page.locator('textarea:near(:text("Any additional feedback"))')
      const feedbackText = 'The service is great but too expensive for my current budget'
      
      await feedbackTextarea.fill(feedbackText)
      await expect(feedbackTextarea).toHaveValue(feedbackText)
    })

    test('should handle form submission with complete data', async () => {
      // Set up API response mock
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Your subscription has been canceled',
            eligibleForRefund: true,
            daysSinceStart: 15,
            refund: {
              amount: 5.00,
              currency: 'usd'
            }
          })
        })
      })

      // Fill out the form
      await page.locator('select:near(:text("Why are you canceling"))').selectOption('not_using')
      await page.locator('textarea:near(:text("Any additional feedback"))').fill('Service is good but I dont need it right now')
      
      // Mock alert to capture the success message
      let alertMessage = ''
      page.on('dialog', async dialog => {
        alertMessage = dialog.message()
        await dialog.accept()
      })
      
      // Submit the form
      await page.locator('button:text("Cancel Subscription")').click()
      
      // Wait for success alert
      await page.waitForFunction(() => window.alertShown, {}, { timeout: 5000 })
      
      expect(alertMessage).toContain('Subscription canceled successfully')
      expect(alertMessage).toContain('Refund processed: $5 USD')
    })

    test('should submit form with no reason or feedback', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        const request = await route.request().postDataJSON()
        expect(request.reason).toBe('')
        expect(request.feedback).toBe('')
        expect(request.immediately).toBe(true)
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Your subscription has been canceled'
          })
        })
      })

      // Submit without filling anything
      await page.locator('button:text("Cancel Subscription")').click()
      
      // Should still work
      await expect(page.locator('text=Processing...')).toBeVisible()
    })
  })

  test.describe('Processing States', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
    })

    test('should show processing state during cancellation', async () => {
      // Mock a delayed response
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      // Should immediately show processing state
      await expect(page.locator('text=Processing...')).toBeVisible()
      await expect(page.locator('button:text("Processing...")')).toBeDisabled()
      
      // Form elements should be disabled
      await expect(page.locator('select:near(:text("Why are you canceling"))')).toBeDisabled()
      await expect(page.locator('textarea:near(:text("Any additional feedback"))')).toBeDisabled()
      await expect(page.locator('button:text("Keep Subscription")')).toBeDisabled()
    })

    test('should handle successful cancellation with refund message', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Your subscription has been canceled',
            refund: {
              amount: 5.00,
              currency: 'usd'
            },
            daysSinceStart: 10
          })
        })
      })

      let alertMessage = ''
      page.on('dialog', async dialog => {
        alertMessage = dialog.message()
        await dialog.accept()
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      await page.waitForFunction(() => window.alertShown)
      
      expect(alertMessage).toContain('Subscription canceled successfully')
      expect(alertMessage).toContain('Refund processed: $5 USD')
      expect(alertMessage).toContain('Thank you for trying AImpactScanner')
    })

    test('should handle successful cancellation without refund', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Your subscription has been canceled',
            eligibleForRefund: false,
            daysSinceStart: 45,
            endsAt: '2024-02-15T12:00:00Z'
          })
        })
      })

      let alertMessage = ''
      page.on('dialog', async dialog => {
        alertMessage = dialog.message()
        await dialog.accept()
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      await page.waitForFunction(() => window.alertShown)
      
      expect(alertMessage).toContain('Subscription canceled successfully')
      expect(alertMessage).toContain('Your access will continue until')
      expect(alertMessage).toContain('Thank you for being a valued customer')
    })

    test('should handle cancellation errors gracefully', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'No active subscription found',
            success: false
          })
        })
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      // Should show error message in the modal
      await expect(page.locator('text=No active subscription found')).toBeVisible()
      
      // Button should be enabled again
      await expect(page.locator('button:text("Cancel Subscription")')).toBeEnabled()
      
      // Modal should remain open
      await expect(page.locator('text=Cancel Your Subscription')).toBeVisible()
    })
  })

  test.describe('Modal Controls and Navigation', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
    })

    test('should close modal when "Keep Subscription" is clicked', async () => {
      await page.locator('button:text("Keep Subscription")').click()
      
      // Modal should be hidden
      await expect(page.locator('text=Cancel Your Subscription')).not.toBeVisible()
    })

    test('should close modal with Escape key', async () => {
      await page.keyboard.press('Escape')
      
      await expect(page.locator('text=Cancel Your Subscription')).not.toBeVisible()
    })

    test('should handle modal overlay click', async () => {
      // Click on the modal overlay (outside the modal content)
      await page.locator('.fixed.inset-0.bg-black.bg-opacity-50').click({ position: { x: 10, y: 10 } })
      
      await expect(page.locator('text=Cancel Your Subscription')).not.toBeVisible()
    })

    test('should reload page after successful cancellation', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Your subscription has been canceled'
          })
        })
      })

      // Mock page reload
      let pageReloaded = false
      await page.evaluate(() => {
        const originalReload = window.location.reload
        window.location.reload = () => {
          window.pageReloaded = true
        }
      })

      page.on('dialog', async dialog => {
        await dialog.accept()
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      // Wait for the reload timer (1500ms)
      await page.waitForTimeout(1600)
      
      const reloadCalled = await page.evaluate(() => window.pageReloaded)
      expect(reloadCalled).toBe(true)
    })
  })

  test.describe('Accessibility and UX', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
    })

    test('should support keyboard navigation', async () => {
      // Tab through form elements
      await page.keyboard.press('Tab') // Should focus reason select
      await expect(page.locator('select:near(:text("Why are you canceling"))')).toBeFocused()
      
      await page.keyboard.press('Tab') // Should focus feedback textarea
      await expect(page.locator('textarea:near(:text("Any additional feedback"))')).toBeFocused()
      
      await page.keyboard.press('Tab') // Should focus Cancel button
      await expect(page.locator('button:text("Cancel Subscription")')).toBeFocused()
      
      await page.keyboard.press('Tab') // Should focus Keep button
      await expect(page.locator('button:text("Keep Subscription")')).toBeFocused()
    })

    test('should have proper ARIA labels and roles', async () => {
      // Check for proper labeling
      const reasonSelect = page.locator('select:near(:text("Why are you canceling"))')
      await expect(reasonSelect).toHaveAttribute('aria-label', /Why are you canceling/)
      
      const feedbackTextarea = page.locator('textarea:near(:text("Any additional feedback"))')
      await expect(feedbackTextarea).toHaveAttribute('aria-label', /Any additional feedback/)
      
      // Check button roles
      const cancelButton = page.locator('button:text("Cancel Subscription")')
      const keepButton = page.locator('button:text("Keep Subscription")')
      
      await expect(cancelButton).toHaveAttribute('role', 'button')
      await expect(keepButton).toHaveAttribute('role', 'button')
    })

    test('should have working support link', async () => {
      const supportLink = page.locator('text=Contact Support')
      await expect(supportLink).toHaveAttribute('href', 'mailto:support@aimpactscanner.com')
    })

    test('should display guarantee badge prominently', async () => {
      const guaranteeBadge = page.locator('text=30-Day Money Back Guarantee')
      await expect(guaranteeBadge).toBeVisible()
      
      // Should be in a highlighted container
      const badgeContainer = page.locator('.bg-green-50:has-text("30-Day Money Back Guarantee")')
      await expect(badgeContainer).toBeVisible()
    })

    test('should show clear what happens next information', async () => {
      await expect(page.locator('text=What happens when you cancel:')).toBeVisible()
      
      const expectedItems = [
        'Immediate cancellation of your Coffee tier subscription',
        'You\'ll be switched to the Free tier (3 analyses/month)',
        'If within 30 days, you\'ll receive a full refund',
        'You can resubscribe anytime'
      ]
      
      for (const item of expectedItems) {
        await expect(page.locator(`text=${item}`)).toBeVisible()
      }
    })
  })

  test.describe('Edge Cases and Error Conditions', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/account')
      await page.locator('text=Cancel Subscription').click()
    })

    test('should handle network failures', async () => {
      // Mock network failure
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.abort('failed')
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      // Should show generic error message
      await expect(page.locator('text=Failed to cancel subscription')).toBeVisible()
    })

    test('should handle authentication failures', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized',
            success: false
          })
        })
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      await expect(page.locator('text=Unauthorized')).toBeVisible()
    })

    test('should handle server errors', async () => {
      await page.route('**/functions/v1/cancel-subscription', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
            success: false
          })
        })
      })

      await page.locator('button:text("Cancel Subscription")').click()
      
      await expect(page.locator('text=Internal server error')).toBeVisible()
    })

    test('should prevent double-submission', async () => {
      let requestCount = 0
      
      await page.route('**/functions/v1/cancel-subscription', async route => {
        requestCount++
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      const cancelButton = page.locator('button:text("Cancel Subscription")')
      
      // Click multiple times rapidly
      await cancelButton.click()
      await cancelButton.click()
      await cancelButton.click()
      
      // Should only make one request
      await page.waitForTimeout(1100)
      expect(requestCount).toBe(1)
    })
  })
})