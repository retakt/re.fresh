import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full p-2 text-foreground/60 hover:text-foreground hover:bg-secondary/60 transition-all"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}