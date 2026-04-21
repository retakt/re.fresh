import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarDays, PenLine, BookOpen, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { canManageEditorial } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!canManageEditorial) {
        query = query.eq("published", true);
      }

      const { data, error } = await query;
      if (!error && data) setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, [canManageEditorial]);

  const allTags = Array.from(
    new Set(posts.flatMap((p) => (p as any).tags || []))
  );

  const filtered = tagFilter
    ? posts.filter((p) => ((p as any).tags || []).includes(tagFilter))
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">Articles & thoughts...</p>
        </div>
        {canManageEditorial && (
          <Link to="/admin/posts/new">
            <Button size="sm" className="gap-1.5">
              <PenLine size={14} /> New post
            </Button>
          </Link>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter((prev) => (prev === tag ? null : tag))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tagFilter === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              {tagFilter
                ? `No posts tagged "${tagFilter}"`
                : "Check back soon for articles and thoughts."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const palette = getCardPalette(post.id);
            return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group relative block overflow-hidden rounded-lg border border-sky-100/80 bg-gradient-to-br from-sky-50/70 via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-sky-900/30 dark:from-sky-950/20 dark:via-background dark:to-background"
                >
                  {/* Subtle left accent bar */}
                  <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${palette.gradient}`} />

                <div className="pl-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h2>
                    <ArrowRight
                      size={14}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    />
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {!post.published && (
                        <Badge variant="secondary" className="text-xs py-0 px-1.5">
                          Draft
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {format(new Date(post.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {(post as any).tags && (post as any).tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {((post as any).tags as string[]).slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setTagFilter((prev) => (prev === tag ? null : tag));
                            }}
                            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                              tagFilter === tag
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
