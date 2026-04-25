import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen, X,
} from "lucide-react";
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

function NavLinks({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  return (
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
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
            <span className={cn(active ? "font-semibold" : "font-medium")}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
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

      {/* ── MOBILE ONLY: slide-in drawer ── */}

      {/* Backdrop — solid dark overlay, no blur needed */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 w-full h-dvh z-[60] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — responsive: max 256px, never more than 75% of viewport */}
      <aside
        style={{ width: "min(192px, 75vw)" }}
        className={cn(
          "md:hidden fixed top-0 left-0 z-[70] flex flex-col",
          "h-full min-h-dvh",
          "bg-background border-r border-border/60",
          "shadow-[4px_0_24px_rgba(0,0,0,0.12)]",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header — pixel-perfect match to navbar: h-14, px-3, gap-2, border-b, shadow-sm */}
        <div className="flex items-center gap-2 px-3 h-14 border-b border-border/60 bg-background/95 backdrop-blur-md shadow-sm shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X size={19} strokeWidth={2} />
          </button>
          <Link
            to="/"
            onClick={onClose}
            className="font-bold text-lg tracking-tight select-none mt-px"
          >
            <span className="text-sky-400 dark:text-sky-300">re</span>
            <span className="text-primary">.</span>
            <span className="text-foreground">Takt</span>
          </Link>
        </div>

        {/* Nav links — flex-1 pushes "made by" to the absolute bottom */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 flex flex-col">
          <NavLinks onClose={onClose} />
          <div className="mt-auto pt-6 px-0.5">
            <p className="text-xs flex flex-col gap-0.5">
              <span className="text-muted-foreground/50">made by</span>
              <span className="font-semibold text-muted-foreground/80">Takt Akira</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
