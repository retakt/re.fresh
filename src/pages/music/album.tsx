import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Disc3, Play, Pause, PenLine, Music2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { useAuth } from "@/hooks/useAuth";
import { getCardPalette } from "@/lib/cardColors";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import RichTextEditor from "@/components/rich-text-editor.tsx";

function PlayingBars({ className }: { className?: string }) {
  return (
    <span className={`flex items-end gap-px h-3.5 ${className ?? ""}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-primary animate-[musicbar_0.8s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: `${(i - 1) * 0.15}s`, height: `${40 + i * 20}%` }}
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
  const [albumDesc, setAlbumDesc] = useState<string>("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
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
        .from("music").select("*")
        .eq("album", decodedAlbum).eq("published", true)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setTracks(data);
        // album_description stored on first track's description field
        // (separate from individual song descriptions)
        setAlbumDesc(data[0]?.album_description ?? "");
      }
      setLoading(false);
    };
    fetchTracks();
  }, [decodedAlbum]);

  const toPlayerTrack = (t: Music): PlayerTrack => ({
    id: t.id, title: t.title, artist: t.artist,
    cover_image: t.cover_image, audio_url: t.audio_url, album: t.album,
    spotify_url: t.spotify_url, soundcloud_url: t.soundcloud_url, youtube_url: t.youtube_url,
  });

  // Play all tracks sequentially — queue set, auto-advances
  const handlePlayAlbum = () => {
    const playable = tracks.filter((t) => t.audio_url);
    if (!playable.length) return;
    if (isAlbumPlaying) {
      pause();
    } else {
      play(toPlayerTrack(playable[0]), playable.map(toPlayerTrack));
    }
  };

  const handlePlayTrack = (track: Music) => {
    if (!track.audio_url) return;
    const playable = tracks.filter((t) => t.audio_url);
    isTrackPlaying(track.id) ? pause() : play(toPlayerTrack(track), playable.map(toPlayerTrack));
  };

  const handleSaveDesc = async () => {
    if (!albumInfo) return;
    setSavingDesc(true);
    await supabase.from("music")
      .update({ album_description: albumDesc } as never)
      .eq("album", decodedAlbum);
    setSavingDesc(false);
    setEditingDesc(false);
  };

  return (
    <div className="w-full max-w-3xl space-y-4">

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-4 rounded-xl border bg-card/30 p-4">
            <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-xl border bg-card/30 p-3 space-y-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-11 rounded-lg bg-muted/50" />)}
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
          <div className={`rounded-xl border ${palette.border} bg-gradient-to-br ${palette.headerGradient} px-3 py-3 sm:px-4 sm:py-4 shadow-sm`}>

            {/* Admin edit — top right */}
            {isAdmin && (
              <div className="flex justify-end mb-2 gap-2">
                {editingDesc ? (
                  <>
                    <button onClick={handleSaveDesc} disabled={savingDesc}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
                      {savingDesc ? "Saving…" : "Save notes"}
                    </button>
                    <button onClick={() => setEditingDesc(false)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground rounded-md transition-colors">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditingDesc(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground rounded-md transition-colors">
                    <PenLine size={10} /> Edit notes
                  </button>
                )}
                <Link to={`/admin/music/edit/${tracks[0].id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground rounded-md transition-colors">
                  <PenLine size={10} /> Edit track
                </Link>
              </div>
            )}

            {/* ── DESKTOP: side-by-side ── */}
            <div className="hidden sm:flex gap-0 items-stretch min-h-[120px]">
              {/* LEFT: content-sized, clamped 30–50% */}
              <div className="min-w-[30%] max-w-[50%] w-fit shrink-0 flex flex-col gap-2">
                <div className="flex gap-4 items-start">
                  <motion.div layoutId={`album-cover-${decodedAlbum}`}
                    onClick={() => navigate(`/music/song/${tracks[0].id}`)}
                    className={`shrink-0 w-28 h-28 rounded-xl overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-md cursor-pointer hover:opacity-90 transition-opacity`}>
                    {albumInfo?.cover_image
                      ? <img src={albumInfo.cover_image} alt={decodedAlbum} className="w-full h-full object-cover" />
                      : <Disc3 size={32} className={`${palette.iconColor} opacity-60`} strokeWidth={1.2} />}
                  </motion.div>                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">{albumInfo?.release_type || "Album"}</p>
                    <h1
                      onClick={() => navigate(`/music/song/${tracks[0].id}`)}
                      className={`text-base font-extrabold tracking-tight leading-tight underline underline-offset-2 cursor-pointer truncate ${palette.iconColor}`}
                    >{decodedAlbum}</h1>
                    {albumInfo?.artist && <p className="text-sm text-muted-foreground truncate">{albumInfo.artist}</p>}
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground/70">
                      {albumInfo?.year && <span>{albumInfo.year}</span>}
                      {albumInfo?.year && <span className="opacity-40">·</span>}
                      <span>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
                      {albumInfo?.genre && <><span className="opacity-40">·</span><span>{albumInfo.genre}</span></>}
                    </div>
                    {/* Tags + play button inline */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {albumInfo?.tags?.map((tag) => (
                        <button key={tag} onClick={() => navigate(`/music?tag=${encodeURIComponent(tag)}`)}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity ${palette.badge}`}>#{tag}</button>
                      ))}
                      {hasAnyAudio && (
                        <button onClick={handlePlayAlbum}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${palette.playBg} text-white`}>
                          {isAlbumPlaying
                            ? <><Pause size={11} fill="currentColor" /> Pause</>
                            : <><Play size={11} fill="currentColor" className="translate-x-px" /> {albumInfo?.release_type?.toUpperCase() ?? "Album"}</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="mx-4 w-0.5 self-stretch rounded-full bg-foreground/20" />

              {/* RIGHT: notes */}
              <div className="flex-1 min-w-0">
                {editingDesc ? (
                  <RichTextEditor value={albumDesc} onChange={setAlbumDesc} placeholder="Album notes, liner notes, story behind the release..." />
                ) : albumDesc ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: albumDesc }} />
                ) : (
                  <p className="text-xs text-muted-foreground/40 italic">{isAdmin ? "Click 'Edit notes' to add album notes." : "No album notes yet."}</p>
                )}
              </div>
            </div>

            {/* ── MOBILE: stacked ── */}
            <div className="flex sm:hidden gap-3 items-start">
              {/* Cover */}
              <motion.div layoutId={`album-cover-${decodedAlbum}`}
                onClick={() => navigate(`/music/song/${tracks[0].id}`)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center ${palette.iconBg} shadow-md cursor-pointer`}>
                {albumInfo?.cover_image
                  ? <img src={albumInfo.cover_image} alt={decodedAlbum} className="w-full h-full object-cover" />
                  : <Disc3 size={20} className={`${palette.iconColor} opacity-60`} strokeWidth={1.2} />}
              </motion.div>

              {/* Meta */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{albumInfo?.release_type || "Album"}</p>
                <h1
                  onClick={() => navigate(`/music/song/${tracks[0].id}`)}
                  className={`text-sm font-extrabold tracking-tight leading-tight underline underline-offset-2 cursor-pointer ${palette.iconColor}`}
                >{decodedAlbum}</h1>
                {albumInfo?.artist && <p className="text-[11px] text-muted-foreground">{albumInfo.artist}</p>}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground/70">
                  {albumInfo?.year && <span>{albumInfo.year}</span>}
                  {albumInfo?.year && <span className="opacity-40">·</span>}
                  <span>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
                  {albumInfo?.genre && <><span className="opacity-40">·</span><span>{albumInfo.genre}</span></>}
                </div>
                {/* Tags + play button inline */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {albumInfo?.tags?.map((tag) => (
                    <button key={tag} onClick={() => navigate(`/music?tag=${encodeURIComponent(tag)}`)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity ${palette.badge}`}>#{tag}</button>
                  ))}
                  {hasAnyAudio && (
                    <button onClick={handlePlayAlbum}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all active:scale-95 ${palette.playBg} text-white`}>
                      {isAlbumPlaying
                        ? <><Pause size={10} fill="currentColor" /> Pause</>
                        : <><Play size={10} fill="currentColor" className="translate-x-px" /> {albumInfo?.release_type?.toUpperCase() ?? "Album"}</>}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── MOBILE: horizontal separator + notes with read more ── */}
            {(albumDesc || (isAdmin && editingDesc)) && (
              <div className="sm:hidden mt-3">
                <div className="h-px w-full bg-foreground/20 rounded-full mb-3" />
                {editingDesc ? (
                  <RichTextEditor value={albumDesc} onChange={setAlbumDesc} placeholder="Album notes..." />
                ) : (
                  <div className="relative">
                    <div
                      className={`prose max-w-none overflow-hidden transition-all duration-300 ${notesExpanded ? "" : "max-h-16"}`}
                      style={{ fontSize: "11px", lineHeight: "1.5" }}
                      dangerouslySetInnerHTML={{ __html: albumDesc }}
                    />
                    {!notesExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none" />
                    )}
                    <button
                      onClick={() => setNotesExpanded(!notesExpanded)}
                      className="mt-1 text-[10px] text-primary font-medium hover:underline"
                    >
                      {notesExpanded ? "Show less" : "Read more"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Mobile: show "Edit notes" prompt even when no notes */}
            {isAdmin && !editingDesc && !albumDesc && (
              <div className="sm:hidden mt-2">
                <div className="h-px w-full bg-foreground/20 rounded-full mb-2" />
                <p className="text-[10px] text-muted-foreground/40 italic">Click 'Edit notes' to add album notes.</p>
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
                  onClick={() => handlePlayTrack(track)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    isActive ? "bg-primary/8 dark:bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                >
                  {/* Play/pause icon — visual only */}
                  <div className="shrink-0 w-7 flex items-center justify-center pointer-events-none">
                    {hasAudio ? (
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                        isActive ? "text-primary" : "text-foreground/50 group-hover:text-primary"
                      }`}>
                        {isPlaying
                          ? <Pause size={12} fill="currentColor" />
                          : isActive
                            ? <PlayingBars />
                            : <Play size={12} fill="currentColor" className="translate-x-px" />
                        }
                      </div>
                    ) : (
                      <Music2 size={11} className="text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Track info — visual only */}
                  <div className="flex-1 min-w-0 pointer-events-none">
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

                  {/* External links */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {extLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.label}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.label}
                          onClick={(e) => e.stopPropagation()}
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
