import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/navbar.tsx";
import NavOverlay from "@/components/layout/nav-overlay.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars.tsx";
import { cn } from "@/lib/utils";

function PageFallback() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">Something crashed</p>
        <p className="text-xs text-muted-foreground max-w-xs">You can go back or reload.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded bg-primary text-primary-foreground px-3 py-2 text-xs font-medium"
        >
          <RefreshCw size={12} /> Reload
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen(prev => !prev), []);

  const isChatPage = location.pathname === "/chat" || location.pathname === "/terminal";

  // Auto-close nav after 4s of no mouse movement when open — DISABLED
  // useEffect(() => { ... }, [navOpen]);

  // Close nav on route change
  useEffect(() => {
    closeNav();
  }, [location.pathname, closeNav]);

  return (
    <div className="flex h-[var(--app-height)] w-full flex-col bg-background text-foreground overflow-hidden relative">

      {/* ── STARS BACKGROUND — fixed, full viewport, behind everything ── */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <StarsBackground 
          className="w-full h-full" 
          starColor="#525252"
          factor={0.05}
          transition={{ stiffness: 50, damping: 20 }}
        />
      </div>

      {/* ── NAVBAR — full width, above everything except nav overlay ── */}
      <div className="relative z-[60]">
        <Navbar onMenuToggle={toggleNav} isNavOpen={navOpen} />
      </div>

      {/* ── NAV OVERLAY — floats over everything ── */}
      <div className="relative z-[70]">
        <NavOverlay open={navOpen} onClose={closeNav} />
      </div>

      {/* ── MAIN CONTENT — compact with side margins ── */}
      <main
        id="main-content"
        className={cn(
          "flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden w-full relative z-10",
          isChatPage ? "" : "overflow-y-auto"
        )}
      >
        {/* Content wrapper — compact, centered, but not for chat/terminal */}
        <div className={cn(
          "flex-1 min-h-0 flex flex-col",
          isChatPage ? "w-full" : "mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6"
        )}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <ErrorBoundary key={location.pathname} fallback={<PageFallback />}>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      <FloatingPlayer />
    </div>
  );
}
