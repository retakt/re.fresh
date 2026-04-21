import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CalendarDays, ArrowLeft, PenLine } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { canManageEditorial } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) setNotFound(true);
      else setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  if (loading) {
      return (
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (notFound || !post) {
      return (
      <div className="max-w-2xl py-16 text-center space-y-3">
        <p className="text-muted-foreground">Post not found.</p>
        <Link to="/blog">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={14} /> Back to blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl">
      {/* Gradient header band */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-sky-100/80 bg-gradient-to-b from-sky-100/55 via-sky-50/35 to-transparent px-5 py-7 shadow-sm sm:px-7 sm:py-8 dark:border-sky-900/30 dark:from-sky-950/35 dark:via-sky-950/12 dark:to-transparent">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Blog
          </Link>
          {canManageEditorial && (
            <Link to={`/admin/posts/edit/${post.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <PenLine size={13} /> Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-3">
          {!post.published && (
            <Badge variant="secondary">Draft</Badge>
          )}
          {(post as any).tags && (post as any).tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/35 dark:text-sky-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-balance mb-3">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {format(new Date(post.created_at), "MMMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-1 sm:px-2">
          <div
            className="prose prose-sm max-w-2xl dark:prose-invert prose-headings:tracking-tight prose-headings:text-slate-950 prose-p:leading-7 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-sky-700 hover:prose-a:text-sky-800 prose-strong:text-slate-900 prose-blockquote:border-l-sky-200 prose-blockquote:text-slate-600 prose-img:rounded-lg dark:prose-headings:text-slate-50 dark:prose-p:text-slate-200 dark:prose-li:text-slate-200 dark:prose-a:text-sky-300 dark:hover:prose-a:text-sky-200 dark:prose-strong:text-slate-100 dark:prose-blockquote:border-l-sky-800 dark:prose-blockquote:text-slate-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}
    </article>
  );
}
