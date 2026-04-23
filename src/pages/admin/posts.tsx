import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, PenLine, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load posts");
    else setPosts(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete post");
    else { toast.success("Post deleted."); fetchPosts(); }
  };

  const togglePublish = async (post: Post) => {
    const { error } = await supabase.from("posts").update({ published: !post.published }).eq("id", post.id);
    if (error) toast.error("Failed to update post");
    else { toast.success(post.published ? "Post unpublished" : "Post published"); fetchPosts(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        </div>
        <Link to="/admin/posts/new">
          <Button size="sm" className="gap-1.5"><Plus size={14} /> New post</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No posts yet.</p>
          <Link to="/admin/posts/new"><Button size="sm" className="mt-4">Create your first post</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="flex items-stretch gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem]">

              {/* LEFT */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                {/* Line 1: Title + badge */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MarqueeText text={post.title} className="font-semibold text-sm flex-1 min-w-0" />
                  <Badge variant={post.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {post.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                {/* Line 2: Date */}
                <div className="text-[11px] text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
                {/* Line 3: Tags */}
                {(post.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(post.tags ?? []).map((tag) => (
                      <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: vertically centered */}
              <div className="flex flex-col justify-center shrink-0">
                <div className="flex items-center gap-0.5">
                  <PublishToggle published={post.published} onChange={() => togglePublish(post)} />
                  <Link to={`/admin/posts/edit/${post.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation"><PenLine size={13} /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive touch-manipulation"
                    onClick={() => handleDelete(post.id, post.title)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
