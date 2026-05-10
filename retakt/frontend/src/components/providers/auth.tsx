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

/**
 * Session Validation Helper
 * 
 * Validates if a session is still valid by checking basic requirements.
 * Note: We let Supabase handle token expiration and refresh automatically.
 */
function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  if (!session.access_token || !session.user) return false;
  if (!session.user.id) return false; // User must have an id
  
  // Don't validate expires_at here - let Supabase handle token refresh
  // The expires_at check was causing valid sessions to be cleared prematurely
  return true;
}

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

      // Use the session as-is if it exists - let Supabase handle validation
      const validSession = initialSession;
      const initialUser = validSession?.user ?? null;

      setSession(validSession);
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
        // Properly sign out from Supabase first
        const { error } = await supabase.auth.signOut();
        
        // Only clear storage if signOut was successful or if we need to force clear
        if (!error) {
          return { error: null };
        }
        
        // If signOut failed, force clear local storage as fallback
        try {
          localStorage.removeItem("retakt-auth");
          // Clear Supabase-managed keys only
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("sb-") && key.includes(import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'supabase')) {
              localStorage.removeItem(key);
            }
          });
        } catch (_) {
          // ignore storage errors
        }

        return { error };
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