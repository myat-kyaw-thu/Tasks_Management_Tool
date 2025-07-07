"use client";

import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { NotificationItem, NotificationPreferences } from "@/lib/controllers/notification.controller";
import { notificationController } from "@/lib/controllers/notification.controller";
import { useCallback, useEffect, useRef, useState } from "react";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationController.store.getPreferences());
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRealtimeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // No cleanup needed, so return nothing (do not return a boolean)
  }, []);

  // Subscribe to notification store changes
  useEffect(() => {
    const unsubscribe = notificationController.store.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setError(null);
    });

    // Initialize with current notifications
    setNotifications(notificationController.store.getNotifications());
    setPreferences(notificationController.store.getPreferences());

    return () => {
      unsubscribe();
    };
  }, []);

  // Check permission status on mount
  useEffect(() => {
    if (!isMounted) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, [isMounted]);

  const requestPermission = useCallback(async () => {
    if (!isMounted) return false;

    setIsLoading(true);
    setError(null);

    try {
      const granted = await notificationController.requestPermission();
      setPermissionGranted(granted);

      toast({
        title: granted ? "Notifications enabled" : "Notifications blocked",
        description: granted
          ? "You'll receive task reminders and alerts"
          : "Please enable notifications in your browser settings",
      });

      return granted;
    } catch (err) {
      setError("Failed to request notification permission");
      toast({
        title: "Error",
        description: "Failed to request notification permission",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isMounted]);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    try {
      notificationController.store.updatePreferences(newPreferences);
      setPreferences(notificationController.store.getPreferences());
      setError(null);

      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved",
      });
    } catch (err) {
      setError("Failed to update preferences");
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
      });
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!isMounted || !user || !permissionGranted) return;

    setIsLoading(true);
    try {
      const unsubscribe = notificationController.setupRealtimeSubscription(user.id);
      unsubscribeRealtimeRef.current = unsubscribe;
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      setError("Failed to connect to notification service");
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRealtimeRef.current) {
        unsubscribeRealtimeRef.current();
        unsubscribeRealtimeRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [isMounted, user, permissionGranted]);

  // Setup reminder checks
  useEffect(() => {
    if (!isMounted || !user || !preferences.taskReminders || !permissionGranted) return;

    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }

    // Check immediately
    notificationController.checkTaskReminders(user.id);

    // Then check every 5 minutes
    reminderIntervalRef.current = setInterval(() => notificationController.checkTaskReminders(user.id), 5 * 60 * 1000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
    };
  }, [isMounted, user, preferences.taskReminders, permissionGranted]);

  const markAsRead = useCallback((notificationId: string) => {
    try {
      notificationController.store.markAsRead(notificationId);
      setError(null);
    } catch (err) {
      setError("Failed to mark notification as read");
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    try {
      notificationController.store.markAllAsRead();
      setError(null);
    } catch (err) {
      setError("Failed to mark all notifications as read");
    }
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    try {
      notificationController.store.deleteNotification(notificationId);
      setError(null);
    } catch (err) {
      setError("Failed to delete notification");
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    try {
      notificationController.store.clearAll();
      setError(null);
    } catch (err) {
      setError("Failed to clear all notifications");
    }
  }, []);

  const unreadCount = notificationController.store.getUnreadCount();

  return {
    notifications,
    unreadCount,
    preferences,
    permissionGranted,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };
}
