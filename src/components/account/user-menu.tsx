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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAuth } from "@/hooks/useAuth";

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
    const { error } = await signOut();
    if (!error) {
      setOpen(false);
      navigate("/");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className="outline-none">
        <button
          className="rounded-full border border-border/70 bg-card/70 p-1 text-foreground transition-colors hover:bg-secondary/70"
          aria-label="Open account menu"
        >
          <Avatar className="size-7 border border-border/70">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {isAuthenticated ? initials : <UserCircle2 className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[19rem] rounded-lg border-border/70 bg-card/96 p-0 shadow-xl"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <div className="space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {isAuthenticated ? displayName : "Member access"}
            </p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="mx-0 my-0" />

        {isAuthenticated ? (
          <>
            <DropdownMenuGroup className="p-1.5">
              <DropdownMenuItem asChild className="rounded-md px-3 py-2">
                <Link to="/account">
                  <Settings className="size-4" />
                  Account preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="rounded-md px-3 py-2">
                <Sparkles className="size-4" />
                Feature previews
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem asChild className="rounded-md px-3 py-2">
                  <Link to="/admin">
                    <Shield className="size-4" />
                    Admin dashboard
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="mx-0 my-0" />

            <div className="px-4 py-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Preferences
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/40 px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <Bell className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      Notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Placeholder toggle for future wiring
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>

            <DropdownMenuSeparator className="mx-0 my-0" />

            <div className="p-1.5">
              <DropdownMenuItem
                className="rounded-md px-3 py-2"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </div>
          </>
        ) : (
          <div className="p-1.5">
            <DropdownMenuItem asChild className="rounded-md px-3 py-2">
              <Link to="/login">
                <LogIn className="size-4" />
                Sign in
              </Link>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
