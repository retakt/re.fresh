import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarDays, PenLine, BookOpen, ArrowRight, RefreshCw } from "lucide-react";
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

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = usePersistedState<string[]>("blog-tag-filter", []);
  const { canManageEditorial } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!canManageEditorial) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) {
      setError("Failed to load posts. Please try again.");
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  }, [canManageEditorial]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Pull-to-refresh on mobile
  const { pullDistance, refreshing, isTriggered } = usePullToRefresh({
    onRefresh: fetchPosts,
    disabled: loading,
  });

  // Memoize tags to avoid recomputing on every render
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => (p as any).tags || []))),
    [posts]
  );

  const filtered = useMemo(
    () => tagFilter.length === 0
      ? posts
      : posts.filter((p) =>
          tagFilter.some((f) => ((p as any).tags || []).includes(f))
        ),
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
            <Button size="sm" className="gap-1.5">
              <PenLine size={14} /> New post
            </Button>
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
            const tags: string[] = (post as any).tags || [];
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
                className={`group relative flex items-center gap-3.5 rounded-xl border bg-gradient-to-r ${palette.gradient} ${palette.border} px-3.5 py-3 transition-all hover:shadow-lg ${palette.hoverShadow} hover:-translate-y-0.5 active:scale-[0.99]`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                  <BookOpen size={14} className={palette.iconColor} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!post.published && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 shrink-0">Draft</Badge>
                    )}
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {post.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {dateStr && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                        <CalendarDays size={9} />{dateStr}
                      </span>
                    )}
                    {tags.slice(0, 2).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        aria-label={`Filter by tag ${tag}`}
                        aria-pressed={tagFilter.includes(tag)}
                        onClick={(e) => { e.preventDefault(); setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]); }}
                        className={`text-[10px] px-1.5 py-px rounded-full transition-colors ${
                          tagFilter.includes(tag) ? "bg-primary text-primary-foreground" : `${palette.badge} hover:opacity-80`
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

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
