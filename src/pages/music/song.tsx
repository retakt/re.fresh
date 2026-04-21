import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  ArrowLeft,
  Music2,
  Play,
  Pause,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { usePlayer } from "@/lib/player";
import { getCardPalette } from "@/lib/cardColors";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Music | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { play, pause, isTrackPlaying, playing, currentTrack } = usePlayer();

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
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="flex gap-6">
          <div className="w-40 h-40 rounded-2xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
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
  };

  return (
    <article className="w-full max-w-3xl">
      {/* Gradient header */}
      <div className={`relative mb-8 overflow-hidden rounded-lg border border-border/60 px-5 py-7 shadow-sm sm:px-7 sm:py-8 bg-gradient-to-b ${palette.headerGradient}`}>
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/music"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Music
          </Link>
        </div>

        {/* Song header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          {/* Cover */}
          <div className={`shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-lg`}>
            {track.cover_image ? (
              <img
                src={track.cover_image}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music2 size={40} className={palette.iconColor} strokeWidth={1.2} />
            )}
          </div>

          {/* Info */}
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              {track.release_type}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {track.title}
            </h1>
            {track.artist && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{track.artist}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              {track.year && <span>{track.year}</span>}
              {track.genre && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{track.genre}</span>
                </>
              )}
              {track.album && (
                <>
                  <span className="opacity-40">·</span>
                  <Link
                    to={`/music/album/${encodeURIComponent(track.album)}`}
                    className="text-primary hover:underline"
                  >
                    {track.album}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Play button + external links */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {track.audio_url ? (
            <button
              onClick={handlePlayPause}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${palette.iconBg} ${palette.iconColor} border ${palette.border}`}
            >
              {isPlaying ? (
                <><Pause size={15} /> Pause</>
              ) : (
                <><Play size={15} className="translate-x-px" /> {isLoaded ? "Resume" : "Play"}</>
              )}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground px-3 py-2 rounded-xl border border-dashed">
              No audio available
            </span>
          )}

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border transition-colors ${link.color} hover:border-transparent`}
              >
                <Icon size={13} />
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Tags */}
        {track.tags && track.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6 mt-6">
            {track.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${palette.badge}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {track.description && (
          <div className="prose prose-sm max-w-2xl dark:prose-invert">
            <p className="text-muted-foreground leading-relaxed">{track.description}</p>
          </div>
        )}
      </div>
    </article>
  );
}
