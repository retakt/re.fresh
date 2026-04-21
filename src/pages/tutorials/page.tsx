import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { GraduationCap, Plus, BookMarked, ArrowRight, RefreshCw } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { TutorialCardSkeleton } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { canManageEditorial } = useAuth();

  const fetchTutorials = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) {
      setError("Failed to load tutorials. Please try again.");
    } else if (data) {
      setTutorials(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTutorials(); }, []);

  const handleTagClick = (tag: string) => setTagFilter((prev) => (prev === tag ? null : tag));

  const filtered = useMemo(
    () => tagFilter
      ? tutorials.filter((t) => t.difficulty === tagFilter || t.category === tagFilter)
      : tutorials,
    [tutorials, tagFilter]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tutorials"
        subtitle="My learning resources..."
        subtitle2="Guides, Tricks and some Lessons everyone should know!"
        action={canManageEditorial ? (
          <Link to="/admin/tutorials">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Add tutorial
            </Button>
          </Link>
        ) : undefined}
      />

      {tagFilter && (
        <button
          onClick={() => setTagFilter(null)}
          aria-label="Clear filter"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          {tagFilter} ✕
        </button>
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
              {tagFilter ? `No tutorials tagged "${tagFilter}"` : "Learning resources will appear here."}
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
                className={`group relative flex items-center gap-3.5 rounded-xl border bg-gradient-to-r ${palette.gradient} ${palette.border} px-3.5 py-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                  <BookMarked size={14} className={palette.iconColor} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate block">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {item.difficulty && (
                      <button
                        type="button"
                        aria-label={`Filter by difficulty: ${item.difficulty}`}
                        aria-pressed={tagFilter === item.difficulty}
                        onClick={(e) => { e.preventDefault(); handleTagClick(item.difficulty!); }}
                        className={`text-[10px] px-1.5 py-px rounded-full font-semibold transition-opacity hover:opacity-70 ${DIFFICULTY_COLORS[item.difficulty] ?? ""}`}
                      >
                        {item.difficulty}
                      </button>
                    )}
                    {item.category && (
                      <button
                        type="button"
                        aria-label={`Filter by category: ${item.category}`}
                        aria-pressed={tagFilter === item.category}
                        onClick={(e) => { e.preventDefault(); handleTagClick(item.category!); }}
                        className={`text-[10px] px-1.5 py-px rounded-full font-medium ${palette.badge} hover:opacity-80 transition-opacity`}
                      >
                        {item.category}
                      </button>
                    )}
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
