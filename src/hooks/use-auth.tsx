"use client";

import type React from "react";

import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

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
  refreshSession: () => Promise<{ success: boolean; error?: string; }>;
  validateSession: () => Promise<boolean>;
  getAccessToken: () => string | null;
  debugAuthState: () => void;
  clearAuthStorage: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Create stable supabase instance
  const supabase = useMemo(() => createClient(), []);

  // Computed authentication state
  const isAuthenticated = useMemo(() => {
    return !!(user && session && session.access_token);
  }, [user, session]);

  // FIX: Define clearAuthStorage as useCallback so it can be called from anywhere
  const clearAuthStorage = useCallback(async () => {
    try {
      console.log("Clearing auth storage...");

      // Clear Supabase auth cookies
      const urlKey = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "supabase";

      // Clear cookies
      document.cookie = `sb-${urlKey}-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `sb-${urlKey}-auth-token-code-verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

      // Clear any other Supabase auth cookies
      document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();
        if (cookieName.startsWith(`sb-${urlKey}`) && cookieName.includes("auth")) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      // Clear localStorage entries as backup
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`sb-${urlKey}`) && key.includes("auth")) {
          localStorage.removeItem(key);
        }
      });

      // Then sign out to ensure complete cleanup
      await supabase.auth.signOut();

      console.log("Auth storage cleared successfully");
    } catch (error) {
      console.error("Error clearing auth storage:", error);
    }
  }, [supabase]);

  useEffect(() => {
    if (initialized.current) return;

    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
          // FIX: Call clearAuthStorage when session retrieval fails
          await clearAuthStorage();
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

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
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
        setSession(session);
        setUser(session?.user ?? null);
        return;
      }

      if (event === "SIGNED_OUT" && session === null) {
        console.log("Signed out - possibly due to token refresh failure");
        setSession(null);
        setUser(null);
        setLoading(false);
        setTimeout(() => {
          if (mounted) {
            router.push("/auth/login");
            toast.info("Session expired", "Please sign in again.");
          }
        }, 100);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      console.log("Auth state changed:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
      });

      if (event === "SIGNED_IN") {
        setTimeout(() => {
          if (mounted) {
            router.push("/dashboard");
            toast.success("Welcome back!", "You have been signed in successfully.");
          }
        }, 100);
      } else if (event === "SIGNED_OUT") {
        setTimeout(() => {
          if (mounted) {
            router.push("/auth/login");
            toast.info("Signed out", "You have been signed out successfully.");
          }
        }, 100);
      } else if (event === "PASSWORD_RECOVERY") {
        setTimeout(() => {
          if (mounted) {
            router.push("/auth/reset-password");
          }
        }, 100);
      }
    });

    cleanupRef.current = () => {
      mounted = false;
      subscription.unsubscribe();
    };

    initialized.current = true;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [supabase.auth, router, clearAuthStorage]);

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
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Sign out error:", error);
            toast.error("Error signing out", error.message);
          }
        } catch (error: any) {
          console.error("Sign out error:", error);
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

      refreshSession: async () => {
        try {
          console.log("Attempting to refresh session...");
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error("Session refresh failed:", error);
            // FIX: Clear storage on specific refresh token errors
            if (error.message.includes("refresh_token_not_found") || error.message.includes("invalid_grant")) {
              await clearAuthStorage();
            }
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
    [supabase.auth, session, user, loading, isAuthenticated, clearAuthStorage],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated,
      clearAuthStorage,
      ...authActions,
    }),
    [user, session, loading, isAuthenticated, clearAuthStorage, authActions],
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
