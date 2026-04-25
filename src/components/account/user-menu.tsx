import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAuth } from "@/hooks/useAuth";
import { AvatarTooltip } from "@/components/mvpblocks/interactive-tooltip";

export default function UserMenu() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    displayName,
    initials,
    avatarUrl,
    user,
    profile,
    signOut,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAuth();
  const [open, setOpen] = useState(false);

  const email = profile?.email ?? user?.email ?? "Not signed in";

  const handleLogout = async () => {
    setOpen(false);
    const { error } = await signOut();
    if (!error) {
      // Hard navigate to root — clears any stale React state
      // (important for browsers like Vivaldi with aggressive caching)
      window.location.href = "/";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <AvatarTooltip label={isAuthenticated ? (profile?.username ?? null) : null}>
        <DropdownMenuTrigger asChild className="outline-none">
          <button
            className="rounded-full border border-border/70 bg-card/70 p-1 text-foreground outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open account menu"
          >
            <Avatar className="size-7 border border-border/70">
              {isAuthenticated && avatarUrl && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={displayName}
                  loading="lazy"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                {isAuthenticated ? initials : <UserCircle2 size={16} strokeWidth={2} />}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
      </AvatarTooltip>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-40 rounded-xl border-border/70 bg-card p-0 shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-2.5 py-2 border-b border-border/50 min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
            {isAuthenticated ? displayName : "Member access"}
          </p>
          <p
            className="text-muted-foreground mt-0.5 truncate"
            style={{ fontSize: "clamp(9px, 2.2vw, 11px)" }}
          >
            {isAuthenticated ? email : "Not signed in"}
          </p>
        </div>

        {isAuthenticated ? (
          <>
            {/* Nav items */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-[11px] gap-2 cursor-pointer">
                <Link to="/account">
                  <Settings size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate">Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="rounded-lg px-2 py-1.5 text-[11px] gap-2">
                <Sparkles size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">Feature previews</span>
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-[11px] gap-2 cursor-pointer">
                  <Link to="/admin">
                    <Shield size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate">Admin panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {profile?.role === "editor" && (
                <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-[11px] gap-2 cursor-pointer">
                  <Link to="/editor">
                    <Shield size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate">Editor panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <div className="border-t border-border/50" />

            {/* Notifications toggle */}
            <div className="px-2.5 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Preferences
              </p>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bell size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-medium text-foreground truncate">Notifications</span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="shrink-0 scale-75 origin-right"
                />
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Logout */}
            <div className="p-1">
              <DropdownMenuItem
                className="rounded-lg px-2 py-1.5 text-[11px] gap-2 text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={12} className="shrink-0" />
                <span className="truncate">Log out</span>
              </DropdownMenuItem>
            </div>
          </>
        ) : (
          <div className="p-1">
            <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-[11px] gap-2 cursor-pointer">
              <Link to="/login">
                <LogIn size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">Sign in</span>
              </Link>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
