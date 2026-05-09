import { TAG_COLORS, type Notice } from '@/config/notices';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Card - Reusable card component for notices
// ══════════════════════════════════════════════════════════════════════════════

interface NoticeCardProps {
  notice: Notice;
  variant?: 'panel' | 'page';
  onLinkClick?: () => void;
}

export function NoticeCard({ notice, variant = 'panel', onLinkClick }: NoticeCardProps) {
  const tagColor = TAG_COLORS[notice.tag];
  const isPage = variant === 'page';

  return (
    <div className={cn(
      "relative",
      isPage && "space-y-6"
    )}>
      {/* Tag */}
      <div 
        className={cn(
          "inline-block px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider",
          "font-mono"
        )}
        style={{
          backgroundColor: tagColor.bg,
          color: tagColor.text,
          border: `1px solid ${tagColor.border}`
        }}
      >
        {notice.tag}
      </div>

      {/* Title */}
      <h3 className={cn(
        "font-semibold leading-tight",
        isPage ? "text-2xl mt-4" : "text-base mt-3",
        "dark:text-white text-gray-900"
      )}>
        {notice.title}
      </h3>

      {/* Body */}
      <p className={cn(
        "leading-relaxed",
        isPage ? "text-base mt-3" : "text-[13px] mt-2",
        "dark:text-white/80 text-gray-700"
      )}>
        {notice.body}
      </p>

      {/* Link CTA */}
      {notice.link && (
        <a
          href={notice.link.url}
          onClick={onLinkClick}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 font-medium transition-colors",
            isPage ? "text-sm mt-4" : "text-xs mt-3",
            "dark:text-white dark:hover:text-white/80",
            "text-gray-900 hover:text-gray-700"
          )}
        >
          {notice.link.text}
        </a>
      )}

      {/* Date */}
      <div className={cn(
        "text-[11px] font-mono",
        isPage ? "mt-6" : "mt-4",
        "dark:text-white/50 text-gray-500"
      )}>
        {notice.date}
      </div>
    </div>
  );
}
