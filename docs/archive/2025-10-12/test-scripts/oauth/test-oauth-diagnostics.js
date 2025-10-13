// OAuth Diagnostics Script
// Run this in browser console to diagnose OAuth issues

(async function() {
    console.log('=== OAuth Diagnostics Starting ===');
    console.log('Current URL:', window.location.href);
    console.log('Current Hash:', window.location.hash);
    console.log('Current Search:', window.location.search);
    
    // Check for OAuth tokens in URL
    const hasOAuthTokens = window.location.hash.includes('access_token=') || 
                          window.location.hash.includes('refresh_token=');
    const hasMagicLinkTokens = window.location.search.includes('access_token=') || 
                               window.location.search.includes('token=');
    
    console.log('Has OAuth tokens in hash:', hasOAuthTokens);
    console.log('Has Magic Link tokens in query:', hasMagicLinkTokens);
    
    // Check Supabase client
    if (typeof supabase !== 'undefined') {
        console.log('Supabase client found');
        
        // Try to get session
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Session error:', error);
            } else if (session) {
                console.log('Session found:', {
                    userId: session.user.id,
                    email: session.user.email,
                    provider: session.user.app_metadata?.provider
                });
            } else {
                console.log('No session found');
            }
        } catch (e) {
            console.error('Failed to get session:', e);
        }
        
        // Check auth state
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('User error:', error);
            } else if (user) {
                console.log('User found:', {
                    id: user.id,
                    email: user.email,
                    provider: user.app_metadata?.provider
                });
            } else {
                console.log('No user found');
            }
        } catch (e) {
            console.error('Failed to get user:', e);
        }
    } else {
        console.error('Supabase client not found');
    }
    
    // Check localStorage for auth context
    const authContext = localStorage.getItem('authContext');
    if (authContext) {
        try {
            const context = JSON.parse(authContext);
            console.log('Auth context found:', context);
        } catch (e) {
            console.error('Failed to parse auth context:', e);
        }
    } else {
        console.log('No auth context in localStorage');
    }
    
    // Check for redirect URL configuration
    console.log('Expected OAuth redirect URL:', `${window.location.origin}/#/oauth-callback`);
    console.log('Expected Magic Link redirect URL:', `${window.location.origin}/#/oauth-callback`);
    
    console.log('=== OAuth Diagnostics Complete ===');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check Supabase Dashboard > Authentication > URL Configuration');
    console.log('2. Verify GitHub OAuth App callback URL matches:', `${window.location.origin}/#/oauth-callback`);
    console.log('3. Check Supabase Dashboard > Authentication > Providers > GitHub settings');
    console.log('4. Look for any recent changes in Supabase or GitHub OAuth app');
})();