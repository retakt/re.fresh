import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme.tsx";
import UserMenu from "@/components/account/user-menu.tsx";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-6xl items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-base tracking-tight text-foreground shrink-0 select-none"
        >
          re<span className="text-primary">.</span>Takt
        </Link>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
