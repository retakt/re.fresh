import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Music2, GraduationCap,
  ArrowRight, Scissors, Bot,
  MessageSquare, Layers, Shuffle, Sparkles,
  Quote, CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { getCurrentQuote, getQuotePalette, DEFAULT_QUOTES } from "@/lib/quotes";
import { getCardPalette } from "@/lib/cardColors";
import { format } from "date-fns";

const TOOLS = [
  {
    icon: Scissors, label: "BG Remover",
    gradient: "from-rose-400/20 to-pink-400/10",
    iconBg: "bg-rose-100/80 dark:bg-rose-900/20",
    iconColor: "text-rose-400 dark:text-rose-300",
    border: "border-rose-200/50 dark:border-rose-800/20",
  },
  {
    icon: FaYoutube, label: "YT Download",
    gradient: "from-red-400/20 to-red-300/10",
    iconBg: "bg-red-100/80 dark:bg-red-900/20",
    iconColor: "text-red-400 dark:text-red-300",
    border: "border-red-200/50 dark:border-red-800/20",
  },
  {
    icon: FaInstagram, label: "IG Saver",
    gradient: "from-pink-400/20 to-purple-400/10",
    iconBg: "bg-pink-100/80 dark:bg-pink-900/20",
    iconColor: "text-pink-400 dark:text-pink-300",
    border: "border-pink-200/50 dark:border-pink-800/20",
  },
  {
    icon: Bot, label: "Hugging Face",
    gradient: "from-yellow-400/20 to-amber-300/10",
    iconBg: "bg-yellow-100/80 dark:bg-yellow-900/20",
    iconColor: "text-yellow-500 dark:text-yellow-300",
    border: "border-yellow-200/50 dark:border-yellow-800/20",
  },
  {
    icon: MessageSquare, label: "Reddit",
    gradient: "from-orange-400/20 to-amber-300/10",
    iconBg: "bg-orange-100/80 dark:bg-orange-900/20",
    iconColor: "text-orange-400 dark:text-orange-300",
    border: "border-orange-200/50 dark:border-orange-800/20",
  },
  {
    icon: Layers, label: "Sampletter",
    gradient: "from-blue-400/20 to-indigo-300/10",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/20",
    iconColor: "text-blue-400 dark:text-blue-300",
    border: "border-blue-200/50 dark:border-blue-800/20",
  },
  {
    icon: Shuffle, label: "Face Swap",
    gradient: "from-purple-400/20 to-violet-300/10",
    iconBg: "bg-purple-100/80 dark:bg-purple-900/20",
    iconColor: "text-purple-400 dark:text-purple-300",
    border: "border-purple-200/50 dark:border-purple-800/20",
  },
  {
    icon: Sparkles, label: "AI Tools",
    gradient: "from-teal-400/20 to-cyan-300/10",
    iconBg: "bg-teal-100/80 dark:bg-teal-900/20",
    iconColor: "text-teal-400 dark:text-teal-300",
    border: "border-teal-200/50 dark:border-teal-800/20",
  },
];

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
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const quote = useMemo(() => getCurrentQuote(DEFAULT_QUOTES), []);
  const quotePalette = useMemo(() => getQuotePalette(quote.id), [quote.id]);

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
          .select("id, title, created_at, genre, release_type")
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
          href: `/music/song/${m.id}`,
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
    <div className="w-full max-w-2xl space-y-5 pb-6">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pt-5 space-y-1"
      >
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] leading-none sm:text-5xl">
          <span className="dark:hidden text-slate-900">re</span>
          <span className="hidden dark:inline text-cyan-200 drop-shadow-[0_0_8px_rgba(97,228,206,0.45)]">
            re
          </span>
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          My stash and everything! Launching soon...
        </p>
      </motion.div>

      {/* ── QUOTE ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br
          ${quotePalette.bg} ${quotePalette.border} px-4 py-3.5`}
      >
        <Quote
          size={28}
          className={`absolute top-2 right-3 opacity-[0.07] ${quotePalette.accent}`}
        />
        <p className="text-sm font-medium leading-relaxed text-foreground/90 pr-8">
          "{quote.text}"
        </p>
        <p className={`mt-1.5 text-xs font-semibold ${quotePalette.accent}`}>
          — {quote.author}
        </p>
      </motion.div>

      {/* ── MAIN CONTENT AREA: Latest + Tools ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_13rem] gap-5 items-start">

        {/* ── LEFT: Latest ── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.13 }}
          className="space-y-2"
        >
          {/* Header + filters */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {FILTER_LABELS[activeFilter]}
            </h2>
            <div className="flex items-center gap-0.5 bg-secondary/60 rounded-lg p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`relative px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors
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

          {/* 
            Content list:
            - Always renders 5 slots (real + empty placeholders)
            - No scroll — items just stack naturally in page flow
            - On very small phones this just means 5 cards visible,
              user scrolls the whole page to see them all
          */}
          <div className="flex flex-col gap-1.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[58px] rounded-xl border bg-card animate-pulse"
                />
              ))
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {filtered.map((item, i) => {
                    const palette = getCardPalette(item.id);
                    const Icon = typeIcon(item.type);
                    return (
                      <motion.div
                        key={`${activeFilter}-${item.id}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.16, delay: i * 0.025 }}
                      >
                        <Link
                          to={item.href}
                          className={`group flex items-center gap-3 rounded-xl border
                            bg-gradient-to-r ${palette.gradient} ${palette.border}
                            px-3.5 py-3 transition-all
                            hover:shadow-sm hover:-translate-y-px active:scale-[0.99]`}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${palette.iconBg}`}>
                            <Icon size={13} className={palette.iconColor} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </span>
                              <ArrowRight
                                size={11}
                                className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.meta && (
                                <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full ${palette.badge}`}>
                                  {item.meta}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/50">
                                <CalendarDays size={8} />
                                {format(new Date(item.date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Empty placeholder slots — keep visual consistency */}
                {filtered.length < 5 &&
                  Array.from({ length: 5 - filtered.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="h-[58px] rounded-xl border border-dashed border-border/25"
                    />
                  ))}
              </>
            )}
          </div>
        </motion.section>

        {/* ── RIGHT: Tools ── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tools
            </h2>
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              Soon™
            </span>
          </div>

          {/*
            Mobile: 4 columns (small tiles, fits in one row of 2 pairs)
            Desktop: 2 columns (sidebar width)
          */}
          <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: 0.22 + i * 0.025 }}
                  title={tool.label}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border
                    ${tool.border} bg-gradient-to-br ${tool.gradient}
                    p-2.5 text-center cursor-not-allowed
                    transition-all hover:scale-[1.05] hover:shadow-sm active:scale-[0.97]`}
                >
                  <div className={`w-7 h-7 rounded-lg ${tool.iconBg} flex items-center justify-center`}>
                    <Icon size={13} className={tool.iconColor} />
                  </div>
                  {/* Label hidden on very small screens, shown as tooltip via title */}
                  <span className="hidden xs:block text-[9px] font-semibold text-foreground/70 leading-tight">
                    {tool.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
}