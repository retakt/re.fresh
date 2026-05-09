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
      border: 'border-pink-200/60 dark:border-pink-800/30',
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
      border: 'border-red-200/60 dark:border-red-800/30',
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
      border: 'border-rose-200/60 dark:border-rose-800/30',
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
      border: 'border-sky-200/60 dark:border-sky-800/30',
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
      border: 'border-violet-200/60 dark:border-violet-800/30',
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
      border: 'border-emerald-200/60 dark:border-emerald-800/30',
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
      border: 'border-amber-200/60 dark:border-amber-800/30',
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
      border: 'border-cyan-200/60 dark:border-cyan-800/30',
    },
  },
];

/**
 * Mobile Bento Grid Layout - Replicating the CSS Grid structure
 * 
 * Grid Structure (4 columns × 6 rows):
 * - item1: Posts (col 1, rows 1-3) - Tall left tile
 * - item2: API & Configs (cols 2-3, rows 1-2) - Wide top center
 * - item3: Quotes (col 4, rows 1-4) - Tall right tile
 * - item4: Requests (col 1, rows 4-6) - Tall left bottom
 * - item5: Members (col 2, row 3) - Small center
 * - item6: Files (col 3, row 3) - Small center
 * - item7: Tutorials (col 2, rows 4-6) - Tall center bottom
 * - item8: Music (cols 3-4, rows 5-6) - Wide bottom right
 */
export function MobileBentoGrid() {
  return (
    <div className="w-full h-full overflow-hidden p-2">
      <div 
        className="grid h-full gap-2"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gridTemplateAreas: '"item1 item2 item2 item3" "item1 item2 item2 item3" "item1 item5 item6 item3" "item4 item5 item6 item3" "item4 item7 item8 item8" "item4 item7 item8 item8"'
        }}
      >
        {/* item1: Posts - Tall left tile */}
        <Link
          to={adminTiles[0].href}
          className={`flex flex-col items-start justify-between rounded-lg border bg-gradient-to-br ${adminTiles[0].color.gradient} ${adminTiles[0].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
          style={{ gridArea: 'item1' }}
        >
          <div className={`w-10 h-10 rounded-lg ${adminTiles[0].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <FileText size={20} className={adminTiles[0].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-sm leading-tight mt-auto">{adminTiles[0].title}</div>
        </Link>

        {/* item2: API & Configs - Wide top center */}
        <Link
          to={adminTiles[1].href}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border bg-gradient-to-br ${adminTiles[1].color.gradient} ${adminTiles[1].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
          style={{ gridArea: 'item2' }}
        >
          <div className={`w-12 h-12 rounded-lg ${adminTiles[1].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Video size={24} className={adminTiles[1].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-xs text-center leading-tight">{adminTiles[1].title}</div>
        </Link>

        {/* item3: Quotes - Tall right tile */}
        <Link
          to={adminTiles[2].href}
          className={`flex flex-col items-start justify-between rounded-lg border bg-gradient-to-br ${adminTiles[2].color.gradient} ${adminTiles[2].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group overflow-hidden`}
          style={{ gridArea: 'item3' }}
        >
          <div className={`w-10 h-10 rounded-lg ${adminTiles[2].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Quote size={20} className={adminTiles[2].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-sm leading-tight mt-auto">{adminTiles[2].title}</div>
        </Link>

        {/* item4: Requests - Tall left bottom */}
        <Link
          to={adminTiles[3].href}
          className={`flex flex-col items-start justify-between rounded-lg border bg-gradient-to-br ${adminTiles[3].color.gradient} ${adminTiles[3].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
          style={{ gridArea: 'item4' }}
        >
          <div className={`w-10 h-10 rounded-lg ${adminTiles[3].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <UserCheck size={20} className={adminTiles[3].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-sm leading-tight mt-auto">{adminTiles[3].title}</div>
        </Link>

        {/* item5: Members - Small center */}
        <Link
          to={adminTiles[4].href}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border bg-gradient-to-br ${adminTiles[4].color.gradient} ${adminTiles[4].color.border} p-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group`}
          style={{ gridArea: 'item5' }}
        >
          <div className={`w-8 h-8 rounded-lg ${adminTiles[4].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Users size={16} className={adminTiles[4].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-semibold text-[9px] text-center leading-tight">{adminTiles[4].title}</div>
        </Link>

        {/* item6: Files - Small center */}
        <Link
          to={adminTiles[5].href}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border bg-gradient-to-br ${adminTiles[5].color.gradient} ${adminTiles[5].color.border} p-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group overflow-hidden`}
          style={{ gridArea: 'item6' }}
        >
          <div className={`w-8 h-8 rounded-lg ${adminTiles[5].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <FolderOpen size={16} className={adminTiles[5].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-semibold text-[9px] text-center leading-tight">{adminTiles[5].title}</div>
        </Link>

        {/* item7: Tutorials - Tall center bottom */}
        <Link
          to={adminTiles[6].href}
          className={`flex flex-col items-start justify-between rounded-lg border bg-gradient-to-br ${adminTiles[6].color.gradient} ${adminTiles[6].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
          style={{ gridArea: 'item7' }}
        >
          <div className={`w-10 h-10 rounded-lg ${adminTiles[6].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <GraduationCap size={20} className={adminTiles[6].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-sm leading-tight mt-auto">{adminTiles[6].title}</div>
        </Link>

        {/* item8: Music - Wide bottom right */}
        <Link
          to={adminTiles[7].href}
          className={`flex items-center justify-center gap-3 rounded-lg border bg-gradient-to-br ${adminTiles[7].color.gradient} ${adminTiles[7].color.border} p-3 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
          style={{ gridArea: 'item8' }}
        >
          <div className={`w-10 h-10 rounded-lg ${adminTiles[7].color.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Music2 size={20} className={adminTiles[7].color.icon} strokeWidth={2.5} />
          </div>
          <div className="font-bold text-sm leading-tight">{adminTiles[7].title}</div>
        </Link>
      </div>
    </div>
  );
}
