// tests/unit/auth.test.js - Test suite for email/password authentication
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthWithPassword from '../../src/components/AuthWithPassword';
import PasswordResetPage from '../../src/components/PasswordResetPage';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    setSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  }
};

// Mock the supabase client
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    hash: '',
    pathname: '/'
  }
});

describe('AuthWithPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('renders login form by default', () => {
      render(<AuthWithPassword />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email format on login', async () => {
      render(<AuthWithPassword />);
      
      const emailInput = screen.getByPlaceholderText('Your email address');
      const passwordInput = screen.getByPlaceholderText('Your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('calls signInWithPassword with correct data', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: 'test@example.com' } }, error: null });
      
      render(<AuthWithPassword />);
      
      const emailInput = screen.getByPlaceholderText('Your email address');
      const passwordInput = screen.getByPlaceholderText('Your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
          options: {
            data: {
              rememberMe: false
            }
          }
        });
      });
    });

    it('handles login errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ 
        data: null, 
        error: { message: 'Invalid login credentials' } 
      });
      
      render(<AuthWithPassword />);
      
      const emailInput = screen.getByPlaceholderText('Your email address');
      const passwordInput = screen.getByPlaceholderText('Your password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument();
      });
    });
  });

  describe('Registration Mode', () => {
    it('switches to registration mode', async () => {
      render(<AuthWithPassword />);
      
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('validates password strength requirements', async () => {
      render(<AuthWithPassword />);
      
      // Switch to register mode
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      const passwordInput = screen.getByPlaceholderText('Create a password');
      await userEvent.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeInTheDocument();
        expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        expect(screen.getByText('At least one number')).toBeInTheDocument();
      });
    });

    it('shows strong password when requirements are met', async () => {
      render(<AuthWithPassword />);
      
      // Switch to register mode
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      const passwordInput = screen.getByPlaceholderText('Create a password');
      await userEvent.type(passwordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeInTheDocument();
        // All requirements should be checked
        const checkmarks = screen.getAllByText('✓');
        expect(checkmarks).toHaveLength(5);
      });
    });

    it('validates password confirmation match', async () => {
      render(<AuthWithPassword />);
      
      // Switch to register mode
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmInput = screen.getByPlaceholderText('Confirm your password');

      await userEvent.type(passwordInput, 'StrongPass123!');
      await userEvent.type(confirmInput, 'DifferentPass123!');

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('requires terms agreement for registration', async () => {
      render(<AuthWithPassword />);
      
      // Switch to register mode
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      const emailInput = screen.getByPlaceholderText('Your email address');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'StrongPass123!');
      await userEvent.type(confirmInput, 'StrongPass123!');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please agree to the Terms of Service to continue.')).toBeInTheDocument();
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('calls signUp with correct data when valid', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: { user: { email: 'test@example.com' } }, error: null });
      
      render(<AuthWithPassword />);
      
      // Switch to register mode
      const createAccountButton = screen.getByText('Create one here');
      await userEvent.click(createAccountButton);

      const emailInput = screen.getByPlaceholderText('Your email address');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmInput = screen.getByPlaceholderText('Confirm your password');
      const termsCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'StrongPass123!');
      await userEvent.type(confirmInput, 'StrongPass123!');
      await userEvent.click(termsCheckbox);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'StrongPass123!',
          options: {
            emailRedirectTo: 'http://localhost:3000',
            data: {
              full_name: 'test'
            }
          }
        });
      });
    });
  });

  describe('Password Reset Mode', () => {
    it('switches to password reset mode', async () => {
      render(<AuthWithPassword />);
      
      const forgotPasswordButton = screen.getByText('Forgot password?');
      await userEvent.click(forgotPasswordButton);

      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('validates email for password reset', async () => {
      render(<AuthWithPassword />);
      
      // Switch to reset mode
      const forgotPasswordButton = screen.getByText('Forgot password?');
      await userEvent.click(forgotPasswordButton);

      const emailInput = screen.getByPlaceholderText('Your email address');
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      });

      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('calls resetPasswordForEmail with correct data', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
      
      render(<AuthWithPassword />);
      
      // Switch to reset mode
      const forgotPasswordButton = screen.getByText('Forgot password?');
      await userEvent.click(forgotPasswordButton);

      const emailInput = screen.getByPlaceholderText('Your email address');
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          {
            redirectTo: 'http://localhost:3000/reset-password'
          }
        );
      });
    });
  });

  describe('UI Interactions', () => {
    it('toggles password visibility', async () => {
      render(<AuthWithPassword />);
      
      const passwordInput = screen.getByPlaceholderText('Your password');
      const toggleButton = screen.getByLabelText(/toggle password visibility/i) || 
                          screen.getByRole('button', { name: /👁️/ });

      expect(passwordInput.type).toBe('password');

      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('remembers me checkbox works', async () => {
      render(<AuthWithPassword />);
      
      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      expect(rememberMeCheckbox).not.toBeChecked();

      await userEvent.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();
    });
  });
});

describe('PasswordResetPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window location
    window.location.hash = '';
  });

  it('shows loading state while checking token', () => {
    render(<PasswordResetPage />);
    
    expect(screen.getByText('Verifying reset link...')).toBeInTheDocument();
  });

  it('shows invalid token message for invalid links', async () => {
    window.location.hash = '#invalid-token';
    
    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(screen.getByText('Reset Link Invalid')).toBeInTheDocument();
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
    });
  });

  it('shows password reset form for valid recovery tokens', async () => {
    mockSupabase.auth.setSession.mockResolvedValue({ data: { user: {} }, error: null });
    
    window.location.hash = '#access_token=valid_token&refresh_token=refresh&type=recovery';
    
    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(screen.getByText('Set New Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument();
    });
  });

  it('validates password strength on reset', async () => {
    mockSupabase.auth.setSession.mockResolvedValue({ data: { user: {} }, error: null });
    
    window.location.hash = '#access_token=valid_token&refresh_token=refresh&type=recovery';
    
    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('Enter your new password');
    await userEvent.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });
  });

  it('calls updateUser when password reset is valid', async () => {
    mockSupabase.auth.setSession.mockResolvedValue({ data: { user: {} }, error: null });
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    
    window.location.hash = '#access_token=valid_token&refresh_token=refresh&type=recovery';
    
    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('Enter your new password');
    const confirmInput = screen.getByPlaceholderText('Confirm your new password');
    const submitButton = screen.getByRole('button', { name: /update password/i });

    await userEvent.type(passwordInput, 'NewStrongPass123!');
    await userEvent.type(confirmInput, 'NewStrongPass123!');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewStrongPass123!'
      });
    });
  });
});