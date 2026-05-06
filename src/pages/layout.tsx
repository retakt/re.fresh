import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/navbar.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx";
import { AnimatedGrainyBg } from "@/components/ui/animated-grainy-bg";
import { cn } from "@/lib/utils";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Check if current page is chat
  const isChatPage = location.pathname === '/chat';

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    // Remove body scroll lock - backdrop prevents interaction
    // if (sidebarOpen) {
    //   document.body.style.overflow = 'hidden';
    // } else {
    //   document.body.style.overflow = '';
    // }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-[var(--app-height)] w-full max-w-full flex-col bg-background text-foreground overflow-hidden relative">
      {/* Global Paper Grain Background */}
      <AnimatedGrainyBg
        animationType="pulse"
        grainType="paper"
        grainIntensity={30}
        grainSize={100}
        colors={["#000000", "#0d0d0d", "#060606", "#0a0a0a"]}
        speed={0.5}
        darkMode={true}
        position="fixed"
        zIndex={0}
        size="full"
        grainBlendMode="overlay"
        className="pointer-events-none"
        animate={false}
      />
      
      <div className="relative z-10 flex h-full w-full flex-col">
        <Navbar onMenuToggle={toggleSidebar} isSidebarOpen={sidebarOpen} />

      {/* Mobile drawer — fixed, outside flex row, only rendered on mobile */}
      <div className="md:hidden">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      </div>

      {/* ── DESKTOP layout — constrained viewport ── */}
      <div className="flex-1 mx-auto flex w-full max-w-6xl gap-0 px-3 sm:px-4 lg:px-6 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-44 shrink-0 h-full overflow-x-hidden">
          <Sidebar />
        </div>

        <main
          id="main-content"
          className={cn(
            "flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden",
            isChatPage ? "py-0" : "py-5 sm:py-8 md:pl-6 lg:pl-8"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.22, 1, 0.36, 1] // easeOutExpo for snappier feel
              }}
              className="flex-1 min-h-0 flex flex-col overflow-hidden"
            >
              <ErrorBoundary key={location.pathname} fallback={<PageFallback />}>
                <div className={cn(
                  "flex-1 flex flex-col min-h-0 overflow-hidden",
                  isChatPage ? "" : "overflow-y-auto"
                )}>
                  <Outlet />
                </div>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
      <FloatingPlayer />
      </div>
    </div>
  );
}
