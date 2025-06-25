"use client";


import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

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



export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
