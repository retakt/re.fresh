import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import RichTextEditor from "@/components/rich-text-editor.tsx";
import ImageUpload from "@/components/ImageUpload.tsx";
import { supabase } from "@/lib/supabase";
import { searchTags, getContentTags, updateContentTags, searchCategories, getContentCategories, updateContentCategories } from "@/lib/tags";
import { useBackNav } from "@/hooks/use-back-nav";
import { useAuth } from "@/hooks/useAuth";
import { FloatingSave } from "@/components/ui/floating-save";
import ButtonCopy from "@/components/ui/smoothui/button-copy";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";
import Combobox from "@/components/ui/smoothui/combobox";

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
  const goBack = useBackNav('/admin/tutorials');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { isAdmin } = useAuth();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [customDifficulty, setCustomDifficulty] = useState(false);

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
        category: [],
        difficulty: data.difficulty || "",
        cover_image: data.cover_image || "",
        tags: [],
        published: data.published,
      });
      // Load tags and categories from junction tables
      const [existingTags, existingCategories] = await Promise.all([
        getContentTags("tutorial", data.id),
        getContentCategories("tutorial", data.id),
      ]);
      setForm((f) => ({ ...f, tags: existingTags, category: existingCategories }));
      setLoading(false);
    };

    fetchTutorial();
  }, [id, isEditing, goBack]);

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
      difficulty: form.difficulty || null,
      cover_image: form.cover_image || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error } = await supabase.from("tutorials").update(payload).eq("id", id);
      if (error) {
        console.error("Tutorial save error:", error);
        if (error.code === "23514") {
          toast.error("Run this SQL in Supabase: ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_difficulty_check;");
        } else {
          toast.error(`Failed to save: ${error.message}`);
        }
      } else {
        await Promise.all([
          updateContentTags("tutorial", id!, form.tags),
          updateContentCategories("tutorial", id!, form.category),
        ]);
        toast.success("Tutorial saved.");
        goBack();
      }
    } else {
      const { data: newTutorial, error } = await supabase.from("tutorials").insert([payload]).select().single();
      if (error) {
        console.error("Tutorial save error:", error);
        if (error.code === "23514") {
          toast.error("Run this SQL in Supabase: ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_difficulty_check;");
        } else if (error.message.includes("unique")) {
          toast.error("A tutorial with this slug already exists.");
        } else {
          toast.error(`Failed to create: ${error.message}`);
        }
      } else {
        await Promise.all([
          updateContentTags("tutorial", newTutorial.id, form.tags),
          updateContentCategories("tutorial", newTutorial.id, form.category),
        ]);
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Tutorial" : "New Tutorial"}
        </h1>
        <FloatingSave onClick={handleSave} saving={saving} label={isEditing ? "Save" : "Create"} />
      </div>

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
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="tutorial-slug"
                className="flex-1"
              />
              {form.slug && (
                <ButtonCopy
                  onCopy={async () => {
                    await navigator.clipboard.writeText(form.slug);
                    toast.success("Slug copied");
                  }}
                  className="!min-h-[40px] !min-w-[40px] !p-2"
                />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Combobox
              value=""
              onValueChange={(value) => {
                if (!value) return;
                addCategory(value);
              }}
              onCreateOption={async (value) => {
                addCategory(value);
                const { createCategory } = await import("@/lib/tags");
                await createCategory(value);
              }}
              onSearch={async (query) => {
                const results = await searchCategories(query);
                return results
                  .filter((c) => !form.category.some((s) => s.toLowerCase() === c.name.toLowerCase()))
                  .map((c) => ({ value: c.name, label: c.name }));
              }}
              placeholder="#category"
              searchPlaceholder="Search or type new category..."
              emptyText="No categories found."
              className="w-full"
            />
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
              <Combobox
                value={form.difficulty}
                onValueChange={(value) => setForm((f) => ({ ...f, difficulty: value }))}
                options={DIFFICULTY_PRESETS.map((p) => ({ value: p, label: p }))}
                placeholder="Select difficulty"
                searchPlaceholder="Search difficulty..."
                emptyText="No difficulty found"
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Tags — shown right after difficulty */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Combobox
            value=""
            onValueChange={(value) => {
              if (!value) return;
              addTag(value);
            }}
            onCreateOption={async (value) => {
              addTag(value);
              const { createTag } = await import("@/lib/tags");
              await createTag(value);
            }}
            onSearch={async (query) => {
              const results = await searchTags(query);
              return results
                .filter((t) => !form.tags.some((s) => s.toLowerCase() === t.name.toLowerCase()))
                .map((t) => ({ value: t.name, label: t.name }));
            }}
            placeholder="#tags"
            searchPlaceholder="Search or type new tag..."
            emptyText="No tags found."
            className="w-full"
          />
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

        <div className="space-y-1.5">
          <Label>Excerpt</Label>
          <Input
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            placeholder="Short description"
          />
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
        <MagneticButton onClick={handleSave} disabled={saving} className="gap-2" strength={0.3} radius={150}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEditing ? "Save changes" : "Create tutorial"}
        </MagneticButton>
        <Button variant="ghost" onClick={() => goBack()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
