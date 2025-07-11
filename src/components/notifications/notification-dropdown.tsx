"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Loader2,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { NotificationSettings } from "./notification-settings";

interface NotificationDropdownProps {
  children: React.ReactNode;
}

export function NotificationDropdown({ children }: NotificationDropdownProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    isLoading,
    error,
  } = useNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDeleteNotification = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "task_due":
        return <Clock className={cn(iconClass, "text-orange-500")} />;
      case "task_overdue":
        return <AlertCircle className={cn(iconClass, "text-red-500")} />;
      case "task_completed":
        return <Check className={cn(iconClass, "text-green-500")} />;
      case "task_created":
        return <FileText className={cn(iconClass, "text-blue-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return "text-muted-foreground";

    switch (type) {
      case "task_overdue":
        return "text-red-600 dark:text-red-400";
      case "task_due":
        return "text-orange-600 dark:text-orange-400";
      case "task_completed":
        return "text-green-600 dark:text-green-400";
      case "task_created":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-foreground";
    }
  };

  const formatNotificationDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return "Invalid date";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  if (!isMounted) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (error) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <X className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-medium text-destructive">Failed to load notifications</p>
            <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (showSettings) {
    return (
      <DropdownMenu open onOpenChange={() => setShowSettings(false)}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <NotificationSettings onClose={() => setShowSettings(false)} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <DropdownMenuLabel className="p-0 font-semibold">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-8 w-8 p-0"
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Actions */}
        {notifications.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 px-2 text-xs"
                    disabled={isLoading}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isLoading}
                title="Clear all notifications"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 text-sm transition-colors hover:bg-accent/50 cursor-pointer",
                      !notification.isRead && "bg-accent/30 border-l-2 border-l-primary",
                    )}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium leading-tight",
                          getNotificationColor(notification.type, notification.isRead),
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatNotificationDate(notification.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          title="Mark as read"
                          disabled={isLoading}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete notification"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
