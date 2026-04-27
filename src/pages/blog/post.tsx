import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
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
import { getCardPalette } from "@/lib/cardColors";
import { PostDetailSkeleton } from "@/components/ui/skeleton";
import { PostContentRenderer } from "@/components/post-content-renderer";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(() => getPrefetchedData<Post>('posts', slug ?? ''));
  const [loading, setLoading] = useState(!getPrefetchedData<Post>('posts', slug ?? ''));
  const [notFound, setNotFound] = useState(false);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const { canManageEditorial, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${getCardPalette(post.id).headerGradient}`}>
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
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent">
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
            <button
              key={tag}
              onClick={() => navigate(`/blog?tag=${encodeURIComponent(tag)}`)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold hover:opacity-80 transition-opacity ${getTagColor(tag)}`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-balance mb-3">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            style={{
              objectPosition: post.cover_image_position ?? "50% 50%",
              opacity: post.cover_image_opacity ?? 1,
            }}
          />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-1 sm:px-2">
          <div className="prose prose-sm max-w-2xl prose-headings:tracking-tight prose-p:leading-7 prose-img:rounded-lg prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4">
            {blocks.length > 0
              ? blocks.map((block) => {
                  // Check if block contains code blocks
                  const hasCodeBlock = block.html.includes('data-animated-code');
                  
                  return (
                    <section
                      key={block.id}
                      id={block.id}
                      className="group relative"
                    >
                      {hasCodeBlock ? (
                        <PostContentRenderer 
                          html={block.html}
                        />
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                      )}
                    </section>
                  );
                })
              : post.content.includes('data-animated-code') ? (
                <PostContentRenderer html={post.content} />
              ) : (
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
