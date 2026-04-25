import { Save, Loader2 } from "lucide-react";
import AttractButton from "@/components/mvpblocks/attract-button";

/**
 * FloatingSave — fixed bottom-right save button for editor pages.
 * Uses AttractButton for the magnetic particle hover effect.
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
    <AttractButton
      type="button"
      onClick={onClick}
      disabled={saving}
      aria-label={saving ? "Saving…" : label}
      attractRadius={40}
      particleCount={10}
      particleClassName="bg-primary-foreground"
      className="fixed z-40 bottom-[4.8rem] right-4 md:bottom-8 md:right-8
        flex items-center gap-2 px-4 py-2.5 rounded-full
        bg-primary text-primary-foreground shadow-lg shadow-primary/25
        text-sm font-semibold min-w-0
        hover:bg-primary/90 active:scale-95 transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        touch-manipulation"
    >
      {saving
        ? <Loader2 size={15} className="animate-spin" />
        : <Save size={15} />
      }
      <span className="hidden sm:inline">{saving ? "Saving…" : label}</span>
    </AttractButton>
  );
}
