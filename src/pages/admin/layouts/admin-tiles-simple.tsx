import { Link } from 'react-router-dom';
import { FileText, Users, Music2, GraduationCap, FolderOpen, Quote, UserCheck, Video } from 'lucide-react';

// Admin tiles configuration
const adminTiles = [
  {
    id: 'posts',
    title: 'Posts',
    href: '/admin/posts',
    icon: FileText,
    color: {
      icon: 'text-pink-500 dark:text-pink-400',
      bg: 'bg-pink-100 dark:bg-pink-900/40',
      gradient: 'from-pink-50/80 to-pink-50/20 dark:from-pink-950/30 dark:to-transparent',
    },
  },
  {
    id: 'api',
    title: 'API & Configs',
    href: '/admin/api-config',
    icon: Video,
    color: {
      icon: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/40',
      gradient: 'from-red-50/80 to-red-50/20 dark:from-red-950/30 dark:to-transparent',
    },
  },
  {
    id: 'quotes',
    title: 'Quotes',
    href: '/admin/quotes',
    icon: Quote,
    color: {
      icon: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/40',
      gradient: 'from-rose-50/80 to-rose-50/20 dark:from-rose-950/30 dark:to-transparent',
    },
  },
  {
    id: 'requests',
    title: 'Requests',
    href: '/admin/access-requests',
    icon: UserCheck,
    color: {
      icon: 'text-sky-500 dark:text-sky-400',
      bg: 'bg-sky-100 dark:bg-sky-900/40',
      gradient: 'from-sky-50/80 to-sky-50/20 dark:from-sky-950/30 dark:to-transparent',
    },
  },
  {
    id: 'members',
    title: 'Members',
    href: '/admin/members',
    icon: Users,
    color: {
      icon: 'text-violet-500 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-900/40',
      gradient: 'from-violet-50/80 to-violet-50/20 dark:from-violet-950/30 dark:to-transparent',
    },
  },
  {
    id: 'files',
    title: 'Files',
    href: '/admin/files',
    icon: FolderOpen,
    color: {
      icon: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      gradient: 'from-emerald-50/80 to-emerald-50/20 dark:from-emerald-950/30 dark:to-transparent',
    },
  },
  {
    id: 'tutorials',
    title: 'Tutorials',
    href: '/admin/tutorials',
    icon: GraduationCap,
    color: {
      icon: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      gradient: 'from-amber-50/80 to-amber-50/20 dark:from-amber-950/30 dark:to-transparent',
    },
  },
  {
    id: 'music',
    title: 'Music',
    href: '/admin/music',
    icon: Music2,
    color: {
      icon: 'text-cyan-500 dark:text-cyan-400',
      bg: 'bg-cyan-100 dark:bg-cyan-900/40',
      gradient: 'from-cyan-50/80 to-cyan-50/20 dark:from-cyan-950/30 dark:to-transparent',
    },
  },
];

// Simple bento grid - uses desktop design for all screen sizes
export function AdminTilesSimple() {
  return (
    <div className="w-full h-full overflow-hidden p-2">
      <div 
        className="grid h-full gap-1.5 sm:gap-2 w-full"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gridTemplateAreas: '"item1 item2 item2 item3" "item1 item2 item2 item3" "item1 item5 item6 item3" "item4 item5 item6 item3" "item4 item7 item8 item8" "item4 item7 item8 item8"'
        }}
      >
        {/* item1: Posts - Tall left */}
        <Link
          to={adminTiles[0].href}
          className={`flex flex-col items-start justify-between rounded-lg border border-pink-600/60 shadow-[0_0_10px_rgba(219,39,119,0.2)] hover:shadow-[0_0_20px_rgba(219,39,119,0.3),0_0_40px_rgba(219,39,119,0.15)] bg-gradient-to-br ${adminTiles[0].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group`}
          style={{ gridArea: 'item1' }}
        >
          <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${adminTiles[0].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <FileText className={`w-3 h-3 sm:w-5 sm:h-5 ${adminTiles[0].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight mt-auto truncate w-full">{adminTiles[0].title}</div>
        </Link>

        {/* item2: API & Configs - Wide top center */}
        <Link
          to={adminTiles[1].href}
          className={`flex items-center justify-start gap-1.5 sm:gap-3 rounded-lg border border-red-600/60 shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.3),0_0_40px_rgba(220,38,38,0.15)] bg-gradient-to-br ${adminTiles[1].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group`}
          style={{ gridArea: 'item2' }}
        >
          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg ${adminTiles[1].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Video className={`w-4 h-4 sm:w-6 sm:h-6 ${adminTiles[1].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight truncate">{adminTiles[1].title}</div>
        </Link>

        {/* item3: Quotes - Tall right */}
        <Link
          to={adminTiles[2].href}
          className={`flex flex-col items-start justify-between rounded-lg border border-rose-600/60 shadow-[0_0_10px_rgba(225,29,72,0.2)] hover:shadow-[0_0_20px_rgba(225,29,72,0.3),0_0_40px_rgba(225,29,72,0.15)] bg-gradient-to-br ${adminTiles[2].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group overflow-hidden`}
          style={{ gridArea: 'item3' }}
        >
          <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${adminTiles[2].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Quote className={`w-3 h-3 sm:w-5 sm:h-5 ${adminTiles[2].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight mt-auto truncate w-full">{adminTiles[2].title}</div>
        </Link>

        {/* item4: Requests - Tall left bottom */}
        <Link
          to={adminTiles[3].href}
          className={`flex flex-col items-start justify-between rounded-lg border border-sky-600/60 shadow-[0_0_10px_rgba(2,132,199,0.2)] hover:shadow-[0_0_20px_rgba(2,132,199,0.3),0_0_40px_rgba(2,132,199,0.15)] bg-gradient-to-br ${adminTiles[3].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group`}
          style={{ gridArea: 'item4' }}
        >
          <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${adminTiles[3].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <UserCheck className={`w-3 h-3 sm:w-5 sm:h-5 ${adminTiles[3].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight mt-auto truncate w-full">{adminTiles[3].title}</div>
        </Link>

        {/* item5: Members - Small center */}
        <Link
          to={adminTiles[4].href}
          className={`flex items-center justify-start gap-1 sm:gap-2 rounded-lg border border-violet-600/60 shadow-[0_0_10px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3),0_0_40px_rgba(124,58,237,0.15)] bg-gradient-to-br ${adminTiles[4].color.gradient} p-1 sm:p-2 hover:scale-[1.02] transition-all cursor-pointer group`}
          style={{ gridArea: 'item5' }}
        >
          <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-lg ${adminTiles[4].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Users className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${adminTiles[4].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight truncate">{adminTiles[4].title}</div>
        </Link>

        {/* item6: Files - Small center */}
        <Link
          to={adminTiles[5].href}
          className={`flex items-center justify-start gap-1 sm:gap-2 rounded-lg border border-emerald-600/60 shadow-[0_0_10px_rgba(5,150,105,0.2)] hover:shadow-[0_0_20px_rgba(5,150,105,0.3),0_0_40px_rgba(5,150,105,0.15)] bg-gradient-to-br ${adminTiles[5].color.gradient} p-1 sm:p-2 hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden`}
          style={{ gridArea: 'item6' }}
        >
          <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-lg ${adminTiles[5].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
            <FolderOpen className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${adminTiles[5].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight truncate">{adminTiles[5].title}</div>
        </Link>

        {/* item7: Tutorials - Tall center bottom */}
        <Link
          to={adminTiles[6].href}
          className={`flex items-center justify-start gap-1.5 sm:gap-2.5 rounded-lg border border-amber-600/60 shadow-[0_0_10px_rgba(217,119,6,0.2)] hover:shadow-[0_0_20px_rgba(217,119,6,0.3),0_0_40px_rgba(217,119,6,0.15)] bg-gradient-to-br ${adminTiles[6].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group`}
          style={{ gridArea: 'item7' }}
        >
          <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${adminTiles[6].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
            <GraduationCap className={`w-3 h-3 sm:w-5 sm:h-5 ${adminTiles[6].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight truncate">{adminTiles[6].title}</div>
        </Link>

        {/* item8: Music - Wide bottom right */}
        <Link
          to={adminTiles[7].href}
          className={`flex items-center justify-start gap-1.5 sm:gap-3 rounded-lg border border-cyan-600/60 shadow-[0_0_10px_rgba(8,145,178,0.2)] hover:shadow-[0_0_20px_rgba(8,145,178,0.3),0_0_40px_rgba(8,145,178,0.15)] bg-gradient-to-br ${adminTiles[7].color.gradient} p-1.5 sm:p-2.5 hover:scale-[1.01] transition-all cursor-pointer group`}
          style={{ gridArea: 'item8' }}
        >
          <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${adminTiles[7].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Music2 className={`w-3 h-3 sm:w-5 sm:h-5 ${adminTiles[7].color.icon}`} strokeWidth={2} />
          </div>
          <div className="font-bold text-[9px] sm:text-sm leading-tight truncate">{adminTiles[7].title}</div>
        </Link>
      </div>
    </div>
  );
}
