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

  private async handleRealtimeUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT":
        this.allTasks = [newRecord, ...this.allTasks];
        // Trigger task created notification
        try {
          await notificationController.showTaskNotification(newRecord, "task_created");
        } catch (error) {
          console.error("Error showing task created notification:", error);
        }
        break;
      case "UPDATE":
        this.allTasks = this.allTasks.map((task) => (task.id === newRecord.id ? { ...task, ...newRecord } : task));
        // Trigger task completion notification
        try {
          if (!oldRecord.is_completed && newRecord.is_completed) {
            await notificationController.showTaskNotification(newRecord, "task_completed");
          }
        } catch (error) {
          console.error("Error showing task completion notification:", error);
        }
        break;
      case "DELETE":
        this.allTasks = this.allTasks.filter((task) => task.id !== oldRecord.id);
        break;
    }

    // Update cache
    if (this.userId) {
      cacheUtils.setCachedTaskStats(this.userId, this.allTasks);
    }

    this.notify();
  }
  async createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">) {
    if (!this.userId) throw new Error("User not authenticated");

    // Optimistic update
    const optimisticTask: Task = {
      ...taskData,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: this.userId,
    };

    this.allTasks = [optimisticTask, ...this.allTasks];
    this.notify();

    try {
      const { data, error } = await this.supabase
        .from("tasks")
        .insert([{ ...taskData, user_id: this.userId }])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic update with real data
      this.allTasks = this.allTasks.map((task) => (task.id === optimisticTask.id ? data : task));

      // Update cache
      cacheUtils.setCachedTaskStats(this.userId, this.allTasks);

      // Trigger task created notification
      try {
        await notificationController.showTaskNotification(data as any, "task_created");
      } catch (notificationError) {
        console.error("Error showing task created notification:", notificationError);
      }
    } catch (error) {
      // Rollback optimistic update
      this.allTasks = this.allTasks.filter((task) => task.id !== optimisticTask.id);
      throw error;
    } finally {
      this.notify();
    }
  }
  async updateTask(id: string, updates: Partial<Task>) {
    if (!this.userId) throw new Error("User not authenticated");

    // Optimistic update
    const originalTask = this.allTasks.find((task) => task.id === id);
    if (!originalTask) return;

    const updatedTask = { ...originalTask, ...updates, updated_at: new Date().toISOString() };
    this.allTasks = this.allTasks.map((task) => (task.id === id ? updatedTask : task));
    this.notify();

    try {
      const { error } = await this.supabase.from("tasks").update(updates).eq("id", id).eq("user_id", this.userId);

      if (error) throw error;

      // Update cache
      cacheUtils.setCachedTaskStats(this.userId, this.allTasks);

      // Trigger task completion notification
      try {
        if (updates.is_completed === true && originalTask.is_completed === false) {
          await notificationController.showTaskNotification(updatedTask as any, "task_completed");
        }
      } catch (notificationError) {
        console.error("Error showing task completion notification:", notificationError);
      }
    } catch (error) {
      // Rollback optimistic update
      this.allTasks = this.allTasks.map((task) => (task.id === id ? originalTask : task));
      this.notify();
      throw error;
    }
  }
  async deleteTask(id: string) {
    if (!this.userId) throw new Error("User not authenticated");

    // Optimistic update
    const originalTasks = [...this.allTasks];
    this.allTasks = this.allTasks.filter((task) => task.id !== id);
    this.notify();

    try {
      const { error } = await this.supabase.from("tasks").delete().eq("id", id).eq("user_id", this.userId);

      if (error) throw error;

      // Update cache
      cacheUtils.setCachedTaskStats(this.userId, this.allTasks);
    } catch (error) {
      // Rollback optimistic update
      this.allTasks = originalTasks;
      this.notify();
      throw error;
    }
  }
  async toggleTask(id: string) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    await this.updateTask(id, { is_completed: !task.is_completed });
  }
  // Getters
  getTasks(): Task[] {
    return this.allTasks;
  }

  getLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }
  getFilteredTasks(filters?: TaskFilters): Task[] {
    let filtered = [...this.allTasks];

    if (filters?.completed !== undefined) {
      filtered = filtered.filter((task) => task.is_completed === filters.completed);
    }

    if (filters?.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters?.dueDate) {
      const today = new Date().toISOString().split("T")[0];
      switch (filters.dueDate) {
        case "today":
          filtered = filtered.filter((task) => task.due_date === today);
          break;
        case "upcoming":
          filtered = filtered.filter((task) => task.due_date && task.due_date > today && !task.is_completed);
          break;
        case "overdue":
          filtered = filtered.filter((task) => task.due_date && task.due_date < today && !task.is_completed);
          break;
      }
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) || task.description?.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }
  cleanup() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
    if (this.dueDateCheckInterval) {
      clearInterval(this.dueDateCheckInterval);
      this.dueDateCheckInterval = null;
    }
    this.subscribers.clear();
  }
}