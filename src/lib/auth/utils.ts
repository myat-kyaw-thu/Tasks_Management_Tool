import { createClient } from "@/lib/supabase/client";
import { createServerClient } from '@supabase/ssr';

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
// Server-side auth utilities
export const authServer = {
  async getUser() {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  async getSession() {
    const supabase = await createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },
};

// Auth validation utilities
export const authValidation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword(password: string): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  },
};
export const authErrors = {
  getErrorMessage(error: any): string {
    if (!error) return "An unexpected error occurred";

    const message = error.message || error.error_description || error.toString();

    // Common Supabase auth error messages
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password. Please check your credentials and try again.",
      "Email not confirmed": "Please check your email and click the confirmation link before signing in.",
      "User not found": "No account found with this email address.",
      "Password should be at least 6 characters": "Password must be at least 6 characters long.",
      "Unable to validate email address: invalid format": "Please enter a valid email address.",
      "Password is too weak": "Please choose a stronger password.",
      "Email address is invalid": "Please enter a valid email address.",
      "User already registered": "An account with this email already exists. Please sign in instead.",
      "Signup is disabled": "New account registration is currently disabled.",
      "Email rate limit exceeded": "Too many emails sent. Please wait before requesting another.",
      "SMS rate limit exceeded": "Too many SMS messages sent. Please wait before requesting another.",
      "Captcha verification failed": "Please complete the captcha verification.",
      "Invalid refresh token": "Your session has expired. Please sign in again.",
      "Token has expired or is invalid": "Your session has expired. Please sign in again.",
    };

    return errorMap[message] || message;
  },

  isNetworkError(error: any): boolean {
    return error?.message?.includes("fetch") || error?.message?.includes("network") || error?.code === "NETWORK_ERROR";
  },

  isRateLimitError(error: any): boolean {
    return error?.message?.includes("rate limit") || error?.message?.includes("too many");
  },

  isValidationError(error: any): boolean {
    return (
      error?.message?.includes("invalid") || error?.message?.includes("format") || error?.message?.includes("required")
    );
  },
};

// Utility function for className concatenation (cn)
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
