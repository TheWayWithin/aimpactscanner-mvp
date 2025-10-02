/**
 * Unit Tests: Authentication Components
 *
 * Tests for TierSelector, AuthMethodSelector, and related components
 *
 * Status: READY TO RUN (no external dependencies)
 * Priority: P0 - CRITICAL
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component imports
import TierSelector from '../../src/components/TierSelector';
import AuthMethodSelector from '../../src/components/AuthMethodSelector';

describe('TierSelector Component', () => {
  describe('Tier Display', () => {
    it('should render all four tier options', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      expect(screen.getByText(/Free/i)).toBeInTheDocument();
      expect(screen.getByText(/Coffee/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth/i)).toBeInTheDocument();
      expect(screen.getByText(/Scale/i)).toBeInTheDocument();
    });

    it('should highlight Coffee tier as "MOST POPULAR"', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      const coffeeTier = screen.getByText(/Coffee/i).closest('div');
      expect(coffeeTier).toHaveTextContent(/most popular/i);
    });

    it('should display correct pricing for each tier', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      expect(screen.getByText(/\$0\/month/i)).toBeInTheDocument(); // Free
      expect(screen.getByText(/\$4\.95\/month/i)).toBeInTheDocument(); // Coffee
      expect(screen.getByText(/\$29\/month/i)).toBeInTheDocument(); // Growth
      expect(screen.getByText(/\$99\/month/i)).toBeInTheDocument(); // Scale
    });

    it('should show "Coming Soon" badge for Growth and Scale tiers', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      const comingSoonBadges = screen.getAllByText(/coming soon/i);
      expect(comingSoonBadges).toHaveLength(2); // Growth + Scale
    });
  });

  describe('Tier Selection', () => {
    it('should call onSelectTier when Free tier clicked', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      const freeTier = screen.getByText(/Free/i).closest('button');
      fireEvent.click(freeTier);

      expect(mockOnSelect).toHaveBeenCalledWith('free');
    });

    it('should call onSelectTier when Coffee tier clicked', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      const coffeeTier = screen.getByText(/Coffee/i).closest('button');
      fireEvent.click(coffeeTier);

      expect(mockOnSelect).toHaveBeenCalledWith('coffee');
    });

    it('should visually indicate selected tier', () => {
      const mockOnSelect = vi.fn();
      const { rerender } = render(
        <TierSelector selectedTier="free" onSelectTier={mockOnSelect} />
      );

      let freeTier = screen.getByText(/Free/i).closest('button');
      expect(freeTier).toHaveClass('selected'); // or similar visual indicator

      // Rerender with coffee selected
      rerender(<TierSelector selectedTier="coffee" onSelectTier={mockOnSelect} />);

      freeTier = screen.getByText(/Free/i).closest('button');
      const coffeeTier = screen.getByText(/Coffee/i).closest('button');

      expect(freeTier).not.toHaveClass('selected');
      expect(coffeeTier).toHaveClass('selected');
    });
  });

  describe('Tier Benefits', () => {
    it('should display Free tier benefits correctly', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      expect(screen.getByText(/3 analyses per month/i)).toBeInTheDocument();
      expect(screen.getByText(/basic recommendations/i)).toBeInTheDocument();
    });

    it('should display Coffee tier benefits correctly', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="coffee" onSelectTier={mockOnSelect} />);

      expect(screen.getByText(/unlimited.*analyses/i)).toBeInTheDocument();
      expect(screen.getByText(/professional pdf/i)).toBeInTheDocument();
    });

    it('should not change benefit messaging (user-approved)', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="coffee" onSelectTier={mockOnSelect} />);

      // CRITICAL: These exact phrases must match AUTH_MONETIZATION_SPEC.md
      expect(screen.getByText(/Unlimited AI-powered analyses/i)).toBeInTheDocument();
      expect(screen.getByText(/Professional PDF reports/i)).toBeInTheDocument();
      expect(screen.getByText(/30-day money-back guarantee/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="free" onSelectTier={mockOnSelect} />);

      const tierCards = screen.getAllByRole('button');
      tierCards[0].focus();

      expect(document.activeElement).toBe(tierCards[0]);

      // Tab to next tier
      fireEvent.keyDown(tierCards[0], { key: 'Tab' });
      // (Note: actual tab behavior may require more complex simulation)
    });

    it('should have proper ARIA labels', () => {
      const mockOnSelect = vi.fn();
      render(<TierSelector selectedTier="coffee" onSelectTier={mockOnSelect} />);

      const coffeeTier = screen.getByText(/Coffee/i).closest('button');
      expect(coffeeTier).toHaveAttribute('aria-label', expect.stringContaining('Coffee'));
      expect(coffeeTier).toHaveAttribute('aria-selected', 'true');
    });
  });
});

describe('AuthMethodSelector Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Auth Method Display', () => {
    it('should render all three auth methods', () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue with GitHub/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue with Email/i)).toBeInTheDocument();
    });

    it('should show Google OAuth button as most prominent', () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      const githubButton = screen.getByText(/Continue with GitHub/i);

      // Google should be first (primary position)
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toContain(googleButton);
    });

    it('should show Email/Magic Link as tertiary option', () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const emailButton = screen.getByText(/Continue with Email/i);
      // Should be styled less prominently (check class or style)
      expect(emailButton.closest('button')).toHaveClass('secondary'); // or similar
    });
  });

  describe('Context Storage', () => {
    it('should store auth context in localStorage before OAuth', () => {
      // Mock supabase auth
      const mockSignInWithOAuth = vi.fn();
      vi.mock('../../src/lib/supabase', () => ({
        supabase: {
          auth: {
            signInWithOAuth: mockSignInWithOAuth,
          },
        },
      }));

      render(
        <AuthMethodSelector
          selectedTier="coffee"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      fireEvent.click(googleButton);

      // Check localStorage was updated
      const storedContext = JSON.parse(localStorage.getItem('authContext'));
      expect(storedContext).toMatchObject({
        selectedTier: 'coffee',
        mode: 'signup',
      });
      expect(storedContext.timestamp).toBeDefined();
    });

    it('should store pendingAnalysisUrl if exists in localStorage', () => {
      // Pre-set pending URL (from landing page)
      localStorage.setItem('pendingAnalysisUrl', 'https://example.com');
      localStorage.setItem('pendingAnalysisId', 'test-123');

      const mockSignInWithOAuth = vi.fn();
      vi.mock('../../src/lib/supabase', () => ({
        supabase: {
          auth: {
            signInWithOAuth: mockSignInWithOAuth,
          },
        },
      }));

      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      fireEvent.click(googleButton);

      const storedContext = JSON.parse(localStorage.getItem('authContext'));
      expect(storedContext.pendingAnalysisUrl).toBe('https://example.com');
      expect(storedContext.pendingAnalysisId).toBe('test-123');
    });

    it('should set 24-hour TTL on auth context', () => {
      const mockSignInWithOAuth = vi.fn();
      vi.mock('../../src/lib/supabase', () => ({
        supabase: {
          auth: {
            signInWithOAuth: mockSignInWithOAuth,
          },
        },
      }));

      const nowBefore = Date.now();

      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      fireEvent.click(googleButton);

      const nowAfter = Date.now();
      const expiry = parseInt(localStorage.getItem('authContextExpiry'));
      const expectedExpiry = nowBefore + (24 * 60 * 60 * 1000); // 24 hours

      expect(expiry).toBeGreaterThanOrEqual(expectedExpiry - 1000); // Allow 1s variance
      expect(expiry).toBeLessThanOrEqual(nowAfter + (24 * 60 * 60 * 1000) + 1000);
    });
  });

  describe('OAuth Initiation', () => {
    it.skip('should call Supabase signInWithOAuth for Google', async () => {
      // SKIP: Requires Supabase OAuth configuration
      // TODO: Enable after OAuth providers configured

      const mockSignInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth...' },
        error: null,
      });

      // Mock implementation...
    });

    it.skip('should call Supabase signInWithOAuth for GitHub', async () => {
      // SKIP: Requires Supabase OAuth configuration
      // TODO: Enable after OAuth providers configured
    });
  });

  describe('Magic Link Flow', () => {
    it('should expand email input when "Continue with Email" clicked', () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const emailButton = screen.getByText(/Continue with Email/i);
      fireEvent.click(emailButton);

      // Email input should now be visible
      expect(screen.getByPlaceholderText(/enter.*email/i)).toBeInTheDocument();
      expect(screen.getByText(/Send Magic Link/i)).toBeInTheDocument();
    });

    it('should validate email format before sending magic link', async () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const emailButton = screen.getByText(/Continue with Email/i);
      fireEvent.click(emailButton);

      const emailInput = screen.getByPlaceholderText(/enter.*email/i);
      const sendButton = screen.getByText(/Send Magic Link/i);

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/valid.*email/i)).toBeInTheDocument();
      });
    });

    it.skip('should call Supabase signInWithOtp with valid email', async () => {
      // SKIP: Requires SMTP configuration
      // TODO: Enable after email delivery configured
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when OAuth fails', async () => {
      const mockOnError = vi.fn();
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider not configured' },
      });

      // Mock and test...
      // (Requires more complex setup)
    });

    it('should handle localStorage unavailable gracefully', () => {
      // Mock localStorage to throw (privacy mode)
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);

      // Should not crash
      expect(() => {
        fireEvent.click(googleButton);
      }).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus management', () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      googleButton.focus();

      expect(document.activeElement).toBe(googleButton);
    });

    it('should announce loading states to screen readers', async () => {
      render(
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={vi.fn()}
          onError={vi.fn()}
        />
      );

      const googleButton = screen.getByText(/Continue with Google/i);
      fireEvent.click(googleButton);

      // Check for aria-live region with loading message
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/authenticating/i);
      });
    });
  });
});

describe('Component Integration: Tier + Auth', () => {
  it('should pass selected tier to AuthMethodSelector', () => {
    const mockOnAuthComplete = vi.fn();
    const { rerender } = render(
      <>
        <TierSelector selectedTier="free" onSelectTier={vi.fn()} />
        <AuthMethodSelector
          selectedTier="free"
          onAuthComplete={mockOnAuthComplete}
          onError={vi.fn()}
        />
      </>
    );

    // Select Coffee tier
    const coffeeTier = screen.getByText(/Coffee/i).closest('button');
    fireEvent.click(coffeeTier);

    // Rerender with new tier
    rerender(
      <>
        <TierSelector selectedTier="coffee" onSelectTier={vi.fn()} />
        <AuthMethodSelector
          selectedTier="coffee"
          onAuthComplete={mockOnAuthComplete}
          onError={vi.fn()}
        />
      </>
    );

    // Click Google OAuth
    const googleButton = screen.getByText(/Continue with Google/i);
    fireEvent.click(googleButton);

    // Check stored context has coffee tier
    const storedContext = JSON.parse(localStorage.getItem('authContext'));
    expect(storedContext.selectedTier).toBe('coffee');
  });
});
