"use client";

import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(searchParams.get("code") || "");

        if (error) {
          console.error("Auth callback error:", error);
          toast.error("Authentication failed", error.message);
          router.push("/login");
          return;
        }

        if (data.session) {
          toast.success("Welcome!", "You have been signed in successfully.");
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed", "An unexpected error occurred.");
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
