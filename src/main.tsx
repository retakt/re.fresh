import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initMonitoring } from "./lib/monitoring.ts";
import * as Sentry from "@sentry/react";

initMonitoring();

// ── Viewport height sync (iOS Safari fix) ────────────────────────────────────
// Keeps --app-height accurate when the keyboard, notch, or dynamic island
// changes the visible viewport. Also nudges a repaint on tab resume.
function syncViewportHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${h}px`);
}

syncViewportHeight();

window.addEventListener("resize", syncViewportHeight, { passive: true });
window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });
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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncViewportHeight();
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
  });
});

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
