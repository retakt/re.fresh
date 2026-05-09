export function PageLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium text-primary">
          re
        </span>
      </div>
    </div>
  );
}
