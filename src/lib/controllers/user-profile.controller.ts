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

};
