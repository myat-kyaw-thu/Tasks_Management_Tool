import { createClient } from "@/lib/supabase/client";
import type { Subtask, SubtaskInsert } from "@/lib/supabase/types";

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
};