import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Smart back navigation that works even after a page refresh.
 * 
 * On first render, stores the referrer in sessionStorage keyed by current path.
 * On navigate back, uses history if available, otherwise falls back to the stored
 * referrer, otherwise falls back to the provided `fallback` route.
 * 
 * Usage:
 *   const goBack = useBackNav('/admin/music');
 *   <button onClick={goBack}>Back</button>
 */
export function useBackNav(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = useRef(window.history.length > 1);

  // On mount, record where we came from (document.referrer or previous location)
  useEffect(() => {
    const key = `back:${location.pathname}`;
    // Only store if not already stored (don't overwrite on refresh)
    if (!sessionStorage.getItem(key)) {
      // Use the referrer if it's same-origin, otherwise use fallback
      const ref = document.referrer;
      if (ref && new URL(ref).origin === window.location.origin) {
        const refPath = new URL(ref).pathname + new URL(ref).search;
        sessionStorage.setItem(key, refPath);
      } else {
        sessionStorage.setItem(key, fallback);
      }
    }
  }, [location.pathname, fallback]);

  const goBack = useCallback(() => {
    const key = `back:${location.pathname}`;
    const stored = sessionStorage.getItem(key);

    if (hasHistory.current && window.history.length > 1) {
      // Normal navigation — use browser history
      navigate(-1);
    } else if (stored) {
      // Refreshed page — use stored referrer
      navigate(stored);
    } else {
      // Last resort
      navigate(fallback);
    }
  }, [navigate, location.pathname, fallback]);

  return goBack;
}
