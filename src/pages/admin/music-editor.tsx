import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { ArrowLeft, Check, Loader2, Music2, X } from "lucide-react";
import { FaSpotify, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Music } from "@/lib/supabase";
import ImageUpload from "@/components/ImageUpload.tsx";
import { useBackNav } from "@/hooks/use-back-nav";

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

export default function MusicEditorPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin/music');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    const fetchTrack = async () => {
      const { data, error } = await supabase
        .from("music")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Track not found");
        goBack();
        return;
      }

      const track = data as Music;
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
      setLoading(false);
    };
    fetchTrack();
  }, [id, isEditing, navigate]);

  const handleYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    setForm((f) => ({ ...f, year: cleaned }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }

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

    if (isEditing) {
      const { error } = await supabase.from("music").update(payload).eq("id", id);
      if (error) toast.error("Failed to save track");
      else { toast.success("Track saved."); goBack(); }
    } else {
      const { error } = await supabase.from("music").insert([payload]);
      if (error) toast.error("Failed to add track");
      else { toast.success("Track added."); goBack(); }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => goBack()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight">
        {isEditing ? "Edit Track" : "New Track"}
      </h1>

      <div className="space-y-4">
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Track title" />
          </div>
          <div className="space-y-1.5">
            <Label>Artist</Label>
            <Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="Artist name" />
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
            <Input value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })} placeholder="Album or EP name" />
          </div>
          <div className="space-y-1.5">
            <Label>Genre</Label>
            <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. Electronic" />
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input value={form.year} onChange={(e) => handleYearChange(e.target.value)} placeholder={CURRENT_YEAR.toString()} maxLength={4} inputMode="numeric" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="lo-fi, chill, beats" />
          </div>
        </div>

        {/* Cover image */}
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <ImageUpload value={form.cover_image} onChange={(url) => setForm({ ...form, cover_image: url })} />
        </div>

        {/* Audio URL */}
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 space-y-1.5">
          <Label className="flex items-center gap-2">
            <Music2 size={13} className="text-primary" />
            Audio File URL
            <span className="text-xs text-muted-foreground font-normal">(Supabase Storage public URL)</span>
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

        {/* Platform links */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Links</p>
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><FaSpotify size={13} className="text-green-500" /> Spotify URL</Label>
              <Input value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })} placeholder="https://open.spotify.com/track/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><FaSoundcloud size={13} className="text-orange-500" /> SoundCloud URL</Label>
              <Input value={form.soundcloud_url} onChange={(e) => setForm({ ...form, soundcloud_url: e.target.value })} placeholder="https://soundcloud.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><FaYoutube size={13} className="text-red-500" /> YouTube URL</Label>
              <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="About this track..." rows={3} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input id="published" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4" />
          <Label htmlFor="published" className="cursor-pointer">{form.published ? "Published" : "Draft"}</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEditing ? "Save changes" : "Add track"}
        </Button>
        <Button variant="ghost" onClick={() => goBack()}>Cancel</Button>
      </div>
    </div>
  );
}
