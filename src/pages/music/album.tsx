import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Disc3, Play, Pause, PenLine, Music2 } from "lucide-react";
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
  const hasAnyAudio = tracks.some((t) => t.audio_url);

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
    <div className="w-full max-w-3xl space-y-5">

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-6 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-lg border bg-card/30 p-3 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-lg bg-muted/50" />
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
          {/* ── Album header card ── */}
          <div className={`overflow-hidden rounded-xl border ${palette.border} bg-gradient-to-br ${palette.headerGradient} px-4 py-4 shadow-sm`}>

            {/* Top row: cover + info side by side */}
            <div className="flex gap-4 items-start">

              {/* LEFT: Cover (smaller) + tags/year/type below it */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                {/* Cover image — compact */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-md`}>
                  {albumInfo?.cover_image ? (
                    <img
                      src={albumInfo.cover_image}
                      alt={decodedAlbum}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 size={28} className={`${palette.iconColor} opacity-60`} strokeWidth={1.2} />
                  )}
                </div>

                {/* Below cover: year · type · tags */}
                <div className="flex flex-col items-center gap-1 w-20 sm:w-24">
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {albumInfo?.year && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${palette.badge}`}>
                        {albumInfo.year}
                      </span>
                    )}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${palette.badge}`}>
                      {albumInfo?.release_type || "Album"}
                    </span>
                  </div>
                  {albumInfo?.tags && albumInfo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {albumInfo.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[8px] text-muted-foreground/70">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Title, artist, meta, play button */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                {/* Admin edit — top right */}
                {isAdmin && tracks.length > 0 && (
                  <div className="flex justify-end mb-0.5">
                    <Link
                      to={`/admin/music/edit/${tracks[0].id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 rounded-md transition-colors"
                    >
                      <PenLine size={10} /> Edit
                    </Link>
                  </div>
                )}

                <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight text-foreground">
                  {decodedAlbum}
                </h1>

                {albumInfo?.artist && (
                  <p className="text-xs text-muted-foreground font-medium">{albumInfo.artist}</p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <span>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
                  {albumInfo?.genre && (
                    <>
                      <span className="opacity-40">·</span>
                      <span>{albumInfo.genre}</span>
                    </>
                  )}
                </div>

                {/* Play icon-only button */}
                {hasAnyAudio && (
                  <button
                    onClick={handlePlayAlbum}
                    className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 shadow-sm ${palette.iconBg} ${palette.iconColor} border ${palette.border}`}
                    title={isAlbumPlaying ? "Pause" : "Play album"}
                  >
                    {isAlbumPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="translate-x-px" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Palette-colored separator ── */}
            <div className={`mt-4 h-px w-full ${palette.iconColor} opacity-20`}
              style={{ background: "currentColor" }} />

            {/* ── Info panel below separator ── */}
            {albumInfo?.description && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {albumInfo.description}
              </p>
            )}
            {!albumInfo?.description && (
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/50">
                <span className="capitalize">{albumInfo?.release_type || "Album"}</span>
                {albumInfo?.year && <><span>·</span><span>{albumInfo.year}</span></>}
                {albumInfo?.genre && <><span>·</span><span>{albumInfo.genre}</span></>}
                <span>·</span>
                <span>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
              </div>
            )}
          </div>

          {/* ── Track list ── */}
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
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
                    isActive ? "bg-primary/8 dark:bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => navigate(`/music/song/${track.id}`)}
                >
                  {/* Play/pause */}
                  <div className="shrink-0 w-7 flex items-center justify-center">
                    {hasAudio ? (
                      <button
                        onClick={(e) => handlePlayTrack(e, track)}
                        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95 touch-manipulation ${
                          isActive ? "text-primary" : "text-foreground/50 hover:text-primary"
                        }`}
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause size={12} fill="currentColor" />
                        ) : isActive ? (
                          <PlayingBars />
                        ) : (
                          <Play size={12} fill="currentColor" className="translate-x-px" />
                        )}
                      </button>
                    ) : (
                      <Music2 size={11} className="text-muted-foreground/30" />
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
                      <div className="flex gap-1 mt-0.5">
                        {track.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] text-muted-foreground/60">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External links — hover reveal */}
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
                          className={`p-1.5 rounded-md text-muted-foreground/50 ${link.color} hover:bg-secondary transition-colors`}
                        >
                          <Icon size={12} />
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
