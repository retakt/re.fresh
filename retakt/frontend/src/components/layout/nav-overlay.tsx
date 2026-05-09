import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen, MessageSquare, Sparkles, TerminalSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";
import { useAuthContext } from "@/components/providers/auth";

import { CanvasText } from "@/components/ui/canvas-text";

interface NavLink {
  href: string;
  icon: React.ElementType;
  label: string;
  labelJP: string;
  color: string;        // neon accent per link
  authRequired?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/whats-new", icon: Sparkles,       label: "What's New", labelJP: "新着",     color: "#39FF14" },  // Lime green
  { href: "/",          icon: Home,           label: "Home",       labelJP: "ホーム",   color: "#FF2E9B" },  // Neon pink
  { href: "/blog",      icon: BookOpen,       label: "Blog",       labelJP: "記事",     color: "#00FFFF" },  // Cyan
  { href: "/music",     icon: Music2,         label: "Music",      labelJP: "音楽",     color: "#FF6B35" },  // Orange
  { href: "/tutorials", icon: GraduationCap,  label: "Tutorials",  labelJP: "学習",     color: "#FDF500" }, // Yellow
  { href: "/about",     icon: User,           label: "About",      labelJP: "概要",     color: "#39FF14" },  // Lime green
  { href: "/files",     icon: FolderOpen,     label: "Files",      labelJP: "ファイル", color: "#CD00FF" },  // Purple
  { href: "/chat",      icon: MessageSquare,  label: "Chat",       labelJP: "チャット", color: "#39FF14" },  // Lime green
  { href: "/terminal",  icon: TerminalSquare, label: "Terminal",   labelJP: "端末",     color: "#CD00FF", authRequired: true },  // Vibrant purple
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.03 },
  },
};

const linkVariant = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 600, damping: 30 },
  },
};

interface NavOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function NavOverlay({ open, onClose }: NavOverlayProps) {
  const location = useLocation();
  const { role } = useAuthContext();

  const visibleLinks = NAV_LINKS.filter(
    link => !link.authRequired || role !== "guest"
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — click to close, below navbar */}
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[48] bg-black/40 backdrop-blur-[2px] top-14"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating nav panel */}
          <motion.aside
            key="nav-panel"
            initial={{ x: "-110%" }}
            animate={{ x: 0 }}
            exit={{ x: "-110%" }}
            transition={{ 
              type: "spring",
              stiffness: 180,
              damping: 18,
              mass: 0.9
            }}
            className={cn(
              "fixed left-0 top-14 bottom-0 z-[49]",
              "w-[min(280px,80vw)]",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Extended background that covers overshoot */}
            <div className="absolute inset-0 -left-12 bg-black/30 backdrop-blur-2xl border-r border-white/[0.08] shadow-[4px_0_40px_rgba(0,0,0,0.3)]" />
            
            {/* Content wrapper */}
            <div className="relative z-10 flex flex-col h-full w-full">
              {/* Top accent line */}
              <div className="h-px w-full bg-gradient-to-r from-[#00ffe0]/40 via-[#a3e635]/30 to-[#c084fc]/20" />

              {/* Nav links — scrollable with hidden scrollbar */}
              <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
                <motion.nav
                  key={String(open)}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-0 relative z-10"
                >
                  {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    const active =
                      link.href === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(link.href);

                    return (
                      <motion.div key={link.href} variants={linkVariant}>
                        <Link
                          to={link.href}
                          aria-current={active ? "page" : undefined}
                          onMouseEnter={() => prefetchRoute(link.href)}
                          onClick={onClose}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg px-2 py-2",
                            "text-base font-medium outline-none transition-all duration-150",
                            "focus-visible:ring-2 focus-visible:ring-primary",
                            active
                              ? "bg-white/[0.06] border border-white/[0.08]"
                              : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.05]"
                          )}
                        >
                          {/* Animated dot that morphs on hover */}
                          <motion.span
                            className="shrink-0"
                            initial={false}
                            animate={
                              active
                                ? { width: 4, height: 24, borderRadius: 999 }
                                : { width: 4, height: 4, borderRadius: 999 }
                            }
                            whileHover={
                              !active
                                ? { width: 4, height: 24, borderRadius: 999 }
                                : undefined
                            }
                            style={{ backgroundColor: link.color }}
                            transition={{
                              type: "spring",
                              stiffness: 600,
                              damping: 22,
                              duration: 0.25,
                            }}
                          />

                          {/* Icon — colored when active */}
                          <Icon
                            size={20}
                            strokeWidth={active ? 2.5 : 1.8}
                            style={{ color: active ? link.color : undefined }}
                            className={cn(
                              "shrink-0 transition-colors duration-150",
                              !active && "text-muted-foreground group-hover:text-foreground"
                            )}
                          />

                          {/* Label */}
                          <span
                            className={cn(
                              "flex-1 transition-colors duration-150",
                              active ? "font-semibold" : "text-muted-foreground group-hover:text-foreground"
                            )}
                            style={{ 
                              color: active ? `${link.color}CC` : undefined  // 80% opacity for lighter shade
                            }}
                          >
                            {link.label}
                          </span>

                          {/* JP label — yellow, always visible */}
                          <span
                            className={cn(
                              "text-[11px] font-mono tracking-wider transition-opacity duration-150 text-yellow-400",
                              active ? "opacity-80" : "opacity-40 group-hover:opacity-60"
                            )}
                          >
                            {link.labelJP}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.nav>
              </div>

              {/* Footer brand with CanvasText */}
              <div className="px-4 py-2 border-t border-white/[0.06]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-pink-400/70">made by~</span>
                  <CanvasText
                    text="takt"
                    className="text-xl font-extrabold leading-none"
                    backgroundClassName="bg-[#CD00FF]"
                    colors={["#37EBF3","#1AC5E0","#FDF500","#CD00FF","#E4556A","#CE1DCD","#37EBF3","#1AC5E0","#CD00FF","#FDF500","#E4556A","#CE1DCD","#37EBF3","#1AC5E0","#CD00FF"]}
                    lineGap={3}
                    animationDuration={15}
                  />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
