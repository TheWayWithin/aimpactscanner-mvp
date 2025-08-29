/**
 * SECURITY ENHANCEMENT RECOMMENDATIONS
 * Implementation-ready code snippets for identified improvements
 */

// 1. RESEND EMAIL RATE LIMITING ENHANCEMENT
// Add this to EmailVerificationPending component

const useResendRateLimit = (initialCooldown = 60000) => {
  const [lastResendTime, setLastResendTime] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const canResend = useCallback(() => {
    return (Date.now() - lastResendTime) > initialCooldown;
  }, [lastResendTime, initialCooldown]);

  const initiateResend = useCallback(async (resendFunction) => {
    if (!canResend()) {
      return { success: false, error: 'Please wait before requesting another email' };
    }

    try {
      setLastResendTime(Date.now());
      setIsOnCooldown(true);
      
      const result = await resendFunction();
      
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        const remaining = Math.max(0, initialCooldown - (Date.now() - Date.now()));
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          setIsOnCooldown(false);
          clearInterval(countdownInterval);
        }
      }, 1000);

      return { success: true, data: result };
    } catch (error) {
      setIsOnCooldown(false);
      return { success: false, error: error.message };
    }
  }, [canResend, initialCooldown]);

  return {
    canResend: canResend(),
    isOnCooldown,
    remainingTime: Math.ceil(remainingTime / 1000),
    initiateResend
  };
};

// Usage in EmailVerificationPending component:
const ResendButton = () => {
  const { canResend, isOnCooldown, remainingTime, initiateResend } = useResendRateLimit();

  const handleResend = async () => {
    const result = await initiateResend(async () => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/#login?verified=true`
        }
      });
      if (error) throw error;
    });

    if (result.success) {
      setMessage('Verification email sent! Check your inbox.');
    } else {
      setMessage(result.error);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={isOnCooldown}
      className={`px-4 py-2 rounded-lg font-semibold ${
        isOnCooldown 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isOnCooldown 
        ? `Resend in ${remainingTime}s` 
        : 'Resend Verification Email'
      }
    </button>
  );
};

// 2. SESSION TIMEOUT WARNING SYSTEM
// Add this to App.jsx or create a SessionManager component

const useSessionTimeout = (timeoutDuration = 30 * 60 * 1000, warningDuration = 5 * 60 * 1000) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  const resetTimeout = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(warningDuration);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            // Time's up - sign out user
            supabase.auth.signOut();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, timeoutDuration - warningDuration);

    // Set final timeout
    timeoutRef.current = setTimeout(() => {
      supabase.auth.signOut();
    }, timeoutDuration);
  }, [timeoutDuration, warningDuration]);

  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Start timeout on mount
    resetTimeout();

    // Reset timeout on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimeoutThrottled = throttle(resetTimeout, 10000); // Throttle to every 10 seconds

    events.forEach(event => {
      document.addEventListener(event, resetTimeoutThrottled, true);
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutThrottled, true);
      });
    };
  }, [resetTimeout]);

  return {
    showWarning,
    remainingTime: Math.ceil(remainingTime / 1000),
    extendSession
  };
};

// Throttle utility function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Session Warning Modal Component
const SessionWarningModal = ({ show, remainingTime, onExtend }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Session About to Expire</h3>
          <p className="text-gray-600 mb-4">
            Your session will expire in <strong>{remainingTime} seconds</strong> due to inactivity.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Stay Signed In
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. ENHANCED FORM VALIDATION WITH SECURITY LOGGING
// Add this to track validation failures for security monitoring

const useSecurityLogging = () => {
  const logSecurityEvent = useCallback((eventType, details) => {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: eventType,
      userAgent: navigator.userAgent,
      url: window.location.href,
      details: details,
      sessionId: crypto.randomUUID() // Generate unique identifier
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔒 Security Event:', securityEvent);
    }

    // In production, send to monitoring service
    // fetch('/api/security-log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(securityEvent)
    // });

    // Store locally for debugging
    const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    existingLogs.push(securityEvent);
    
    // Keep only last 100 events
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('securityLogs', JSON.stringify(existingLogs));
  }, []);

  return { logSecurityEvent };
};

// Enhanced form validation with logging
const useEnhancedValidation = () => {
  const { logSecurityEvent } = useSecurityLogging();

  const validateWithLogging = (formData) => {
    const { email, password, confirmPassword } = formData;
    
    // Log suspicious patterns
    if (email && email.includes('<script>')) {
      logSecurityEvent('XSS_ATTEMPT', { field: 'email', value: email.substring(0, 50) });
    }
    
    if (password && password.includes('SELECT') && password.includes('FROM')) {
      logSecurityEvent('SQL_INJECTION_ATTEMPT', { field: 'password' });
    }
    
    // Log repeated validation failures from same IP
    const failureKey = 'validation_failures_' + Date.now().toString().slice(0, -5); // 5-minute windows
    const failures = parseInt(localStorage.getItem(failureKey) || '0');
    
    if (failures > 10) {
      logSecurityEvent('REPEATED_VALIDATION_FAILURES', { 
        failures: failures,
        timeWindow: '5 minutes'
      });
    }
    
    // Standard validation logic here...
    const isValid = validateForm(email, password, confirmPassword);
    
    if (!isValid) {
      localStorage.setItem(failureKey, (failures + 1).toString());
    }
    
    return isValid;
  };

  return { validateWithLogging };
};

// 4. CSRF PROTECTION ENHANCEMENT (Client-side verification)
// Add CSRF token verification for state-changing operations

const useCSRFProtection = () => {
  const [csrfToken, setCSRFToken] = useState(null);

  useEffect(() => {
    // Generate CSRF token on component mount
    const token = crypto.randomUUID();
    setCSRFToken(token);
    sessionStorage.setItem('csrf_token', token);
  }, []);

  const validateCSRF = (submittedToken) => {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken && submittedToken === storedToken;
  };

  return { csrfToken, validateCSRF };
};

// 5. COMPREHENSIVE INPUT SANITIZATION
const sanitizeInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') return input;

  const sanitizers = {
    email: (str) => str.trim().toLowerCase().replace(/[<>]/g, ''),
    password: (str) => str.trim(), // Don't modify passwords too much
    text: (str) => str.trim().replace(/[<>]/g, ''),
    url: (str) => {
      try {
        const url = new URL(str);
        return url.toString();
      } catch {
        return '';
      }
    }
  };

  return sanitizers[type] ? sanitizers[type](input) : sanitizers.text(input);
};

export {
  useResendRateLimit,
  useSessionTimeout,
  SessionWarningModal,
  useSecurityLogging,
  useEnhancedValidation,
  useCSRFProtection,
  sanitizeInput
};