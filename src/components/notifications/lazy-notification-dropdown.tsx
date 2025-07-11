import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import type React from "react";
import { lazy, Suspense } from "react";

const NotificationDropdownComponent = lazy(() =>
  import("@/components/notifications/notification-dropdown")
    .then((module) => ({
      default: module.NotificationDropdown,
    }))
    .catch((error) => {
      console.error("Failed to load NotificationDropdown:", error);
      return {
        default: ({ children }: { children: React.ReactNode; }) => (
          <div title="Notifications unavailable">{children}</div>
        ),
      };
    }),
);

interface LazyNotificationDropdownProps {
  children: React.ReactNode;
  unreadCount?: number;
  isLoading?: boolean;
}

export function LazyNotificationDropdown({
  children,
  unreadCount = 0,
  isLoading = false,
}: LazyNotificationDropdownProps) {
  return (
    <Suspense
      fallback={
        <Button variant="ghost" size="icon" className="relative" disabled>
          <Bell className="h-4 w-4" />
          {isLoading && (
            <div className="absolute -top-1 -right-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          )}
          <span className="sr-only">Loading notifications</span>
        </Button>
      }
    >
      <NotificationDropdownComponent>{children}</NotificationDropdownComponent>
    </Suspense>
  );
}
