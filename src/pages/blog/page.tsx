import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarDays, PenLine, BookOpen, ArrowRight, RefreshCw, Eye } from "lucide-react";
import { formatViewCount } from "@/hooks/use-view-count";
import { format } from "date-fns";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { BlogCardSkeleton } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh.tsx";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { prefetchPostData } from "@/lib/prefetch";
import { usePersistedState } from "@/hooks/use-persisted-state";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";
import { MarqueeText } from "@/components/ui/marquee-text";

type EnrichedPost = Post & { _tags: string[] };

export default function BlogPage() {
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = usePersistedState<string[]>("blog-tag-filter", []);
  const { canManageEditorial } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) setTagFilter([tag]);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (!canManageEditorial) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) { setError("Failed to load posts. Please try again."); setLoading(false); return; }
    if (!data) { setLoading(false); return; }

    // Fetch all tags from junction table — 8s timeout so loading never hangs forever
    const ids = data.map((p) => p.id);
    const tagTimeout = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 8_000)
    );
    const { data: ctData } = await Promise.race([
      supabase
        .from("content_tags")
        .select("content_id, tags(name)")
        .eq("content_type", "post")
        .in("content_id", ids),
      tagTimeout,
    ]);

    const tagMap: Record<string, string[]> = {};
    (ctData ?? []).forEach((row: any) => {
      if (!tagMap[row.content_id]) tagMap[row.content_id] = [];
      if (row.tags?.name) tagMap[row.content_id].push(row.tags.name);
    });

    setPosts(data.map((p) => ({ ...p, _tags: tagMap[p.id] ?? [] })));
    setLoading(false);
  }, [canManageEditorial]);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  // Re-fetch when returning from bfcache (tab switch, phone sleep, back-forward nav)
  useEffect(() => {
    const handleResume = () => { void fetchPosts(); };
    window.addEventListener("app-resume", handleResume);
    return () => window.removeEventListener("app-resume", handleResume);
  }, [fetchPosts]);

  // Loading state safety net - prevent stuck loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 15000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Pull-to-refresh on mobile — always enabled so users can escape a stuck skeleton
  const { pullDistance, refreshing, isTriggered } = usePullToRefresh({
    onRefresh: fetchPosts,
    disabled: false,
  });

  // Memoize tags to avoid recomputing on every render
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p._tags))),
    [posts]
  );

  const filtered = useMemo(
    () => tagFilter.length === 0
      ? posts
      : posts.filter((p) => tagFilter.some((f) => p._tags.includes(f))),
    [posts, tagFilter]
  );

  return (
    <div className="space-y-4">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} isTriggered={isTriggered} />
      <PageHeader
        title="Blog"
        subtitle="Articles & thoughts..."
        action={canManageEditorial ? (
          <Link to="/admin/posts/new">
            <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
              <PenLine size={14} /> New post
            </MagneticButton>
          </Link>
        ) : undefined}
      />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )}
              aria-pressed={tagFilter.includes(tag)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                tagFilter.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
          {tagFilter.length > 0 && (
            <button
              onClick={() => setTagFilter([])}
              aria-label="Clear tag filter"
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => <BlogCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchPosts} className="gap-1.5">
            <RefreshCw size={13} /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              {tagFilter.length > 0 ? `No posts tagged "${tagFilter.join('" or "')}"` : "Check back soon for articles and thoughts."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((post) => {
            const palette = getCardPalette(post.id);
            const tags: string[] = post._tags;
            const dateStr = (() => {
              try { return format(new Date(post.created_at), "MMM d, yyyy"); }
              catch { return ""; }
            })();
            return (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                onMouseEnter={() => prefetchPostData('posts', post.slug)}
                onFocus={() => prefetchPostData('posts', post.slug)}
                className={`group relative flex items-center gap-3 rounded-xl border bg-gradient-to-r ${palette.gradient} ${palette.border} px-3 py-2.5 transition-all hover:shadow-lg ${palette.hoverShadow} hover:-translate-y-0.5 active:scale-[0.99]`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                  <BookOpen size={13} className={palette.iconColor} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {!post.published && (
                      <Badge variant="secondary" className="py-0 px-1.5 shrink-0" style={{ fontSize: "clamp(8px, 2vw, 10px)" }}>Draft</Badge>
                    )}
                    <MarqueeText
                      text={post.title}
                      className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight"
                      style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {dateStr && (
                      <span className="flex items-center gap-0.5 text-muted-foreground/60" style={{ fontSize: "clamp(8px, 2vw, 10px)" }}>
                        <CalendarDays size={9} />{dateStr}
                      </span>
                    )}
                    {tags.slice(0, 3).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => { e.preventDefault(); setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]); }}
                        className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                          tagFilter.includes(tag) ? "bg-primary text-primary-foreground" : `${palette.badge} hover:opacity-80`
                        }`}
                        style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View count — right side, vertically centered */}
                {(post.view_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground/70 font-medium shrink-0" style={{ fontSize: "clamp(8px, 2vw, 10px)" }}>
                    <Eye size={9} />{formatViewCount(post.view_count)}
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
