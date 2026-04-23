import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

const TABS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/blog", icon: BookOpen, label: "Blog" },
  { href: "/music", icon: Music2, label: "Music" },
  { href: "/tutorials", icon: GraduationCap, label: "Learn" },
  { href: "/files", icon: FolderOpen, label: "Files" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/97 backdrop-blur-lg shadow-[0_-1px_12px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[56px]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              to={tab.href}
              aria-current={active ? "page" : undefined}
              onTouchStart={() => prefetchRoute(tab.href)}
              onMouseEnter={() => prefetchRoute(tab.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-[3px] text-[9px] font-semibold outline-none transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.4 : 1.8}
                className="transition-all"
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
