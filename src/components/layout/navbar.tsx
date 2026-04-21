import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme.tsx";
import UserMenu from "@/components/account/user-menu.tsx";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
      >
        Skip to main content
      </a>
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 lg:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="font-bold text-lg tracking-tight shrink-0 select-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            aria-label="re.Takt - Go to homepage"
          >
            <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
          </Link>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="ml-1">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
