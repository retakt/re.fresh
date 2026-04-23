import { Check, Clock3, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

export type AvatarHistoryItem = {
  id: string;
  avatar_url: string;
  storage_path: string;
  is_active: boolean;
  created_at: string;
};

type AvatarHistoryDialogProps = {
  currentAvatarUrl: string | null;
  displayName: string;
  initials: string;
  items: AvatarHistoryItem[];
  open: boolean;
  restoring: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAvatar: (item: AvatarHistoryItem) => void;
};

export function AvatarHistoryDialog({
  currentAvatarUrl,
  displayName,
  initials,
  items,
  open,
  restoring,
  onOpenChange,
  onSelectAvatar,
}: AvatarHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border border-border/60 bg-background p-0">
        {/* Header */}
        <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <DialogHeader className="text-left flex-1">
            <DialogTitle className="text-sm font-semibold">Profile photos</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-3 shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Current avatar — compact, theme-aware */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-border/50 bg-secondary/30 p-3 shadow-sm">
              <Avatar
                className="size-28 sm:size-36 rounded-xl border border-border/40 shadow-md"
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitUserSelect: "none", userSelect: "none" }}
              >
                {currentAvatarUrl ? (
                  <AvatarImage
                    src={currentAvatarUrl}
                    alt={displayName}
                    className="object-cover pointer-events-none"
                    draggable={false}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold rounded-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* History strip */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  History
                </p>
                <p className="text-[10px] text-muted-foreground">{items.length} saved</p>
              </div>

              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2.5 pb-2">
                  {items.map((item) => {
                    const isCurrent = item.is_active;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectAvatar(item)}
                        disabled={restoring || isCurrent}
                        className={`group relative overflow-hidden rounded-xl border transition-all ${
                          isCurrent
                            ? "border-primary/60 ring-2 ring-primary/20"
                            : "border-border/50 hover:border-primary/40 hover:-translate-y-0.5"
                        } ${restoring ? "opacity-60" : ""}`}
                      >
                        <Avatar className="size-16 rounded-xl sm:size-20">
                          <AvatarImage src={item.avatar_url} alt={displayName} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                          <p className="flex items-center gap-0.5 text-[9px] font-medium text-white/90">
                            <Clock3 size={9} />
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {isCurrent && (
                          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground shadow-sm">
                            <Check size={9} /> Now
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end border-t border-border/50 pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
