import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryColor, CategoryInsert, CategoryUpdate } from "@/lib/supabase/types";


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
  async getCategory(categoryId: string): Promise<{ data: Category | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async createCategory(category: Omit<CategoryInsert, "user_id">): Promise<{ data: Category | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async updateCategory(categoryId: string, updates: CategoryUpdate): Promise<{ data: Category | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", categoryId)
        .eq("user_id", user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async deleteCategory(categoryId: string): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "User not authenticated" } };
      }

      // First, update all tasks with this category to have no category
      await supabase.from("tasks").update({ category_id: null }).eq("category_id", categoryId).eq("user_id", user.id);

      // Then delete the category
      const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", user.id);

      return { error };
    } catch (error) {
      return { error };
    }
  },
  async getCategoriesWithTaskCount(): Promise<{ data: (Category & { task_count: number; })[]; error: any; }> {
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
        .select(`
          *,
          tasks!inner(count)
        `)
        .eq("user_id", user.id)
        .eq("tasks.user_id", user.id)
        .is("tasks.deleted_at", null);

      if (error) {
        return { data: [], error };
      }

      const categoriesWithCount = data.map((category: any) => ({
        ...category,
        task_count: category.tasks?.[0]?.count || 0,
      }));

      return { data: categoriesWithCount, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },
};
export const categoryValidation = {
  validateCategory(category: Partial<CategoryInsert>): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];

    if (!category.name || category.name.trim().length === 0) {
      errors.push("Category name is required");
    } else if (category.name.length > 100) {
      errors.push("Category name must be less than 100 characters");
    }

    if (category.description && category.description.length > 500) {
      errors.push("Category description must be less than 500 characters");
    }

    const validColors: CategoryColor[] = [
      "blue",
      "green",
      "yellow",
      "red",
      "purple",
      "pink",
      "indigo",
      "gray",
      "orange",
      "teal",
    ];
    if (category.color && !validColors.includes(category.color)) {
      errors.push("Invalid category color");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};