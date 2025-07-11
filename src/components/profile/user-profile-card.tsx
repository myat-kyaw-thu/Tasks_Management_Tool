"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";
import { STATUS_EMOJIS, STATUS_LABELS } from "@/types/user-profile.types";
import { differenceInYears, format } from "date-fns";
import {
  Calendar,
  Check,
  Copy,
  Edit,
  Github,
  Globe,
  Instagram,
  Link,
  Linkedin,
  Mail,
  MessageSquare,
  Sparkles,
  Twitter,
  User,
} from "lucide-react";
import { useState } from "react";
import { UserProfileEditor } from "./user-profile-editor";

interface UserProfileCardProps {
  className?: string;
}

export function UserProfileCard({ className }: UserProfileCardProps) {
  const { user } = useAuth();
  const { profile, loading, error } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async () => {
    if (user?.email) {
      try {
        await navigator.clipboard.writeText(user.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } catch (error) {
        console.error("Failed to copy email:", error);
      }
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full border-0 bg-gradient-to-br from-background via-background to-muted/20", className)}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-muted/50 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent animate-spin" />
            </div>
            <div className="space-y-2 text-center">
              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    const errorMsg = error ? (typeof error === "string" ? error : "Failed to load profile") : "Profile not found";

    return (
      <Card className={cn("w-full border-0 bg-gradient-to-br from-background via-background to-muted/20", className)}>
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="relative mx-auto w-fit">
              <div className="rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 p-6 backdrop-blur-sm">
                <User className="h-8 w-8 text-muted-foreground mx-auto" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="h-4 w-4 rounded-full bg-amber-400/80 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                No Profile Found
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{errorMsg}</p>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {profile ? "Edit Profile" : "Create Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
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

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), new Date(dateOfBirth));
    } catch {
      return null;
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return Github;
      case "twitter":
        return Twitter;
      case "linkedin":
        return Linkedin;
      case "instagram":
        return Instagram;
      case "website":
        return Globe;
      default:
        return Link;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200 dark:hover:bg-slate-900/50 dark:hover:text-slate-100 dark:hover:border-slate-700";
      case "twitter":
        return "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 dark:hover:border-blue-800";
      case "linkedin":
        return "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 dark:hover:border-blue-800";
      case "instagram":
        return "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 dark:hover:bg-pink-950/50 dark:hover:text-pink-400 dark:hover:border-pink-800";
      case "website":
        return "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 dark:hover:border-emerald-800";
      default:
        return "hover:bg-muted/80 hover:border-muted-foreground/20";
    }
  };

  // Show editor if editing
  if (isEditing) {
    const profileWithTypedStatus = profile
      ? { ...profile, status: profile.status as import("@/types/user-profile.types").UserStatus }
      : profile;
    return (
      <UserProfileEditor profile={profileWithTypedStatus} onClose={() => setIsEditing(false)} className={className} />
    );
  }

  const displayAge = profile.age || (profile.date_of_birth ? calculateAge(profile.date_of_birth) : null);
  const socialLinks = Object.entries(profile.social_links || {}).filter(([_, url]) => url && url.trim());
  const displayName = profile.username || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "w-full border-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm",
          "shadow-lg transition-all duration-500 ",
          "ring-1 ring-border/50 hover:ring-border/80",
          className,
        )}
      >
        {/* Header with Glassmorphism Effect */}
        <CardHeader className="pb-4 relative overflow-hidden">

          <div className="relative space-y-4">
            {/* Avatar and Basic Info Row */}
            <div className="flex items-start gap-4">
              {/* Enhanced Avatar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
                <Avatar className="relative h-16 w-16 ring-2 ring-background/80 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <AvatarImage
                    src={profile.avatar_url || user?.user_metadata?.avatar_url}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary">
                    {profile.username
                      ? profile.username.slice(0, 2).toUpperCase()
                      : user?.email
                        ? getUserInitials(user.email)
                        : "U"}
                  </AvatarFallback>
                </Avatar>
                {profile.status && (
                  <div className="absolute -bottom-1 -right-1 animate-bounce">
                    <Badge variant="secondary" className="text-xs px-2 py-1 shadow-lg border-2 border-background">
                      {STATUS_EMOJIS[profile.status as import("@/types/user-profile.types").UserStatus]}
                    </Badge>
                  </div>
                )}
              </div>

              {/* User Info - Flexible Layout */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-bold text-lg leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent cursor-help line-clamp-2 break-words">
                        {displayName}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-medium">{displayName}</p>
                    </TooltipContent>
                  </Tooltip>

                  {profile.status && (
                    <Badge variant="outline" className="text-xs font-medium bg-background/50 backdrop-blur-sm">
                      {STATUS_LABELS[profile.status as import("@/types/user-profile.types").UserStatus]}
                    </Badge>
                  )}
                </div>

                {/* Email Row */}
                <div className="flex items-center gap-2 group/email">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground cursor-help flex-1 min-w-0 truncate">
                        {userEmail}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-mono text-xs">{userEmail}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="h-6 w-6 p-0 opacity-0 group-hover/email:opacity-100 transition-all duration-200 hover:bg-primary/10 flex-shrink-0"
                  >
                    {copiedEmail ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Age Info */}
                {displayAge && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">{displayAge} years old</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button - Positioned Absolutely to Prevent Overflow */}
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="font-medium">Edit Profile</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6 pt-2">
          {/* Bio Section */}
          {profile.bio && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">About</span>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl" />
                <div className="relative bg-muted/20 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                    {profile.bio}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date of Birth */}
          {profile.date_of_birth && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/30 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-foreground/90 font-medium">
                Born {format(new Date(profile.date_of_birth), "MMMM d, yyyy")}
              </span>
            </div>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10">
                  <Link className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">Connect</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {socialLinks.map(([platform, url]) => {
                  const IconComponent = getSocialIcon(platform);
                  const colorClass = getSocialColor(platform);
                  return (
                    <Tooltip key={platform}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-10 justify-start gap-2.5 transition-all duration-300 backdrop-blur-sm",
                            "border-border/50 bg-background/50 hover:shadow-md hover:scale-[1.02]",
                            colorClass,
                          )}
                          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                        >
                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs capitalize truncate font-medium">{platform}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">Visit {platform}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Elegant Separator */}
          <div className="relative py-2">
            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Profile Stats */}
          <div className="space-y-2 text-center">
            <div className="text-xs text-muted-foreground/80 font-medium">
              Member since {format(new Date(profile.created_at), "MMM d, yyyy")}
            </div>
            {profile.updated_at !== profile.created_at && (
              <div className="text-xs text-muted-foreground/60">
                Last updated {format(new Date(profile.updated_at), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
