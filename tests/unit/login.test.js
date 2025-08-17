// tests/unit/login.test.js - Test suite for the new Login component
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../src/components/Login';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithOtp: vi.fn()
  }
};

// Mock the supabase client
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  }
});

describe('Login Component', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your AI-powered analysis dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link to sign in/i })).toBeInTheDocument();
  });

  it('validates email format before submission', async () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows error message for empty email', async () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    expect(mockSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('calls signInWithOtp with correct parameters for valid email', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000'
        }
      });
    });

    // Should show success message
    expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
    expect(screen.getByText(/We've sent a magic link to test@example.com/)).toBeInTheDocument();
    
    // Should call success handler
    expect(mockOnLoginSuccess).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('handles email trimming and lowercasing', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

    await userEvent.type(emailInput, '  TEST@EXAMPLE.COM  ');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000'
        }
      });
    });
  });

  it('handles authentication errors gracefully', async () => {
    const errorMessage = 'Rate limit exceeded';
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ 
      error: { message: errorMessage } 
    });
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockSupabase.auth.signInWithOtp.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Sending Magic Link...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
    });
  });

  describe('Email Sent View', () => {
    beforeEach(async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });
      
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const submitButton = screen.getByRole('button', { name: /send magic link to sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
      });
    });

    it('shows correct email confirmation message', () => {
      expect(screen.getByText('Check Your Email!')).toBeInTheDocument();
      expect(screen.getByText(/We've sent a magic link to test@example.com/)).toBeInTheDocument();
      expect(screen.getByText('Click the link in your email to sign in to your account.')).toBeInTheDocument();
    });

    it('allows user to try different email', async () => {
      const tryDifferentButton = screen.getByRole('button', { name: /try different email/i });
      await userEvent.click(tryDifferentButton);

      // Should return to login form
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('');
    });

    it('provides navigation links', () => {
      expect(screen.getByText(/Don't have an account\?/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up here/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('provides link to create account', () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      expect(screen.getByText(/Don't have an account\?/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create one here/i })).toBeInTheDocument();
    });

    it('provides link back to homepage', () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      expect(screen.getByRole('button', { name: /← back to homepage/i })).toBeInTheDocument();
    });

    it('shows security information', () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      expect(screen.getByText('Secure Magic Link Authentication')).toBeInTheDocument();
      expect(screen.getByText('No passwords to remember. Click the link in your email to sign in securely.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'your@email.com');
    });

    it('shows terms agreement text', () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      
      expect(screen.getByText(/By signing in, you agree to our Terms of Service and Privacy Policy/)).toBeInTheDocument();
    });
  });
});