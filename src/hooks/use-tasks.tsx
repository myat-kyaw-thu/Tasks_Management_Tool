"use client";

import type { Task, TaskFilters, TaskSortOptions } from "@/types/database.types";



interface UseTasksOptions {
  filters?: TaskFilters;
  sortBy?: TaskSortOptions;
  autoFetch?: boolean;
  enableRealtime?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
}