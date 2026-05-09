import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Music2, GraduationCap,
  ArrowRight, Quote, CalendarDays, RefreshCw, Eye,
} from "lucide-react";
import { formatViewCount } from "@/hooks/use-view-count";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { ALL_QUOTES, QUOTE_CARD_PALETTES } from "@/lib/quotes";
import { getCardPalette } from "@/lib/cardColors";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { TOOLS } from "@/features/tools";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { ContentCardSkeleton } from "@/components/ui/skeleton.tsx";
import { CanvasText } from "@/components/ui/canvas-text";

type FilterType = "all" | "blog" | "tutorial" | "music";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "Latest",
  blog: "Blog",
  tutorial: "Tutorials",
  music: "Music",
};

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "blog", label: "Blog" },
  { value: "tutorial", label: "Tutorials" },
  { value: "music", label: "Music" },
];

type ContentItem = {
  id: string;
  title: string;
  type: "blog" | "tutorial" | "music";
  href: string;
  date: string;
  meta?: string;
  viewCount?: number;
};

export default function Index() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = usePersistedState<FilterType>("home-filter", "all");

  // Simple daily quote rotation
  const getDailyIndex = () => {
    const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return dayNumber % ALL_QUOTES.length;
  };

  const [quoteIndex, setQuoteIndex] = useState(getDailyIndex);
  const quotePalette = QUOTE_CARD_PALETTES[quoteIndex % QUOTE_CARD_PALETTES.length];
  const quote = ALL_QUOTES[quoteIndex];

  const cycleQuote = () => {
    setQuoteIndex((i) => (i + 1) % ALL_QUOTES.length);
  };

  const fetchAll = async () => {
    try {
      const [postsRes, tutorialsRes, musicRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, slug, created_at, view_count")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("tutorials")
          .select("id, title, slug, created_at, difficulty, view_count")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("music")
          .select("id, title, created_at, genre, release_type, album, view_count")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Fetch tags for posts
      const postIds = (postsRes.data || []).map((p) => p.id);
      const { data: tagData } = postIds.length > 0
        ? await supabase
            .from("content_tags")
            .select("content_id, tags(name)")
            .eq("content_type", "post")
            .in("content_id", postIds)
        : { data: [] };

      // Map post tags
      const postTagMap: Record<string, string> = {};
      for (const row of tagData ?? []) {
        if (!postTagMap[row.content_id]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tagName = (row.tags as any)?.name;
          if (tagName) postTagMap[row.content_id] = `#${tagName}`;
        }
      }

      const mapped: ContentItem[] = [
        ...(postsRes.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          type: "blog" as const,
          href: `/blog/${p.slug}`,
          date: p.created_at,
          meta: postTagMap[p.id] ?? "Blog",
          viewCount: p.view_count ?? 0,
        })),
        ...(tutorialsRes.data || []).map((t) => ({
          id: t.id,
          title: t.title,
          type: "tutorial" as const,
          href: `/tutorials/${t.slug}`,
          date: t.created_at,
          meta: t.difficulty ?? "Tutorial",
          viewCount: t.view_count ?? 0,
        })),
        ...(musicRes.data || []).map((m) => ({
          id: m.id,
          title: m.title,
          type: "music" as const,
          href: (m.release_type === "album" || m.release_type === "ep") && m.album
            ? `/music/album/${encodeURIComponent(m.album)}`
            : `/music/song/${m.id}`,
          date: m.created_at,
          meta: m.genre ?? m.release_type ?? "Music",
          viewCount: m.view_count ?? 0,
        })),
      ];

      mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(mapped);
    } catch (error) {
      console.error('Error fetching data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const base = activeFilter === "all" ? items : items.filter((i) => i.type === activeFilter);
    return base.slice(0, 5);
  }, [items, activeFilter]);

  const typeIcon = (type: ContentItem["type"]) => {
    if (type === "blog") return BookOpen;
    if (type === "tutorial") return GraduationCap;
    return Music2;
  };

  return (
    <div className="w-full space-y-4 pb-4">

      {/* ── HERO ── */}
      <div className="space-y-1">
        <div className="pb-2">
          <CanvasText
            text="home"
            backgroundClassName="bg-[#FF2E9B]"
            className="text-2xl font-bold"
            colors={["#FF2E9B","#F01B8A","#E10879","#FF2E9B","#F01B8A","#E10879","#FF2E9B","#F01B8A"]}
            animationDuration={12}
          />
        </div>
        <p className="text-sm text-muted-foreground">Stash and everything! Launching soon...</p>
      </div>

      {/* ── QUOTE ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br
            ${quotePalette.bg} ${quotePalette.border} ${quotePalette.shadow} px-3.5 py-3 select-none transition-shadow`}
        >
          <Quote
            size={32}
            className={`absolute top-2 right-3 opacity-[0.08] ${quotePalette.accent}`}
          />
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground/90 pr-8 pb-5">
            "{quote.text}"
          </p>
          <p className={`mt-1 text-[11px] sm:text-xs font-semibold ${quotePalette.accent}`}>
            — {quote.author}
          </p>
          <button
            type="button"
            onClick={cycleQuote}
            className={`absolute bottom-2.5 right-2.5 rounded-full p-1.5 border border-current/20 shadow-sm transition-all hover:scale-110 opacity-50 hover:opacity-90 ${quotePalette.accent}`}
            aria-label="Next quote"
          >
            <RefreshCw size={12} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA: Latest + Tools ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_13rem] gap-4 items-start">

        {/* ── LEFT: Latest ── */}
        <section className="space-y-2">
          {/* Header + filters */}
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              {loading ? "Latest" : FILTER_LABELS[activeFilter]}
            </h2>
            {loading ? (
              <div className="h-7 w-32 bg-muted/30 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-0.5 rounded-lg p-0.5 border border-teal-600/30 transition-shadow" style={{ background: "linear-gradient(135deg, rgba(17,216,194,0.10) 0%, rgba(17,216,194,0.05) 100%)" }}>
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`relative px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-colors
                      outline-none
                      ${activeFilter === f.value
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {activeFilter === f.value && (
                      <motion.span
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-emerald-400/30 rounded-md shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.28 }}
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {loading ? (
              // Show skeletons during loading to prevent content sliding from bottom
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <ContentCardSkeleton key={i} />
                ))}
              </>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => {
                  const palette = getCardPalette(item.id, 'home');
                  const Icon = typeIcon(item.type);
                  return (
                    <motion.div
                      key={`${activeFilter}-${item.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Link
                        to={item.href}
                        className={`group flex items-center gap-3 rounded-xl border
                          bg-gradient-to-r ${palette.gradient} ${palette.border} ${palette.shadow}
                          px-3 py-2.5 transition-all
                          outline-none hover:-translate-y-0.5 active:scale-[0.99]`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                          <Icon size={13} className={palette.iconColor} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="font-semibold text-foreground transition-colors truncate leading-tight"
                              style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
                            >
                              {item.title}
                            </span>
                            <ArrowRight
                              size={11}
                              className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.meta && (
                              <span
                                className={`font-semibold px-2 py-0.5 rounded-full ${palette.badge}`}
                                style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                              >
                                {item.meta}
                              </span>
                            )}
                            <span
                              className="flex items-center gap-0.5 text-muted-foreground/50"
                              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                            >
                              <CalendarDays size={9} />
                              {format(new Date(item.date), "MMM d, yyyy")}
                            </span>
                            {(item.viewCount ?? 0) > 0 && (
                              <span
                                className="flex items-center gap-0.5 text-muted-foreground/40"
                                style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
                              >
                                <Eye size={9} />
                                {formatViewCount(item.viewCount!)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* ── RIGHT: Tools ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              Tools
            </h2>
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              Soon™
            </span>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const inner = (
                <>
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${tool.iconBg} flex items-center justify-center`}>
                    <Icon size={12} className={tool.iconColor} />
                  </div>
                  <span className="hidden xs:block text-[9px] font-semibold text-foreground/70 leading-tight">
                    {tool.label}
                  </span>
                </>
              );

              const baseClass = `flex flex-col items-center justify-center gap-1 rounded-xl border
                ${tool.border} bg-gradient-to-br ${tool.gradient} ${tool.shadow || ''}
                p-2 text-center transition-all hover:scale-[1.04] active:scale-[0.97]`;

              if (tool.enabled && tool.href) {
                return (
                  <a
                    key={tool.label}
                    href={tool.href}
                    title={tool.label}
                    target={tool.href.startsWith("http") ? "_blank" : undefined}
                    rel={tool.href.startsWith("http") ? "noreferrer" : undefined}
                    className={baseClass}
                  >
                    {inner}
                  </a>
                );
              }

              return (
                <div
                  key={tool.label}
                  title={tool.label}
                  className={`${baseClass} cursor-not-allowed opacity-60`}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
