import { Link } from "react-router-dom";
import { FileText, GraduationCap, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const EDITOR_TILES = [
  {
    href: "/admin/posts",
    icon: FileText,
    label: "Posts",
    desc: "Write & manage blog posts",
    iconColor: "text-pink-500 dark:text-pink-400",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    gradient: "from-pink-50/80 to-pink-50/20 dark:from-pink-950/30 dark:to-transparent",
    border: "border-pink-200/60 dark:border-pink-800/30",
    newHref: "/admin/posts/new",
    newLabel: "New post",
  },
  {
    href: "/admin/tutorials",
    icon: GraduationCap,
    label: "Tutorials",
    desc: "Manage learning resources",
    iconColor: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    gradient: "from-amber-50/80 to-amber-50/20 dark:from-amber-950/30 dark:to-transparent",
    border: "border-amber-200/60 dark:border-amber-800/30",
    newHref: "/admin/tutorials/new",
    newLabel: "New tutorial",
  },
];

export default function EditorPage() {
  const { displayName } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenLine size={18} className="text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Editor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome back, {displayName}. Manage your content below.
        </p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {EDITOR_TILES.map(({ href, icon: Icon, label, desc, iconColor, iconBg, gradient, border, newHref, newLabel }) => (
          <div
            key={href}
            className={`flex flex-col gap-4 rounded-xl border bg-gradient-to-br ${gradient} ${border} p-5`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={22} className={iconColor} strokeWidth={1.8} />
              </div>
              <Link
                to={newHref}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                + {newLabel}
              </Link>
            </div>
            <div>
              <Link to={href} className="font-semibold text-sm hover:text-primary transition-colors">
                {label}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 pt-2">
        Need access to music, files, or member management? Contact an admin.
      </p>
    </div>
  );
}
