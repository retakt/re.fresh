import { useState, useEffect, useCallback } from "react";

/**
 * useState that persists to sessionStorage.
 * Survives page refresh and bfcache restore.
 * Clears when the browser tab is fully closed (sessionStorage behaviour).
 *
 * Usage:
 *   const [filter, setFilter] = usePersistedState("blog-filter", "all");
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = sessionStorage.getItem(`ui:${key}`);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(`ui:${key}`, JSON.stringify(state));
    } catch {
      // sessionStorage full or unavailable — silently ignore
    }
  }, [key, state]);

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      try {
        sessionStorage.setItem(`ui:${key}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [key]);

  return [state, set];
}

/**
 * Persist and restore scroll position for a given page key.
 * Call restoreScroll() after data loads to jump back to where the user was.
 */
export function useScrollPersistence(key: string) {
  const saveScroll = useCallback(() => {
    try {
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
    } catch {}
  }, [key]);

  const restoreScroll = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(`scroll:${key}`);
      if (saved !== null) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
        }
      }
    } catch {}
  }, [key]);

  // Auto-save on scroll (debounced via passive listener)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(saveScroll, 150);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      clearTimeout(timer);
    };
  }, [saveScroll]);

  return { saveScroll, restoreScroll };
}
