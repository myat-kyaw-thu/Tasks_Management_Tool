import { createClient } from "@/lib/supabase/client";
import type { Subtask, SubtaskInsert, SubtaskUpdate } from "@/lib/supabase/types";

export const subtaskClient = {
  async getSubtasks(taskId: string): Promise<{ data: Subtask[]; error: any; }> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", taskId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  },
  async createSubtask(subtask: Omit<SubtaskInsert, "sort_order">): Promise<{ data: Subtask | null; error: any; }> {
    const supabase = createClient();

    try {
      // Get the highest sort_order for this task
      const { data: lastSubtask } = await supabase
        .from("subtasks")
        .select("sort_order")
        .eq("task_id", subtask.task_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const newSortOrder = (lastSubtask?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from("subtasks")
        .insert({
          ...subtask,
          sort_order: newSortOrder,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async updateSubtask(subtaskId: string, updates: SubtaskUpdate): Promise<{ data: Subtask | null; error: any; }> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.from("subtasks").update(updates).eq("id", subtaskId).select().single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async deleteSubtask(subtaskId: string): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);

      return { error };
    } catch (error) {
      return { error };
    }
  },
  async toggleSubtaskCompletion(subtaskId: string): Promise<{ data: Subtask | null; error: any; }> {
    const supabase = createClient();

    try {
      // First get the current subtask state
      const { data: currentSubtask, error: fetchError } = await supabase
        .from("subtasks")
        .select("is_completed")
        .eq("id", subtaskId)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      // Toggle completion status
      const { data, error } = await supabase
        .from("subtasks")
        .update({ is_completed: !currentSubtask.is_completed })
        .eq("id", subtaskId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
  async reorderSubtasks(subtaskIds: string[]): Promise<{ error: any; }> {
    const supabase = createClient();

    try {
      // Update sort_order for each subtask
      const updates = subtaskIds.map((subtaskId, index) => ({
        id: subtaskId,
        sort_order: index + 1,
      }));

      // Only update the 'sort_order' field for each subtask using update, not upsert
      let error = null;
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("subtasks")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        if (updateError) {
          error = updateError;
          break;
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },
};

export const subtaskValidation = {
  validateSubtask(subtask: Partial<SubtaskInsert>): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];

    if (!subtask.title || subtask.title.trim().length === 0) {
      errors.push("Subtask title is required");
    } else if (subtask.title.length > 255) {
      errors.push("Subtask title must be less than 255 characters");
    }

    if (!subtask.task_id) {
      errors.push("Task ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
