import { createClient } from "@/lib/supabase/client";
import type { Subtask } from "@/lib/supabase/types";

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
  }
};