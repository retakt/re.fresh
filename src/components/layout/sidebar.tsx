import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen, X, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";
import { CanvasText } from "@/components/ui/canvas-text";

const NAV_LINKS = [
  { href: "/",          icon: Home,           label: "Home" },
  { href: "/blog",      icon: BookOpen,       label: "Blog" },
  { href: "/music",     icon: Music2,         label: "Music" },
  { href: "/tutorials", icon: GraduationCap,  label: "Tutorials" },
  { href: "/about",     icon: User,           label: "About" },
  { href: "/files",     icon: FolderOpen,     label: "Files" },
  { href: "/chat",      icon: MessageSquare,  label: "Chat" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* ── DESKTOP: unchanged ── */}
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
                <span className={cn("font-medium", active ? "font-semibold" : "")}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <p className="text-xs flex flex-col gap-0.5">
            <span className="text-muted-foreground/50">made by</span>
            <span className="font-semibold">
              <CanvasText
                text="Takt Akira"
                backgroundClassName="bg-muted-foreground"
                colors={["#fb7185", "#f43f5e", "#e11d48", "#4ecdc4", "#2dd4bf", "#14b8a6"]}
                lineGap={4}
                animationDuration={15}
              />
            </span>
          </p>
        </div>
      </aside>

      {/* ── MOBILE: backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="md:hidden fixed inset-0 z-[40] bg-black/50 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE: drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            style={{ width: "min(280px, 85vw)" }}
            className="md:hidden fixed left-0 top-0 bottom-0 z-[45] flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/60 shadow-[8px_0_32px_rgba(0,0,0,0.2)]"
          >
            {/* Spacer — sits behind navbar which is z-50, visually hides this area */}
            <div className="h-14 shrink-0 border-b border-border/30" />

            {/* Scrollable nav content */}
            <div
              className="sidebar-scroll px-4 py-6 flex flex-col"
              style={{ overflowY: "scroll", flex: "1 1 0", minHeight: 0 }}
            >
              <motion.nav
                className="flex flex-col gap-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
                  },
                }}
              >
                {NAV_LINKS.map((link) => {
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
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                        <span className={cn(active ? "font-semibold" : "font-medium")}>{link.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              <div className="mt-auto pt-8 px-1">
                <p className="text-xs flex flex-col gap-0.5">
                  <span className="text-muted-foreground/50">made by</span>
                  <span className="font-semibold">
                    <CanvasText
                      text="Takt Akira"
                      backgroundClassName="bg-muted-foreground"
                      colors={["#fb7185", "#f43f5e", "#e11d48", "#4ecdc4", "#2dd4bf", "#14b8a6"]}
                      lineGap={4}
                      animationDuration={15}
                    />
                  </span>
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
