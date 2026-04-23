import { Save, Loader2 } from "lucide-react";

/**
 * FloatingSave — fixed bottom-right save button for editor pages on mobile.
 * Sits above the bottom nav (bottom-[4.5rem] on mobile, bottom-6 on desktop).
 */
export function FloatingSave({
  onClick,
  saving,
  label = "Save",
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      aria-label={saving ? "Saving…" : label}
      className="fixed z-40 bottom-[4.8rem] right-4 md:bottom-8 md:right-8
        flex items-center gap-2 px-4 py-2.5 rounded-full
        bg-primary text-primary-foreground shadow-lg shadow-primary/25
        text-sm font-semibold
        hover:bg-primary/90 active:scale-95 transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        touch-manipulation"
    >
      {saving
        ? <Loader2 size={15} className="animate-spin" />
        : <Save size={15} />
      }
      <span className="hidden sm:inline">{saving ? "Saving…" : label}</span>
    </button>
  );
}
