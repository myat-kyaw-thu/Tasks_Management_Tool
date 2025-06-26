"use client";


import { createClient } from "@/lib/supabase/client";
import { type Session, type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'sonner';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string; }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string; }>;
  // Extended methods for debugging and validation
  refreshSession: () => Promise<{ success: boolean; error?: string; }>;
  validateSession: () => Promise<boolean>;
  getAccessToken: () => string | null;
  debugAuthState: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  // Create stable supabase instance
  const supabase = useMemo(() => createClient(), []);
  const isAuthenticated = useMemo(() => {
    return !!(user && session && session.access_token);
  }, [user, session]);
  useEffect(() => {
    if (initialized.current) return;

    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Debug log for initial session
          console.log("Initial session loaded:", {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
          });
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Debug log for auth state changes
        console.log("Auth state changed:", {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
        });

        if (event === "SIGNED_IN") {
          router.push("/dashboard");
          toast.success("Welcome back!", "You have been signed in successfully.");
        } else if (event === "SIGNED_OUT") {
          router.push("/auth/login");
          toast.info("Signed out", "You have been signed out successfully.");
        } else if (event === "PASSWORD_RECOVERY") {
          router.push("/auth/reset-password");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }
      }
    });

    initialized.current = true;

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);
  const authAciton = useMemo(() => ({
    signUp: async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user && !data.session) {
          toast.info(
            "Check your email",
            "We've sent you a confirmation link. Please check your email to complete your registration.",
          );
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
  }));
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
