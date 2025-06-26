"use client";

import type React from "react";

import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

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

  // Computed authentication state
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

    getInitialSession();

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

  // Stable functions that don't change reference
  const authActions = useMemo(
    () => ({
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

      signInWithMagicLink: async (email: string) => {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          toast.info("Check your email", "We've sent you a magic link. Click the link in your email to sign in.");
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      },

      signOut: async () => {
        try {
          setLoading(true);
          await supabase.auth.signOut();
        } catch (error: any) {
          toast.error("Error signing out", error.message);
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (email: string) => {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          toast.info("Check your email", "We've sent you a password reset link. Check your email to continue.");
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      },

      updatePassword: async (password: string) => {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.updateUser({
            password,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          toast.success("Password updated", "Your password has been updated successfully.");
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      },

      resendConfirmation: async (email: string) => {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.resend({
            type: "signup",
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          toast.info("Email sent", "We've sent you a new confirmation link. Check your email.");
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      },

      // Extended methods for debugging and session management
      refreshSession: async () => {
        try {
          console.log("Attempting to refresh session...");
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error("Session refresh failed:", error);
            return { success: false, error: error.message };
          }

          console.log("Session refreshed successfully:", {
            hasSession: !!data.session,
            hasUser: !!data.user,
            expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000) : null,
          });

          return { success: true };
        } catch (error: any) {
          console.error("Session refresh error:", error);
          return { success: false, error: error.message };
        }
      },

      validateSession: async () => {
        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            console.error("Session validation failed:", error);
            return false;
          }

          const isValid = !!user;
          console.log("Session validation result:", {
            isValid,
            userId: user?.id,
            email: user?.email,
          });

          return isValid;
        } catch (error) {
          console.error("Session validation error:", error);
          return false;
        }
      },

      getAccessToken: () => {
        const token = session?.access_token || null;
        console.log("Access token requested:", {
          hasToken: !!token,
          tokenLength: token?.length,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
        });
        return token;
      },

      debugAuthState: () => {
        console.group("🔍 Auth State Debug");
        console.log("User:", user);
        console.log("Session:", session);
        console.log("Loading:", loading);
        console.log("Is Authenticated:", isAuthenticated);
        console.log("Access Token:", session?.access_token ? "Present" : "Missing");
        console.log("Token Expires:", session?.expires_at ? new Date(session.expires_at * 1000) : "N/A");
        console.log("User ID:", user?.id);
        console.log("User Email:", user?.email);
        console.log("User Confirmed:", user?.email_confirmed_at ? "Yes" : "No");
        console.groupEnd();
      },
    }),
    [supabase.auth, session, user, loading, isAuthenticated],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated,
      ...authActions,
    }),
    [user, session, loading, isAuthenticated, authActions],
  );

  return <AuthContext.Provider value={value}> {children} </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
