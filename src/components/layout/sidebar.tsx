import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap,
  User, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <aside className="hidden md:flex flex-col w-44 shrink-0 py-8 sticky top-13 h-[calc(100vh-3.25rem)] overflow-y-auto scrollbar-none">
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.8}
                className="shrink-0"
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider + version */}
      <div className="mt-auto pt-6">
        <p className="text-xs px-3 flex flex-col">
          <span className="text-muted-foreground">made by</span>
          <span className="font-bold">Takt Akira</span>
        </p>
      </div>
    </aside>
  );
}