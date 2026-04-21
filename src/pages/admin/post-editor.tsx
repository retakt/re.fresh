import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import RichTextEditor from "@/components/rich-text-editor.tsx";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function PostEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
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
        navigate("/admin/posts");
        return;
      }

      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt || "");
      setContent(data.content || "");
      setPublished(data.published);
      setLoading(false);
    };

    fetchPost();
  }, [id, isEditing, navigate]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
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
        navigate("/admin/posts");
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
        navigate("/admin/posts");
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
        onClick={() => navigate("/admin/posts")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to posts
      </button>

      <h1 className="text-2xl font-bold tracking-tight">
        {isEditing ? "Edit Post" : "New Post"}
      </h1>

      <div className="space-y-4">
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

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description shown in the list"
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
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? "Save changes" : "Create post"}
        </Button>
        <Button variant="ghost" onClick={() => navigate("/admin/posts")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}