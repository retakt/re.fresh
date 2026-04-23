import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

const NAV_LINKS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/blog", icon: BookOpen, label: "Blog" },
  { href: "/music", icon: Music2, label: "Music" },
  { href: "/tutorials", icon: GraduationCap, label: "Tutorials" },
  { href: "/about", icon: User, label: "About" },
  { href: "/files", icon: FolderOpen, label: "Files" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-44 shrink-0 py-8 sticky top-13 h-[calc(100vh-3.25rem)] overflow-y-auto scrollbar-none pr-2">
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
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className="shrink-0"
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — made by, pushed to bottom, indented to align with nav labels */}
      <div className="mt-auto pt-6 text-center ">
        <p className="text-xs flex flex-col gap-0.5">
          <span className="text-muted-foreground/50">made by</span>
          <span className="font-semibold text-muted-foreground/80">Takt Akira</span>
        </p>
      </div>
    </aside>
  );
}
