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
  
  // Load theme from localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("yt-downloader-theme");
      return (saved as "light" | "dark") || "dark";
    } catch {
      return "dark";
    }
  });

  // Apply theme to document and save to localStorage
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    
    try {
      localStorage.setItem("yt-downloader-theme", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [theme]);

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
      className={`min-h-dvh transition-colors ${
        theme === "dark" 
          ? "bg-black text-[#e1e1e1]" 
          : "bg-[#f5f1e8] text-[#2a2a2a]"
      }`}
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
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
