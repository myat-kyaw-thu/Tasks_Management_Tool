import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/supabase/types";


export const categoryClient = {
  async getCategories(): Promise<{ data: Category[]; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  },

};