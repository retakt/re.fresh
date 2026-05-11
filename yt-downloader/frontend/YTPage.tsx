import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import { StarsBackground } from "./components/backgrounds/stars";

export default function YTPage() {
  const [currentPage, setCurrentPage] = useState<"home" | "settings" | "admin">(() => {
    // Check URL hash for admin route
    if (window.location.hash === "#/admin") {
      return "admin";
    }
    return "home";
  });
  
  // LOCKED TO DARK MODE - Light mode has styling issues that need to be fixed
  const theme = "dark";
  const setTheme = () => {}; // Disabled

  // Force dark mode and clear any light mode from localStorage
  useEffect(() => {
    // Remove light mode from localStorage
    try {
      localStorage.removeItem("yt-downloader-theme");
      localStorage.setItem("yt-downloader-theme", "dark");
    } catch {}
    
    // Force dark class on HTML
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }, []);

  // Handle hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#/admin") {
        setCurrentPage("admin");
      } else if (window.location.hash === "#/settings") {
        setCurrentPage("settings");
      } else {
        setCurrentPage("home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Mouse back/forward buttons (button 3 = back, button 4 = forward)
  // Toggles between home and settings without a full page reload
  useEffect(() => {
    const handleMouseButton = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        setCurrentPage((prev) => (prev === "settings" ? "home" : prev));
      } else if (e.button === 4) {
        e.preventDefault();
        setCurrentPage((prev) => (prev === "home" ? "settings" : prev));
      }
    };

    window.addEventListener("mousedown", handleMouseButton);
    return () => window.removeEventListener("mousedown", handleMouseButton);
  }, []);

  // Touch swipe gesture — left swipe → settings, right swipe → home
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Only trigger if horizontal swipe is dominant and long enough
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      if (dx < 0) {
        // Swipe left → go to settings
        setCurrentPage((prev) => (prev === "home" ? "settings" : prev));
      } else {
        // Swipe right → go back to home
        setCurrentPage((prev) => (prev === "settings" ? "home" : prev));
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div className="h-dvh w-full overflow-hidden relative">
      {/* ── STARS BACKGROUND — fixed, full viewport, behind everything ── */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
        <StarsBackground 
          className="w-full h-full" 
          starColor="#525252"
          factor={0.05}
          transition={{ stiffness: 50, damping: 20 }}
        />
      </div>

      {/* ── MAIN CONTENT — above stars background ── */}
      <div 
        className={`relative z-10 h-dvh w-full transition-colors bg-transparent text-[#e1e1e1] ${
          currentPage === "settings" || currentPage === "admin" ? "overflow-y-auto" : "overflow-hidden"
        }`}
        style={{ fontFamily: "'Commit Mono', monospace" }}
      >
        {currentPage === "home" && <Home onNavigate={setCurrentPage} />}
        {currentPage === "settings" && (
          <Settings 
            onNavigate={setCurrentPage} 
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
        {currentPage === "admin" && <Admin />}
      </div>
    </div>
  );
}
