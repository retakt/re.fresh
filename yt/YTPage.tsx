import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Music,
  Video,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
  X,
  ExternalLink,
  Info,
  ChevronDown,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type DownloadMode = "auto" | "audio" | "mute";
type VideoQuality = "max" | "2160" | "1440" | "1080" | "720" | "480" | "360";
type AudioFormat = "mp3" | "ogg" | "wav" | "opus" | "best";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.hostname === "youtube.com" ||
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtu.be" ||
      u.hostname === "m.youtube.com" ||
      u.hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      className="rounded-full p-2 text-foreground/50 hover:text-foreground hover:bg-secondary/60 transition-all"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun size={15} />
      ) : theme === "dark" ? (
        <Moon size={15} />
      ) : (
        <Monitor size={15} />
      )}
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="modeActive"
          className="absolute inset-0 rounded-lg bg-secondary shadow-sm"
          transition={{ type: "spring", bounce: 0.2, duration: 0.25 }}
        />
      )}
      <Icon size={13} className="relative z-10 shrink-0" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function YTPage() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<DownloadMode>("auto");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("max");
  const [audioFormat, setAudioFormat] = useState<AudioFormat>("mp3");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{
    id: string;
    title: string;
    thumbnail: string;
    channel: string;
    duration: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      inputRef.current?.focus();
    }
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
    setVideoMeta(null);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) {
        toast.error("Paste a YouTube URL first");
        return;
      }
      if (!isValidYouTubeUrl(trimmed)) {
        toast.error("That doesn't look like a YouTube URL");
        return;
      }

      const videoId = extractVideoId(trimmed);
      setLoading(true);

      // Simulate fetching video metadata (no backend yet)
      // In production this would call your backend / cobalt API
      await new Promise((r) => setTimeout(r, 800));

      if (videoId) {
        setVideoMeta({
          id: videoId,
          title: "Video preview not available yet",
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          channel: "—",
          duration: "—",
        });
      }

      setLoading(false);
      toast.info("Backend coming soon — frontend preview only", {
        description: "The download API is not wired up yet.",
        duration: 4000,
      });
    },
    [url]
  );

  const handleDownload = useCallback(() => {
    toast.info("Download API coming soon", {
      description: `Mode: ${mode} · Quality: ${videoQuality} · Audio: ${audioFormat}`,
    });
  }, [mode, videoQuality, audioFormat]);

  const isYT = isValidYouTubeUrl(url);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="https://retakt.cc"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/70 hover:text-foreground transition-colors"
        >
          <span className="text-sky-400">re</span>
          <span className="text-foreground/30">.</span>
          <span>Takt</span>
          <span className="text-muted-foreground/40 font-normal text-xs ml-0.5">/ yt</span>
        </a>

        <div className="flex items-center gap-1">
          <a
            href="https://retakt.cc"
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
          >
            ← Main site
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-8 sm:pt-12">
        <div className="w-full max-w-xl space-y-8">

          {/* Title */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20">
                <FaYoutube size={20} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              yt<span className="text-foreground/20">.</span>retakt
            </h1>
            <p className="text-sm text-muted-foreground">
              Download YouTube videos and audio — no ads, no tracking.
            </p>
          </div>

          {/* ── URL Input ── */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div
              className={cn(
                "group relative flex items-center rounded-2xl border bg-card transition-all duration-200",
                isYT
                  ? "border-red-500/40 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]"
                  : "border-border/60 focus-within:border-border focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
              )}
            >
              {/* YouTube icon indicator */}
              <div className="pl-4 pr-2 shrink-0">
                <FaYoutube
                  size={16}
                  className={cn(
                    "transition-colors",
                    isYT ? "text-red-500" : "text-muted-foreground/30"
                  )}
                />
              </div>

              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Paste a YouTube link..."
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground/40"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {/* Clear / Paste / Submit */}
              <div className="flex items-center gap-1 pr-2 shrink-0">
                {url ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60 transition-all"
                    aria-label="Clear"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                  >
                    paste
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center rounded-xl w-9 h-9 transition-all",
                    isYT
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
                      : "bg-secondary text-muted-foreground cursor-default"
                  )}
                  aria-label="Download"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                </button>
              </div>
            </div>

            {/* ── Mode toggles ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 rounded-xl bg-secondary/40 p-1">
                <ModeButton
                  active={mode === "auto"}
                  onClick={() => setMode("auto")}
                  icon={Download}
                  label="auto"
                />
                <ModeButton
                  active={mode === "audio"}
                  onClick={() => setMode("audio")}
                  icon={Music}
                  label="audio"
                />
                <ModeButton
                  active={mode === "mute"}
                  onClick={() => setMode("mute")}
                  icon={VolumeX}
                  label="mute"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                  showSettings
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                settings
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform",
                    showSettings && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* ── Settings panel ── */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-4">

                    {/* Video quality */}
                    {mode !== "audio" && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Video quality
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["max", "2160", "1440", "1080", "720", "480", "360"] as VideoQuality[]).map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setVideoQuality(q)}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
                                videoQuality === q
                                  ? "bg-foreground text-background border-foreground"
                                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                              )}
                            >
                              {q === "max" ? "max" : `${q}p`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio format */}
                    {mode !== "mute" && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Audio format
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["mp3", "ogg", "wav", "opus", "best"] as AudioFormat[]).map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setAudioFormat(f)}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
                                audioFormat === f
                                  ? "bg-foreground text-background border-foreground"
                                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ── Video preview card ── */}
          <AnimatePresence>
            {videoMeta && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-secondary/30 overflow-hidden">
                  <img
                    src={videoMeta.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/80 hover:text-white transition-colors backdrop-blur-sm"
                  >
                    <ExternalLink size={10} />
                    Open
                  </a>
                </div>

                {/* Info + download */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {videoMeta.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {videoMeta.channel}
                      {videoMeta.duration !== "—" && (
                        <> · {videoMeta.duration}</>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {mode === "audio"
                        ? `Audio · ${audioFormat.toUpperCase()}`
                        : mode === "mute"
                        ? `Video only · ${videoQuality === "max" ? "Max quality" : `${videoQuality}p`}`
                        : `Video + Audio · ${videoQuality === "max" ? "Max quality" : `${videoQuality}p`} · ${audioFormat.toUpperCase()}`}
                    </p>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="shrink-0 flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Supported formats note ── */}
          {!videoMeta && (
            <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-secondary/20 px-4 py-3">
              <Info size={13} className="text-muted-foreground/50 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Supports <span className="text-foreground/60 font-medium">youtube.com</span>,{" "}
                <span className="text-foreground/60 font-medium">youtu.be</span>,{" "}
                <span className="text-foreground/60 font-medium">music.youtube.com</span>.
                No account needed. No data stored.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-5 py-5 text-center">
        <p className="text-[11px] text-muted-foreground/40">
          <a href="https://retakt.cc" className="hover:text-muted-foreground transition-colors">
            re.Takt
          </a>
          {" · "}
          <span>yt downloader · frontend preview</span>
        </p>
      </footer>
    </div>
  );
}
