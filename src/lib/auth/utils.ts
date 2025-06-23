import { createClient } from "@/lib/supabase/client";

// Client-side auth utilities
export const authClient = {
  async signUp(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    return { data, error };
  },
  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  async signInWithMagicLink(email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    return { data, error };
  },
  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  async resetPassword(email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },
  async updatePassword(password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },
  async resendConfirmation(email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    return { data, error };
  },

  async getUser() {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  async getSession() {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },
};