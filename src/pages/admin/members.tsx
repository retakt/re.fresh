import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ArrowLeft, Plus, X, Mail, Trash2, KeyRound, PencilLine, Shield, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { invokeAdminFunction } from "@/lib/admin";

const ROLE_STYLES = {
  admin: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/35 dark:text-fuchsia-300",
  editor: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  member: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
} as const;

export default function AdminMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [editingUsernameId, setEditingUsernameId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [draftUsername, setDraftUsername] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Email is required."); return; }
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("You must be logged in."); setSending(false); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: inviteEmail }),
        },
      );
      const result = await response.json();
      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to send invite");
      } else {
        toast.success(`Invite sent to ${inviteEmail} ✓`);
        setInviteEmail("");
        setShowInvite(false);
        setTimeout(fetchMembers, 1500);
      }
    } catch { toast.error("Network error"); }
    setSending(false);
  };

  const handleRemove = async (id: string, memberEmail: string | null) => {
    if (!confirm(`Remove ${memberEmail ?? "this member"}? This cannot be undone.`)) return;
    setSavingMemberId(id);
    const result = await invokeAdminFunction("admin-manage-member", { action: "delete_member", memberId: id });
    if (!result.ok) toast.error(result.error || "Failed to remove member");
    else { toast.success("Member removed."); fetchMembers(); }
    setSavingMemberId(null);
  };

  const handleRoleChange = async (member: Profile, nextRole: Profile["role"]) => {
    if (member.id === user?.id) { toast.error("Cannot change your own role."); return; }
    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-manage-member", { action: "update_role", memberId: member.id, role: nextRole });
    if (!result.ok) toast.error(result.error || "Failed to update role");
    else { toast.success(`Role → ${nextRole}`); fetchMembers(); }
    setSavingMemberId(null);
  };

  const handleUsernameSave = async (member: Profile) => {
    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-manage-member", {
      action: "update_username", memberId: member.id, username: draftUsername.trim() || null,
    });
    if (!result.ok) toast.error(result.error || "Failed to update username");
    else { toast.success("Username updated"); setEditingUsernameId(null); fetchMembers(); }
    setSavingMemberId(null);
  };

  const handleEmailSave = async (member: Profile) => {
    if (!draftEmail.trim()) return;
    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-update-email", { memberId: member.id, email: draftEmail.trim() });
    if (!result.ok) toast.error(result.error || "Failed to update email");
    else { toast.success("Email updated"); setEditingEmailId(null); fetchMembers(); }
    setSavingMemberId(null);
  };

  const handleResetPassword = async (member: Profile) => {
    if (!member.email) { toast.error("No email on this member."); return; }
    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-reset-password", { email: member.email });
    if (!result.ok) toast.error(result.error || "Failed to send reset email");
    else toast.success(`Reset sent to ${member.email}`);
    setSavingMemberId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage roles, usernames, and account actions</p>
        </div>
        {!showInvite && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowInvite(true)}>
            <Plus size={14} /> Invite
          </Button>
        )}
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Invite new member</h2>
            <button onClick={() => { setShowInvite(false); setInviteEmail(""); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email address</Label>
            <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()} className="text-sm" />
          </div>
          <Button size="sm" onClick={handleInvite} disabled={sending} className="gap-1.5">
            <Mail size={13} /> {sending ? "Sending..." : "Send invite"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border bg-card px-4 py-3 space-y-2">

              {/* Row 1: Email + date + edit email button | Role selector + delete */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Email line with inline edit */}
                  {editingEmailId === member.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)}
                        className="h-7 text-xs flex-1 max-w-[200px]" autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleEmailSave(member); if (e.key === "Escape") setEditingEmailId(null); }} />
                      <button onClick={() => handleEmailSave(member)} disabled={savingMemberId === member.id}
                        className="p-1 rounded text-primary hover:bg-primary/10 transition-colors">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditingEmailId(null)}
                        className="p-1 rounded text-muted-foreground hover:bg-secondary transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium truncate max-w-[180px]">{member.email ?? "No email"}</span>
                      <button
                        onClick={() => { setEditingEmailId(member.id); setDraftEmail(member.email ?? ""); setEditingUsernameId(null); }}
                        className="p-0.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors"
                        title="Edit email">
                        <PencilLine size={11} />
                      </button>
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground/60">{new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Right: role selector + delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={member.role}
                    disabled={member.id === user?.id || savingMemberId === member.id}
                    onChange={(e) => handleRoleChange(member, e.target.value as Profile["role"])}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="member">Member</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  {member.role !== "admin" && (
                    <button
                      onClick={() => handleRemove(member.id, member.email ?? null)}
                      disabled={savingMemberId === member.id}
                      className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
                      title="Remove member">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Username + role badge + You badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {editingUsernameId === member.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input value={draftUsername} onChange={(e) => setDraftUsername(e.target.value)}
                      placeholder="username" className="h-7 text-xs w-32" autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleUsernameSave(member); if (e.key === "Escape") setEditingUsernameId(null); }} />
                    <button onClick={() => handleUsernameSave(member)} disabled={savingMemberId === member.id}
                      className="p-1 rounded text-primary hover:bg-primary/10 transition-colors">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingUsernameId(null)}
                      className="p-1 rounded text-muted-foreground hover:bg-secondary transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingUsernameId(member.id); setDraftUsername(member.username ?? ""); setEditingEmailId(null); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    title="Edit username">
                    <PencilLine size={11} className="opacity-50 group-hover:opacity-100" />
                    <span>{member.username ? `@${member.username}` : "set username"}</span>
                  </button>
                )}
                <Badge className={`border-0 text-[10px] py-0 px-1.5 ${ROLE_STYLES[member.role]}`}>
                  {member.role}
                </Badge>
                {member.id === user?.id && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">You</Badge>
                )}
              </div>

              {/* Row 3: Reset password button only */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <Button variant="ghost" size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground active:bg-secondary touch-manipulation"
                  disabled={savingMemberId === member.id}
                  onClick={() => handleResetPassword(member)}>
                  <KeyRound size={12} /> Reset password
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
