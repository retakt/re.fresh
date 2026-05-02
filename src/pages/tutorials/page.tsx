import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { GraduationCap, Plus, BookMarked, ArrowRight, RefreshCw, Eye } from "lucide-react";
import { formatViewCount } from "@/hooks/use-view-count";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { TutorialCardSkeleton } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { prefetchPostData } from "@/lib/prefetch";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { MarqueeText } from "@/components/ui/marquee-text";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

type EnrichedTutorial = Tutorial & { _tags: string[]; _categories: string[] };

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<EnrichedTutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = usePersistedState<string[]>("tutorials-tag-filter", []);
  const { canManageEditorial } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) setTagFilter([tag]);
  }, []);

  const fetchTutorials = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) {
      setError("Failed to load tutorials. Please try again.");
      setLoading(false);
      return;
    }
    if (!data) { setLoading(false); return; }

    // Fetch tags + categories — 8s timeout so loading never hangs forever
    const ids = data.map((t) => t.id);
    const tagTimeout = new Promise<[{ data: null }, { data: null }]>((resolve) =>
      setTimeout(() => resolve([{ data: null }, { data: null }]), 8_000)
    );
    const [{ data: ctData }, { data: ccData }] = await Promise.race([
      Promise.all([
        supabase
          .from("content_tags")
          .select("content_id, tags(name)")
          .eq("content_type", "tutorial")
          .in("content_id", ids),
        supabase
          .from("content_categories")
          .select("content_id, categories(name)")
          .eq("content_type", "tutorial")
          .in("content_id", ids),
      ]),
      tagTimeout,
    ]);

    // Build lookup maps
    const tagMap: Record<string, string[]> = {};
    (ctData ?? []).forEach((row: any) => {
      if (!tagMap[row.content_id]) tagMap[row.content_id] = [];
      if (row.tags?.name) tagMap[row.content_id].push(row.tags.name);
    });
    const catMap: Record<string, string[]> = {};
    (ccData ?? []).forEach((row: any) => {
      if (!catMap[row.content_id]) catMap[row.content_id] = [];
      if (row.categories?.name) catMap[row.content_id].push(row.categories.name);
    });

    setTutorials(data.map((t) => ({ ...t, _tags: tagMap[t.id] ?? [], _categories: catMap[t.id] ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTutorials(); }, [fetchTutorials]);

  // Re-fetch when returning from bfcache (tab switch, phone sleep, back-forward nav)
  useEffect(() => {
    const handleResume = () => { void fetchTutorials(); };
    window.addEventListener("app-resume", handleResume);
    return () => window.removeEventListener("app-resume", handleResume);
  }, [fetchTutorials]);

  const { pullDistance, refreshing, isTriggered } = usePullToRefresh({
    onRefresh: fetchTutorials,
    disabled: false,
  });

  // Toggle a tag in/out of the active filter set
  const handleTagClick = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(
    () => tagFilter.length === 0
      ? tutorials
      : tutorials.filter((t) =>
          tagFilter.some((f) =>
            t.difficulty === f ||
            t._categories.some((c) => c.toLowerCase() === f.toLowerCase()) ||
            t._tags.some((tag) => tag.toLowerCase() === f.toLowerCase())
          )
        ),
    [tutorials, tagFilter]
  );

  return (
    <div className="space-y-4">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} isTriggered={isTriggered} />
      <PageHeader
        title="Tutorials"
        subtitle="Guides, Tricks and some Lessons..."
        action={canManageEditorial ? (
          <Link to="/admin/tutorials/new">
            <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
              <Plus size={14} /> Add tutorial
            </MagneticButton>
          </Link>
        ) : undefined}
      />

      {tagFilter.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter.map((f) => (
            <button
              key={f}
              onClick={() => handleTagClick(f)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              {f} ✕
            </button>
          ))}
          {tagFilter.length > 1 && (
            <button
              onClick={() => setTagFilter([])}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => <TutorialCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchTutorials} className="gap-1.5">
            <RefreshCw size={13} /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><GraduationCap /></EmptyMedia>
            <EmptyTitle>No tutorials yet</EmptyTitle>
            <EmptyDescription>
              {tagFilter.length > 0 ? `No tutorials matching "${tagFilter.join('" or "')}"` : "Learning resources will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item) => {
            const palette = getCardPalette(item.id);
            return (
              <Link
                key={item.id}
                to={`/tutorials/${item.slug}`}
                onMouseEnter={() => prefetchPostData('tutorials', item.slug)}
                onFocus={() => prefetchPostData('tutorials', item.slug)}
                className={`group relative flex items-center gap-3 rounded-xl border bg-gradient-to-r ${palette.gradient} ${palette.border} px-3 py-2.5 transition-all hover:shadow-lg ${palette.hoverShadow} hover:-translate-y-0.5 active:scale-[0.99]`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                  <BookMarked size={13} className={palette.iconColor} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate text-foreground group-hover:text-primary transition-colors leading-tight"
                    style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
                  >
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.difficulty && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleTagClick(item.difficulty!); }}
                        className={`px-2 py-0.5 rounded-full font-semibold transition-all hover:opacity-70 ${
                          tagFilter.includes(item.difficulty)
                            ? "ring-2 ring-primary/50 " + (DIFFICULTY_COLORS[item.difficulty.toLowerCase()] ?? palette.badge)
                            : DIFFICULTY_COLORS[item.difficulty.toLowerCase()] ?? palette.badge
                        }`}
                        style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                      >
                        {item.difficulty}
                      </button>
                    )}
                    {item._categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleTagClick(cat); }}
                        className={`px-2 py-0.5 rounded-full font-medium transition-all hover:opacity-80 ${
                          tagFilter.includes(cat) ? "ring-2 ring-primary/50 " + palette.badge : palette.badge
                        }`}
                        style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                      >
                        {cat}
                      </button>
                    ))}
                    {item._tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleTagClick(tag); }}
                        className={`px-2 py-0.5 rounded-full font-medium transition-all hover:opacity-80 ${
                          tagFilter.includes(tag) ? "ring-2 ring-primary/50 " + palette.badge : palette.badge
                        }`}
                        style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View count — right side, vertically centered */}
                {(item.view_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground/70 font-medium shrink-0" style={{ fontSize: "clamp(8px, 2vw, 10px)" }}>
                    <Eye size={9} />{formatViewCount(item.view_count)}
                  </span>
                )}

                <ArrowRight
                  size={11}
                  className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
