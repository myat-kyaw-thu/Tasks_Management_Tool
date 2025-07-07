"use client";

import { useAuth } from "@/hooks/use-auth";
import type { NotificationItem, NotificationPreferences } from "@/lib/controllers/notification.controller";
import { notificationController } from "@/lib/controllers/notification.controller";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from 'sonner';

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

}