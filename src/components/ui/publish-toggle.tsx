import { cn } from "@/lib/utils";

/**
 * Teal pill toggle for published/draft state.
 * ON (published) = teal glow. OFF (draft) = muted theme colour.
 * Wrapped in a larger tap area for mobile (min 44px).
 */
export function PublishToggle({
  published,
  onChange,
  disabled,
}: {
  published: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      disabled={disabled}
      onClick={onChange}
      title={published ? "Published — click to unpublish" : "Draft — click to publish"}
      className="flex items-center justify-center h-9 w-12 touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <span className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-all duration-200",
        published
          ? "border-transparent bg-[#11D8C2] shadow-[0_0_8px_rgba(17,216,194,0.5)]"
          : "border-border/60 bg-muted/60 dark:bg-white/10 dark:border-white/20"
      )}>
        <span className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 rounded-full shadow-sm ring-0 transition-transform duration-200",
          published
            ? "translate-x-4 bg-white"
            : "translate-x-0 bg-foreground/30 dark:bg-white/50"
        )} />
      </span>
    </button>
  );
}
