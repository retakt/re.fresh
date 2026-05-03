import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  Loader2,
  LogOut,
  Mail,
  PencilLine,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLongPress } from "@/hooks/use-long-press";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { AvatarHistoryDialog } from "@/components/account/avatar-history-dialog.tsx";
import type { AvatarHistoryItem } from "@/components/account/avatar-history-dialog.tsx";
import { supabase } from "@/lib/supabase";
import type { ProfileAvatarHistory } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/35 dark:text-fuchsia-300",
  editor: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  member: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
};

const AVATAR_HISTORY_LIMIT = 5;

function SettingRow({
  icon,
  label,
  sublabel,
  right,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors
        ${onClick ? "hover:bg-secondary/50 active:bg-secondary cursor-pointer" : ""}
        ${destructive ? "text-destructive" : "text-foreground"}`}
    >
      <span className={`shrink-0 ${destructive ? "text-destructive" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-medium ${destructive ? "text-destructive" : ""}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {right ?? (onClick && !destructive && <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" />)}
    </Tag>
  );
}

function SettingSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
      {title && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        </div>
      )}
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

export default function AccountPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarHistory, setAvatarHistory] = useState<ProfileAvatarHistory[]>([]);
  const [restoringAvatar, setRestoringAvatar] = useState(false);
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
    signOut,
  } = useAuth();
  const [usernameDraft, setUsernameDraft] = useState(profile?.username ?? "");

  const email = profile?.email ?? user?.email ?? "No email";
  const role = profile?.role ?? "member";

  useEffect(() => {
    setUsernameDraft(profile?.username ?? "");
  }, [profile?.username]);

  const fetchAvatarHistory = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profile_avatar_history")
      .select("id, user_id, avatar_url, storage_path, is_active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch avatar history", error);
      setAvatarHistory([]);
      return;
    }

    setAvatarHistory(data ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAvatarHistory([]);
      return;
    }

    void fetchAvatarHistory();
  }, [user?.id, fetchAvatarHistory]);

  // Camera icon: tap = change photo, long press = open history panel
  const cameraLongPress = useLongPress({
    onLongPress: () => {
      if (avatarUrl || avatarHistory.length > 0) {
        setAvatarPreviewOpen(true);
      }
    },
    onClick: () => fileInputRef.current?.click(),
    delay: 500,
  });

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

  const setActiveAvatarHistory = async (itemId: string | null) => {
    if (!user) return false;

    const { error: clearError } = await supabase
      .from("profile_avatar_history")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (clearError) {
      console.error("Failed to clear avatar history active state", clearError);
      return false;
    }

    if (!itemId) return true;

    const { error } = await supabase
      .from("profile_avatar_history")
      .update({ is_active: true })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to activate avatar history item", error);
      return false;
    }

    return true;
  };

  const pruneAvatarHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profile_avatar_history")
      .select("id, storage_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length <= AVATAR_HISTORY_LIMIT) {
      return;
    }

    const itemsToRemove = data.slice(AVATAR_HISTORY_LIMIT);
    const removablePaths = itemsToRemove
      .map((item) => item.storage_path)
      .filter(Boolean);

    const { error: deleteRowsError } = await supabase
      .from("profile_avatar_history")
      .delete()
      .in("id", itemsToRemove.map((item) => item.id));

    if (deleteRowsError) {
      console.error("Failed to prune avatar history rows", deleteRowsError);
      return;
    }

    if (removablePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .remove(removablePaths);

      if (storageError) {
        console.error("Failed to prune avatar history files", storageError);
      }
    }
  };

  const createAvatarHistoryEntry = async (publicUrl: string, storagePath: string) => {
    if (!user) return false;

    const deactivated = await setActiveAvatarHistory(null);
    if (!deactivated) return false;

    const { error } = await supabase
      .from("profile_avatar_history")
      .insert({
        user_id: user.id,
        avatar_url: publicUrl,
        storage_path: storagePath,
        is_active: true,
      });

    if (error) {
      console.error("Failed to create avatar history entry", error);
      return false;
    }

    await pruneAvatarHistory();
    return true;
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setAvatarSaving(true);

    try {
      const optimizedFile = await optimizeAvatar(file);
      const path = `avatars/${user.id}-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(path, optimizedFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error("Upload failed");
        return;
      }

      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      const saved = await updateAvatarUrl(data.publicUrl);
      if (!saved) return;

      const historySaved = await createAvatarHistoryEntry(data.publicUrl, path);
      if (!historySaved) {
        toast.error("Profile updated, but avatar history could not be saved");
      } else {
        toast.success("Profile picture updated");
      }

      await fetchAvatarHistory();
    } catch (error) {
      console.error("Failed to process avatar", error);
      toast.error("Failed to process image");
    } finally {
      setAvatarSaving(false);
    }
  };

  const optimizeAvatar = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        const { width, height } = img;
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], "avatar.webp", {
                type: "image/webp",
                lastModified: Date.now(),
              }));
            } else {
              resolve(file);
            }
          },
          "image/webp",
          0.9,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  const handleAvatarRemove = async () => {
    setAvatarSaving(true);
    const saved = await updateAvatarUrl(null);

    if (saved) {
      await setActiveAvatarHistory(null);
      await fetchAvatarHistory();
      toast.success("Profile picture removed");
    }

    setAvatarSaving(false);
  };

  const handleRestoreAvatar = async (item: AvatarHistoryItem) => {
    if (!user || item.is_active) return;

    setRestoringAvatar(true);
    const saved = await updateAvatarUrl(item.avatar_url);

    if (saved) {
      const activated = await setActiveAvatarHistory(item.id);
      if (activated) {
        await fetchAvatarHistory();
        toast.success("Profile picture restored");
      } else {
        toast.error("Profile updated, but history state could not be refreshed");
      }
    }

    setRestoringAvatar(false);
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

  const handleLogout = async () => {
    await signOut();
    // Stay on current page — don't redirect to login
  };

  return (
    <div className="w-full max-w-lg space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Profile and preferences
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
          <div className="relative shrink-0">
            {/* Avatar — tap anywhere on it: short tap = change photo, long press = history */}
            <div
              {...cameraLongPress}
              onContextMenu={(e) => e.preventDefault()}
              aria-label="Change avatar (hold for history)"
              style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                cursor: "pointer",
              }}
              className="touch-manipulation select-none"
            >
              <Avatar className="size-14 border-2 border-border/70 shadow-sm">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover pointer-events-none" draggable={false} />}
                <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Camera badge — visual only, interaction handled by parent */}
              <div
                className="absolute -bottom-1.5 -right-1.5 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md pointer-events-none"
              >
                {avatarSaving
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Camera size={13} />
                }
              </div>
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[role] ?? ROLE_BADGE.member}`}>
                {role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
          </div>

          {avatarUrl && (
            <button
              onClick={handleAvatarRemove}
              disabled={avatarSaving}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Remove avatar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="px-4 py-3">
          {!isEditingUsername ? (
            <button
              onClick={() => setIsEditingUsername(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <PencilLine size={13} />
              <span>{profile?.username ? `@${profile.username}` : "Set a username"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="username"
                className="h-8 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveUsername();
                  if (e.key === "Escape") setIsEditingUsername(false);
                }}
              />
              <MagneticButton size="sm" className="h-8 px-3" disabled={usernameSaving} onClick={saveUsername} strength={0.3} radius={80}>
                {usernameSaving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </MagneticButton>
              <button
                onClick={() => { setUsernameDraft(profile?.username ?? ""); setIsEditingUsername(false); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <SettingSection title="Account info">
        <SettingRow
          icon={<Mail size={15} />}
          label="Email"
          sublabel={email}
        />
        <SettingRow
          icon={<Shield size={15} />}
          label="Role"
          right={
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[role] ?? ROLE_BADGE.member}`}>
              {role}
            </span>
          }
        />
        {role === "admin" && (
          <Link to="/admin" className="block">
            <SettingRow
              icon={<Shield size={15} />}
              label="Admin dashboard"
              sublabel="Manage content and members"
              onClick={undefined}
            />
          </Link>
        )}
      </SettingSection>

      <SettingSection title="Preferences">
        <SettingRow
          icon={<Bell size={15} />}
          label="Notifications"
          sublabel="Push alerts for new content"
          right={
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          }
        />
      </SettingSection>

      <SettingSection>
        <SettingRow
          icon={<LogOut size={15} />}
          label="Log out"
          onClick={handleLogout}
          destructive
        />
      </SettingSection>

      <AvatarHistoryDialog
        currentAvatarUrl={avatarUrl}
        displayName={displayName}
        initials={initials}
        items={avatarHistory}
        open={avatarPreviewOpen}
        restoring={restoringAvatar}
        onOpenChange={setAvatarPreviewOpen}
        onSelectAvatar={(item) => void handleRestoreAvatar(item)}
      />
    </div>
  );
}
