"use client";

import { toast } from "@/hooks/use-toast";
import { subtaskClient } from "@/lib/controllers/subtask.controller";
import type { Subtask } from "@/lib/supabase/types";
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
}