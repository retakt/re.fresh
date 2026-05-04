import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

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

  return (
    <div 
      className="min-h-dvh transition-colors bg-black text-[#e1e1e1]"
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
  );
}
