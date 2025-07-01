import { createClient } from "@/lib/supabase/client";
import type { TaskInsert, TaskUpdate, TaskWithCategory } from "@/lib/supabase/types";


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
  async createTask(task: Omit<TaskInsert, "user_id">): Promise<{ data: TaskWithCategory | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      // Get the highest sort_order for this user
      const { data: lastTask } = await supabase
        .from("tasks")
        .select("sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const newSortOrder = (lastTask?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          user_id: user.id,
          sort_order: newSortOrder,
        })
        .select(`
            *,
            category:categories(*),
            subtasks(*)
          `)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async updateTask(taskId: string, updates: TaskUpdate): Promise<{ data: TaskWithCategory | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      // If completing a task, set completed_at timestamp
      if (updates.is_completed === true && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      } else if (updates.is_completed === false) {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .eq("user_id", user.id)
        .select(`
            *,
            category:categories(*),
            subtasks(*)
          `)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async deleteTask(taskId: string, permanent = false): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "User not authenticated" } };
      }

      if (permanent) {
        // Permanently delete the task
        const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);

        return { error };
      } else {
        // Soft delete by setting deleted_at timestamp
        const { error } = await supabase
          .from("tasks")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", taskId)
          .eq("user_id", user.id);

        return { error };
      }
    } catch (error) {
      return { error };
    }
  },
  async duplicateTask(taskId: string): Promise<{ data: TaskWithCategory | null; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      // Get the original task
      const { data: originalTask, error: fetchError } = await this.getTask(taskId);
      if (fetchError || !originalTask) {
        return { data: null, error: fetchError || { message: "Task not found" } };
      }

      // Create a copy of the task
      const taskCopy: Omit<TaskInsert, "user_id"> = {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        category_id: originalTask.category_id,
        priority: originalTask.priority,
        due_date: originalTask.due_date,
        is_completed: false,
        completed_at: null,
      };

      return await this.createTask(taskCopy);
    } catch (error) {
      return { data: null, error };
    }
  },
  async toggleTaskCompletion(taskId: string): Promise<{ data: TaskWithCategory | null; error: any; }> {
    const supabase = createClient();

    try {
      // First get the current task state
      const { data: currentTask, error: fetchError } = await this.getTask(taskId);
      if (fetchError || !currentTask) {
        return { data: null, error: fetchError || { message: "Task not found" } };
      }

      // Toggle completion status
      return await this.updateTask(taskId, {
        is_completed: !currentTask.is_completed,
      });
    } catch (error) {
      return { data: null, error };
    }
  },
  async reorderTasks(taskIds: string[]): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: "User not authenticated" } };
      }

      // Update sort_order for each task
      let error = null;
      for (let i = 0; i < taskIds.length; i++) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ sort_order: i + 1 })
          .eq("id", taskIds[i]);
        if (updateError) {
          error = updateError;
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },
  async getTasksByDate(date: string): Promise<{ data: TaskWithCategory[]; error: any; }> {
    return this.getTasks({ dueDate: date });
  },
  async getOverdueTasks(): Promise<{ data: TaskWithCategory[]; error: any; }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: "User not authenticated" } };
      }

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          category:categories(*),
          subtasks(*)
        `)
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .lt("due_date", today)
        .is("deleted_at", null)
        .order("due_date", { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  },
  async getTaskStats(): Promise<{
    data: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      today: number;
    } | null;
    error: any;
  }> {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "User not authenticated" } };
      }

      const today = new Date().toISOString().split("T")[0];

      // Get all tasks for the user
      const { data: allTasks, error } = await supabase
        .from("tasks")
        .select("is_completed, due_date")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (error) {
        return { data: null, error };
      }

      const stats = {
        total: allTasks.length,
        completed: allTasks.filter((task) => task.is_completed).length,
        pending: allTasks.filter((task) => !task.is_completed).length,
        overdue: allTasks.filter((task) => !task.is_completed && task.due_date && task.due_date < today).length,
        today: allTasks.filter((task) => task.due_date === today).length,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};