"use client";

import { AuthForm, type AuthFormData } from '@/components/auth/auth-form';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { authErrors } from '@/lib/auth/utils';
import AuthLayout from '../layout';


import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function RegisterPage() {
  const { signUp, loading } = useAuth();

  const handleRegister = async (data: AuthFormData) => {
    if (!data.password) return;

    const result = await signUp(data.email, data.password);

    if (!result.success && result.error) {
      toast.error("Registration failed", authErrors.getErrorMessage({ message: result.error }));
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
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign in
              </Link>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </AuthLayout>
      </div>
    </ProtectedRoute>
  );
}
