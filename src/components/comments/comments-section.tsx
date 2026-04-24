import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowUp, ArrowDown, Reply, Copy, Trash2,
  ChevronDown, ChevronRight, Send, Paperclip,
  Image as ImageIcon, Video, X, MessageSquare, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { CommentAttachment, PostComment } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatFileSize, isImageFile, isVideoFile, uploadPublicAsset } from "@/lib/media";
import type { ContentBlock } from "@/lib/content-blocks";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserMeta = {
  username: string | null;
  role: "admin" | "editor" | "member";
};

type VoteState = Record<string, 1 | -1 | 0>;
type ScoreMap = Record<string, number>;

type CommentNode = PostComment & {
  attachments: CommentAttachment[];
  replies: CommentNode[];
  userMeta?: UserMeta;
};

interface CommentsSectionProps {
  postId: string;
  activeAnchor: ContentBlock | null;
  onClearAnchor: () => void;
}

// ─── Username colour ──────────────────────────────────────────────────────────
const USERNAME_COLORS = [
  "text-sky-500 dark:text-sky-400",
  "text-violet-500 dark:text-violet-400",
  "text-emerald-500 dark:text-emerald-400",
  "text-amber-500 dark:text-amber-400",
  "text-rose-500 dark:text-rose-400",
  "text-cyan-500 dark:text-cyan-400",
  "text-fuchsia-500 dark:text-fuchsia-400",
  "text-orange-500 dark:text-orange-400",
  "text-lime-500 dark:text-lime-400",
  "text-teal-500 dark:text-teal-400",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return USERNAME_COLORS[hash % USERNAME_COLORS.length];
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserMeta["role"] }) {
  if (role === "member") return null;
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide",
      role === "admin"
        ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    )}>
      {role}
    </span>
  );
}

// ─── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(comments: PostComment[], metaMap: Map<string, UserMeta>): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((c) => {
    nodes.set(c.id, { ...c, attachments: c.attachments ?? [], replies: [], userMeta: metaMap.get(c.user_id) });
  });

  nodes.forEach((node) => {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  const sort = (items: CommentNode[]) => {
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    items.forEach((item) => sort(item.replies));
  };
  sort(roots);
  return roots;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isImageMime(m: string) { return m.startsWith("image/"); }
function isVideoMime(m: string) { return m.startsWith("video/"); }

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    // @ts-expect-error react-markdown shape
    return extractText(children.props.children);
  }
  return "";
}

// ─── Markdown ─────────────────────────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      img({ src, alt }) {
        if (!src) return null;
        return <img src={src} alt={alt ?? ""} className="my-2 rounded-lg border border-border/60 max-h-64 object-cover" />;
      },
      a({ href, children }) {
        if (!href) return <>{children}</>;
        return <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{children}</a>;
      },
      pre({ children }) {
        const code = extractText(children);
        return (
          <pre className="group relative my-3 overflow-x-auto rounded-lg border bg-background p-3 text-xs">
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(code); toast.success("Copied"); }}
              className="absolute right-2 top-2 rounded border bg-background/90 px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
              Copy
            </button>
            {children}
          </pre>
        );
      },
      code({ children, className, ...props }: any) {
        const inline = !(className?.includes("language-"));
        if (inline) return <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{children}</code>;
        return <code {...props}>{children}</code>;
      },
    }}>
      {content}
    </ReactMarkdown>
  );
}

// ─── Attachment preview ───────────────────────────────────────────────────────
function AttachmentPreview({ attachment }: { attachment: CommentAttachment }) {
  if (isImageMime(attachment.mimeType))
    return <img src={attachment.url} alt={attachment.name} className="mt-2 max-h-56 rounded-lg border border-border/60 object-cover" />;
  if (isVideoMime(attachment.mimeType))
    return <video src={attachment.url} controls className="mt-2 w-full rounded-lg border border-border/60 bg-black" />;
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
      <Paperclip size={12} />
      <span className="truncate">{attachment.name}</span>
      <span className="text-muted-foreground ml-auto">{formatFileSize(attachment.size)}</span>
    </a>
  );
}

// ─── Vote button — works for anon too (localStorage) ─────────────────────────
function VoteButton({
  commentId, score, userVote, onVote,
}: {
  commentId: string;
  score: number;
  userVote: 1 | -1 | 0;
  onVote: (commentId: string, vote: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onVote(commentId, 1)}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded transition-colors touch-manipulation",
          userVote === 1
            ? "text-orange-500 bg-orange-500/10"
            : "text-foreground/40 hover:text-orange-500 hover:bg-orange-500/10 active:text-orange-500 active:bg-orange-500/10"
        )}
        title="Upvote"
      >
        <ArrowUp size={13} strokeWidth={2.5} />
      </button>
      <span className={cn(
        "text-[11px] font-bold tabular-nums min-w-[1.5rem] text-center",
        score > 0 ? "text-orange-500" : score < 0 ? "text-blue-500" : "text-foreground/50"
      )}>
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(commentId, -1)}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded transition-colors touch-manipulation",
          userVote === -1
            ? "text-blue-500 bg-blue-500/10"
            : "text-foreground/40 hover:text-blue-500 hover:bg-blue-500/10 active:text-blue-500 active:bg-blue-500/10"
        )}
        title="Downvote"
      >
        <ArrowDown size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Comment card — Reddit style ──────────────────────────────────────────────
function CommentCard({
  comment, depth, onReply, currentUserId, isAdmin,
  scores, userVotes, onVote, isAuthenticated, onLoginRedirect,
}: {
  comment: CommentNode;
  depth: number;
  onReply: (c: CommentNode) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  scores: ScoreMap;
  userVotes: VoteState;
  onVote: (id: string, v: 1 | -1) => void;
  isAuthenticated: boolean;
  onLoginRedirect: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayName = comment.userMeta?.username ?? `user_${comment.user_id.slice(0, 6)}`;
  const colorClass = getUserColor(comment.user_id);
  const isOwn = currentUserId === comment.user_id;
  const score = scores[comment.id] ?? 0;
  const userVote = userVotes[comment.id] ?? 0;
  const hasReplies = comment.replies.length > 0;
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    const { error } = await supabase.from("post_comments").delete().eq("id", comment.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); window.dispatchEvent(new CustomEvent("comment-deleted")); }
    setDeleting(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(comment.body);
    toast.success("Copied");
  };

  // Thread line — coloured glow matching username
  const threadLineClass = colorClass
    .replace("text-", "bg-")
    .replace("dark:text-", "dark:bg-")
    .replace("500", "400")
    .replace("400", "300");

  return (
    <div className="flex gap-2.5">
      {/* Left: avatar + thread line */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
        <button
          type="button"
          onClick={() => hasReplies && setCollapsed((c) => !c)}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-border/40 shrink-0 transition-opacity",
            colorClass.split(" ")[0].replace("text-", "bg-").replace("500", "100").replace("400", "100"),
            hasReplies ? "cursor-pointer hover:opacity-70" : "cursor-default"
          )}
        >
          <span className={colorClass.split(" ")[0]}>{initials}</span>
        </button>

        {/* Thread line with subtle glow */}
        {hasReplies && !collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className={cn(
              "w-0.5 flex-1 mt-1.5 rounded-full cursor-pointer transition-all opacity-40 hover:opacity-80",
              "shadow-[0_0_4px_currentColor]",
              threadLineClass.split(" ")[0]
            )}
            title="Collapse thread"
          />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0 pb-2">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className={cn("text-xs font-semibold", colorClass.split(" ")[0])}>{displayName}</span>
          {comment.userMeta && <RoleBadge role={comment.userMeta.role} />}
          <span className="text-[10px] text-foreground/55 font-medium">
            {format(new Date(comment.created_at), "MMM d · h:mm a")}
          </span>
          {comment.anchor_id && !comment.parent_id && (
            <Badge variant="secondary" className="text-[9px] py-0 px-1">
              ↩ {comment.anchor_label?.replace(/^[^:]+:\s*/, "") ?? "block"}
            </Badge>
          )}
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-1.5 text-[11px] text-foreground/50 hover:text-foreground transition-colors py-0.5"
          >
            <ChevronRight size={12} />
            <span>{comment.replies.length} repl{comment.replies.length === 1 ? "y" : "ies"} hidden</span>
          </button>
        ) : (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-6 prose-p:my-0 prose-headings:my-1 text-foreground/80 text-sm">
              <MarkdownRenderer content={comment.body} />
              {comment.attachments.map((a) => <AttachmentPreview key={a.url} attachment={a} />)}
            </div>

            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <VoteButton
                commentId={comment.id}
                score={score}
                userVote={userVote as 1 | -1 | 0}
                onVote={onVote}
              />

              {hasReplies && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-semibold text-foreground/45 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation"
                >
                  <ChevronDown size={10} className={cn("transition-transform", collapsed && "-rotate-90")} />
                  {comment.replies.length}
                </button>
              )}

              {/* Reply — redirects to login if not authenticated */}
              <button
                type="button"
                onClick={() => isAuthenticated ? onReply(comment) : onLoginRedirect()}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-foreground/55 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation"
              >
                <Reply size={12} strokeWidth={2} /> Reply
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center w-7 h-7 rounded text-foreground/50 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation"
                title="Copy"
              >
                <Copy size={13} strokeWidth={2} />
              </button>

              {(isOwn || isAdmin) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center w-7 h-7 rounded text-foreground/40 hover:text-destructive hover:bg-destructive/10 active:text-destructive active:bg-destructive/10 transition-colors touch-manipulation"
                  title="Delete"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              )}
            </div>

            {hasReplies && (
              <div className="mt-2 space-y-2">
                {comment.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    onReply={onReply}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    scores={scores}
                    userVotes={userVotes}
                    onVote={onVote}
                    isAuthenticated={isAuthenticated}
                    onLoginRedirect={onLoginRedirect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CommentsSection({ postId, activeAnchor, onClearAnchor }: CommentsSectionProps) {
  const { user, profile, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [metaMap, setMetaMap] = useState<Map<string, UserMeta>>(new Map());
  const [scores, setScores] = useState<ScoreMap>({});
  const [userVotes, setUserVotes] = useState<VoteState>({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyParent, setReplyParent] = useState<CommentNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerMode, setPickerMode] = useState<"image" | "video" | "file">("file");

  // Redirect unauthenticated users to login, preserving current path
  const handleLoginRedirect = useCallback(() => {
    navigate(`/login?from=${encodeURIComponent(location.pathname)}`);
  }, [navigate, location.pathname]);

  // Load anon votes from localStorage
  const loadAnonVotes = useCallback((commentIds: string[]) => {
    const stored = localStorage.getItem("anon-votes") ?? "{}";
    const all: VoteState = JSON.parse(stored);
    const relevant: VoteState = {};
    commentIds.forEach((id) => { if (all[id]) relevant[id] = all[id]; });
    return relevant;
  }, []);

  const saveAnonVote = useCallback((commentId: string, vote: 1 | -1 | 0) => {
    const stored = localStorage.getItem("anon-votes") ?? "{}";
    const all: VoteState = JSON.parse(stored);
    if (vote === 0) delete all[commentId];
    else all[commentId] = vote;
    localStorage.setItem("anon-votes", JSON.stringify(all));
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) { toast.error("Failed to load comments"); setLoading(false); return; }

    const rows = (data ?? []) as PostComment[];
    setComments(rows);

    // Fetch user profiles
    const userIds = [...new Set(rows.map((c) => c.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles").select("id, username, role").in("id", userIds);
      const map = new Map<string, UserMeta>();
      (profiles ?? []).forEach((p: any) => map.set(p.id, { username: p.username ?? null, role: p.role ?? "member" }));
      setMetaMap(map);
    }

    // Fetch vote scores
    if (rows.length > 0) {
      const commentIds = rows.map((c) => c.id);
      const { data: votes } = await supabase
        .from("comment_votes").select("comment_id, vote").in("comment_id", commentIds);

      const scoreMap: ScoreMap = {};
      commentIds.forEach((id) => { scoreMap[id] = 0; });
      (votes ?? []).forEach((v: any) => { scoreMap[v.comment_id] = (scoreMap[v.comment_id] ?? 0) + v.vote; });
      setScores(scoreMap);

      // Fetch current user's votes (or load from localStorage for anon)
      if (user) {
        const { data: myVotes } = await supabase
          .from("comment_votes").select("comment_id, vote")
          .in("comment_id", commentIds).eq("user_id", user.id);
        const voteState: VoteState = {};
        (myVotes ?? []).forEach((v: any) => { voteState[v.comment_id] = v.vote; });
        setUserVotes(voteState);
      } else {
        // Anon votes from localStorage
        setUserVotes(loadAnonVotes(commentIds));
      }
    }

    setLoading(false);
  }, [postId, user?.id]);

  useEffect(() => { void loadComments(); }, [loadComments]);

  // Esc cancels reply
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (replyParent) setReplyParent(null);
        if (activeAnchor) onClearAnchor();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [replyParent, activeAnchor, onClearAnchor]);

  useEffect(() => {
    const handler = () => void loadComments();
    window.addEventListener("comment-deleted", handler);
    return () => window.removeEventListener("comment-deleted", handler);
  }, [loadComments]);

  const tree = useMemo(() => buildTree(comments, metaMap), [comments, metaMap]);

  const handleVote = async (commentId: string, vote: 1 | -1) => {
    // For anon users, always read current vote from localStorage (not stale React state)
    const current: number = user
      ? (userVotes[commentId] ?? 0)
      : (() => {
          const stored: VoteState = JSON.parse(localStorage.getItem("anon-votes") ?? "{}");
          return stored[commentId] ?? 0;
        })();

    const newVote = current === vote ? 0 : vote;

    if (user) {
      // Authenticated — persist to DB
      if (newVote === 0) {
        await supabase.from("comment_votes").delete()
          .eq("comment_id", commentId).eq("user_id", user.id);
      } else {
        await supabase.from("comment_votes").upsert({
          comment_id: commentId, user_id: user.id, vote: newVote,
        }, { onConflict: "comment_id,user_id" });
      }
    } else {
      // Anon — persist to localStorage
      saveAnonVote(commentId, newVote as 1 | -1 | 0);
    }

    const delta = newVote - current;
    setUserVotes((prev) => ({ ...prev, [commentId]: newVote as 1 | -1 | 0 }));
    setScores((prev) => ({ ...prev, [commentId]: (prev[commentId] ?? 0) + delta }));
  };

  const openPicker = (mode: "image" | "video" | "file") => {
    setPickerMode(mode);
    fileInputRef.current?.click();
  };

  const handleAttachmentUpload = async (file: File) => {
    const asset = await uploadPublicAsset(file, "comments");
    setAttachments((prev) => [...prev, { name: asset.name, url: asset.url, mimeType: asset.mimeType, size: asset.size }]);
    if (isImageFile(file)) setBody((b) => `${b}${b ? "\n\n" : ""}![${file.name}](${asset.url})`);
    else setBody((b) => `${b}${b ? "\n\n" : ""}[${file.name}](${asset.url})`);
  };

  const submitComment = async () => {
    if (!user) return;
    const cleaned = body.trim();
    if (!cleaned && attachments.length === 0) { toast.error("Write something first"); return; }

    const anchorSource = activeAnchor ?? (replyParent ? {
      id: replyParent.anchor_id ?? `comment-${replyParent.id}`,
      tagName: "reply", text: replyParent.anchor_label ?? "", html: "", canAnchor: true,
    } : null);

    setSubmitting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      parent_id: replyParent?.id ?? null,
      anchor_id: anchorSource?.id ?? null,
      anchor_label: anchorSource ? `${anchorSource.tagName}: ${anchorSource.text || "selected block"}` : null,
      body: cleaned,
      attachments,
    });

    if (error) {
      console.error("Comment insert error:", error);
      toast.error(error.message ?? "Failed to post");
    } else {
      toast.success("Posted");
      setBody(""); setAttachments([]); setReplyParent(null); onClearAnchor();
      await loadComments();
    }
    setSubmitting(false);
  };

  const composerLabel = activeAnchor
    ? `${activeAnchor.tagName}: ${activeAnchor.text || "selected block"}`
    : replyParent
      ? `replying to ${replyParent.userMeta?.username ?? `user_${replyParent.user_id.slice(0, 6)}`}`
      : null;

  const totalCount = comments.length;

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <section className="mt-auto pt-16 md:pt-20 pb-6 mx-auto max-w-3xl space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-rose-500/80" />
          <h2 className="text-xs font-semibold tracking-wide text-rose-500/90 uppercase">
            Comments {totalCount > 0 && `· ${totalCount}`}
          </h2>
        </div>
        <div className="rounded-xl border bg-card/70 px-4 py-3 flex items-center gap-3">
          <LogIn size={14} className="shrink-0 text-rose-500/70" />
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="text-xs font-semibold text-rose-500/90 hover:text-rose-500 transition-colors"
          >
            Sign in to comment
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-14 rounded-xl border bg-muted/30 animate-pulse" />)}</div>
        ) : tree.length === 0 ? (
          <p className="text-[11px] text-muted-foreground px-1">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {tree.map((c) => (
              <CommentCard key={c.id} comment={c} depth={0} onReply={() => {}}
                scores={scores} userVotes={userVotes} onVote={handleVote}
                isAuthenticated={false} onLoginRedirect={handleLoginRedirect} />
            ))}
          </div>
        )}
      </section>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <section className="mt-auto pt-16 md:pt-20 pb-6 mx-auto max-w-3xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-rose-500/80" />
          <h2 className="text-xs font-semibold tracking-wide text-rose-500/90 uppercase">
            Comments {totalCount > 0 && `· ${totalCount}`}
          </h2>
        </div>
        <Badge variant="secondary" className="gap-1 text-[10px]">
          @ {profile?.username ?? profile?.email ?? "you"}
        </Badge>
      </div>

      {/* Composer */}
      <div className="rounded-xl border bg-card/70 p-3 space-y-2">
        {composerLabel && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">↩ {composerLabel}</Badge>
            <button type="button"
              onClick={() => { setReplyParent(null); onClearAnchor(); }}
              className="text-[10px] text-muted-foreground hover:text-foreground">
              cancel
            </button>
          </div>
        )}

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void submitComment(); } }}
          placeholder=""
          rows={2}
          className="min-h-[4rem] resize-none text-sm"
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <Badge key={a.url} variant="secondary" className="gap-1 pr-1.5 text-[10px]">
                {isImageMime(a.mimeType) ? <ImageIcon size={10} /> : isVideoMime(a.mimeType) ? <Video size={10} /> : <Paperclip size={10} />}
                <span className="max-w-28 truncate">{a.name}</span>
                <button type="button" onClick={() => setAttachments((prev) => prev.filter((x) => x.url !== a.url))}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-background"><X size={10} /></button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => openPicker("image")} title="Image"
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation">
              <ImageIcon size={14} />
            </button>
            <button type="button" onClick={() => openPicker("video")} title="Video"
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation">
              <Video size={14} />
            </button>
            <button type="button" onClick={() => openPicker("file")} title="File"
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/60 transition-colors touch-manipulation">
              <Paperclip size={14} />
            </button>
            <span className="text-[10px] text-muted-foreground/40 ml-1 hidden sm:inline">⌘↵ to post</span>
          </div>
          <Button type="button" onClick={submitComment} disabled={submitting} className="h-7 gap-1.5 px-3 text-[11px]">
            <Send size={12} /> {submitting ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden"
        accept={pickerMode === "image" ? "image/*" : pickerMode === "video" ? "video/*" : "*/*"}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try { await handleAttachmentUpload(file); }
          catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
        }}
      />

      {/* Comment list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl border bg-muted/30 animate-pulse" />)}
        </div>
      ) : tree.length === 0 ? (
        <p className="text-[11px] text-muted-foreground px-1">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {tree.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              depth={0}
              onReply={setReplyParent}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              scores={scores}
              userVotes={userVotes}
              onVote={handleVote}
              isAuthenticated={isAuthenticated}
              onLoginRedirect={handleLoginRedirect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
