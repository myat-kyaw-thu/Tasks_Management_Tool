"use client";

import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserProfileCard } from "@/components/profile/user-profile-card";
import { TaskFiltersComponent, type TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from '@/components/tasks/tasks-form.';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCategories } from "@/hooks/use-categories";
import { useTasks, useTaskStats } from "@/hooks/use-tasks";
import type { Category, TaskWithCategory } from "@/lib/supabase/types";
import { Calendar, CheckCircle, Clock, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("dashboard");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [taskFiltersState, setTaskFiltersState] = useState<TaskFilters>({});

  // Get all tasks for stats calculation
  const { tasks: allTasks } = useTasks({ autoFetch: true });
  const { stats, loading: statsLoading } = useTaskStats(allTasks);

  // Get filtered tasks based on active view
  const getTaskFilters = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];

    switch (activeView) {
      case "today":
        return { due_date: today };
      case "upcoming":
        return { completed: false };
      case "important":
        return { priority: "high", completed: false };
      case "completed":
        return { completed: true };
      case "archive":
        return { deleted_at: { not: null } };
      default:
        return { completed: false };
    }
  }, [activeView]);

  const filteredTasks = useTasks({
    filters: taskFiltersState,
    autoFetch: true,
  });

  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

  // For dashboard view, show recent incomplete tasks
  const displayTasks = useMemo(() => {
    if (activeView === "dashboard") {
      return allTasks.filter((task) => !task.is_completed).slice(0, 5);
    }
    if (activeView === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      return filteredTasks.tasks.filter((task) => task.due_date && task.due_date > today);
    }
    return filteredTasks.tasks;
  }, [activeView, allTasks, filteredTasks.tasks]);

  const handleCreateTask = useCallback(
    async (taskData: any) => {
      const result = await filteredTasks.createTask(taskData);
      if (result.success) {
        setShowTaskForm(false);
      }
      return result;
    },
    [filteredTasks],
  );

  const handleEditTask = useCallback((task: TaskWithCategory) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const handleUpdateTask = useCallback(
    async (updates: any) => {
      if (!editingTask) return { success: false };

      const result = await filteredTasks.updateTask(editingTask.id, updates);
      if (result.success) {
        setShowTaskForm(false);
        setEditingTask(null);
      }
      return result;
    },
    [editingTask, filteredTasks],
  );

  const handleCancelForm = useCallback(() => {
    setShowTaskForm(false);
    setEditingTask(null);
  }, []);

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      return await filteredTasks.toggleTaskCompletion(taskId);
    },
    [filteredTasks],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string, permanent: boolean) => {
      return await filteredTasks.deleteTask(taskId, permanent);
    },
    [filteredTasks],
  );

  const handleDuplicateTask = useCallback(
    async (taskId: string) => {
      return await filteredTasks.duplicateTask(taskId);
    },
    [filteredTasks],
  );

  const handleNewTask = useCallback(() => {
    setShowTaskForm(true);
  }, []);

  const handleCreateCategory = useCallback(
    async (categoryData: any) => {
      const result = await createCategory(categoryData);
      if (result.success) {
        setShowCategoryForm(false);
      }
      return result;
    },
    [createCategory],
  );

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  }, []);

  const handleUpdateCategory = useCallback(
    async (updates: any) => {
      if (!editingCategory) return { success: false };
      const result = await updateCategory(editingCategory.id, updates);
      if (result.success) {
        setShowCategoryForm(false);
        setEditingCategory(null);
      }
      return result;
    },
    [editingCategory, updateCategory],
  );

  const handleCancelCategoryForm = useCallback(() => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  }, []);

  const getViewTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "today":
        return "Today's Tasks";
      case "upcoming":
        return "Upcoming Tasks";
      case "important":
        return "Important Tasks";
      case "completed":
        return "Completed Tasks";
      case "archive":
        return "Archived Tasks";
      case "profile":
        return "Profile";
      case "settings":
        return "Settings";
      case "categories":
        return "Categories";
      case "analytics":
        return "Analytics";
      default:
        return "Dashboard";
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
      case "dashboard":
        return "Welcome back! Here's an overview of your tasks.";
      case "today":
        return "Tasks due today";
      case "upcoming":
        return "Tasks scheduled for the future";
      case "important":
        return "High priority tasks that need attention";
      case "completed":
        return "Tasks you've completed";
      case "archive":
        return "Archived and deleted tasks";
      case "profile":
        return "Manage your profile information";
      default:
        return "";
    }
  };

  if (showTaskForm) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeView={activeView} onViewChange={setActiveView} />
          <SidebarInset className="flex-1">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <TaskForm
                    task={editingTask}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    onCancel={handleCancelForm}
                  />
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <SidebarInset className="flex-1">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{getViewTitle()}</h1>
                  <p className="text-muted-foreground">{getViewDescription()}</p>
                </div>
                {(activeView === "dashboard" ||
                  activeView === "today" ||
                  activeView === "upcoming" ||
                  activeView === "important") && (
                    <Button onClick={handleNewTask}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Button>
                  )}
              </div>

              {/* Dashboard View */}
              {activeView === "dashboard" && (
                <>
                  {/* Stats Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All your tasks</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.completed || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.total ? Math.round(((stats?.completed || 0) / stats.total) * 100) : 0}% completion
                          rate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-warning" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.pending || 0}</div>
                        <p className="text-xs text-muted-foreground">Tasks to complete</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                        <Calendar className="h-4 w-4 text-info" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.today || 0}</div>
                        <p className="text-xs text-muted-foreground">Focus for today</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* User Profile Card */}
                    <div className="lg:col-span-1">
                      <UserProfileCard />
                    </div>

                    {/* Recent Tasks */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>Recent Tasks</CardTitle>
                            <CardDescription>Your latest incomplete tasks</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleNewTask}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <TaskList
                            tasks={displayTasks}
                            loading={filteredTasks.loading}
                            error={filteredTasks.error}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onDuplicate={handleDuplicateTask}
                            onRetry={filteredTasks.refetch}
                            emptyState={{
                              title: "No tasks yet",
                              description: "Create your first task to get started with TaskFlow.",
                              action: {
                                label: "Create Task",
                                onClick: handleNewTask,
                              },
                            }}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}

              {/* Profile View */}
              {activeView === "profile" && (
                <div className="max-w-2xl mx-auto">
                  <UserProfileCard />
                </div>
              )}

              {/* Categories View */}
              {activeView === "categories" && !showCategoryForm && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Categories</h2>
                      <p className="text-muted-foreground">Organize your tasks with custom categories</p>
                    </div>
                    <Button onClick={() => setShowCategoryForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Category
                    </Button>
                  </div>
                  <CategoryList
                    categories={categories}
                    onEdit={handleEditCategory}
                    onDelete={deleteCategory}
                    onCreateNew={() => setShowCategoryForm(true)}
                  />
                </div>
              )}

              {/* Category Form View */}
              {activeView === "categories" && showCategoryForm && (
                <div className="max-w-lg mx-auto">
                  <CategoryForm
                    category={editingCategory}
                    onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    onCancel={handleCancelCategoryForm}
                  />
                </div>
              )}

              {/* Other Views with Filters */}
              {activeView !== "dashboard" && activeView !== "profile" && activeView !== "categories" && (
                <div className="space-y-6">
                  <TaskFiltersComponent
                    filters={taskFiltersState}
                    categories={categories}
                    onFiltersChange={setTaskFiltersState}
                  />
                  <TaskList
                    tasks={displayTasks}
                    loading={filteredTasks.loading}
                    error={filteredTasks.error}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateTask}
                    onRetry={filteredTasks.refetch}
                    emptyState={{
                      title: `No ${activeView} tasks`,
                      description: `You don't have any ${activeView} tasks yet.`,
                      action:
                        activeView !== "completed" && activeView !== "archive"
                          ? {
                            label: "Create Task",
                            onClick: handleNewTask,
                          }
                          : undefined,
                    }}
                  />
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
