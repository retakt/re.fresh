import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, Plus, X, Check, ArrowLeft, PenLine, Music2 } from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";

type FormData = {
  title: string;
  artist: string;
  album: string;
  genre: string;
  tags: string;
  year: string;
  release_type: string;
  spotify_url: string;
  soundcloud_url: string;
  youtube_url: string;
  audio_url: string;
  cover_image: string;
  description: string;
  published: boolean;
};

const emptyForm: FormData = {
  title: "", artist: "", album: "", genre: "", tags: "",
  year: "", release_type: "single", spotify_url: "",
  soundcloud_url: "", youtube_url: "", audio_url: "",
  cover_image: "", description: "", published: false,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("music")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTracks(data);
    setLoading(false);
  };

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); };

  const openEdit = (track: Music) => {
    setEditingId(track.id);
    setForm({
      title: track.title,
      artist: track.artist || "",
      album: track.album || "",
      genre: track.genre || "",
      tags: track.tags ? track.tags.join(", ") : "",
      year: track.year?.toString() || "",
      release_type: track.release_type || "single",
      spotify_url: track.spotify_url || "",
      soundcloud_url: track.soundcloud_url || "",
      youtube_url: track.youtube_url || "",
      audio_url: track.audio_url || "",
      cover_image: track.cover_image || "",
      description: track.description || "",
      published: track.published,
    });
  };

  const handleYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    setForm((f) => f ? { ...f, year: cleaned } : f);
  };

  const handleSave = async () => {
    if (!form || !form.title.trim()) { toast.error("Title is required."); return; }

    const yearNum = form.year ? parseInt(form.year) : null;
    if (yearNum && (yearNum < 1900 || yearNum > CURRENT_YEAR + 2)) {
      toast.error(`Year must be between 1900 and ${CURRENT_YEAR + 2}`);
      return;
    }

    setSaving(true);

    const tagsArray = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: form.title,
      artist: form.artist || null,
      album: form.album || null,
      genre: form.genre || null,
      tags: tagsArray,
      year: yearNum,
      release_type: form.release_type,
      spotify_url: form.spotify_url || null,
      soundcloud_url: form.soundcloud_url || null,
      youtube_url: form.youtube_url || null,
      audio_url: form.audio_url || null,
      cover_image: form.cover_image || null,
      description: form.description || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("music").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to save track");
      else {
        toast.success("Track updated.");
        setForm(null); setEditingId(null); fetchTracks();
      }
    } else {
      const { error } = await supabase.from("music").insert([payload]);
      if (error) toast.error("Failed to add track");
      else { toast.success("Track added."); setForm(null); fetchTracks(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("music").delete().eq("id", id);
    if (error) toast.error("Failed to delete track");
    else {
      toast.success("Track deleted.");
      if (editingId === id) { setForm(null); setEditingId(null); }
      fetchTracks();
    }
  };

  const togglePublish = async (track: Music) => {
    await supabase.from("music").update({ published: !track.published }).eq("id", track.id);
    fetchTracks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Music</h1>
        </div>
        {!form && (
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus size={14} /> Add track
          </Button>
        )}
      </div>

      {form && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">
            {editingId ? "Edit track" : "New track"}
          </h2>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Track title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Artist</Label>
              <Input
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                placeholder="Artist name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Release Type</Label>
              <select
                value={form.release_type}
                onChange={(e) => setForm({ ...form, release_type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="single">Single</option>
                <option value="album">Album</option>
                <option value="ep">EP</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Album / EP Name</Label>
              <Input
                value={form.album}
                onChange={(e) => setForm({ ...form, album: e.target.value })}
                placeholder="Album or EP name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Input
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                placeholder="e.g. Electronic"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                value={form.year}
                onChange={(e) => handleYearChange(e.target.value)}
                placeholder={CURRENT_YEAR.toString()}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="lo-fi, chill, beats (comma separated)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Audio file - highlighted section */}
          <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 space-y-1.5">
            <Label className="flex items-center gap-2">
              <Music2 size={13} className="text-primary" />
              Audio File URL
              <span className="text-xs text-muted-foreground font-normal">
                (Supabase Storage public URL)
              </span>
            </Label>
            <Input
              value={form.audio_url}
              onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
              placeholder="https://xxxx.supabase.co/storage/v1/object/public/audio/song.mp3"
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Upload your MP3 to Supabase Storage → audio bucket → copy public URL → paste here
            </p>
          </div>

          {/* Platform links with icons */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Links
            </p>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <FaSpotify size={13} className="text-green-500" /> Spotify URL
                </Label>
                <Input
                  value={form.spotify_url}
                  onChange={(e) => setForm({ ...form, spotify_url: e.target.value })}
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <FaSoundcloud size={13} className="text-orange-500" /> SoundCloud URL
                </Label>
                <Input
                  value={form.soundcloud_url}
                  onChange={(e) => setForm({ ...form, soundcloud_url: e.target.value })}
                  placeholder="https://soundcloud.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <FaYoutube size={13} className="text-red-500" /> YouTube URL
                </Label>
                <Input
                  value={form.youtube_url}
                  onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="About this track..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="published"
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="published" className="cursor-pointer">
              Published (visible to public)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Check size={13} /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setForm(null); setEditingId(null); }}
              className="gap-1.5"
            >
              <X size={13} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Track list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tracks yet. Click "Add track" to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{track.title}</p>
                  {/* Audio indicator */}
                  {track.audio_url && (
                    <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                      AUDIO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant={track.published ? "default" : "secondary"}
                    className="text-xs py-0 px-1.5"
                  >
                    {track.published ? "Live" : "Draft"}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {track.release_type}
                  </span>
                  {track.artist && (
                    <span className="text-xs text-muted-foreground">{track.artist}</span>
                  )}
                  {track.year && (
                    <span className="text-xs text-muted-foreground">{track.year}</span>
                  )}
                  {/* Platform icons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {track.spotify_url && <FaSpotify size={11} className="text-green-500" />}
                    {track.soundcloud_url && <FaSoundcloud size={11} className="text-orange-500" />}
                    {track.youtube_url && <FaYoutube size={11} className="text-red-500" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 items-center shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={() => togglePublish(track)}
                >
                  {track.published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(track)}
                >
                  <PenLine size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(track.id, track.title)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}