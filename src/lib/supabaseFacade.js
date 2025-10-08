// Lightweight Supabase Auth Facade - Minimal auth checking without loading full SDK
// This facade provides basic auth functionality with ~5KB instead of 29KB

/**
 * Lightweight auth checker that uses localStorage to check session
 * without loading the full Supabase SDK
 */
export class SupabaseFacade {
  constructor() {
    this.sessionKey = 'sb-pdmtvkcxnqysujnpcnyh-auth-token';
    this._session = null;
    this._user = null;
    this._realSupabase = null;
    this._loadPromise = null;
  }

  /**
   * Check if user is authenticated using localStorage
   * This avoids loading the full SDK for initial check
   */
  async getSession() {
    // First check localStorage for existing session
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if session is expired
        if (data.expires_at && new Date(data.expires_at * 1000) > new Date()) {
          this._session = data;
          this._user = data.user;
          return { data: { session: data }, error: null };
        }
      }
    } catch (e) {
      console.warn('Session check failed:', e);
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
        // Try facade first
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
      
      onAuthStateChange: (callback) => {
        // Auth state changes need real Supabase
        this.loadRealSupabase().then(real => {
          real.auth.onAuthStateChange(callback);
        });
        
        // Return dummy unsubscribe for compatibility
        return {
          data: { subscription: { unsubscribe: () => {} } }
        };
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