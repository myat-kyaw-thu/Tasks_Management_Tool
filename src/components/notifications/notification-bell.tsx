"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { AlertCircle, Bell, Loader2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { LazyNotificationDropdown } from "./lazy-notification-dropdown";

export function NotificationBell() {
  const [isMounted, setIsMounted] = useState(false);
  const { unreadCount, permissionGranted, isSubscribed, requestPermission, isLoading, error } = useNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNotificationPermission = async () => {
    if (!permissionGranted && !isLoading) {
      await requestPermission();
    }
  };

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-4 w-4" />
        <span className="sr-only">Loading notifications</span>
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled title="Notifications unavailable">
        <Bell className="h-4 w-4 opacity-50" />
        <div className="absolute -top-1 -right-1">
          <AlertCircle className="h-3 w-3 text-destructive" />
        </div>
        <span className="sr-only">Notifications unavailable</span>
      </Button>
    );
  }

  return (
    <LazyNotificationDropdown unreadCount={unreadCount} isLoading={isLoading}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={!permissionGranted ? handleNotificationPermission : undefined}
        disabled={isLoading}
      >
        <Bell className="h-4 w-4" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          </div>
        )}

        {/* Unread count badge */}
        {!isLoading && unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}

        {/* Connection status indicator */}
        {!isLoading && (
          <div className="absolute -bottom-1 -right-1">
            {isSubscribed ? <Wifi className="h-2 w-2 text-green-500" /> : <WifiOff className="h-2 w-2 text-red-500" />}
          </div>
        )}

        <span className="sr-only">{unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}</span>
      </Button>
    </LazyNotificationDropdown>
  );
}
