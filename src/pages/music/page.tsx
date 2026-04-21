import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Music2, Plus, Disc3, ListMusic,
  MicVocal, Play, Pause, ExternalLink,
} from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import {
  Empty, EmptyHeader, EmptyMedia,
  EmptyTitle, EmptyDescription,
} from "@/components/ui/empty.tsx";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { getCardPalette } from "@/lib/cardColors";

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
}: {
  track: Music;
  index: number;
  allTracks: Music[];
  onTagClick: (tag: string) => void;
}) {
  const navigate = useNavigate();
  const { play, pause, isTrackPlaying, currentTrack } = usePlayer();
  const palette = getCardPalette(track.id);

  const isLoaded = currentTrack?.id === track.id;
  const isPlaying = isTrackPlaying(track.id);
  const hasAudio = !!track.audio_url;

  // Smart routing: single → song page, has album → album page
  const handleNavigate = useCallback(() => {
    if (track.album) {
      navigate(`/music/album/${encodeURIComponent(track.album)}`);
    } else {
      navigate(`/music/song/${track.id}`);
    }
  }, [track, navigate]);

  // Instant play - no navigation, just play
  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAudio) return;

    if (isLoaded) {
      isPlaying ? pause() : play(toPlayerTrack(track));
    } else {
      // Build queue: if has album, queue all album tracks; else just this
      const queue = track.album
        ? allTracks
            .filter((t) => t.album === track.album && t.audio_url)
            .map(toPlayerTrack)
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
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none
        ${isLoaded
          ? "bg-primary/8 dark:bg-primary/10"
          : "hover:bg-secondary/60"
        }
      `}
      onClick={handleNavigate}
    >
      {/* Play button / track number - Spotify style */}
      <div className="shrink-0 w-8 flex items-center justify-center">
        {hasAudio ? (
          <>
            {/* Number shown by default, hidden on hover/active */}
            <span
              className={`text-sm text-muted-foreground tabular-nums transition-all
                ${isLoaded ? "hidden" : "group-hover:hidden"}
              `}
            >
              {index + 1}
            </span>
            {/* Play/pause button shown on hover/active */}
            <button
              onClick={handlePlayPause}
              className={`items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95
                ${isLoaded ? "flex" : "hidden group-hover:flex"}
                ${isPlaying ? "text-primary" : "text-foreground"}
              `}
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="translate-x-px" />
              )}
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">
            {index + 1}
          </span>
        )}
      </div>

      {/* Cover art */}
      <div className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg}`}>
        {track.cover_image ? (
          <img
            src={track.cover_image}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Music2 size={16} className={palette.iconColor} strokeWidth={1.8} />
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate transition-colors
          ${isLoaded ? "text-primary" : "text-foreground group-hover:text-primary"}
        `}>
          {track.title}
        </p>
        {track.artist && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {track.artist}
          </p>
        )}
      </div>

      {/* Tags / meta - NOW visible on mobile too */}
      <div
        className="flex flex-wrap items-center gap-1.5 shrink-0 max-w-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        {track.genre && (
          <button
            onClick={() => onTagClick(track.genre!)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${palette.badge} hover:opacity-80 transition-opacity`}
          >
            {track.genre}
          </button>
        )}
        {track.year && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {track.year}
          </span>
        )}
        {track.album && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/music/album/${encodeURIComponent(track.album!)}`);
            }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium truncate max-w-[100px]"
          >
            {track.album}
          </button>
        )}
        {track.tags?.slice(0, 2).map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>
      {/* Platform icons + external links */}
      <div
        className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {extLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              className={`p-1.5 rounded-md hover:bg-secondary/80 transition-colors ${link.color}`}
            >
              <Icon size={13} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function MusicPage() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from("music")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data) setTracks(data);
      setLoading(false);
    };
    fetchTracks();
  }, []);

  const handleTagClick = (tag: string) => {
    setTagFilter((prev) => (prev === tag ? null : tag));
    setFilter("all");
  };

  const filtered = tracks.filter((t) => {
    const matchesType =
      filter === "all" ||
      (filter === "album" && t.release_type === "album") ||
      (filter === "single" && t.release_type === "single") ||
      (filter === "ep" && t.release_type === "ep");

    const matchesTag =
      !tagFilter ||
      t.genre === tagFilter ||
      (t.tags && t.tags.includes(tagFilter));

    return matchesType && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Music</h1>
          <p className="text-sm text-muted-foreground mt-1">List of my musical works...</p>
          <p className="text-sm text-muted-foreground mt-1">Music for life. ~ hmph!</p>
        </div>
        {isAdmin && (
          <Link to="/admin/music">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Add track
            </Button>
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
        {tagFilter && (
          <button
            onClick={() => setTagFilter(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            #{tagFilter} ✕
          </button>
        )}
      </div>

      {/* Track list */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Music2 /></EmptyMedia>
            <EmptyTitle>No tracks found</EmptyTitle>
            <EmptyDescription>
              {tagFilter
                ? `No tracks tagged "${tagFilter}"`
                : "Tracks and productions will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-0.5">
          {/* Column headers - desktop only */}
          <div className="hidden sm:grid grid-cols-[2rem_2.5rem_1fr_auto_auto] gap-3 px-3 pb-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider border-b mb-1">
            <span className="text-center">#</span>
            <span />
            <span>Title</span>
            <span>Info</span>
            <span>Links</span>
          </div>

          {filtered.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              allTracks={tracks}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
