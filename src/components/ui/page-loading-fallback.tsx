export function PageLoadingFallback() {
  return (
    <div className="min-h-[var(--app-height)] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-muted border-t-foreground/60 rounded-full animate-spin" />
        <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}
