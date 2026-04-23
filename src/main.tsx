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

// ── React root ────────────────────────────────────────────────────────────────
const root = document.getElementById("root")!;

createRoot(root, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Mark theme as loaded so CSS transitions kick in AFTER first paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-loaded");
  });
});

// ── Service Worker (Workbox via vite-plugin-pwa) ──────────────────────────────
// Only register in production — vite-plugin-pwa doesn't generate sw.js in dev.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  import("workbox-window").then(({ Workbox }) => {
    const wb = new Workbox("/sw.js");

    // When a new SW is waiting, activate it and reload once
    wb.addEventListener("waiting", () => {
      wb.addEventListener("controlling", () => {
        window.location.reload();
      });
      wb.messageSkipWaiting();
    });

    wb.register().catch((err) => {
      console.warn("SW registration failed:", err);
    });
  }).catch(() => {
    // workbox-window unavailable — fall back to plain registration
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}
