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


};
