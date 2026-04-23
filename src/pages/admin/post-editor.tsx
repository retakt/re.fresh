import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import RichTextEditor from "@/components/rich-text-editor.tsx";
import ImageUpload from "@/components/ImageUpload.tsx";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { FloatingSave } from "@/components/ui/floating-save";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function PostEditorPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin/posts');
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagLibraryValue, setTagLibraryValue] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  // Load all posts to build tag library
  useEffect(() => {
    supabase
      .from("posts")
      .select("tags")
      .then(({ data }) => {
        if (data) setAllPosts(data as Post[]);
      });
  }, []);

  const tagLibrary = useMemo(() => {
    const set = new Set<string>();
    allPosts.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allPosts]);

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
      setTags(data.tags || []);
      setPublished(data.published);
      setLoading(false);
    };

    fetchPost();
  }, [id, isEditing, navigate]);

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
      tags,
      published,
      updated_at: new Date().toISOString(),
    };

    if (isEditing) {
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", id);

      if (error) {
        toast.error("Failed to save post");
      } else {
        toast.success("Post saved!");
        goBack();
      }
    } else {
      const { error } = await supabase
        .from("posts")
        .insert([payload]);

      if (error) {
        if (error.message.includes("unique")) {
          toast.error("A post with this slug already exists.");
        } else {
          toast.error("Failed to create post");
        }
      } else {
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
      <button
        onClick={() => goBack()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back
      </button>

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
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-slug"
            />
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
          <div className="flex items-center justify-between gap-2">
            <Label>Tags</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
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

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
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
              placeholder="Type a tag and press Enter or Add+"
            />
            <select
              value={tagLibraryValue}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                addTag(value);
                setTagLibraryValue("");
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose existing tag</option>
              {tagLibrary.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

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
          <ImageUpload value={coverImage} onChange={setCoverImage} />
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
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? "Save changes" : "Create post"}
        </Button>
        <Button variant="ghost" onClick={() => goBack()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
