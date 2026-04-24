import { Link } from "react-router-dom";
import { FileText, Users, Music2, GraduationCap, FolderOpen, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MEMBER_TILES = [
  {
    href: "/admin/posts",
    icon: FileText,
    label: "Posts",
    desc: "Write & manage blog posts",
    iconColor: "text-pink-500 dark:text-pink-400",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    gradient: "from-pink-50/80 to-pink-50/20 dark:from-pink-950/30 dark:to-transparent",
    border: "border-pink-200/60 dark:border-pink-800/30",
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
  },
];

const ADMIN_ONLY_TILES = [
  {
    href: "/admin/music",
    icon: Music2,
    label: "Music",
    desc: "Manage tracks & albums",
    iconColor: "text-cyan-500 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    gradient: "from-cyan-50/80 to-cyan-50/20 dark:from-cyan-950/30 dark:to-transparent",
    border: "border-cyan-200/60 dark:border-cyan-800/30",
  },
  {
    href: "/admin/files",
    icon: FolderOpen,
    label: "Files",
    desc: "Manage shared files",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    gradient: "from-emerald-50/80 to-emerald-50/20 dark:from-emerald-950/30 dark:to-transparent",
    border: "border-emerald-200/60 dark:border-emerald-800/30",
  },
  {
    href: "/admin/members",
    icon: Users,
    label: "Members",
    desc: "Manage member accounts",
    iconColor: "text-violet-500 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    gradient: "from-violet-50/80 to-violet-50/20 dark:from-violet-950/30 dark:to-transparent",
    border: "border-violet-200/60 dark:border-violet-800/30",
  },
  {
    href: "/admin/quotes",
    icon: Quote,
    label: "Quotes",
    desc: "Manage homepage quotes",
    iconColor: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    gradient: "from-rose-50/80 to-rose-50/20 dark:from-rose-950/30 dark:to-transparent",
    border: "border-rose-200/60 dark:border-rose-800/30",
  },
];

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const tiles = isAdmin ? [...MEMBER_TILES, ...ADMIN_ONLY_TILES] : MEMBER_TILES;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {isAdmin ? "Manage your site content and members" : "Manage blog and tutorial content"}
        </p>
      </div>

      {/* Mobile: smaller tiles, tighter grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {tiles.map(({ href, icon: Icon, label, desc, iconColor, iconBg, gradient, border }) => (
          <Link
            key={href}
            to={href}
            className={`flex flex-col gap-2 sm:gap-4 rounded-lg sm:rounded-xl border bg-gradient-to-br ${gradient} ${border} p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer active:scale-[0.98]`}
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon size={18} className={`${iconColor} sm:hidden`} strokeWidth={2} />
              <Icon size={22} className={`${iconColor} hidden sm:block`} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-semibold text-xs sm:text-sm">{label}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
