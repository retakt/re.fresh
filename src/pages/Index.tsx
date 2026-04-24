import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Music2, GraduationCap,
  ArrowRight, Quote, CalendarDays, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { ALL_QUOTES, shuffleQuotes, QUOTE_CARD_PALETTES } from "@/lib/quotes";
import { getCardPalette } from "@/lib/cardColors";
import { format } from "date-fns";
import { ContentCardSkeleton } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { TOOLS } from "@/features/tools";
import { usePersistedState } from "@/hooks/use-persisted-state";

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
};

export default function Index() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Persisted filter — survives refresh
  const [activeFilter, setActiveFilter] = usePersistedState<FilterType>("home-filter", "all");

  // ── Quotes — local only, no Supabase ──
  // Pool is shuffled once per session (stored in sessionStorage so it survives
  // navigation but resets on new tab/hard refresh — giving fresh randomness).
  // The index advances every 20 minutes. Manual ↻ also advances it.
  const [pool] = useState<typeof ALL_QUOTES>(() => {
    try {
      const stored = sessionStorage.getItem("quote-pool");
      if (stored) return JSON.parse(stored) as typeof ALL_QUOTES;
    } catch {}
    const shuffled = shuffleQuotes(ALL_QUOTES);
    try { sessionStorage.setItem("quote-pool", JSON.stringify(shuffled)); } catch {}
    return shuffled;
  });

  const [quoteIndex, setQuoteIndex] = usePersistedState<number>("quote-index", 0);
  const [quoteLoadedAt, setQuoteLoadedAt] = usePersistedState<number>("quote-loaded-at", Date.now());

  // Advance index if 20 minutes have passed since last change
  useEffect(() => {
    const TWENTY_MIN = 20 * 60 * 1000;
    const now = Date.now();
    if (now - quoteLoadedAt > TWENTY_MIN) {
      setQuoteIndex((i) => (i + 1) % pool.length);
      setQuoteLoadedAt(now);
    }
    // Check again every minute
    const interval = setInterval(() => {
      const t = Date.now();
      setQuoteLoadedAt((prev) => {
        if (t - prev > TWENTY_MIN) {
          setQuoteIndex((i) => (i + 1) % pool.length);
          return t;
        }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [pool.length]);

  const quote = pool[Math.abs(quoteIndex) % pool.length];
  const quotePalette = QUOTE_CARD_PALETTES[Math.abs(quoteIndex) % QUOTE_CARD_PALETTES.length];

  const cycleQuote = useCallback(() => {
    setQuoteIndex((i) => (i + 1) % pool.length);
    setQuoteLoadedAt(Date.now()); // reset 20-min timer on manual cycle
  }, [pool.length]);

  useEffect(() => {
    const fetchAll = async () => {
      const [postsRes, tutorialsRes, musicRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, slug, created_at")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("tutorials")
          .select("id, title, slug, created_at, difficulty")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("music")
          .select("id, title, created_at, genre, release_type, album")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const mapped: ContentItem[] = [
        ...(postsRes.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          type: "blog" as const,
          href: `/blog/${p.slug}`,
          date: p.created_at,
          meta: "Blog",
        })),
        ...(tutorialsRes.data || []).map((t) => ({
          id: t.id,
          title: t.title,
          type: "tutorial" as const,
          href: `/tutorials/${t.slug}`,
          date: t.created_at,
          meta: t.difficulty ?? "Tutorial",
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
        })),
      ];

      mapped.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setItems(mapped);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const base =
      activeFilter === "all"
        ? items
        : items.filter((i) => i.type === activeFilter);
    return base.slice(0, 5);
  }, [items, activeFilter]);

  const typeIcon = (type: ContentItem["type"]) => {
    if (type === "blog") return BookOpen;
    if (type === "tutorial") return GraduationCap;
    return Music2;
  };

  return (
    /*
      No fixed height, no overflow-hidden on outer shell.
      Each section manages its own height.
      On small phones everything stacks and the page scrolls naturally.
      On desktop the two-column layout sits side by side.
    */
    <div className="w-full max-w-2xl space-y-4 pb-4">

      {/* ── HERO ── */}
      <PageHeader
        title="Home"
        subtitle="My stash and everything! Launching soon..."
      />

      {/* ── QUOTE ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`relative overflow-hidden rounded-xl border bg-gradient-to-br
            ${quotePalette.bg} ${quotePalette.border} px-3.5 py-3 select-none`}
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
            onClick={(e) => { e.stopPropagation(); cycleQuote(); }}
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
              {FILTER_LABELS[activeFilter]}
            </h2>
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "linear-gradient(135deg, rgba(17,216,194,0.10) 0%, rgba(17,216,194,0.05) 100%)", border: "1px solid rgba(17,216,194,0.18)" }}>
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
                      className="absolute inset-0 bg-background rounded-md shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.28 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <ContentCardSkeleton key={i} />
              ))
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {filtered.map((item) => {
                    const palette = getCardPalette(item.id);
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
                          className={`group flex items-center gap-3.5 rounded-xl border
                            bg-gradient-to-r ${palette.gradient} ${palette.border}
                            px-3.5 py-3 sm:px-4 sm:py-3.5 transition-all
                            outline-none hover:shadow-lg ${palette.hoverShadow} hover:-translate-y-0.5 active:scale-[0.99]`}
                        >
                          <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                            <Icon size={13} className={palette.iconColor} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </span>
                              <ArrowRight
                                size={11}
                                className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.meta && (
                                <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${palette.badge}`}>
                                  {item.meta}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                                <CalendarDays size={9} />
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
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
                ${tool.border} bg-gradient-to-br ${tool.gradient}
                p-2 text-center transition-all hover:scale-[1.04] hover:shadow-md active:scale-[0.97]`;

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
