/**
 * Connection Monitor
 * Handles preemptive session refresh and connection health checks
 * to prevent content loading failures after inactivity
 */

import { supabase } from './supabase';

const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL = 60 * 1000; // Check every minute
const PREEMPTIVE_REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if session expires in < 10 min

let lastActivityTime = Date.now();
let checkIntervalId: number | null = null;

/**
 * Update last activity timestamp
 */
function updateActivity() {
  lastActivityTime = Date.now();
}

/**
 * Check if user has been inactive
 */
function isInactive(): boolean {
  return Date.now() - lastActivityTime > INACTIVITY_THRESHOLD;
}

/**
 * Preemptively refresh session if it's about to expire
 */
async function checkAndRefreshSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    // Check if session expires soon
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const timeUntilExpiry = expiresAt - Date.now();

    // If session expires in less than 10 minutes, refresh it
    if (timeUntilExpiry > 0 && timeUntilExpiry < PREEMPTIVE_REFRESH_THRESHOLD) {
      console.log('[connection-monitor] Preemptively refreshing session');
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    console.error('[connection-monitor] Session check failed:', error);
  }
}

/**
 * Periodic health check
 */
async function performHealthCheck() {
  // Skip if user is inactive
  if (isInactive()) {
    console.log('[connection-monitor] User inactive, skipping health check');
    return;
  }

  await checkAndRefreshSession();
}

/**
 * Start monitoring connection health
 */
export function startConnectionMonitor() {
  if (checkIntervalId !== null) {
    console.log('[connection-monitor] Already running');
    return;
  }

  console.log('[connection-monitor] Starting connection monitor');

  // Set up activity listeners
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  // Initial check
  checkAndRefreshSession();

  // Periodic checks
  checkIntervalId = window.setInterval(performHealthCheck, CHECK_INTERVAL);

  // Check on visibility change (tab becomes active)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[connection-monitor] Tab became visible, checking connection');
      updateActivity();
      checkAndRefreshSession();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Check on online event
  const handleOnline = () => {
    console.log('[connection-monitor] Network reconnected, checking session');
    updateActivity();
    checkAndRefreshSession();
  };
  window.addEventListener('online', handleOnline);
}

/**
 * Stop monitoring
 */
export function stopConnectionMonitor() {
  if (checkIntervalId !== null) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log('[connection-monitor] Stopped');
  }
}

/**
 * Force an immediate connection check
 */
export async function forceConnectionCheck() {
  console.log('[connection-monitor] Forcing connection check');
  updateActivity();
  await checkAndRefreshSession();
}
