import { Link } from "react-router-dom";
import { FileText, Users, Music2, GraduationCap, FolderOpen, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MEMBER_TILES = [
  {
    href: "/admin/posts",
    icon: FileText,
    label: "Posts",
    desc: "Write & manage blog posts",
    iconColor: "text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    href: "/admin/tutorials",
    icon: GraduationCap,
    label: "Tutorials",
    desc: "Manage learning resources",
    iconColor: "text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

const ADMIN_ONLY_TILES = [
  {
    href: "/admin/music",
    icon: Music2,
    label: "Music",
    desc: "Manage tracks",
    iconColor: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    href: "/admin/files",
    icon: FolderOpen,
    label: "Files",
    desc: "Manage shared files",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    href: "/admin/members",
    icon: Users,
    label: "Members",
    desc: "Manage member accounts",
    iconColor: "text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    href: "/admin/quotes",
    icon: Quote,
    label: "Quotes",
    desc: "Manage music quotes",
    iconColor: "text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
];

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const tiles = isAdmin ? [...MEMBER_TILES, ...ADMIN_ONLY_TILES] : MEMBER_TILES;

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Manage your site content and members" : "Manage blog and tutorial content"}
          </p>
        </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {tiles.map(({ href, icon: Icon, label, desc, iconColor, bg }) => (
          <Link
            key={href}
            to={href}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={iconColor} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
