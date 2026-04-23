import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import RichTextEditor from "@/components/rich-text-editor.tsx";
import ImageUpload from "@/components/ImageUpload.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { useAuth } from "@/hooks/useAuth";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const DIFFICULTY_PRESETS = ["Beginner", "Intermediate", "Advanced"];

type FormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string[];
  difficulty: string;
  cover_image: string;
  tags: string[];
  published: boolean;
};

const emptyForm: FormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: [],
  difficulty: "",
  cover_image: "",
  tags: [],
  published: false,
};

export default function TutorialEditorPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin/tutorials');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { isAdmin } = useAuth();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState(false);
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>([]);

  // Load tag library from existing tutorials — gracefully skip if tags column missing
  useEffect(() => {
    supabase.from("tutorials").select("category, difficulty").then(({ data }) => {
      if (data) setAllTutorials(data as Tutorial[]);
    });
  }, []);

  const tagLibrary = useMemo(() => {
    const set = new Set<string>();
    allTutorials.forEach((t) => {
      (t.tags ?? []).forEach((tag) => set.add(tag));
      if (t.category) set.add(t.category);
      if (t.difficulty) set.add(t.difficulty);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allTutorials]);

  // Load existing tutorial when editing
  useEffect(() => {
    if (!isEditing) return;
    const fetchTutorial = async () => {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Tutorial not found");
        goBack();
        return;
      }

      setForm({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: data.category ? data.category.split(", ") : [],
        difficulty: data.difficulty || "",
        cover_image: data.cover_image || "",
        tags: data.tags || [],
        published: data.published,
      });
      setLoading(false);
    };

    fetchTutorial();
  }, [id, isEditing, navigate]);

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    // Use functional update to always work with latest state (avoids stale closure on iOS)
    setForm((f) => {
      if (f.tags.some((t) => t.toLowerCase() === next.toLowerCase())) return f;
      return { ...f, tags: [...f.tags, next] };
    });
  };

  const removeTag = (value: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t.toLowerCase() !== value.toLowerCase()) }));
  };

  const addCategory = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    setForm((f) => {
      if (f.category.some((c) => c.toLowerCase() === next.toLowerCase())) return f;
      return { ...f, category: [...f.category, next] };
    });
  };

  const removeCategory = (value: string) => {
    setForm((f) => ({ ...f, category: f.category.filter((c) => c.toLowerCase() !== value.toLowerCase()) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      content: form.content || null,
      category: form.category.join(", ") || null,
      difficulty: form.difficulty || null,
      cover_image: form.cover_image || null,
      tags: form.tags,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error } = await supabase.from("tutorials").update(payload).eq("id", id);
      if (error) {
        console.error("Tutorial save error:", error);
        if (error.code === "23514") {
          toast.error("Run this SQL in Supabase: ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_difficulty_check;");
        } else if (error.message.includes("tags")) {
          toast.error("Run migration v0_1_4 in Supabase SQL editor to add the tags column");
        } else {
          toast.error(`Failed to save: ${error.message}`);
        }
      } else {
        toast.success("Tutorial saved.");
        goBack();
      }
    } else {
      const { error } = await supabase.from("tutorials").insert([payload]);
      if (error) {
        console.error("Tutorial save error:", error);
        if (error.code === "23514") {
          toast.error("Run this SQL in Supabase: ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_difficulty_check;");
        } else if (error.message.includes("tags")) {
          toast.error("Run migration v0_1_4 in Supabase SQL editor to add the tags column");
        } else if (error.message.includes("unique")) {
          toast.error("A tutorial with this slug already exists.");
        } else {
          toast.error(`Failed to create: ${error.message}`);
        }
      } else {
        toast.success("Tutorial created.");
        goBack();
      }
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
        {isEditing ? "Edit Tutorial" : "New Tutorial"}
      </h1>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: isEditing ? f.slug : slugify(e.target.value) }))}
              placeholder="Tutorial title"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="tutorial-slug"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex gap-2">
              <Input
                value={categoryDraft}
                onChange={(e) => setCategoryDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const next = categoryDraft.trim();
                    if (!next) return;
                    addCategory(next);
                    setCategoryDraft("");
                  }
                }}
                placeholder="e.g. Music Production"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  const next = categoryDraft.trim();
                  if (!next) return;
                  addCategory(next);
                  setCategoryDraft("");
                }}
              >
                Add+
              </Button>
            </div>
            {form.category.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.category.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1.5 pr-1.5">
                    {cat}
                    <button type="button" onClick={() => removeCategory(cat)} className="rounded-full p-0.5 hover:bg-background">
                      <X size={11} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Difficulty</Label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setCustomDifficulty((c) => !c)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {customDifficulty ? "Use preset" : "Custom"}
                </button>
              )}
            </div>
            {customDifficulty && isAdmin ? (
              <Input
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                placeholder="e.g. Expert, Pro, Absolute Beginner"
              />
            ) : (
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select difficulty</option>
                {DIFFICULTY_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Excerpt</Label>
          <Input
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            placeholder="Short description"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          {/* Type + Enter or tap Add+ */}
          <div className="flex gap-2">
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const next = tagDraft.trim();
                  if (!next) return;
                  addTag(next);
                  setTagDraft("");
                }
              }}
              placeholder="Type a tag…"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 px-3"
              onClick={() => {
                const next = tagDraft.trim();
                if (!next) return;
                addTag(next);
                setTagDraft("");
              }}
            >
              Add+
            </Button>
          </div>

          {/* Library chips — tap to add, no native dropdown */}
          {tagLibrary.filter((tag) => !form.tags.some((t) => t.toLowerCase() === tag.toLowerCase())).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">From library — tap to add:</p>
              <div className="flex flex-wrap gap-1.5">
                {tagLibrary
                  .filter((tag) => !form.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-secondary text-muted-foreground hover:bg-primary/15 hover:text-primary active:bg-primary/20 active:text-primary transition-colors"
                      style={{ touchAction: "manipulation" }}
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Applied tags */}
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1.5 pr-1.5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-background"
                    style={{ touchAction: "manipulation" }}
                  >
                    <X size={11} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Cover image */}
        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <ImageUpload value={form.cover_image} onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))} />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <Label>Content</Label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => setForm((f) => ({ ...f, content: html }))}
            placeholder="Write your tutorial content here..."
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="pub"
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="h-4 w-4"
          />
          <Label htmlFor="pub" className="cursor-pointer">
            {form.published ? "Published" : "Draft"}
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEditing ? "Save changes" : "Create tutorial"}
        </Button>
        <Button variant="ghost" onClick={() => goBack()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
