import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import RichTextEditor from "@/components/rich-text-editor.tsx";
import ImageUpload from "@/components/ImageUpload.tsx";
import { Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import { searchTags, getContentTags, updateContentTags } from "@/lib/tags";
import { useBackNav } from "@/hooks/use-back-nav";
import { FloatingSave } from "@/components/ui/floating-save";
import ButtonCopy from "@/components/ui/smoothui/button-copy";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";
import Combobox from "@/components/ui/smoothui/combobox";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function PostEditorPage() {
  const goBack = useBackNav('/admin/posts');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImagePosition, setCoverImagePosition] = useState("50% 50%");
  const [coverImageOpacity, setCoverImageOpacity] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Load existing post when editing
  useEffect(() => {
    if (!isEditing) return;
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Post not found");
        goBack();
        return;
      }

      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || "");
      setContent(data.content || "");
      setCoverImage(data.cover_image || "");
      setCoverImagePosition(data.cover_image_position || "50% 50%");
      setCoverImageOpacity(data.cover_image_opacity ?? 1);
      setPublished(data.published);
      // Load tags from junction table
      const existingTags = await getContentTags("post", data.id);
      setTags(existingTags);
      setLoading(false);
    };

    fetchPost();
  }, [id, isEditing, goBack]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
  };

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) return;
    setTags((prev) => [...prev, next]);
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((t) => t.toLowerCase() !== value.toLowerCase()));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content: content || null,
      cover_image: coverImage || null,
      cover_image_position: coverImagePosition || null,
      cover_image_opacity: coverImageOpacity,
      published,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) {
        console.error("Supabase update error:", error);
        toast.error(`Failed to save post: ${error.message || 'Unknown error'}`);
      } else {
        await updateContentTags("post", id!, tags);
        toast.success("Post saved!");
        goBack();
      }
    } else {
      const { data: newPost, error } = await supabase.from("posts").insert([payload]).select().single();
      if (error) {
        if (error.message.includes("unique")) {
          toast.error("A post with this slug already exists.");
        } else {
          toast.error("Failed to create post");
        }
      } else {
        await updateContentTags("post", newPost.id, tags);
        toast.success("Post created!");
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
          {isEditing ? "Edit Post" : "New Post"}
        </h1>
        <FloatingSave onClick={handleSave} saving={saving} label={isEditing ? "Save" : "Create"} />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
                className="flex-1"
              />
              {slug && (
                <ButtonCopy
                  onCopy={async () => {
                    await navigator.clipboard.writeText(slug);
                    toast.success("Slug copied");
                  }}
                  className="!min-h-[40px] !min-w-[40px] !p-2"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description shown in the list"
          />
        </div>

        {/* Tags */}
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
              // Save new tag to DB immediately
              const { createTag } = await import("@/lib/tags");
              await createTag(value);
            }}
            onSearch={async (query) => {
              const results = await searchTags(query);
              return results
                .filter((t) => !tags.some((s) => s.toLowerCase() === t.name.toLowerCase()))
                .map((t) => ({ value: t.name, label: t.name }));
            }}
            placeholder="#tags"
            searchPlaceholder="Search or type new tag..."
            emptyText="No tags found."
            className="w-full"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1.5 pr-1.5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-background"
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
          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            position={coverImagePosition}
            onPositionChange={setCoverImagePosition}
            opacity={coverImageOpacity}
            onOpacityChange={setCoverImageOpacity}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content here..."
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublished}
          />
          <Label htmlFor="published" className="cursor-pointer">
            {published ? "Published" : "Draft"}
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <MagneticButton onClick={handleSave} disabled={saving} className="gap-2" strength={0.3} radius={150}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? "Save changes" : "Create post"}
        </MagneticButton>
        <Button variant="ghost" onClick={() => goBack()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
