import { usePlayer } from "@/lib/player";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music2, ChevronUp, ChevronLeft,
  ChevronsRightIcon,
} from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";

export default function FloatingPlayer() {
  const {
    currentTrack, playing, progress, duration,
    volume, loading, queue, currentIndex,
    togglePlay, next, prev, seek, setVolume,
  } = usePlayer();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevVol = useRef(volume);

  // Auto-restore when new track plays
  useEffect(() => {
    if (currentTrack) setCollapsed(false);
  }, [currentTrack?.id]);

  // MediaSession API
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist ?? "re.Takt",
      artwork: currentTrack.cover_image
        ? [{ src: currentTrack.cover_image, sizes: "512x512" }]
        : [],
    });
    navigator.mediaSession.setActionHandler("play", () => togglePlay());
    navigator.mediaSession.setActionHandler("pause", () => togglePlay());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    return () => {
      ["play","pause","previoustrack","nexttrack"].forEach((a) =>
        navigator.mediaSession.setActionHandler(a as MediaSessionAction, null)
      );
    };
  }, [currentTrack, togglePlay, prev, next]);

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
  const volPct = `${(muted ? 0 : volume) * 100}%`;
  const seekThumbStyle = {
    left: `clamp(0.375rem, calc(${pct} - 0.375rem), calc(100% - 0.375rem))`,
  };
  const volumeThumbStyle = {
    left: `clamp(0.375rem, calc(${volPct} - 0.375rem), calc(100% - 0.375rem))`,
  };

  // ── COLLAPSED PILL ──
  if (collapsed) {
    return (
      <motion.button
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
        onClick={() => setCollapsed(false)}
        className="fixed z-50 right-0 bottom-24 md:bottom-16 group flex items-stretch"
        aria-label="Expand player"
      >
        {/* Arrow tab */}
        <div className="flex items-center justify-center w-5 rounded-l-xl bg-card/65 backdrop-blur-2xl border border-r-0 shadow-lg shadow-black/10">
          <ChevronLeft
            size={11}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>

        {/* Cover square */}
        <div className="relative w-11 h-11 rounded-r-xl bg-card/65 backdrop-blur-2xl border border-l-0 shadow-lg shadow-black/10 overflow-hidden flex items-center justify-center">
          {currentTrack.cover_image ? (
            <img
              src={currentTrack.cover_image}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music2 size={16} className="text-primary/60" />
          )}

          {/* Progress line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary/40">
            <div
              className="h-full bg-primary"
              style={{ width: pct }}
            />
          </div>

          {/* Playing pulse dot */}
          {playing && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-sm animate-pulse" />
          )}
        </div>
      </motion.button>
    );
  }

  // ── FULL PLAYER ──
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
      className="fixed z-50 bottom-[4.5rem] left-2 right-2 md:bottom-6 md:left-auto md:right-6 md:w-[20.5rem] rounded-2xl border border-white/10 bg-card/60 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden supports-[backdrop-filter]:bg-card/45"
    >
      {/* ══ EXPANDED PANEL — sits above main row ══ */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-b"
          >
            <div className="px-4 pt-3 pb-3 space-y-3">

              {/* Seek slider + timestamps */}
              <div className="space-y-1">
                <div className="relative flex items-center h-5">
                  {/* Track background */}
                  <div className="absolute inset-x-0 h-1 rounded-full bg-secondary/70" />
                  {/* Fill */}
                  <div
                    className="absolute left-0 h-1 rounded-full bg-primary/90 pointer-events-none"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-background/80 bg-primary shadow-[0_0_0_2px_color-mix(in_oklch,var(--primary)_18%,transparent)] pointer-events-none"
                    style={seekThumbStyle}
                  />
                  {/* Input — transparent track, only thumb visible */}
                  <input
                    type="range"
                    min={0} max={1} step={0.001}
                    value={progress}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="seek-slider absolute inset-x-0 w-full opacity-100"
                    style={{ background: "transparent" }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {fmt(progress * duration)}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {fmt(duration)}
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {muted || volume === 0 ? <VolumeX size={13}/> : <Volume2 size={13}/>}
                </button>
                <div className="relative flex-1 flex items-center h-5">
                  <div className="absolute inset-x-0 h-1 rounded-full bg-secondary/70" />
                  <div
                    className="absolute left-0 h-1 rounded-full bg-primary/60 pointer-events-none"
                    style={{ width: volPct }}
                  />
                  <div
                    className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-background/80 bg-primary shadow-[0_0_0_2px_color-mix(in_oklch,var(--primary)_14%,transparent)] pointer-events-none"
                    style={volumeThumbStyle}
                  />
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0) setMuted(false);
                    }}
                    className="seek-slider absolute inset-x-0 w-full"
                    style={{ background: "transparent" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
                  {Math.round((muted ? 0 : volume) * 100)}%
                </span>
              </div>
              {/* Mobile hint */}
              <p className="md:hidden text-[10px] text-muted-foreground text-center">
                Use device volume buttons to adjust
              </p>

              {/* Queue info */}
              {queue.length > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    {currentIndex + 1} / {queue.length} in queue
                  </p>
                  {currentTrack.album && (
                    <Link
                      to={`/music/album/${encodeURIComponent(currentTrack.album)}`}
                      className="text-[10px] text-primary hover:underline"
                    >
                      View album →
                    </Link>
                  )}
                </div>
              )}

              {/* Platform links */}
              {((currentTrack as any).spotify_url ||
                (currentTrack as any).soundcloud_url ||
                (currentTrack as any).youtube_url) && (
                <div className="flex items-center gap-1 justify-center">
                  {(currentTrack as any).spotify_url && (
                    <a
                      href={(currentTrack as any).spotify_url}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-green-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70"
                    >
                      <FaSpotify size={12} className="text-green-500" /> Spotify
                    </a>
                  )}
                  {(currentTrack as any).soundcloud_url && (
                    <a
                      href={(currentTrack as any).soundcloud_url}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70"
                    >
                      <FaSoundcloud size={12} className="text-orange-500" /> SoundCloud
                    </a>
                  )}
                  {(currentTrack as any).youtube_url && (
                    <a
                      href={(currentTrack as any).youtube_url}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/70"
                    >
                      <FaYoutube size={12} className="text-red-500" /> YouTube
                    </a>
                  )}
                </div>
              )}

              {/* Minimise */}
              <button
                onClick={() => { setExpanded(false); setCollapsed(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-1 rounded-xl text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
              >
                <ChevronsRightIcon size={16}/>Minimise player
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MAIN ROW ══ */}
      {/*
        Layout: [cover] [title/artist — flex-1] [prev][play][next] [expand]
        Key: controls are in the CENTER of remaining space using justify-center
      */}
      <div className="flex items-center px-2.5 py-2 gap-2">

        {/* Cover — fixed left */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center">
          {currentTrack.cover_image ? (
            <img
              src={currentTrack.cover_image}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music2 size={16} className="text-primary/50" />
          )}
        </div>

        {/* Title + artist — grows */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-[11px] font-semibold truncate text-foreground leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">
            {currentTrack.artist ?? "re.Takt"}
          </p>
        </div>

        {/* Controls — fixed width, perfectly centered */}
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={prev}
            disabled={!hasPrev}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90
              ${hasPrev
                ? "bg-secondary/70 text-foreground hover:bg-primary/20 hover:text-primary"
                : "bg-secondary/30 text-muted-foreground/30 cursor-not-allowed"
              }`}
          >
            <SkipBack size={12} fill={hasPrev ? "currentColor" : "none"} />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-primary/95 text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all flex items-center justify-center shadow-md shadow-primary/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : playing ? (
              <Pause size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" className="translate-x-px" />
            )}
          </button>

          <button
            onClick={next}
            disabled={!hasNext}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90
              ${hasNext
                ? "bg-secondary/70 text-foreground hover:bg-primary/20 hover:text-primary"
                : "bg-secondary/30 text-muted-foreground/30 cursor-not-allowed"
              }`}
          >
            <SkipForward size={12} fill={hasNext ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Expand — large tap area */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={14} />
          </motion.div>
        </button>
      </div>

      {/* ══ BOTTOM progress line — visible when collapsed only ══ */}
      {!expanded && (
        <div
          className="relative h-3 w-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}
        >
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2">
            <div className="relative h-px w-full rounded-full bg-secondary/55">
              <div
                className="absolute left-0 top-0 h-px rounded-full bg-primary transition-none"
                style={{ width: pct }}
              />
              <div
                className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-background/80 bg-primary shadow-md shadow-primary/25"
                style={seekThumbStyle}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

