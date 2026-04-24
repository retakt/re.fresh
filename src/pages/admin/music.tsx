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
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
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
            <div key={track.id} className="rounded-xl border bg-card px-3 py-2.5 min-h-[4.5rem] flex flex-col justify-between gap-1">

              {/* ── LINE 1: Title (left) · Badges (center-left) · Socials (right) ── */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Title — takes all remaining space, marquees if long */}
                <div className="flex-1 min-w-0">
                  <MarqueeText text={track.title} className="font-semibold text-sm" />
                </div>

                {/* Badges — center, shrink-0 so they never wrap */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={track.published ? "default" : "secondary"}
                    className="text-[10px] py-0 px-1.5"
                  >
                    {track.published ? "Live" : "Draft"}
                  </Badge>
                  {track.audio_url && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                      AUDIO
                    </span>
                  )}
                </div>

                {/* Socials — right, bigger icons */}
                <div className="flex items-center gap-2 shrink-0">
                  {track.soundcloud_url && (
                    <a href={track.soundcloud_url} target="_blank" rel="noreferrer" title="SoundCloud"
                      onClick={(e) => e.stopPropagation()}>
                      <FaSoundcloud size={17} className="text-orange-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.youtube_url && (
                    <a href={track.youtube_url} target="_blank" rel="noreferrer" title="YouTube"
                      onClick={(e) => e.stopPropagation()}>
                      <FaYoutube size={17} className="text-red-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.spotify_url && (
                    <a href={track.spotify_url} target="_blank" rel="noreferrer" title="Spotify"
                      onClick={(e) => e.stopPropagation()}>
                      <FaSpotify size={17} className="text-green-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                </div>
              </div>

              {/* ── LINE 2: Artist (left) · Year + Type (center) · Toggle (right) ── */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Artist — flex-1, marquees if long */}
                <div className="flex-1 min-w-0">
                  {track.artist
                    ? <MarqueeText text={track.artist} className="text-[11px] text-muted-foreground" />
                    : <span className="text-[11px] text-muted-foreground/30">—</span>
                  }
                </div>

                {/* Year + Type — centered, fixed width so they align across cards */}
                <div className="flex items-center gap-1.5 shrink-0 justify-center min-w-[5rem]">
                  {track.year && (
                    <span className="text-[11px] font-semibold text-foreground/70 tabular-nums">
                      {track.year}
                    </span>
                  )}
                  {track.year && <span className="text-muted-foreground/30 text-[10px]">·</span>}
                  <span className="text-[11px] text-muted-foreground/70 capitalize">
                    {track.release_type}
                  </span>
                </div>

                {/* Publish toggle — right */}
                <div className="shrink-0">
                  <PublishToggle published={track.published} onChange={() => togglePublish(track)} />
                </div>
              </div>

              {/* ── LINE 3: Tags (left) · Edit + Delete (right, bottom) ── */}
              <div className="flex items-center gap-1 min-w-0">
                {/* Tags — only rendered if they exist */}
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {(track.tags ?? []).slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Edit + Delete — small, muted, right edge */}
                <div className="flex items-center shrink-0 ml-auto">
                  <Link to={`/admin/music/edit/${track.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 touch-manipulation text-muted-foreground/50 hover:text-foreground"
                    >
                      <PenLine size={11} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 touch-manipulation text-muted-foreground/30 hover:text-destructive"
                    onClick={() => handleDelete(track.id, track.title)}
                  >
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
