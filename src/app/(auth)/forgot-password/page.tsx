"use client";

import { AuthForm, type AuthFormData } from '@/components/auth/auth-form';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { authErrors } from '@/lib/auth/utils';
import AuthLayout from '../layout';


import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { resetPassword, loading } = useAuth();

  const handleResetPassword = async (data: AuthFormData) => {
    const result = await resetPassword(data.email);

    if (!result.success && result.error) {
      toast.error("Reset failed", authErrors.getErrorMessage({ message: result.error }));
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthLayout>
          <div className="space-y-6">
            <AuthForm mode="reset" onSubmit={handleResetPassword} loading={loading} />

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign in
              </Link>

            </div>
          </div>
        </AuthLayout>
      </div>
    </ProtectedRoute>
  );
}
