import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Music2, GraduationCap, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
      <div className="flex items-stretch h-16">
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
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 1.8}
                className="transition-all"
              />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </nav>
  );
}