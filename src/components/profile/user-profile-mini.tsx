"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";
import { STATUS_EMOJIS, STATUS_LABELS } from "@/types/user-profile.types";

interface UserProfileMiniProps {
  className?: string;
}

export function UserProfileMini({ className }: UserProfileMiniProps) {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  if (loading || !profile) {
    return (
      <div className={cn("flex items-center gap-2.5 px-2 py-1.5", className)}>
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
          <div className="h-2 bg-muted rounded animate-pulse w-12" />
        </div>
      </div>
    );
  }

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const displayName = profile.username || user?.email?.split("@")[0] || "User";

  return (
    <div className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg border bg-card/50", className)}>
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile.avatar_url || user?.user_metadata?.avatar_url} alt={displayName} />
          <AvatarFallback className="text-xs font-medium">
            {profile.username
              ? profile.username.slice(0, 2).toUpperCase()
              : user?.email
                ? getUserInitials(user.email)
                : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background border border-border flex items-center justify-center">
          <span className="text-[8px] leading-none">{STATUS_EMOJIS[profile.status as keyof typeof STATUS_EMOJIS]}</span>
        </div>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate leading-tight">{displayName}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal w-fit mt-0.5">
          {STATUS_LABELS[profile.status as keyof typeof STATUS_LABELS]}
        </Badge>
      </div>
    </div>
  );
}
