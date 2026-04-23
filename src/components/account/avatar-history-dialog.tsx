import { Check, Clock3, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="max-w-xl border-border/70 bg-card p-0 sm:max-w-2xl">
        <div className="border-b border-border/60 px-5 py-4 flex items-start justify-between">
          <DialogHeader className="text-left flex-1">
            <DialogTitle className="text-base sm:text-lg">Profile photos</DialogTitle>
            <DialogDescription>
              Tap a thumbnail to switch back to an older photo.
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-3 shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/70">
            <div className="flex aspect-square items-center justify-center bg-secondary/20 p-4">
              <Avatar 
                className="size-full max-h-[26rem] max-w-[26rem] rounded-2xl border border-border/60 shadow-lg"
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
                <AvatarFallback className="bg-primary/10 text-primary text-5xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                History
              </p>
              <p className="text-xs text-muted-foreground">
                Stored photos: {items.length}
              </p>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {items.map((item) => {
                  const isCurrent = item.is_active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectAvatar(item)}
                      disabled={restoring || isCurrent}
                      className={`group relative overflow-hidden rounded-2xl border transition-all ${
                        isCurrent
                          ? "border-primary/60 ring-2 ring-primary/20"
                          : "border-border/60 hover:border-primary/40 hover:-translate-y-0.5"
                      } ${restoring ? "opacity-70" : ""}`}
                    >
                      <Avatar className="size-20 rounded-2xl sm:size-24">
                        <AvatarImage src={item.avatar_url} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left">
                        <p className="flex items-center gap-1 text-[10px] font-medium text-white/90">
                          <Clock3 size={10} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {isCurrent ? (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
                          <Check size={10} />
                          Current
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
