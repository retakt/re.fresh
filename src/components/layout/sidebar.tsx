import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

const NAV_LINKS = [
  { href: "/",          icon: Home,          label: "Home" },
  { href: "/blog",      icon: BookOpen,      label: "Blog" },
  { href: "/music",     icon: Music2,        label: "Music" },
  { href: "/tutorials", icon: GraduationCap, label: "Tutorials" },
  { href: "/about",     icon: User,          label: "About" },
  { href: "/files",     icon: FolderOpen,    label: "Files" },
];

interface SidebarProps {
  /** Mobile only — whether the drawer is open */
  open?: boolean;
  /** Mobile only — called when the drawer should close */
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* ── DESKTOP: exactly as it was before — no changes ── */}
      <aside className="hidden md:flex flex-col w-44 shrink-0 py-8 sticky top-14 h-[calc(100vh-3.25rem)] overflow-y-auto scrollbar-none pr-2">
        <nav className="flex flex-col gap-0.5">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                to={link.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => prefetchRoute(link.href)}
                onFocus={() => prefetchRoute(link.href)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                <span className={cn("font-medium", active ? "font-semibold" : "")}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 text-center">
          <p className="text-xs flex flex-col gap-0.5">
            <span className="text-muted-foreground/50">made by</span>
            <span className="font-semibold text-muted-foreground/80">Takt Akira</span>
          </p>
        </div>
      </aside>

      {/* ── MOBILE ONLY: Enhanced slide-in drawer with smooth animations ── */}

      {/* Backdrop — enhanced glass effect with smooth fade */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing curve for smoothness
            }}
            className="md:hidden fixed inset-0 z-[40] bg-black/50 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer panel — enhanced with spring physics and better sizing */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{ width: "min(280px, 85vw)" }} // Wider for better usability
            className={cn(
              "md:hidden fixed left-0 z-[45] flex flex-col", // Lower z-index than navbar (z-50)
              "top-14", // Start below navbar so content isn't cut off
              "bottom-0", // Extend to bottom
              "bg-background/95 backdrop-blur-xl border-r border-border/60",
              "shadow-[8px_0_32px_rgba(0,0,0,0.2)]", // Enhanced shadow
            )}
          >
            {/* Remove the header with X button since navbar handles the menu toggle */}
            
            {/* Nav links — enhanced with staggered animations and better spacing */}
            <motion.div 
              className="flex-1 overflow-y-auto sidebar-scroll px-4 py-6 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.nav 
                className="flex flex-col gap-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1,
                    },
                  },
                }}
              >
                {NAV_LINKS.map((link, index) => {
                  const Icon = link.icon;
                  const active =
                    link.href === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.href);

                  return (
                    <motion.div
                      key={link.href}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    >
                      <Link
                        to={link.href}
                        aria-current={active ? "page" : undefined}
                        onMouseEnter={() => prefetchRoute(link.href)}
                        onFocus={() => prefetchRoute(link.href)}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                        )}
                      >
                        <Icon size={18} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                        <span className={cn(active ? "font-semibold" : "font-medium")}>
                          {link.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>
              
              <motion.div 
                className="mt-auto pt-8 px-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <p className="text-xs flex flex-col gap-0.5 text-center">
                  <span className="text-muted-foreground/50">made by</span>
                  <span className="font-semibold text-muted-foreground/80">Takt Akira</span>
                </p>
              </motion.div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
