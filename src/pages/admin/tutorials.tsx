import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, Plus, X, Check, ArrowLeft, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type FormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  difficulty: string;
  published: boolean;
};

const emptyForm: FormData = {
  title: "", slug: "", excerpt: "",
  content: "", category: "", difficulty: "",
  published: false,
};

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTutorials(); }, []);

  const fetchTutorials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTutorials(data);
    setLoading(false);
  };

  const openEdit = (t: Tutorial) => {
    setEditingId(t.id);
    setForm({
      title: t.title, slug: t.slug,
      excerpt: t.excerpt || "", content: t.content || "",
      category: t.category || "", difficulty: t.difficulty || "",
      published: t.published,
    });
  };

  const handleSave = async () => {
    if (!form || !form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      content: form.content || null,
      category: form.category || null,
      difficulty: (form.difficulty as Tutorial["difficulty"]) || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("tutorials").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to save");
      else { toast.success("Tutorial updated."); setForm(null); setEditingId(null); fetchTutorials(); }
    } else {
      const { error } = await supabase.from("tutorials").insert([payload]);
      if (error) toast.error("Failed to create");
      else { toast.success("Tutorial added."); setForm(null); fetchTutorials(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("tutorials").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); fetchTutorials(); }
  };

  const togglePublish = async (t: Tutorial) => {
    await supabase.from("tutorials").update({ published: !t.published }).eq("id", t.id);
    fetchTutorials();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Tutorials</h1>
        </div>
        {!form && (
          <Button size="sm" className="gap-1.5" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }}>
            <Plus size={14} /> Add tutorial
          </Button>
        )}
      </div>

      {form && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">{editingId ? "Edit tutorial" : "New tutorial"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                placeholder="Tutorial title" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="tutorial-slug" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Music Production" />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Input value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Short description" />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write tutorial content..."
              rows={6} />
          </div>
          <div className="flex items-center gap-2">
            <input id="pub" type="checkbox" checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4" />
            <Label htmlFor="pub" className="cursor-pointer">Published</Label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Check size={13} /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setForm(null); setEditingId(null); }} className="gap-1.5">
              <X size={13} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : tutorials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tutorials yet.</p>
      ) : (
        <div className="space-y-2">
          {tutorials.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={t.published ? "default" : "secondary"} className="text-xs py-0 px-1.5">
                    {t.published ? "Live" : "Draft"}
                  </Badge>
                  {t.difficulty && (
                    <span className="text-xs text-muted-foreground capitalize">{t.difficulty}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={() => togglePublish(t)}>
                  {t.published ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                  <PenLine size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(t.id, t.title)}>
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