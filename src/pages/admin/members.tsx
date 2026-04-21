import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ArrowLeft,
  Plus,
  X,
  Mail,
  Trash2,
  KeyRound,
  PencilLine,
  Shield,
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
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftUsername, setDraftUsername] = useState("");
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setMembers(data);
    setLoading(false);
  };

  const openEdit = (member: Profile) => {
    setEditingId(member.id);
    setDraftUsername(member.username ?? "");
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("You must be logged in to invite members.");
        setSending(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to send invite");
      } else {
        toast.success(`Invite sent to ${email} ✓`);
        setEmail("");
        setShowInvite(false);
        setTimeout(fetchMembers, 1500);
      }
    } catch {
      toast.error("Network error - check your connection");
    }

    setSending(false);
  };

  const handleRemove = async (id: string, memberEmail: string | null) => {
    if (!confirm(`Remove ${memberEmail}?`)) return;
    setSavingMemberId(id);
    const result = await invokeAdminFunction("admin-manage-member", {
      action: "delete_member",
      memberId: id,
    });
    if (!result.ok) {
      toast.error(result.error || "Failed to remove member");
    } else {
      toast.success("Member removed.");
      fetchMembers();
    }
    setSavingMemberId(null);
  };

  const handleRoleChange = async (
    member: Profile,
    nextRole: Profile["role"],
  ) => {
    if (member.id === user?.id) {
      toast.error("Changing your own role is disabled here for safety.");
      return;
    }

    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-manage-member", {
      action: "update_role",
      memberId: member.id,
      role: nextRole,
    });

    if (!result.ok) {
      toast.error(result.error || "Failed to update role");
    } else {
      toast.success(`Role updated to ${nextRole}`);
      fetchMembers();
    }
    setSavingMemberId(null);
  };

  const handleUsernameSave = async (member: Profile) => {
    setSavingMemberId(member.id);
    const nextUsername = draftUsername.trim() || null;

    const result = await invokeAdminFunction("admin-manage-member", {
      action: "update_username",
      memberId: member.id,
      username: nextUsername,
    });

    if (!result.ok) {
      toast.error(result.error || "Failed to update username");
    } else {
      toast.success("Username updated");
      setEditingId(null);
      fetchMembers();
    }
    setSavingMemberId(null);
  };

  const handleResetPassword = async (member: Profile) => {
    if (!member.email) {
      toast.error("This member does not have an email yet.");
      return;
    }

    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-reset-password", {
      email: member.email,
    });
    if (!result.ok) {
      toast.error(result.error || "Failed to send reset email");
    } else {
      toast.success(`Password reset sent to ${member.email}`);
    }
    setSavingMemberId(null);
  };

  const handleChangeEmail = async (member: Profile) => {
    const nextEmail = prompt("Enter the new email address", member.email ?? "");
    if (!nextEmail || !nextEmail.trim()) return;

    setSavingMemberId(member.id);
    const result = await invokeAdminFunction("admin-update-email", {
      memberId: member.id,
      email: nextEmail.trim(),
    });
    if (!result.ok) {
      toast.error(result.error || "Failed to update email");
    } else {
      toast.success("Email updated");
      fetchMembers();
    }
    setSavingMemberId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage usernames, roles, and member account actions
          </p>
        </div>
        {!showInvite && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowInvite(true)}>
            <Plus size={14} /> Invite member
          </Button>
        )}
      </div>

      {showInvite && (
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Invite new member</h2>
          <p className="text-xs text-muted-foreground">
            They will receive an email with a link to set their password. Then
            you can promote them to editor or admin from the list below.
          </p>
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="member@example.com"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInvite} disabled={sending} className="gap-1.5">
              <Mail size={13} /> {sending ? "Sending..." : "Send invite"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowInvite(false);
                setEmail("");
              }}
              className="gap-1.5"
            >
              <X size={13} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border bg-card px-4 py-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {member.username || member.email || "Unnamed member"}
                    </p>
                    <Badge className={`border-0 text-xs py-0 px-1.5 ${ROLE_STYLES[member.role]}`}>
                      {member.role}
                    </Badge>
                    {member.id === user?.id && (
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        You
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{member.email ?? "No profile email yet"}</span>
                    <span>•</span>
                    <span>{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>

                  {editingId === member.id ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Input
                        value={draftUsername}
                        onChange={(e) => setDraftUsername(e.target.value)}
                        placeholder="username"
                        className="h-8 max-w-[14rem]"
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        disabled={savingMemberId === member.id}
                        onClick={() => handleUsernameSave(member)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => openEdit(member)}
                      >
                        <PencilLine size={13} />
                        Username
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={savingMemberId === member.id}
                        onClick={() => handleResetPassword(member)}
                      >
                        <KeyRound size={13} />
                        Reset password
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={savingMemberId === member.id}
                        onClick={() => handleChangeEmail(member)}
                      >
                        <Mail size={13} />
                        Change email
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-muted-foreground" />
                    <select
                      value={member.role}
                      disabled={member.id === user?.id || savingMemberId === member.id}
                      onChange={(e) =>
                        handleRoleChange(member, e.target.value as Profile["role"])
                      }
                      className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                    >
                      <option value="member">Member</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {member.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(member.id, member.email ?? "this member")}
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
