import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ArrowLeft, PenLine, BookMarked, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
};

export default function TutorialPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { canManageEditorial } = useAuth();

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) setNotFound(true);
      else setTutorial(data);
      setLoading(false);
    };

    fetchTutorial();
  }, [slug]);

  if (loading) {
      return (
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
        </div>
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
      {/* Gradient header band */}
      <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${palette.headerGradient}`}>
        {/* Nav row */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/tutorials"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Tutorials
          </Link>
          {canManageEditorial && (
            <Link to="/admin/tutorials">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <PenLine size={13} /> Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          {tutorial.difficulty && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[tutorial.difficulty]}`}>
              {tutorial.difficulty}
            </span>
          )}
          {tutorial.category && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${palette.badge}`}>
              {tutorial.category}
            </span>
          )}
          {!tutorial.published && (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-balance mb-3">
          {tutorial.title}
        </h1>

        {tutorial.excerpt && (
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            {tutorial.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {format(new Date(tutorial.created_at), "MMMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Cover image (if exists, shown below header) */}
      {tutorial.cover_image && (
        <img
          src={tutorial.cover_image}
          alt={tutorial.title}
          className="mb-8 h-48 w-full rounded-lg object-cover"
        />
      )}

      {/* Content */}
      {tutorial.content && (
        <div
          className="prose prose-sm max-w-2xl text-foreground/95 dark:prose-invert prose-headings:tracking-tight prose-p:leading-7 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: tutorial.content }}
        />
      )}
    </article>
  );
}
