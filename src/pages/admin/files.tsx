import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, Plus, X, Check, ArrowLeft, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import FileUpload from "@/components/FileUpload";

type FormData = {
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  category: string;
  published: boolean;
};

const emptyForm: FormData = {
  name: "", description: "", file_url: "",
  file_type: "", file_size: "", category: "", published: false,
};

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFiles(data);
    setLoading(false);
  };

  const openEdit = (f: FileItem) => {
    setEditingId(f.id);
    setForm({
      name: f.name, description: f.description || "",
      file_url: f.file_url || "", file_type: f.file_type || "",
      file_size: f.file_size || "", category: f.category || "",
      published: f.published,
    });
  };

  const handleSave = async () => {
    if (!form || !form.name.trim() || !form.file_url.trim()) {
      toast.error("Name and file are required."); return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      file_url: form.file_url,
      file_type: form.file_type || null,
      file_size: form.file_size || null,
      category: form.category || null,
      published: form.published,
    };

    if (editingId) {
      const { error } = await supabase.from("files").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to save");
      else { toast.success("File updated."); setForm(null); setEditingId(null); fetchFiles(); }
    } else {
      const { error } = await supabase.from("files").insert([payload]);
      if (error) toast.error("Failed to add file");
      else { toast.success("File added."); setForm(null); fetchFiles(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); fetchFiles(); }
  };

  const togglePublish = async (f: FileItem) => {
    await supabase.from("files").update({ published: !f.published }).eq("id", f.id);
    fetchFiles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        </div>
        {!form && (
          <Button size="sm" className="gap-1.5"
            onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }}>
            <Plus size={14} /> Add file
          </Button>
        )}
      </div>

      {form && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">{editingId ? "Edit file" : "Add file"}</h2>

          {/* File upload - only show on create */}
          {!editingId && (
            <div className="space-y-1.5">
              <Label>File</Label>
              <FileUpload
                onUpload={(url, fileName, fileType, fileSize) => {
                  setForm((f) => f ? {
                    ...f,
                    file_url: url,
                    name: f.name || fileName,
                    file_type: fileType,
                    file_size: fileSize,
                  } : f);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Filename or display name" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Samples, Presets" />
            </div>
            {editingId && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>File URL</Label>
                <Input value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  placeholder="https://..." />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Input value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this file?" />
            </div>
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
            <Button size="sm" variant="ghost"
              onClick={() => { setForm(null); setEditingId(null); }}
              className="gap-1.5">
              <X size={13} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={f.published ? "default" : "secondary"} className="text-xs py-0 px-1.5">
                    {f.published ? "Live" : "Draft"}
                  </Badge>
                  {f.category && <span className="text-xs text-muted-foreground">{f.category}</span>}
                  {f.file_size && <span className="text-xs text-muted-foreground">{f.file_size}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-8 px-2"
                  onClick={() => togglePublish(f)}>
                  {f.published ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => openEdit(f)}>
                  <PenLine size={13} />
                </Button>
                <Button variant="ghost" size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(f.id, f.name)}>
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