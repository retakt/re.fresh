import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CalendarDays, ArrowLeft, PenLine } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import CommentsSection from "@/components/comments/comments-section.tsx";
import { getBlockLabel, parseContentBlocks } from "@/lib/content-blocks";
import { getPrefetchedData } from "@/lib/prefetch";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { getTagColor } from "@/lib/tagColors";
import { PostDetailSkeleton } from "@/components/ui/skeleton";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(() => getPrefetchedData<Post>('posts', slug ?? ''));
  const [loading, setLoading] = useState(!getPrefetchedData<Post>('posts', slug ?? ''));
  const [notFound, setNotFound] = useState(false);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const { canManageEditorial, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleReplyRedirect = () => {
    window.location.href = `/login?from=${encodeURIComponent(location.pathname)}`;
  };

  // Swipe right from left edge to go back on mobile
  useSwipeBack();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) setNotFound(true);
      else setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  const blocks = useMemo(
    () => (post?.content ? parseContentBlocks(post.content) : []),
    [post?.content],
  );

  const activeAnchor = useMemo(
    () => blocks.find((block) => block.id === activeAnchorId) ?? null,
    [blocks, activeAnchorId],
  );

  if (loading) {
    return (
      <div className="max-w-3xl">
        <PostDetailSkeleton />
      </div>
    );
  }

  if (notFound || !post) {
      return (
      <div className="max-w-2xl py-16 text-center space-y-3">
        <p className="text-muted-foreground">Post not found.</p>
        <Link to="/blog">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={14} /> Back to blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl flex flex-col min-h-[80vh]">
      {/* Gradient header band */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-sky-100/80 bg-gradient-to-b from-sky-100/55 via-sky-50/35 to-transparent px-5 py-7 shadow-sm sm:px-7 sm:py-8 dark:border-sky-900/30 dark:from-sky-950/35 dark:via-sky-950/12 dark:to-transparent">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Blog
          </Link>
          {canManageEditorial && (
            <Link to={`/admin/posts/edit/${post.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <PenLine size={13} /> Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-3">
          {!post.published && (
            <Badge variant="secondary">Draft</Badge>
          )}
          {(post.tags ?? []).map((tag: string) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTagColor(tag)}`}
            >
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-balance mb-3">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {format(new Date(post.created_at), "MMMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="mb-8 overflow-hidden rounded-xl border border-border/60 shadow-sm">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-1 sm:px-2">
          <div className="prose prose-sm max-w-2xl dark:prose-invert prose-headings:tracking-tight prose-headings:text-slate-950 prose-p:leading-7 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-sky-700 hover:prose-a:text-sky-800 prose-strong:text-slate-900 prose-blockquote:border-l-sky-200 prose-blockquote:text-slate-600 prose-img:rounded-lg dark:prose-headings:text-slate-50 dark:prose-p:text-slate-200 dark:prose-li:text-slate-200 dark:prose-a:text-sky-300 dark:hover:prose-a:text-sky-200 dark:prose-strong:text-slate-100 dark:prose-blockquote:border-l-sky-800 dark:prose-blockquote:text-slate-300">
            {blocks.length > 0
              ? blocks.map((block) => (
                  <section
                    key={block.id}
                    id={block.id}
                    className={`group relative mb-4 rounded-xl border transition-colors ${
                      activeAnchorId === block.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:border-border/70 hover:bg-muted/20"
                    }`}
                  >
                    {block.canAnchor && (
                      <button
                        type="button"
                        onClick={() => isAuthenticated ? setActiveAnchorId(block.id) : handleReplyRedirect()}
                        className="absolute right-2 top-2 z-10 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[10px] font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      >
                        Reply
                      </button>
                    )}
                    <div
                      className="not-prose px-1 py-1 sm:px-2"
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                    {block.canAnchor && (
                      <button
                        type="button"
                        onClick={() => isAuthenticated ? setActiveAnchorId(block.id) : handleReplyRedirect()}
                        className="mb-2 ml-1 inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Comment on {getBlockLabel(block)}
                      </button>
                    )}
                  </section>
                ))
              : (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              )}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <CommentsSection
          postId={post.id}
          activeAnchor={activeAnchor}
          onClearAnchor={() => setActiveAnchorId(null)}
        />
      </div>
    </article>
  );
}
