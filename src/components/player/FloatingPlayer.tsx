import { usePlayer } from "@/lib/player";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music2, ChevronUp, ChevronRight,
  X,
} from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { Link } from "react-router-dom";
import ElasticSlider from "@/components/ui/elastic-slider/index";

type ViewState = "full" | "pill";

const PLAYER_W = 328;
const PLAYER_H_COLLAPSED = 60;
const PLAYER_H_EXPANDED = 240; // approx expanded height
const PILL_W = 68;
const PILL_H = 48;
const EDGE_PAD = 8;
const SAFE_TOP = 64;
const MOBILE_BOTTOM_CLEARANCE = 180;
const DESKTOP_BOTTOM_CLEARANCE = 260; // enough room for expanded panel above footer

export default function FloatingPlayer() {
  const {
    currentTrack, playing, progress, duration,
    volume, loading, queue, currentIndex,
    togglePlay, next, prev, seek, setVolume, stop,
  } = usePlayer();

  const [view, setView] = useState<ViewState>("full");
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [snappedSide, setSnappedSide] = useState<"left" | "right">("right");
  const prevVol = useRef(volume);
  const prevTrackId = useRef<string | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const getInitialPos = useCallback((v: ViewState) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mobile = W < 768;
    const bottomClear = mobile ? MOBILE_BOTTOM_CLEARANCE : DESKTOP_BOTTOM_CLEARANCE;
    if (v === "pill") {
      return { x: W - PILL_W - EDGE_PAD, y: H - PILL_H - bottomClear };
    }
    const px = mobile ? EDGE_PAD : W - PLAYER_W - EDGE_PAD;
    const py = H - PLAYER_H_COLLAPSED - bottomClear;
    return { x: px, y: py };
  }, []);

  // Mount: set initial position
  useEffect(() => {
    const pos = getInitialPos("full");
    x.set(pos.x);
    y.set(pos.y);
  }, []);

  // New track → reset to default position
  useEffect(() => {
    if (!currentTrack) { prevTrackId.current = null; return; }
    if (currentTrack.id !== prevTrackId.current) {
      setView("full");
      setExpanded(false);
      prevTrackId.current = currentTrack.id;
      const pos = getInitialPos("full");
      animate(x, pos.x, { type: "spring", bounce: 0.2, duration: 0.4 });
      animate(y, pos.y, { type: "spring", bounce: 0.2, duration: 0.4 });
      setSnappedSide(window.innerWidth < 768 ? "left" : "right");
    }
  }, [currentTrack?.id]);

  // Prevent body scroll when player is dragged outside viewport
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    return () => { document.body.style.overflowX = ""; };
  }, []);

  const snapToEdge = useCallback((currentX: number, currentY: number, w: number) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const center = currentX + w / 2;
    const side = center > W / 2 ? "right" : "left";
    setSnappedSide(side);
    const targetX = side === "right" ? W - w - EDGE_PAD : EDGE_PAD;
    // clamp Y within safe bounds
    const maxY = H - PILL_H - 16;
    const clampedY = Math.max(SAFE_TOP, Math.min(maxY, currentY));
    animate(x, targetX, { type: "spring", bounce: 0.2, duration: 0.35 });
    animate(y, clampedY, { type: "spring", bounce: 0.1, duration: 0.3 });
  }, [x, y]);

  if (!currentTrack) return null;

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => {
    if (muted) { setVolume(prevVol.current || 0.8); setMuted(false); }
    else { prevVol.current = volume; setVolume(0); setMuted(true); }
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const pct = `${progress * 100}%`;

  const collapseToPill = () => {
    setView("pill");
    setExpanded(false);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mobile = W < 768;
    const targetX = snappedSide === "right" ? W - PILL_W - EDGE_PAD : EDGE_PAD;
    const targetY = H - PILL_H - (mobile ? MOBILE_BOTTOM_CLEARANCE : DESKTOP_BOTTOM_CLEARANCE);
    animate(x, targetX, { type: "spring", bounce: 0.2, duration: 0.35 });
    animate(y, targetY, { type: "spring", bounce: 0.1, duration: 0.3 });
  };

  const expandToFull = () => {
    setView("full");
    const W = window.innerWidth;
    const targetX = snappedSide === "right" ? W - PLAYER_W - EDGE_PAD : EDGE_PAD;
    animate(x, targetX, { type: "spring", bounce: 0.2, duration: 0.35 });
  };

  // Collapse arrow points toward the nearest edge (away from center)
  // Right side → arrow points right (→), left side → arrow points left (←)
  const collapseArrowRotation = snappedSide === "right" ? 0 : 180;

  // ── PILL ──────────────────────────────────────────────────────────────────
  if (view === "pill") {
    // Pill: tab on the inward side, cover on the outward side
    const tabOnLeft = snappedSide === "right"; // tab faces inward
    return (
      <AnimatePresence>
        <motion.div
          key="pill"
          style={{ x, y, width: PILL_W, height: PILL_H, position: "fixed", zIndex: 50, touchAction: "none" }}
          drag
          dragMomentum={false}
          dragElastic={0.05}
          onDragEnd={() => snapToEdge(x.get(), y.get(), PILL_W)}
          className="flex items-stretch cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
        >
          {tabOnLeft && (
            <div
              className="flex items-center justify-center w-5 rounded-l-xl bg-card/80 backdrop-blur-2xl border border-r-0 border-border/40 shadow-lg cursor-pointer"
              onClick={expandToFull}
            >
              {/* Arrow points left (inward toward center) */}
              <ChevronRight size={11} className="text-muted-foreground hover:text-primary transition-colors" style={{ transform: "rotate(180deg)" }} />
            </div>
          )}

          <div
            className={`relative flex-1 bg-card/80 backdrop-blur-2xl border border-border/40 shadow-lg overflow-hidden flex items-center justify-center cursor-pointer
              ${tabOnLeft ? "rounded-r-xl border-l-0" : "rounded-l-xl border-r-0"}`}
            onClick={expandToFull}
          >
            {currentTrack.cover_image ? (
              <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music2 size={16} className="text-primary/60" />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary/40">
              <div className="h-full bg-primary transition-none" style={{ width: pct }} />
            </div>
            {playing && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          {!tabOnLeft && (
            <div
              className="flex items-center justify-center w-5 rounded-r-xl bg-card/80 backdrop-blur-2xl border border-l-0 border-border/40 shadow-lg cursor-pointer"
              onClick={expandToFull}
            >
              {/* Arrow points right (inward toward center) */}
              <ChevronRight size={11} className="text-muted-foreground hover:text-primary transition-colors" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── FULL PLAYER ───────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="full-player"
        style={{ x, y, width: PLAYER_W, position: "fixed", zIndex: 50, touchAction: "none", cursor: "grab" }}
        drag
        dragMomentum={false}
        dragElastic={0.05}
        // Hard constraint: never go outside viewport
        dragConstraints={{
          left: EDGE_PAD,
          right: window.innerWidth - PLAYER_W - EDGE_PAD,
          top: SAFE_TOP,
          bottom: window.innerHeight - (expanded ? PLAYER_H_EXPANDED : PLAYER_H_COLLAPSED) - 8,
        }}
        onDragEnd={() => snapToEdge(x.get(), y.get(), PLAYER_W)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-card/65 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden supports-[backdrop-filter]:bg-card/50 select-none"
      >
        {/* ── Drag handle — only this initiates drag ── */}
        <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* ── EXPANDED PANEL ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-b border-border/40"
            >
              <div
                className="px-4 pt-3 pb-3 space-y-3"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="space-y-0.5">
                  <ElasticSlider
                    startingValue={0}
                    maxValue={1000}
                    value={Math.round(progress * 1000)}
                    onChange={(v) => seek(v / 1000)}
                    hideValue
                    leftIcon={<span className="text-[9px] tabular-nums" style={{ color: "var(--muted-foreground)", minWidth: "2.2rem" }}>{fmt(progress * duration)}</span>}
                    rightIcon={<span className="text-[9px] tabular-nums" style={{ color: "var(--muted-foreground)", minWidth: "2.2rem", textAlign: "right" }}>{fmt(duration)}</span>}
                  />
                </div>

                <div className="hidden md:block">
                  <ElasticSlider
                    startingValue={0}
                    maxValue={100}
                    value={Math.round((muted ? 0 : volume) * 100)}
                    onChange={(v) => { const val = v / 100; setVolume(val); if (val > 0) setMuted(false); }}
                    hideValue
                    leftIcon={
                      <button onClick={toggleMute} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                        {muted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    }
                    rightIcon={<span className="text-[9px] tabular-nums w-6 text-right" style={{ color: "var(--muted-foreground)" }}>{Math.round((muted ? 0 : volume) * 100)}%</span>}
                  />
                </div>
                <p className="md:hidden text-[10px] text-muted-foreground text-center">Use device volume buttons</p>

                {queue.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">{currentIndex + 1} / {queue.length} in queue</p>
                    {currentTrack.album && (
                      <Link to={`/music/album/${encodeURIComponent(currentTrack.album)}`} className="text-[10px] text-primary hover:underline">
                        View album →
                      </Link>
                    )}
                  </div>
                )}

                {(currentTrack.spotify_url || currentTrack.soundcloud_url || currentTrack.youtube_url) && (
                  <div className="flex items-center gap-1 justify-center">
                    {currentTrack.spotify_url && (
                      <a href={currentTrack.spotify_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-green-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70">
                        <FaSpotify size={12} className="text-green-500" /> Spotify
                      </a>
                    )}
                    {currentTrack.soundcloud_url && (
                      <a href={currentTrack.soundcloud_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70">
                        <FaSoundcloud size={12} className="text-orange-500" /> SoundCloud
                      </a>
                    )}
                    {currentTrack.youtube_url && (
                      <a href={currentTrack.youtube_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70">
                        <FaYoutube size={12} className="text-red-500" /> YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN ROW — buttons stop propagation individually ── */}
        <div className="flex items-center px-2.5 py-2 gap-2">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center">
            {currentTrack.cover_image ? (
              <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music2 size={16} className="text-primary/50" />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-semibold truncate text-foreground leading-tight">{currentTrack.title}</p>
            <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">{currentTrack.artist ?? "re.Takt"}</p>
          </div>

          <div className="shrink-0 flex items-center gap-1">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={prev} disabled={!hasPrev}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border touch-manipulation
                ${hasPrev ? "bg-secondary/70 text-foreground hover:bg-primary/20 hover:text-primary border-primary/20 hover:border-primary/40"
                          : "bg-secondary/30 text-muted-foreground/30 cursor-not-allowed border-transparent"}`}
            >
              <SkipBack size={13} fill={hasPrev ? "currentColor" : "none"} />
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary/95 text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all flex items-center justify-center shadow-md shadow-primary/20 border border-primary/30 touch-manipulation"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : playing ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={next} disabled={!hasNext}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border touch-manipulation
                ${hasNext ? "bg-secondary/70 text-foreground hover:bg-primary/20 hover:text-primary border-primary/20 hover:border-primary/40"
                          : "bg-secondary/30 text-muted-foreground/30 cursor-not-allowed border-transparent"}`}
            >
              <SkipForward size={13} fill={hasNext ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="shrink-0 flex items-center gap-0.5">
            {/* Expand/collapse details — ChevronUp rotates to point down when open */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setExpanded((e) => !e)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronUp size={14} />
              </motion.div>
            </button>

            {/* Collapse to pill — arrow points toward nearest edge */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={collapseToPill}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <ChevronRight
                size={14}
                style={{ transform: `rotate(${collapseArrowRotation}deg)` }}
              />
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={stop}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ── Bottom mini progress bar ── */}
        {!expanded && (
          <div
            className="relative h-3 w-full"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2">
              <div className="relative h-px w-full rounded-full bg-secondary/55">
                <div className="absolute left-0 top-0 h-px rounded-full bg-primary transition-none" style={{ width: pct }} />
                <div
                  className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-background/80 bg-primary shadow-md shadow-primary/25"
                  style={{ left: `clamp(0.375rem, calc(${pct} - 0.375rem), calc(100% - 0.375rem))` }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
