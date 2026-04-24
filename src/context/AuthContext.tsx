import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase"; // adjust path to your supabase client
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  // Prevent concurrent fetches — only one in-flight profile request at a time
  const fetchingRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current) return; // ← prevents duplicate requests
    fetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, username, avatar_url, role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setState((prev) => ({ ...prev, profile: data, loading: false }));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setState((prev) => ({ ...prev, profile: null, loading: false }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── Initialize session once on mount ──────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // getSession() uses the cached token — no network call if already valid
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
        }));
        await fetchProfile(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    init();

    // ── Listen for auth state changes (login / logout / token refresh) ──────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
        }));

        // Only re-fetch profile on actual sign-in, not on every token refresh
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          await fetchProfile(session.user.id);
        }
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) await fetchProfile(state.user.id);
  }, [state.user, fetchProfile]);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
