import { supabase } from './supabase';

/**
 * Ensures the user has a valid Supabase session before making authenticated requests.
 * Returns true if session is valid, false otherwise.
 * Handles token refresh automatically and redirects to login if session is corrupted.
 */
export async function ensureValidSession(): Promise<boolean> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[AUTH] Session check failed:', error.message);
    return false;
  }

  if (!session) {
    console.warn('[AUTH] No session found - user may need to sign in');
    // Don't force redirect here - let the calling component handle it
    return false;
  }

  // Check if token is expiring soon (within 60 seconds)
  if (session.expires_at) {
    const expiresInSeconds = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresInSeconds < 60 && expiresInSeconds > 0) {
      console.log('[AUTH] Token expiring soon (<60s), refreshing...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[AUTH] Token refresh failed:', refreshError.message);
        return false;
      }
      console.log('[AUTH] Token refreshed successfully');
    } else if (expiresInSeconds <= 0) {
      console.warn('[AUTH] Token already expired, attempting refresh...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[AUTH] Refresh of expired token failed:', refreshError.message);
        return false;
      }
    }
  }

  return true;
}

/**
 * Forces sign out and redirects to login page.
 * Use this when session is corrupted or unrecoverable.
 */
export async function forceSignOut(redirectUrl: string = '/login'): Promise<void> {
  console.log('[AUTH] Forcing sign out and redirecting...');
  await supabase.auth.signOut();
  window.location.href = redirectUrl;
}
