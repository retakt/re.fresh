import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { GraduationCap, Plus, BookMarked, ArrowRight, Clock } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

function TutorialCard({
  item,
  onTagClick,
}: {
  item: Tutorial;
  onTagClick: (tag: string) => void;
}) {
  const palette = getCardPalette(item.id);

  return (
    <Link
      to={`/tutorials/${item.slug}`}
      className={`group relative overflow-hidden flex items-start gap-4 rounded-xl border bg-gradient-to-r ${palette.gradient} ${palette.border} p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Colored icon */}
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${palette.iconBg}`}>
        <BookMarked size={18} className={palette.iconColor} strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">
            {item.title}
          </span>
          <ArrowRight
            size={14}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
          />
        </div>

        {item.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.excerpt}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {item.difficulty && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onTagClick(item.difficulty!);
              }}
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-opacity hover:opacity-70 ${DIFFICULTY_STYLES[item.difficulty]}`}
            >
              {item.difficulty}
            </button>
          )}
          {item.category && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onTagClick(item.category!);
              }}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${palette.badge} hover:opacity-80 transition-opacity`}
            >
              {item.category}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { canManageEditorial } = useAuth();

  useEffect(() => {
    const fetchTutorials = async () => {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (!error && data) setTutorials(data);
      setLoading(false);
    };
    fetchTutorials();
  }, []);

  const handleTagClick = (tag: string) => {
    setTagFilter((prev) => (prev === tag ? null : tag));
  };

  const filtered = tagFilter
    ? tutorials.filter(
        (t) => t.difficulty === tagFilter || t.category === tagFilter
      )
    : tutorials;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutorials</h1>
          <p className="text-sm text-muted-foreground mt-1">My learning resources...</p>
          <p className="text-sm text-muted-foreground mt-1">Guides, Tricks and some Lessons everyone should know!</p>
        </div>
        {canManageEditorial && (
          <Link to="/admin/tutorials">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Add tutorial
            </Button>
          </Link>
        )}
      </div>

      {tagFilter && (
        <button
          onClick={() => setTagFilter(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          {tagFilter} ✕
        </button>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><GraduationCap /></EmptyMedia>
            <EmptyTitle>No tutorials yet</EmptyTitle>
            <EmptyDescription>
              {tagFilter
                ? `No tutorials tagged "${tagFilter}"`
                : "Learning resources will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <TutorialCard key={item.id} item={item} onTagClick={handleTagClick} />
          ))}
        </div>
      )}
    </div>
  );
}
