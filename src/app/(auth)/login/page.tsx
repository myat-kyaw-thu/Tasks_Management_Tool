"use client";

import { AuthForm, type AuthFormData } from '@/components/auth/auth-form';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { authErrors } from '@/lib/auth/utils';
import AuthLayout from '../layout';

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { signIn, signInWithMagicLink, loading } = useAuth();
  const [showMagicLink, setShowMagicLink] = useState(false);

  const handleLogin = async (data: AuthFormData) => {
    if (!data.password) return;

    const result = await signIn(data.email, data.password);

    if (!result.success && result.error) {
      toast.error("Sign in failed", authErrors.getErrorMessage({ message: result.error }));
    }
  };

  const handleMagicLink = async (data: AuthFormData) => {
    const result = await signInWithMagicLink(data.email);

    if (!result.success && result.error) {
      toast.error("Magic link failed", authErrors.getErrorMessage({ message: result.error }));
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthLayout>
          <div className="space-y-6">
            <AuthForm
              mode={showMagicLink ? "magic-link" : "login"}
              onSubmit={showMagicLink ? handleMagicLink : handleLogin}
              loading={loading}
            />

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowMagicLink(!showMagicLink)}
                disabled={loading}
              >
                {showMagicLink ? "Sign in with password" : "Sign in with magic link"}
              </Button>
            </div>

            <div className="space-y-4 text-center text-sm">
              <div>
                <Link href="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                  Forgot your password?
                </Link>
              </div>
              <div className="text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </AuthLayout>
      </div>
    </ProtectedRoute>
  );
}
