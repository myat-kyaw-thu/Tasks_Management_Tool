"use client";

import { toast } from "@/hooks/use-toast";
import { subtaskClient, subtaskValidation } from "@/lib/controllers/subtask.controller";
import type { Subtask, SubtaskInsert } from "@/lib/supabase/types";
import { useCallback, useState } from "react";


export function useSubtasks(taskId: string | null) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) {
      setSubtasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await subtaskClient.getSubtasks(taskId);

      if (error) {
        setError(error);
        toast({
          title: "Failed to load subtasks",
          description: error.message,

        });
      } else {
        setSubtasks(data);
      }
    } catch (err) {
      setError(err);
      toast({
        title: "Failed to load subtasks",
        description: "An unexpected error occurred",

      });
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const createSubtask = useCallback(
    async (subtaskData: Omit<SubtaskInsert, "sort_order">) => {
      if (!taskId) return { success: false, error: "Task ID is required" };

      try {
        const validation = subtaskValidation.validateSubtask(subtaskData);
        if (!validation.isValid) {
          toast({
            title: "Invalid subtask data",
            description: validation.errors[0],

          });
          return { success: false, error: validation.errors };
        }

        const { data, error } = await subtaskClient.createSubtask(subtaskData);

        if (error) {
          toast({
            title: "Failed to create subtask",
            description: error.message,

          });
          return { success: false, error };
        }

        setSubtasks((prev) => [...prev, data!]);
        toast({
          title: "Subtask created",
          description: "Your subtask has been created successfully",
        });
        return { success: true, data };
      } catch (err) {
        toast({
          title: "Failed to create subtask",
          description: "An unexpected error occurred",

        });
        return { success: false, error: err };
      }
    },
    [taskId],
  );
}