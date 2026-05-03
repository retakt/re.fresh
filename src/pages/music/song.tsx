import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import {
  ArrowLeft,
  Music2,
  Play,
  Pause,
  PenLine,
  Eye,
} from "lucide-react";
import { useViewCount, formatViewCount } from "@/hooks/use-view-count";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { usePlayer } from "@/lib/player";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { SongDetailSkeleton } from "@/components/ui/skeleton";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Music | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [descExpanded, setDescExpanded] = useState(true);
  const { play, pause, isTrackPlaying, currentTrack } = usePlayer();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Must be before any early returns — Rules of Hooks
  const viewCount = useViewCount(id, 'music', track?.view_count ?? 0);

  useEffect(() => {
    const fetchTrack = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("music")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (error || !data) setNotFound(true);
      else setTrack(data);
      setLoading(false);
    };

    fetchTrack();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl">
        <SongDetailSkeleton />
      </div>
    );
  }

  if (notFound || !track) {
      return (
      <div className="max-w-2xl py-16 text-center space-y-3">
        <p className="text-muted-foreground">Track not found.</p>
        <Link to="/music">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={14} /> Back to Music
          </Button>
        </Link>
      </div>
    );
  }

  const palette = getCardPalette(track.id);
  const isPlaying = isTrackPlaying(track.id);
  const isLoaded = currentTrack?.id === track.id;

  const links = [
    {
      url: track.spotify_url,
      label: "Spotify",
      icon: FaSpotify,
      color: "text-green-600 dark:text-green-400 hover:bg-green-500/10",
    },
    {
      url: track.soundcloud_url,
      label: "SoundCloud",
      icon: FaSoundcloud,
      color: "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10",
    },
    {
      url: track.youtube_url,
      label: "YouTube",
      icon: FaYoutube,
      color: "text-red-600 dark:text-red-400 hover:bg-red-500/10",
    },
  ].filter((l) => l.url);
  const handlePlayPause = () => {
    if (isLoaded) {
      if (isPlaying) pause();
      else play(track);
    } else {
      play(track);
    }
    // Collapse description when playback starts so floating player is visible
    setDescExpanded(false);
  };

  return (
    <article className="w-full max-w-3xl">
      {/* Gradient header */}
      <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${palette.headerGradient}`}>
        <div className="flex items-center justify-between mb-6">
          <Link
            to={track.album ? `/music/album/${encodeURIComponent(track.album)}` : "/music"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            {track.album ? track.album : "Music"}
          </Link>
          {isAdmin && (
            <Link
              to={`/admin/music?edit=${track.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <PenLine size={12} /> Edit
            </Link>
          )}
        </div>

        {/* Two-column layout — desktop */}
        <div className="hidden sm:flex gap-0 items-stretch">

          {/* LEFT: cover + info + tags */}
          <div className="shrink-0 flex flex-col gap-2 w-40 sm:w-48">

            {/* Cover — clean */}
            <div className="relative w-full aspect-square">
              <div className={`w-full h-full rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-lg`}>
                {track.cover_image
                  ? <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" />
                  : <Music2 size={32} className={palette.iconColor} strokeWidth={1.2} />}
              </div>
            </div>

            {/* Release type + view count on same line */}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{track.release_type}</p>
              {viewCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70 font-medium">
                  <Eye size={10} />{formatViewCount(viewCount)}
                </span>
              )}
              {track.audio_url && (
                <button
                  onClick={handlePlayPause}
                  className={`ml-auto w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${palette.playBg} text-white shrink-0`}
                >
                  {isPlaying
                    ? <Pause size={13} fill="currentColor" />
                    : <Play size={13} fill="currentColor" className="translate-x-px" />}
                </button>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight -mt-1">{track.title}</h1>
            {track.artist && <p className="text-sm text-muted-foreground -mt-1">{track.artist}</p>}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground -mt-1">
              {track.year && <span>{track.year}</span>}
              {track.genre && <><span className="opacity-40">·</span><span>{track.genre}</span></>}
              {track.album && (
                <><span className="opacity-40">·</span>
                <Link to={`/music/album/${encodeURIComponent(track.album)}`} className="text-primary hover:underline">{track.album}</Link></>
              )}
            </div>

            {/* Platform links */}
            {links.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a key={link.label} href={link.url!} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 transition-colors ${link.color} hover:border-transparent`}>
                      <Icon size={13} />{link.label}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Tags */}
            {track.tags && track.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {track.tags.map((tag) => (
                  <button key={tag} onClick={() => navigate(`/music?tag=${encodeURIComponent(tag)}`)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition-opacity ${palette.badge}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vertical separator */}
          <div className="mx-5 sm:mx-6 w-0.5 self-stretch rounded-full bg-foreground/20" />

          {/* RIGHT: description */}
          <div className="flex-1 min-w-0">
            {track.description
              ? <div className="prose prose-sm max-w-none" style={{ lineHeight: "1.3" }} dangerouslySetInnerHTML={{ __html: track.description }} />
              : <p className="text-xs text-muted-foreground/40 italic">No details yet.</p>}
          </div>
        </div>

        {/* ── MOBILE layout ── */}
        <div className="flex sm:hidden gap-3 items-start">

          {/* Cover — clean, no overlapping button */}
          <div className="relative shrink-0 w-24 h-24">
            <div className={`w-full h-full rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-lg`}>
              {track.cover_image
                ? <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" />
                : <Music2 size={24} className={palette.iconColor} strokeWidth={1.2} />}
            </div>
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 flex flex-col space-y-0.5 relative">
            {/* Play button — top-right of meta, mobile only */}
            {track.audio_url && (
              <button
                onClick={handlePlayPause}
                className={`absolute top-0 right-0 w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 hover:scale-110 ${palette.playBg} text-white`}
              >
                {isPlaying
                  ? <Pause size={15} fill="currentColor" />
                  : <Play size={15} fill="currentColor" className="translate-x-px" />}
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{track.release_type}</p>
              {viewCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70 font-medium">
                  <Eye size={9} />{formatViewCount(viewCount)}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold tracking-tight leading-tight">{track.title}</h1>
            {track.artist && <p className="text-[11px] text-muted-foreground">{track.artist}</p>}
            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground/70">
              {track.year && <span>{track.year}</span>}
              {track.genre && <><span className="opacity-40">·</span><span>{track.genre}</span></>}
              {track.album && (
                <><span className="opacity-40">·</span>
                <Link to={`/music/album/${encodeURIComponent(track.album)}`} className="text-primary hover:underline text-[10px]">{track.album}</Link></>
              )}
            </div>
            {track.tags && track.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {track.tags.map((tag) => (
                  <button key={tag} onClick={() => navigate(`/music?tag=${encodeURIComponent(tag)}`)}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium hover:opacity-80 ${palette.badge}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE: socials + description (no separator) ── */}
        <div className="sm:hidden mt-4">
          {/* Socials row — palette vertical separator then icons */}
          {links.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-0.5 h-4 rounded-full ${palette.playBg}`} />
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a key={link.label} href={link.url!} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-border/60 transition-colors ${link.color} hover:border-transparent`}>
                    <Icon size={12} />{link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Description with collapse (default expanded, collapses on play) */}
          {track.description && (
            <div className="mt-3">
              <div
                className={`prose max-w-none transition-all duration-300 ${
                  descExpanded ? "" : "line-clamp-3"
                }`}
                style={{ fontSize: "12px", lineHeight: "1.3" }}
                dangerouslySetInnerHTML={{ __html: track.description }}
              />
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 text-[10px] text-primary font-medium hover:underline"
              >
                {descExpanded ? "Show less" : "Read more"}
              </button>
            </div>
          )}

          {/* Placeholder for future card */}
          <div className="mt-4" />
        </div>
      </div>
    </article>
  );
}
