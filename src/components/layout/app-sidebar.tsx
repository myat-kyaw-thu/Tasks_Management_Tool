"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { BarChart3, CheckCircle, Home, LogOut, Settings, Tag, User } from "lucide-react";
import React from "react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: string;
  onViewChange: (view: string) => void;
}

// Memoize the sidebar component for better performance
export const AppSidebar = React.memo(function AppSidebar({ activeView, onViewChange, ...props }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  // No longer need task counts for filters - removed for simplicity

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = React.useMemo(
    () => [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: Home,
        count: null,
      },
      {
        id: "kanban",
        title: "Kanban Board",
        icon: BarChart3,
        count: null,
      },
    ],
    [],
  );

  const managementItems = React.useMemo(
    () => [
      {
        id: "categories",
        title: "Categories",
        icon: Tag,
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: BarChart3,
      },
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
      },
    ],
    [],
  );

  // Memoize click handlers to prevent unnecessary re-renders
  const handleViewChange = React.useCallback(
    (view: string) => {
      // Handle navigation to actual pages
      if (view === "analytics") {
        window.location.href = "/analytics";
        return;
      }
      if (view === "settings") {
        window.location.href = "/settings";
        return;
      }
      // For other views, use the existing onViewChange
      onViewChange(view);
    },
    [onViewChange],
  );

  const handleSignOut = React.useCallback(async () => {
    await signOut();
  }, [signOut]);

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => handleViewChange("dashboard")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckCircle className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">TaskFlow</span>
                <span className="truncate text-xs">Task Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton isActive={activeView === item.id} onClick={() => handleViewChange(item.id)}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    {item.count !== null && item.count > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton isActive={activeView === item.id} onClick={() => handleViewChange(item.id)}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt={profile?.username || user?.email || "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {profile?.username
                        ? profile.username.slice(0, 2).toUpperCase()
                        : user?.email
                          ? getUserInitials(user.email)
                          : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => handleViewChange("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewChange("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});
