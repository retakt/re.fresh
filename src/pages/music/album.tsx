import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Disc3, Play, Pause, PenLine, Music2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";

// Animated bars — shown when a track is actively playing
function PlayingBars({ className }: { className?: string }) {
  return (
    <span className={`flex items-end gap-px h-3.5 ${className ?? ""}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-primary animate-[musicbar_0.8s_ease-in-out_infinite_alternate]"
          style={{
            animationDelay: `${(i - 1) * 0.15}s`,
            height: `${40 + i * 20}%`,
          }}
        />
      ))}
    </span>
  );
}

export default function AlbumPage() {
  const { albumName } = useParams<{ albumName: string }>();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, pause, isTrackPlaying, playing, currentTrack } = usePlayer();
  const { isAdmin } = useAuth();

  const decodedAlbum = decodeURIComponent(albumName || "");
  const albumInfo = tracks[0];
  const palette = getCardPalette(albumInfo?.id ?? decodedAlbum);

  const isAlbumPlaying = playing && tracks.some((t) => t.id === currentTrack?.id);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from("music")
        .select("*")
        .eq("album", decodedAlbum)
        .eq("published", true)
        .order("created_at", { ascending: true });

      if (!error && data) setTracks(data);
      setLoading(false);
    };
    fetchTracks();
  }, [decodedAlbum]);

  const toPlayerTrack = (t: Music): PlayerTrack => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    cover_image: t.cover_image,
    audio_url: t.audio_url,
    album: t.album,
    spotify_url: t.spotify_url,
    soundcloud_url: t.soundcloud_url,
    youtube_url: t.youtube_url,
  });

  const handlePlayAlbum = () => {
    const playable = tracks.filter((t) => t.audio_url);
    if (playable.length === 0) return;
    if (isAlbumPlaying) {
      pause();
    } else {
      play(toPlayerTrack(playable[0]), playable.map(toPlayerTrack));
    }
  };

  const handlePlayTrack = (e: React.MouseEvent, track: Music) => {
    e.stopPropagation();
    if (!track.audio_url) return;
    const playable = tracks.filter((t) => t.audio_url);
    if (isTrackPlaying(track.id)) {
      pause();
    } else {
      play(toPlayerTrack(track), playable.map(toPlayerTrack));
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/music"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Music
        </Link>
        {isAdmin && tracks.length > 0 && (
          <Link
            to={`/admin/music?edit=${tracks[0].id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
          >
            <PenLine size={12} /> Edit
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-6">
            <div className="w-40 h-40 rounded-2xl bg-muted shrink-0" />
            <div className="flex-1 space-y-3 pt-4">
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-7 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-lg border bg-card/30 p-3 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50" />
            ))}
          </div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Album not found.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate("/music")}>
            Back to Music
          </Button>
        </div>
      ) : (
        <>
          {/* Album header */}
          <div className={`overflow-hidden rounded-lg border border-border/60 px-5 py-6 shadow-sm sm:px-7 sm:py-7 bg-gradient-to-b ${palette.headerGradient}`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="flex shrink-0 flex-col gap-4">
                <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-xl`}>
                  {albumInfo?.cover_image ? (
                    <img
                      src={albumInfo.cover_image}
                      alt={decodedAlbum}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 size={48} className={`${palette.iconColor} opacity-60`} strokeWidth={1.2} />
                  )}
                </div>

                {tracks.some((t) => t.audio_url) && (
                  <button
                    onClick={handlePlayAlbum}
                    className={`inline-flex w-fit items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${palette.iconBg} ${palette.iconColor} border ${palette.border}`}
                  >
                    {isAlbumPlaying ? (
                      <><Pause size={15} /> Pause</>
                    ) : (
                      <><Play size={15} className="translate-x-px" /> Play</>
                    )}
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2 pb-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.24em] font-medium">
                  {albumInfo?.release_type || "Album"}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-slate-950 dark:text-slate-50">
                  {decodedAlbum}
                </h1>
                {albumInfo?.artist && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{albumInfo.artist}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {albumInfo?.year && <span>{albumInfo.year}</span>}
                  <span className="opacity-40">·</span>
                  <span>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
                  {albumInfo?.genre && (
                    <>
                      <span className="opacity-40">·</span>
                      <span>{albumInfo.genre}</span>
                    </>
                  )}
                </div>
                {/* Album-level tags */}
                {albumInfo?.tags && albumInfo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {albumInfo.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${palette.badge}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {albumInfo?.description && (
            <p className="max-w-2xl text-sm text-muted-foreground leading-7">
              {albumInfo.description}
            </p>
          )}

          {/* Track list — Spotify style, no numbers */}
          <div className="space-y-0.5 rounded-lg border border-border/60 bg-card/30 p-2 sm:p-3">
            {tracks.map((track) => {
              const isActive = currentTrack?.id === track.id;
              const isPlaying = isTrackPlaying(track.id);
              const hasAudio = !!track.audio_url;

              const extLinks = [
                { url: track.spotify_url, icon: FaSpotify, label: "Spotify", color: "hover:text-green-500" },
                { url: track.soundcloud_url, icon: FaSoundcloud, label: "SoundCloud", color: "hover:text-orange-500" },
                { url: track.youtube_url, icon: FaYoutube, label: "YouTube", color: "hover:text-red-500" },
              ].filter((l) => l.url);

              return (
                <div
                  key={track.id}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/8 dark:bg-primary/10"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => navigate(`/music/song/${track.id}`)}
                >
                  {/* Play/pause button — always visible, no number */}
                  <div className="shrink-0 w-8 flex items-center justify-center">
                    {hasAudio ? (
                      <button
                        onClick={(e) => handlePlayTrack(e, track)}
                        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 touch-manipulation ${
                          isActive ? "text-primary" : "text-foreground/60 hover:text-primary"
                        }`}
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause size={13} fill="currentColor" />
                        ) : isActive ? (
                          <PlayingBars />
                        ) : (
                          <Play size={13} fill="currentColor" className="translate-x-px" />
                        )}
                      </button>
                    ) : (
                      <div className="w-7 h-7 flex items-center justify-center">
                        <Music2 size={12} className="text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate transition-colors ${
                      isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                    }`}>
                      {track.title}
                    </p>
                    {track.tags && track.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {track.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External links — visible on hover/active */}
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          className={`p-1.5 rounded-md text-muted-foreground ${link.color} hover:bg-secondary transition-colors`}
                        >
                          <Icon size={13} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
