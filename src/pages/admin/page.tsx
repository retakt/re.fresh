import { Link } from "react-router-dom";
import { FileText, Users, Music2, GraduationCap, FolderOpen, Quote, UserCheck, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SimpleTerminal } from "@/components/admin/simple-terminal";

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
    href: "/admin/api-config",
    icon: Video,
    label: "API & Configs",
    desc: "YouTube downloader settings",
    iconColor: "text-red-500 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    gradient: "from-red-50/80 to-red-50/20 dark:from-red-950/30 dark:to-transparent",
    border: "border-red-200/60 dark:border-red-800/30",
  },
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
  {
    href: "/admin/access-requests",
    icon: UserCheck,
    label: "Requests",
    desc: "Review member access requests",
    iconColor: "text-sky-500 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    gradient: "from-sky-50/80 to-sky-50/20 dark:from-sky-950/30 dark:to-transparent",
    border: "border-sky-200/60 dark:border-sky-800/30",
  },
];

export default function AdminPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your site content and members
        </p>
      </div>

      {/* Bento Grid Layout - Compact tiles with responsive sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-3 auto-rows-[75px] sm:auto-rows-[85px] lg:auto-rows-[95px]">
        
        {/* Terminal - First on mobile (spans 3 rows), right side on desktop */}
        <div className="order-1 lg:order-2 row-span-3 sm:row-span-4 lg:col-span-3 lg:row-span-4 rounded-lg sm:rounded-xl overflow-hidden">
          <SimpleTerminal />
        </div>

        {/* Posts - Second on mobile, first column on desktop */}
        <Link
          to="/admin/posts"
          className="order-2 lg:order-1 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-pink-50/80 to-pink-50/20 dark:from-pink-950/30 dark:to-transparent border-pink-200/60 dark:border-pink-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} className="sm:w-5 sm:h-5 text-pink-500 dark:text-pink-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Posts</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Write & manage blog posts</div>
          </div>
        </Link>

        {/* API & Configs */}
        <Link
          to="/admin/api-config"
          className="order-3 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-red-50/80 to-red-50/20 dark:from-red-950/30 dark:to-transparent border-red-200/60 dark:border-red-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Video size={18} className="sm:w-5 sm:h-5 text-red-500 dark:text-red-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">API & Configs</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">YouTube downloader settings</div>
          </div>
        </Link>

        {/* Quotes */}
        <Link
          to="/admin/quotes"
          className="order-4 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-rose-50/80 to-rose-50/20 dark:from-rose-950/30 dark:to-transparent border-rose-200/60 dark:border-rose-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Quote size={18} className="sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Quotes</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Manage homepage quotes</div>
          </div>
        </Link>

        {/* Requests */}
        <Link
          to="/admin/access-requests"
          className="order-5 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-sky-50/80 to-sky-50/20 dark:from-sky-950/30 dark:to-transparent border-sky-200/60 dark:border-sky-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserCheck size={18} className="sm:w-5 sm:h-5 text-sky-500 dark:text-sky-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Requests</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Review member access requests</div>
          </div>
        </Link>

        {/* Tutorials */}
        <Link
          to="/admin/tutorials"
          className="order-6 lg:col-span-2 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-amber-50/80 to-amber-50/20 dark:from-amber-950/30 dark:to-transparent border-amber-200/60 dark:border-amber-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <GraduationCap size={18} className="sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Tutorials</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Manage learning resources</div>
          </div>
        </Link>

        {/* Members */}
        <Link
          to="/admin/members"
          className="order-7 lg:col-span-2 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-violet-50/80 to-violet-50/20 dark:from-violet-950/30 dark:to-transparent border-violet-200/60 dark:border-violet-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users size={18} className="sm:w-5 sm:h-5 text-violet-500 dark:text-violet-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Members</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Manage member accounts</div>
          </div>
        </Link>

        {/* Files */}
        <Link
          to="/admin/files"
          className="order-8 lg:col-span-2 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-emerald-50/80 to-emerald-50/20 dark:from-emerald-950/30 dark:to-transparent border-emerald-200/60 dark:border-emerald-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FolderOpen size={18} className="sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Files</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Manage shared files</div>
          </div>
        </Link>

        {/* Music */}
        <Link
          to="/admin/music"
          className="order-9 lg:col-span-2 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border bg-gradient-to-br from-cyan-50/80 to-cyan-50/20 dark:from-cyan-950/30 dark:to-transparent border-cyan-200/60 dark:border-cyan-800/30 p-2.5 sm:p-3 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Music2 size={18} className="sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base">Music</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Manage tracks & albums</div>
          </div>
        </Link>

      </div>
    </div>
  );
}
