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