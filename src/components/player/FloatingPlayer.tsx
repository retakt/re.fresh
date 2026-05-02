import { usePlayer } from "@/lib/player";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music2, ChevronUp, ChevronRight,
  X,
} from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import ElasticSlider from "@/components/ui/elastic-slider/index";
import { MarqueeText } from "@/components/ui/marquee-text";

type ViewState = "full" | "pill";

// Player dimensions — width is computed at runtime to fit any screen
const PLAYER_H = 56;
const PILL_W   = 60;
const PILL_H   = 48;
const PAD      = 8;
const SAFE_TOP = 64;
const BOTTOM_CLEAR_MOBILE  = 180;
const BOTTOM_CLEAR_DESKTOP = 260;

// Responsive player width: max 300px but never wider than viewport - 2*PAD
function getPlayerW() {
  return Math.min(300, document.documentElement.clientWidth - PAD * 2);
}

export default function FloatingPlayer() {
  const {
    currentTrack, playing, progress, duration,
    volume, loading, queue, currentIndex,
    togglePlay, next, prev, seek, setVolume, stop,
  } = usePlayer();

  const [view, setView]         = useState<ViewState>("full");
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted]       = useState(false);
  const [side, setSide]         = useState<"left" | "right">("right");

  const prevVol      = useRef(volume);
  const prevTrackId  = useRef<string | null>(null);
  const didDrag      = useRef(false);
  const navigate     = useNavigate();

  // x/y are transforms applied on top of top:0 left:0 fixed positioning
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Compute the resting position for a given view/side
  const restPos = useCallback((v: ViewState, s: "left" | "right") => {
    const W      = document.documentElement.clientWidth;
    const H      = window.innerHeight;
    const mobile = W < 768;
    const w      = v === "pill" ? PILL_W : getPlayerW();
    const h      = v === "pill" ? PILL_H : PLAYER_H;
    const rx     = s === "right" ? W - w - PAD : PAD;
    const clear  = mobile ? BOTTOM_CLEAR_MOBILE : BOTTOM_CLEAR_DESKTOP;
    const ry     = H - h - clear;
    return { x: rx, y: Math.max(SAFE_TOP, ry) };
  }, []);

  // Set initial position on mount
  useEffect(() => {
    const pos = restPos("full", "right");
    x.set(pos.x);
    y.set(pos.y);

    // Reposition on resize so player never goes off-screen
    const onResize = () => {
      const pos = restPos(view, side);
      animate(x, pos.x, { type: "spring", bounce: 0, duration: 0.2 });
      animate(y, pos.y, { type: "spring", bounce: 0, duration: 0.2 });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // New track → snap back to default position
  useEffect(() => {
    if (!currentTrack) { prevTrackId.current = null; return; }
    if (currentTrack.id !== prevTrackId.current) {
      prevTrackId.current = currentTrack.id;
      setView("full");
      setExpanded(false);
      const s = window.innerWidth < 768 ? "left" : "right";
      setSide(s);
      const pos = restPos("full", s);
      animate(x, pos.x, { type: "spring", bounce: 0.2, duration: 0.4 });
      animate(y, pos.y, { type: "spring", bounce: 0.2, duration: 0.4 });
    }
  }, [currentTrack?.id]);

  // Snap to nearest edge after drag ends
  const snapToEdge = useCallback((w: number, h: number) => {
    const W  = document.documentElement.clientWidth;
    const H  = window.innerHeight;
    const cx = x.get() + w / 2;
    const s  = cx > W / 2 ? "right" : "left";
    setSide(s);
    const tx = s === "right" ? W - w - PAD : PAD;
    const ty = Math.max(SAFE_TOP, Math.min(H - h - PAD, y.get()));
    animate(x, tx, { type: "spring", bounce: 0.25, duration: 0.4 });
    animate(y, ty, { type: "spring", bounce: 0.1,  duration: 0.35 });
  }, [x, y]);

  if (!currentTrack) return null;

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => {
    if (muted) { setVolume(prevVol.current || 0.8); setMuted(false); }
    else       { prevVol.current = volume; setVolume(0); setMuted(true); }
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const pct     = `${progress * 100}%`;

  const collapseToPill = () => {
    setView("pill");
    setExpanded(false);
    const pos = restPos("pill", side);
    animate(x, pos.x, { type: "spring", bounce: 0.2, duration: 0.35 });
    animate(y, pos.y, { type: "spring", bounce: 0.1, duration: 0.3  });
  };

  const expandToFull = () => {
    setView("full");
    const pos = restPos("full", side);
    animate(x, pos.x, { type: "spring", bounce: 0.2, duration: 0.35 });
    animate(y, pos.y, { type: "spring", bounce: 0.1, duration: 0.3  });
  };

  const arrowRot = side === "right" ? 0 : 180;

  // ── PILL ──────────────────────────────────────────────────────────────────
  if (view === "pill") {
    const tabLeft = side === "right"; // tab on left side when snapped right
    return (
      <AnimatePresence>
        <motion.div
          key="pill"
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={() => { didDrag.current = true; }}
          onDragEnd={() => { snapToEdge(PILL_W, PILL_H); }}
          style={{
            x, y,
            position: "fixed",
            top: 0,
            left: 0,
            width: PILL_W,
            height: PILL_H,
            zIndex: 50,
            touchAction: "none",
          }}
          className="flex items-stretch cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
        >
          {tabLeft && (
            <div
              className="flex items-center justify-center w-5 rounded-l-xl bg-white/10 backdrop-blur-xl border border-r-0 border-white/5 shadow-lg cursor-pointer"
              onClick={() => { if (didDrag.current) { didDrag.current = false; return; } expandToFull(); }}
            >
              <ChevronRight size={11} className="text-muted-foreground hover:text-primary transition-colors" style={{ transform: "rotate(180deg)" }} />
            </div>
          )}

          <div
            className={`relative flex-1 bg-white/10 backdrop-blur-xl border border-white/5 shadow-lg overflow-hidden flex items-center justify-center cursor-pointer
              ${tabLeft ? "rounded-r-xl border-l-0" : "rounded-l-xl border-r-0"}`}
            onClick={() => { if (didDrag.current) { didDrag.current = false; return; } expandToFull(); }}
          >
            {currentTrack.cover_image
              ? <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
              : <Music2 size={16} className="text-primary/60" />
            }
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary/40">
              <div className="h-full bg-primary transition-none" style={{ width: pct }} />
            </div>
            {playing && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />}
          </div>

          {!tabLeft && (
            <div
              className="flex items-center justify-center w-5 rounded-r-xl bg-white/10 backdrop-blur-xl border border-l-0 border-white/5 shadow-lg cursor-pointer"
              onClick={() => { if (didDrag.current) { didDrag.current = false; return; } expandToFull(); }}
            >
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
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => { didDrag.current = true; }}
        onDragEnd={() => { snapToEdge(getPlayerW(), PLAYER_H); }}
        style={{
          x, y,
          position: "fixed",
          top: 0,
          left: 0,
          width: getPlayerW(),
          zIndex: 50,
          touchAction: "none",
          cursor: "grab",
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className="rounded-2xl border border-white/5 bg-white/10 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden select-none"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-x-visible overflow-y-hidden border-b border-border/40"
            >
              <div className="px-6 pt-3 pb-3 space-y-3" onPointerDown={(e) => e.stopPropagation()}>

                {/* Seek */}
                <div className="space-y-0.5">
                  <ElasticSlider
                    startingValue={0}
                    maxValue={1000}
                    value={Math.round(progress * 1000)}
                    onChange={(v) => seek(v / 1000)}
                    hideValue
                    leftIcon={
                      <span className="text-[9px] tabular-nums text-muted-foreground w-8 shrink-0">
                        {fmt(progress * duration)}
                      </span>
                    }
                    rightIcon={
                      <span className="text-[9px] tabular-nums text-muted-foreground w-8 text-right shrink-0">
                        {fmt(duration)}
                      </span>
                    }
                  />
                </div>

                {/* Volume — desktop only */}
                <div className="hidden md:block">
                  <ElasticSlider
                    startingValue={0}
                    maxValue={100}
                    value={Math.round((muted ? 0 : volume) * 100)}
                    onChange={(v) => { const val = v / 100; setVolume(val); if (val > 0) setMuted(false); }}
                    hideValue
                    leftIcon={
                      <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                        {muted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    }
                    rightIcon={
                      <span className="text-[9px] tabular-nums w-8 text-right text-muted-foreground shrink-0">
                        {Math.round((muted ? 0 : volume) * 100)}%
                      </span>
                    }
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

        {/* Main row */}
        <div className="flex items-center px-2 py-1 gap-1.5">
          <div
            className="shrink-0 w-7 h-7 rounded-md bg-primary/10 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            title="Drag to move player · Tap to open track"
            onClick={() => {
              if (didDrag.current) { didDrag.current = false; return; }
              if (currentTrack.id) navigate(`/music/song/${currentTrack.id}`);
            }}
          >
            {currentTrack.cover_image
              ? <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover pointer-events-none" />
              : <Music2 size={14} className="text-primary/50 pointer-events-none" />
            }
          </div>

          {/* Title + artist — flex-1 so it takes all remaining space */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <MarqueeText text={currentTrack.title} className="text-[10px] font-semibold text-foreground leading-tight" />
            <MarqueeText text={currentTrack.artist ?? "re.Takt"} className="text-[9px] text-muted-foreground leading-tight mt-0.5" />
          </div>

          {/* Playback controls — compact */}
          <div className="shrink-0 flex items-center gap-0.5">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={prev} disabled={!hasPrev}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 touch-manipulation
                ${hasPrev ? "text-foreground hover:text-primary" : "text-muted-foreground/30 cursor-not-allowed"}`}
            >
              <SkipBack size={11} fill={hasPrev ? "currentColor" : "none"} />
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-primary/95 text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all flex items-center justify-center shadow-md shadow-primary/20 touch-manipulation"
            >
              {loading
                ? <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                : playing ? <Pause size={12} fill="currentColor" />
                : <Play size={12} fill="currentColor" className="ml-px" />
              }
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={next} disabled={!hasNext}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 touch-manipulation
                ${hasNext ? "text-foreground hover:text-primary" : "text-muted-foreground/30 cursor-not-allowed"}`}
            >
              <SkipForward size={11} fill={hasNext ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Right actions — compact */}
          <div className="shrink-0 flex items-center gap-0">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setExpanded((e) => !e)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronUp size={12} />
              </motion.div>
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={collapseToPill}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <ChevronRight size={12} style={{ transform: `rotate(${arrowRot}deg)` }} />
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={stop}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Bottom mini progress bar */}
        {!expanded && (
          <div
            className="relative h-4 w-full cursor-pointer group"
            onPointerDown={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const newProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seek(newProgress);
              
              const handlePointerMove = (moveEvent: PointerEvent) => {
                const newProgress = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                seek(newProgress);
              };
              
              const handlePointerUp = () => {
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
              };
              
              document.addEventListener('pointermove', handlePointerMove);
              document.addEventListener('pointerup', handlePointerUp);
            }}
          >
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2">
              <div className="relative h-1 w-full rounded-full bg-white/20">
                <div className="absolute left-0 top-0 h-1 rounded-full bg-primary transition-none" style={{ width: pct }} />
                <div
                  className="absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `clamp(0.5rem, calc(${pct} - 0.5rem), calc(100% - 0.5rem))`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
