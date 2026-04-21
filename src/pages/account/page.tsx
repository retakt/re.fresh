import { useRef, useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/35 dark:text-fuchsia-300",
  editor: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  member: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
};

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
  const navigate = useNavigate();
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
    signOut,
  } = useAuth();
  const [usernameDraft, setUsernameDraft] = useState(profile?.username ?? "");

  const email = profile?.email ?? user?.email ?? "No email";
  const role = profile?.role ?? "member";

  const updateAvatarUrl = async (nextUrl: string | null) => {
    if (!user) return false;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: nextUrl })
      .eq("id", user.id);
    if (error) { toast.error("Failed to update profile picture"); return false; }
    await refreshProfile();
    return true;
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    setAvatarSaving(true);

    try {
      // Optimize avatar (200x200px, WebP format)
      const optimizedFile = await optimizeAvatar(file);
      
      const ext = "webp"; // Always use WebP for avatars
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(path, optimizedFile, { cacheControl: "3600", upsert: false });
        
      if (uploadError) { 
        setAvatarSaving(false); 
        toast.error("Upload failed"); 
        return; 
      }
      
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      const saved = await updateAvatarUrl(data.publicUrl);
      if (saved) toast.success("Profile picture updated");
    } catch (error) {
      toast.error("Failed to process image");
    } finally {
      setAvatarSaving(false);
    }
  };

  // Avatar-specific optimization (200x200px, WebP)
  const optimizeAvatar = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        const size = 200; // Fixed 200x200px for avatars
        canvas.width = size;
        canvas.height = size;

        // Draw image centered and cropped to square
        const { width, height } = img;
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], `avatar.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // Fallback
            }
          },
          "image/webp",
          0.90 // 90% quality for avatars
        );
      };

      img.src = URL.createObjectURL(file);
    });
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

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) navigate("/");
  };

  return (
    <div className="w-full max-w-lg space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Profile and preferences
        </p>
      </div>

      {/* ── Profile card ── */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
          <div className="relative shrink-0">
            <Avatar className="size-14 border-2 border-border/70 shadow-sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              aria-label="Change avatar"
            >
              {avatarSaving
                ? <Loader2 size={11} className="animate-spin" />
                : <Camera size={11} />
              }
            </button>
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

        {/* Username edit */}
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
                onKeyDown={(e) => { if (e.key === "Enter") void saveUsername(); if (e.key === "Escape") setIsEditingUsername(false); }}
              />
              <Button size="sm" className="h-8 px-3" disabled={usernameSaving} onClick={saveUsername}>
                {usernameSaving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </Button>
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

      {/* ── Info ── */}
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

      {/* ── Preferences ── */}
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

      {/* ── Danger ── */}
      <SettingSection>
        <SettingRow
          icon={<LogOut size={15} />}
          label="Log out"
          onClick={handleLogout}
          destructive
        />
      </SettingSection>

    </div>
  );
}
