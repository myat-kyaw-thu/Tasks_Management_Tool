import type { Category, Subtask, Task } from "@/types/database.types";

// Re-export common types for easier imports
export type {
  Category, CategoryColor, CategoryInsert,
  CategoryUpdate, Database, Subtask,
  SubtaskInsert,
  SubtaskUpdate, Task, TaskActivity, TaskInsert, TaskPriority, TaskUpdate
} from "@/types/database.types";

// Additional utility types
export type SupabaseClient = ReturnType<typeof import("./client").createClient>;
export type SupabaseServerClient = Awaited<ReturnType<typeof import("./server").createClient>>;

// Task with related data
export type TaskWithCategory = Task & {
  category: Category | null;
  subtasks?: Subtask[];
};

// Category with task count
export type CategoryWithCount = Category & {
  task_count: number;
};

// User task statistics
export type UserTaskStats = {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
};
