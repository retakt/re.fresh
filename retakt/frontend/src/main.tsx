import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initMonitoring } from "./lib/monitoring.ts";
import * as Sentry from "@sentry/react";
import { supabase } from "./lib/supabase";

initMonitoring();

// ── Auth State Debugging & Recovery ───────────────────────────────────────────
// Listen for auth state changes to track session lifecycle
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[AUTH EVENT]', event, session?.user?.email);
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('[AUTH] Token refreshed successfully');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('[AUTH] User signed out');
  }
  
  if (event === 'USER_UPDATED') {
    console.log('[AUTH] User updated');
  }
  
  if (event === 'TOKEN_EXPIRED') {
    console.warn('[AUTH] Token expired - refresh should trigger automatically');
  }
});

// Auto-refresh token every 5 minutes to prevent silent expiry
// This is a safety net in case autoRefreshToken fails
setInterval(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('[AUTH] Auto-refresh failed:', error.message);
    } else {
      console.log('[AUTH] Periodic token refresh successful');
    }
  }
}, 5 * 60 * 1000);

// Debug auth state continuously in development
if (import.meta.env.DEV) {
  setInterval(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('[AUTH DEBUG]', {
      hasSession: !!session,
      user: session?.user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      expiresIn: session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : null,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }, 10000); // Check every 10s in dev
}

// ── Viewport height sync (iOS Safari fix) ────────────────────────────────────
// Keeps --app-height accurate for address bar changes, but NOT for keyboard.
// Using innerHeight instead of visualViewport prevents layout shift when keyboard opens.
function syncViewportHeight() {
  // Use innerHeight which doesn't change when keyboard opens
  // This prevents the footer from jumping up when typing
  const h = window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${h}px`);
}

syncViewportHeight();

// Only listen to resize and orientation change, not visualViewport resize
// This way keyboard opening/closing won't trigger layout recalculation
window.addEventListener("resize", syncViewportHeight, { passive: true });
window.addEventListener("orientationchange", syncViewportHeight, { passive: true });

// pageshow fires on back-forward cache restore (bfcache) — critical for Safari
window.addEventListener("pageshow", (e) => {
  syncViewportHeight();
  // Force a repaint to fix frozen fixed bars after bfcache restore
  document.documentElement.classList.remove("resume-paint-fix");
  requestAnimationFrame(() => {
    document.documentElement.classList.add("resume-paint-fix");
  });
  // If the page was restored from bfcache, reload to get fresh data
  if (e.persisted) {
    // Don't hard-reload — just trigger a soft re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent("app-resume"));
  }
});

// Debounce app-resume to prevent rapid-fire events
let resumeTimeout: number | null = null;
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Only trigger when page becomes visible (not when hiding)
    syncViewportHeight();
    
    // Debounce: only fire if page has been hidden for at least 1 second
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
    }
    resumeTimeout = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app-resume"));
      resumeTimeout = null;
    }, 100);
  }
});

// ── Stale cache auto-recovery ─────────────────────────────────────────────────
// "Invalid hook call" almost always means old cached JS chunks are mixed with
// new ones after a deploy. Detect it early and wipe caches + reload.
function isStaleChunkError(msg: string) {
  return (
    msg.includes("Invalid hook call") ||
    msg.includes("Hooks can only be called") ||
    msg.includes("Cannot read properties of null") && msg.includes("useState") ||
    // Vite chunk load failure — the cached URL no longer exists
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed")
  );
}

function clearCachesAndReload() {
  const reload = () => globalThis.location.reload();
  if ("caches" in globalThis) {
    caches.keys().then((names) => {
      Promise.all(names.map((n) => caches.delete(n))).then(reload, reload);
    });
  } else {
    reload();
  }
}

window.addEventListener("error", (e) => {
  if (e.message && isStaleChunkError(e.message)) {
    console.warn("[main] Stale cache error detected — clearing and reloading");
    clearCachesAndReload();
  }
});

window.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message ?? String(e.reason ?? "");
  if (isStaleChunkError(msg)) {
    console.warn("[main] Stale cache rejection detected — clearing and reloading");
    clearCachesAndReload();
  }
});

// ── React root ────────────────────────────────────────────────────────────────
const root = document.getElementById("root")!;

createRoot(root, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <App />
);

// Mark theme as loaded so CSS transitions kick in AFTER first paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-loaded");
    
    // Detect iOS for iOS-specific fixes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      document.documentElement.classList.add("ios");
    }
  });
});

// ── Eager preload critical routes ─────────────────────────────────────────────
// Preload the most visited pages after initial render to make navigation instant
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload in order of importance
    import('./pages/blog/page.tsx').catch(() => {});
    import('./pages/music/page.tsx').catch(() => {});
    import('./pages/tutorials/page.tsx').catch(() => {});
    import('./pages/whats-new/page.tsx').catch(() => {});
  }, { timeout: 3000 });
} else {
  setTimeout(() => {
    import('./pages/blog/page.tsx').catch(() => {});
    import('./pages/music/page.tsx').catch(() => {});
    import('./pages/tutorials/page.tsx').catch(() => {});
    import('./pages/whats-new/page.tsx').catch(() => {});
  }, 2000);
}

// ── Service Worker — disabled ─────────────────────────────────────────────────
// PWA/SW removed — was causing stale chunk crashes on every deploy.
// Unregister any previously installed SW so users get clean state.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  // Also wipe all SW caches
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}
