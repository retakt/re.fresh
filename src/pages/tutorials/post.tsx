import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ArrowLeft, PenLine, CalendarDays, Eye } from "lucide-react";
import { useViewCount, formatViewCount } from "@/hooks/use-view-count";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { getContentTags, getContentCategories } from "@/lib/tags";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { getPrefetchedData } from "@/lib/prefetch";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { getTagColor } from "@/lib/tagColors";
import { PostDetailSkeleton } from "@/components/ui/skeleton";

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
};

export default function TutorialPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tutorial, setTutorial] = useState<Tutorial | null>(() => getPrefetchedData<Tutorial>('tutorials', slug ?? ''));
  const [loading, setLoading] = useState(!getPrefetchedData<Tutorial>('tutorials', slug ?? ''));
  const [notFound, setNotFound] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const { canManageEditorial } = useAuth();
  const navigate = useNavigate();

  useSwipeBack();

  // Track view — once per session, returns live count
  const viewCount = useViewCount(tutorial?.id, 'tutorials', tutorial?.view_count ?? 0);

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setTutorial(data);
      // Fetch tags and categories from junction tables
      const [fetchedTags, fetchedCategories] = await Promise.all([
        getContentTags("tutorial", data.id),
        getContentCategories("tutorial", data.id),
      ]);
      setTags(fetchedTags);
      setCategories(fetchedCategories);
      setLoading(false);
    };

    fetchTutorial();
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl">
        {tutorial ? (
          // Show content with loading background
          <article>
            <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${getCardPalette(tutorial.id).headerGradient}`}>
              {/* Background image skeleton */}
              {tutorial.cover_image && (
                <div className="absolute inset-0 animate-pulse bg-muted/50" />
              )}
              
              {/* Content on top */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <Link to="/tutorials" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={14} /> Tutorials
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 items-center mb-3">
                  {tutorial.difficulty && (
                    <button className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      DIFFICULTY_COLORS[tutorial.difficulty.toLowerCase() as keyof typeof DIFFICULTY_COLORS] ??
                      "bg-secondary text-secondary-foreground"
                    }`}>
                      {tutorial.difficulty}
                    </button>
                  )}
                </div>

                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-balance mb-3">
                  {tutorial.title}
                </h1>

                {tutorial.excerpt && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {tutorial.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {format(new Date(tutorial.created_at), "MMMM d, yyyy")}
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

  if (notFound || !tutorial) {
      return (
      <div className="max-w-2xl py-16 text-center space-y-3">
        <p className="text-muted-foreground">Tutorial not found.</p>
        <Link to="/tutorials">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={14} /> Back to tutorials
          </Button>
        </Link>
      </div>
    );
  }

  const palette = getCardPalette(tutorial.id);

  return (
    <article className="w-full max-w-3xl">
      {/* Full image overlay - shown when holding */}
      {showFullImage && tutorial.cover_image && (
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
            src={tutorial.cover_image}
            alt={tutorial.title}
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
          if (tutorial.cover_image) {
            e.preventDefault();
            setShowFullImage(true);
          }
        }}
        onTouchStart={(e) => {
          // Only trigger on empty space (not on interactive elements)
          if ((e.target as HTMLElement).closest('a, button, h1, p, span')) return;
          if (tutorial.cover_image) {
            e.preventDefault();
            setShowFullImage(true);
          }
        }}
      >
        {/* Cover image as background */}
        {tutorial.cover_image && (
          <>
            <img
              src={tutorial.cover_image}
              alt={tutorial.title}
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* Loading shimmer */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted/50" />
            )}
          </>
        )}
        
        {/* Gradient overlay for glass effect */}
        <div className={`absolute inset-0 bg-gradient-to-b ${palette.headerGradient} backdrop-blur-[2px]`} />

        {/* Content on top */}
        <div className="relative z-10">
          {/* Store header color based on title */}
          {(() => {
            const headerColor = getTagColor(tutorial.title);
            
            return (
              <>
                {/* Nav row */}
                <div className="flex items-center justify-between mb-6">
                  <Link
                    to="/tutorials"
                    className={`inline-flex items-center gap-1.5 text-sm rounded-lg px-2 py-1 hover:opacity-80 transition-opacity ${headerColor}`}
                  >
                    <ArrowLeft size={14} /> Tutorials
                  </Link>
                  {canManageEditorial && (
                    <Link to={`/admin/tutorials/edit/${tutorial.id}`}>
                      <Button variant="ghost" size="sm" className={`gap-1.5 rounded-lg px-2 py-1 hover:opacity-80 transition-opacity ${headerColor}`}>
                        <PenLine size={13} /> Edit
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  {tutorial.difficulty && (
                    <button
                      onClick={() => navigate(`/tutorials?tag=${encodeURIComponent(tutorial.difficulty!)}`)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity ${headerColor}`}
                    >
                      {tutorial.difficulty}
                    </button>
                  )}
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => navigate(`/tutorials?tag=${encodeURIComponent(cat)}`)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity ${headerColor}`}
                    >
                      {cat}
                    </button>
                  ))}
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => navigate(`/tutorials?tag=${encodeURIComponent(tag)}`)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold hover:opacity-80 transition-opacity ${headerColor}`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {!tutorial.published && <Badge variant="secondary">Draft</Badge>}
                </div>

                <h1 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight rounded-lg px-3 py-2 w-fit mb-2 ${headerColor}`}>
                  {tutorial.title}
                </h1>

                <div className="flex items-start justify-between gap-3">
                  {tutorial.excerpt && (
                    <p className={`text-sm leading-tight rounded-lg px-3 py-2 w-fit ${headerColor}`}>
                      {tutorial.excerpt}
                    </p>
                  )}
                  
                  <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap ${headerColor}`}>
                    <CalendarDays size={13} />
                    {format(new Date(tutorial.created_at), "MMMM d, yyyy")}
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

      {/* Content - Desktop */}
      {tutorial.content && (
        <>
          <div
            className="hidden sm:block prose prose-sm max-w-none"
            style={{ lineHeight: "1.3" }}
            dangerouslySetInnerHTML={{ __html: tutorial.content }}
          />
          
          {/* Content - Mobile */}
          <div
            className="sm:hidden prose max-w-none"
            style={{ fontSize: "12px", lineHeight: "1.3" }}
            dangerouslySetInnerHTML={{ __html: tutorial.content }}
          />
        </>
      )}
    </article>
  );
}
