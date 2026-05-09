import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell, LogIn, LogOut, Settings, Shield, Sparkles, UserCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "@base-ui/react/menu";
import { motion, AnimatePresence } from "motion/react";

export default function UserMenu() {
  const navigate = useNavigate();
  const {
    isAuthenticated, displayName, initials, avatarUrl,
    user, profile, signOut, notificationsEnabled, setNotificationsEnabled,
  } = useAuth();

  const [open, setOpen] = useState(false);

  const email = profile?.email ?? user?.email ?? "Not signed in";

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    window.location.replace("/");
  };

  const itemCls = "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-left outline-none cursor-pointer transition-colors hover:bg-secondary data-[highlighted]:bg-secondary";
  const destructiveCls = "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-left outline-none cursor-pointer transition-colors text-destructive hover:bg-destructive/10 data-[highlighted]:bg-destructive/10";

  return (
    <>
      {/* Backdrop — portalled to body so it escapes navbar's stacking context */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 bottom-0 top-14 z-[9998] backdrop-blur-[2px] bg-black/10"
              onPointerDown={() => setOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      <Menu.Root modal={false} open={open} onOpenChange={setOpen}>
        <Menu.Trigger
          className="rounded-full border border-border/70 bg-card/70 p-1 text-foreground outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 relative z-[9999]"
          aria-label="Open account menu"
        >
          <Avatar className="size-9 border border-border/70">
            {isAuthenticated && avatarUrl && (
              <AvatarImage src={avatarUrl} alt={displayName} loading="lazy" />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-semibold">
              {isAuthenticated ? initials : <UserCircle2 size={20} strokeWidth={2} />}
            </AvatarFallback>
          </Avatar>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            positionMethod="absolute"
            className="outline-none z-[9999]"
          >
            <Menu.Popup
              render={
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 12,
                    mass: 0.5,
                  }}
                />
              }
              className="w-44 rounded-xl border border-border/70 bg-card p-0 shadow-lg overflow-hidden origin-top-right"
            >
              {/* Header */}
              <div className="px-2.5 py-2 border-b border-border/50">
                <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                  {isAuthenticated ? displayName : "Member access"}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                  {isAuthenticated ? email : "Not signed in"}
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="p-1">
                    <Menu.Item className={itemCls} onClick={() => { setOpen(false); navigate("/account"); }}>
                      <Settings size={12} className="text-muted-foreground shrink-0" />
                      <span className="truncate">Account</span>
                    </Menu.Item>
                    <Menu.Item className={itemCls} disabled>
                      <Sparkles size={12} className="text-muted-foreground shrink-0 opacity-50" />
                      <span className="truncate opacity-50">Feature previews</span>
                    </Menu.Item>
                    {profile?.role === "admin" && (
                      <Menu.Item className={itemCls} onClick={() => { setOpen(false); navigate("/admin"); }}>
                        <Shield size={12} className="text-muted-foreground shrink-0" />
                        <span className="truncate">Admin panel</span>
                      </Menu.Item>
                    )}
                    {profile?.role === "editor" && (
                      <Menu.Item className={itemCls} onClick={() => { setOpen(false); navigate("/editor"); }}>
                        <Shield size={12} className="text-muted-foreground shrink-0" />
                        <span className="truncate">Editor panel</span>
                      </Menu.Item>
                    )}
                  </div>

                  <div className="border-t border-border/50" />

                  <div className="px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Preferences
                    </p>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Bell size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[13px] font-medium text-foreground truncate">Notifications</span>
                      </div>
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        className="shrink-0 scale-75 origin-right"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/50" />

                  <div className="p-1">
                    <Menu.Item className={destructiveCls} onClick={handleLogout}>
                      <LogOut size={12} className="shrink-0" />
                      <span className="truncate">Log out</span>
                    </Menu.Item>
                  </div>
                </>
              ) : (
                <div className="p-1">
                  <Menu.Item className={itemCls} onClick={() => { setOpen(false); navigate("/login"); }}>
                    <LogIn size={12} className="text-muted-foreground shrink-0" />
                    <span className="truncate">Sign in</span>
                  </Menu.Item>
                </div>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </>
  );
}
