import { Save, Loader2 } from "lucide-react";
import AttractButton from "@/components/mvpblocks/attract-button";

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
      className="flex items-center gap-2 px-4 py-2 rounded-full
        bg-primary text-primary-foreground shadow-sm
        text-sm font-semibold
        hover:bg-primary/90 active:scale-95 transition-all
        disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {saving
        ? <Loader2 size={15} className="animate-spin" />
        : <Save size={15} />
      }
      <span>{saving ? "Saving…" : label}</span>
    </AttractButton>
  );
}
