import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/navbar.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import BottomNav from "@/components/layout/bottom-nav.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx";

// Per-page fallback — shown when a page crashes (e.g. admin panel scroll freeze)
function PageFallback() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">This page ran into a problem</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Something crashed. You can go back or reload the page.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={13} /> Go back
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={13} /> Reload
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[var(--app-height)] flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-1 mx-auto flex w-full max-w-6xl gap-0 px-3 sm:px-4 lg:px-6">
        <div className="hidden md:block w-44 shrink-0 border-r border-border/50 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]">
          <Sidebar />
        </div>

        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden py-5 sm:py-8 pb-[76px] md:pb-14 md:pl-6 lg:pl-8"
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              <ErrorBoundary key={location.pathname} fallback={<PageFallback />}>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
      <BottomNav />
      <FloatingPlayer />
    </div>
  );
}
