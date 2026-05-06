import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme.tsx";
import UserMenu from "@/components/account/user-menu.tsx";
import AnimatedMenuIcon from "@/components/ui/animated-menu-icon.tsx";
import { CommandPalette } from "@/components/ui/command-palette.tsx";

interface NavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen?: boolean;
}

// Entrance animation — stagger children from top
const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

export default function Navbar({ onMenuToggle, isSidebarOpen = false }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Skip to content — screen readers */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
      >
        Skip to main content
      </a>

      <motion.header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          isScrolled
            ? "border-b border-gray-400/30 bg-background/95 backdrop-blur-md shadow-[0_1px_5px_rgba(192,192,192,0.1)] dark:shadow-[0_1px_5px_rgba(192,192,192,0.1)]"
            : "border-b border-gray-400/30 shadow-[0_1px_5px_rgba(192,192,192,0.1)] dark:shadow-[0_1px_5px_rgba(192,192,192,0.1)] bg-background/95 backdrop-blur-md"
        }`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-4 lg:px-6">

          {/* Left: hamburger — mobile only */}
          <motion.div
            className="md:hidden"
            variants={itemVariants}
            whileTap={{ scale: 0.92 }}
          >
            <AnimatedMenuIcon 
              isOpen={isSidebarOpen} 
              onClick={onMenuToggle}
              size={24}
            />
          </motion.div>

          {/* Desktop left slot — placeholder for logo animation */}
          <motion.div
            className="hidden md:block w-9 shrink-0"
            variants={itemVariants}
          />

          {/* Wordmark */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link
              to="/"
              className="font-bold text-lg tracking-tight shrink-0 select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="re.Takt — Go to homepage"
            >
              <span className="text-sky-400 dark:text-sky-300">re</span>
              <span className="text-primary">.</span>
              <span className="text-foreground">Takt</span>
            </Link>
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <motion.div className="flex items-center gap-1" variants={itemVariants}>
            <CommandPalette />

            <div className="relative group">
              <motion.div
                className="relative rounded-lg p-2.5 text-muted-foreground cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Moon size={17} strokeWidth={2} />
              </motion.div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none z-50">
                needs fix
              </div>
            </div>

            <div className="ml-0.5">
              <UserMenu />
            </div>
          </motion.div>

        </div>
      </motion.header>
    </>
  );
}
