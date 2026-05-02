import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Moon, Sun, Search } from "lucide-react";
import { useTheme } from "@/components/providers/theme.tsx";
import UserMenu from "@/components/account/user-menu.tsx";
import AnimatedMenuIcon from "@/components/ui/animated-menu-icon.tsx";

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
  const navigate = useNavigate();
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
            ? "border-b border-border/60 bg-background/95 backdrop-blur-md shadow-sm"
            : "border-b border-border/60 shadow-sm bg-background/95 backdrop-blur-md"
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
            <motion.button
              type="button"
              onClick={() => navigate("/search")}
              className="rounded-lg p-2.5 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Search"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={17} strokeWidth={2} />
            </motion.button>

            <motion.button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2.5 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === "dark" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
            </motion.button>

            <div className="ml-0.5">
              <UserMenu />
            </div>
          </motion.div>

        </div>
      </motion.header>
    </>
  );
}
