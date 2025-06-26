"use client";


import { createClient, type Session, type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useRef, useState } from "react";
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

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
