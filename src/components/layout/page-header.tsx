import type { ReactNode } from "react";

/**
 * Consistent page header used across all main sections.
 * Fixed min-height ensures the content below never jumps when switching pages.
 *
 * Usage:
 *   <PageHeader title="Blog" subtitle="Articles & thoughts..." action={<Button>New post</Button>} />
 */
export function PageHeader({
  title,
  subtitle,
  subtitle2,
  action,
}: {
  title: string;
  subtitle?: string;
  subtitle2?: string;
  action?: ReactNode;
}) {
  return (
    // min-h-[5rem] = 80px — enough for title + 2 subtitle lines + breathing room
    // This is the same on every page so content always starts at the same Y position
    <div className="flex items-start justify-between gap-4 min-h-[5rem]">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        {subtitle2 && (
          <p className="text-sm text-muted-foreground">{subtitle2}</p>
        )}
      </div>

      {/* Action button (optional) — aligned to top-right */}
      {action && (
        <div className="shrink-0 pt-0.5">{action}</div>
      )}
    </div>
  );
}
