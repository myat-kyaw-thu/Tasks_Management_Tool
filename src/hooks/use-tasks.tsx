"use client";


import { notificationController } from '@/lib/controllers/notification.controller';
import { cacheUtils } from '@/lib/performance/caching';
import { createClient } from "@/lib/supabase/client";
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

class TasksManager {
  private static instance: TasksManager;
  private allTasks: Task[] = [];
  private loading = false;
  private error: string | null = null;
  private subscribers = new Set<() => void>();
  private realtimeSubscription: any = null;
  private dueDateCheckInterval: NodeJS.Timeout | null = null;
  private supabase = createClient();
  private userId: string | null = null;

  static getInstance(): TasksManager {
    if (!TasksManager.instance) {
      TasksManager.instance = new TasksManager();
    }
    return TasksManager.instance;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((callback) => callback());
  }

  private async fetchTasks() {
    if (!this.userId) return;

    this.loading = true;
    this.error = null;
    this.notify();

    try {
      // Check cache first
      const cached = cacheUtils.getCachedTaskStats(this.userId);
      if (cached && Array.isArray(cached)) {
        this.allTasks = cached;
        this.loading = false;
        this.notify();
        return;
      }

      const { data, error } = await this.supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          is_completed,
          priority,
          due_date,
          created_at,
          updated_at,
          user_id,
          category:categories(id, name, color),
          subtasks(id, title, is_completed)
        `)
        .eq("user_id", this.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      this.allTasks = (data as unknown as Task[]) || [];
      this.loading = false;
      this.error = null;

      // Cache the results
      cacheUtils.setCachedTaskStats(this.userId, this.allTasks);
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to fetch tasks";
      this.loading = false;
    }

    this.notify();
  }

  private setupRealtimeSubscription() {
    if (!this.userId || this.realtimeSubscription) return;

    // Use a unique channel name for tasks to avoid conflicts with notification subscriptions
    const channelName = `user-tasks-${this.userId}-${Date.now()}`;

    this.realtimeSubscription = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Task subscription established");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Task subscription error");
        }
      });
  }
  private async checkDueDates() {
    if (!this.userId) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Get notification preferences
    const preferences = notificationController.store.getPreferences();
    if (!preferences.dueDateAlerts && !preferences.taskReminders) return;

    for (const task of this.allTasks) {
      if (task.is_completed || !task.due_date) continue;

      const dueDate = new Date(task.due_date);
      const isOverdue = dueDate < now;
      const isDueToday = task.due_date === today;
      const reminderTime = new Date(dueDate.getTime() - preferences.reminderMinutes * 60 * 1000);
      const shouldRemind = now >= reminderTime && now <= dueDate;

      try {
        if (isOverdue && preferences.dueDateAlerts) {
          await notificationController.showTaskNotification(task as any, "task_overdue");
        } else if ((isDueToday || shouldRemind) && preferences.taskReminders) {
          await notificationController.showTaskNotification(task as any, "task_due");
        }
      } catch (error) {
        console.error("Error showing due date notification:", error);
      }
    }
  }

}