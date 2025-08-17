"use client";

import { BarChart3, Calendar, CheckCircle, Clock, Plus, TrendingUp } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";


// Performance optimized imports
import { createAsyncComponent } from "@/lib/performance/async-component-factory";
import { bundleOptimization, performanceMonitoring } from "@/lib/performance/bundle-optimization";

// Core components
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserProfileCard } from "@/components/profile/user-profile-card";
import { TaskList } from "@/components/tasks/task-list";

// Lazy loaded components
const LazyTaskForm = createAsyncComponent(() =>
  import("@/components/tasks/tasks-form.").then((m) => ({ default: m.TaskForm })),
);

const LazyTaskFilters = createAsyncComponent(() =>
  import("@/components/tasks/task-filters").then((m) => ({ default: m.TaskFiltersComponent })),
);

const LazyCategoryForm = createAsyncComponent(() =>
  import("@/components/categories/category-form").then((m) => ({ default: m.CategoryForm })),
);

const LazyCategoryList = createAsyncComponent(() =>
  import("@/components/categories/category-list").then((m) => ({ default: m.CategoryList })),
);

// Hooks and types
import { KanbanBoard } from '@/components/kanban';
import type { TaskFilters } from "@/components/tasks/task-filters";
import { useCategories } from "@/hooks/use-categories";
import { useTasks } from "@/hooks/use-tasks";
import type { Category, TaskWithCategory } from "@/types/database.types";
import { Toaster } from "sonner";

// Modern Stats Card with subtle design
const StatsCard = React.memo(
  ({
    title,
    value,
    description,
    icon: Icon,
    loading,
    trend,
  }: {
    title: string;
    value: number;
    description: string;
    icon: React.ComponentType<{ className?: string; }>;
    loading: boolean;
    trend?: { value: number; isPositive: boolean; };
  }) => {
    return (
      <Card className="border-0 bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-1.5 rounded-md bg-background/60">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold">
              {loading ? <div className="h-7 w-12 bg-muted animate-pulse rounded" /> : value}
            </div>
            {trend && !loading && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    );
  },
);
StatsCard.displayName = "StatsCard";

// Full-width Progress Overview
const ProgressOverview = React.memo(({ stats, loading }: { stats: any; loading: boolean; }) => {
  if (loading || !stats || stats.total === 0) {
    return (
      <Card className="border-0 bg-muted/30 h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 bg-muted animate-pulse rounded-full" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = Math.round((stats.completed / stats.total) * 100);
  const progressSegments = [
    {
      label: "Completed",
      value: stats.completed,
      color: "bg-emerald-500/80",
      percentage: (stats.completed / stats.total) * 100,
    },
    {
      label: "Overdue",
      value: stats.overdue,
      color: "bg-rose-500/80",
      percentage: (stats.overdue / stats.total) * 100,
    },
    {
      label: "Due Today",
      value: stats.today,
      color: "bg-amber-500/80",
      percentage: (stats.today / stats.total) * 100,
    },
    {
      label: "Pending",
      value: stats.pending - stats.today - stats.overdue,
      color: "bg-blue-500/80",
      percentage: ((stats.pending - stats.today - stats.overdue) / stats.total) * 100,
    },
  ];

  return (
    <Card className="border-0 bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Progress Overview
        </CardTitle>
        <CardDescription className="text-xs">Track your productivity and task completion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Full-width Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Overall Completion</span>
            <span className="text-lg font-semibold text-emerald-600">{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex w-full">
            {progressSegments.map(
              (segment, index) =>
                segment.percentage > 0 && (
                  <div
                    key={index}
                    className={`${segment.color} transition-all duration-300`}
                    style={{ width: `${segment.percentage}%` }}
                    title={`${segment.label}: ${segment.value}`}
                  />
                ),
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="text-lg font-semibold text-emerald-600">{stats.completed}</div>
            <div className="text-[10px] text-emerald-700/70 font-medium">Completed</div>
          </div>
          <div className="text-center p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20">
            <div className="text-lg font-semibold text-blue-600">{stats.pending}</div>
            <div className="text-[10px] text-blue-700/70 font-medium">Pending</div>
          </div>
          <div className="text-center p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20">
            <div className="text-lg font-semibold text-amber-600">{stats.today}</div>
            <div className="text-[10px] text-amber-700/70 font-medium">Due Today</div>
          </div>
          <div className="text-center p-2 rounded-md bg-rose-50/50 dark:bg-rose-950/20">
            <div className="text-lg font-semibold text-rose-600">{stats.overdue}</div>
            <div className="text-[10px] text-rose-700/70 font-medium">Overdue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
ProgressOverview.displayName = "ProgressOverview";

export default function DashboardPage() {
  // Performance monitoring
  useEffect(() => {
    performanceMonitoring.trackWebVitals();
    bundleOptimization.preloadCriticalResources();
    if (process.env.NODE_ENV === "development") {
      const interval = setInterval(() => performanceMonitoring.checkMemoryUsage(), 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // State management
  const [activeView, setActiveView] = useState("dashboard");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [taskFiltersState, setTaskFiltersState] = useState<TaskFilters>({});

  // Data hooks
  const {
    tasks: allTasks,
    loading: allTasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: refetchTasks,
  } = useTasks({ autoFetch: true, enableRealtime: true });

  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

  // Transform tasks with categories
  const tasksWithCategories = useMemo((): TaskWithCategory[] => {
    return allTasks.map((task) => ({
      ...task,
      category: categories.find((cat) => cat.id === task.category_id) || null,
    }));
  }, [allTasks, categories]);

  // Calculate comprehensive stats
  const { stats, loading: statsLoading } = useMemo(() => {
    if (allTasksLoading || !tasksWithCategories.length) {
      return {
        stats: { total: 0, completed: 0, pending: 0, today: 0, overdue: 0, thisWeek: 0, highPriority: 0 },
        loading: allTasksLoading,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const stats = {
      total: tasksWithCategories.length,
      completed: tasksWithCategories.filter((t) => t.is_completed).length,
      pending: tasksWithCategories.filter((t) => !t.is_completed).length,
      today: tasksWithCategories.filter((t) => t.due_date === today && !t.is_completed).length,
      overdue: tasksWithCategories.filter((t) => t.due_date && t.due_date < today && !t.is_completed).length,
      thisWeek: tasksWithCategories.filter(
        (t) => t.due_date && t.due_date <= weekFromNow && t.due_date >= today && !t.is_completed,
      ).length,
      highPriority: tasksWithCategories.filter((t) => t.priority === "high" && !t.is_completed).length,
    };

    return { stats, loading: false };
  }, [tasksWithCategories, allTasksLoading]);

  // Task filtering logic
  const getTaskFilters = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const filterMap = {
      today: (task: TaskWithCategory) => task.due_date === today,
      upcoming: (task: TaskWithCategory) => !task.is_completed && task.due_date && task.due_date > today,
      important: (task: TaskWithCategory) => task.priority === "high" && !task.is_completed,
      completed: (task: TaskWithCategory) => task.is_completed,
      archive: (task: TaskWithCategory) => task.deleted_at !== null,
      default: (task: TaskWithCategory) => !task.is_completed,
    };
    return filterMap[activeView as keyof typeof filterMap] || filterMap.default;
  }, [activeView]);

  const applyAdditionalFilters = useCallback(
    (task: TaskWithCategory) => {
      const { search, category, priority, due_date } = taskFiltersState;
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && task.category_id !== category) return false;
      if (priority && task.priority !== priority) return false;
      if (due_date && task.due_date !== due_date) return false;
      return true;
    },
    [taskFiltersState],
  );

  const displayTasks = useMemo(() => {
    const viewFilter = getTaskFilters();
    const viewFilteredTasks = tasksWithCategories.filter(viewFilter);
    const fullyFilteredTasks = viewFilteredTasks.filter(applyAdditionalFilters);
    return activeView === "dashboard" ? fullyFilteredTasks.slice(0, 5) : fullyFilteredTasks;
  }, [activeView, tasksWithCategories, getTaskFilters, applyAdditionalFilters]);

  // Event handlers
  const handleCreateTask = useCallback(
    async (taskData: any) => {
      performanceMonitoring.trackInteraction("create", "task");
      try {
        await createTask(taskData);
        setShowTaskForm(false);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to create task" };
      }
    },
    [createTask],
  );

  const handleEditTask = useCallback((task: TaskWithCategory) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const handleUpdateTask = useCallback(
    async (updates: any) => {
      if (!editingTask) return { success: false };
      try {
        await updateTask(editingTask.id, updates);
        setShowTaskForm(false);
        setEditingTask(null);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update task" };
      }
    },
    [editingTask, updateTask],
  );

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        await toggleTask(taskId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to toggle task" };
      }
    },
    [toggleTask],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete task" };
      }
    },
    [deleteTask],
  );

  const handleDuplicateTask = useCallback(
    async (taskId: string) => {
      try {
        const originalTask = tasksWithCategories.find((t) => t.id === taskId);
        if (!originalTask) throw new Error("Task not found");

        const duplicateData = {
          title: `${originalTask.title} (Copy)`,
          description: originalTask.description,
          priority: originalTask.priority,
          due_date: originalTask.due_date,
          category_id: originalTask.category_id,
          user_id: originalTask.user_id,
          is_completed: false,
          completed_at: null,
          sort_order: originalTask.sort_order ?? 0,
          deleted_at: null,
        };

        await createTask(duplicateData);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to duplicate task" };
      }
    },
    [tasksWithCategories, createTask],
  );

  const handleCreateCategory = useCallback(
    async (categoryData: any) => {
      const result = await createCategory(categoryData);
      if (result.success) setShowCategoryForm(false);
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

  // View metadata
  const viewMetadata = useMemo(() => {
    const metadata = {
      dashboard: { title: "Dashboard", description: "Welcome back! Here's your productivity overview." },
      kanban: { title: "Kanban Board", description: "Drag and drop tasks to update their status" },
      today: { title: "Today's Tasks", description: "Focus on what's due today" },
      upcoming: { title: "Upcoming Tasks", description: "Plan ahead with future tasks" },
      important: { title: "Important Tasks", description: "High priority items that need attention" },
      completed: { title: "Completed Tasks", description: "Review your accomplishments" },
      archive: { title: "Archived Tasks", description: "Previously deleted or archived items" },
      profile: { title: "Profile", description: "Manage your account and preferences" },
      categories: { title: "Categories", description: "Organize tasks with custom categories" },
    };
    return metadata[activeView as keyof typeof metadata] || metadata.dashboard;
  }, [activeView]);

  // Task form overlay with proper sidebar layout
  if (showTaskForm) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeView={activeView} onViewChange={setActiveView} />
          <SidebarInset className="flex-1">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="max-w-2xl mx-auto">
                  <LazyTaskForm
                    task={editingTask || null}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    onCancel={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
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
            <div className="p-4 space-y-4">
              {/* Compact Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{viewMetadata.title}</h1>
                  <p className="text-sm text-muted-foreground">{viewMetadata.description}</p>
                </div>
                {(activeView === "dashboard" ||
                  activeView === "kanban" ||
                  activeView === "today" ||
                  activeView === "upcoming" ||
                  activeView === "important") && (
                    <Button onClick={() => setShowTaskForm(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Button>
                  )}
              </div>

              {/* Dashboard View */}
              {activeView === "dashboard" && (
                <>
                  {/* Compact Stats Grid */}
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                      title="Total Tasks"
                      value={stats?.total || 0}
                      description="All your tasks across categories"
                      icon={CheckCircle}
                      loading={statsLoading}
                    />
                    <StatsCard
                      title="Completed"
                      value={stats?.completed || 0}
                      description={`${stats?.total ? Math.round(((stats?.completed || 0) / stats.total) * 100) : 0}% completion rate`}
                      icon={CheckCircle}
                      loading={statsLoading}
                    />
                    <StatsCard
                      title="Due Today"
                      value={stats?.today || 0}
                      description="Tasks requiring immediate attention"
                      icon={Calendar}
                      loading={statsLoading}
                    />
                    <StatsCard
                      title="Overdue"
                      value={stats?.overdue || 0}
                      description="Tasks that need urgent action"
                      icon={Clock}
                      loading={statsLoading}
                    />
                  </div>

                  {/* Profile and Progress Grid - 3:9 ratio */}
                  <div className="grid gap-4 grid-cols-12">
                    {/* User Profile Card - 3 columns */}
                    <div className="col-span-12 lg:col-span-3">
                      <div className="overflow-hidden">
                        <UserProfileCard />
                      </div>
                    </div>

                    {/* Progress Overview - 9 columns */}
                    <div className="col-span-12 lg:col-span-9 h-full">
                      <ProgressOverview stats={stats} loading={statsLoading} />
                    </div>
                  </div>

                  {/* Recent Tasks - Full Width */}
                  <div className="w-full">
                    <Card className="border-0 bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                          <CardTitle className="text-base">Recent Tasks</CardTitle>
                          <CardDescription className="text-xs">Your latest incomplete tasks</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowTaskForm(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Task
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <TaskList
                          tasks={displayTasks}
                          loading={allTasksLoading}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onDuplicate={handleDuplicateTask}
                          onRetry={refetchTasks}
                          emptyState={{
                            title: "No tasks yet",
                            description: "Create your first task to get started with TaskFlow.",
                            action: {
                              label: "Create Task",
                              onClick: () => setShowTaskForm(true),
                            },
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Kanban View */}
              {activeView === "kanban" && (
                <KanbanBoard />
              )}

              {/* Profile View */}
              {activeView === "profile" && (
                <div className="max-w-2xl mx-auto overflow-hidden">
                  <UserProfileCard />
                </div>
              )}

              {/* Categories View */}
              {activeView === "categories" && !showCategoryForm && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Categories</h2>
                      <p className="text-sm text-muted-foreground">Organize your tasks with custom categories</p>
                    </div>
                    <Button onClick={() => setShowCategoryForm(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New Category
                    </Button>
                  </div>
                  <LazyCategoryList
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
                  <LazyCategoryForm
                    category={editingCategory}
                    onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    onCancel={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                    }}
                  />
                </div>
              )}

              {/* Other Views with Filters */}
              {activeView !== "dashboard" && activeView !== "kanban" && activeView !== "profile" && activeView !== "categories" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <LazyTaskFilters
                      filters={taskFiltersState}
                      categories={categories}
                      onFiltersChange={setTaskFiltersState}
                    />
                  </div>

                  <TaskList
                    tasks={displayTasks}
                    loading={allTasksLoading}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateTask}
                    onRetry={refetchTasks}
                    emptyState={{
                      title: `No ${activeView} tasks`,
                      description: `You don't have any ${activeView} tasks yet.`,
                      action:
                        activeView !== "completed" && activeView !== "archive"
                          ? { label: "Create Task", onClick: () => setShowTaskForm(true) }
                          : undefined,
                    }}
                  />
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
