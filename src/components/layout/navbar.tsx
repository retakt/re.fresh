import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, Search } from "lucide-react";
import { useTheme } from "@/components/providers/theme.tsx";
import UserMenu from "@/components/account/user-menu.tsx";
import { BackButton } from "@/components/layout/back-button.tsx";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isHomePage = location.pathname === "/";

  return (
    <>
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
      >
        Skip to main content
      </a>
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-start">
            {isHomePage ? (
              <img
                src="/favicon/android-chrome-512x512.png"
                alt="re.Takt icon"
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <BackButton className="px-2" showLabel={false} />
            )}
          </div>

          <Link
            to="/"
            className="justify-self-start rounded-md font-bold text-lg tracking-tight shrink-0 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="re.Takt - Go to homepage"
          >
            <span className="text-sky-400 dark:text-sky-300">re</span><span className="text-primary">.</span><span className="text-foreground">Takt</span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center justify-self-end gap-1">
            <button
              onClick={() => navigate("/search")}
              className="rounded-lg p-2.5 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Search"
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2.5 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
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
