import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, GraduationCap, Music2, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/use-debounce";

type SearchResult = {
  id: string;
  title: string;
  type: "post" | "tutorial" | "music";
  href: string;
  excerpt?: string;
  tags?: string[];
};

const TYPE_ICON = {
  post: BookOpen,
  tutorial: GraduationCap,
  music: Music2,
};

const TYPE_COLOR = {
  post: "text-sky-500",
  tutorial: "text-amber-500",
  music: "text-cyan-500",
};

const TYPE_BG = {
  post: "bg-sky-500/10",
  tutorial: "bg-amber-500/10",
  music: "bg-cyan-500/10",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const q = `%${debouncedQuery.trim()}%`;
      const [posts, tutorials, music] = await Promise.all([
        supabase.from("posts").select("id,title,slug,excerpt,tags").ilike("title", q).eq("published", true).limit(5),
        supabase.from("tutorials").select("id,title,slug,excerpt,tags,difficulty").ilike("title", q).eq("published", true).limit(5),
        supabase.from("music").select("id,title,genre,tags,release_type,album").ilike("title", q).eq("published", true).limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(posts.data ?? []).map((p) => ({
          id: p.id, title: p.title, type: "post" as const,
          href: `/blog/${p.slug}`, excerpt: p.excerpt ?? undefined, tags: p.tags,
        })),
        ...(tutorials.data ?? []).map((t) => ({
          id: t.id, title: t.title, type: "tutorial" as const,
          href: `/tutorials/${t.slug}`, excerpt: t.difficulty ?? undefined, tags: t.tags,
        })),
        ...(music.data ?? []).map((m) => ({
          id: m.id, title: m.title, type: "music" as const,
          href: (m.release_type === "album" || m.release_type === "ep") && m.album
            ? `/music/album/${encodeURIComponent(m.album)}`
            : `/music/song/${m.id}`,
          tags: m.tags,
        })),
      ];
      setResults(mapped);
      setLoading(false);
    };

    void search();
  }, [debouncedQuery]);

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Search" subtitle="Find posts, tutorials, and music" />

      {/* Search input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="pl-9 pr-9"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl border bg-muted/30 animate-pulse" />)}
        </div>
      )}

      {/* No results */}
      {!loading && debouncedQuery && results.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No results for "{debouncedQuery}"
        </p>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((result) => {
            const Icon = TYPE_ICON[result.type];
            const color = TYPE_COLOR[result.type];
            const bg = TYPE_BG[result.type];
            return (
              <Link
                key={result.id}
                to={result.href}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.99]"
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon size={14} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{result.title}</p>
                  {result.excerpt && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.excerpt}</p>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {result.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{result.type}</Badge>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <p className="text-xs text-muted-foreground/60 text-center py-8">
          Type to search posts, tutorials, and music.
        </p>
      )}
    </div>
  );
}
