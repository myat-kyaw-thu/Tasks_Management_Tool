"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserProfileMini } from "@/components/profile/user-profile-mini";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/today": "Today",
  "/dashboard/upcoming": "Upcoming",
  "/dashboard/important": "Important",
  "/dashboard/completed": "Completed",
  "/dashboard/archive": "Archive",
  "/dashboard/categories": "Categories",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
  "/dashboard/tasks/new": "New Task",
};

export function AppHeader() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    try {
      const segments = pathname.split("/").filter(Boolean);
      const breadcrumbs = [];

      // Always start with Dashboard
      breadcrumbs.push({
        label: "Dashboard",
        href: "/dashboard",
        isLast: segments.length === 1,
      });

      // Add subsequent segments
      for (let i = 1; i < segments.length; i++) {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const label = routeLabels[path] || segments[i].charAt(0).toUpperCase() + segments[i].slice(1);

        breadcrumbs.push({
          label,
          href: path,
          isLast: i === segments.length - 1,
        });
      }

      return breadcrumbs;
    } catch (error) {
      console.error("Error generating breadcrumbs:", error);
      return [{ label: "Dashboard", href: "/dashboard", isLast: true }];
    }
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              <BreadcrumbItem className="hidden md:block">
                {breadcrumb.isLast ? (
                  <BreadcrumbPage className="font-medium">{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href} className="transition-colors hover:text-foreground">
                    {breadcrumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!breadcrumb.isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tasks..."
          className="w-64 pl-8 bg-background/50 border-muted-foreground/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Mobile Search Button */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notification Bell - This is where you use the new component */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Button */}
        <div className='py-4 px-2 hidden md:block'>
          <UserProfileMini />
        </div>
      </div>
    </header>
  );
}
