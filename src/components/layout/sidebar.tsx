import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen, X, MessageSquare, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";
import { CanvasText } from "@/components/ui/canvas-text";

const NAV_LINKS = [
  { href: "/whats-new", icon: Sparkles,       label: "What's New", teal: true  },
  { href: "/",          icon: Home,           label: "Home",       teal: false },
  { href: "/blog",      icon: BookOpen,       label: "Blog",       teal: false },
  { href: "/music",     icon: Music2,         label: "Music",      teal: false },
  { href: "/tutorials", icon: GraduationCap,  label: "Tutorials",  teal: false },
  { href: "/about",     icon: User,           label: "About",      teal: false },
  { href: "/files",     icon: FolderOpen,     label: "Files",      teal: false },
  { href: "/chat",      icon: MessageSquare,  label: "Chat",       teal: false },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* ΓöÇΓöÇ DESKTOP: lg and above only ΓöÇΓöÇ */}
      <aside className="hidden lg:flex flex-col w-44 shrink-0 py-8 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-none pr-2 border-r border-border/50 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] dark:border-white/[0.07] dark:shadow-[2px_0_8px_-2px_rgba(200,210,255,0.12)]">
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
                    ? link.teal
                      ? "bg-[#11D8C2]/10 text-[#11D8C2]"
                      : "bg-primary/10 text-primary"
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

      {/* ΓöÇΓöÇ MOBILE: backdrop ΓöÇΓöÇ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden fixed inset-0 z-[40] bg-black/50 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ΓöÇΓöÇ MOBILE: drawer ΓöÇΓöÇ */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 40, 
              mass: 1.2,
              velocity: 2
            }}
            style={{ width: "min(240px, 72vw)" }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-[45] flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/60 shadow-[8px_0_32px_rgba(0,0,0,0.2)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.6),1px_0_0_0_rgba(255,255,255,0.05)]"
          >
            {/* Spacer ΓÇö sits behind navbar which is z-50, visually hides this area */}
            <div className="h-14 shrink-0 border-b border-border/30" />

            {/* Scrollable nav content ΓÇö ref resets scroll to top on every open */}
            <div
              ref={(el) => { if (el) el.scrollTop = 0; }}
              className="scrollbar-none px-4 py-6 flex flex-col"
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
                            ? link.teal
                              ? "bg-[#11D8C2]/10 text-[#11D8C2] shadow-sm"
                              : "bg-primary/10 text-primary shadow-sm"
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
