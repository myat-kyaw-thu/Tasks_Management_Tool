"use client";

import { AuthFormData, AuthForm } from '@/components/auth/auth-form';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { authErrors } from '@/lib/auth/utils';
import Link from "next/link";
import { useEffect } from "react";
import AuthLayout from '../layout';

export default function RegisterPage() {
  const { signUp, loading } = useAuth();

  useEffect(() => {
    // Handle extension context invalidation errors
    const handleExtensionError = (event: ErrorEvent) => {
      if (event.message?.includes("Extension context invalidated")) {
        console.warn("Browser extension conflict detected on register page, continuing normally");
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes("Extension context invalidated")) {
        console.warn("Extension promise rejection handled");
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleExtensionError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleExtensionError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const handleRegister = async (data: AuthFormData) => {
    try {
      if (!data.password) {
        toast({
          title: "Error",
          description: "Password is required",

        });
        return;
      }

      if (!data.name?.trim()) {
        toast({
          title: "Error",
          description: "Name is required",

        });
        return;
      }

      const result = await signUp(data.email, data.password);

      if (!result.success && result.error) {
        toast({
          title: "Registration failed",
          description: authErrors.getErrorMessage({ message: result.error }),

        });
      } else if (result.success) {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Don't show extension-related errors to users
      if (error instanceof Error && error.message.includes("Extension context invalidated")) {
        console.warn("Extension error during registration, ignoring");
        return;
      }

      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",

      });
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthLayout>
          <div className="space-y-6">
            <AuthForm mode="register" onSubmit={handleRegister} loading={loading} />

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
                onClick={(e) => {
                  try {
                    // Prevent extension interference with navigation
                    e.stopPropagation();
                  } catch (error) {
                    // Ignore extension errors
                  }
                }}
              >
                Sign in
              </Link>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => {
                  try {
                    e.stopPropagation();
                  } catch (error) {
                    // Ignore extension errors
                  }
                }}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => {
                  try {
                    e.stopPropagation();
                  } catch (error) {
                    // Ignore extension errors
                  }
                }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </AuthLayout>
      </div>
    </ProtectedRoute>
  );
}
