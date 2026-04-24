import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus } from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("music")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTracks(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTracks(); }, [fetchTracks]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("music").delete().eq("id", id);
    if (error) toast.error("Failed to delete track");
    else { toast.success("Track deleted."); void fetchTracks(); }
  };

  const togglePublish = async (track: Music) => {
    const { error } = await supabase.from("music").update({ published: !track.published }).eq("id", track.id);
    if (error) toast.error("Failed to update");
    else void fetchTracks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        </div>
        <Link to="/admin/music/new">
          <Button size="sm" className="gap-1.5"><Plus size={14} /> Add track</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tracks yet.</p>
          <Link to="/admin/music/new"><Button size="sm" className="mt-4">Add your first track</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-stretch rounded-xl border bg-card px-3 py-3 min-h-[4.5rem] gap-2">

              {/* ── LEFT: 3 lines ── */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">

                {/* Line 1: Title + badges */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MarqueeText text={track.title} className="font-semibold text-sm flex-1 min-w-0" />
                  <Badge variant={track.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {track.published ? "Live" : "Draft"}
                  </Badge>
                  {track.audio_url && (
                    <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">AUDIO</span>
                  )}
                </div>

                {/* Line 2: Artist only — year/type moved to right column */}
                <div className="flex items-center text-[11px] text-muted-foreground min-w-0">
                  {track.artist
                    ? <MarqueeText text={track.artist} className="text-[11px] text-muted-foreground flex-1 min-w-0" />
                    : <span className="text-muted-foreground/30">—</span>
                  }
                </div>

                {/* Line 3: Tags */}
                {(track.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(track.tags ?? []).slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT column ── */}
              <div className="flex flex-col justify-between shrink-0 items-end gap-1 min-w-[3.5rem]">

                {/* TOP: Year · Type — fixed 4-char year, then release type */}
                <div className="flex flex-col items-end gap-0.5 pt-0.5">
                  {track.year && (
                    <span className="text-[11px] font-semibold text-foreground/70 tabular-nums leading-none">
                      {track.year}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-muted-foreground/70 capitalize leading-none">
                    {track.release_type}
                  </span>
                </div>

                {/* MIDDLE: Platform icons */}
                <div className="flex items-center gap-2">
                  {track.soundcloud_url && (
                    <a href={track.soundcloud_url} target="_blank" rel="noreferrer" title="SoundCloud"
                      onClick={(e) => e.stopPropagation()}>
                      <FaSoundcloud size={15} className="text-orange-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.youtube_url && (
                    <a href={track.youtube_url} target="_blank" rel="noreferrer" title="YouTube"
                      onClick={(e) => e.stopPropagation()}>
                      <FaYoutube size={15} className="text-red-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.spotify_url && (
                    <a href={track.spotify_url} target="_blank" rel="noreferrer" title="Spotify"
                      onClick={(e) => e.stopPropagation()}>
                      <FaSpotify size={15} className="text-green-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                </div>

                {/* BOTTOM: Toggle + edit + delete — small, muted */}
                <div className="flex items-center gap-0">
                  <PublishToggle published={track.published} onChange={() => togglePublish(track)} />
                  <Link to={`/admin/music/edit/${track.id}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 touch-manipulation text-muted-foreground/60 hover:text-foreground">
                      <PenLine size={11} />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-6 w-6 touch-manipulation text-muted-foreground/40 hover:text-destructive"
                    onClick={() => handleDelete(track.id, track.title)}>
                    <Trash2 size={11} />
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
