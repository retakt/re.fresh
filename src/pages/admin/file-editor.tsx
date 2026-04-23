import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import FileUpload from "@/components/FileUpload";
import { useBackNav } from "@/hooks/use-back-nav";
import { FloatingSave } from "@/components/ui/floating-save";

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

export default function FileEditorPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin/files');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    const fetchFile = async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("File not found");
        goBack();
        return;
      }

      const f = data as FileItem;
      setForm({
        name: f.name,
        description: f.description || "",
        file_url: f.file_url || "",
        file_type: f.file_type || "",
        file_size: f.file_size || "",
        category: f.category || "",
        published: f.published,
      });
      setLoading(false);
    };
    fetchFile();
  }, [id, isEditing, navigate]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.file_url.trim()) {
      toast.error("Name and file are required.");
      return;
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

    if (isEditing) {
      const { error } = await supabase.from("files").update(payload).eq("id", id);
      if (error) toast.error("Failed to save");
      else { toast.success("File updated."); goBack(); }
    } else {
      const { error } = await supabase.from("files").insert([payload]);
      if (error) toast.error("Failed to add file");
      else { toast.success("File added."); goBack(); }
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

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit File" : "Add File"}
        </h1>
        <FloatingSave onClick={handleSave} saving={saving} label={isEditing ? "Save" : "Add"} />
      </div>

      <div className="space-y-4">
        {/* File upload — only on create */}
        {!isEditing && (
          <div className="space-y-1.5">
            <Label>File</Label>
            <FileUpload
              onUpload={(url, fileName, fileType, fileSize) => {
                setForm((f) => ({
                  ...f,
                  file_url: url,
                  name: f.name || fileName,
                  file_type: fileType,
                  file_size: fileSize,
                }));
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Filename or display name" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Samples, Presets" />
          </div>
          {isEditing && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>File URL</Label>
              <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this file?" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input id="pub" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4" />
          <Label htmlFor="pub" className="cursor-pointer">{form.published ? "Published" : "Draft"}</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEditing ? "Save changes" : "Add file"}
        </Button>
        <Button variant="ghost" onClick={() => goBack()}>Cancel</Button>
      </div>
    </div>
  );
}
