import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus, ArrowLeft } from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";

export default function AdminMusicPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin');
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("music")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTracks(data);
    setLoading(false);
  };

  useEffect(() => { void fetchTracks(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("music").delete().eq("id", id);
    if (error) toast.error("Failed to delete track");
    else { toast.success("Track deleted."); void fetchTracks(); }
  };

  const togglePublish = async (track: Music) => {
    await supabase.from("music").update({ published: !track.published }).eq("id", track.id);
    void fetchTracks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        </div>
        <Link to="/admin/music/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Add track
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tracks yet.</p>
          <Link to="/admin/music/new">
            <Button size="sm" className="mt-4">Add your first track</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem]">
              <div className="flex-1 min-w-0 space-y-0.5">
                {/* Line 1: Title + Live/Draft + AUDIO — title scrolls if too long */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MarqueeText text={track.title} className="font-semibold text-sm max-w-[140px] shrink-0 flex-1 min-w-0" />
                  <Badge variant={track.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {track.published ? "Live" : "Draft"}
                  </Badge>
                  {track.audio_url && (
                    <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">AUDIO</span>
                  )}
                </div>
                {/* Line 2: Artist · Release type · Year — all on one line, no wrap */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground overflow-hidden">
                  {track.artist && (
                    <span className="truncate max-w-[90px] shrink-0">{track.artist}</span>
                  )}
                  {track.artist && <span className="text-muted-foreground/40 shrink-0">·</span>}
                  <span className="capitalize shrink-0">{track.release_type}</span>
                  {track.year && (
                    <><span className="text-muted-foreground/40 shrink-0">·</span><span className="shrink-0">{track.year}</span></>
                  )}
                </div>
                {/* Line 3: Tags */}
                {(track.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(track.tags ?? []).slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center shrink-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  {track.spotify_url && (
                    <a href={track.spotify_url} target="_blank" rel="noreferrer" title="Spotify">
                      <FaSpotify size={14} className="text-green-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.soundcloud_url && (
                    <a href={track.soundcloud_url} target="_blank" rel="noreferrer" title="SoundCloud">
                      <FaSoundcloud size={14} className="text-orange-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                  {track.youtube_url && (
                    <a href={track.youtube_url} target="_blank" rel="noreferrer" title="YouTube">
                      <FaYoutube size={14} className="text-red-500 hover:opacity-70 transition-opacity" />
                    </a>
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  <PublishToggle published={track.published} onChange={() => togglePublish(track)} />
                  <Link to={`/admin/music/edit/${track.id}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                      <PenLine size={14} />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive touch-manipulation"
                    onClick={() => handleDelete(track.id, track.title)}>
                    <Trash2 size={14} />
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
