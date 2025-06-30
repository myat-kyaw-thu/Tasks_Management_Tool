"use client";

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
}