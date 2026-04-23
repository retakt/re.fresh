import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: Profile["role"] | "guest";
  isAdmin: boolean;
  isEditor: boolean;
  canManageEditorial: boolean;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<{
    data: unknown;
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const NOTIFICATIONS_KEY = "re.takt.notifications.enabled";

function getDisplayName(user: User | null, profile: Profile | null) {
  const profileName = profile?.username?.trim();
  const metadataName =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

  const emailSource = profile?.email ?? user?.email ?? null;
  const fallbackName = emailSource ? emailSource.split("@")[0] : "Login";
  return profileName || metadataName?.trim() || fallbackName;
}

function getInitials(value: string) {
  const parts = value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "RT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]).join("").toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? stored === "true" : true;
  });

  const fetchProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, avatar_url, role, created_at")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      NOTIFICATIONS_KEY,
      notificationsEnabled ? "true" : "false",
    );
  }, [notificationsEnabled]);

  useEffect(() => {
    let active = true;

    const syncSession = async (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null;

      if (!active) return;
      setSession(nextSession);
      setUser(nextUser);
      await fetchProfile(nextUser);
      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const displayName = getDisplayName(user, profile);

    return {
      user,
      session,
      profile,
      loading,
      isAuthenticated: !!user,
      role: profile?.role ?? "guest",
      isAdmin: profile?.role === "admin",
      isEditor: profile?.role === "editor",
      canManageEditorial:
        profile?.role === "admin" || profile?.role === "editor",
      displayName,
      initials: getInitials(displayName),
      avatarUrl: profile?.avatar_url ?? null,
      notificationsEnabled,
      setNotificationsEnabled,
      signIn: async (identifier: string, password: string) => {
        const emailOrUsername = identifier.trim();
        let resolvedEmail = emailOrUsername;

        if (emailOrUsername && !emailOrUsername.includes("@")) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-login-identifier`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ identifier: emailOrUsername }),
            },
          );

          if (response.ok) {
            const result = await response.json().catch(() => null);
            if (result?.resolvedEmail) {
              resolvedEmail = result.resolvedEmail;
            }
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });
        return { data, error: error ?? null };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error: error ?? null };
      },
      refreshProfile: async () => {
        await fetchProfile(user);
      },
    };
  }, [loading, notificationsEnabled, profile, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
