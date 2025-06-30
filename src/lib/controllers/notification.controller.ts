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