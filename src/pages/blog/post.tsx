import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CalendarDays, ArrowLeft, PenLine, Eye } from "lucide-react";
import { useViewCount, formatViewCount } from "@/hooks/use-view-count";
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const { canManageEditorial, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleReplyRedirect = () => {
    window.location.href = `/login?from=${encodeURIComponent(location.pathname)}`;
  };

  // Swipe right from left edge to go back on mobile
  useSwipeBack();

  // Track view — once per session, returns live count
  const viewCount = useViewCount(post?.id, 'posts', post?.view_count ?? 0);

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
        {post ? (
          // Show content with loading background
          <article className="flex flex-col min-h-[80vh]">
            <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${getCardPalette(post.id).headerGradient}`}>
              {/* Background image skeleton */}
              {post.cover_image && (
                <div className="absolute inset-0 animate-pulse bg-muted/50" />
              )}
              
              {/* Content on top */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={14} /> Blog
                  </Link>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {!post.published && <Badge variant="secondary">Draft</Badge>}
                  {(post.tags ?? []).map((tag: string) => (
                    <button key={tag} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTagColor(tag)}`}>
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
            </div>
          </article>
        ) : (
          <PostDetailSkeleton />
        )}
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
      {/* Full image overlay - shown when holding */}
      {showFullImage && post.cover_image && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/95 overflow-hidden"
          style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onMouseUp={() => setShowFullImage(false)}
          onMouseLeave={() => setShowFullImage(false)}
          onTouchEnd={() => setShowFullImage(false)}
          onTouchCancel={() => setShowFullImage(false)}
        >
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        </div>
      )}

      {/* Header card with cover image as background */}
      <div 
        className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 cursor-pointer select-none`}
        onMouseDown={(e) => {
          // Only trigger on empty space (not on interactive elements)
          if ((e.target as HTMLElement).closest('a, button, h1, p, span')) return;
          if (post.cover_image) {
            e.preventDefault();
            setShowFullImage(true);
          }
        }}
        onTouchStart={(e) => {
          // Only trigger on empty space (not on interactive elements)
          if ((e.target as HTMLElement).closest('a, button, h1, p, span')) return;
          if (post.cover_image) {
            e.preventDefault();
            setShowFullImage(true);
          }
        }}
      >
        {/* Cover image as background */}
        {post.cover_image && (
          <>
            <img
              src={post.cover_image}
              alt={post.title}
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                objectPosition: post.cover_image_position ?? "50% 50%",
                opacity: imageLoaded ? (post.cover_image_opacity ?? 1) : 0,
              }}
            />
            {/* Loading shimmer */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted/50" />
            )}
          </>
        )}
        
        {/* Gradient overlay for glass effect */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getCardPalette(post.id).headerGradient} backdrop-blur-[2px]`} />

        {/* Content on top */}
        <div className="relative z-10">
          {/* Store header color based on title */}
          {(() => {
            const headerColor = getTagColor(post.title);
            
            return (
              <>
                {/* Nav row */}
                <div className="flex items-center justify-between mb-6">
                  <Link
                    to="/blog"
                    className={`inline-flex items-center gap-1.5 text-sm rounded-lg px-2 py-1 hover:opacity-80 transition-opacity ${headerColor}`}
                  >
                    <ArrowLeft size={14} /> Blog
                  </Link>
                  {canManageEditorial && (
                    <Link to={`/admin/posts/edit/${post.id}`}>
                      <Button variant="ghost" size="sm" className={`gap-1.5 rounded-lg px-2 py-1 hover:opacity-80 transition-opacity ${headerColor}`}>
                        <PenLine size={13} /> Edit
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Meta badges */}
                <div className="flex items-center gap-2 mb-2">
                  {!post.published && (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {(post.tags ?? []).map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => navigate(`/blog?tag=${encodeURIComponent(tag)}`)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold hover:opacity-80 transition-opacity ${headerColor}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                <h1 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight rounded-lg px-3 py-2 w-fit mb-2 ${headerColor}`}>
                  {post.title}
                </h1>

                <div className="flex items-start justify-between gap-3">
                  {post.excerpt && (
                    <p className={`text-sm leading-tight rounded-lg px-3 py-2 w-fit ${headerColor}`}>
                      {post.excerpt}
                    </p>
                  )}
                  
                  <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap ${headerColor}`}>
                    <CalendarDays size={13} />
                    {format(new Date(post.created_at), "MMMM d, yyyy")}
                    {viewCount > 0 && (
                      <><span className="opacity-30 mx-0.5">·</span><Eye size={11} />{formatViewCount(viewCount)}</>
                    )}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-1 sm:px-2">
          {/* Desktop */}
          <div className="hidden sm:block prose prose-sm max-w-none" style={{ lineHeight: "1.3" }}>
            {blocks.length > 0
              ? blocks.map((block) => {
                  const hasCodeBlock = block.html.includes('data-animated-code');
                  return (
                    <section key={block.id} id={block.id} className="group relative">
                      {hasCodeBlock ? (
                        <PostContentRenderer html={block.html} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />
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
          
          {/* Mobile */}
          <div 
            className="sm:hidden prose max-w-none"
            style={{ fontSize: "12px", lineHeight: "1.3" }}
          >
            {blocks.length > 0
              ? blocks.map((block) => {
                  const hasCodeBlock = block.html.includes('data-animated-code');
                  return (
                    <section key={block.id} id={block.id} className="group relative">
                      {hasCodeBlock ? (
                        <PostContentRenderer html={block.html} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />
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
