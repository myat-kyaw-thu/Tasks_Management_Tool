"use client";

import type React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { profileValidation } from "@/lib/controllers/user-profile.controller";
import { cn } from "@/lib/utils";
import {
  STATUS_EMOJIS,
  STATUS_LABELS,
  type SocialLinks,
  type UserProfile,
  type UserStatus,
} from "@/types/user-profile.types";
import { format } from "date-fns";
import { Calendar, LinkIcon, MessageSquare, Save, Upload, User, X } from "lucide-react";
import { useState } from "react";
import { InlineLoadingSpinner } from "../layout/loading-spinner";

interface UserProfileEditorProps {
  profile?: UserProfile | null;
  onClose: () => void;
  className?: string;
}

export function UserProfileEditor({ profile, onClose, className }: UserProfileEditorProps) {
  const { user } = useAuth();
  const { updateProfile, uploadAvatar, checkUsernameAvailability, loading } = useUserProfile();

  const [formData, setFormData] = useState({
    username: profile?.username || "",
    age: profile?.age?.toString() || "",
    bio: profile?.bio || "",
    date_of_birth: profile?.date_of_birth || "",
    status: profile?.status || ("living" as UserStatus),
    social_links: profile?.social_links || ({} as SocialLinks),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (formData.username) {
      const usernameValidation = profileValidation.validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.errors[0];
      } else {
        // Check availability
        const { available } = await checkUsernameAvailability(formData.username);
        if (!available) {
          newErrors.username = "Username is already taken";
        }
      }
    }

    // Age validation
    if (formData.age) {
      const age = Number.parseInt(formData.age);
      if (isNaN(age)) {
        newErrors.age = "Age must be a valid number";
      } else {
        const ageValidation = profileValidation.validateAge(age);
        if (!ageValidation.isValid) {
          newErrors.age = ageValidation.errors[0];
        }
      }
    }

    // Bio validation
    if (formData.bio) {
      const bioValidation = profileValidation.validateBio(formData.bio);
      if (!bioValidation.isValid) {
        newErrors.bio = bioValidation.errors[0];
      }
    }

    // Social links validation
    Object.entries(formData.social_links).forEach(([platform, url]) => {
      if (url && !profileValidation.validateSocialLink(url)) {
        newErrors[`social_${platform}`] = "Please enter a valid URL";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const isValid = await validateForm();
      if (!isValid) return;

      const filteredSocialLinks = Object.fromEntries(
        Object.entries(formData.social_links).filter(([, value]) => typeof value === "string" && value !== undefined),
      ) as Record<string, string>;

      const updates = {
        username: formData.username || null,
        age: formData.age ? Number.parseInt(formData.age) : null,
        bio: formData.bio || null,
        date_of_birth: formData.date_of_birth || null,
        status: formData.status,
        social_links: filteredSocialLinks,
      };

      const result = await updateProfile(updates);
      if (result.success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md mx-auto border-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm",
        "shadow-lg hover:shadow-2xl transition-all duration-500",
        "ring-1 ring-border/50 hover:ring-border/80",
        "max-h-[90vh] overflow-y-auto", // Prevent width overflow, allow vertical scroll
        className,
      )}
    >
      {/* Header with Glassmorphism Effect */}
      <CardHeader className="pb-4  overflow-hidden sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        {/* Background Pattern */}

        <div className="relative flex items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Edit Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <Avatar className="relative h-20 w-20 ring-2 ring-background/80 shadow-xl group-hover:scale-105 transition-transform duration-300">
              <AvatarImage
                src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                alt={formData.username || user?.email || "User"}
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary">
                {formData.username
                  ? formData.username.slice(0, 2).toUpperCase()
                  : user?.email
                    ? getUserInitials(user.email)
                    : "U"}
              </AvatarFallback>
            </Avatar>

            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-full">
                <InlineLoadingSpinner />
              </div>
            )}
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
              disabled={avatarUploading}
            />
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-all duration-300"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Avatar
                </span>
              </Button>
            </Label>
          </div>
        </div>

        {/* Elegant Separator */}
        <div className="relative py-2">
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Basic Info Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 rounded-md bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground/90">Basic Information</span>
          </div>

          <div className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground/90">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className={cn(
                    "pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300",
                    errors.username && "border-destructive/50 focus:border-destructive",
                  )}
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-3 z-10">
                    <InlineLoadingSpinner />
                  </div>
                )}
              </div>
              {errors.username && <p className="text-sm text-destructive font-medium">{errors.username}</p>}
            </div>

            {/* Age and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-foreground/90">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  className={cn(
                    "bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300",
                    errors.age && "border-destructive/50 focus:border-destructive",
                  )}
                  min="13"
                  max="120"
                />
                {errors.age && <p className="text-sm text-destructive font-medium">{errors.age}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-foreground/90">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: UserStatus) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border-border/50">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="focus:bg-primary/10">
                        <div className="flex items-center gap-2">
                          <span>{STATUS_EMOJIS[value as UserStatus]}</span>
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-sm font-medium text-foreground/90">
                Date of Birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300"
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground/90">
                Bio
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className={cn(
                    "pl-10 min-h-[80px] resize-none bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300",
                    errors.bio && "border-destructive/50 focus:border-destructive",
                  )}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {errors.bio && <span className="text-destructive font-medium">{errors.bio}</span>}
                <span className="ml-auto">{formData.bio.length}/500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Separator */}
        <div className="relative py-2">
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Social Links Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <Label className="text-sm font-semibold text-foreground/90">Social Links</Label>
          </div>

          <div className="space-y-4">
            {["twitter", "linkedin", "github", "instagram", "website"].map((platform) => (
              <div key={platform} className="space-y-2">
                <Label htmlFor={platform} className="text-xs font-medium text-muted-foreground capitalize">
                  {platform}
                </Label>
                <Input
                  id={platform}
                  placeholder={`https://${platform === "website" ? "example.com" : `${platform}.com/username`}`}
                  value={formData.social_links[platform] || ""}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  className={cn(
                    "bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300",
                    errors[`social_${platform}`] && "border-destructive/50 focus:border-destructive",
                  )}
                />
                {errors[`social_${platform}`] && (
                  <p className="text-xs text-destructive font-medium">{errors[`social_${platform}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/50 -mx-6 px-6 py-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {saving ? (
              <>
                <InlineLoadingSpinner className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
