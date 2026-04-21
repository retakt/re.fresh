import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// ── Exact-match skeletons for each content type ──

export function ContentCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 sm:px-3.5 sm:py-3">
      <Skeleton className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4 rounded" />
        <Skeleton className="h-2 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="shrink-0 w-11 h-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TutorialCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="shrink-0 w-11 h-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3">
      <Skeleton className="shrink-0 w-7 h-7 rounded-full" />
      <Skeleton className="shrink-0 w-9 h-9 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3 rounded" />
        <Skeleton className="h-2.5 w-1/3 rounded" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="shrink-0 w-6 h-6 rounded-md" />
        <Skeleton className="shrink-0 w-6 h-6 rounded-md" />
      </div>
    </div>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="shrink-0 w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-8 w-3/4 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function SongDetailSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-4 w-24 rounded" />
      <div className="flex gap-6">
        <Skeleton className="w-40 h-40 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
