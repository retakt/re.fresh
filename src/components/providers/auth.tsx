import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
};

// ─── Events that should trigger a profile (re-)fetch ─────────────────────────
// INITIAL_SESSION is handled by getSession() directly — not via the listener.
const PROFILE_FETCH_EVENTS = new Set<AuthChangeEvent>([
  "SIGNED_IN",
  "USER_UPDATED",
]);

// TOKEN_REFRESHED only re-fetches if profile was lost (e.g. after inactivity)
const PROFILE_RECOVERY_EVENTS = new Set<AuthChangeEvent>([
  "TOKEN_REFRESHED",
]);

const AuthContext = createContext<AuthContextValue | null>(null);
const NOTIFICATIONS_KEY = "re.takt.notifications.enabled";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// ─── Provider ─────────────────────────────────────────────────────────────────

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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, username, avatar_url, role, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.error("[auth] fetchProfile error", error);
        return null;
      }
      return data;
    } catch (e) {
      console.error("[auth] fetchProfile threw", e);
      return null;
    }
  }, []);

  // Persist notification preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      NOTIFICATIONS_KEY,
      notificationsEnabled ? "true" : "false",
    );
  }, [notificationsEnabled]);

  useEffect(() => {
    let mounted = true;

    // ── Step 1: Eagerly load the session from storage so we never flash
    //    "logged out" on hard refresh while waiting for the listener.
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      const initialUser = initialSession?.user ?? null;
      setSession(initialSession);
      setUser(initialUser);

      if (initialUser) {
        const data = await fetchProfile(initialUser.id);
        if (mounted) setProfile(data);
      }

      if (mounted) setLoading(false);
    });

    // ── Step 2: Listen for subsequent auth changes (sign in, sign out,
    //    token refresh, etc.) — but never touch `loading` again after init.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, nextSession: Session | null) => {
        if (!mounted) return;

        const nextUser = nextSession?.user ?? null;
        setSession(nextSession);
        setUser(nextUser);

        if (!nextUser || event === "SIGNED_OUT") {
          setProfile(null);
          return;
        }

        if (PROFILE_FETCH_EVENTS.has(event)) {
          const data = await fetchProfile(nextUser.id);
          if (mounted) setProfile(data);
          return;
        }

        // TOKEN_REFRESHED: only re-fetch if profile was lost (inactivity recovery)
        if (PROFILE_RECOVERY_EVENTS.has(event)) {
          setProfile((current) => {
            if (current === null) {
              fetchProfile(nextUser.id).then((data) => {
                if (mounted) setProfile(data);
              });
            }
            return current;
          });
        }
      },
    );

    // Hard safety — never hang longer than 10s
    const safety = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10_000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
        // Best-effort Supabase signOut — ignore errors
        try {
          await supabase.auth.signOut();
        } catch (_) {
          // ignore
        }

        // Force-clear all auth storage regardless of Supabase result
        try {
          // Clear the specific Supabase session key
          localStorage.removeItem("retakt-auth");
          // Wipe any other Supabase-related keys
          Object.keys(localStorage).forEach((key) => {
            if (
              key.startsWith("sb-") ||
              key.startsWith("supabase") ||
              key.includes("retakt-auth")
            ) {
              localStorage.removeItem(key);
            }
          });
          sessionStorage.clear();
          // Clear all cookies for this domain
          document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          });
        } catch (_) {
          // ignore storage errors
        }

        return { error: null };
      },
      refreshProfile: async () => {
        if (!user) return;
        const data = await fetchProfile(user.id);
        setProfile(data);
      },
    };
  }, [fetchProfile, loading, notificationsEnabled, profile, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}