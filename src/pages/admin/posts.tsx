import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, PenLine, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load posts");
    else setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete post");
    else { toast.success("Post deleted."); void fetchPosts(); }
  };

  const togglePublish = async (post: Post) => {
    const { error } = await supabase.from("posts").update({ published: !post.published }).eq("id", post.id);
    if (error) toast.error("Failed to update post");
    else { toast.success(post.published ? "Post unpublished" : "Post published"); void fetchPosts(); }
  };

  const getMenuItems = (post: Post): MenuItem[] => [
    { id: 1, label: "Edit",    icon: PenLine },
    { id: 2, label: post.published ? "Unpublish" : "Publish", icon: post.published ? EyeOff : Eye },
    { id: 3, label: "Delete",  icon: Trash2 },
  ];

  const handleMenuSelect = (item: MenuItem, post: Post) => {
    if (item.label === "Edit") navigate(`/admin/posts/edit/${post.id}`);
    else if (item.label === "Publish" || item.label === "Unpublish") void togglePublish(post);
    else if (item.label === "Delete") void handleDelete(post.id, post.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        </div>
        <Link to="/admin/posts/new">
          <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
            <Plus size={14} /> New post
          </MagneticButton>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No posts yet.</p>
          <Link to="/admin/posts/new">
            <MagneticButton size="sm" className="mt-4" strength={0.3} radius={100}>
              Create your first post
            </MagneticButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <RadialMenu
              key={post.id}
              menuItems={getMenuItems(post)}
              onSelect={(item) => handleMenuSelect(item, post)}
              size={220}
            >
              <div className="flex items-stretch gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem] cursor-context-menu">
                {/* LEFT */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MarqueeText text={post.title} className="font-semibold text-sm flex-1 min-w-0" />
                    <Badge variant={post.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                      {post.published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                  {(post.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(post.tags ?? []).map((tag) => (
                        <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* RIGHT: publish toggle stays for quick access */}
                <div className="flex flex-col justify-center shrink-0">
                  <PublishToggle published={post.published} onChange={() => togglePublish(post)} />
                </div>
              </div>
            </RadialMenu>
          ))}
        </div>
      )}
    </div>
  );
}
