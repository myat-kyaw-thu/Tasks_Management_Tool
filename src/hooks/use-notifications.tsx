"use client";

import { useAuth } from "@/hooks/use-auth";
import type { NotificationItem, NotificationPreferences } from "@/lib/controllers/notification.controller";
import { notificationController } from "@/lib/controllers/notification.controller";
import { useRef, useState } from "react";

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

}