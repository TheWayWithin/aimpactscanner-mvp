// Lightweight Supabase Auth Facade - Minimal auth checking without loading full SDK
// This facade provides basic auth functionality with ~5KB instead of 29KB

/**
 * Lightweight auth checker that uses localStorage to check session
 * without loading the full Supabase SDK
 */
export class SupabaseFacade {
  constructor() {
    // CRITICAL FIX: Dynamic session key based on environment
    // Previously hardcoded to production, causing 401 errors on staging
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'pdmtvkcxnqysujnpcnyh';
    this.sessionKey = `sb-${projectRef}-auth-token`;
    this._session = null;
    this._user = null;
    this._realSupabase = null;
    this._loadPromise = null;
  }

  /**
   * Parse OAuth parameters from URL hash
   * Returns object with access_token, refresh_token, etc.
   */
  _parseHashParams() {
    const hash = window.location.hash.substring(1);
    const params = {};
    
    if (!hash) return params;
    
    hash.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    return params;
  }

  /**
   * Parse Magic Link parameters from URL query string
   * Returns object with access_token, refresh_token, type, etc.
   */
  _parseQueryParams() {
    const search = window.location.search.substring(1);
    const params = {};
    
    if (!search) return params;
    
    search.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    return params;
  }

  /**
   * Check if user is authenticated using localStorage or OAuth tokens in URL
   * Enhanced with better session validation and persistence handling
   */
  async getSession() {
    // First check for OAuth tokens in URL hash (takes priority)
    try {
      const hashParams = this._parseHashParams();
      if (hashParams.access_token) {
        console.log('🔐 OAuth tokens detected in URL hash, loading full Supabase...');
        // OAuth tokens found - must use real Supabase to establish session
        const real = await this.loadRealSupabase();
        return real.auth.getSession();
      }
    } catch (e) {
      console.warn('OAuth token check failed:', e);
    }

    // Second check for Magic Link tokens in URL query parameters
    try {
      const queryParams = this._parseQueryParams();
      if (queryParams.access_token || (queryParams.token && queryParams.type === 'magiclink')) {
        console.log('🔐 Magic Link tokens detected in URL query, loading full Supabase...');
        // Magic Link tokens found - must use real Supabase to establish session
        const real = await this.loadRealSupabase();
        return real.auth.getSession();
      }
    } catch (e) {
      console.warn('Magic Link token check failed:', e);
    }

    // Check for existing session in localStorage first
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Enhanced session validation
        const now = Math.floor(Date.now() / 1000);
        if (data.expires_at && data.expires_at > now && data.user) {
          console.log('✅ Valid session found in localStorage');
          this._session = data;
          this._user = data.user;
          return { data: { session: data }, error: null };
        } else if (data.expires_at && data.expires_at <= now) {
          console.log('⏰ Session expired in localStorage, checking for refresh token...');
          // Session expired, try to use real Supabase to refresh
          const real = await this.loadRealSupabase();
          const result = await real.auth.getSession();
          
          if (result.data?.session) {
            console.log('✅ Session refreshed successfully');
            this._session = result.data.session;
            this._user = result.data.session.user;
          }
          
          return result;
        } else {
          console.log('❌ Invalid session data in localStorage');
          localStorage.removeItem(this.sessionKey);
        }
      }
    } catch (e) {
      console.warn('Session check failed:', e);
      // Clear corrupted session data
      try {
        localStorage.removeItem(this.sessionKey);
      } catch (clearError) {
        console.warn('Failed to clear corrupted session:', clearError);
      }
    }
    
    // If no valid session found in localStorage, check with real Supabase
    // This handles cases where Supabase manages session storage differently
    try {
      console.log('🔍 No valid localStorage session, checking with Supabase...');
      const real = await this.loadRealSupabase();
      const result = await real.auth.getSession();
      
      if (result.data?.session) {
        console.log('✅ Session restored from Supabase storage');
        this._session = result.data.session;
        this._user = result.data.session.user;
      }
      
      return result;
    } catch (e) {
      console.warn('Supabase session check failed:', e);
    }
    
    return { data: { session: null }, error: null };
  }

  /**
   * Get current user without loading full SDK
   */
  async getUser() {
    if (this._user) {
      return { data: { user: this._user }, error: null };
    }
    
    const { data } = await this.getSession();
    if (data?.session?.user) {
      this._user = data.session.user;
      return { data: { user: this._user }, error: null };
    }
    
    return { data: { user: null }, error: null };
  }

  /**
   * Get user tier from localStorage (set during auth)
   */
  getUserTier() {
    try {
      return localStorage.getItem('user-tier') || 'free';
    } catch {
      return 'free';
    }
  }

  /**
   * Check if user has Coffee+ tier without loading SDK
   */
  hasPremiumAccess() {
    const tier = this.getUserTier();
    return tier === 'coffee' || tier === 'Coffee' || tier === 'premium';
  }

  /**
   * Load the real Supabase client only when needed
   */
  async loadRealSupabase() {
    if (this._realSupabase) {
      return this._realSupabase;
    }

    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = (async () => {
      console.log('📦 Loading full Supabase SDK...');
      const { supabase } = await import('./supabaseClient');
      this._realSupabase = supabase;
      console.log('✅ Supabase SDK loaded');
      return supabase;
    })();

    return this._loadPromise;
  }

  /**
   * Proxy auth methods to real Supabase when needed
   */
  get auth() {
    return {
      getSession: async () => {
        // Check for OAuth tokens first
        const hashParams = this._parseHashParams();
        if (hashParams.access_token) {
          console.log('🔐 OAuth tokens detected, using real Supabase for session retrieval...');
          // OAuth tokens found - must use real Supabase for session establishment
          const real = await this.loadRealSupabase();
          
          // Give Supabase time to process OAuth tokens from URL
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return real.auth.getSession();
        }
        
        // Check for Magic Link tokens second
        const queryParams = this._parseQueryParams();
        if (queryParams.access_token || (queryParams.token && queryParams.type === 'magiclink')) {
          console.log('🔐 Magic Link tokens detected, using real Supabase for session retrieval...');
          // Magic Link tokens found - must use real Supabase for session establishment
          const real = await this.loadRealSupabase();
          
          // Give Supabase time to process Magic Link tokens from URL
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return real.auth.getSession();
        }
        
        // Try facade first for regular sessions
        const facadeSession = await this.getSession();
        if (facadeSession.data?.session) {
          return facadeSession;
        }
        
        // Fall back to real Supabase if needed
        const real = await this.loadRealSupabase();
        return real.auth.getSession();
      },
      
      getUser: async () => {
        // Try facade first
        const facadeUser = await this.getUser();
        if (facadeUser.data?.user) {
          return facadeUser;
        }
        // Fall back to real Supabase if needed
        const real = await this.loadRealSupabase();
        return real.auth.getUser();
      },
      
      signInWithPassword: async (credentials) => {
        // Sign in always needs real Supabase
        const real = await this.loadRealSupabase();
        return real.auth.signInWithPassword(credentials);
      },
      
      signUp: async (credentials) => {
        // Sign up always needs real Supabase
        const real = await this.loadRealSupabase();
        return real.auth.signUp(credentials);
      },
      
      signOut: async () => {
        // Clear local session first
        this._session = null;
        this._user = null;
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem('user-tier');
        
        // Then sign out with real Supabase if loaded
        if (this._realSupabase) {
          return this._realSupabase.auth.signOut();
        }
        
        return { error: null };
      },
      
      onAuthStateChange: async (callback) => {
        // Auth state changes need real Supabase
        const real = await this.loadRealSupabase();
        return real.auth.onAuthStateChange(callback);
      }
    };
  }

  /**
   * Proxy database methods - always load real Supabase
   * Returns a deferred query builder that loads Supabase when executed
   */
  from(table) {
    const facade = this;

    // Create a query builder that defers to real Supabase
    const createDeferredBuilder = (buildChain) => {
      return new Proxy({}, {
        get(target, prop) {
          // Handle promise methods (.then, .catch, .finally)
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            return async function(...args) {
              const real = await facade.loadRealSupabase();
              const query = buildChain(real.from(table));
              return query[prop](...args);
            };
          }

          // Handle query builder methods (.select, .eq, .single, etc.)
          return (...methodArgs) => {
            return createDeferredBuilder((builder) => {
              const previousQuery = buildChain(builder);
              return previousQuery[prop](...methodArgs);
            });
          };
        }
      });
    };

    return createDeferredBuilder((builder) => builder);
  }

  /**
   * Proxy functions.invoke for Edge Functions
   */
  get functions() {
    const facade = this;
    return {
      invoke: async (...args) => {
        const real = await facade.loadRealSupabase();
        return real.functions.invoke(...args);
      }
    };
  }
}

// Create singleton instance
export const supabaseFacade = new SupabaseFacade();

// Default export for drop-in replacement
export default supabaseFacade;