import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  Loader2,
  Mail,
  PencilLine,
  Shield,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ROLE_STYLES = {
  admin: {
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/35 dark:text-fuchsia-300",
    panel: "border-fuchsia-200/70 dark:border-fuchsia-900/40",
  },
  editor: {
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
    panel: "border-amber-200/70 dark:border-amber-900/40",
  },
  member: {
    text: "text-sky-700 dark:text-sky-300",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
    panel: "border-sky-200/70 dark:border-sky-900/40",
  },
} as const;

export default function AccountPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const {
    displayName,
    initials,
    profile,
    user,
    avatarUrl,
    notificationsEnabled,
    setNotificationsEnabled,
    refreshProfile,
  } = useAuth();
  const [usernameDraft, setUsernameDraft] = useState(profile?.username ?? "");

  const email = profile?.email ?? user?.email ?? "No email available";
  const role = profile?.role ?? "member";
  const roleStyle = ROLE_STYLES[role];

  const updateAvatarUrl = async (nextUrl: string | null) => {
    if (!user) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: nextUrl })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile picture");
      return false;
    }

    await refreshProfile();
    return true;
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setAvatarSaving(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `avatars/${user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setAvatarSaving(false);
      toast.error("Upload failed");
      return;
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    const saved = await updateAvatarUrl(data.publicUrl);
    setAvatarSaving(false);

    if (saved) toast.success("Profile picture updated");
  };

  const handleAvatarRemove = async () => {
    setAvatarSaving(true);
    const saved = await updateAvatarUrl(null);
    setAvatarSaving(false);
    if (saved) toast.success("Profile picture removed");
  };

  const saveUsername = async () => {
    if (!user) return;

    setUsernameSaving(true);
    const nextUsername = usernameDraft.trim() || null;

    const { error } = await supabase
      .from("profiles")
      .update({ username: nextUsername })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update username");
    } else {
      toast.success("Username updated");
      setIsEditingUsername(false);
      await refreshProfile();
    }
    setUsernameSaving(false);
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Member profile and preferences
          </p>
        </div>

        {role === "admin" && (
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shield size={14} />
              Admin
            </Button>
          </Link>
        )}
      </div>

      <section className={`rounded-lg border bg-card/50 p-5 shadow-sm ${roleStyle.panel}`}>
        <div className="mb-4 flex items-start gap-4">
          <div className="space-y-3">
            <Avatar className="size-16 border border-border/70 shadow-sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={avatarSaving}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarSaving ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {avatarUrl ? "Change" : "Upload"}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-destructive hover:text-destructive"
                  disabled={avatarSaving}
                  onClick={handleAvatarRemove}
                >
                  <Trash2 size={13} />
                  Remove
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-base font-semibold ${roleStyle.text}`}>{displayName}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditingUsername((value) => !value)}
              >
                <PencilLine size={13} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Profile picture is available for every role and appears in the navbar menu.
            </p>

            {isEditingUsername && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  placeholder="username"
                  className="h-8 max-w-[14rem]"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={usernameSaving}
                  onClick={saveUsername}
                >
                  {usernameSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setUsernameDraft(profile?.username ?? "");
                    setIsEditingUsername(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`rounded-lg border bg-background/40 p-3 ${roleStyle.panel}`}>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Mail size={12} />
              Email
            </div>
            <p className={`truncate text-sm font-medium ${roleStyle.text}`}>{email}</p>
          </div>

          <div className={`rounded-lg border bg-background/40 p-3 ${roleStyle.panel}`}>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Shield size={12} />
              Role
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium capitalize ${roleStyle.badge}`}>
              {role}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border/70 bg-card/50 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            UI-ready settings we can wire to backend behavior next.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                Toggle saved locally for now. Backend syncing can be added later.
              </p>
            </div>
          </div>

          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
      </section>
    </div>
  );
}
