import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initMonitoring } from "./lib/monitoring.ts";
import * as Sentry from "@sentry/react";
import { supabase } from "./lib/supabase";

initMonitoring();

// ── Simple Auth Recovery: Kill session on ANY error ───────────────────────────
// When refresh fails, immediately clear everything and redirect to login.
// No complex validation, no zombie sessions.
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[AUTH EVENT]', event, session?.user?.email);

  if (event === 'SIGNED_OUT') {
    console.log('[AUTH] User signed out - clearing storage');
    localStorage.removeItem('retakt-auth');
    sessionStorage.clear();
  }
});

// Global error handler for auth failures - force logout on token errors
window.addEventListener('unhandledrejection', async (e) => {
  const msg = e.reason?.message ?? String(e.reason ?? "");

  // If it's an auth error, force logout immediately
  if (msg.includes('Invalid Refresh Token') ||
      msg.includes('Refresh Token Not Found') ||
      msg.includes('AuthApiError')) {
    console.error('[AUTH] Critical auth error detected - forcing logout');

    // Force clear ALL auth data immediately
    localStorage.removeItem('retakt-auth');
    localStorage.clear();
    sessionStorage.clear();

    // Try to tell Supabase to sign out (may fail, that's ok)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('[LOGOUT] Error during signout:', error);
      // Ignore errors - we already cleared local storage
    } finally {
      // Force redirect regardless of success/failure
      window.location.href = '/login';
    }
  }
});

// Debug auth state every 10 seconds in development only
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
  }, 10000);
}

// ── Viewport height sync (iOS Safari fix) ────────────────────────────────────
function syncViewportHeight() {
  const h = window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${h}px`);
}

syncViewportHeight();
window.addEventListener("resize", syncViewportHeight, { passive: true });
window.addEventListener("orientationchange", syncViewportHeight, { passive: true });

window.addEventListener("pageshow", (e) => {
  syncViewportHeight();
  document.documentElement.classList.remove("resume-paint-fix");
  requestAnimationFrame(() => {
    document.documentElement.classList.add("resume-paint-fix");
  });
  if (e.persisted) {
    window.dispatchEvent(new CustomEvent("app-resume"));
  }
});

let resumeTimeout: number | null = null;
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncViewportHeight();
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
function isStaleChunkError(msg: string) {
  return (
    msg.includes("Invalid hook call") ||
    msg.includes("Hooks can only be called") ||
    msg.includes("Cannot read properties of null") && msg.includes("useState") ||
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

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-loaded");
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      document.documentElement.classList.add("ios");
    }
  });
});

// ── Eager preload critical routes ─────────────────────────────────────────────
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
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
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}