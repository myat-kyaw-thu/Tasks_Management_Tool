import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/database.types";

export const userProfileClient = {
  async getProfile(userId?: string): Promise<{ data: UserProfile | null; error: any; }> {
    const supabase = createClient();

    try {
      let query = supabase.from("user_profiles").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        // Get current user's profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { data: null, error: { message: "User not authenticated" } };
        }
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createProfile(profile: any): Promise<{ data: any | null; error: any; }> {
    const supabase = createClient();

    try {
      // Only send fields that exist in the DB schema
      const allowedProfile = {
        user_id: profile.user_id,
        username: profile.username ?? null,
        email_notifications: profile.email_notifications ?? true,
        daily_digest: profile.daily_digest ?? false,
        reminder_hours: profile.reminder_hours ?? 24,
      };

      const { data, error } = await supabase.from("user_profiles").insert(allowedProfile).select().single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateProfile(updates: any): Promise<{ data: any | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      // Only send fields that exist in the DB schema
      const allowedUpdates: any = {};
      if ('username' in updates) allowedUpdates.username = updates.username;
      if ('age' in updates) allowedUpdates.age = updates.age;
      if ('bio' in updates) allowedUpdates.bio = updates.bio;
      if ('date_of_birth' in updates) allowedUpdates.date_of_birth = updates.date_of_birth;
      if ('avatar_url' in updates) allowedUpdates.avatar_url = updates.avatar_url;
      if ('social_links' in updates) allowedUpdates.social_links = updates.social_links;
      if ('status' in updates) allowedUpdates.status = updates.status;
      if ('email_notifications' in updates) allowedUpdates.email_notifications = updates.email_notifications;
      if ('daily_digest' in updates) allowedUpdates.daily_digest = updates.daily_digest;
      if ('task_reminders' in updates) allowedUpdates.task_reminders = updates.task_reminders;
      if ('reminder_hours' in updates) allowedUpdates.reminder_hours = updates.reminder_hours;

      const { data, error } = await supabase
        .from("user_profiles")
        .update(allowedUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteProfile(): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "User not authenticated" } };
      }

      const { error } = await supabase.from("user_profiles").delete().eq("user_id", user.id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  async checkUsernameAvailability(
    username: string,
    excludeUserId?: string,
  ): Promise<{ available: boolean; error: any; }> {
    const supabase = createClient();

    try {
      let query = supabase.from("user_profiles").select("id").eq("username", username);

      if (excludeUserId) {
        query = query.neq("user_id", excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        return { available: false, error };
      }

      return { available: !data || data.length === 0, error: null };
    } catch (error) {
      return { available: false, error };
    }
  },

  async uploadAvatar(file: File): Promise<{ url: string | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { url: null, error: { message: "User not authenticated" } };
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return { url: null, error: { message: "Invalid file type. Please upload an image file." } };
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { url: null, error: { message: "File too large. Please upload an image smaller than 5MB." } };
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage.from("user-uploads").list(user.id, {
        search: "avatar-",
      });

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `${user.id}/${file.name}`);
        await supabase.storage.from("user-uploads").remove(filesToDelete);
      }

      // Upload new avatar
      const { data, error } = await supabase.storage.from("user-uploads").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        return { url: null, error };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("user-uploads").getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error };
    }
  },
};

// Profile validation utilities
export const profileValidation = {
  validateUsername(username: string): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];
    if (!username || username.trim().length === 0) {
      errors.push("Username is required");
    } else {
      if (username.length < 3) {
        errors.push("Username must be at least 3 characters long");
      }
      if (username.length > 50) {
        errors.push("Username must be less than 50 characters");
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push("Username can only contain letters, numbers, underscores, and hyphens");
      }
    }
    return { isValid: errors.length === 0, errors };
  },

  validateAge(age: number): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];
    if (isNaN(age)) {
      errors.push("Age must be a valid number");
    } else {
      if (age < 13) {
        errors.push("Age must be at least 13");
      }
      if (age > 120) {
        errors.push("Age must be less than 120");
      }
    }
    return { isValid: errors.length === 0, errors };
  },

  validateBio(bio: string): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];
    if (bio && bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }
    return { isValid: errors.length === 0, errors };
  },

  validateSocialLink(url: string): boolean {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};
