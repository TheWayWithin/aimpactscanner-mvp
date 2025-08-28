// Unit Tests for CancellationModal Component
// Tests UI interactions, form validation, and user experience
// Uses React Testing Library and Jest DOM matchers

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CancellationModal from '../../src/components/CancellationModal.jsx'

// Mock Supabase client
const mockInvoke = vi.fn()
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}))

/**
 * TEST SUITE: CancellationModal Component Tests
 * 
 * This test suite validates the CancellationModal component:
 * 
 * 1. UI Rendering and Visibility
 * 2. Form Interactions and Validation
 * 3. Cancellation Process Flow
 * 4. Success/Error State Handling
 * 5. User Experience Elements
 * 6. Feedback Collection
 */

describe('CancellationModal Component', () => {
  let user
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    user = userEvent.setup()
    mockInvoke.mockClear()
    mockOnClose.mockClear()
    mockOnSuccess.mockClear()
    
    // Reset window.location.reload mock
    delete window.location
    window.location = { reload: vi.fn() }
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
  })

  describe('Modal Visibility and Basic Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <CancellationModal 
          isOpen={false} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      expect(screen.queryByText('Cancel Your Subscription')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      expect(screen.getByText('Cancel Your Subscription')).toBeInTheDocument()
      expect(screen.getByText('30-Day Money Back Guarantee')).toBeInTheDocument()
      expect(screen.getByText("We're sorry to see you go! Your feedback helps us improve.")).toBeInTheDocument()
    })

    it('should display all required UI elements', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Header elements
      expect(screen.getByRole('heading', { name: 'Cancel Your Subscription' })).toBeInTheDocument()
      
      // Guarantee badge
      expect(screen.getByText('30-Day Money Back Guarantee')).toBeInTheDocument()
      expect(screen.getByText("If you're within 30 days of subscribing, you'll receive a full refund - no questions asked!")).toBeInTheDocument()

      // Form elements
      expect(screen.getByLabelText(/Why are you canceling/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Any additional feedback/)).toBeInTheDocument()

      // Buttons
      expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep Subscription' })).toBeInTheDocument()

      // What happens next section
      expect(screen.getByText('What happens when you cancel:')).toBeInTheDocument()
      expect(screen.getByText('Immediate cancellation of your Coffee tier subscription')).toBeInTheDocument()
      expect(screen.getByText("You'll be switched to the Free tier (3 analyses/month)")).toBeInTheDocument()
      expect(screen.getByText('If within 30 days, you\'ll receive a full refund')).toBeInTheDocument()
      expect(screen.getByText('You can resubscribe anytime')).toBeInTheDocument()

      // Support link
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
    })

    it('should display all cancellation reason options', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const reasonSelect = screen.getByLabelText(/Why are you canceling/)
      
      expect(reasonSelect).toBeInTheDocument()
      
      // Check that all options are present
      const expectedOptions = [
        'Select a reason...',
        'Too expensive',
        'Not using it enough',
        'Missing features I need',
        'Technical issues',
        'Found a better alternative',
        'Just need to pause temporarily',
        'Other'
      ]

      expectedOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('should update reason selection', async () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const reasonSelect = screen.getByLabelText(/Why are you canceling/)
      
      await user.selectOptions(reasonSelect, 'too_expensive')
      expect(reasonSelect.value).toBe('too_expensive')
      
      await user.selectOptions(reasonSelect, 'technical_issues')
      expect(reasonSelect.value).toBe('technical_issues')
    })

    it('should update feedback textarea', async () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const feedbackTextarea = screen.getByLabelText(/Any additional feedback/)
      const feedbackText = "Great service but too expensive for my current needs"
      
      await user.type(feedbackTextarea, feedbackText)
      expect(feedbackTextarea.value).toBe(feedbackText)
    })

    it('should handle form submission with both reason and feedback', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled',
          eligibleForRefund: false,
          daysSinceStart: 45
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Fill out form
      const reasonSelect = screen.getByLabelText(/Why are you canceling/)
      const feedbackTextarea = screen.getByLabelText(/Any additional feedback/)
      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })

      await user.selectOptions(reasonSelect, 'not_using')
      await user.type(feedbackTextarea, 'Service is good but I dont need it right now')

      // Submit form
      await user.click(cancelButton)

      // Verify function was called with correct data
      expect(mockInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: {
          reason: 'not_using',
          feedback: 'Service is good but I dont need it right now',
          immediately: true
        }
      })
    })

    it('should handle form submission with no reason or feedback', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled'
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      // Verify function was called with empty values
      expect(mockInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: {
          reason: '',
          feedback: '',
          immediately: true
        }
      })
    })
  })

  describe('Cancellation Process States', () => {
    it('should show processing state during cancellation', async () => {
      // Mock a delayed response
      mockInvoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      )

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      // Should show processing state immediately
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(cancelButton).toBeDisabled()
      
      // Form elements should be disabled
      const reasonSelect = screen.getByLabelText(/Why are you canceling/)
      const feedbackTextarea = screen.getByLabelText(/Any additional feedback/)
      expect(reasonSelect).toBeDisabled()
      expect(feedbackTextarea).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should reset processing state after successful cancellation', async () => {
      vi.useFakeTimers()
      
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled'
        }
      })

      // Mock alert to prevent actual alert dialogs in tests
      window.alert = vi.fn()

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })

      vi.useRealTimers()
    })

    it('should handle cancellation errors gracefully', async () => {
      const errorMessage = 'No active subscription found'
      mockInvoke.mockResolvedValue({
        error: { message: errorMessage }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Should not trigger success callbacks
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()

      // Button should be enabled again
      expect(cancelButton).not.toBeDisabled()
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument()
    })

    it('should handle network errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Success Scenarios and User Feedback', () => {
    beforeEach(() => {
      window.alert = vi.fn()
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show refund success message with amount', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled',
          refund: {
            amount: 5.00,
            currency: 'usd'
          },
          daysSinceStart: 15
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Refund processed: $5 USD')
        )
      })

      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should show eligible for refund message without processed refund', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled',
          eligibleForRefund: true,
          daysSinceStart: 20
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining("You're eligible for our 30-day money-back guarantee")
        )
      })
    })

    it('should show end-of-period message for non-refundable cancellations', async () => {
      const endDate = '2024-02-15T12:00:00Z'
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled',
          eligibleForRefund: false,
          daysSinceStart: 45,
          endsAt: endDate
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Your access will continue until')
        )
      })
    })

    it('should reload page after successful cancellation', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Your subscription has been canceled'
        }
      })

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })

      // Fast-forward the timeout for page reload
      vi.advanceTimersByTime(1500)
      
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when "Keep Subscription" button is clicked', async () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const keepButton = screen.getByRole('button', { name: 'Keep Subscription' })
      await user.click(keepButton)

      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should disable close button during processing', async () => {
      mockInvoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      )

      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel Subscription' })
      const keepButton = screen.getByRole('button', { name: 'Keep Subscription' })
      
      await user.click(cancelButton)

      expect(keepButton).toBeDisabled()
    })
  })

  describe('Accessibility and UX Features', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Check for proper labeling
      expect(screen.getByLabelText(/Why are you canceling/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Any additional feedback/)).toBeInTheDocument()

      // Check button roles
      expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep Subscription' })).toBeInTheDocument()

      // Check heading hierarchy
      expect(screen.getByRole('heading', { name: 'Cancel Your Subscription' })).toBeInTheDocument()
    })

    it('should have working support link', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const supportLink = screen.getByText('Contact Support')
      expect(supportLink).toHaveAttribute('href', 'mailto:support@aimpactscanner.com')
    })

    it('should show guarantee badge prominently', () => {
      render(
        <CancellationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const guaranteeBadge = screen.getByText('30-Day Money Back Guarantee')
      expect(guaranteeBadge).toBeInTheDocument()
      
      // Should have proper styling classes for visibility
      const badgeContainer = guaranteeBadge.closest('.bg-green-50')
      expect(badgeContainer).toBeInTheDocument()
    })
  })
})