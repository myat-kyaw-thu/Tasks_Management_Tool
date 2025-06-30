"use client";
import { createClient } from "@/lib/supabase/client";
import type { TaskWithCategory } from "@/lib/supabase/types";

export interface NotificationItem {
  id: string;
  type: "task_due" | "task_overdue" | "task_completed" | "task_created";
  title: string;
  message?: string;
  taskId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  browserNotifications: boolean;
  taskReminders: boolean;
  dueDateAlerts: boolean;
  taskCompletions: boolean;
  reminderMinutes: number;
}

class NotificationStore {
  private notifications: NotificationItem[] = [];
  private listeners = new Set<(notifications: NotificationItem[]) => void>();
  private preferences: NotificationPreferences = {
    browserNotifications: true,
    taskReminders: true,
    dueDateAlerts: true,
    taskCompletions: true,
    reminderMinutes: 60,
  };

  constructor() {
    this.loadPreferences();
  }

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error("Notification listener error:", error);
      }
    });
  }

  addNotification(notification: Omit<NotificationItem, "id" | "createdAt" | "isRead">) {
    if (!notification.title?.trim()) return null;

    const newNotification: NotificationItem = {
      ...notification,
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      title: notification.title.trim(),
      message: notification.message?.trim(),
    };

    this.notifications.unshift(newNotification);
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notify();
    return newNotification;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notify();
    }
  }

  markAllAsRead() {
    let hasChanges = false;
    this.notifications.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        hasChanges = true;
      }
    });
    if (hasChanges) this.notify();
  }

  deleteNotification(id: string) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.notifications.length !== initialLength) this.notify();
  }

  clearAll() {
    if (this.notifications.length > 0) {
      this.notifications = [];
      this.notify();
    }
  }

  getNotifications() {
    return [...this.notifications];
  }

  getUnreadCount() {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  getPreferences() {
    return { ...this.preferences };
  }

  updatePreferences(newPrefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPrefs };
    this.savePreferences();
  }

  private loadPreferences() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("taskflow-notification-preferences");
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }

  private savePreferences() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("taskflow-notification-preferences", JSON.stringify(this.preferences));
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  }
}

let storeInstance: NotificationStore | null = null;
const getStore = () => storeInstance || (storeInstance = new NotificationStore());

export const notificationController = {
  get store() {
    return getStore();
  },

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  },

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return null;
    }

    try {
      return new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    } catch {
      return null;
    }
  },

  // Unified method for all task notifications
  async showTaskNotification(task: TaskWithCategory, type: NotificationItem["type"]) {
    if (!task?.id || !task?.title?.trim()) return null;

    const preferences = this.store.getPreferences();

    // Check if this type of notification is enabled
    if (!preferences.browserNotifications) return null;

    switch (type) {
      case "task_created":
        if (!preferences.taskReminders) return null;
        break;
      case "task_completed":
        if (!preferences.taskCompletions) return null;
        break;
      case "task_due":
      case "task_overdue":
        if (!preferences.dueDateAlerts) return null;
        break;
    }

    const titles = {
      task_due: "⏰ Task Due",
      task_overdue: "⚠️ Overdue Task",
      task_completed: "✅ Task Completed",
      task_created: "📝 New Task Created",
    };

    const title = titles[type];
    const message = `"${task.title.trim()}"`;

    // Add to notification store
    this.store.addNotification({ type, title, message, taskId: task.id });

    // Show browser notification
    return this.showNotification(title, {
      body: message,
      tag: `task-${type}-${task.id}`,
      requireInteraction: type === "task_overdue",
    });
  },



  setupRealtimeSubscription(userId: string) {
    // Return a no-op cleanup if invalid user ID
    if (!userId?.trim()) return () => { };

    try {
      const supabase = createClient();
      const channelName = `user-notifications-${userId}`;

      // Remove any existing matching channels before creating a new one
      supabase.getChannels().forEach(channel => {
        if (channel.topic.includes(channelName)) {
          supabase.removeChannel(channel);
        }
      });

      // Create the new channel with a listener on the "tasks" table
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => this.handleTaskChange(payload)
        );

      // Subscribe to the channel
      channel.subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            console.log(`[Supabase] Subscribed to ${channelName}`);
            break;
          case 'CHANNEL_ERROR':
            console.error(`[Supabase] Channel error: ${channelName}`);
            break;
          case 'TIMED_OUT':
            console.warn(`[Supabase] Subscription timed out for ${channelName}`);
            break;
          default:
            console.log(`[Supabase] Channel status: ${status}`);
        }
      });

      // Return a cleanup function
      return () => {
        try {
          channel.unsubscribe();
          supabase.removeChannel(channel);
          console.log(`[Supabase] Unsubscribed from ${channelName}`);
        } catch (err) {
          console.error('Error during channel cleanup:', err);
        }
      };
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
      return () => { };
    }
  },


  isValidTask(task: any): boolean {
    return task?.id?.trim() && task?.title?.trim();
  },

  handleTaskChange(payload: any) {
    const { eventType, new: newTask, old: oldTask } = payload;

    if (eventType === "INSERT" && newTask?.id && newTask?.title) {
      this.showTaskNotification(newTask as TaskWithCategory, "task_created");
    } else if (eventType === "UPDATE" && newTask?.is_completed && !oldTask?.is_completed) {
      this.showTaskNotification(newTask as TaskWithCategory, "task_completed");
    } else if (eventType === "UPDATE" && newTask?.due_date && !newTask?.is_completed) {
      const dueDate = new Date(newTask.due_date);
      const now = new Date();
      if (now > dueDate) {
        this.showTaskNotification(newTask as TaskWithCategory, "task_overdue");
      } else if (
        now <= dueDate &&
        now >= new Date(dueDate.getTime() - this.store.getPreferences().reminderMinutes * 60 * 1000)
      ) {
        this.showTaskNotification(newTask as TaskWithCategory, "task_due");
      }
    }
  },

  async checkTaskReminders(userId: string) {
    if (!userId?.trim()) return;

    const preferences = this.store.getPreferences();
    if (!preferences.taskReminders && !preferences.dueDateAlerts) return;

    try {
      const supabase = createClient();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*, category:categories(*)")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .not("due_date", "is", null)
        .is("deleted_at", null)
        .lte("due_date", tomorrow.toISOString());

      if (!tasks) return;

      for (const task of tasks.filter(this.isValidTask)) {
        const dueDate = new Date(task.due_date!);
        const reminderTime = new Date(dueDate.getTime() - preferences.reminderMinutes * 60 * 1000);

        if (now > dueDate && preferences.dueDateAlerts) {
          await this.showTaskNotification(task, "task_overdue");
        } else if (now >= reminderTime && now <= dueDate && preferences.taskReminders) {
          await this.showTaskNotification(task, "task_due");
        }
      }
    } catch (error) {
      console.error("Reminder check error:", error);
    }
  },
};
