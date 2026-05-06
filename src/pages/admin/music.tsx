import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus, Eye, EyeOff } from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("music").select("*").order("created_at", { ascending: false });
    if (!error && data) setTracks(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTracks(); }, [fetchTracks]);

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

  const getMenuItems = (track: Music): MenuItem[] => [
    { id: 1, label: "Edit", icon: PenLine },
    { id: 2, label: track.published ? "Unpublish" : "Publish", icon: track.published ? EyeOff : Eye },
    { id: 3, label: "Delete", icon: Trash2, variant: "destructive" },
  ];

  const handleMenuSelect = (item: MenuItem, track: Music) => {
    if (item.label === "Edit") navigate(`/admin/music/edit/${track.id}`);
    else if (item.label === "Publish" || item.label === "Unpublish") void togglePublish(track);
    else if (item.label === "Delete") void handleDelete(track.id, track.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        <Link to="/admin/music/new">
          <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
            <Plus size={14} /> Add track
          </MagneticButton>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tracks yet.</p>
          <Link to="/admin/music/new">
            <MagneticButton size="sm" className="mt-4" strength={0.3} radius={100}>
              Add your first track
            </MagneticButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <RadialMenu
              key={track.id}
              menuItems={getMenuItems(track)}
              onSelect={(item) => handleMenuSelect(item, track)}
            >
              <div className="rounded-xl border bg-card px-3 py-2.5 min-h-[4.5rem] flex flex-col justify-between gap-1 cursor-context-menu">
                {/* LINE 1: title · badges · socials */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <MarqueeText text={track.title} className="font-semibold text-sm" />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={track.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5">
                      {track.published ? "Live" : "Draft"}
                    </Badge>
                    {track.audio_url && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">AUDIO</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {track.soundcloud_url && (
                      <a href={track.soundcloud_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <FaSoundcloud size={17} className="text-orange-500 hover:opacity-70 transition-opacity" />
                      </a>
                    )}
                    {track.youtube_url && (
                      <a href={track.youtube_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <FaYoutube size={17} className="text-red-500 hover:opacity-70 transition-opacity" />
                      </a>
                    )}
                    {track.spotify_url && (
                      <a href={track.spotify_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <FaSpotify size={17} className="text-green-500 hover:opacity-70 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>

                {/* LINE 2: artist · year/type · publish toggle */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    {track.artist
                      ? <MarqueeText text={track.artist} className="text-[11px] text-muted-foreground" />
                      : <span className="text-[11px] text-muted-foreground/30">—</span>
                    }
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 justify-center min-w-[5rem]">
                    {track.year && <span className="text-[11px] font-semibold text-foreground/70 tabular-nums">{track.year}</span>}
                    {track.year && <span className="text-muted-foreground/30 text-[10px]">·</span>}
                    <span className="text-[11px] text-muted-foreground/70 capitalize">{track.release_type}</span>
                  </div>
                  <div className="shrink-0">
                    <PublishToggle published={track.published} onChange={() => togglePublish(track)} />
                  </div>
                </div>

                {/* LINE 3: tags */}
                {(track.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(track.tags ?? []).slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </RadialMenu>
          ))}
        </div>
      )}
    </div>
  );
}
