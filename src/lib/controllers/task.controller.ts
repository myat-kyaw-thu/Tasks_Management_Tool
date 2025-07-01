import { createClient } from "@/lib/supabase/client";
import type { TaskWithCategory } from "@/lib/supabase/types";


export const taskClient = {
  async getTasks(filters?: {
    completed?: boolean;
    categoryId?: string;
    priority?: string;
    dueDate?: string;
    search?: string;
  }): Promise<{ data: TaskWithCategory[]; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: "User not authenticated" } };
      }

      // OPTIMIZED: Single query with proper joins to prevent N+1
      let query = supabase
        .from("tasks")
        .select(`
        id,
        user_id,
        category_id,
        title,
        description,
        is_completed,
        priority,
        due_date,
        created_at,
        updated_at,
        sort_order,
        completed_at,
        deleted_at,
        category:categories!inner(
          id,
          user_id,
          name,
          color,
          description,
          created_at,
          updated_at
        ),
        subtasks!left(
          id,
          task_id,
          title,
          is_completed,
          sort_order,
          created_at,
          updated_at
        )
      `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      // Apply filters efficiently
      if (filters?.completed !== undefined) {
        query = query.eq("is_completed", filters.completed);
      }

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.priority) {
        query = query.eq("priority", filters.priority as "low" | "medium" | "high");
      }

      if (filters?.dueDate) {
        query = query.eq("due_date", filters.dueDate);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  },
  async getTask(taskId: string): Promise<{ data: TaskWithCategory | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          category:categories(*),
          subtasks(*)
        `)
        .eq("id", taskId)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
};