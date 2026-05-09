import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Music2, Plus, Disc3, ListMusic,
  MicVocal, Play, Pause, PenLine, RefreshCw, Eye,
} from "lucide-react";
import { formatViewCount } from "@/hooks/use-view-count";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import {
  Empty, EmptyHeader, EmptyMedia,
  EmptyTitle, EmptyDescription,
} from "@/components/ui/empty.tsx";
import { TrackCardSkeleton } from "@/components/ui/skeleton.tsx";
import { PageHeader } from "@/components/layout/page-header.tsx";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh.tsx";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { getCardPalette } from "@/lib/cardColors";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";
import { MarqueeText } from "@/components/ui/marquee-text";
import { CanvasText } from "@/components/ui/canvas-text";

type FilterType = "all" | "album" | "single" | "ep";

const FILTERS: { label: string; value: FilterType; icon: React.ElementType }[] = [
  { label: "All", value: "all", icon: ListMusic },
  { label: "Albums", value: "album", icon: Disc3 },
  { label: "Singles", value: "single", icon: Music2 },
  { label: "EPs", value: "ep", icon: MicVocal },
];

const toPlayerTrack = (t: Music): PlayerTrack => ({
  id: t.id,
  title: t.title,
  artist: t.artist,
  cover_image: t.cover_image,
  audio_url: t.audio_url,
  album: t.album,
  spotify_url: t.spotify_url,      // ← add
  soundcloud_url: t.soundcloud_url, // ← add
  youtube_url: t.youtube_url,      // ← add
});

function TrackRow({
  track,
  index,
  allTracks,
  onTagClick,
  isAdmin,
}: {
  track: Music;
  index: number;
  allTracks: Music[];
  onTagClick: (tag: string) => void;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();
  const { play, pause, isTrackPlaying, currentTrack } = usePlayer();
  const palette = getCardPalette(track.id, 'music');
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);

  const isLoaded = currentTrack?.id === track.id;
  const isPlaying = isTrackPlaying(track.id);
  const hasAudio = !!track.audio_url;

  // Navigate to info page based on release type
  const handleNavigate = useCallback(() => {
    if (track.release_type === "album" || track.release_type === "ep") {
      if (track.album) {
        navigate(`/music/album/${encodeURIComponent(track.album)}`);
      } else {
        navigate(`/music/song/${track.id}`);
      }
    } else {
      navigate(`/music/song/${track.id}`);
    }
  }, [track, navigate]);

  // Play/pause this track directly
  const handlePlayPause = useCallback(() => {
    if (!hasAudio) return;
    if (isLoaded) {
      isPlaying ? pause() : play(toPlayerTrack(track));
    } else {
      const queue = track.album
        ? allTracks.filter((t) => t.album === track.album && t.audio_url).map(toPlayerTrack)
        : [toPlayerTrack(track)];
      play(toPlayerTrack(track), queue.length ? queue : [toPlayerTrack(track)]);
    }
  }, [track, allTracks, isLoaded, isPlaying, hasAudio, play, pause]);

  const extLinks = [
    { url: track.spotify_url, icon: FaSpotify, label: "Spotify", color: "text-green-500" },
    { url: track.soundcloud_url, icon: FaSoundcloud, label: "SoundCloud", color: "text-orange-500" },
    { url: track.youtube_url, icon: FaYoutube, label: "YouTube", color: "text-red-500" },
  ].filter((l) => l.url);

  return (
    <div
      onPointerDown={(e) => {
        pointerStartX.current = e.clientX;
        pointerStartY.current = e.clientY;
      }}
      onPointerUp={(e) => {
        const dx = Math.abs(e.clientX - pointerStartX.current);
        const dy = Math.abs(e.clientY - pointerStartY.current);
        // Only navigate if it was a tap (not a swipe)
        if (dx < 8 && dy < 8) handleNavigate();
      }}
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all select-none cursor-pointer
        bg-gradient-to-r ${palette.gradient} ${palette.border}
        ${isLoaded
          ? `shadow-lg ${palette.hoverShadow} -translate-y-0.5`
          : `hover:shadow-lg ${palette.hoverShadow} hover:-translate-y-0.5`
        }
      `}
    >
      {/* Cover art — part of card, navigates */}
      <div className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg}`}>
        {track.cover_image ? (
          <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Music2 size={16} className={palette.iconColor} strokeWidth={1.8} />
        )}
      </div>

      {/* Title + artist + tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">

          {/* Title + artist */}
          <div className="flex-1 min-w-0 text-left">
            <MarqueeText
              text={track.title}
              className={`font-semibold transition-colors leading-tight ${isLoaded ? "" : "text-foreground"}`}
              style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
            />
            {track.artist && (
              <MarqueeText
                text={track.artist}
                className="text-muted-foreground mt-0.5 leading-tight"
                style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
              />
            )}
          </div>

          {/* View count */}
          {(track.view_count ?? 0) > 0 && (
            <span
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground/70 font-medium shrink-0"
              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
            >
              <Eye size={9} />{formatViewCount(track.view_count)}
            </span>
          )}

          {/* Platform icons */}
          {extLinks.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {extLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={`p-1.5 rounded-md hover:bg-secondary/80 transition-all hover:scale-110 ${link.color}`}
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          )}

          {/* Admin edit */}
          {isAdmin && (
            <Link
              to={`/admin/music?edit=${track.id}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all hover:scale-110 shrink-0"
              title="Edit track"
            >
              <PenLine size={12} />
            </Link>
          )}
        </div>

        {/* Tags — single touch-scrollable row, no wrapping, fades right to hint overflow */}
        <div
          className="flex gap-1 mt-1.5 overflow-x-auto scrollbar-none"
          style={{
            maskImage: "linear-gradient(to right, black 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 75%, transparent 100%)",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {track.genre && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onTagClick(track.genre!); }}
              className={`px-2 py-0.5 rounded-full font-medium transition-all hover:opacity-80 shrink-0 ${palette.badge}`}
              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
            >
              {track.genre}
            </button>
          )}
          {track.year && (
            <span
              className="px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground font-medium pointer-events-none shrink-0"
              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
            >
              {track.year}
            </span>
          )}
          {track.album && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); navigate(`/music/album/${encodeURIComponent(track.album!)}`); }}
              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium shrink-0"
              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
            >
              {track.album}
            </button>
          )}
          {track.tags?.map((tag) => (
            <button
              key={tag}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
              style={{ fontSize: "clamp(8px, 2vw, 10px)" }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Play/pause button — right side, vertically centered */}
      <div className="shrink-0 flex items-center justify-center">
        {hasAudio ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => { e.stopPropagation(); handlePlayPause(); }}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95
              ${isPlaying
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground"
              }
            `}
          >
            {isPlaying
              ? <Pause size={13} fill="currentColor" />
              : <Play size={13} fill="currentColor" className="translate-x-px" />
            }
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center pointer-events-none">
            <Music2 size={12} className="text-muted-foreground/50" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MusicPage() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  // Pre-select tag from ?tag= query param (coming from album/song pages)
  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) setTagFilters([tag]);
  }, []);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("music")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) setError("Failed to load tracks. Please try again.");
    else if (data) setTracks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  // Re-fetch when returning from bfcache (tab switch, phone sleep, back-forward nav)
  useEffect(() => {
    const handleResume = () => { void fetchTracks(); };
    window.addEventListener("app-resume", handleResume);
    return () => window.removeEventListener("app-resume", handleResume);
  }, [fetchTracks]);

  // Loading state safety net - prevent stuck loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 15000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const { pullDistance, refreshing, isTriggered } = usePullToRefresh({
    onRefresh: fetchTracks,
    disabled: false,
  });

  const handleTagClick = (tag: string) => {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setFilter("all");
  };

  const filtered = tracks.filter((t) => {
    const matchesType =
      filter === "all" ||
      (filter === "album" && t.release_type === "album") ||
      (filter === "single" && t.release_type === "single") ||
      (filter === "ep" && t.release_type === "ep");

    const matchesTag =
      tagFilters.length === 0 ||
      tagFilters.some((f) =>
        t.genre === f || (t.tags && t.tags.includes(f))
      );

    return matchesType && matchesTag;
  });

  return (
    <div className="space-y-6">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} isTriggered={isTriggered} />
      {/* Header */}
      <div className="space-y-1">
        <div className="pb-2">
          <CanvasText
            text="music"
            backgroundClassName="bg-[#FF6B35]"
            className="text-2xl font-bold"
            colors={["#FF6B35","#F55A24","#EB4913","#FF6B35","#F55A24","#EB4913","#FF6B35","#F55A24"]}
            animationDuration={12}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Some musical works...</p>
          {isAdmin && (
            <Link to="/admin/music">
              <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
                <Plus size={14} /> Add track
              </MagneticButton>
            </Link>
          )}
        </div>
      </div>

      {/* Filter tabs — single scrollable row on mobile */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5"
        style={{
          maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
        }}
      >
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={11} />
              {f.label}
            </button>
          );
        })}
        {tagFilters.length > 0 && tagFilters.map((f) => (
          <button
            key={f}
            onClick={() => handleTagClick(f)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors shrink-0"
          >
            #{f} ✕
          </button>
        ))}
      </div>

      {/* Track list */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <TrackCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchTracks} className="gap-1.5">
            <RefreshCw size={13} /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Music2 /></EmptyMedia>
            <EmptyTitle>No tracks found</EmptyTitle>
            <EmptyDescription>
              {tagFilters.length > 0
                ? `No tracks matching "${tagFilters.join('" or "')}"`
                : "Tracks and productions will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-0.5">
          {/* Column headers - desktop only */}
          <div className="hidden sm:grid grid-cols-[2rem_2.5rem_1fr] gap-3 px-3 pb-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider border-b mb-1">
            <span className="text-center">▶</span>
            <span />
            <span>Title</span>
          </div>

          {filtered.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              allTracks={tracks}
              onTagClick={handleTagClick}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
