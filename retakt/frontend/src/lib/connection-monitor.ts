/**
 * Simple Connection Monitor
 * Basic session refresh on visibility change
 */

import { supabase } from './supabase';

/**
 * Start basic connection monitoring
 */
export function startConnectionMonitor() {
  // Refresh session when tab becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.refreshSession();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function stopConnectionMonitor() {
  // No-op for compatibility
}

export async function forceConnectionCheck() {
  await supabase.auth.refreshSession();
}
